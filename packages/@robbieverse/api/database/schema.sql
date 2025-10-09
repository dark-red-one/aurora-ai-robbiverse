-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Conversations table
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    context_type TEXT NOT NULL CHECK (context_type IN ('code', 'chat', 'strategy', 'business')),
    title TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table with vector embeddings
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimension
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Code blocks (RobbieBlocks) with vector embeddings
CREATE TABLE code_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_path TEXT NOT NULL,
    content TEXT NOT NULL,
    language TEXT NOT NULL,
    embedding VECTOR(1536),
    tags TEXT[] DEFAULT '{}',
    session_id TEXT NOT NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learned patterns with vector embeddings
CREATE TABLE learned_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('api_convention', 'component_pattern', 'error_handling', 'architecture')),
    example TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    last_used TIMESTAMPTZ DEFAULT NOW(),
    embedding VECTOR(1536),
    user_id TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_context_type ON conversations(context_type);
CREATE INDEX idx_conversations_timestamp ON conversations(timestamp);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_messages_role ON messages(role);

CREATE INDEX idx_code_blocks_session_id ON code_blocks(session_id);
CREATE INDEX idx_code_blocks_file_path ON code_blocks(file_path);
CREATE INDEX idx_code_blocks_language ON code_blocks(language);
CREATE INDEX idx_code_blocks_tags ON code_blocks USING GIN(tags);

CREATE INDEX idx_learned_patterns_user_id ON learned_patterns(user_id);
CREATE INDEX idx_learned_patterns_pattern_type ON learned_patterns(pattern_type);
CREATE INDEX idx_learned_patterns_frequency ON learned_patterns(frequency);

-- Vector similarity search indexes
CREATE INDEX ON messages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON code_blocks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON learned_patterns USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS (Row Level Security) policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_patterns ENABLE ROW LEVEL SECURITY;

-- For now, allow all access (we'll add proper auth later)
CREATE POLICY "Allow all for conversations" ON conversations FOR ALL USING (true);
CREATE POLICY "Allow all for messages" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all for code_blocks" ON code_blocks FOR ALL USING (true);
CREATE POLICY "Allow all for learned_patterns" ON learned_patterns FOR ALL USING (true);

-- Functions for vector similarity search
CREATE OR REPLACE FUNCTION search_conversations(
    query_embedding VECTOR(1536),
    user_id_param TEXT,
    match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    similarity FLOAT,
    source_type TEXT
)
LANGUAGE SQL
AS $$
    SELECT 
        c.id,
        c.summary as content,
        1 - (c.summary_embedding <=> query_embedding) as similarity,
        'conversation' as source_type
    FROM conversations c
    WHERE c.user_id = user_id_param 
        AND c.summary_embedding IS NOT NULL
    ORDER BY c.summary_embedding <=> query_embedding
    LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION search_code_blocks(
    query_embedding VECTOR(1536),
    user_id_param TEXT,
    match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    similarity FLOAT,
    source_type TEXT,
    file_path TEXT,
    language TEXT
)
LANGUAGE SQL
AS $$
    SELECT 
        cb.id,
        cb.content,
        1 - (cb.embedding <=> query_embedding) as similarity,
        'code_block' as source_type,
        cb.file_path,
        cb.language
    FROM code_blocks cb
    WHERE cb.embedding IS NOT NULL
    ORDER BY cb.embedding <=> query_embedding
    LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION search_messages(
    query_embedding VECTOR(1536),
    user_id_param TEXT,
    match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    similarity FLOAT,
    source_type TEXT,
    conversation_id UUID
)
LANGUAGE SQL
AS $$
    SELECT 
        m.id,
        m.content,
        1 - (m.embedding <=> query_embedding) as similarity,
        'message' as source_type,
        m.conversation_id
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE c.user_id = user_id_param 
        AND m.embedding IS NOT NULL
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
$$;

