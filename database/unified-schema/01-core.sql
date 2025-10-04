-- Aurora Unified Database Schema
-- Part 1: Core Tables (Users, Auth, System)
-- Version: 1.0.0
-- Date: September 19, 2025

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing duplicate tables if migration mode
-- CAUTION: Only uncomment during migration
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- CORE USER MANAGEMENT
-- ============================================

-- Users table (single source of truth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'mentor', 'ai', 'developer')),
  is_active BOOLEAN DEFAULT true,
  is_vip BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_vip ON users(is_vip) WHERE is_vip = true;

-- ============================================
-- AUTHENTICATION & SESSIONS
-- ============================================

-- API Keys for service authentication
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  permissions JSONB DEFAULT '[]'::jsonb,
  last_used TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- Session management
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ============================================
-- SYSTEM CONFIGURATION
-- ============================================

-- System-wide configuration (replaces hardcoded values)
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_config_key ON system_config(key);
CREATE INDEX idx_system_config_category ON system_config(category);

-- Insert default configurations
INSERT INTO system_config (key, value, category, description) VALUES
  ('deployment.primary_node', '"aurora"'::jsonb, 'deployment', 'Primary RunPod node name'),
  ('deployment.gpu_config', '{"aurora": "2x RTX 4090", "collaboration": "1x RTX 4090", "fluenti": "1x RTX 4090"}'::jsonb, 'deployment', 'GPU configurations per node'),
  ('ai.default_model', '"gpt-4"'::jsonb, 'ai', 'Default AI model'),
  ('ai.temperature', '0.7'::jsonb, 'ai', 'Default AI temperature'),
  ('security.session_timeout', '3600'::jsonb, 'security', 'Session timeout in seconds'),
  ('features.gpu_mesh_enabled', 'true'::jsonb, 'features', 'Enable GPU mesh networking')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- AUDIT & LOGGING
-- ============================================

-- Audit log for all system changes
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PERMISSIONS & GRANTS
-- ============================================

-- Create application user if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'aurora_app') THEN
    CREATE USER aurora_app WITH PASSWORD 'change_in_production';
  END IF;
END
$$;

-- Grant appropriate permissions
GRANT CONNECT ON DATABASE aurora TO aurora_app;
GRANT USAGE ON SCHEMA public TO aurora_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO aurora_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO aurora_app;

