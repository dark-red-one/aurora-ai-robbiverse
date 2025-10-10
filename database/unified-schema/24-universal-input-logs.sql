-- Aurora Unified Database Schema
-- Part 24: Universal Input API Logging & Security
-- Version: 1.0.0
-- Date: October 10, 2025

-- ============================================
-- AI REQUEST LOGS (90-day retention)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_request_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Source information
  source VARCHAR(50) NOT NULL CHECK (source IN (
    'email', 'sms', 'chat', 'web_form', 'linkedin', 'elesti', 
    'api', 'cursor', 'robbiebar', 'mobile', 'other'
  )),
  source_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- AI Service information
  ai_service VARCHAR(50) NOT NULL CHECK (ai_service IN (
    'chat', 'embedding', 'image', 'code', 'analysis', 'other'
  )),
  ai_model VARCHAR(100), -- e.g. "maverick", "llama-3.2-1b", "gpt-4"
  
  -- Request/Response (NO SENSITIVE DATA)
  input_summary TEXT, -- "User asked about product pricing"
  output_summary TEXT, -- "Provided pricing information"
  
  -- Gatekeeper review
  gatekeeper_status VARCHAR(20) CHECK (gatekeeper_status IN (
    'approved', 'rejected', 'revised', 'blocked', 'bypassed'
  )),
  gatekeeper_confidence FLOAT,
  gatekeeper_reasoning TEXT,
  
  -- Performance metrics
  processing_time_ms INTEGER,
  tokens_used INTEGER,
  
  -- Context
  user_id VARCHAR(255),
  town_id VARCHAR(100),
  session_id VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ai_logs_request_id ON ai_request_logs(request_id);
CREATE INDEX idx_ai_logs_timestamp ON ai_request_logs(timestamp);
CREATE INDEX idx_ai_logs_source ON ai_request_logs(source);
CREATE INDEX idx_ai_logs_ai_service ON ai_request_logs(ai_service);
CREATE INDEX idx_ai_logs_gatekeeper_status ON ai_request_logs(gatekeeper_status);
CREATE INDEX idx_ai_logs_user_id ON ai_request_logs(user_id);
CREATE INDEX idx_ai_logs_created_at ON ai_request_logs(created_at);

-- ============================================
-- KILLSWITCH STATE
-- ============================================

CREATE TABLE IF NOT EXISTS killswitch_state (
  id SERIAL PRIMARY KEY,
  is_active BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMPTZ,
  activated_by VARCHAR(255),
  reason TEXT,
  auto_trigger VARCHAR(100), -- "rate_limit", "suspicious_activity", "manual", etc.
  
  -- Restrictions
  block_internet BOOLEAN DEFAULT TRUE,
  block_gpu_mesh BOOLEAN DEFAULT FALSE,
  block_email BOOLEAN DEFAULT TRUE,
  block_webhooks BOOLEAN DEFAULT TRUE,
  
  -- Status
  deactivated_at TIMESTAMPTZ,
  deactivated_by VARCHAR(255),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active killswitch at a time
CREATE UNIQUE INDEX idx_active_killswitch ON killswitch_state(is_active) WHERE is_active = TRUE;

-- Insert default state
INSERT INTO killswitch_state (is_active, updated_at) 
VALUES (FALSE, NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- GATEKEEPER BLOCKS (Security events)
-- ============================================

CREATE TABLE IF NOT EXISTS gatekeeper_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Block details
  block_reason VARCHAR(255) NOT NULL,
  block_category VARCHAR(50) CHECK (block_category IN (
    'rate_limit', 'suspicious_content', 'prompt_injection', 
    'unsafe_action', 'auth_failure', 'policy_violation', 'other'
  )),
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Request information
  source VARCHAR(50),
  input_pattern TEXT, -- Sanitized pattern that triggered block
  
  -- Actions taken
  triggered_killswitch BOOLEAN DEFAULT FALSE,
  notified_admin BOOLEAN DEFAULT FALSE,
  
  -- Context
  user_id VARCHAR(255),
  ip_address INET,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gatekeeper_blocks_timestamp ON gatekeeper_blocks(timestamp);
CREATE INDEX idx_gatekeeper_blocks_category ON gatekeeper_blocks(block_category);
CREATE INDEX idx_gatekeeper_blocks_severity ON gatekeeper_blocks(severity);
CREATE INDEX idx_gatekeeper_blocks_user_id ON gatekeeper_blocks(user_id);

-- ============================================
-- RATE LIMITING TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS rate_limit_tracking (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  source VARCHAR(50) NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- "email_send", "api_call", "image_gen"
  
  -- Tracking
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_end TIMESTAMPTZ,
  
  -- Limits
  limit_exceeded BOOLEAN DEFAULT FALSE,
  limit_threshold INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_user_source ON rate_limit_tracking(user_id, source);
CREATE INDEX idx_rate_limit_window ON rate_limit_tracking(window_start, window_end);

-- ============================================
-- MONITORING METRICS
-- ============================================

CREATE TABLE IF NOT EXISTS monitoring_metrics (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metric_type VARCHAR(50) NOT NULL, -- "system", "service", "security", "ai"
  metric_name VARCHAR(100) NOT NULL,
  metric_value FLOAT NOT NULL,
  metric_unit VARCHAR(20), -- "percent", "ms", "count", "bytes"
  
  -- Context
  service_name VARCHAR(100),
  town_id VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_monitoring_timestamp ON monitoring_metrics(timestamp);
CREATE INDEX idx_monitoring_type_name ON monitoring_metrics(metric_type, metric_name);
CREATE INDEX idx_monitoring_service ON monitoring_metrics(service_name);

-- Partition by month for better performance (optional but recommended)
-- ALTER TABLE monitoring_metrics PARTITION BY RANGE (timestamp);

-- ============================================
-- FUNCTIONS & PROCEDURES
-- ============================================

-- Function to purge old logs (90 days)
CREATE OR REPLACE FUNCTION purge_old_ai_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_request_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Also purge old gatekeeper blocks
  DELETE FROM gatekeeper_blocks 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Purge old monitoring metrics (keep 30 days)
  DELETE FROM monitoring_metrics 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id VARCHAR(255),
  p_source VARCHAR(50),
  p_action_type VARCHAR(50),
  p_limit INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ;
BEGIN
  window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Count requests in current window
  SELECT COUNT(*) INTO current_count
  FROM ai_request_logs
  WHERE user_id = p_user_id
    AND source = p_source
    AND timestamp >= window_start;
  
  -- Return TRUE if limit exceeded
  RETURN current_count >= p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to activate killswitch
CREATE OR REPLACE FUNCTION activate_killswitch(
  p_reason TEXT,
  p_activated_by VARCHAR(255),
  p_auto_trigger VARCHAR(100) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Deactivate any existing killswitch
  UPDATE killswitch_state SET is_active = FALSE WHERE is_active = TRUE;
  
  -- Activate new killswitch
  INSERT INTO killswitch_state (
    is_active, activated_at, activated_by, reason, auto_trigger,
    block_internet, block_email, block_webhooks, updated_at
  ) VALUES (
    TRUE, NOW(), p_activated_by, p_reason, p_auto_trigger,
    TRUE, TRUE, TRUE, NOW()
  );
  
  -- Update Robbie's mood to blushing
  UPDATE ai_personality_state 
  SET current_mood = 'blushing', updated_at = NOW()
  WHERE personality_id = 'robbie';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to deactivate killswitch
CREATE OR REPLACE FUNCTION deactivate_killswitch(
  p_deactivated_by VARCHAR(255)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE killswitch_state 
  SET is_active = FALSE,
      deactivated_at = NOW(),
      deactivated_by = p_deactivated_by,
      updated_at = NOW()
  WHERE is_active = TRUE;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SCHEDULED MAINTENANCE
-- ============================================

-- Schedule log purging daily at 2 AM
SELECT cron.schedule(
  'purge-old-ai-logs',
  '0 2 * * *',
  'SELECT purge_old_ai_logs();'
);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE ai_request_logs IS 'Logs all AI requests with 90-day retention. NO sensitive data stored.';
COMMENT ON TABLE killswitch_state IS 'Tracks killswitch activation status for emergency internet blocking.';
COMMENT ON TABLE gatekeeper_blocks IS 'Security events where gatekeeper blocked suspicious requests.';
COMMENT ON TABLE rate_limit_tracking IS 'Tracks request rates per user/source for rate limiting.';
COMMENT ON TABLE monitoring_metrics IS 'System, service, and security metrics for monitoring dashboard.';


