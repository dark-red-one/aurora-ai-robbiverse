-- Offline Changes Queue for RobbieBook1
-- Tracks changes made while offline, syncs when reconnected

CREATE TABLE IF NOT EXISTS offline_changes (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    record_id VARCHAR(255),
    record_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    synced_at TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'pending', -- pending, synced, conflict, failed
    conflict_reason TEXT,
    created_by VARCHAR(100) DEFAULT 'robbiebook'
);

CREATE INDEX IF NOT EXISTS idx_offline_changes_status ON offline_changes(sync_status);
CREATE INDEX IF NOT EXISTS idx_offline_changes_table ON offline_changes(table_name);
CREATE INDEX IF NOT EXISTS idx_offline_changes_created ON offline_changes(created_at);

-- Track offline mode status
CREATE TABLE IF NOT EXISTS sync_status (
    id SERIAL PRIMARY KEY,
    is_online BOOLEAN DEFAULT true,
    last_sync_attempt TIMESTAMP,
    last_successful_sync TIMESTAMP,
    pending_changes INTEGER DEFAULT 0,
    failed_syncs INTEGER DEFAULT 0
);

INSERT INTO sync_status (is_online) VALUES (true) ON CONFLICT DO NOTHING;

COMMENT ON TABLE offline_changes IS 'Queue for changes made on RobbieBook1 while offline - syncs to Aurora when reconnected';

