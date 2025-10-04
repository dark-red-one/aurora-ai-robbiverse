-- Aurora Unified Database Schema
-- Part 3: Vector Storage & RAG System
-- Version: 1.0.0
-- Date: September 19, 2025

-- ============================================
-- VECTOR EMBEDDINGS & RAG
-- ============================================

-- Main embeddings table for all vector storage
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI embedding size
  metadata JSONB DEFAULT '{}'::jsonb,
  source_type VARCHAR(50) CHECK (source_type IN (
    'document', 'webpage', 'email', 'chat', 'code', 
    'image_description', 'audio_transcript', 'video_transcript'
  )),
  source_url TEXT,
  document_id VARCHAR(255),
  chunk_index INTEGER DEFAULT 0,
  chunk_total INTEGER DEFAULT 1,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  accessed_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ
);

CREATE INDEX idx_embeddings_embedding ON embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_embeddings_source_type ON embeddings(source_type);
CREATE INDEX idx_embeddings_document_id ON embeddings(document_id);
CREATE INDEX idx_embeddings_user_id ON embeddings(user_id);
CREATE INDEX idx_embeddings_is_public ON embeddings(is_public);
CREATE INDEX idx_embeddings_created_at ON embeddings(created_at);

-- ============================================
-- KNOWLEDGE BASE
-- ============================================

-- Structured knowledge storage
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic VARCHAR(255) NOT NULL,
  title VARCHAR(500),
  content TEXT NOT NULL,
  summary TEXT,
  embedding VECTOR(1536),
  category VARCHAR(100) CHECK (category IN (
    'technical', 'business', 'personal', 'historical', 
    'scientific', 'creative', 'reference', 'tutorial'
  )),
  importance_score INTEGER DEFAULT 5 CHECK (importance_score BETWEEN 1 AND 10),
  confidence_score FLOAT DEFAULT 1.0 CHECK (confidence_score BETWEEN 0 AND 1),
  source_references TEXT[],
  related_topics TEXT[],
  prerequisites TEXT[], -- Topics that should be understood first
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_knowledge_base_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_knowledge_base_topic ON knowledge_base(topic);
CREATE INDEX idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_base_importance ON knowledge_base(importance_score);
CREATE INDEX idx_knowledge_base_is_public ON knowledge_base(is_public);
CREATE INDEX idx_knowledge_base_related_topics ON knowledge_base USING gin(related_topics);

-- ============================================
-- DOCUMENT PROCESSING
-- ============================================

-- Track processed documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(500),
  file_path TEXT,
  file_hash VARCHAR(64), -- SHA-256 hash for deduplication
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  content_extracted TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN (
    'pending', 'processing', 'completed', 'failed', 'skipped'
  )),
  processing_error TEXT,
  chunk_count INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  page_count INTEGER DEFAULT 0,
  language VARCHAR(10),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMPTZ,
  UNIQUE(file_hash)
);

CREATE INDEX idx_documents_file_hash ON documents(file_hash);
CREATE INDEX idx_documents_processing_status ON documents(processing_status);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_created_at ON documents(created_at);

-- ============================================
-- SEARCH & RETRIEVAL
-- ============================================

-- Track search queries and results
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  query_embedding VECTOR(1536),
  search_type VARCHAR(50) CHECK (search_type IN ('semantic', 'keyword', 'hybrid', 'sql')),
  filters JSONB DEFAULT '{}'::jsonb,
  results_count INTEGER DEFAULT 0,
  top_results JSONB DEFAULT '[]'::jsonb, -- Store top N result IDs and scores
  execution_time_ms INTEGER,
  user_feedback VARCHAR(20) CHECK (user_feedback IN ('helpful', 'not_helpful', 'neutral')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_query_embedding ON search_history USING ivfflat (query_embedding vector_cosine_ops);
CREATE INDEX idx_search_history_search_type ON search_history(search_type);
CREATE INDEX idx_search_history_created_at ON search_history(created_at);

-- ============================================
-- COLLECTIONS & ORGANIZATION
-- ============================================

-- Organize embeddings into collections
CREATE TABLE IF NOT EXISTS embedding_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, user_id)
);

CREATE INDEX idx_embedding_collections_user_id ON embedding_collections(user_id);
CREATE INDEX idx_embedding_collections_is_public ON embedding_collections(is_public);

-- Many-to-many relationship between embeddings and collections
CREATE TABLE IF NOT EXISTS embedding_collection_items (
  collection_id UUID REFERENCES embedding_collections(id) ON DELETE CASCADE,
  embedding_id UUID REFERENCES embeddings(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  added_by UUID REFERENCES users(id),
  notes TEXT,
  PRIMARY KEY (collection_id, embedding_id)
);

CREATE INDEX idx_collection_items_collection_id ON embedding_collection_items(collection_id);
CREATE INDEX idx_collection_items_embedding_id ON embedding_collection_items(embedding_id);

-- ============================================
-- CACHING & PERFORMANCE
-- ============================================

-- Cache frequently accessed embeddings
CREATE TABLE IF NOT EXISTS embedding_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_embedding_cache_key ON embedding_cache(cache_key);
CREATE INDEX idx_embedding_cache_expires_at ON embedding_cache(expires_at);

-- ============================================
-- FUNCTIONS & PROCEDURES
-- ============================================

-- Function to find similar embeddings
CREATE OR REPLACE FUNCTION find_similar_embeddings(
  query_embedding VECTOR(1536),
  limit_count INTEGER DEFAULT 10,
  threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.content,
    1 - (e.embedding <=> query_embedding) AS similarity,
    e.metadata
  FROM embeddings e
  WHERE 1 - (e.embedding <=> query_embedding) > threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM embedding_cache WHERE expires_at < CURRENT_TIMESTAMP;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SCHEDULED MAINTENANCE
-- ============================================

-- Create extension for scheduling if not exists
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cache cleanup every hour
SELECT cron.schedule('clean-embedding-cache', '0 * * * *', 'SELECT clean_expired_cache();');



