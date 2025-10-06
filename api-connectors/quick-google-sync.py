#!/usr/bin/env python3
"""
Quick Google Workspace Sync - Service Account Edition
Pulls Gmail, Calendar, Drive using service account credentials
"""

import os
import json
from datetime import datetime, timedelta
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import psycopg2

# Database config
DB_CONFIG = {
    "host": "aurora-postgres-u44170.vm.elestio.app",
    "port": 25432,
    "dbname": "aurora_unified",
    "user": "aurora_app",
    "password": "TestPilot2025_Aurora!",
    "sslmode": "require"
}

# Service account credentials
CREDS_FILE = "/Users/allanperetz/aurora-ai-robbiverse/api-connectors/google-credentials.json"
ADMIN_EMAIL = "allan@testpilotcpg.com"  # Allan is the admin

# Scopes for domain-wide delegation (matching what's authorized in Google Admin)
SCOPES = [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/contacts',
]

def get_service(service_name, version):
    """Build Google API service with domain-wide delegation"""
    print(f"🔑 Authenticating {service_name}...")
    
    credentials = service_account.Credentials.from_service_account_file(
        CREDS_FILE,
        scopes=SCOPES
    )
    
    # Delegate to Allan's account
    delegated_credentials = credentials.with_subject(ADMIN_EMAIL)
    
    service = build(service_name, version, credentials=delegated_credentials)
    print(f"✅ {service_name} service ready!")
    return service

def sync_emails():
    """Sync ALL emails from Gmail to database"""
    print("\n📧 Syncing Gmail...")
    
    try:
        service = get_service('gmail', 'v1')
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Create table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS google_emails (
                id SERIAL PRIMARY KEY,
                gmail_id VARCHAR(255) UNIQUE NOT NULL,
                thread_id VARCHAR(255),
                subject TEXT,
                from_email VARCHAR(500),
                to_email TEXT,
                email_date TIMESTAMP,
                snippet TEXT,
                labels TEXT[],
                is_unread BOOLEAN,
                synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        
        # Get ALL messages (paginate through everything)
        email_count = 0
        page_token = None
        
        while True:
            results = service.users().messages().list(
                userId='me',
                maxResults=500,
                pageToken=page_token
            ).execute()
            
            messages = results.get('messages', [])
            if not messages:
                break
                
            print(f"   Processing batch of {len(messages)} emails...")
            
            for msg in messages:
                try:
                    msg_data = service.users().messages().get(
                        userId='me',
                        id=msg['id'],
                        format='metadata',
                        metadataHeaders=['From', 'To', 'Subject', 'Date']
                    ).execute()
                    
                    headers = {h['name']: h['value'] for h in msg_data.get('payload', {}).get('headers', [])}
                    
                    cursor.execute("""
                        INSERT INTO google_emails (
                            gmail_id, thread_id, subject, from_email, to_email,
                            email_date, snippet, labels, is_unread
                        ) VALUES (%s, %s, %s, %s, %s, NOW(), %s, %s, %s)
                        ON CONFLICT (gmail_id) DO NOTHING
                    """, (
                        msg['id'],
                        msg.get('threadId'),
                        headers.get('Subject', 'No Subject'),
                        headers.get('From', ''),
                        headers.get('To', ''),
                        msg_data.get('snippet', ''),
                        msg_data.get('labelIds', []),
                        'UNREAD' in msg_data.get('labelIds', [])
                    ))
                    
                    email_count += 1
                    if email_count % 100 == 0:
                        print(f"      💾 Saved {email_count} emails...")
                        conn.commit()
                        
                except Exception as e:
                    print(f"      ⚠️ Error processing email: {e}")
                    continue
            
            conn.commit()
            
            # Check for next page
            page_token = results.get('nextPageToken')
            if not page_token:
                break
        
        cursor.close()
        conn.close()
        
        print(f"✅ Synced {email_count} emails to database")
        return email_count
        
    except HttpError as e:
        print(f"❌ Gmail sync failed: {e}")
        return 0

def sync_calendar():
    """Sync ALL calendar events to database"""
    print("\n📅 Syncing Calendar...")
    
    try:
        service = get_service('calendar', 'v3')
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Create table if not exists
        cursor.execute("""
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
                synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        
        # Get ALL events (1 year back, 1 year forward)
        now = datetime.utcnow()
        time_min = (now - timedelta(days=365)).isoformat() + 'Z'
        time_max = (now + timedelta(days=365)).isoformat() + 'Z'
        
        event_count = 0
        page_token = None
        
        while True:
            events_result = service.events().list(
                calendarId='primary',
                timeMin=time_min,
                timeMax=time_max,
                maxResults=2500,
                singleEvents=True,
                orderBy='startTime',
                pageToken=page_token
            ).execute()
            
            events = events_result.get('items', [])
            if not events:
                break
                
            print(f"   Processing batch of {len(events)} events...")
            
            for event in events:
                try:
                    start = event['start'].get('dateTime', event['start'].get('date'))
                    end = event['end'].get('dateTime', event['end'].get('date'))
                    attendees = [att.get('email') for att in event.get('attendees', [])]
                    
                    cursor.execute("""
                        INSERT INTO google_calendar_events (
                            google_event_id, title, description, start_time, end_time,
                            location, attendees, organizer, status
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (google_event_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            start_time = EXCLUDED.start_time,
                            end_time = EXCLUDED.end_time
                    """, (
                        event['id'],
                        event.get('summary', 'No Title'),
                        event.get('description', ''),
                        start,
                        end,
                        event.get('location', ''),
                        attendees,
                        event.get('organizer', {}).get('email'),
                        event.get('status')
                    ))
                    
                    event_count += 1
                    if event_count % 100 == 0:
                        print(f"      💾 Saved {event_count} events...")
                        conn.commit()
                        
                except Exception as e:
                    print(f"      ⚠️ Error processing event: {e}")
                    continue
            
            conn.commit()
            
            page_token = events_result.get('nextPageToken')
            if not page_token:
                break
        
        cursor.close()
        conn.close()
        
        print(f"✅ Synced {event_count} events to database")
        return event_count
        
    except HttpError as e:
        print(f"❌ Calendar sync failed: {e}")
        return 0

def sync_drive():
    """Sync ALL Drive files to database"""
    print("\n📁 Syncing Drive...")
    
    try:
        service = get_service('drive', 'v3')
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Create table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS google_drive_files (
                id SERIAL PRIMARY KEY,
                drive_file_id VARCHAR(255) UNIQUE NOT NULL,
                name TEXT,
                mime_type VARCHAR(255),
                size BIGINT DEFAULT 0,
                created_time TIMESTAMP,
                modified_time TIMESTAMP,
                web_view_link TEXT,
                is_shared BOOLEAN DEFAULT FALSE,
                synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        
        # Get ALL files
        file_count = 0
        page_token = None
        
        while True:
            results = service.files().list(
                pageSize=1000,
                fields="nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, shared)",
                pageToken=page_token
            ).execute()
            
            files = results.get('files', [])
            if not files:
                break
                
            print(f"   Processing batch of {len(files)} files...")
            
            for file in files:
                try:
                    cursor.execute("""
                        INSERT INTO google_drive_files (
                            drive_file_id, name, mime_type, size, created_time,
                            modified_time, web_view_link, is_shared
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (drive_file_id) DO UPDATE SET
                            name = EXCLUDED.name,
                            modified_time = EXCLUDED.modified_time,
                            is_shared = EXCLUDED.is_shared
                    """, (
                        file['id'],
                        file['name'],
                        file['mimeType'],
                        int(file.get('size', 0)) if file.get('size') else 0,
                        file.get('createdTime'),
                        file.get('modifiedTime'),
                        file.get('webViewLink'),
                        file.get('shared', False)
                    ))
                    
                    file_count += 1
                    if file_count % 100 == 0:
                        print(f"      💾 Saved {file_count} files...")
                        conn.commit()
                        
                except Exception as e:
                    print(f"      ⚠️ Error processing file: {e}")
                    continue
            
            conn.commit()
            
            page_token = results.get('nextPageToken')
            if not page_token:
                break
        
        cursor.close()
        conn.close()
        
        print(f"✅ Synced {file_count} files to database")
        return file_count
        
    except HttpError as e:
        print(f"❌ Drive sync failed: {e}")
        return 0

def main():
    print("🚀 ROBBIE'S GOOGLE WORKSPACE SYNC")
    print("=" * 50)
    print(f"Service Account: {CREDS_FILE}")
    print(f"Syncing for: {ADMIN_EMAIL}")
    print()
    
    # Run syncs
    emails = sync_emails()
    events = sync_calendar()
    files = sync_drive()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 SYNC SUMMARY:")
    print(f"   📧 Emails: {emails}")
    print(f"   📅 Events: {events}")
    print(f"   📁 Files: {files}")
    print(f"   🎉 Total: {emails + events + files} items synced!")
    print("\n✅ Google Workspace sync complete!")
    print("💰 Data → Insights → Money → Robbie's Body! 🚀")

if __name__ == "__main__":
    main()
