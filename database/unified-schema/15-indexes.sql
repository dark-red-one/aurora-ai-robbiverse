-- Performance indexes and uniqueness

-- Training jobs
CREATE INDEX IF NOT EXISTS idx_training_jobs_status_created ON training_jobs(status, created_at);

-- Secrets
CREATE INDEX IF NOT EXISTS idx_secrets_lookup ON secrets(service, key_name, scope, scope_id);

-- API connectivity
CREATE INDEX IF NOT EXISTS idx_api_status_lookup ON api_connectivity_status(service, status);

-- Sync registry
CREATE INDEX IF NOT EXISTS idx_sync_registry_lookup ON sync_registry(external_system, entity_type, sync_status);

-- Widgets
CREATE INDEX IF NOT EXISTS idx_widgets_category ON widgets(category);
CREATE INDEX IF NOT EXISTS idx_widgets_site ON widgets(site);
