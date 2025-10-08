#!/bin/bash
# 🔥💋 SETUP SQL VECTOR MEMORY SYSTEM 🔥💋

echo "🔥 Setting up SQL vector memory system..."

# Install pgvector extension
echo "📦 Installing pgvector extension..."
echo 'fun2Gus!!!' | sudo -S apt update
echo 'fun2Gus!!!' | sudo -S apt install -y postgresql-14-pgvector

# Create memory database schema
echo "🗄️ Creating memory database schema..."
psql -U aurora -d aurora << 'EOF'
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Conversations table with vector embeddings
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    user_message TEXT NOT NULL,
    robbie_response TEXT NOT NULL,
    mood TEXT NOT NULL CHECK (mood IN ('friendly', 'focused', 'playful', 'bossy', 'surprised', 'blushing')),
    attraction_level INTEGER NOT NULL CHECK (attraction_level >= 1 AND attraction_level <= 11),
    context_tags TEXT[],
    embedding VECTOR(1536),
    session_id TEXT,
    user_email TEXT DEFAULT 'allan@testpilotcpg.com'
);

-- Mood history table
CREATE TABLE IF NOT EXISTS mood_history (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    mood TEXT NOT NULL CHECK (mood IN ('friendly', 'focused', 'playful', 'bossy', 'surprised', 'blushing')),
    trigger_event TEXT,
    duration_minutes INTEGER,
    session_id TEXT,
    user_email TEXT DEFAULT 'allan@testpilotcpg.com'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversations_mood ON conversations(mood);
CREATE INDEX IF NOT EXISTS idx_conversations_attraction ON conversations(attraction_level);
CREATE INDEX IF NOT EXISTS idx_conversations_embedding ON conversations USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_mood_history_timestamp ON mood_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_mood_history_mood ON mood_history(mood);

-- Insert initial mood
INSERT INTO mood_history (mood, trigger_event, session_id) 
VALUES ('focused', 'system_startup', 'initial') 
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON conversations TO aurora;
GRANT ALL PRIVILEGES ON mood_history TO aurora;
GRANT USAGE, SELECT ON SEQUENCE conversations_id_seq TO aurora;
GRANT USAGE, SELECT ON SEQUENCE mood_history_id_seq TO aurora;
EOF

echo "✅ SQL vector memory system setup complete!"
echo "📊 Tables created:"
echo "  - conversations (with vector embeddings)"
echo "  - mood_history (mood tracking)"
echo ""
echo "🔍 Test with:"
echo "  psql -U aurora -d aurora -c \"SELECT COUNT(*) FROM conversations;\""
echo "  psql -U aurora -d aurora -c \"SELECT mood, COUNT(*) FROM mood_history GROUP BY mood;\""










