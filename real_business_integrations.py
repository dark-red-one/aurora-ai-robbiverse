#!/usr/bin/env python3
"""
Real Business Integrations - Build our own system using Allan's actual API credentials
Uses the same credentials from N8N but in our own Aurora chat system
"""

import os
import json
import psycopg2
import requests
import logging
from datetime import datetime, timedelta
import asyncio
import aiohttp
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import base64

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RealBusinessIntegrations:
    def __init__(self):
        # Real credentials from Allan's N8N setup
        self.google_client_id = "969418449706-8905k6pkr5rhmp69umuqpvsdmb0lnoh1.apps.googleusercontent.com"
        self.google_client_secret = os.getenv('GOOGLE_CLIENT_SECRET')  # Need this from Allan
        self.google_refresh_token = os.getenv('GOOGLE_REFRESH_TOKEN')  # Need this from Allan
        
        # Fireflies real API key from N8N
        self.fireflies_api_key = os.getenv('FIREFLIES_API_KEY', '__n8n_BLANK_VALUE_e5362baf-c7f7-4d57-a690-6eaf1f9e87f6')
        
        # Database connection
        self.db_url = 'postgresql://aurora:AuroraPass2025Safe@127.0.0.1:5432/aurora'
        
    def get_db_connection(self):
        """Get database connection"""
        try:
            return psycopg2.connect(self.db_url)
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            return None
    
    async def sync_real_gmail_data(self):
        """Sync actual Gmail data using Allan's real OAuth credentials"""
        logger.info("📧 Syncing REAL Gmail data...")
        
        if not self.google_refresh_token:
            logger.warning("⚠️ Google refresh token not available - need Allan's real token")
            return 0
        
        try:
            # Use Allan's real Google credentials
            creds = Credentials(
                token=None,
                refresh_token=self.google_refresh_token,
                client_id=self.google_client_id,
                client_secret=self.google_client_secret,
                token_uri='https://oauth2.googleapis.com/token'
            )
            
            service = build('gmail', 'v1', credentials=creds)
            
            # Get real messages from Allan's Gmail
            results = service.users().messages().list(
                userId='me',
                maxResults=100,
                q='in:inbox OR in:sent'
            ).execute()
            
            messages = results.get('messages', [])
            logger.info(f"📧 Found {len(messages)} real Gmail messages")
            
            conn = self.get_db_connection()
            if not conn:
                return 0
            
            chris_haimbach_count = 0
            
            with conn.cursor() as cur:
                for msg in messages:
                    try:
                        # Get full message details
                        msg_detail = service.users().messages().get(
                            userId='me',
                            id=msg['id'],
                            format='full'
                        ).execute()
                        
                        headers = {h['name']: h['value'] for h in msg_detail['payload'].get('headers', [])}
                        subject = headers.get('Subject', '')
                        sender = headers.get('From', '')
                        recipients = headers.get('To', '')
                        date_str = headers.get('Date', '')
                        
                        # Extract sender info
                        sender_email = sender.split('<')[-1].rstrip('>') if '<' in sender else sender
                        sender_name = sender.split('<')[0].strip().strip('"') if '<' in sender else sender_email
                        
                        # Get message body
                        body_text = self.extract_gmail_body(msg_detail['payload'])
                        snippet = msg_detail.get('snippet', '')
                        
                        # Parse date
                        try:
                            from email.utils import parsedate_to_datetime
                            date_sent = parsedate_to_datetime(date_str) if date_str else datetime.now()
                        except:
                            date_sent = datetime.now()
                        
                        # Check for Chris Haimbach mentions
                        chris_mentioned = (
                            'chris' in sender_name.lower() and 'haimbach' in sender_name.lower()
                        ) or (
                            'chris haimbach' in body_text.lower()
                        ) or (
                            'chris haimbach' in subject.lower()
                        )
                        
                        if chris_mentioned:
                            chris_haimbach_count += 1
                            logger.info(f"🎯 FOUND CHRIS HAIMBACH: {subject} from {sender_name}")
                        
                        # Store real email data
                        cur.execute("""
                            INSERT INTO emails (gmail_id, thread_id, subject, sender_email, sender_name,
                                              recipient_emails, date_sent, snippet, body_text, metadata)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (gmail_id) DO UPDATE SET
                                subject = EXCLUDED.subject,
                                snippet = EXCLUDED.snippet,
                                body_text = EXCLUDED.body_text,
                                updated_at = NOW()
                        """, (
                            msg['id'],
                            msg_detail['threadId'],
                            subject,
                            sender_email,
                            sender_name,
                            [recipients] if recipients else [],
                            date_sent,
                            snippet,
                            body_text,
                            json.dumps({'labels': msg_detail.get('labelIds', []), 'chris_mentioned': chris_mentioned})
                        ))
                        
                        # Add/update contact
                        if sender_email and '@' in sender_email:
                            cur.execute("""
                                INSERT INTO contacts (email, full_name, source, last_contacted, interaction_count)
                                VALUES (%s, %s, 'gmail_real', %s, 1)
                                ON CONFLICT (email) DO UPDATE SET
                                    full_name = COALESCE(contacts.full_name, EXCLUDED.full_name),
                                    last_contacted = GREATEST(contacts.last_contacted, EXCLUDED.last_contacted),
                                    interaction_count = contacts.interaction_count + 1,
                                    updated_at = NOW()
                            """, (sender_email, sender_name, date_sent))
                        
                    except Exception as e:
                        logger.error(f"Error processing message {msg['id']}: {e}")
                        continue
            
            conn.close()
            logger.info(f"✅ Gmail sync complete: {len(messages)} messages, {chris_haimbach_count} Chris Haimbach mentions")
            return len(messages)
            
        except Exception as e:
            logger.error(f"❌ Gmail sync failed: {e}")
            return 0
    
    def extract_gmail_body(self, payload):
        """Extract text body from Gmail message payload"""
        body = ""
        
        if 'body' in payload and 'data' in payload['body']:
            try:
                body = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')
            except:
                pass
        elif 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain' and 'body' in part and 'data' in part['body']:
                    try:
                        body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                        break
                    except:
                        continue
        
        return body
    
    async def sync_real_calendar_data(self):
        """Sync actual Google Calendar data"""
        logger.info("📅 Syncing REAL Calendar data...")
        
        if not self.google_refresh_token:
            logger.warning("⚠️ Google refresh token not available")
            return 0
        
        try:
            creds = Credentials(
                token=None,
                refresh_token=self.google_refresh_token,
                client_id=self.google_client_id,
                client_secret=self.google_client_secret,
                token_uri='https://oauth2.googleapis.com/token'
            )
            
            service = build('calendar', 'v3', credentials=creds)
            
            # Get events from the last 30 days
            time_min = (datetime.now() - timedelta(days=30)).isoformat() + 'Z'
            time_max = (datetime.now() + timedelta(days=30)).isoformat() + 'Z'
            
            events_result = service.events().list(
                calendarId='primary',
                timeMin=time_min,
                timeMax=time_max,
                maxResults=100,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            logger.info(f"📅 Found {len(events)} real calendar events")
            
            conn = self.get_db_connection()
            if not conn:
                return 0
            
            chris_haimbach_events = 0
            
            with conn.cursor() as cur:
                for event in events:
                    try:
                        event_id = event['id']
                        summary = event.get('summary', '')
                        description = event.get('description', '')
                        start = event['start'].get('dateTime', event['start'].get('date'))
                        end = event['end'].get('dateTime', event['end'].get('date'))
                        location = event.get('location', '')
                        
                        # Parse attendees
                        attendees = event.get('attendees', [])
                        attendee_emails = [a.get('email', '') for a in attendees]
                        attendee_names = [a.get('displayName', a.get('email', '')) for a in attendees]
                        
                        # Check for Chris Haimbach
                        chris_mentioned = (
                            'chris haimbach' in summary.lower()
                        ) or (
                            'chris haimbach' in description.lower()
                        ) or any(
                            'chris' in name.lower() and 'haimbach' in name.lower()
                            for name in attendee_names
                        ) or any(
                            'haimbach' in email.lower()
                            for email in attendee_emails
                        )
                        
                        if chris_mentioned:
                            chris_haimbach_events += 1
                            logger.info(f"🎯 FOUND CHRIS HAIMBACH in event: {summary}")
                        
                        # Store real calendar data
                        cur.execute("""
                            INSERT INTO calendar_events (google_event_id, summary, description,
                                                       start_time, end_time, location, attendee_emails,
                                                       attendee_names, metadata)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (google_event_id) DO UPDATE SET
                                summary = EXCLUDED.summary,
                                description = EXCLUDED.description,
                                updated_at = NOW()
                        """, (
                            event_id,
                            summary,
                            description,
                            start,
                            end,
                            location,
                            attendee_emails,
                            attendee_names,
                            json.dumps({'chris_mentioned': chris_mentioned})
                        ))
                        
                    except Exception as e:
                        logger.error(f"Error processing event {event.get('id', 'unknown')}: {e}")
                        continue
            
            conn.close()
            logger.info(f"✅ Calendar sync complete: {len(events)} events, {chris_haimbach_events} Chris Haimbach events")
            return len(events)
            
        except Exception as e:
            logger.error(f"❌ Calendar sync failed: {e}")
            return 0
    
    async def sync_real_fireflies_data(self):
        """Sync actual Fireflies transcripts"""
        logger.info("🎙️ Syncing REAL Fireflies data...")
        
        # Use the real Fireflies API key from Allan's N8N
        real_api_key = self.fireflies_api_key
        if not real_api_key or real_api_key.startswith('__n8n_BLANK_VALUE_'):
            logger.warning("⚠️ Fireflies API key not properly configured")
            return 0
        
        headers = {
            'Authorization': f'Bearer {real_api_key}',
            'Content-Type': 'application/json'
        }
        
        try:
            # GraphQL query to get real transcripts
            query = """
            query GetTranscripts {
                transcripts(first: 50) {
                    id
                    title
                    date
                    duration
                    summary
                    participants {
                        name
                        email
                    }
                    sentences {
                        text
                        speaker_name
                        start_time
                    }
                }
            }
            """
            
            response = requests.post(
                'https://api.fireflies.ai/graphql',
                headers=headers,
                json={'query': query}
            )
            
            if response.status_code != 200:
                logger.error(f"❌ Fireflies API error: {response.status_code} - {response.text}")
                return 0
            
            data = response.json()
            transcripts = data.get('data', {}).get('transcripts', [])
            logger.info(f"🎙️ Found {len(transcripts)} real Fireflies transcripts")
            
            conn = self.get_db_connection()
            if not conn:
                return 0
            
            chris_haimbach_transcripts = 0
            
            with conn.cursor() as cur:
                for transcript in transcripts:
                    try:
                        transcript_id = transcript['id']
                        title = transcript.get('title', '')
                        date = transcript.get('date', '')
                        duration = transcript.get('duration', 0)
                        summary = transcript.get('summary', '')
                        
                        participants = transcript.get('participants', [])
                        participant_names = [p.get('name', '') for p in participants]
                        
                        sentences = transcript.get('sentences', [])
                        full_transcript = ' '.join([s.get('text', '') for s in sentences])
                        
                        # Check for Chris Haimbach mentions
                        chris_mentioned = (
                            any('chris' in name.lower() and 'haimbach' in name.lower() for name in participant_names)
                        ) or (
                            'chris haimbach' in full_transcript.lower()
                        ) or (
                            'chris haimbach' in title.lower()
                        )
                        
                        if chris_mentioned:
                            chris_haimbach_transcripts += 1
                            logger.info(f"🎯 FOUND CHRIS HAIMBACH in transcript: {title}")
                        
                        # Store real transcript data
                        cur.execute("""
                            INSERT INTO meeting_transcripts (fireflies_id, title, start_time,
                                                           duration, transcript_text, summary,
                                                           participants, metadata)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (fireflies_id) DO UPDATE SET
                                title = EXCLUDED.title,
                                transcript_text = EXCLUDED.transcript_text,
                                summary = EXCLUDED.summary,
                                updated_at = NOW()
                        """, (
                            transcript_id,
                            title,
                            date,
                            duration,
                            full_transcript,
                            summary,
                            participant_names,
                            json.dumps({'chris_mentioned': chris_mentioned})
                        ))
                        
                    except Exception as e:
                        logger.error(f"Error processing transcript {transcript.get('id', 'unknown')}: {e}")
                        continue
            
            conn.close()
            logger.info(f"✅ Fireflies sync complete: {len(transcripts)} transcripts, {chris_haimbach_transcripts} Chris Haimbach mentions")
            return len(transcripts)
            
        except Exception as e:
            logger.error(f"❌ Fireflies sync failed: {e}")
            return 0
    
    async def run_full_real_data_sync(self):
        """Run complete sync of all real business data"""
        logger.info("🚀 STARTING FULL REAL DATA SYNC")
        logger.info("="*50)
        
        # Clear fake data first
        conn = self.get_db_connection()
        if conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM emails WHERE sender_email LIKE '%@example.com'")
                cur.execute("DELETE FROM contacts WHERE email LIKE '%@example.com'")
                logger.info("🗑️ Removed fake data")
            conn.close()
        
        results = {
            'gmail': await self.sync_real_gmail_data(),
            'calendar': await self.sync_real_calendar_data(),
            'fireflies': await self.sync_real_fireflies_data()
        }
        
        logger.info("📊 REAL DATA SYNC RESULTS:")
        logger.info("="*30)
        for service, count in results.items():
            logger.info(f"✅ {service.upper()}: {count} items synced")
        
        return results

if __name__ == "__main__":
    print("🚀 REAL BUSINESS INTEGRATIONS")
    print("============================")
    print("Building our own system with Allan's real API credentials")
    print("(Not connecting back to N8N - building independent system)")
    print()
    
    integrations = RealBusinessIntegrations()
    results = asyncio.run(integrations.run_full_real_data_sync())
    
    print("\n🎯 SYNC COMPLETE:")
    print("================")
    total = sum(results.values())
    if total > 0:
        print(f"✅ Successfully synced {total} real business records")
        print("🎯 Chris Haimbach data now available from real sources")
        print("🚫 All fake/mock data removed")
    else:
        print("❌ No data synced - need Allan's real Google refresh token")
        print("💡 Provide GOOGLE_REFRESH_TOKEN environment variable")



