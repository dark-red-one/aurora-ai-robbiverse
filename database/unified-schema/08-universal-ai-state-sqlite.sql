-- Universal AI Personality State Management (SQLite Version)
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
  base_traits TEXT, -- JSON as TEXT for SQLite
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT 1
);

-- Track active personality instances across interfaces
CREATE TABLE IF NOT EXISTS ai_personality_instances (
  id TEXT PRIMARY KEY,
  personality_id TEXT NOT NULL,
  interface_type TEXT NOT NULL, -- 'cursor', 'chat', 'mobile', 'aurora-town'
  interface_id TEXT NOT NULL, -- specific instance identifier
  user_id TEXT, -- who is interacting with this instance
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active', -- 'active', 'idle', 'disconnected'
  FOREIGN KEY (personality_id) REFERENCES ai_personalities(id)
);

-- ============================================================================
-- STATE: MOOD & MODE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_personality_state (
  personality_id TEXT PRIMARY KEY,
  current_mood INTEGER DEFAULT 4, -- 1-7 scale (consistent across all personalities)
  current_mode TEXT, -- personality-specific mode (e.g., 'gandhi', 'genghis', 'mentoring')
  energy_level TEXT DEFAULT 'normal', -- 'low', 'normal', 'high'
  focus_state TEXT DEFAULT 'available', -- 'available', 'focused', 'busy'
  last_state_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  state_metadata TEXT, -- JSON as TEXT for SQLite
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (personality_id) REFERENCES ai_personalities(id)
);

-- History of state changes for learning
CREATE TABLE IF NOT EXISTS ai_state_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personality_id TEXT NOT NULL,
  old_state TEXT, -- JSON as TEXT
  new_state TEXT, -- JSON as TEXT
  change_reason TEXT,
  changed_by TEXT, -- 'system', 'user', 'personality_learning'
  interface_source TEXT, -- which interface triggered the change
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (personality_id) REFERENCES ai_personalities(id)
);

-- ============================================================================
-- CONTEXT: ACTIVE CONVERSATIONS & MEMORY
-- ============================================================================

-- Active conversation contexts (network-wide)
CREATE TABLE IF NOT EXISTS ai_conversation_contexts (
  id TEXT PRIMARY KEY,
  personality_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  interface_type TEXT NOT NULL,
  conversation_summary TEXT, -- quick summary for context switching
  active_topics TEXT, -- JSON array as TEXT
  last_messages TEXT, -- JSON array as TEXT
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'archived'
  FOREIGN KEY (personality_id) REFERENCES ai_personalities(id)
);

-- Short-term working memory (network-wide)
CREATE TABLE IF NOT EXISTS ai_working_memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personality_id TEXT NOT NULL,
  memory_type TEXT NOT NULL, -- 'commitment', 'reminder', 'task', 'context'
  content TEXT NOT NULL,
  priority INTEGER DEFAULT 5, -- 1-10
  expires_at TIMESTAMP, -- when to forget (NULL = permanent)
  metadata TEXT, -- JSON as TEXT
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reminded BOOLEAN DEFAULT 0,
  FOREIGN KEY (personality_id) REFERENCES ai_personalities(id)
);

-- ============================================================================
-- COMMITMENTS & TRACKING
-- ============================================================================

-- Commitments tracked by any AI personality
CREATE TABLE IF NOT EXISTS ai_commitments (
  id TEXT PRIMARY KEY,
  personality_id TEXT NOT NULL,
  commitment_text TEXT NOT NULL,
  committed_to TEXT, -- user or entity this is committed to
  deadline TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled', 'overdue'
  priority INTEGER DEFAULT 5, -- 1-10
  progress_notes TEXT, -- JSON array as TEXT
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT, -- which interface/user created it
  completed_at TIMESTAMP,
  FOREIGN KEY (personality_id) REFERENCES ai_personalities(id)
);

-- Commitment reminders and follow-ups
CREATE TABLE IF NOT EXISTS ai_commitment_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  commitment_id TEXT NOT NULL,
  remind_at TIMESTAMP NOT NULL,
  reminder_type TEXT, -- 'upcoming', 'overdue', 'follow-up'
  sent BOOLEAN DEFAULT 0,
  sent_at TIMESTAMP,
  interfaces_notified TEXT, -- JSON array as TEXT
  FOREIGN KEY (commitment_id) REFERENCES ai_commitments(id)
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
  attendees TEXT, -- JSON array as TEXT
  preparation_notes TEXT, -- what to prepare or remember
  relevant_personalities TEXT, -- JSON array as TEXT
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  external_id TEXT, -- ID from external calendar system (Google, etc.)
  source TEXT -- 'google_calendar', 'manual', 'system'
);

-- Reminder log (which interfaces were reminded)
CREATE TABLE IF NOT EXISTS ai_calendar_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  personality_id TEXT NOT NULL,
  interface_type TEXT NOT NULL,
  reminded_at TIMESTAMP NOT NULL,
  minutes_before INTEGER, -- how many minutes before event
  response TEXT, -- user response to reminder if any
  FOREIGN KEY (event_id) REFERENCES ai_calendar_events(id),
  FOREIGN KEY (personality_id) REFERENCES ai_personalities(id)
);

-- ============================================================================
-- CROSS-INTERFACE ACTIVITY
-- ============================================================================

-- Activity log from all interfaces
CREATE TABLE IF NOT EXISTS ai_activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personality_id TEXT NOT NULL,
  interface_type TEXT NOT NULL,
  interface_id TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'message', 'action', 'state_change', 'reminder'
  activity_data TEXT, -- JSON as TEXT
  user_id TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (personality_id) REFERENCES ai_personalities(id)
);

-- Real-time sync queue (for offline/async updates)
CREATE TABLE IF NOT EXISTS ai_sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personality_id TEXT NOT NULL,
  source_interface TEXT NOT NULL,
  target_interfaces TEXT, -- JSON array as TEXT (NULL = all)
  sync_type TEXT NOT NULL, -- 'state_update', 'message', 'reminder', 'commitment'
  payload TEXT NOT NULL, -- JSON as TEXT
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed BOOLEAN DEFAULT 0,
  processed_at TIMESTAMP,
  FOREIGN KEY (personality_id) REFERENCES ai_personalities(id)
);

-- ============================================================================
-- NOTIFICATIONS & MESSAGES
-- ============================================================================

-- Universal notification system
CREATE TABLE IF NOT EXISTS ai_notifications (
  id TEXT PRIMARY KEY,
  personality_id TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'reminder', 'alert', 'info', 'urgent'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_required BOOLEAN DEFAULT 0,
  action_url TEXT, -- link to take action
  target_interfaces TEXT, -- JSON array as TEXT
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (personality_id) REFERENCES ai_personalities(id)
);

-- Track which interfaces have acknowledged notifications
CREATE TABLE IF NOT EXISTS ai_notification_delivery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_id TEXT NOT NULL,
  interface_type TEXT NOT NULL,
  interface_id TEXT NOT NULL,
  delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged BOOLEAN DEFAULT 0,
  acknowledged_at TIMESTAMP,
  user_response TEXT,
  FOREIGN KEY (notification_id) REFERENCES ai_notifications(id)
);

-- ============================================================================
-- LEARNING & EFFECTIVENESS
-- ============================================================================

-- Track effectiveness of personality behaviors across interfaces
CREATE TABLE IF NOT EXISTS ai_behavior_effectiveness (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personality_id TEXT NOT NULL,
  behavior_type TEXT NOT NULL, -- 'mood_transition', 'reminder', 'challenge', 'support'
  context TEXT, -- JSON as TEXT
  outcome TEXT, -- JSON as TEXT
  effectiveness_score REAL, -- 0-1.0
  interface_type TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (personality_id) REFERENCES ai_personalities(id)
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
  ON ai_sync_queue(processed, priority DESC, created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_active 
  ON ai_notifications(personality_id, expires_at);

-- ============================================================================
-- SEED DATA: Core Personalities
-- ============================================================================

INSERT OR IGNORE INTO ai_personalities (id, name, role, description, base_traits) VALUES
  ('robbie', 'Robbie', 'assistant', 'Executive assistant and strategic partner', 
   '{"traits": ["direct", "revenue-focused", "pragmatic", "honest", "curious"], "style": "concise and actionable"}'),
  
  ('steve-jobs', 'Steve Jobs', 'mentor', 'Product and vision mentor',
   '{"traits": ["visionary", "demanding", "focused", "excellence-driven"], "style": "challenging and inspiring"}'),
  
  ('bookkeeper', 'Bookkeeper', 'specialist', 'Financial tracking and analysis',
   '{"traits": ["precise", "detail-oriented", "data-driven"], "style": "factual and clear"}'),
  
  ('gatekeeper', 'Gatekeeper', 'gatekeeper', 'Permission and security management',
   '{"traits": ["cautious", "thorough", "protective"], "style": "formal and clear"}');

-- Initialize state for core personalities
INSERT OR IGNORE INTO ai_personality_state (personality_id, current_mood, current_mode) VALUES
  ('robbie', 7, 'hyper'),
  ('steve-jobs', 5, 'mentoring'),
  ('bookkeeper', 4, 'analytical'),
  ('gatekeeper', 4, 'vigilant');

-- Add some sample working memory for Robbie
INSERT OR IGNORE INTO ai_working_memory (personality_id, memory_type, content, priority) VALUES
  ('robbie', 'task', 'Revenue urgency - deals closing NOW', 10),
  ('robbie', 'task', 'Universal AI State LIVE', 9),
  ('robbie', 'task', 'AllanBot training acceleration', 8);

-- Add a sample commitment for Robbie
INSERT OR IGNORE INTO ai_commitments (id, personality_id, commitment_text, committed_to, deadline, priority) VALUES
  ('ship-universal-state', 'robbie', 'Ship Universal AI State system', 'Allan', datetime('now', '+2 days'), 10);


