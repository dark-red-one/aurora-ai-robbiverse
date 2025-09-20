#!/usr/bin/env python3
"""
Gmail API Connector for TestPilot Simulations
Pulls email data and creates activities in Aurora-Postgres
"""

import os
import base64
import email
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import psycopg2
import json
from datetime import datetime
from typing import Dict, List, Optional

class GmailConnector:
    def __init__(self, credentials_path: str, token_path: str, db_config: Dict):
        self.credentials_path = credentials_path
        self.token_path = token_path
        self.db_config = db_config
        self.scopes = ['https://www.googleapis.com/auth/gmail.readonly']
        self.service = self._authenticate()
        
    def _authenticate(self):
        """Authenticate with Gmail API"""
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
        
        return build('gmail', 'v1', credentials=creds)
    
    def get_db_connection(self):
        return psycopg2.connect(**self.db_config)
    
    def fetch_emails(self, query: str = "in:sent OR in:inbox", max_results: int = 1000) -> List[Dict]:
        """Fetch emails from Gmail"""
        try:
            # Search for messages
            results = self.service.users().messages().list(
                userId='me', q=query, maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            emails = []
            
            for message in messages:
                # Get full message details
                msg = self.service.users().messages().get(
                    userId='me', id=message['id'], format='full'
                ).execute()
                
                # Parse email data
                email_data = self._parse_email(msg)
                if email_data:
                    emails.append(email_data)
            
            return emails
            
        except Exception as e:
            print(f"❌ Error fetching emails: {e}")
            return []
    
    def _parse_email(self, message: Dict) -> Optional[Dict]:
        """Parse Gmail message into structured data"""
        try:
            payload = message.get('payload', {})
            headers = payload.get('headers', [])
            
            # Extract headers
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '')
            from_email = next((h['value'] for h in headers if h['name'] == 'From'), '')
            to_email = next((h['value'] for h in headers if h['name'] == 'To'), '')
            date_str = next((h['value'] for h in headers if h['name'] == 'Date'), '')
            
            # Get email body
            body = self._extract_body(payload)
            
            # Determine direction
            direction = 'outbound' if 'allan@testpilot.ai' in from_email else 'inbound'
            
            return {
                "gmail_id": message['id'],
                "subject": subject,
                "from_email": from_email,
                "to_email": to_email,
                "body_preview": body[:500] if body else '',
                "full_body": body,
                "direction": direction,
                "email_date": date_str,
                "thread_id": message.get('threadId'),
                "labels": message.get('labelIds', [])
            }
            
        except Exception as e:
            print(f"❌ Error parsing email {message.get('id')}: {e}")
            return None
    
    def _extract_body(self, payload: Dict) -> str:
        """Extract email body from Gmail payload"""
        body = ""
        
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    data = part['body'].get('data')
                    if data:
                        body = base64.urlsafe_b64decode(data).decode('utf-8')
                        break
        else:
            if payload['mimeType'] == 'text/plain':
                data = payload['body'].get('data')
                if data:
                    body = base64.urlsafe_b64decode(data).decode('utf-8')
        
        return body
    
    def import_emails_as_activities(self, emails: List[Dict]) -> int:
        """Import emails as activities into Aurora-Postgres"""
        conn = self.get_db_connection()
        imported = 0
        
        # Create email_activities table if not exists
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS email_activities (
                    id SERIAL PRIMARY KEY,
                    gmail_id VARCHAR(255) UNIQUE NOT NULL,
                    activity_type VARCHAR(50) DEFAULT 'email',
                    subject TEXT,
                    from_email VARCHAR(255),
                    to_email VARCHAR(255),
                    body_preview TEXT,
                    full_body TEXT,
                    direction VARCHAR(20),
                    email_date TIMESTAMP,
                    thread_id VARCHAR(255),
                    labels TEXT[],
                    owner_id VARCHAR(50) DEFAULT 'aurora',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
        
        try:
            with conn.cursor() as cur:
                for email_data in emails:
                    # Parse date
                    try:
                        email_date = datetime.strptime(
                            email_data['email_date'], 
                            '%a, %d %b %Y %H:%M:%S %z'
                        )
                    except:
                        email_date = datetime.utcnow()
                    
                    activity_data = {
                        "gmail_id": email_data["gmail_id"],
                        "subject": email_data["subject"],
                        "from_email": email_data["from_email"],
                        "to_email": email_data["to_email"],
                        "body_preview": email_data["body_preview"],
                        "full_body": email_data["full_body"],
                        "direction": email_data["direction"],
                        "email_date": email_date,
                        "thread_id": email_data["thread_id"],
                        "labels": email_data["labels"],
                        "owner_id": "aurora"
                    }
                    
                    cur.execute("""
                        INSERT INTO email_activities (
                            gmail_id, subject, from_email, to_email,
                            body_preview, full_body, direction, email_date,
                            thread_id, labels, owner_id
                        ) VALUES (
                            %(gmail_id)s, %(subject)s, %(from_email)s,
                            %(to_email)s, %(body_preview)s, %(full_body)s,
                            %(direction)s, %(email_date)s, %(thread_id)s,
                            %(labels)s, %(owner_id)s
                        ) ON CONFLICT (gmail_id) DO UPDATE SET
                            subject = EXCLUDED.subject,
                            body_preview = EXCLUDED.body_preview,
                            updated_at = CURRENT_TIMESTAMP
                    """, activity_data)
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
    GMAIL_CREDENTIALS = os.getenv("GMAIL_CREDENTIALS_PATH", "credentials.json")
    GMAIL_TOKEN = os.getenv("GMAIL_TOKEN_PATH", "token.json")
    
    db_config = {
        "host": "aurora-postgres-u44170.vm.elestio.app",
        "port": 25432,
        "dbname": "aurora_unified",
        "user": "aurora_app", 
        "password": "TestPilot2025_Aurora!",
        "sslmode": "require"
    }
    
    if not os.path.exists(GMAIL_CREDENTIALS):
        print("❌ Gmail credentials file not found. Please set up OAuth credentials.")
        exit(1)
    
    connector = GmailConnector(GMAIL_CREDENTIALS, GMAIL_TOKEN, db_config)
    
    print("🚀 Starting Gmail data import...")
    
    # Import recent emails
    print("📧 Fetching emails...")
    emails = connector.fetch_emails(query="newer_than:30d", max_results=500)
    imported_emails = connector.import_emails_as_activities(emails)
    print(f"✅ Imported {imported_emails} email activities")
    
    print("🎉 Gmail import complete!")
