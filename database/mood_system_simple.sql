-- Aurora RobbieVerse - Mood System Database Migration (Simplified)
-- Creates basic tables for user-specific, context-universal mood system

-- User Mood State Table
CREATE TABLE IF NOT EXISTS user_mood_state (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    mood VARCHAR(50) NOT NULL,
    duration INTEGER, -- Duration in seconds, NULL for persistent moods
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.8,
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
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

-- Insert default personality states for common users
INSERT INTO user_personality_state (user_id, gandhi, flirty, turbo, auto) 
VALUES 
    ('allan', 3, 2, 5, 4),
    ('default', 3, 2, 5, 4)
ON CONFLICT (user_id) DO NOTHING;

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_user_mood_state_user_id ON user_mood_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mood_state_created_at ON user_mood_state(created_at);
CREATE INDEX IF NOT EXISTS idx_user_mood_state_expires_at ON user_mood_state(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);

CREATE INDEX IF NOT EXISTS idx_user_personality_user_id ON user_personality_state(user_id);

