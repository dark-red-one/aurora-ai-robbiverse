#!/usr/bin/env python3
"""
Smart schema fix - check existing schema first, then fix conflicts
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

def check_schema():
    """Check existing table structure"""
    print("🔍 Checking existing schema...")
    
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    try:
        # Check if google_emails exists and its structure
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'google_emails' 
            ORDER BY ordinal_position
        """)
        
        columns = cursor.fetchall()
        if columns:
            print("   📋 Existing google_emails columns:")
            for col_name, col_type in columns:
                print(f"      • {col_name}: {col_type}")
        else:
            print("   📋 No google_emails table found")
            
        return columns
        
    except Exception as e:
        print(f"   ⚠️ Error checking schema: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

def fix_schema_smart():
    """Fix schema based on what exists"""
    print("🔧 Smart schema fix...")
    
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    try:
        # Check what exists
        existing_columns = check_schema()
        
        if existing_columns:
            # Table exists but might have wrong schema
            print("   🔄 Table exists - checking for conflicts...")
            
            # Check if thread_id column exists
            has_thread_id = any(col[0] == 'thread_id' for col in existing_columns)
            
            if not has_thread_id:
                print("   ➕ Adding missing thread_id column...")
                cursor.execute("ALTER TABLE google_emails ADD COLUMN thread_id VARCHAR(255);")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON google_emails(thread_id);")
            
            # Check other missing columns
            has_email_date = any(col[0] == 'email_date' for col in existing_columns)
            if not has_email_date:
                print("   ➕ Adding missing email_date column...")
                cursor.execute("ALTER TABLE google_emails ADD COLUMN email_date TIMESTAMP;")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_emails_date ON google_emails(email_date);")
                
        else:
            # Create fresh table
            print("   🆕 Creating fresh google_emails table...")
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
            
            # Create indexes
            cursor.execute("CREATE INDEX idx_emails_gmail_id ON google_emails(gmail_id);")
            cursor.execute("CREATE INDEX idx_emails_thread_id ON google_emails(thread_id);")
            cursor.execute("CREATE INDEX idx_emails_date ON google_emails(email_date);")
        
        # Ensure other tables exist
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
        
        print("✅ Schema fixed!")
        
    except Exception as e:
        print(f"❌ Schema fix failed: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    fix_schema_smart()
    print("\n🚀 Now running full Google sync...")
    import subprocess
    subprocess.run(["python3", "quick-google-sync.py"])

