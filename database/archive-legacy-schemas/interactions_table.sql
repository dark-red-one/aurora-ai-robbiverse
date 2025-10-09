-- UNIFIED INTERACTIONS TABLE
-- Handles ALL communication types: Email, SMS, LinkedIn, Calls, Slack, etc.

CREATE TABLE IF NOT EXISTS interactions (
    id SERIAL PRIMARY KEY,
    
    -- Universal fields
    interaction_id TEXT UNIQUE NOT NULL,  -- gmail_id, sms_id, linkedin_id, etc.
    interaction_type TEXT NOT NULL,       -- 'email', 'sms', 'linkedin', 'call', 'slack', 'meeting'
    source_system TEXT NOT NULL,          -- 'gmail', 'twilio', 'linkedin', 'zoom', 'slack'
    
    -- Participants
    from_user TEXT,                       -- Sender email/phone/username
    to_users TEXT[],                      -- Recipients (array for multiple)
    cc_users TEXT[],                      -- CC (for emails)
    
    -- Content
    subject TEXT,                         -- Subject line (emails) or title
    body TEXT,                            -- Full content
    snippet TEXT,                         -- Preview/summary
    
    -- Metadata
    interaction_date TIMESTAMP,           -- When it happened
    thread_id TEXT,                       -- For threading conversations
    labels TEXT[],                        -- Tags/labels/categories
    is_unread BOOLEAN DEFAULT TRUE,
    is_starred BOOLEAN DEFAULT FALSE,
    
    -- AI Analysis
    importance_score DECIMAL(5,2) DEFAULT 0,
    urgency_score DECIMAL(5,2) DEFAULT 0,
    ai_tags TEXT[],                       -- AI-generated tags (Top7, Top3, Action, etc.)
    ai_reasoning TEXT,                    -- Why AI scored it this way
    sentiment TEXT,                       -- positive, negative, neutral
    
    -- Action tracking
    requires_action BOOLEAN DEFAULT FALSE,
    action_type TEXT,                     -- 'respond', 'schedule', 'review', 'approve'
    action_deadline TIMESTAMP,
    action_completed BOOLEAN DEFAULT FALSE,
    
    -- Relations
    contact_id INTEGER,                   -- Link to contacts table
    company_id INTEGER,                   -- Link to companies table
    deal_id INTEGER,                      -- Link to deals table
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analyzed_at TIMESTAMP,
    
    -- Raw data (for debugging)
    raw_data JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions(interaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_from ON interactions(from_user);
CREATE INDEX IF NOT EXISTS idx_interactions_importance ON interactions(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_urgency ON interactions(urgency_score DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_unread ON interactions(is_unread) WHERE is_unread = TRUE;
CREATE INDEX IF NOT EXISTS idx_interactions_action ON interactions(requires_action) WHERE requires_action = TRUE;
CREATE INDEX IF NOT EXISTS idx_interactions_ai_tags ON interactions USING GIN(ai_tags);
CREATE INDEX IF NOT EXISTS idx_interactions_contact ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_company ON interactions(company_id);
CREATE INDEX IF NOT EXISTS idx_interactions_deal ON interactions(deal_id);

-- View for Top 10 (Top 7 + Top 3)
CREATE OR REPLACE VIEW interactions_top10 AS
WITH ranked_important AS (
    SELECT *, 
           ROW_NUMBER() OVER (ORDER BY importance_score DESC, interaction_date DESC) as importance_rank
    FROM interactions
    WHERE interaction_date > NOW() - INTERVAL '3 days'
    AND interaction_type IN ('email', 'linkedin', 'sms')
),
ranked_urgent AS (
    SELECT *, 
           ROW_NUMBER() OVER (ORDER BY urgency_score DESC, interaction_date DESC) as urgency_rank
    FROM interactions
    WHERE interaction_date > NOW() - INTERVAL '3 days'
    AND interaction_type IN ('email', 'linkedin', 'sms')
    AND interaction_id NOT IN (SELECT interaction_id FROM ranked_important WHERE importance_rank <= 7)
)
SELECT *, 'Top7' as category FROM ranked_important WHERE importance_rank <= 7
UNION ALL
SELECT *, 'Top3' as category FROM ranked_urgent WHERE urgency_rank <= 3;

-- View for pending actions
CREATE OR REPLACE VIEW interactions_pending_actions AS
SELECT *
FROM interactions
WHERE requires_action = TRUE
AND action_completed = FALSE
ORDER BY action_deadline ASC NULLS LAST, urgency_score DESC;

-- View for today's interactions
CREATE OR REPLACE VIEW interactions_today AS
SELECT *
FROM interactions
WHERE interaction_date >= CURRENT_DATE
ORDER BY interaction_date DESC;

COMMENT ON TABLE interactions IS 'Unified table for all communication types (email, SMS, LinkedIn, calls, etc.)';
COMMENT ON COLUMN interactions.interaction_id IS 'Unique ID from source system (gmail_id, sms_id, etc.)';
COMMENT ON COLUMN interactions.ai_tags IS 'AI-generated tags like Top7, Top3, Action, Comment, FYI, LinkedIn, Notes, Interesting';
COMMENT ON COLUMN interactions.importance_score IS 'AI-calculated importance (0-100): revenue, clients, leads, meetings';
COMMENT ON COLUMN interactions.urgency_score IS 'AI-calculated urgency (0-100): deadlines, recency, action verbs';
