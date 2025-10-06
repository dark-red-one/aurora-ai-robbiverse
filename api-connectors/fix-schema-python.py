#!/usr/bin/env python3
"""
Fix database schema and run full Google sync
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Database config
DB_CONFIG = {
    "host": "aurora-postgres-u44170.vm.elestio.app",
    "port": 25432,
    "dbname": "aurora_unified",
    "user": "aurora_app",
    "password": "TestPilot2025_Aurora!",
    "sslmode": "require"
}

def fix_schema():
    """Drop old tables and create fresh ones"""
    print("🔧 Fixing database schema...")
    
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    try:
        # Drop old conflicting tables
        print("   Dropping old tables...")
        cursor.execute("DROP TABLE IF EXISTS google_emails CASCADE;")
        cursor.execute("DROP TABLE IF EXISTS google_calendar_events CASCADE;")
        cursor.execute("DROP TABLE IF EXISTS google_drive_files CASCADE;")
        
        # Create fresh tables with correct schema
        print("   Creating fresh tables...")
        
        cursor.execute("""
            CREATE TABLE google_emails (
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
        
        cursor.execute("""
            CREATE TABLE google_calendar_events (
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
        
        cursor.execute("""
            CREATE TABLE google_drive_files (
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
        
        # Create indexes for performance
        print("   Creating indexes...")
        cursor.execute("CREATE INDEX idx_emails_gmail_id ON google_emails(gmail_id);")
        cursor.execute("CREATE INDEX idx_emails_thread_id ON google_emails(thread_id);")
        cursor.execute("CREATE INDEX idx_emails_date ON google_emails(email_date);")
        cursor.execute("CREATE INDEX idx_events_google_id ON google_calendar_events(google_event_id);")
        cursor.execute("CREATE INDEX idx_events_start_time ON google_calendar_events(start_time);")
        cursor.execute("CREATE INDEX idx_files_drive_id ON google_drive_files(drive_file_id);")
        cursor.execute("CREATE INDEX idx_files_modified ON google_drive_files(modified_time);")
        
        print("✅ Schema fixed!")
        
    except Exception as e:
        print(f"❌ Schema fix failed: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    fix_schema()
    print("\n🚀 Now running full Google sync...")
    import subprocess
    subprocess.run(["python3", "quick-google-sync.py"])

