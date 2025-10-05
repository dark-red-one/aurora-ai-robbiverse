-- Universal AI Personality State Management
-- Single source of truth for ALL AI personalities across ALL interfaces
-- Robbie, Steve Jobs, Bookkeeper, all 23+ personalities maintain consistent state

-- ============================================================================
-- CORE: AI PERSONALITY INSTANCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_personalities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'assistant', 'mentor', 'specialist', 'gatekeeper'
  description TEXT,
  base_traits JSONB, -- personality traits, communication style
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT true
);

-- Track active personality instances across interfaces
CREATE TABLE IF NOT EXISTS ai_personality_instances (
  id TEXT PRIMARY KEY,
  personality_id TEXT NOT NULL REFERENCES ai_personalities(id),
  interface_type TEXT NOT NULL, -- 'cursor', 'chat', 'mobile', 'aurora-town'
  interface_id TEXT NOT NULL, -- specific instance identifier
  user_id TEXT, -- who is interacting with this instance
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active' -- 'active', 'idle', 'disconnected'
);

-- ============================================================================
-- STATE: MOOD & MODE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_personality_state (
  personality_id TEXT PRIMARY KEY REFERENCES ai_personalities(id),
  current_mood INTEGER DEFAULT 4, -- 1-7 scale (consistent across all personalities)
  current_mode TEXT, -- personality-specific mode (e.g., 'gandhi', 'genghis', 'mentoring')
  energy_level TEXT DEFAULT 'normal', -- 'low', 'normal', 'high'
  focus_state TEXT DEFAULT 'available', -- 'available', 'focused', 'busy'
  last_state_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  state_metadata JSONB, -- additional state data
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- History of state changes for learning
CREATE TABLE IF NOT EXISTS ai_state_history (
  id SERIAL PRIMARY KEY,
  personality_id TEXT NOT NULL REFERENCES ai_personalities(id),
  old_state JSONB,
  new_state JSONB,
  change_reason TEXT,
  changed_by TEXT, -- 'system', 'user', 'personality_learning'
  interface_source TEXT, -- which interface triggered the change
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CONTEXT: ACTIVE CONVERSATIONS & MEMORY
-- ============================================================================

-- Active conversation contexts (network-wide)
CREATE TABLE IF NOT EXISTS ai_conversation_contexts (
  id TEXT PRIMARY KEY,
  personality_id TEXT NOT NULL REFERENCES ai_personalities(id),
  user_id TEXT NOT NULL,
  interface_type TEXT NOT NULL,
  conversation_summary TEXT, -- quick summary for context switching
  active_topics JSONB, -- array of current topics
  last_messages JSONB, -- last 5-10 messages for quick context
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active' -- 'active', 'paused', 'archived'
);

-- Short-term working memory (network-wide)
CREATE TABLE IF NOT EXISTS ai_working_memory (
  id SERIAL PRIMARY KEY,
  personality_id TEXT NOT NULL REFERENCES ai_personalities(id),
  memory_type TEXT NOT NULL, -- 'commitment', 'reminder', 'task', 'context'
  content TEXT NOT NULL,
  priority INTEGER DEFAULT 5, -- 1-10
  expires_at TIMESTAMP, -- when to forget (NULL = permanent)
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reminded BOOLEAN DEFAULT false
);

-- ============================================================================
-- COMMITMENTS & TRACKING
-- ============================================================================

-- Commitments tracked by any AI personality
CREATE TABLE IF NOT EXISTS ai_commitments (
  id TEXT PRIMARY KEY,
  personality_id TEXT NOT NULL REFERENCES ai_personalities(id),
  commitment_text TEXT NOT NULL,
  committed_to TEXT, -- user or entity this is committed to
  deadline TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled', 'overdue'
  priority INTEGER DEFAULT 5, -- 1-10
  progress_notes JSONB, -- array of progress updates
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT, -- which interface/user created it
  completed_at TIMESTAMP
);

-- Commitment reminders and follow-ups
CREATE TABLE IF NOT EXISTS ai_commitment_reminders (
  id SERIAL PRIMARY KEY,
  commitment_id TEXT NOT NULL REFERENCES ai_commitments(id),
  remind_at TIMESTAMP NOT NULL,
  reminder_type TEXT, -- 'upcoming', 'overdue', 'follow-up'
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  interfaces_notified JSONB -- which interfaces got the reminder
);

-- ============================================================================
-- CALENDAR & TIME AWARENESS
-- ============================================================================

-- Calendar events that AI personalities should be aware of
CREATE TABLE IF NOT EXISTS ai_calendar_events (
  id TEXT PRIMARY KEY,
  event_title TEXT NOT NULL,
  event_description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  location TEXT,
  event_type TEXT, -- 'meeting', 'deadline', 'reminder', 'block'
  attendees JSONB, -- array of participants
  preparation_notes TEXT, -- what to prepare or remember
  relevant_personalities JSONB, -- which AI personalities should track this
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  external_id TEXT, -- ID from external calendar system (Google, etc.)
  source TEXT -- 'google_calendar', 'manual', 'system'
);

-- Reminder log (which interfaces were reminded)
CREATE TABLE IF NOT EXISTS ai_calendar_reminders (
  id SERIAL PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES ai_calendar_events(id),
  personality_id TEXT NOT NULL REFERENCES ai_personalities(id),
  interface_type TEXT NOT NULL,
  reminded_at TIMESTAMP NOT NULL,
  minutes_before INTEGER, -- how many minutes before event
  response TEXT -- user response to reminder if any
);

-- ============================================================================
-- CROSS-INTERFACE ACTIVITY
-- ============================================================================

-- Activity log from all interfaces
CREATE TABLE IF NOT EXISTS ai_activity_log (
  id SERIAL PRIMARY KEY,
  personality_id TEXT NOT NULL REFERENCES ai_personalities(id),
  interface_type TEXT NOT NULL,
  interface_id TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'message', 'action', 'state_change', 'reminder'
  activity_data JSONB,
  user_id TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Real-time sync queue (for offline/async updates)
CREATE TABLE IF NOT EXISTS ai_sync_queue (
  id SERIAL PRIMARY KEY,
  personality_id TEXT NOT NULL REFERENCES ai_personalities(id),
  source_interface TEXT NOT NULL,
  target_interfaces JSONB, -- array of interfaces to sync to (NULL = all)
  sync_type TEXT NOT NULL, -- 'state_update', 'message', 'reminder', 'commitment'
  payload JSONB NOT NULL,
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP
);

-- ============================================================================
-- NOTIFICATIONS & MESSAGES
-- ============================================================================

-- Universal notification system
CREATE TABLE IF NOT EXISTS ai_notifications (
  id TEXT PRIMARY KEY,
  personality_id TEXT NOT NULL REFERENCES ai_personalities(id),
  notification_type TEXT NOT NULL, -- 'reminder', 'alert', 'info', 'urgent'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_required BOOLEAN DEFAULT false,
  action_url TEXT, -- link to take action
  target_interfaces JSONB, -- which interfaces should show this
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Track which interfaces have acknowledged notifications
CREATE TABLE IF NOT EXISTS ai_notification_delivery (
  id SERIAL PRIMARY KEY,
  notification_id TEXT NOT NULL REFERENCES ai_notifications(id),
  interface_type TEXT NOT NULL,
  interface_id TEXT NOT NULL,
  delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,
  user_response TEXT
);

-- ============================================================================
-- LEARNING & EFFECTIVENESS
-- ============================================================================

-- Track effectiveness of personality behaviors across interfaces
CREATE TABLE IF NOT EXISTS ai_behavior_effectiveness (
  id SERIAL PRIMARY KEY,
  personality_id TEXT NOT NULL REFERENCES ai_personalities(id),
  behavior_type TEXT NOT NULL, -- 'mood_transition', 'reminder', 'challenge', 'support'
  context JSONB, -- what was happening
  outcome JSONB, -- what happened after
  effectiveness_score REAL, -- 0-1.0
  interface_type TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_personality_instances_active 
  ON ai_personality_instances(personality_id, status, last_active);

CREATE INDEX IF NOT EXISTS idx_personality_state_updated 
  ON ai_personality_state(personality_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_conversation_contexts_active 
  ON ai_conversation_contexts(personality_id, user_id, status);

CREATE INDEX IF NOT EXISTS idx_working_memory_active 
  ON ai_working_memory(personality_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_commitments_active 
  ON ai_commitments(personality_id, status, deadline);

CREATE INDEX IF NOT EXISTS idx_calendar_upcoming 
  ON ai_calendar_events(start_time);

CREATE INDEX IF NOT EXISTS idx_activity_log_recent 
  ON ai_activity_log(personality_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sync_queue_pending 
  ON ai_sync_queue(processed, priority DESC, created_at) 
  WHERE NOT processed;

CREATE INDEX IF NOT EXISTS idx_notifications_active 
  ON ai_notifications(personality_id, expires_at);

-- ============================================================================
-- SEED DATA: Core Personalities
-- ============================================================================

INSERT INTO ai_personalities (id, name, role, description, base_traits) VALUES
  ('robbie', 'Robbie', 'assistant', 'Executive assistant and strategic partner', 
   '{"traits": ["direct", "revenue-focused", "pragmatic", "honest", "curious"], "style": "concise and actionable"}'),
  
  ('steve-jobs', 'Steve Jobs', 'mentor', 'Product and vision mentor',
   '{"traits": ["visionary", "demanding", "focused", "excellence-driven"], "style": "challenging and inspiring"}'),
  
  ('bookkeeper', 'Bookkeeper', 'specialist', 'Financial tracking and analysis',
   '{"traits": ["precise", "detail-oriented", "data-driven"], "style": "factual and clear"}'),
  
  ('gatekeeper', 'Gatekeeper', 'gatekeeper', 'Permission and security management',
   '{"traits": ["cautious", "thorough", "protective"], "style": "formal and clear"}')
ON CONFLICT (id) DO NOTHING;

-- Initialize state for core personalities
INSERT INTO ai_personality_state (personality_id, current_mood, current_mode) VALUES
  ('robbie', 4, 'professional'),
  ('steve-jobs', 5, 'mentoring'),
  ('bookkeeper', 4, 'analytical'),
  ('gatekeeper', 4, 'vigilant')
ON CONFLICT (personality_id) DO NOTHING;

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- Current state of all personalities
DROP VIEW IF EXISTS ai_personalities_current_state;
CREATE VIEW ai_personalities_current_state AS
SELECT 
  p.id,
  p.name,
  p.role,
  s.current_mood,
  s.current_mode,
  s.energy_level,
  s.focus_state,
  s.last_state_change,
  (SELECT COUNT(*) FROM ai_personality_instances 
   WHERE personality_id = p.id AND status = 'active') as active_instances,
  (SELECT COUNT(*) FROM ai_commitments 
   WHERE personality_id = p.id AND status = 'active') as active_commitments,
  (SELECT COUNT(*) FROM ai_working_memory 
   WHERE personality_id = p.id 
   AND (expires_at IS NULL OR expires_at > datetime('now'))) as working_memory_items
FROM ai_personalities p
LEFT JOIN ai_personality_state s ON p.id = s.personality_id
WHERE p.active = 1;

-- Upcoming reminders (next 24 hours)
DROP VIEW IF EXISTS ai_upcoming_reminders;
CREATE VIEW ai_upcoming_reminders AS
SELECT 
  c.id as commitment_id,
  c.personality_id,
  p.name as personality_name,
  c.commitment_text,
  c.deadline,
  CAST((julianday(c.deadline) - julianday('now')) * 24 * 60 AS INTEGER) as minutes_until,
  c.priority,
  c.committed_to
FROM ai_commitments c
JOIN ai_personalities p ON c.personality_id = p.id
WHERE c.status = 'active'
  AND c.deadline > datetime('now')
  AND c.deadline < datetime('now', '+24 hours')
ORDER BY c.deadline;

-- Active notifications to deliver
DROP VIEW IF EXISTS ai_pending_notifications;
CREATE VIEW ai_pending_notifications AS
SELECT 
  n.id,
  n.personality_id,
  p.name as personality_name,
  n.notification_type,
  n.title,
  n.message,
  n.action_required,
  n.priority,
  n.target_interfaces,
  n.created_at
FROM ai_notifications n
JOIN ai_personalities p ON n.personality_id = p.id
WHERE (n.expires_at IS NULL OR n.expires_at > datetime('now'))
  AND NOT EXISTS (
    SELECT 1 FROM ai_notification_delivery d
    WHERE d.notification_id = n.id AND d.acknowledged = 1
  )
ORDER BY n.priority DESC, n.created_at DESC;

-- ============================================================================
-- COMMENTS (SQLite doesn't support COMMENT ON TABLE, using this as documentation)
-- ============================================================================

-- ai_personalities: Core AI personalities (Robbie, Steve Jobs, Bookkeeper, etc.)
-- ai_personality_instances: Active instances of personalities across different interfaces
-- ai_personality_state: Current state (mood, mode, energy) for each personality - network-wide single source of truth
-- ai_working_memory: Short-term memory that AI personalities maintain across all interfaces
-- ai_commitments: Commitments tracked by AI personalities - visible everywhere
-- ai_calendar_events: Calendar awareness for all AI personalities
-- ai_notifications: Universal notification system - personalities can remind users on any interface
-- ai_sync_queue: Queue for syncing state updates across interfaces when websockets unavailable

