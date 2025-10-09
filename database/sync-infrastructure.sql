-- ============================================
-- ROBBIEVERSE EMPIRE DATABASE SYNC INFRASTRUCTURE
-- ============================================
-- 
-- Comprehensive sync logging and monitoring for bidirectional sync
-- Between Elephant (master) and all empire nodes
--
-- Date: October 9, 2025
-- Version: 1.0.0
--
-- ============================================

-- Create sync schema for all sync-related tables
CREATE SCHEMA IF NOT EXISTS sync;

-- ============================================
-- NODE STATUS TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS sync.node_status (
  node_name TEXT PRIMARY KEY,
  node_type TEXT NOT NULL CHECK (node_type IN ('gateway', 'client')),
  vpn_ip TEXT NOT NULL,
  last_sync_attempt TIMESTAMPTZ,
  last_sync_success TIMESTAMPTZ,
  last_pull_success TIMESTAMPTZ,
  last_push_success TIMESTAMPTZ,
  is_online BOOLEAN DEFAULT false,
  sync_errors_24h INTEGER DEFAULT 0,
  total_syncs INTEGER DEFAULT 0,
  total_rows_synced BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE sync.node_status IS 'Real-time status of each node in the Robbieverse Empire';
COMMENT ON COLUMN sync.node_status.node_name IS 'Unique node identifier (aurora-town, vengeance, robbiebook1)';
COMMENT ON COLUMN sync.node_status.vpn_ip IS 'VPN IP address (10.0.0.x)';
COMMENT ON COLUMN sync.node_status.sync_errors_24h IS 'Number of sync errors in last 24 hours (auto-resets)';

-- ============================================
-- COMPREHENSIVE SYNC LOG
-- ============================================

CREATE TABLE IF NOT EXISTS sync.sync_log (
  id SERIAL PRIMARY KEY,
  node_name TEXT NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('push', 'pull', 'full', 'incremental')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'error', 'conflict', 'partial')),
  tables_synced TEXT[],
  rows_affected INTEGER DEFAULT 0,
  rows_inserted INTEGER DEFAULT 0,
  rows_updated INTEGER DEFAULT 0,
  rows_deleted INTEGER DEFAULT 0,
  error_message TEXT,
  conflict_details JSONB,
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE sync.sync_log IS 'Detailed log of every sync operation';
COMMENT ON COLUMN sync.sync_log.sync_type IS 'push = local→elephant, pull = elephant→local, full = complete sync';
COMMENT ON COLUMN sync.sync_log.status IS 'Final status of sync operation';

CREATE INDEX idx_sync_log_node_started ON sync.sync_log(node_name, started_at DESC);
CREATE INDEX idx_sync_log_status ON sync.sync_log(status) WHERE status IN ('error', 'conflict');
CREATE INDEX idx_sync_log_completed ON sync.sync_log(completed_at DESC) WHERE completed_at IS NOT NULL;

-- ============================================
-- CONFLICT RESOLUTION LOG
-- ============================================

CREATE TABLE IF NOT EXISTS sync.conflicts (
  id SERIAL PRIMARY KEY,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  primary_key_cols TEXT[],
  node_a TEXT NOT NULL,
  node_b TEXT NOT NULL,
  conflict_type TEXT NOT NULL CHECK (conflict_type IN (
    'concurrent_update',
    'delete_update',
    'update_delete',
    'concurrent_delete',
    'constraint_violation',
    'data_type_mismatch'
  )),
  data_a JSONB,
  data_b JSONB,
  resolved_data JSONB,
  resolution TEXT CHECK (resolution IN ('node_a_wins', 'node_b_wins', 'elephant_wins', 'client_wins', 'merged', 'manual', 'ignored')),
  resolved_by TEXT,
  resolution_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE sync.conflicts IS 'Log of all detected conflicts and their resolutions';
COMMENT ON COLUMN sync.conflicts.conflict_type IS 'Type of conflict detected';
COMMENT ON COLUMN sync.conflicts.resolution IS 'How the conflict was resolved';

CREATE INDEX idx_conflicts_unresolved ON sync.conflicts(detected_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX idx_conflicts_table ON sync.conflicts(table_name, detected_at DESC);

-- ============================================
-- SYNC CONFIGURATION
-- ============================================

CREATE TABLE IF NOT EXISTS sync.sync_config (
  id SERIAL PRIMARY KEY,
  node_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  sync_enabled BOOLEAN DEFAULT true,
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('bidirectional', 'pull_only', 'push_only', 'disabled')),
  conflict_resolution TEXT NOT NULL DEFAULT 'elephant_wins' CHECK (conflict_resolution IN ('elephant_wins', 'client_wins', 'newest_wins', 'manual')),
  sync_interval_seconds INTEGER DEFAULT 300,
  last_synced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(node_name, table_name)
);

COMMENT ON TABLE sync.sync_config IS 'Per-table sync configuration for each node';
COMMENT ON COLUMN sync.sync_config.sync_direction IS 'Direction of sync for this table';
COMMENT ON COLUMN sync.sync_config.conflict_resolution IS 'Default conflict resolution strategy';

-- ============================================
-- SYNC QUEUE (For offline changes)
-- ============================================

CREATE TABLE IF NOT EXISTS sync.change_queue (
  id SERIAL PRIMARY KEY,
  node_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  record_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  sync_attempts INTEGER DEFAULT 0,
  last_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE sync.change_queue IS 'Queue of changes made while offline, waiting to sync';

CREATE INDEX idx_change_queue_pending ON sync.change_queue(node_name, created_at) WHERE synced_at IS NULL;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert initial node status
INSERT INTO sync.node_status (node_name, node_type, vpn_ip, metadata) VALUES
  ('aurora-town', 'gateway', '10.0.0.10', '{"role": "master", "hosts_elephant": true, "location": "Elestio"}'),
  ('vengeance', 'client', '10.0.0.2', '{"role": "replica", "machine_type": "gaming_pc", "location": "home"}'),
  ('robbiebook1', 'client', '10.0.0.100', '{"role": "replica", "machine_type": "macbook_pro", "location": "mobile"}')
ON CONFLICT (node_name) DO UPDATE SET
  node_type = EXCLUDED.node_type,
  vpn_ip = EXCLUDED.vpn_ip,
  metadata = EXCLUDED.metadata;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update node status timestamp
CREATE OR REPLACE FUNCTION sync.update_node_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_node_status_timestamp
  BEFORE UPDATE ON sync.node_status
  FOR EACH ROW
  EXECUTE FUNCTION sync.update_node_status_timestamp();

-- Function to auto-calculate sync duration
CREATE OR REPLACE FUNCTION sync.calculate_sync_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_ms = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_sync_duration
  BEFORE UPDATE ON sync.sync_log
  FOR EACH ROW
  EXECUTE FUNCTION sync.calculate_sync_duration();

-- Function to reset error count after 24 hours
CREATE OR REPLACE FUNCTION sync.reset_error_counts()
RETURNS void AS $$
BEGIN
  UPDATE sync.node_status
  SET sync_errors_24h = 0
  WHERE updated_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR MONITORING
-- ============================================

-- View: Recent sync activity
CREATE OR REPLACE VIEW sync.recent_activity AS
SELECT 
  sl.node_name,
  sl.sync_type,
  sl.started_at,
  sl.completed_at,
  sl.duration_ms,
  sl.status,
  sl.rows_affected,
  sl.error_message,
  ns.is_online,
  ns.vpn_ip
FROM sync.sync_log sl
LEFT JOIN sync.node_status ns ON sl.node_name = ns.node_name
ORDER BY sl.started_at DESC
LIMIT 100;

COMMENT ON VIEW sync.recent_activity IS 'Last 100 sync operations across all nodes';

-- View: Empire health dashboard
CREATE OR REPLACE VIEW sync.empire_health AS
SELECT 
  ns.node_name,
  ns.node_type,
  ns.vpn_ip,
  ns.is_online,
  ns.last_sync_success,
  ns.sync_errors_24h,
  ns.total_syncs,
  ns.total_rows_synced,
  (SELECT COUNT(*) FROM sync.conflicts WHERE resolved_at IS NULL AND (node_a = ns.node_name OR node_b = ns.node_name)) as unresolved_conflicts,
  (SELECT COUNT(*) FROM sync.change_queue WHERE node_name = ns.node_name AND synced_at IS NULL) as pending_changes,
  CASE 
    WHEN ns.last_sync_success < NOW() - INTERVAL '10 minutes' THEN 'degraded'
    WHEN ns.last_sync_success < NOW() - INTERVAL '30 minutes' THEN 'offline'
    WHEN ns.sync_errors_24h > 10 THEN 'unhealthy'
    ELSE 'healthy'
  END as health_status
FROM sync.node_status ns
ORDER BY ns.node_name;

COMMENT ON VIEW sync.empire_health IS 'Real-time health status of all empire nodes';

-- View: Conflict summary
CREATE OR REPLACE VIEW sync.conflict_summary AS
SELECT 
  table_name,
  COUNT(*) as total_conflicts,
  COUNT(*) FILTER (WHERE resolved_at IS NULL) as unresolved,
  COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) as resolved,
  MAX(detected_at) as last_conflict
FROM sync.conflicts
WHERE detected_at > NOW() - INTERVAL '7 days'
GROUP BY table_name
ORDER BY unresolved DESC, total_conflicts DESC;

COMMENT ON VIEW sync.conflict_summary IS 'Summary of conflicts by table in last 7 days';

-- ============================================
-- GRANTS (For sync service access)
-- ============================================

-- Grant usage on sync schema
GRANT USAGE ON SCHEMA sync TO PUBLIC;

-- Grant access to all sync tables
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA sync TO PUBLIC;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA sync TO PUBLIC;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Robbieverse Empire Sync Infrastructure Created!';
  RAISE NOTICE '📊 Run: SELECT * FROM sync.empire_health;';
  RAISE NOTICE '🔍 Run: SELECT * FROM sync.recent_activity;';
END $$;

