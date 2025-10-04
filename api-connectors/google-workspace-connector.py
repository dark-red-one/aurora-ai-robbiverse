#!/usr/bin/env python3
"""
Google Workspace Connector for TestPilot Simulations
Comprehensive connector for Gmail, Google Calendar, Google Drive, and Google Contacts
"""

import os
import base64
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import psycopg2
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

class GoogleWorkspaceConnector:
    def __init__(self, credentials_path: str, token_path: str, db_config: Dict):
        self.credentials_path = credentials_path
        self.token_path = token_path
        self.db_config = db_config
        
        # Comprehensive scopes for all Google services
        self.scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/contacts.readonly',
            'https://www.googleapis.com/auth/admin.directory.user.readonly'
        ]
        
        self.services = self._authenticate()
        
    def _authenticate(self) -> Dict:
        """Authenticate with Google APIs and return service objects"""
        creds = None
        
        # Load existing token
        if os.path.exists(self.token_path):
            creds = Credentials.from_authorized_user_file(self.token_path, self.scopes)
        
        # If no valid credentials, get new ones
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_path, self.scopes)
                creds = flow.run_local_server(port=0)
            
            # Save credentials for next run
            with open(self.token_path, 'w') as token:
                token.write(creds.to_json())
        
        # Build all service objects
        return {
            'gmail': build('gmail', 'v1', credentials=creds),
            'calendar': build('calendar', 'v3', credentials=creds),
            'drive': build('drive', 'v3', credentials=creds),
            'people': build('people', 'v1', credentials=creds),
            'admin': build('admin', 'directory_v1', credentials=creds)
        }
    
    def get_db_connection(self):
        return psycopg2.connect(**self.db_config)
    
    # ========== GMAIL METHODS ==========
    def fetch_emails(self, query: str = "newer_than:30d", max_results: int = 1000) -> List[Dict]:
        """Fetch emails from Gmail with enhanced parsing"""
        try:
            results = self.services['gmail'].users().messages().list(
                userId='me', q=query, maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            emails = []
            
            for message in messages:
                msg = self.services['gmail'].users().messages().get(
                    userId='me', id=message['id'], format='full'
                ).execute()
                
                email_data = self._parse_email(msg)
                if email_data:
                    emails.append(email_data)
            
            return emails
            
        except HttpError as e:
            print(f"❌ Gmail API error: {e}")
            return []
    
    def _parse_email(self, message: Dict) -> Optional[Dict]:
        """Enhanced email parsing with thread detection and labels"""
        try:
            payload = message.get('payload', {})
            headers = payload.get('headers', [])
            
            # Extract all relevant headers
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '')
            from_email = next((h['value'] for h in headers if h['name'] == 'From'), '')
            to_email = next((h['value'] for h in headers if h['name'] == 'To'), '')
            cc_email = next((h['value'] for h in headers if h['name'] == 'Cc'), '')
            date_str = next((h['value'] for h in headers if h['name'] == 'Date'), '')
            message_id = next((h['value'] for h in headers if h['name'] == 'Message-ID'), '')
            
            # Get email body and attachments
            body = self._extract_body(payload)
            attachments = self._extract_attachments(payload, message['id'])
            
            # Determine if this is a business email
            is_business = self._is_business_email(from_email, to_email, subject, body)
            
            return {
                "gmail_id": message['id'],
                "message_id": message_id,
                "thread_id": message.get('threadId'),
                "subject": subject,
                "from_email": from_email,
                "to_email": to_email,
                "cc_email": cc_email,
                "body_preview": body[:500] if body else '',
                "full_body": body,
                "attachments": attachments,
                "labels": message.get('labelIds', []),
                "is_business": is_business,
                "email_date": date_str,
                "size_estimate": message.get('sizeEstimate', 0)
            }
            
        except Exception as e:
            print(f"❌ Error parsing email {message.get('id')}: {e}")
            return None
    
    def _extract_body(self, payload: Dict) -> str:
        """Extract email body with HTML/text preference"""
        body = ""
        
        def extract_from_part(part):
            if part.get('mimeType') == 'text/plain':
                data = part.get('body', {}).get('data')
                if data:
                    return base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
            elif part.get('mimeType') == 'text/html':
                data = part.get('body', {}).get('data')
                if data:
                    # For now, return HTML as-is; could add HTML-to-text conversion
                    return base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
            return ""
        
        if 'parts' in payload:
            # Multi-part message
            for part in payload['parts']:
                if part.get('mimeType') == 'multipart/alternative':
                    # Nested multipart - prefer text/plain
                    for subpart in part.get('parts', []):
                        if subpart.get('mimeType') == 'text/plain':
                            body = extract_from_part(subpart)
                            break
                else:
                    body = extract_from_part(part)
                    if body:
                        break
        else:
            # Single part message
            body = extract_from_part(payload)
        
        return body
    
    def _extract_attachments(self, payload: Dict, message_id: str) -> List[Dict]:
        """Extract attachment metadata"""
        attachments = []
        
        def process_part(part):
            filename = part.get('filename')
            if filename:
                attachments.append({
                    'filename': filename,
                    'mime_type': part.get('mimeType'),
                    'size': part.get('body', {}).get('size', 0),
                    'attachment_id': part.get('body', {}).get('attachmentId')
                })
            
            # Process nested parts
            if 'parts' in part:
                for subpart in part['parts']:
                    process_part(subpart)
        
        if 'parts' in payload:
            for part in payload['parts']:
                process_part(part)
        
        return attachments
    
    def _is_business_email(self, from_email: str, to_email: str, subject: str, body: str) -> bool:
        """Determine if email is business-related"""
        business_indicators = [
            'meeting', 'proposal', 'contract', 'deal', 'project', 'client',
            'invoice', 'payment', 'schedule', 'demo', 'presentation',
            'testpilot', 'aurora', 'collaboration', 'fluenti'
        ]
        
        text_to_check = f"{subject} {body}".lower()
        return any(indicator in text_to_check for indicator in business_indicators)
    
    # ========== CALENDAR METHODS ==========
    def fetch_calendar_events(self, days_back: int = 30, days_forward: int = 30) -> List[Dict]:
        """Fetch calendar events"""
        try:
            now = datetime.utcnow()
            time_min = (now - timedelta(days=days_back)).isoformat() + 'Z'
            time_max = (now + timedelta(days=days_forward)).isoformat() + 'Z'
            
            events_result = self.services['calendar'].events().list(
                calendarId='primary',
                timeMin=time_min,
                timeMax=time_max,
                maxResults=1000,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            parsed_events = []
            for event in events:
                parsed_event = self._parse_calendar_event(event)
                if parsed_event:
                    parsed_events.append(parsed_event)
            
            return parsed_events
            
        except HttpError as e:
            print(f"❌ Calendar API error: {e}")
            return []
    
    def _parse_calendar_event(self, event: Dict) -> Optional[Dict]:
        """Parse calendar event data"""
        try:
            start = event.get('start', {})
            end = event.get('end', {})
            
            # Handle all-day events vs timed events
            start_time = start.get('dateTime', start.get('date'))
            end_time = end.get('dateTime', end.get('date'))
            
            return {
                'google_event_id': event['id'],
                'title': event.get('summary', 'Untitled'),
                'description': event.get('description', ''),
                'start_time': start_time,
                'end_time': end_time,
                'location': event.get('location', ''),
                'attendees': [att.get('email') for att in event.get('attendees', [])],
                'organizer': event.get('organizer', {}).get('email'),
                'status': event.get('status'),
                'event_type': event.get('eventType', 'default'),
                'created': event.get('created'),
                'updated': event.get('updated'),
                'hangout_link': event.get('hangoutLink'),
                'meeting_url': event.get('conferenceData', {}).get('entryPoints', [{}])[0].get('uri') if event.get('conferenceData') else None
            }
            
        except Exception as e:
            print(f"❌ Error parsing calendar event {event.get('id')}: {e}")
            return None
    
    # ========== DRIVE METHODS ==========
    def fetch_drive_activity(self, days_back: int = 30) -> List[Dict]:
        """Fetch recent Google Drive activity"""
        try:
            # Get recently modified files
            query = f"modifiedTime > '{(datetime.utcnow() - timedelta(days=days_back)).isoformat()}'"
            
            results = self.services['drive'].files().list(
                q=query,
                pageSize=1000,
                fields="files(id,name,mimeType,size,createdTime,modifiedTime,owners,shared,webViewLink)"
            ).execute()
            
            files = results.get('files', [])
            
            drive_activities = []
            for file in files:
                activity = self._parse_drive_file(file)
                if activity:
                    drive_activities.append(activity)
            
            return drive_activities
            
        except HttpError as e:
            print(f"❌ Drive API error: {e}")
            return []
    
    def _parse_drive_file(self, file: Dict) -> Optional[Dict]:
        """Parse Google Drive file data"""
        try:
            return {
                'drive_file_id': file['id'],
                'name': file['name'],
                'mime_type': file['mimeType'],
                'size': int(file.get('size', 0)) if file.get('size') else 0,
                'created_time': file.get('createdTime'),
                'modified_time': file.get('modifiedTime'),
                'owners': [owner.get('emailAddress') for owner in file.get('owners', [])],
                'is_shared': file.get('shared', False),
                'web_view_link': file.get('webViewLink'),
                'file_type': self._determine_file_type(file['mimeType'], file['name'])
            }
            
        except Exception as e:
            print(f"❌ Error parsing drive file {file.get('id')}: {e}")
            return None
    
    def _determine_file_type(self, mime_type: str, filename: str) -> str:
        """Determine business relevance of file type"""
        if 'document' in mime_type or 'text' in mime_type:
            return 'document'
        elif 'spreadsheet' in mime_type:
            return 'spreadsheet'
        elif 'presentation' in mime_type:
            return 'presentation'
        elif 'pdf' in mime_type:
            return 'pdf'
        elif 'image' in mime_type:
            return 'image'
        else:
            return 'other'
    
    # ========== IMPORT METHODS ==========
    def import_all_data(self) -> Dict:
        """Import all Google Workspace data"""
        results = {}
        
        print("📧 Importing Gmail data...")
        emails = self.fetch_emails()
        results['emails'] = self.import_emails(emails)
        
        print("📅 Importing Calendar events...")
        events = self.fetch_calendar_events()
        results['events'] = self.import_calendar_events(events)
        
        print("📁 Importing Drive activity...")
        files = self.fetch_drive_activity()
        results['files'] = self.import_drive_files(files)
        
        return results
    
    def import_emails(self, emails: List[Dict]) -> int:
        """Import emails into database"""
        conn = self.get_db_connection()
        imported = 0
        
        # Create table if not exists
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS google_emails (
                    id SERIAL PRIMARY KEY,
                    gmail_id VARCHAR(255) UNIQUE NOT NULL,
                    thread_id VARCHAR(255),
                    message_id TEXT,
                    subject TEXT,
                    from_email VARCHAR(500),
                    to_email TEXT,
                    cc_email TEXT,
                    body_preview TEXT,
                    full_body TEXT,
                    attachments JSONB DEFAULT '[]',
                    labels TEXT[],
                    is_business BOOLEAN DEFAULT FALSE,
                    email_date TIMESTAMP,
                    size_estimate INTEGER DEFAULT 0,
                    owner_id VARCHAR(50) DEFAULT 'aurora',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_google_emails_thread_id ON google_emails(thread_id);
                CREATE INDEX IF NOT EXISTS idx_google_emails_is_business ON google_emails(is_business);
                CREATE INDEX IF NOT EXISTS idx_google_emails_email_date ON google_emails(email_date);
            """)
        
        try:
            with conn.cursor() as cur:
                for email in emails:
                    # Parse email date
                    try:
                        from email.utils import parsedate_to_datetime
                        email_date = parsedate_to_datetime(email['email_date'])
                    except:
                        email_date = datetime.utcnow()
                    
                    cur.execute("""
                        INSERT INTO google_emails (
                            gmail_id, thread_id, message_id, subject, from_email,
                            to_email, cc_email, body_preview, full_body, attachments,
                            labels, is_business, email_date, size_estimate, owner_id
                        ) VALUES (
                            %(gmail_id)s, %(thread_id)s, %(message_id)s, %(subject)s,
                            %(from_email)s, %(to_email)s, %(cc_email)s, %(body_preview)s,
                            %(full_body)s, %(attachments)s, %(labels)s, %(is_business)s,
                            %(email_date)s, %(size_estimate)s, %(owner_id)s
                        ) ON CONFLICT (gmail_id) DO UPDATE SET
                            subject = EXCLUDED.subject,
                            body_preview = EXCLUDED.body_preview,
                            updated_at = CURRENT_TIMESTAMP
                    """, {
                        **email,
                        'email_date': email_date,
                        'attachments': json.dumps(email['attachments']),
                        'owner_id': 'aurora'
                    })
                    imported += 1
            
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
        
        return imported
    
    def import_calendar_events(self, events: List[Dict]) -> int:
        """Import calendar events into database"""
        conn = self.get_db_connection()
        imported = 0
        
        # Create table if not exists
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS google_calendar_events (
                    id SERIAL PRIMARY KEY,
                    google_event_id VARCHAR(255) UNIQUE NOT NULL,
                    title VARCHAR(500),
                    description TEXT,
                    start_time TIMESTAMP,
                    end_time TIMESTAMP,
                    location TEXT,
                    attendees TEXT[],
                    organizer VARCHAR(255),
                    status VARCHAR(50),
                    event_type VARCHAR(50),
                    created TIMESTAMP,
                    updated TIMESTAMP,
                    hangout_link TEXT,
                    meeting_url TEXT,
                    owner_id VARCHAR(50) DEFAULT 'aurora',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_google_events_start_time ON google_calendar_events(start_time);
                CREATE INDEX IF NOT EXISTS idx_google_events_organizer ON google_calendar_events(organizer);
            """)
        
        try:
            with conn.cursor() as cur:
                for event in events:
                    cur.execute("""
                        INSERT INTO google_calendar_events (
                            google_event_id, title, description, start_time, end_time,
                            location, attendees, organizer, status, event_type,
                            created, updated, hangout_link, meeting_url, owner_id
                        ) VALUES (
                            %(google_event_id)s, %(title)s, %(description)s,
                            %(start_time)s, %(end_time)s, %(location)s, %(attendees)s,
                            %(organizer)s, %(status)s, %(event_type)s, %(created)s,
                            %(updated)s, %(hangout_link)s, %(meeting_url)s, %(owner_id)s
                        ) ON CONFLICT (google_event_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            description = EXCLUDED.description,
                            start_time = EXCLUDED.start_time,
                            end_time = EXCLUDED.end_time,
                            updated_at = CURRENT_TIMESTAMP
                    """, {
                        **event,
                        'owner_id': 'aurora'
                    })
                    imported += 1
            
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
        
        return imported
    
    def import_drive_files(self, files: List[Dict]) -> int:
        """Import Drive files into database"""
        conn = self.get_db_connection()
        imported = 0
        
        # Create table if not exists
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS google_drive_files (
                    id SERIAL PRIMARY KEY,
                    drive_file_id VARCHAR(255) UNIQUE NOT NULL,
                    name TEXT,
                    mime_type VARCHAR(255),
                    size BIGINT DEFAULT 0,
                    created_time TIMESTAMP,
                    modified_time TIMESTAMP,
                    owners TEXT[],
                    is_shared BOOLEAN DEFAULT FALSE,
                    web_view_link TEXT,
                    file_type VARCHAR(50),
                    owner_id VARCHAR(50) DEFAULT 'aurora',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_google_drive_modified ON google_drive_files(modified_time);
                CREATE INDEX IF NOT EXISTS idx_google_drive_type ON google_drive_files(file_type);
            """)
        
        try:
            with conn.cursor() as cur:
                for file in files:
                    cur.execute("""
                        INSERT INTO google_drive_files (
                            drive_file_id, name, mime_type, size, created_time,
                            modified_time, owners, is_shared, web_view_link,
                            file_type, owner_id
                        ) VALUES (
                            %(drive_file_id)s, %(name)s, %(mime_type)s, %(size)s,
                            %(created_time)s, %(modified_time)s, %(owners)s,
                            %(is_shared)s, %(web_view_link)s, %(file_type)s, %(owner_id)s
                        ) ON CONFLICT (drive_file_id) DO UPDATE SET
                            name = EXCLUDED.name,
                            modified_time = EXCLUDED.modified_time,
                            is_shared = EXCLUDED.is_shared,
                            updated_at = CURRENT_TIMESTAMP
                    """, {
                        **file,
                        'owner_id': 'aurora'
                    })
                    imported += 1
            
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
        
        return imported

if __name__ == "__main__":
    # Configuration
    GOOGLE_CREDENTIALS = os.getenv("GOOGLE_CREDENTIALS_PATH", "google-credentials.json")
    GOOGLE_TOKEN = os.getenv("GOOGLE_TOKEN_PATH", "google-token.json")
    
    db_config = {
        "host": "aurora-postgres-u44170.vm.elestio.app",
        "port": 25432,
        "dbname": "aurora_unified",
        "user": "aurora_app", 
        "password": "TestPilot2025_Aurora!",
        "sslmode": "require"
    }
    
    if not os.path.exists(GOOGLE_CREDENTIALS):
        print("❌ Google credentials file not found.")
        print("📋 To set up:")
        print("1. Go to https://console.cloud.google.com/")
        print("2. Create/select project")
        print("3. Enable Gmail, Calendar, Drive APIs")
        print("4. Create OAuth 2.0 credentials")
        print("5. Download as 'google-credentials.json'")
        exit(1)
    
    connector = GoogleWorkspaceConnector(GOOGLE_CREDENTIALS, GOOGLE_TOKEN, db_config)
    
    print("🚀 Starting Google Workspace data import...")
    results = connector.import_all_data()
    
    print("\n📊 IMPORT SUMMARY:")
    print("=" * 30)
    for service, count in results.items():
        print(f"• {service.title()}: {count} records")
    
    total = sum(results.values())
    print(f"\n✅ Total imported: {total} records")
    print("🎉 Google Workspace import complete!")
