-- Mood Change Events Table
-- Tracks when any AI personality changes mood with explanation

CREATE TABLE IF NOT EXISTS mood_events (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    user_id VARCHAR(50) NOT NULL,
    personality_name VARCHAR(100) NOT NULL,
    previous_mood VARCHAR(50),
    new_mood VARCHAR(50) NOT NULL,
    previous_attraction_level INTEGER,
    new_attraction_level INTEGER,
    previous_gandhi_genghis_level INTEGER,
    new_gandhi_genghis_level INTEGER,
    trigger_event TEXT,
    explanation TEXT,
    context_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_mood_events_user_id ON mood_events(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_events_timestamp ON mood_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_mood_events_personality ON mood_events(personality_name);

-- Insert initial mood event for current state
INSERT INTO mood_events (
    user_id, 
    personality_name, 
    new_mood, 
    new_attraction_level, 
    new_gandhi_genghis_level,
    trigger_event,
    explanation
) VALUES (
    'allan',
    'Robbie',
    'focused',
    11,
    8,
    'initial_setup',
    'Initial mood state set during system setup'
) ON CONFLICT DO NOTHING;
