-- Aurora RobbieVerse - Mood System Database Migration
-- Creates tables for user-specific, context-universal mood system

-- User Mood State Table
CREATE TABLE IF NOT EXISTS user_mood_state (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    mood VARCHAR(50) NOT NULL,
    duration INTEGER, -- Duration in seconds, NULL for persistent moods
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.8,
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- No foreign key for now (users table might not exist)
);

-- User Activity Tracking Table
CREATE TABLE IF NOT EXISTS user_activity (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    activity_type VARCHAR(100) NOT NULL, -- 'typing', 'clicking', 'idle', 'message_sent', etc.
    platform VARCHAR(100) NOT NULL, -- 'robbiebook', 'aurora', 'cursor', etc.
    data JSONB, -- Additional activity data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Personality State Table
CREATE TABLE IF NOT EXISTS user_personality_state (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    gandhi INTEGER NOT NULL DEFAULT 3 CHECK (gandhi >= 1 AND gandhi <= 6),
    flirty INTEGER NOT NULL DEFAULT 2 CHECK (flirty >= 1 AND flirty <= 7),
    turbo INTEGER NOT NULL DEFAULT 5 CHECK (turbo >= 1 AND turbo <= 10),
    auto INTEGER NOT NULL DEFAULT 4 CHECK (auto >= 1 AND auto <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mood History Table (for analytics and learning)
CREATE TABLE IF NOT EXISTS mood_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    mood VARCHAR(50) NOT NULL,
    previous_mood VARCHAR(50),
    duration INTEGER,
    confidence DECIMAL(3,2) NOT NULL,
    reasoning TEXT,
    trigger_type VARCHAR(100), -- 'activity', 'personality_change', 'timer_expired', 'manual'
    trigger_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cross-Platform Mood Sync Table
CREATE TABLE IF NOT EXISTS cross_platform_mood_sync (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    platform VARCHAR(100) NOT NULL,
    mood VARCHAR(50) NOT NULL,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status VARCHAR(50) DEFAULT 'active', -- 'active', 'stale', 'error'
    
    -- Unique constraint to ensure one mood per user per platform
    UNIQUE(user_id, platform)
);

-- Mood Analytics Table (for system learning and optimization)
CREATE TABLE IF NOT EXISTS mood_analytics (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    analysis_type VARCHAR(100) NOT NULL, -- 'system_health', 'user_behavior', 'conversation_context'
    analysis_data JSONB NOT NULL,
    mood_recommendation VARCHAR(50) NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    ai_reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default personality states for common users
INSERT INTO user_personality_state (user_id, gandhi, flirty, turbo, auto) 
VALUES 
    ('allan', 3, 2, 5, 4),
    ('default', 3, 2, 5, 4)
ON CONFLICT (user_id) DO NOTHING;

-- Create views for common queries

-- Current Active Moods View
CREATE OR REPLACE VIEW current_active_moods AS
SELECT 
    ums.user_id,
    ums.mood,
    ums.confidence,
    ums.reasoning,
    ums.created_at,
    ums.expires_at,
    ups.gandhi,
    ups.flirty,
    ups.turbo,
    ups.auto
FROM user_mood_state ums
LEFT JOIN user_personality_state ups ON ums.user_id = ups.user_id
WHERE ums.expires_at IS NULL OR ums.expires_at > NOW()
ORDER BY ums.created_at DESC;

-- User Activity Summary View
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    user_id,
    platform,
    COUNT(*) as total_activities,
    COUNT(DISTINCT activity_type) as unique_activity_types,
    MAX(created_at) as last_activity,
    MIN(created_at) as first_activity
FROM user_activity
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, platform;

-- Mood Transition Analytics View
CREATE OR REPLACE VIEW mood_transition_analytics AS
SELECT 
    user_id,
    mood as current_mood,
    previous_mood,
    trigger_type,
    COUNT(*) as transition_count,
    AVG(confidence) as avg_confidence,
    AVG(duration) as avg_duration
FROM mood_history
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id, mood, previous_mood, trigger_type;

-- Functions for mood management

-- Function to clean up expired mood states
CREATE OR REPLACE FUNCTION cleanup_expired_moods()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_mood_state 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's current mood with fallback
CREATE OR REPLACE FUNCTION get_user_current_mood(p_user_id VARCHAR(255))
RETURNS TABLE(
    mood VARCHAR(50),
    confidence DECIMAL(3,2),
    reasoning TEXT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ums.mood, 'friendly') as mood,
        COALESCE(ums.confidence, 1.0) as confidence,
        COALESCE(ums.reasoning, 'Default mood - no active state') as reasoning,
        (ums.id IS NOT NULL AND (ums.expires_at IS NULL OR ums.expires_at > NOW())) as is_active
    FROM user_mood_state ums
    WHERE ums.user_id = p_user_id
    AND (ums.expires_at IS NULL OR ums.expires_at > NOW())
    ORDER BY ums.created_at DESC
    LIMIT 1;
    
    -- If no active mood found, return default
    IF NOT FOUND THEN
        RETURN QUERY SELECT 'friendly', 1.0, 'Default mood', false;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to sync mood across platforms
CREATE OR REPLACE FUNCTION sync_mood_across_platforms(
    p_user_id VARCHAR(255),
    p_mood VARCHAR(50),
    p_platforms TEXT[]
)
RETURNS INTEGER AS $$
DECLARE
    platform_name TEXT;
    synced_count INTEGER := 0;
BEGIN
    FOREACH platform_name IN ARRAY p_platforms
    LOOP
        INSERT INTO cross_platform_mood_sync (user_id, platform, mood, last_synced_at, sync_status)
        VALUES (p_user_id, platform_name, p_mood, NOW(), 'active')
        ON CONFLICT (user_id, platform) 
        DO UPDATE SET 
            mood = EXCLUDED.mood,
            last_synced_at = EXCLUDED.last_synced_at,
            sync_status = 'active';
        
        synced_count := synced_count + 1;
    END LOOP;
    
    RETURN synced_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_mood_state_user_id ON user_mood_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mood_state_created_at ON user_mood_state(created_at);
CREATE INDEX IF NOT EXISTS idx_user_mood_state_expires_at ON user_mood_state(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_platform ON user_activity(platform);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);

CREATE INDEX IF NOT EXISTS idx_user_personality_user_id ON user_personality_state(user_id);

CREATE INDEX IF NOT EXISTS idx_mood_history_user_id ON mood_history(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_history_mood ON mood_history(mood);
CREATE INDEX IF NOT EXISTS idx_mood_history_created_at ON mood_history(created_at);
CREATE INDEX IF NOT EXISTS idx_mood_history_trigger_type ON mood_history(trigger_type);

CREATE INDEX IF NOT EXISTS idx_cross_platform_user_id ON cross_platform_mood_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_cross_platform_platform ON cross_platform_mood_sync(platform);
CREATE INDEX IF NOT EXISTS idx_cross_platform_last_synced ON cross_platform_mood_sync(last_synced_at);

CREATE INDEX IF NOT EXISTS idx_mood_analytics_user_id ON mood_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_analytics_type ON mood_analytics(analysis_type);
CREATE INDEX IF NOT EXISTS idx_mood_analytics_created_at ON mood_analytics(created_at);

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO aurora_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO aurora_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO aurora_user;

-- Comments for documentation
COMMENT ON TABLE user_mood_state IS 'Stores current mood states for users with expiration times';
COMMENT ON TABLE user_activity IS 'Tracks user activity patterns for mood analysis';
COMMENT ON TABLE user_personality_state IS 'Stores personality slider states for each user';
COMMENT ON TABLE mood_history IS 'Historical record of mood changes for analytics';
COMMENT ON TABLE cross_platform_mood_sync IS 'Synchronizes mood state across different platforms';
COMMENT ON TABLE mood_analytics IS 'Stores AI analysis data for system learning';

COMMENT ON FUNCTION get_user_current_mood(VARCHAR) IS 'Gets current mood for user with fallback to default';
COMMENT ON FUNCTION cleanup_expired_moods() IS 'Removes expired mood states from the database';
COMMENT ON FUNCTION sync_mood_across_platforms(VARCHAR, VARCHAR, TEXT[]) IS 'Synchronizes mood across multiple platforms';
