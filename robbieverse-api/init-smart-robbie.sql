-- Smart Robbie@Code Database Schema
-- Simplified version for code memory and conversation tracking
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;
-- ==================================================================
-- CONVERSATIONS & MESSAGES  
-- ==================================================================
CREATE TABLE IF NOT EXISTS code_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'allan',
    session_id TEXT NOT NULL,
    title TEXT,
    context_type TEXT DEFAULT 'code' CHECK (
        context_type IN ('code', 'chat', 'debug', 'refactor')
    ),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX idx_code_conversations_user_id ON code_conversations(user_id);
CREATE INDEX idx_code_conversations_session_id ON code_conversations(session_id);
CREATE INDEX idx_code_conversations_created_at ON code_conversations(created_at);
-- Messages with vector embeddings
CREATE TABLE IF NOT EXISTS code_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES code_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    -- OpenAI text-embedding-3-small
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX idx_code_messages_conversation_id ON code_messages(conversation_id);
CREATE INDEX idx_code_messages_role ON code_messages(role);
CREATE INDEX idx_code_messages_embedding ON code_messages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- ==================================================================
-- CODE BLOCKS (RobbieBlocks for Code)
-- ==================================================================
CREATE TABLE IF NOT EXISTS code_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path TEXT NOT NULL,
    language TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    tags TEXT [] DEFAULT '{}',
    session_id TEXT NOT NULL,
    conversation_id UUID REFERENCES code_conversations(id) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX idx_code_blocks_file_path ON code_blocks(file_path);
CREATE INDEX idx_code_blocks_language ON code_blocks(language);
CREATE INDEX idx_code_blocks_session_id ON code_blocks(session_id);
CREATE INDEX idx_code_blocks_embedding ON code_blocks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_code_blocks_tags ON code_blocks USING gin(tags);
-- ==================================================================
-- LEARNED PATTERNS
-- ==================================================================
CREATE TABLE IF NOT EXISTS learned_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'allan',
    pattern_type TEXT NOT NULL CHECK (
        pattern_type IN (
            'api_convention',
            'component_pattern',
            'error_handling',
            'architecture',
            'testing'
        )
    ),
    pattern_name TEXT NOT NULL,
    example_code TEXT NOT NULL,
    explanation TEXT,
    embedding VECTOR(1536),
    frequency INTEGER DEFAULT 1,
    last_used TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX idx_learned_patterns_user_id ON learned_patterns(user_id);
CREATE INDEX idx_learned_patterns_pattern_type ON learned_patterns(pattern_type);
CREATE INDEX idx_learned_patterns_frequency ON learned_patterns(frequency DESC);
CREATE INDEX idx_learned_patterns_embedding ON learned_patterns USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- ==================================================================
-- ROBBIE PERSONALITY STATE
-- ==================================================================
CREATE TABLE IF NOT EXISTS robbie_personality_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'allan',
    current_mood TEXT DEFAULT 'focused' CHECK (
        current_mood IN (
            'friendly',
            'focused',
            'playful',
            'bossy',
            'surprised',
            'blushing'
        )
    ),
    gandhi_genghis_level INTEGER DEFAULT 5 CHECK (
        gandhi_genghis_level BETWEEN 1 AND 10
    ),
    attraction_level INTEGER DEFAULT 5 CHECK (
        attraction_level BETWEEN 1 AND 11
    ),
    context JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
-- Initialize Allan's personality state
INSERT INTO robbie_personality_state (
        user_id,
        current_mood,
        gandhi_genghis_level,
        attraction_level
    )
VALUES ('allan', 'focused', 7, 8) ON CONFLICT (user_id) DO NOTHING;
-- ==================================================================
-- VECTOR SEARCH FUNCTIONS
-- ==================================================================
-- Search code messages by semantic similarity
CREATE OR REPLACE FUNCTION search_code_messages(
        query_embedding VECTOR(1536),
        user_id_param TEXT DEFAULT 'allan',
        match_count INTEGER DEFAULT 5,
        similarity_threshold FLOAT DEFAULT 0.7
    ) RETURNS TABLE (
        id UUID,
        content TEXT,
        similarity FLOAT,
        conversation_id UUID,
        created_at TIMESTAMPTZ
    ) LANGUAGE SQL AS $$
SELECT cm.id,
    cm.content,
    1 - (cm.embedding <=> query_embedding) as similarity,
    cm.conversation_id,
    cm.created_at
FROM code_messages cm
    JOIN code_conversations cc ON cm.conversation_id = cc.id
WHERE cc.user_id = user_id_param
    AND cm.embedding IS NOT NULL
    AND 1 - (cm.embedding <=> query_embedding) >= similarity_threshold
ORDER BY cm.embedding <=> query_embedding
LIMIT match_count;
$$;
-- Search code blocks by semantic similarity
CREATE OR REPLACE FUNCTION search_code_blocks(
        query_embedding VECTOR(1536),
        match_count INTEGER DEFAULT 5,
        similarity_threshold FLOAT DEFAULT 0.7
    ) RETURNS TABLE (
        id UUID,
        file_path TEXT,
        language TEXT,
        content TEXT,
        similarity FLOAT,
        created_at TIMESTAMPTZ
    ) LANGUAGE SQL AS $$
SELECT cb.id,
    cb.file_path,
    cb.language,
    cb.content,
    1 - (cb.embedding <=> query_embedding) as similarity,
    cb.created_at
FROM code_blocks cb
WHERE cb.embedding IS NOT NULL
    AND 1 - (cb.embedding <=> query_embedding) >= similarity_threshold
ORDER BY cb.embedding <=> query_embedding
LIMIT match_count;
$$;
-- Search learned patterns
CREATE OR REPLACE FUNCTION search_learned_patterns(
        query_embedding VECTOR(1536),
        user_id_param TEXT DEFAULT 'allan',
        match_count INTEGER DEFAULT 5,
        similarity_threshold FLOAT DEFAULT 0.7
    ) RETURNS TABLE (
        id UUID,
        pattern_type TEXT,
        pattern_name TEXT,
        example_code TEXT,
        explanation TEXT,
        similarity FLOAT,
        frequency INTEGER
    ) LANGUAGE SQL AS $$
SELECT lp.id,
    lp.pattern_type,
    lp.pattern_name,
    lp.example_code,
    lp.explanation,
    1 - (lp.embedding <=> query_embedding) as similarity,
    lp.frequency
FROM learned_patterns lp
WHERE lp.user_id = user_id_param
    AND lp.embedding IS NOT NULL
    AND 1 - (lp.embedding <=> query_embedding) >= similarity_threshold
ORDER BY lp.embedding <=> query_embedding
LIMIT match_count;
$$;
-- ==================================================================
-- TRIGGERS
-- ==================================================================
-- Update conversation stats when new message added
CREATE OR REPLACE FUNCTION update_code_conversation_stats() RETURNS TRIGGER AS $$ BEGIN
UPDATE code_conversations
SET last_message_at = NEW.created_at,
    message_count = message_count + 1,
    updated_at = CURRENT_TIMESTAMP
WHERE id = NEW.conversation_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_code_conversation_stats
AFTER
INSERT ON code_messages FOR EACH ROW EXECUTE FUNCTION update_code_conversation_stats();
-- Update pattern frequency
CREATE OR REPLACE FUNCTION update_pattern_usage() RETURNS TRIGGER AS $$ BEGIN NEW.last_used = CURRENT_TIMESTAMP;
NEW.frequency = OLD.frequency + 1;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_pattern_usage BEFORE
UPDATE ON learned_patterns FOR EACH ROW
    WHEN (
        OLD.example_code IS DISTINCT
        FROM NEW.example_code
            OR OLD.last_used < CURRENT_TIMESTAMP - INTERVAL '1 hour'
    ) EXECUTE FUNCTION update_pattern_usage();
-- ==================================================================
-- SAMPLE DATA FOR TESTING
-- ==================================================================
-- Create a test conversation
DO $$
DECLARE conv_id UUID;
BEGIN
INSERT INTO code_conversations (user_id, session_id, title, context_type)
VALUES (
        'allan',
        'session_' || gen_random_uuid(),
        'Test Conversation',
        'code'
    )
RETURNING id INTO conv_id;
INSERT INTO code_messages (conversation_id, role, content)
VALUES (
        conv_id,
        'user',
        'How do I set up Postgres with pgvector?'
    ),
    (
        conv_id,
        'assistant',
        'To set up Postgres with pgvector, you can use Docker with the pgvector/pgvector:pg16 image...'
    );
END $$;
