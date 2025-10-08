-- Migration 005: Add Memory & AI Tables
-- Phase 4: Sticky Notes, Knowledge Base, AI Tracking

-- ========================================
-- STICKY NOTES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS sticky_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'achievement', 'feedback', 'decision', 'insight', 'personal', 'business', 'celebration'
  )),
  importance_score DECIMAL(3,2) CHECK (importance_score BETWEEN 0 AND 1),
  people_mentioned TEXT[] DEFAULT '{}',
  companies_mentioned TEXT[] DEFAULT '{}',
  projects_mentioned TEXT[] DEFAULT '{}',
  emotional_tone TEXT CHECK (emotional_tone IN ('positive', 'neutral', 'concerned', 'excited')),
  sharing_potential DECIMAL(3,2) CHECK (sharing_potential BETWEEN 0 AND 1),
  celebration_potential DECIMAL(3,2) CHECK (celebration_potential BETWEEN 0 AND 1),
  context TEXT,
  source_type TEXT CHECK (source_type IN ('chat', 'email', 'meeting', 'slack', 'manual')),
  source_metadata JSONB DEFAULT '{}'::jsonb,
  is_private BOOLEAN DEFAULT TRUE,
  permission_requested BOOLEAN DEFAULT FALSE,
  permission_granted BOOLEAN DEFAULT FALSE,
  permission_granted_at TIMESTAMPTZ,
  permission_denied_at TIMESTAMPTZ,
  color TEXT DEFAULT 'yellow',
  tags TEXT[] DEFAULT '{}',
  related_to_id UUID,
  related_to_type TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- KNOWLEDGE BASE TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  source_type TEXT,
  source_id UUID,
  is_public BOOLEAN DEFAULT FALSE,
  access_level TEXT DEFAULT 'private' CHECK (access_level IN ('private', 'team', 'org', 'public')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- AI MODEL USAGE TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS ai_model_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  model_name TEXT NOT NULL,
  model_provider TEXT NOT NULL,
  task_type TEXT, -- 'chat', 'embedding', 'completion', 'analysis'
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6),
  latency_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- AI COSTS TABLE (Aggregated)
-- ========================================
CREATE TABLE IF NOT EXISTS ai_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  model_name TEXT NOT NULL,
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(org_id, date, model_name)
);

-- ========================================
-- PERSONALITY SETTINGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS personality_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flirt_mode INTEGER DEFAULT 5 CHECK (flirt_mode BETWEEN 1 AND 10),
  gandhi_genghis_level INTEGER DEFAULT 3 CHECK (gandhi_genghis_level BETWEEN 1 AND 6),
  cocktail_lightning_level INTEGER DEFAULT 50 CHECK (cocktail_lightning_level BETWEEN 0 AND 100),
  current_mood TEXT DEFAULT 'neutral',
  current_expression TEXT DEFAULT 'friendly',
  personality_mode TEXT DEFAULT 'professional',
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- MENTOR MOODS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS mentor_moods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  mood_name TEXT NOT NULL CHECK (mood_name IN ('confident', 'thoughtful', 'concerned', 'determined')),
  avatar_url TEXT,
  personality_prompt_override TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mentor_id, mood_name)
);

-- ========================================
-- CREATE INDEXES
-- ========================================

-- Sticky notes indexes
CREATE INDEX IF NOT EXISTS idx_sticky_notes_org_id ON sticky_notes(org_id);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_user_id ON sticky_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_category ON sticky_notes(category);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_importance ON sticky_notes(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_is_private ON sticky_notes(is_private);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_created_at ON sticky_notes(created_at DESC);

-- Knowledge base indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_org_id ON knowledge_base(org_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user_id ON knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_access_level ON knowledge_base(access_level);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);

-- AI model usage indexes
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_org_id ON ai_model_usage(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_user_id ON ai_model_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_model_name ON ai_model_usage(model_name);
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_created_at ON ai_model_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_success ON ai_model_usage(success);

-- AI costs indexes
CREATE INDEX IF NOT EXISTS idx_ai_costs_org_id ON ai_costs(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_costs_date ON ai_costs(date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_costs_model_name ON ai_costs(model_name);

-- Personality settings indexes
CREATE INDEX IF NOT EXISTS idx_personality_settings_user_id ON personality_settings(user_id);

-- Mentor moods indexes
CREATE INDEX IF NOT EXISTS idx_mentor_moods_mentor_id ON mentor_moods(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_moods_mood_name ON mentor_moods(mood_name);

-- ========================================
-- ADD UPDATED_AT TRIGGERS
-- ========================================

CREATE TRIGGER update_sticky_notes_updated_at
  BEFORE UPDATE ON sticky_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_costs_updated_at
  BEFORE UPDATE ON ai_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personality_settings_updated_at
  BEFORE UPDATE ON personality_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON sticky_notes TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON knowledge_base TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_model_usage TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_costs TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON personality_settings TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_moods TO postgres;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 005 Complete: Memory & AI Tables';
  RAISE NOTICE '   - Created sticky_notes table';
  RAISE NOTICE '   - Created knowledge_base table';
  RAISE NOTICE '   - Created ai_model_usage table';
  RAISE NOTICE '   - Created ai_costs table';
  RAISE NOTICE '   - Created personality_settings table';
  RAISE NOTICE '   - Created mentor_moods table';
  RAISE NOTICE '   - Created performance indexes';
END $$;