-- ============================================
-- SYNC INFRASTRUCTURE FOR MASTER-REPLICA ARCHITECTURE
-- ============================================
-- This schema supports the Elephant Postgres sync system
-- where Elestio is the master and local Postgres instances are replicas
-- Version: 1.0.0
-- Date: January 9, 2025
-- Pending Sync Queue
-- Stores writes that couldn't reach master and need to be synced
CREATE TABLE IF NOT EXISTS pending_sync (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(255) NOT NULL,
    operation VARCHAR(50) NOT NULL CHECK (
        operation IN ('INSERT', 'UPDATE', 'DELETE', 'UPSERT')
    ),
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMPTZ,
    error TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry TIMESTAMPTZ,
    priority INTEGER DEFAULT 0,
    -- Higher priority syncs first
    node_id VARCHAR(100) -- Which node created this sync request
);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_sync_unsynced ON pending_sync(created_at DESC)
WHERE synced_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pending_sync_table ON pending_sync(table_name);
CREATE INDEX IF NOT EXISTS idx_pending_sync_priority ON pending_sync(priority DESC, created_at)
WHERE synced_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pending_sync_error ON pending_sync(error)
WHERE error IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pending_sync_node ON pending_sync(node_id);
-- Sync Status Tracking
-- Tracks the last successful sync for each table
CREATE TABLE IF NOT EXISTS sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(255) UNIQUE NOT NULL,
    last_sync_at TIMESTAMPTZ,
    last_sync_record_count INTEGER DEFAULT 0,
    last_sync_duration_ms INTEGER,
    last_error TEXT,
    sync_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Node Registry
-- Tracks all nodes in the sync network
CREATE TABLE IF NOT EXISTS sync_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id VARCHAR(100) UNIQUE NOT NULL,
    node_name VARCHAR(255) NOT NULL,
    node_type VARCHAR(50) NOT NULL CHECK (node_type IN ('master', 'replica', 'edge')),
    connection_string TEXT,
    -- Encrypted or hashed
    last_seen TIMESTAMPTZ,
    is_online BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sync_nodes_online ON sync_nodes(is_online, last_seen);
-- Conflict Resolution Log
-- Tracks conflicts during sync and how they were resolved
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(255) NOT NULL,
    record_id UUID NOT NULL,
    source_node VARCHAR(100) NOT NULL,
    master_data JSONB NOT NULL,
    replica_data JSONB NOT NULL,
    resolution VARCHAR(50) NOT NULL CHECK (
        resolution IN ('master_wins', 'replica_wins', 'merge', 'manual')
    ),
    resolved_data JSONB,
    resolved_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_table ON sync_conflicts(table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_unresolved ON sync_conflicts(created_at DESC)
WHERE resolved_at IS NULL;
-- Sync Metrics
-- Real-time metrics for monitoring sync health
CREATE TABLE IF NOT EXISTS sync_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR(50),
    -- 'ms', 'count', 'bytes', etc.
    node_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sync_metrics_name_time ON sync_metrics(metric_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_metrics_node ON sync_metrics(node_id, created_at DESC);
-- Materialized View for Sync Dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS sync_dashboard AS
SELECT ps.table_name,
    COUNT(*) FILTER (
        WHERE ps.synced_at IS NULL
    ) as pending_count,
    COUNT(*) FILTER (
        WHERE ps.error IS NOT NULL
    ) as error_count,
    COUNT(*) FILTER (
        WHERE ps.synced_at IS NOT NULL
    ) as synced_count,
    MAX(ps.created_at) as last_write,
    MAX(ps.synced_at) as last_sync,
    AVG(
        EXTRACT(
            EPOCH
            FROM (ps.synced_at - ps.created_at)
        )
    ) as avg_sync_latency_seconds,
    ss.last_sync_record_count,
    ss.last_sync_duration_ms,
    ss.sync_enabled
FROM pending_sync ps
    LEFT JOIN sync_status ss ON ps.table_name = ss.table_name
GROUP BY ps.table_name,
    ss.last_sync_record_count,
    ss.last_sync_duration_ms,
    ss.sync_enabled;
-- Function to refresh sync dashboard
CREATE OR REPLACE FUNCTION refresh_sync_dashboard() RETURNS void AS $$ BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY sync_dashboard;
END;
$$ LANGUAGE plpgsql;
-- Function to clean up old synced records (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_synced_records() RETURNS INTEGER AS $$
DECLARE deleted_count INTEGER;
BEGIN
DELETE FROM pending_sync
WHERE synced_at IS NOT NULL
    AND synced_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
GET DIAGNOSTICS deleted_count = ROW_COUNT;
RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
-- Function to get sync health score (0-100)
CREATE OR REPLACE FUNCTION get_sync_health_score() RETURNS INTEGER AS $$
DECLARE pending_count INTEGER;
error_count INTEGER;
offline_nodes INTEGER;
health_score INTEGER;
BEGIN -- Count pending syncs
SELECT COUNT(*) INTO pending_count
FROM pending_sync
WHERE synced_at IS NULL;
-- Count errors
SELECT COUNT(*) INTO error_count
FROM pending_sync
WHERE error IS NOT NULL
    AND synced_at IS NULL;
-- Count offline nodes
SELECT COUNT(*) INTO offline_nodes
FROM sync_nodes
WHERE is_online = false
    AND node_type = 'replica';
-- Calculate health score (100 = perfect, 0 = disaster)
health_score := 100;
-- Deduct points for pending syncs (max 30 points)
health_score := health_score - LEAST(30, pending_count);
-- Deduct points for errors (max 40 points)
health_score := health_score - LEAST(40, error_count * 2);
-- Deduct points for offline nodes (max 30 points)
health_score := health_score - LEAST(30, offline_nodes * 10);
RETURN GREATEST(0, health_score);
END;
$$ LANGUAGE plpgsql;
-- Trigger to update sync_status after successful sync
CREATE OR REPLACE FUNCTION update_sync_status_trigger() RETURNS TRIGGER AS $$ BEGIN IF NEW.synced_at IS NOT NULL
    AND OLD.synced_at IS NULL THEN -- Update sync status for this table
INSERT INTO sync_status (table_name, last_sync_at, last_sync_record_count)
VALUES (NEW.table_name, NEW.synced_at, 1) ON CONFLICT (table_name) DO
UPDATE
SET last_sync_at = EXCLUDED.last_sync_at,
    last_sync_record_count = sync_status.last_sync_record_count + 1,
    updated_at = CURRENT_TIMESTAMP;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_sync_status
AFTER
UPDATE OF synced_at ON pending_sync FOR EACH ROW EXECUTE FUNCTION update_sync_status_trigger();
-- Comments
COMMENT ON TABLE pending_sync IS 'Queue for offline database writes that need to sync to master';
COMMENT ON TABLE sync_status IS 'Tracks the last successful sync for each table';
COMMENT ON TABLE sync_nodes IS 'Registry of all nodes in the sync network';
COMMENT ON TABLE sync_conflicts IS 'Log of sync conflicts and their resolutions';
COMMENT ON TABLE sync_metrics IS 'Real-time metrics for monitoring sync performance';
COMMENT ON FUNCTION get_sync_health_score IS 'Returns sync health score from 0-100';
COMMENT ON FUNCTION cleanup_synced_records IS 'Cleans up synced records older than 7 days';
-- Initial data
INSERT INTO sync_nodes (node_id, node_name, node_type, is_online)
VALUES (
        'master-elestio',
        'Elestio Master Database',
        'master',
        true
    ),
    (
        'vengeance-local',
        'Vengeance Local Replica',
        'replica',
        false
    ),
    (
        'aurora-town-local',
        'Aurora Town Local Replica',
        'replica',
        false
    ) ON CONFLICT (node_id) DO NOTHING;
