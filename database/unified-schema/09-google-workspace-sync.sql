-- Google Workspace Multi-Tenant Sync Schema
-- Stores Gmail, Calendar, Drive, Tasks, and Contacts for all users across multiple domains
-- Version: 1.0.0
-- Date: October 5, 2025
-- ============================================
-- GOOGLE WORKSPACE DOMAINS
-- ============================================
CREATE TABLE IF NOT EXISTS google_workspace_domains (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) UNIQUE NOT NULL,
    -- testpilotcpg.com, fluenti.testpilot.ai
    display_name VARCHAR(255) NOT NULL,
    service_account_email VARCHAR(255) NOT NULL,
    service_account_key_path TEXT NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMPTZ,
    sync_status VARCHAR(50) DEFAULT 'pending',
    sync_error TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Insert TestPilot CPG domain
INSERT INTO google_workspace_domains (
        domain,
        display_name,
        service_account_email,
        service_account_key_path,
        client_id
    )
VALUES (
        'testpilotcpg.com',
        'TestPilot CPG',
        'robbie-domain-wide-access@robbieverse-multi-tenant.iam.gserviceaccount.com',
        '/opt/aurora-dev/aurora/credentials/robbie-google-credentials.json',
        '109053008469037092646'
    ) ON CONFLICT (domain) DO
UPDATE
SET service_account_email = EXCLUDED.service_account_email,
    service_account_key_path = EXCLUDED.service_account_key_path,
    client_id = EXCLUDED.client_id,
    updated_at = CURRENT_TIMESTAMP;
-- ============================================
-- GOOGLE WORKSPACE USERS
-- ============================================
CREATE TABLE IF NOT EXISTS google_workspace_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id INTEGER REFERENCES google_workspace_domains(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    is_admin BOOLEAN DEFAULT false,
    is_suspended BOOLEAN DEFAULT false,
    last_login TIMESTAMPTZ,
    -- Privacy settings
    data_visible_to TEXT [] DEFAULT ARRAY []::TEXT [],
    -- Array of emails who can see this user's data
    -- Sync status
    gmail_last_sync TIMESTAMPTZ,
    calendar_last_sync TIMESTAMPTZ,
    drive_last_sync TIMESTAMPTZ,
    tasks_last_sync TIMESTAMPTZ,
    contacts_last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_google_users_domain ON google_workspace_users(domain_id);
CREATE INDEX idx_google_users_email ON google_workspace_users(email);
-- ============================================
-- GMAIL MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS gmail_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES google_workspace_users(id) ON DELETE CASCADE,
    message_id VARCHAR(255) UNIQUE NOT NULL,
    -- Google's message ID
    thread_id VARCHAR(255),
    -- Message details
    subject TEXT,
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    to_emails TEXT [],
    -- Array of recipient emails
    cc_emails TEXT [],
    bcc_emails TEXT [],
    -- Content
    body_text TEXT,
    body_html TEXT,
    snippet TEXT,
    -- Short preview
    -- Vector embedding for semantic search (stored as TEXT until pgvector is installed)
    embedding_json TEXT, -- JSON array of 1536 floats, will convert to VECTOR(1536) later
    -- Metadata
    labels TEXT [],
    -- Gmail labels
    is_unread BOOLEAN DEFAULT true,
    is_starred BOOLEAN DEFAULT false,
    is_important BOOLEAN DEFAULT false,
    has_attachments BOOLEAN DEFAULT false,
    attachment_count INTEGER DEFAULT 0,
    -- Timestamps
    sent_date TIMESTAMPTZ,
    received_date TIMESTAMPTZ,
    -- Sync tracking
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_synced TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_gmail_user ON gmail_messages(user_id);
CREATE INDEX idx_gmail_message_id ON gmail_messages(message_id);
CREATE INDEX idx_gmail_thread_id ON gmail_messages(thread_id);
CREATE INDEX idx_gmail_from_email ON gmail_messages(from_email);
CREATE INDEX idx_gmail_sent_date ON gmail_messages(sent_date DESC);
CREATE INDEX idx_gmail_is_unread ON gmail_messages(is_unread)
WHERE is_unread = true;
-- Hybrid approach: Store as TEXT on Elestio, convert to VECTOR on local nodes
-- On local nodes with pgvector, add this column and populate from embedding_json:
-- ALTER TABLE gmail_messages ADD COLUMN embedding VECTOR(1536);
-- UPDATE gmail_messages SET embedding = embedding_json::vector WHERE embedding_json IS NOT NULL;
-- CREATE INDEX idx_gmail_embedding ON gmail_messages USING ivfflat (embedding vector_cosine_ops);
-- ============================================
-- GMAIL ATTACHMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS gmail_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES gmail_messages(id) ON DELETE CASCADE,
    attachment_id VARCHAR(255) NOT NULL,
    filename VARCHAR(500),
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    drive_file_id VARCHAR(255),
    -- If saved to Drive
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_gmail_attachments_message ON gmail_attachments(message_id);
CREATE INDEX idx_gmail_attachments_filename ON gmail_attachments(filename);
-- ============================================
-- GOOGLE CALENDAR EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES google_workspace_users(id) ON DELETE CASCADE,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    -- Google's event ID
    calendar_id VARCHAR(255) NOT NULL,
    -- Event details
    title VARCHAR(500),
    description TEXT,
    location VARCHAR(500),
    -- Vector embedding for semantic search (stored as TEXT until pgvector is installed)
    embedding_json TEXT, -- JSON array of 1536 floats, will convert to VECTOR(1536) later
    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN DEFAULT false,
    timezone VARCHAR(100),
    -- Recurrence
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    -- Participants
    organizer_email VARCHAR(255),
    attendees JSONB DEFAULT '[]'::jsonb,
    -- Array of {email, name, response_status}
    -- Status
    status VARCHAR(50) DEFAULT 'confirmed',
    -- confirmed, tentative, cancelled
    visibility VARCHAR(50) DEFAULT 'default',
    -- default, public, private
    -- Meeting details
    meeting_link VARCHAR(500),
    -- Google Meet, Zoom, etc.
    is_online_meeting BOOLEAN DEFAULT false,
    -- Sync tracking
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_synced TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_calendar_user ON calendar_events(user_id);
CREATE INDEX idx_calendar_event_id ON calendar_events(event_id);
CREATE INDEX idx_calendar_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_end_time ON calendar_events(end_time);
CREATE INDEX idx_calendar_organizer ON calendar_events(organizer_email);
-- On local nodes with pgvector:
-- ALTER TABLE calendar_events ADD COLUMN embedding VECTOR(1536);
-- UPDATE calendar_events SET embedding = embedding_json::vector WHERE embedding_json IS NOT NULL;
-- CREATE INDEX idx_calendar_embedding ON calendar_events USING ivfflat (embedding vector_cosine_ops);
-- ============================================
-- GOOGLE DRIVE FILES
-- ============================================
CREATE TABLE IF NOT EXISTS drive_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES google_workspace_users(id) ON DELETE CASCADE,
    file_id VARCHAR(255) UNIQUE NOT NULL,
    -- Google's file ID
    -- File details
    name VARCHAR(500),
    mime_type VARCHAR(100),
    file_extension VARCHAR(20),
    size_bytes BIGINT,
    -- Content
    content_text TEXT,
    -- Extracted text content
    embedding VECTOR(1536),
    -- Vector embedding of content
    -- Location
    parent_folder_id VARCHAR(255),
    folder_path TEXT,
    web_view_link TEXT,
    download_link TEXT,
    -- Ownership & Sharing
    owner_email VARCHAR(255),
    shared_with TEXT [],
    -- Array of emails
    is_shared BOOLEAN DEFAULT false,
    sharing_permissions VARCHAR(50),
    -- view, comment, edit
    -- Status
    is_trashed BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    -- Timestamps
    created_time TIMESTAMPTZ,
    modified_time TIMESTAMPTZ,
    viewed_time TIMESTAMPTZ,
    -- Sync tracking
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_synced TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_drive_user ON drive_files(user_id);
CREATE INDEX idx_drive_file_id ON drive_files(file_id);
CREATE INDEX idx_drive_name ON drive_files(name);
CREATE INDEX idx_drive_mime_type ON drive_files(mime_type);
CREATE INDEX idx_drive_owner ON drive_files(owner_email);
CREATE INDEX idx_drive_is_trashed ON drive_files(is_trashed)
WHERE is_trashed = false;
-- On local nodes with pgvector:
-- ALTER TABLE drive_files ADD COLUMN embedding VECTOR(1536);
-- UPDATE drive_files SET embedding = embedding_json::vector WHERE embedding_json IS NOT NULL;
-- CREATE INDEX idx_drive_embedding ON drive_files USING ivfflat (embedding vector_cosine_ops);
-- ============================================
-- GOOGLE TASKS
-- ============================================
CREATE TABLE IF NOT EXISTS google_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES google_workspace_users(id) ON DELETE CASCADE,
    task_id VARCHAR(255) UNIQUE NOT NULL,
    -- Google's task ID
    task_list_id VARCHAR(255) NOT NULL,
    task_list_name VARCHAR(255),
    -- Task details
    title VARCHAR(500),
    notes TEXT,
    -- Vector embedding for semantic search (stored as TEXT until pgvector is installed)
    embedding_json TEXT, -- JSON array of 1536 floats, will convert to VECTOR(1536) later
    -- Status
    status VARCHAR(50) DEFAULT 'needsAction',
    -- needsAction, completed
    is_completed BOOLEAN DEFAULT false,
    completed_date TIMESTAMPTZ,
    -- Timing
    due_date TIMESTAMPTZ,
    -- Hierarchy
    parent_task_id VARCHAR(255),
    position VARCHAR(50),
    -- Google's position string
    -- Sync tracking
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_synced TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tasks_user ON google_tasks(user_id);
CREATE INDEX idx_tasks_task_id ON google_tasks(task_id);
CREATE INDEX idx_tasks_status ON google_tasks(status);
CREATE INDEX idx_tasks_is_completed ON google_tasks(is_completed)
WHERE is_completed = false;
CREATE INDEX idx_tasks_due_date ON google_tasks(due_date);
-- CREATE INDEX idx_tasks_embedding ON google_tasks USING ivfflat (embedding vector_cosine_ops);
-- ============================================
-- GOOGLE CONTACTS
-- ============================================
CREATE TABLE IF NOT EXISTS google_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES google_workspace_users(id) ON DELETE CASCADE,
    contact_id VARCHAR(255) UNIQUE NOT NULL,
    -- Google's contact resource name
    -- Contact details
    full_name VARCHAR(255),
    given_name VARCHAR(255),
    family_name VARCHAR(255),
    nickname VARCHAR(255),
    -- Communication
    email_addresses JSONB DEFAULT '[]'::jsonb,
    -- Array of {value, type, primary}
    phone_numbers JSONB DEFAULT '[]'::jsonb,
    -- Array of {value, type, primary}
    -- Professional
    organizations JSONB DEFAULT '[]'::jsonb,
    -- Array of {name, title, department}
    job_title VARCHAR(255),
    company_name VARCHAR(255),
    -- Social
    urls JSONB DEFAULT '[]'::jsonb,
    -- LinkedIn, Twitter, etc.
    -- Address
    addresses JSONB DEFAULT '[]'::jsonb,
    -- Notes
    notes TEXT,
    -- Vector embedding for semantic search (stored as TEXT until pgvector is installed)
    embedding_json TEXT, -- JSON array of 1536 floats, will convert to VECTOR(1536) later
    -- Metadata
    photo_url TEXT,
    groups TEXT [],
    -- Contact groups
    -- Sync tracking
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_synced TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_google_contacts_user ON google_contacts(user_id);
CREATE INDEX idx_google_contacts_contact_id ON google_contacts(contact_id);
CREATE INDEX idx_google_contacts_full_name ON google_contacts(full_name);
CREATE INDEX idx_google_contacts_company ON google_contacts(company_name);
-- CREATE INDEX idx_google_contacts_embedding ON google_contacts USING ivfflat (embedding vector_cosine_ops);
-- ============================================
-- SYNC JOBS & STATUS
-- ============================================
CREATE TABLE IF NOT EXISTS google_sync_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id INTEGER REFERENCES google_workspace_domains(id) ON DELETE CASCADE,
    user_id UUID REFERENCES google_workspace_users(id) ON DELETE CASCADE,
    -- Job details
    sync_type VARCHAR(50) NOT NULL,
    -- gmail, calendar, drive, tasks, contacts, full
    status VARCHAR(50) DEFAULT 'pending',
    -- pending, running, completed, failed
    -- Progress
    items_total INTEGER DEFAULT 0,
    items_processed INTEGER DEFAULT 0,
    items_new INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    items_deleted INTEGER DEFAULT 0,
    -- Performance
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    -- Error handling
    error_message TEXT,
    error_count INTEGER DEFAULT 0,
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sync_jobs_domain ON google_sync_jobs(domain_id);
CREATE INDEX idx_sync_jobs_user ON google_sync_jobs(user_id);
CREATE INDEX idx_sync_jobs_status ON google_sync_jobs(status);
CREATE INDEX idx_sync_jobs_sync_type ON google_sync_jobs(sync_type);
CREATE INDEX idx_sync_jobs_created_at ON google_sync_jobs(created_at DESC);
-- ============================================
-- PRIVACY & ACCESS CONTROL
-- ============================================
-- Define who can see whose data
CREATE TABLE IF NOT EXISTS google_data_access_rules (
    id SERIAL PRIMARY KEY,
    domain_id INTEGER REFERENCES google_workspace_domains(id) ON DELETE CASCADE,
    -- Viewer (who is accessing)
    viewer_email VARCHAR(255) NOT NULL,
    -- Target (whose data can be viewed)
    target_email VARCHAR(255),
    -- NULL means all users
    -- Permissions
    can_view_gmail BOOLEAN DEFAULT false,
    can_view_calendar BOOLEAN DEFAULT false,
    can_view_drive BOOLEAN DEFAULT false,
    can_view_tasks BOOLEAN DEFAULT false,
    can_view_contacts BOOLEAN DEFAULT false,
    -- Special permissions
    is_admin_access BOOLEAN DEFAULT false,
    -- Admin sees everything
    -- Metadata
    granted_by VARCHAR(255),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,
    UNIQUE(domain_id, viewer_email, target_email)
);
-- Allan gets admin access to all TestPilot CPG data
INSERT INTO google_data_access_rules (
        domain_id,
        viewer_email,
        target_email,
        can_view_gmail,
        can_view_calendar,
        can_view_drive,
        can_view_tasks,
        can_view_contacts,
        is_admin_access,
        granted_by,
        reason
    )
VALUES (
        (
            SELECT id
            FROM google_workspace_domains
            WHERE domain = 'testpilotcpg.com'
        ),
        'allan@testpilotcpg.com',
        NULL,
        true,
        true,
        true,
        true,
        true,
        true,
        'system',
        'Domain owner - full access to all users'
    ) ON CONFLICT (domain_id, viewer_email, target_email) DO
UPDATE
SET can_view_gmail = true,
    can_view_calendar = true,
    can_view_drive = true,
    can_view_tasks = true,
    can_view_contacts = true,
    is_admin_access = true,
    updated_at = CURRENT_TIMESTAMP;
-- Everyone can see their own data
CREATE OR REPLACE FUNCTION ensure_self_access() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO google_data_access_rules (
        domain_id,
        viewer_email,
        target_email,
        can_view_gmail,
        can_view_calendar,
        can_view_drive,
        can_view_tasks,
        can_view_contacts,
        granted_by,
        reason
    )
SELECT domain_id,
    email,
    email,
    true,
    true,
    true,
    true,
    true,
    'system',
    'Self-access'
FROM google_workspace_users
WHERE id = NEW.id ON CONFLICT (domain_id, viewer_email, target_email) DO NOTHING;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_ensure_self_access
AFTER
INSERT ON google_workspace_users FOR EACH ROW EXECUTE FUNCTION ensure_self_access();
-- ============================================
-- PRIVACY FUNCTIONS
-- ============================================
-- Check if viewer can access target user's data
CREATE OR REPLACE FUNCTION can_access_google_data(
        viewer_email_param VARCHAR(255),
        target_email_param VARCHAR(255),
        data_type VARCHAR(50) -- gmail, calendar, drive, tasks, contacts
    ) RETURNS BOOLEAN AS $$
DECLARE has_access BOOLEAN;
BEGIN -- Check if viewer has access to target's data
SELECT EXISTS (
        SELECT 1
        FROM google_data_access_rules r
            JOIN google_workspace_users u ON u.email = target_email_param
        WHERE r.viewer_email = viewer_email_param
            AND (
                r.target_email = target_email_param
                OR r.target_email IS NULL
            ) -- NULL = all users
            AND r.domain_id = u.domain_id
            AND (
                (
                    data_type = 'gmail'
                    AND r.can_view_gmail = true
                )
                OR (
                    data_type = 'calendar'
                    AND r.can_view_calendar = true
                )
                OR (
                    data_type = 'drive'
                    AND r.can_view_drive = true
                )
                OR (
                    data_type = 'tasks'
                    AND r.can_view_tasks = true
                )
                OR (
                    data_type = 'contacts'
                    AND r.can_view_contacts = true
                )
                OR r.is_admin_access = true
            )
            AND (
                r.expires_at IS NULL
                OR r.expires_at > CURRENT_TIMESTAMP
            )
    ) INTO has_access;
RETURN has_access;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- SEMANTIC SEARCH FUNCTIONS (Disabled - waiting for pgvector)
-- ============================================
-- These will be enabled once pgvector extension is installed
-- For now, use keyword search in application layer
-- ============================================
-- ANALYTICS & INSIGHTS
-- ============================================
-- Get user activity summary
CREATE OR REPLACE VIEW google_user_activity_summary AS
SELECT u.email,
    u.full_name,
    u.domain_id,
    d.domain,
    COUNT(DISTINCT m.id) as email_count,
    COUNT(
        DISTINCT CASE
            WHEN m.is_unread THEN m.id
        END
    ) as unread_email_count,
    COUNT(DISTINCT e.id) as calendar_event_count,
    COUNT(
        DISTINCT CASE
            WHEN e.start_time > CURRENT_TIMESTAMP THEN e.id
        END
    ) as upcoming_event_count,
    COUNT(DISTINCT f.id) as drive_file_count,
    COALESCE(SUM(f.size_bytes), 0) as total_drive_bytes,
    COUNT(DISTINCT t.id) as task_count,
    COUNT(
        DISTINCT CASE
            WHEN t.is_completed = false THEN t.id
        END
    ) as open_task_count,
    COUNT(DISTINCT c.id) as contact_count,
    u.last_login,
    u.gmail_last_sync,
    u.calendar_last_sync,
    u.drive_last_sync,
    u.tasks_last_sync,
    u.contacts_last_sync
FROM google_workspace_users u
    JOIN google_workspace_domains d ON u.domain_id = d.id
    LEFT JOIN gmail_messages m ON m.user_id = u.id
    LEFT JOIN calendar_events e ON e.user_id = u.id
    LEFT JOIN drive_files f ON f.user_id = u.id
    AND f.is_trashed = false
    LEFT JOIN google_tasks t ON t.user_id = u.id
    LEFT JOIN google_contacts c ON c.user_id = u.id
WHERE u.is_suspended = false
GROUP BY u.id,
    u.email,
    u.full_name,
    u.domain_id,
    d.domain,
    u.last_login,
    u.gmail_last_sync,
    u.calendar_last_sync,
    u.drive_last_sync,
    u.tasks_last_sync,
    u.contacts_last_sync;
-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_google_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_google_domains_updated BEFORE
UPDATE ON google_workspace_domains FOR EACH ROW EXECUTE FUNCTION update_google_updated_at();
CREATE TRIGGER trigger_google_users_updated BEFORE
UPDATE ON google_workspace_users FOR EACH ROW EXECUTE FUNCTION update_google_updated_at();
CREATE TRIGGER trigger_gmail_messages_updated BEFORE
UPDATE ON gmail_messages FOR EACH ROW EXECUTE FUNCTION update_google_updated_at();
CREATE TRIGGER trigger_calendar_events_updated BEFORE
UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_google_updated_at();
CREATE TRIGGER trigger_drive_files_updated BEFORE
UPDATE ON drive_files FOR EACH ROW EXECUTE FUNCTION update_google_updated_at();
CREATE TRIGGER trigger_google_tasks_updated BEFORE
UPDATE ON google_tasks FOR EACH ROW EXECUTE FUNCTION update_google_updated_at();
CREATE TRIGGER trigger_google_contacts_updated BEFORE
UPDATE ON google_contacts FOR EACH ROW EXECUTE FUNCTION update_google_updated_at();
-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE google_workspace_domains IS 'Multi-tenant Google Workspace domain configurations';
COMMENT ON TABLE google_workspace_users IS 'Users across all Google Workspace domains with privacy controls';
COMMENT ON TABLE gmail_messages IS 'Gmail messages with vector embeddings for semantic search';
COMMENT ON TABLE calendar_events IS 'Google Calendar events with vector embeddings';
COMMENT ON TABLE drive_files IS 'Google Drive files with content extraction and embeddings';
COMMENT ON TABLE google_tasks IS 'Google Tasks with vector embeddings';
COMMENT ON TABLE google_contacts IS 'Google Contacts with vector embeddings';
COMMENT ON TABLE google_data_access_rules IS 'Privacy rules: who can see whose data';
COMMENT ON FUNCTION can_access_google_data IS 'Privacy enforcement: checks if viewer can access target user data';
-- COMMENT ON FUNCTION search_gmail IS 'Semantic search across Gmail with automatic privacy filtering';
-- COMMENT ON FUNCTION search_calendar IS 'Semantic search across Calendar with automatic privacy filtering';
