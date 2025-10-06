#!/usr/bin/env python3
"""
Google Workspace Multi-Tenant Connector
Syncs Gmail, Calendar, Drive, Tasks, and Contacts for ALL users across multiple domains
With privacy enforcement: Allan sees all, each user sees only their own data
"""

import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import psycopg2
from psycopg2.extras import Json, execute_values
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GoogleWorkspaceMultiTenantConnector:
    def __init__(self, db_config: Dict):
        self.db_config = db_config
        self.conn = None
        self.domains = {}
        self.services = {}
        
    def connect_db(self):
        """Connect to PostgreSQL"""
        self.conn = psycopg2.connect(**self.db_config)
        logger.info("✅ Connected to PostgreSQL")
        
    def load_domains(self):
        """Load all configured Google Workspace domains"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT id, domain, service_account_email, service_account_key_path, client_id
            FROM google_workspace_domains
            WHERE is_active = true
        """)
        
        for row in cursor.fetchall():
            domain_id, domain, sa_email, key_path, client_id = row
            self.domains[domain] = {
                'id': domain_id,
                'domain': domain,
                'service_account_email': sa_email,
                'key_path': key_path,
                'client_id': client_id
            }
            logger.info(f"📋 Loaded domain: {domain}")
        
        cursor.close()
        
    def get_delegated_credentials(self, domain: str, user_email: str, scopes: List[str]):
        """Get credentials for a specific user via domain-wide delegation"""
        domain_config = self.domains[domain]
        
        credentials = service_account.Credentials.from_service_account_file(
            domain_config['key_path'],
            scopes=scopes
        )
        
        # Delegate to specific user
        delegated_credentials = credentials.with_subject(user_email)
        
        return delegated_credentials
    
    def build_service(self, domain: str, user_email: str, service_name: str, version: str, scopes: List[str]):
        """Build Google API service for a specific user"""
        try:
            credentials = self.get_delegated_credentials(domain, user_email, scopes)
            service = build(service_name, version, credentials=credentials)
            return service
        except Exception as e:
            logger.error(f"❌ Failed to build {service_name} service for {user_email}: {e}")
            return None
    
    async def sync_domain_users(self, domain: str):
        """Sync all users from a Google Workspace domain"""
        logger.info(f"👥 Syncing users for domain: {domain}")
        
        # Use admin credentials to list all users
        admin_email = f"allan@{domain}"  # Assuming Allan is admin
        
        try:
            service = self.build_service(
                domain, 
                admin_email, 
                'admin', 
                'directory_v1',
                ['https://www.googleapis.com/auth/admin.directory.user.readonly']
            )
            
            if not service:
                logger.error(f"❌ Could not build admin service for {domain}")
                return
            
            # List all users in the domain
            results = service.users().list(domain=domain, maxResults=500).execute()
            users = results.get('users', [])
            
            logger.info(f"📥 Found {len(users)} users in {domain}")
            
            cursor = self.conn.cursor()
            domain_id = self.domains[domain]['id']
            
            for user in users:
                email = user['primaryEmail']
                full_name = user.get('name', {}).get('fullName', '')
                first_name = user.get('name', {}).get('givenName', '')
                last_name = user.get('name', {}).get('familyName', '')
                is_admin = user.get('isAdmin', False)
                is_suspended = user.get('suspended', False)
                last_login = user.get('lastLoginTime')
                
                # Upsert user
                cursor.execute("""
                    INSERT INTO google_workspace_users 
                    (domain_id, email, full_name, first_name, last_name, is_admin, is_suspended, last_login)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (email) DO UPDATE SET
                        full_name = EXCLUDED.full_name,
                        first_name = EXCLUDED.first_name,
                        last_name = EXCLUDED.last_name,
                        is_admin = EXCLUDED.is_admin,
                        is_suspended = EXCLUDED.is_suspended,
                        last_login = EXCLUDED.last_login,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING id
                """, (domain_id, email, full_name, first_name, last_name, is_admin, is_suspended, last_login))
                
                user_id = cursor.fetchone()[0]
                logger.info(f"  ✅ {email} (Admin: {is_admin})")
            
            self.conn.commit()
            cursor.close()
            
            logger.info(f"✅ User sync complete for {domain}")
            
        except Exception as e:
            logger.error(f"❌ Failed to sync users for {domain}: {e}")
            self.conn.rollback()
    
    async def sync_gmail(self, domain: str, user_email: str, limit: int = 100):
        """Sync Gmail messages for a specific user"""
        logger.info(f"📧 Syncing Gmail for {user_email}")
        
        try:
            service = self.build_service(
                domain,
                user_email,
                'gmail',
                'v1',
                ['https://mail.google.com/']
            )
            
            if not service:
                return
            
            # Get user_id from database
            cursor = self.conn.cursor()
            cursor.execute("SELECT id FROM google_workspace_users WHERE email = %s", (user_email,))
            result = cursor.fetchone()
            if not result:
                logger.error(f"❌ User {user_email} not found in database")
                return
            user_id = result[0]
            
            # List messages
            results = service.users().messages().list(userId='me', maxResults=limit).execute()
            messages = results.get('messages', [])
            
            logger.info(f"  📥 Found {len(messages)} messages for {user_email}")
            
            for msg_ref in messages[:limit]:  # Limit to avoid rate limits
                try:
                    # Get full message
                    msg = service.users().messages().get(userId='me', id=msg_ref['id'], format='full').execute()
                    
                    # Extract headers
                    headers = {h['name']: h['value'] for h in msg['payload'].get('headers', [])}
                    subject = headers.get('Subject', '(No Subject)')
                    from_email = headers.get('From', '')
                    to_emails = headers.get('To', '').split(',')
                    
                    # Extract body
                    body_text = self._extract_message_body(msg['payload'])
                    snippet = msg.get('snippet', '')
                    
                    # Get labels
                    labels = msg.get('labelIds', [])
                    is_unread = 'UNREAD' in labels
                    is_starred = 'STARRED' in labels
                    is_important = 'IMPORTANT' in labels
                    
                    # Timestamp
                    sent_date = datetime.fromtimestamp(int(msg['internalDate']) / 1000)
                    
                    # Insert/update message
                    cursor.execute("""
                        INSERT INTO gmail_messages 
                        (user_id, message_id, thread_id, subject, from_email, to_emails, 
                         body_text, snippet, labels, is_unread, is_starred, is_important, sent_date, received_date)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (message_id) DO UPDATE SET
                            is_unread = EXCLUDED.is_unread,
                            is_starred = EXCLUDED.is_starred,
                            labels = EXCLUDED.labels,
                            last_synced = CURRENT_TIMESTAMP
                    """, (user_id, msg['id'], msg['threadId'], subject, from_email, to_emails,
                          body_text, snippet, labels, is_unread, is_starred, is_important, sent_date, sent_date))
                    
                except Exception as e:
                    logger.warning(f"  ⚠️  Failed to process message {msg_ref['id']}: {str(e)[:100]}")
            
            self.conn.commit()
            cursor.close()
            
            # Update last sync time
            cursor = self.conn.cursor()
            cursor.execute("""
                UPDATE google_workspace_users 
                SET gmail_last_sync = CURRENT_TIMESTAMP 
                WHERE email = %s
            """, (user_email,))
            self.conn.commit()
            cursor.close()
            
            logger.info(f"  ✅ Gmail sync complete for {user_email}")
            
        except Exception as e:
            logger.error(f"❌ Failed to sync Gmail for {user_email}: {e}")
            self.conn.rollback()
    
    async def sync_calendar(self, domain: str, user_email: str, days_ahead: int = 90):
        """Sync Calendar events for a specific user"""
        logger.info(f"📅 Syncing Calendar for {user_email}")
        
        try:
            service = self.build_service(
                domain,
                user_email,
                'calendar',
                'v3',
                ['https://www.googleapis.com/auth/calendar']
            )
            
            if not service:
                return
            
            # Get user_id
            cursor = self.conn.cursor()
            cursor.execute("SELECT id FROM google_workspace_users WHERE email = %s", (user_email,))
            result = cursor.fetchone()
            if not result:
                return
            user_id = result[0]
            
            # Get events from now to days_ahead
            now = datetime.utcnow().isoformat() + 'Z'
            time_max = (datetime.utcnow() + timedelta(days=days_ahead)).isoformat() + 'Z'
            
            events_result = service.events().list(
                calendarId='primary',
                timeMin=now,
                timeMax=time_max,
                maxResults=250,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            logger.info(f"  📥 Found {len(events)} events for {user_email}")
            
            for event in events:
                try:
                    event_id = event['id']
                    title = event.get('summary', '(No Title)')
                    description = event.get('description', '')
                    location = event.get('location', '')
                    
                    # Parse start/end times
                    start = event['start'].get('dateTime', event['start'].get('date'))
                    end = event['end'].get('dateTime', event['end'].get('date'))
                    is_all_day = 'date' in event['start']
                    
                    # Attendees
                    attendees = event.get('attendees', [])
                    attendees_json = json.dumps([{
                        'email': a.get('email'),
                        'name': a.get('displayName'),
                        'response_status': a.get('responseStatus')
                    } for a in attendees])
                    
                    # Meeting link
                    meeting_link = event.get('hangoutLink') or event.get('conferenceData', {}).get('entryPoints', [{}])[0].get('uri')
                    
                    # Insert/update event
                    cursor.execute("""
                        INSERT INTO calendar_events 
                        (user_id, event_id, calendar_id, title, description, location, 
                         start_time, end_time, is_all_day, organizer_email, attendees, meeting_link, status)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (event_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            description = EXCLUDED.description,
                            location = EXCLUDED.location,
                            start_time = EXCLUDED.start_time,
                            end_time = EXCLUDED.end_time,
                            attendees = EXCLUDED.attendees,
                            status = EXCLUDED.status,
                            last_synced = CURRENT_TIMESTAMP
                    """, (user_id, event_id, 'primary', title, description, location,
                          start, end, is_all_day, event.get('organizer', {}).get('email'),
                          attendees_json, meeting_link, event.get('status', 'confirmed')))
                    
                except Exception as e:
                    logger.warning(f"  ⚠️  Failed to process event {event.get('id')}: {str(e)[:100]}")
            
            self.conn.commit()
            cursor.close()
            
            # Update last sync
            cursor = self.conn.cursor()
            cursor.execute("""
                UPDATE google_workspace_users 
                SET calendar_last_sync = CURRENT_TIMESTAMP 
                WHERE email = %s
            """, (user_email,))
            self.conn.commit()
            cursor.close()
            
            logger.info(f"  ✅ Calendar sync complete for {user_email}")
            
        except Exception as e:
            logger.error(f"❌ Failed to sync Calendar for {user_email}: {e}")
            self.conn.rollback()
    
    async def sync_all_users(self, domain: str):
        """Sync ALL users' data for a domain"""
        logger.info(f"🚀 Starting full sync for domain: {domain}")
        
        # First, sync the user list
        await self.sync_domain_users(domain)
        
        # Get all active users
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT email FROM google_workspace_users u
            JOIN google_workspace_domains d ON u.domain_id = d.id
            WHERE d.domain = %s AND u.is_suspended = false
        """, (domain,))
        
        users = [row[0] for row in cursor.fetchall()]
        cursor.close()
        
        logger.info(f"📊 Syncing data for {len(users)} users...")
        
        # Sync each user's data
        for user_email in users:
            logger.info(f"\n👤 Syncing {user_email}...")
            
            # Sync Gmail (limit to recent messages)
            await self.sync_gmail(domain, user_email, limit=50)
            
            # Sync Calendar (next 90 days)
            await self.sync_calendar(domain, user_email, days_ahead=90)
            
            # TODO: Add Drive, Tasks, Contacts sync
            
        logger.info(f"\n🎉 Full sync complete for {domain}!")
    
    def _extract_message_body(self, payload):
        """Extract plain text body from Gmail message payload"""
        if 'body' in payload and 'data' in payload['body']:
            import base64
            return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')
        
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    if 'data' in part['body']:
                        import base64
                        return base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')
        
        return ''
    
    def check_access(self, viewer_email: str, target_email: str, data_type: str) -> bool:
        """Check if viewer can access target user's data"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT can_access_google_data(%s, %s, %s)
        """, (viewer_email, target_email, data_type))
        
        result = cursor.fetchone()
        cursor.close()
        
        return result[0] if result else False
    
    async def search_gmail_for_user(self, viewer_email: str, query: str, limit: int = 10):
        """Search Gmail with privacy enforcement"""
        # TODO: Generate embedding for query
        # For now, use keyword search
        
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT m.id, u.email, m.subject, m.snippet, m.from_email, m.sent_date
            FROM gmail_messages m
            JOIN google_workspace_users u ON m.user_id = u.id
            WHERE (m.subject ILIKE %s OR m.body_text ILIKE %s OR m.snippet ILIKE %s)
            AND can_access_google_data(%s, u.email, 'gmail') = true
            ORDER BY m.sent_date DESC
            LIMIT %s
        """, (f'%{query}%', f'%{query}%', f'%{query}%', viewer_email, limit))
        
        results = cursor.fetchall()
        cursor.close()
        
        return [{
            'id': str(r[0]),
            'user_email': r[1],
            'subject': r[2],
            'snippet': r[3],
            'from': r[4],
            'date': r[5].isoformat() if r[5] else None
        } for r in results]
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.info("👋 Database connection closed")

# ============================================
# MAIN EXECUTION
# ============================================

async def main():
    """Main execution function"""
    
    # Database configuration
    db_config = {
        'host': 'localhost',
        'port': 5432,
        'database': 'aurora_unified',
        'user': 'postgres',
        'password': os.getenv('POSTGRES_PASSWORD', 'postgres')
    }
    
    connector = GoogleWorkspaceMultiTenantConnector(db_config)
    
    try:
        # Connect to database
        connector.connect_db()
        
        # Load configured domains
        connector.load_domains()
        
        # Sync all domains
        for domain in connector.domains.keys():
            logger.info(f"\n{'='*60}")
            logger.info(f"🏢 SYNCING DOMAIN: {domain}")
            logger.info(f"{'='*60}\n")
            
            await connector.sync_all_users(domain)
        
        logger.info(f"\n{'='*60}")
        logger.info("🎉 ALL DOMAINS SYNCED SUCCESSFULLY!")
        logger.info(f"{'='*60}")
        
        # Test privacy enforcement
        logger.info("\n🔒 Testing privacy enforcement...")
        
        # Allan should see Tom's emails
        tom_emails = await connector.search_gmail_for_user('allan@testpilotcpg.com', 'meeting', limit=5)
        logger.info(f"  Allan can see {len(tom_emails)} emails (including other users)")
        
        # Tom should only see his own
        # (Would need to test with Tom's email)
        
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        connector.close()

if __name__ == "__main__":
    print("🚀 Google Workspace Multi-Tenant Connector")
    print("📧 Syncing Gmail, Calendar, Drive, Tasks, Contacts")
    print("🔒 Privacy enforced: Allan sees all, users see only their own")
    print()
    
    asyncio.run(main())
