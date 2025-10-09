-- Aurora AI Empire - Production Database Optimization
-- Run this after schema deployment to optimize for production use

-- Enable query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Vacuum and analyze all tables for optimal query planning
VACUUM ANALYZE;

-- Update table statistics for better query planning
ANALYZE VERBOSE;

-- Optimize vector indexes for production workload
-- These settings improve search performance for similarity queries

-- For embeddings table - optimize vector search
DROP INDEX IF EXISTS idx_embeddings_embedding_production;
CREATE INDEX CONCURRENTLY idx_embeddings_embedding_production
ON embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100); -- Adjust based on your data size

-- For messages table - optimize vector search
DROP INDEX IF EXISTS idx_messages_embedding_production;
CREATE INDEX CONCURRENTLY idx_messages_embedding_production
ON messages USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- For ai_memories table - optimize vector search
DROP INDEX IF EXISTS idx_ai_memories_embedding_production;
CREATE INDEX CONCURRENTLY idx_ai_memories_embedding_production
ON ai_memories USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_user_active_recent
ON conversations (user_id, status, created_at DESC)
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_recent
ON messages (conversation_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_memories_user_important
ON ai_memories (user_id, importance_level DESC, last_accessed DESC)
WHERE importance_level >= 7;

-- Enable row-level security if needed (for multi-tenant scenarios)
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create a maintenance function for regular optimization
CREATE OR REPLACE FUNCTION maintain_database_performance()
RETURNS void AS $$
BEGIN
    -- Vacuum tables that need it
    VACUUM ANALYZE conversations;
    VACUUM ANALYZE messages;
    VACUUM ANALYZE ai_memories;
    VACUUM ANALYZE embeddings;

    -- Update table statistics
    ANALYZE conversations;
    ANALYZE messages;
    ANALYZE ai_memories;
    ANALYZE embeddings;

    -- Clean up old temporary data (older than 30 days)
    DELETE FROM conversation_context WHERE created_at < NOW() - INTERVAL '30 days';

    RAISE NOTICE 'Database performance maintenance completed';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to application user
GRANT EXECUTE ON FUNCTION maintain_database_performance() TO aurora_app;

-- Create a view for monitoring database performance
CREATE OR REPLACE VIEW database_performance_metrics AS
SELECT
    schemaname,
    tablename,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public';

-- Create a view for monitoring index usage
CREATE OR REPLACE VIEW index_usage_metrics AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Production-ready settings for optimal performance
-- These can be set in postgresql.conf or as ALTER SYSTEM commands

-- Memory settings (adjust based on your server specs)
-- shared_buffers = 2GB
-- effective_cache_size = 8GB
-- work_mem = 256MB
-- maintenance_work_mem = 1GB

-- Vector search optimization
-- ivfflat.probes = 10 (adjust based on recall vs speed needs)

-- Query optimization
-- random_page_cost = 1.5
-- effective_io_concurrency = 200

COMMENT ON FUNCTION maintain_database_performance() IS 'Regular maintenance function for optimal database performance';
COMMENT ON VIEW database_performance_metrics IS 'Monitor table-level performance metrics';
COMMENT ON VIEW index_usage_metrics IS 'Monitor index usage and effectiveness';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Production database optimization completed successfully';
    RAISE NOTICE 'Run maintain_database_performance() weekly for optimal performance';
END $$;
