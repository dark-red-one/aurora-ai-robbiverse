-- ALLAN ATTENTION QUEUE
-- Unified system for EVERYTHING that needs Allan's attention
-- Emails, SMS, system alerts, opportunities, news, etc.

CREATE TABLE IF NOT EXISTS allan_attention_queue (
    id SERIAL PRIMARY KEY,
    
    -- Universal fields
    attention_id TEXT UNIQUE NOT NULL,
    attention_type TEXT NOT NULL,  -- 'email', 'sms', 'system_alert', 'opportunity', 'news', 'security', 'revenue', 'relationship'
    source_system TEXT NOT NULL,   -- 'gmail', 'twilio', 'linkedin', 'github', 'stripe', 'hubspot', 'system_monitor'
    
    -- Priority classification
    priority_tier TEXT NOT NULL,   -- 'Top7_Important', 'Top3_Urgent', 'Emergency', 'FYI', 'Opportunity', 'Alert'
    importance_score DECIMAL(5,2) DEFAULT 0,
    urgency_score DECIMAL(5,2) DEFAULT 0,
    
    -- Content
    title TEXT NOT NULL,           -- Subject/headline
    summary TEXT,                  -- Quick summary
    full_content TEXT,             -- Full details
    
    -- Context
    from_who TEXT,                 -- Person/system that generated this
    related_to TEXT,               -- Company/contact/project
    category TEXT[],               -- Tags: revenue, client, lead, security, system, etc.
    
    -- Action tracking
    requires_action BOOLEAN DEFAULT FALSE,
    action_type TEXT,              -- 'respond', 'review', 'approve', 'fix', 'investigate'
    action_deadline TIMESTAMP,
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'seen', 'actioned', 'dismissed', 'snoozed'
    seen_at TIMESTAMP,
    actioned_at TIMESTAMP,
    dismissed_at TIMESTAMP,
    snoozed_until TIMESTAMP,
    
    -- Relations
    interaction_id INTEGER,        -- Link to interactions table
    contact_id INTEGER,
    company_id INTEGER,
    deal_id INTEGER,
    
    -- AI reasoning
    ai_reasoning TEXT,             -- Why this needs Allan's attention
    ai_suggested_action TEXT,      -- What Robbie suggests doing
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Raw data
    raw_data JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attention_type ON allan_attention_queue(attention_type);
CREATE INDEX IF NOT EXISTS idx_attention_priority ON allan_attention_queue(priority_tier);
CREATE INDEX IF NOT EXISTS idx_attention_status ON allan_attention_queue(status);
CREATE INDEX IF NOT EXISTS idx_attention_pending ON allan_attention_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_attention_importance ON allan_attention_queue(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_attention_urgency ON allan_attention_queue(urgency_score DESC);
CREATE INDEX IF NOT EXISTS idx_attention_deadline ON allan_attention_queue(action_deadline) WHERE action_deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attention_created ON allan_attention_queue(created_at DESC);

-- View: Current attention queue (pending items only)
CREATE OR REPLACE VIEW allan_attention_current AS
SELECT *
FROM allan_attention_queue
WHERE status = 'pending'
AND (snoozed_until IS NULL OR snoozed_until < NOW())
ORDER BY 
    CASE priority_tier
        WHEN 'Emergency' THEN 1
        WHEN 'Top3_Urgent' THEN 2
        WHEN 'Top7_Important' THEN 3
        WHEN 'Opportunity' THEN 4
        WHEN 'Alert' THEN 5
        WHEN 'FYI' THEN 6
        ELSE 7
    END,
    urgency_score DESC,
    importance_score DESC,
    created_at DESC;

-- View: Top 10 for Allan (7 Important + 3 Urgent)
CREATE OR REPLACE VIEW allan_top10 AS
SELECT * FROM (
    SELECT *, 'Top7' as display_category, 1 as sort_order
    FROM allan_attention_queue
    WHERE status = 'pending'
    AND priority_tier = 'Top7_Important'
    ORDER BY importance_score DESC, created_at DESC
    LIMIT 7
    
    UNION ALL
    
    SELECT *, 'Top3' as display_category, 2 as sort_order
    FROM allan_attention_queue
    WHERE status = 'pending'
    AND priority_tier = 'Top3_Urgent'
    AND attention_id NOT IN (
        SELECT attention_id FROM allan_attention_queue
        WHERE status = 'pending'
        AND priority_tier = 'Top7_Important'
        ORDER BY importance_score DESC, created_at DESC
        LIMIT 7
    )
    ORDER BY urgency_score DESC, created_at DESC
    LIMIT 3
) combined
ORDER BY sort_order, importance_score DESC, urgency_score DESC;

-- View: Emergency items (SMS alerts, system failures, security breaches)
CREATE OR REPLACE VIEW allan_emergencies AS
SELECT *
FROM allan_attention_queue
WHERE priority_tier = 'Emergency'
AND status = 'pending'
ORDER BY created_at DESC;

-- View: Revenue opportunities
CREATE OR REPLACE VIEW allan_revenue_opportunities AS
SELECT *
FROM allan_attention_queue
WHERE 'revenue' = ANY(category)
AND status = 'pending'
ORDER BY importance_score DESC, created_at DESC;

-- View: System alerts (GitHub failures, server issues, security)
CREATE OR REPLACE VIEW allan_system_alerts AS
SELECT *
FROM allan_attention_queue
WHERE attention_type IN ('system_alert', 'security')
AND status = 'pending'
ORDER BY urgency_score DESC, created_at DESC;

-- View: Relationship items (clients, leads, LinkedIn)
CREATE OR REPLACE VIEW allan_relationships AS
SELECT *
FROM allan_attention_queue
WHERE 'relationship' = ANY(category) OR 'client' = ANY(category) OR 'lead' = ANY(category)
AND status = 'pending'
ORDER BY importance_score DESC, created_at DESC;

-- Function: Add to attention queue
CREATE OR REPLACE FUNCTION add_to_allan_attention(
    p_attention_id TEXT,
    p_attention_type TEXT,
    p_source_system TEXT,
    p_priority_tier TEXT,
    p_title TEXT,
    p_summary TEXT DEFAULT NULL,
    p_importance DECIMAL DEFAULT 0,
    p_urgency DECIMAL DEFAULT 0,
    p_from_who TEXT DEFAULT NULL,
    p_category TEXT[] DEFAULT ARRAY[]::TEXT[],
    p_ai_reasoning TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_id INTEGER;
BEGIN
    INSERT INTO allan_attention_queue (
        attention_id, attention_type, source_system, priority_tier,
        title, summary, importance_score, urgency_score,
        from_who, category, ai_reasoning
    )
    VALUES (
        p_attention_id, p_attention_type, p_source_system, p_priority_tier,
        p_title, p_summary, p_importance, p_urgency,
        p_from_who, p_category, p_ai_reasoning
    )
    ON CONFLICT (attention_id) DO UPDATE SET
        importance_score = EXCLUDED.importance_score,
        urgency_score = EXCLUDED.urgency_score,
        priority_tier = EXCLUDED.priority_tier,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Mark as seen
CREATE OR REPLACE FUNCTION mark_attention_seen(p_attention_id TEXT) RETURNS VOID AS $$
BEGIN
    UPDATE allan_attention_queue
    SET status = 'seen', seen_at = CURRENT_TIMESTAMP
    WHERE attention_id = p_attention_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Mark as actioned
CREATE OR REPLACE FUNCTION mark_attention_actioned(p_attention_id TEXT) RETURNS VOID AS $$
BEGIN
    UPDATE allan_attention_queue
    SET status = 'actioned', actioned_at = CURRENT_TIMESTAMP
    WHERE attention_id = p_attention_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Snooze item
CREATE OR REPLACE FUNCTION snooze_attention(p_attention_id TEXT, p_hours INTEGER) RETURNS VOID AS $$
BEGIN
    UPDATE allan_attention_queue
    SET status = 'snoozed', snoozed_until = NOW() + (p_hours || ' hours')::INTERVAL
    WHERE attention_id = p_attention_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE allan_attention_queue IS 'Unified attention management: emails, SMS, system alerts, opportunities, news - everything that needs Allans attention';
COMMENT ON COLUMN allan_attention_queue.priority_tier IS 'Top7_Important (most important), Top3_Urgent (most urgent), Emergency (SMS/critical), Opportunity (revenue), Alert (system), FYI (info only)';
COMMENT ON COLUMN allan_attention_queue.attention_type IS 'email, sms, system_alert, opportunity, news, security, revenue, relationship';
COMMENT ON VIEW allan_top10 IS 'The 10 items Allan should see: 7 most important + 3 most urgent (excluding duplicates)';
