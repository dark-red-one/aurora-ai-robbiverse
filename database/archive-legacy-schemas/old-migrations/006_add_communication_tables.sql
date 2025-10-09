-- Migration 006: Add Communication Tables
-- Phase 5: Touch Ready Queue, Email Tracking, Slack Integration

-- ========================================
-- TOUCH READY QUEUE TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS touch_ready_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  touch_type TEXT DEFAULT 'follow_up' CHECK (touch_type IN (
    'follow_up', 'check_in', 'thank_you', 'congratulations', 'introduction', 'reconnect'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  suggested_message TEXT,
  ai_confidence DECIMAL(3,2) CHECK (ai_confidence BETWEEN 0 AND 1),
  reason TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'dismissed')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- EMAIL THREADS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS email_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  thread_id TEXT UNIQUE, -- Gmail/Outlook thread ID
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  is_unread BOOLEAN DEFAULT TRUE,
  is_important BOOLEAN DEFAULT FALSE,
  requires_response BOOLEAN DEFAULT FALSE,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- EMAIL MESSAGES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS email_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES email_threads(id) ON DELETE CASCADE,
  message_id TEXT UNIQUE, -- Gmail/Outlook message ID
  from_email TEXT NOT NULL,
  to_emails TEXT[] DEFAULT '{}',
  cc_emails TEXT[] DEFAULT '{}',
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  is_from_user BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  embedding VECTOR(1536), -- For semantic search
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- SLACK MESSAGES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS slack_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  message_ts TEXT NOT NULL, -- Slack timestamp (unique ID)
  thread_ts TEXT, -- Parent message timestamp if in thread
  user_slack_id TEXT NOT NULL,
  username TEXT,
  text TEXT NOT NULL,
  is_from_bot BOOLEAN DEFAULT FALSE,
  is_important BOOLEAN DEFAULT FALSE,
  requires_action BOOLEAN DEFAULT FALSE,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  embedding VECTOR(1536), -- For semantic search
  posted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel_id, message_ts)
);

-- ========================================
-- COMMUNICATION ANALYTICS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS communication_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  emails_sent INTEGER DEFAULT 0,
  emails_received INTEGER DEFAULT 0,
  emails_responded_to INTEGER DEFAULT 0,
  avg_response_time_hours DECIMAL(10,2),
  slack_messages_sent INTEGER DEFAULT 0,
  slack_messages_received INTEGER DEFAULT 0,
  touches_completed INTEGER DEFAULT 0,
  time_saved_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(org_id, user_id, date)
);

-- ========================================
-- CREATE INDEXES
-- ========================================

-- Touch ready queue indexes
CREATE INDEX IF NOT EXISTS idx_touch_ready_queue_org_id ON touch_ready_queue(org_id);
CREATE INDEX IF NOT EXISTS idx_touch_ready_queue_contact_id ON touch_ready_queue(contact_id);
CREATE INDEX IF NOT EXISTS idx_touch_ready_queue_user_id ON touch_ready_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_touch_ready_queue_status ON touch_ready_queue(status);
CREATE INDEX IF NOT EXISTS idx_touch_ready_queue_priority ON touch_ready_queue(priority);
CREATE INDEX IF NOT EXISTS idx_touch_ready_queue_scheduled_for ON touch_ready_queue(scheduled_for);

-- Email threads indexes
CREATE INDEX IF NOT EXISTS idx_email_threads_org_id ON email_threads(org_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_user_id ON email_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_contact_id ON email_threads(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_thread_id ON email_threads(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_is_unread ON email_threads(is_unread);
CREATE INDEX IF NOT EXISTS idx_email_threads_requires_response ON email_threads(requires_response);
CREATE INDEX IF NOT EXISTS idx_email_threads_last_message_at ON email_threads(last_message_at DESC);

-- Email messages indexes
CREATE INDEX IF NOT EXISTS idx_email_messages_org_id ON email_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_thread_id ON email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_message_id ON email_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_from_email ON email_messages(from_email);
CREATE INDEX IF NOT EXISTS idx_email_messages_sent_at ON email_messages(sent_at DESC);

-- Vector similarity search on email messages
CREATE INDEX IF NOT EXISTS idx_email_messages_embedding ON email_messages 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Slack messages indexes
CREATE INDEX IF NOT EXISTS idx_slack_messages_org_id ON slack_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_slack_messages_user_id ON slack_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_slack_messages_channel_id ON slack_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_slack_messages_thread_ts ON slack_messages(thread_ts);
CREATE INDEX IF NOT EXISTS idx_slack_messages_requires_action ON slack_messages(requires_action);
CREATE INDEX IF NOT EXISTS idx_slack_messages_posted_at ON slack_messages(posted_at DESC);

-- Vector similarity search on slack messages
CREATE INDEX IF NOT EXISTS idx_slack_messages_embedding ON slack_messages 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Communication analytics indexes
CREATE INDEX IF NOT EXISTS idx_communication_analytics_org_id ON communication_analytics(org_id);
CREATE INDEX IF NOT EXISTS idx_communication_analytics_user_id ON communication_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_analytics_date ON communication_analytics(date DESC);

-- ========================================
-- ADD UPDATED_AT TRIGGERS
-- ========================================

CREATE TRIGGER update_touch_ready_queue_updated_at
  BEFORE UPDATE ON touch_ready_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_threads_updated_at
  BEFORE UPDATE ON email_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communication_analytics_updated_at
  BEFORE UPDATE ON communication_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON touch_ready_queue TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_threads TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_messages TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON slack_messages TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON communication_analytics TO postgres;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 006 Complete: Communication Tables';
  RAISE NOTICE '   - Created touch_ready_queue table';
  RAISE NOTICE '   - Created email_threads table';
  RAISE NOTICE '   - Created email_messages table with vector search';
  RAISE NOTICE '   - Created slack_messages table with vector search';
  RAISE NOTICE '   - Created communication_analytics table';
  RAISE NOTICE '   - Created performance indexes';
END $$;

