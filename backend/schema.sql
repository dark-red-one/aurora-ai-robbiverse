-- Robbie Memory System Database Schema
-- PostgreSQL with pgvector extension

-- Conversations table with vector embeddings
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    user_message TEXT NOT NULL,
    robbie_response TEXT,
    mood TEXT NOT NULL,
    attraction_level INTEGER NOT NULL CHECK (attraction_level >= 1 AND attraction_level <= 11),
    gandhi_genghis_level INTEGER DEFAULT 5 CHECK (gandhi_genghis_level >= 1 AND gandhi_genghis_level <= 10),
    context_tags TEXT[],
    user_id TEXT DEFAULT 'allan',
    session_id TEXT,
    embedding VECTOR(1536)
);

-- Mood history table
CREATE TABLE IF NOT EXISTS mood_history (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    mood TEXT NOT NULL,
    trigger_event TEXT,
    duration_minutes INTEGER,
    user_id TEXT DEFAULT 'allan',
    attraction_level INTEGER,
    gandhi_genghis_level INTEGER
);

-- Current mood state table (single row, updated on each mood change)
CREATE TABLE IF NOT EXISTS current_mood (
    id INTEGER PRIMARY KEY DEFAULT 1,
    mood TEXT NOT NULL DEFAULT 'friendly',
    attraction_level INTEGER NOT NULL DEFAULT 7,
    gandhi_genghis_level INTEGER NOT NULL DEFAULT 5,
    last_updated TIMESTAMP DEFAULT NOW(),
    user_id TEXT DEFAULT 'allan',
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default mood if not exists
INSERT INTO current_mood (id, mood, attraction_level, gandhi_genghis_level)
VALUES (1, 'friendly', 7, 5)
ON CONFLICT (id) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_mood ON conversations(mood);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_history_timestamp ON mood_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mood_history_user ON mood_history(user_id);

-- Vector similarity search index (using HNSW for fast approximate nearest neighbor)
CREATE INDEX IF NOT EXISTS idx_conversations_embedding ON conversations 
USING hnsw (embedding vector_cosine_ops);

-- Grant permissions to aurora_api user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aurora_api;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aurora_api;



