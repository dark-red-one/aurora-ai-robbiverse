#!/bin/bash
# Drop old tables and run full sync

echo "🔧 Fixing database schema..."

PGPASSWORD="TestPilot2025_Aurora!" psql -h aurora-postgres-u44170.vm.elestio.app -p 25432 -U aurora_app -d aurora_unified << 'EOSQL'
-- Drop old conflicting tables
DROP TABLE IF EXISTS google_emails CASCADE;
DROP TABLE IF EXISTS google_calendar_events CASCADE;
DROP TABLE IF EXISTS google_drive_files CASCADE;

-- Create fresh tables with correct schema
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
);

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
);

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
);

-- Create indexes for performance
CREATE INDEX idx_emails_gmail_id ON google_emails(gmail_id);
CREATE INDEX idx_emails_thread_id ON google_emails(thread_id);
CREATE INDEX idx_emails_date ON google_emails(email_date);
CREATE INDEX idx_events_google_id ON google_calendar_events(google_event_id);
CREATE INDEX idx_events_start_time ON google_calendar_events(start_time);
CREATE INDEX idx_files_drive_id ON google_drive_files(drive_file_id);
CREATE INDEX idx_files_modified ON google_drive_files(modified_time);

EOSQL

echo "✅ Schema fixed! Starting full sync..."
cd /Users/allanperetz/aurora-ai-robbiverse/api-connectors
python3 quick-google-sync.py

