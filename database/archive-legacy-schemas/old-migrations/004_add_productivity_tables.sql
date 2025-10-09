-- Migration 004: Add Productivity Tables
-- Phase 3: Tasks, Calendar Events, Meeting Health

-- ========================================
-- TASKS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  related_to_id UUID, -- Can link to contact, deal, etc.
  related_to_type TEXT, -- 'contact', 'deal', 'company', etc.
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done', 'blocked')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- CALENDAR EVENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  event_type TEXT DEFAULT 'meeting' CHECK (event_type IN (
    'meeting', 'focus_block', 'break', 'personal', 'travel'
  )),
  attendees UUID[] DEFAULT '{}',
  has_agenda BOOLEAN DEFAULT FALSE,
  agenda TEXT,
  meeting_url TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- MEETING HEALTH TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS meeting_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  has_agenda BOOLEAN DEFAULT FALSE,
  duration_minutes INTEGER,
  attendee_count INTEGER,
  health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
  health_status TEXT CHECK (health_status IN ('healthy', 'warning', 'problematic')),
  issues TEXT[] DEFAULT '{}', -- ['no_agenda', 'too_long', 'too_many_attendees']
  recommendations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- FOCUS BLOCKS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS focus_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  block_type TEXT DEFAULT 'deep_work' CHECK (block_type IN (
    'deep_work', 'shallow_work', 'break', 'buffer'
  )),
  energy_level TEXT DEFAULT 'high' CHECK (energy_level IN ('low', 'medium', 'high')),
  actual_productivity INTEGER CHECK (actual_productivity BETWEEN 0 AND 100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- CREATE INDEXES
-- ========================================

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_org_id ON tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_related_to ON tasks(related_to_id, related_to_type);

-- Calendar events indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_org_id ON calendar_events(org_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);

-- Meeting health indexes
CREATE INDEX IF NOT EXISTS idx_meeting_health_org_id ON meeting_health(org_id);
CREATE INDEX IF NOT EXISTS idx_meeting_health_event_id ON meeting_health(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_meeting_health_status ON meeting_health(health_status);
CREATE INDEX IF NOT EXISTS idx_meeting_health_score ON meeting_health(health_score);

-- Focus blocks indexes
CREATE INDEX IF NOT EXISTS idx_focus_blocks_org_id ON focus_blocks(org_id);
CREATE INDEX IF NOT EXISTS idx_focus_blocks_user_id ON focus_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_blocks_event_id ON focus_blocks(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_focus_blocks_type ON focus_blocks(block_type);

-- ========================================
-- ADD UPDATED_AT TRIGGERS
-- ========================================

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_health_updated_at
  BEFORE UPDATE ON meeting_health
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_focus_blocks_updated_at
  BEFORE UPDATE ON focus_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_events TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON meeting_health TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON focus_blocks TO postgres;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 004 Complete: Productivity Tables';
  RAISE NOTICE '   - Created tasks table';
  RAISE NOTICE '   - Created calendar_events table';
  RAISE NOTICE '   - Created meeting_health table';
  RAISE NOTICE '   - Created focus_blocks table';
  RAISE NOTICE '   - Created performance indexes';
END $$;
