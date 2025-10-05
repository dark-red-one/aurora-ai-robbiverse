-- Aurora AI Empire - Production Database Cleanup
-- Remove development artifacts and test data for production deployment

-- Clean up any test data or development artifacts
-- WARNING: This script removes test data - backup before running in production

-- Remove any conversations with test users or obvious test data
DELETE FROM conversations
WHERE user_id IN (
    SELECT id FROM users
    WHERE username LIKE '%test%'
       OR email LIKE '%test%'
       OR username = 'test_user'
);

-- Remove any messages from test conversations
DELETE FROM messages
WHERE conversation_id NOT IN (SELECT id FROM conversations);

-- Clean up orphaned records
DELETE FROM conversation_context
WHERE conversation_id NOT IN (SELECT id FROM conversations);

DELETE FROM conversation_analytics
WHERE conversation_id NOT IN (SELECT id FROM conversations);

-- Remove any test embeddings or knowledge base entries
DELETE FROM embeddings
WHERE metadata->>'source' LIKE '%test%'
   OR content LIKE '%test data%'
   OR source_url LIKE '%localhost%';

DELETE FROM knowledge_base
WHERE metadata->>'category' = 'test'
   OR content LIKE '%test%';

-- Clean up old temporary context data (older than 7 days)
DELETE FROM conversation_context
WHERE created_at < NOW() - INTERVAL '7 days';

-- Remove any development/debug API keys
DELETE FROM api_keys
WHERE name LIKE '%test%'
   OR name LIKE '%debug%'
   OR created_at < NOW() - INTERVAL '30 days';

-- Clean up old audit logs (older than 90 days)
DELETE FROM audit_log
WHERE created_at < NOW() - INTERVAL '90 days';

-- Remove expired sessions
DELETE FROM sessions
WHERE expires_at < NOW();

-- Clean up any sessions older than 30 days
DELETE FROM sessions
WHERE created_at < NOW() - INTERVAL '30 days';

-- Optimize vector indexes after cleanup
REINDEX INDEX CONCURRENTLY idx_embeddings_embedding_production;
REINDEX INDEX CONCURRENTLY idx_messages_embedding_production;
REINDEX INDEX CONCURRENTLY idx_ai_memories_embedding_production;

-- Vacuum to reclaim space
VACUUM ANALYZE;

-- Update statistics for query planner
ANALYZE VERBOSE;

-- Log cleanup completion
DO $$
DECLARE
    deleted_conversations INTEGER;
    deleted_messages INTEGER;
    deleted_embeddings INTEGER;
BEGIN
    SELECT COUNT(*) INTO deleted_conversations FROM conversations WHERE user_id IS NULL;
    SELECT COUNT(*) INTO deleted_messages FROM messages WHERE conversation_id IS NULL;
    SELECT COUNT(*) INTO deleted_embeddings FROM embeddings WHERE metadata->>'source' LIKE '%test%';

    RAISE NOTICE 'Production cleanup completed:';
    RAISE NOTICE '  - Orphaned conversations: %', deleted_conversations;
    RAISE NOTICE '  - Orphaned messages: %', deleted_messages;
    RAISE NOTICE '  - Test embeddings: %', deleted_embeddings;
    RAISE NOTICE '  - Database optimized for production';
END $$;
