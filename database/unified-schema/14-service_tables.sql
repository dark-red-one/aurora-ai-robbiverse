-- Centralize service-created tables

-- Auth sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_jti VARCHAR(255) UNIQUE NOT NULL,
  node_name VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- RobbieBlocks
CREATE TABLE IF NOT EXISTS widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  site VARCHAR(50),
  inputs JSONB DEFAULT '{}'::jsonb,
  outputs JSONB DEFAULT '{}'::jsonb,
  demo_url VARCHAR(255),
  code_snippet TEXT,
  price_tier VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS widget_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  site_name VARCHAR(50),
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(widget_id, site_name)
);

-- Training jobs
CREATE TABLE IF NOT EXISTS training_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name VARCHAR(100) NOT NULL,
  base_model VARCHAR(100) NOT NULL,
  training_data TEXT NOT NULL,
  epochs INTEGER NOT NULL,
  learning_rate DOUBLE PRECISION NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  progress DOUBLE PRECISION DEFAULT 0.0,
  current_epoch INTEGER DEFAULT 0,
  loss DOUBLE PRECISION DEFAULT 0.0,
  eta_minutes INTEGER DEFAULT 0,
  assigned_node VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Secrets & API connectivity
CREATE TABLE IF NOT EXISTS secrets (
  id SERIAL PRIMARY KEY,
  service TEXT NOT NULL,
  key_name TEXT NOT NULL,
  key_value_encrypted TEXT NOT NULL,
  scope TEXT DEFAULT 'global',
  scope_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  UNIQUE(service, key_name, scope, scope_id)
);

CREATE TABLE IF NOT EXISTS api_connectivity_status (
  id SERIAL PRIMARY KEY,
  node_name TEXT NOT NULL,
  service TEXT NOT NULL,
  status TEXT NOT NULL,
  response_time_ms INTEGER,
  last_error TEXT,
  last_check TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(node_name, service)
);

-- Integration sync registry
CREATE TABLE IF NOT EXISTS sync_registry (
  id SERIAL PRIMARY KEY,
  local_id TEXT NOT NULL,
  external_id TEXT,
  external_system TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  last_synced TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  local_version INTEGER DEFAULT 1,
  external_version INTEGER,
  sync_status TEXT DEFAULT 'synced',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(local_id, external_system, entity_type)
);
