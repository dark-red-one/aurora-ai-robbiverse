-- Pending Sync Table for Offline Write Queue
-- This table stores writes that couldn't reach the master database
-- and will be synced when connection is restored
CREATE TABLE IF NOT EXISTS pending_sync (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(255) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    -- INSERT, UPDATE, DELETE, UPSERT
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMPTZ,
    error TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry TIMESTAMPTZ
);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_sync_created ON pending_sync(created_at);
CREATE INDEX IF NOT EXISTS idx_pending_sync_synced ON pending_sync(synced_at)
WHERE synced_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pending_sync_table ON pending_sync(table_name);
CREATE INDEX IF NOT EXISTS idx_pending_sync_error ON pending_sync(error)
WHERE error IS NOT NULL;
-- Function to clean up old synced records (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_synced_records() RETURNS void AS $$ BEGIN
DELETE FROM pending_sync
WHERE synced_at IS NOT NULL
    AND synced_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
-- View for monitoring sync status
CREATE OR REPLACE VIEW sync_status AS
SELECT table_name,
    COUNT(*) FILTER (
        WHERE synced_at IS NULL
            AND error IS NULL
    ) as pending,
    COUNT(*) FILTER (
        WHERE error IS NOT NULL
    ) as failed,
    COUNT(*) FILTER (
        WHERE synced_at IS NOT NULL
    ) as synced,
    MAX(created_at) as last_write,
    MAX(synced_at) as last_sync
FROM pending_sync
GROUP BY table_name;
COMMENT ON TABLE pending_sync IS 'Queue for offline database writes that need to sync to master';
COMMENT ON COLUMN pending_sync.table_name IS 'Name of the table this change applies to';
COMMENT ON COLUMN pending_sync.operation IS 'Type of operation: INSERT, UPDATE, DELETE, or UPSERT';
COMMENT ON COLUMN pending_sync.data IS 'Full row data as JSON';
COMMENT ON COLUMN pending_sync.synced_at IS 'Timestamp when this change was successfully synced to master';
COMMENT ON COLUMN pending_sync.error IS 'Error message if sync failed';
COMMENT ON COLUMN pending_sync.retry_count IS 'Number of times sync has been retried';
