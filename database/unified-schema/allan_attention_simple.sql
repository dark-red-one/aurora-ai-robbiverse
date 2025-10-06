-- ALLAN ATTENTION QUEUE - SIMPLIFIED
-- Surface/Submerge principle: What needs Allan's attention RIGHT NOW

CREATE TABLE IF NOT EXISTS allan_attention (
    id SERIAL PRIMARY KEY,
    
    -- Identity
    attention_id TEXT UNIQUE NOT NULL,
    attention_type TEXT NOT NULL,  -- 'email', 'sms', 'system_alert', 'opportunity'
    source_system TEXT NOT NULL,
    
    -- Content
    title TEXT NOT NULL,
    summary TEXT,
    from_who TEXT,
    
    -- Scoring
    importance_score DECIMAL(5,2) DEFAULT 0,
    urgency_score DECIMAL(5,2) DEFAULT 0,
    
    -- Surface/Submerge status
    is_surfaced BOOLEAN DEFAULT FALSE,  -- Is it currently in Allan's attention?
    surfaced_at TIMESTAMP,
    submerged_at TIMESTAMP,
    
    -- Relations
    interaction_id INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attention_surfaced ON allan_attention(is_surfaced) WHERE is_surfaced = TRUE;
CREATE INDEX IF NOT EXISTS idx_attention_importance ON allan_attention(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_attention_urgency ON allan_attention(urgency_score DESC);

-- View: Currently surfaced (Allan's active attention)
CREATE OR REPLACE VIEW allan_attention_surfaced AS
SELECT *
FROM allan_attention
WHERE is_surfaced = TRUE
ORDER BY importance_score DESC, urgency_score DESC, created_at DESC;

-- Function: Surface item
CREATE OR REPLACE FUNCTION surface_attention(p_attention_id TEXT) RETURNS VOID AS $$
BEGIN
    UPDATE allan_attention
    SET is_surfaced = TRUE, surfaced_at = CURRENT_TIMESTAMP
    WHERE attention_id = p_attention_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Submerge item
CREATE OR REPLACE FUNCTION submerge_attention(p_attention_id TEXT) RETURNS VOID AS $$
BEGIN
    UPDATE allan_attention
    SET is_surfaced = FALSE, submerged_at = CURRENT_TIMESTAMP
    WHERE attention_id = p_attention_id;
END;
$$ LANGUAGE plpgsql;
