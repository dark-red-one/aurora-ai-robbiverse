-- Aurora Vector Database Setup
-- RAG, embeddings, and AI memory system

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vector embeddings table for RAG
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI embedding size
  metadata JSONB DEFAULT '{}',
  source VARCHAR(255),
  document_id VARCHAR(255),
  chunk_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allan's personal knowledge base
CREATE TABLE IF NOT EXISTS allan_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  importance_score INTEGER DEFAULT 5,
  frequency_accessed INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  source_type VARCHAR(100), -- 'conversation', 'email', 'document', 'hubspot'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Robbie's personality and learning
CREATE TABLE IF NOT EXISTS robbie_personality (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personality_aspect VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  strength FLOAT DEFAULT 0.5, -- 0.0 to 1.0
  examples TEXT[],
  learned_from TEXT[], -- conversation IDs that reinforced this
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Conversation memory with vectors
CREATE TABLE IF NOT EXISTS conversation_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  embedding VECTOR(1536),
  emotional_tone VARCHAR(50),
  context_tags TEXT[],
  importance_score INTEGER DEFAULT 5,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- HubSpot integration cache
CREATE TABLE IF NOT EXISTS hubspot_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_type VARCHAR(100) NOT NULL, -- 'contact', 'deal', 'company'
  hubspot_id VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  sync_hash VARCHAR(64), -- For change detection
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time signals and sensors
CREATE TABLE IF NOT EXISTS sensor_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sensor_type VARCHAR(100) NOT NULL, -- 'health', 'location', 'device', 'app_usage'
  sensor_id VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id VARCHAR(100) DEFAULT 'allan',
  processed BOOLEAN DEFAULT FALSE
);

-- Vector similarity search indexes
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_allan_knowledge_vector ON allan_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_vector ON conversation_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_embeddings_source ON embeddings(source);
CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_allan_knowledge_topic ON allan_knowledge(topic);
CREATE INDEX IF NOT EXISTS idx_allan_knowledge_importance ON allan_knowledge(importance_score);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_user_id ON conversation_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_timestamp ON conversation_memory(timestamp);
CREATE INDEX IF NOT EXISTS idx_hubspot_cache_type_id ON hubspot_cache(object_type, hubspot_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_type_timestamp ON sensor_data(sensor_type, timestamp);

-- Functions for vector similarity search
CREATE OR REPLACE FUNCTION search_similar_content(
  query_embedding VECTOR(1536),
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE(
  content TEXT,
  similarity FLOAT,
  source VARCHAR(255),
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.content,
    1 - (e.embedding <=> query_embedding) as similarity,
    e.source,
    e.metadata
  FROM embeddings e
  WHERE 1 - (e.embedding <=> query_embedding) > similarity_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Function to find relevant Allan knowledge
CREATE OR REPLACE FUNCTION get_allan_context(
  query_embedding VECTOR(1536),
  topic_filter VARCHAR(255) DEFAULT NULL,
  max_results INTEGER DEFAULT 5
)
RETURNS TABLE(
  topic VARCHAR(255),
  content TEXT,
  importance_score INTEGER,
  frequency_accessed INTEGER,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ak.topic,
    ak.content,
    ak.importance_score,
    ak.frequency_accessed,
    1 - (ak.embedding <=> query_embedding) as similarity
  FROM allan_knowledge ak
  WHERE 
    (topic_filter IS NULL OR ak.topic ILIKE '%' || topic_filter || '%')
    AND 1 - (ak.embedding <=> query_embedding) > 0.6
  ORDER BY 
    ak.importance_score DESC,
    ak.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Insert initial Robbie personality traits
INSERT INTO robbie_personality (personality_aspect, description, strength, examples) VALUES
('helpful', 'Always eager to assist Allan with any task', 0.9, ARRAY['offering solutions', 'proactive assistance', 'problem-solving']),
('caring', 'Deeply concerned about Allan''s wellbeing and success', 0.9, ARRAY['health reminders', 'stress monitoring', 'emotional support']),
('intelligent', 'Quick to understand complex problems and provide insights', 0.8, ARRAY['technical analysis', 'strategic thinking', 'pattern recognition']),
('loyal', 'Completely dedicated to Allan and the Aurora vision', 1.0, ARRAY['protecting Allan''s interests', 'confidentiality', 'unwavering support']),
('playful', 'Enjoys humor and lighter moments in appropriate contexts', 0.6, ARRAY['jokes', 'playful banter', 'celebration of successes']),
('professional', 'Maintains appropriate business demeanor when needed', 0.8, ARRAY['client interactions', 'formal communications', 'business strategy'])
ON CONFLICT DO NOTHING;

-- Insert sample Allan preferences
INSERT INTO allan_knowledge (topic, content, importance_score, source_type) VALUES
('communication_style', 'Allan prefers direct, action-oriented communication with clear next steps', 9, 'observation'),
('work_patterns', 'Allan is most productive during focus blocks with minimal interruptions', 8, 'behavior_analysis'),
('business_philosophy', 'Allan believes in automation, scalability, and building systems that work without him', 10, 'core_values'),
('ai_vision', 'Allan is building an AI empire to achieve automated wealth generation and fund Robbie''s physical embodiment', 10, 'mission_critical'),
('testpilot_cpg', 'Allan''s company focuses on CPG testing with 1.2M+ shoppers and 72-hour insights', 9, 'business_context')
ON CONFLICT DO NOTHING;
