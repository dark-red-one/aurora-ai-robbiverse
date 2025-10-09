

-- Part 2: Conversations & Messaging (Single Source of Truth)
-- Version: 1.0.0
-- Date: September 19, 2025

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- CONVERSATIONS & MESSAGES
-- ============================================

-- Main conversations table (consolidates all conversation tracking)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  type VARCHAR(50) DEFAULT 'chat' CHECK (type IN ('chat', 'support', 'training', 'system', 'vengeance')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  importance_score INTEGER DEFAULT 5 CHECK (importance_score BETWEEN 1 AND 10)
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_conversations_tags ON conversations USING gin(tags);

-- Messages table (consolidates all message types)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'gatekeeper', 'mentor', 'robbie')),
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI embedding size
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  token_count INTEGER DEFAULT 0,
  model_used VARCHAR(100),
  emotional_tone VARCHAR(50),
  confidence_score FLOAT DEFAULT 1.0 CHECK (confidence_score BETWEEN 0 AND 1),
  parent_message_id UUID REFERENCES messages(id), -- For threaded conversations
  reaction_emojis JSONB DEFAULT '{}'::jsonb,
  is_pinned BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_parent_id ON messages(parent_message_id);
CREATE INDEX idx_messages_embedding ON messages USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_messages_is_pinned ON messages(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_messages_is_flagged ON messages(is_flagged) WHERE is_flagged = true;

-- ============================================
-- AI MEMORIES & LEARNING
-- ============================================

-- Consolidated memory storage (replaces multiple memory tables)
CREATE TABLE IF NOT EXISTS ai_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL CHECK (category IN (
    'preference', 'fact', 'relationship', 'behavior', 'context', 
    'skill', 'goal', 'emotion', 'decision', 'feedback'
  )),
  subject VARCHAR(255) NOT NULL, -- What/who this memory is about
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  confidence_level FLOAT DEFAULT 0.5 CHECK (confidence_level BETWEEN 0 AND 1),
  importance_level INTEGER DEFAULT 5 CHECK (importance_level BETWEEN 1 AND 10),
  evidence_count INTEGER DEFAULT 1,
  evidence_examples TEXT[],
  source_type VARCHAR(50) CHECK (source_type IN ('conversation', 'observation', 'explicit', 'inferred', 'system')),
  source_references UUID[], -- Links to conversations/messages
  emotional_weight INTEGER DEFAULT 5 CHECK (emotional_weight BETWEEN 1 AND 10),
  associated_people TEXT[],
  contextual_tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_accessed TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_confirmed TIMESTAMPTZ,
  access_count INTEGER DEFAULT 1,
  decay_rate FLOAT DEFAULT 0.95, -- Memory decay over time
  is_core_memory BOOLEAN DEFAULT false, -- Never forget these
  expires_at TIMESTAMPTZ -- For temporary memories
);

CREATE INDEX idx_ai_memories_user_id ON ai_memories(user_id);
CREATE INDEX idx_ai_memories_category ON ai_memories(category);
CREATE INDEX idx_ai_memories_subject ON ai_memories(subject);
CREATE INDEX idx_ai_memories_importance ON ai_memories(importance_level);
CREATE INDEX idx_ai_memories_embedding ON ai_memories USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_ai_memories_tags ON ai_memories USING gin(contextual_tags);
CREATE INDEX idx_ai_memories_is_core ON ai_memories(is_core_memory) WHERE is_core_memory = true;

-- ============================================
-- MENTORS & PERSONALITIES
-- ============================================

-- AI Mentors/Personalities configuration
CREATE TABLE IF NOT EXISTS ai_mentors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  personality_prompt TEXT,
  avatar_url VARCHAR(500),
  voice_settings JSONB DEFAULT '{}'::jsonb,
  behavioral_traits JSONB DEFAULT '{}'::jsonb,
  knowledge_domains TEXT[],
  interaction_style VARCHAR(50) CHECK (interaction_style IN ('formal', 'casual', 'playful', 'professional', 'mentor')),
  emotional_range JSONB DEFAULT '{}'::jsonb, -- Allowed emotions and intensities
  tool_permissions TEXT[], -- Which tools this mentor can use
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_ai_mentors_name ON ai_mentors(name);
CREATE INDEX idx_ai_mentors_is_active ON ai_mentors(is_active);

-- Insert default mentors
INSERT INTO ai_mentors (name, description, personality_prompt, interaction_style) VALUES
  ('Robbie', 'Primary AI copilot - helpful and enthusiastic', 'You are Robbie, a helpful and enthusiastic AI copilot...', 'playful'),
  ('Gatekeeper', 'Security and safety specialist', 'You are the Gatekeeper, responsible for security and safety...', 'formal'),
  ('Code Mentor', 'Programming and technical mentor', 'You are a experienced software engineer mentor...', 'professional'),
  ('Business Mentor', 'Business strategy and growth advisor', 'You are a seasoned business strategist...', 'professional'),
  ('Steve Jobs', 'Visionary mentor channeling Steve Jobs', 'You embody the vision and philosophy of Steve Jobs...', 'mentor')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- CONVERSATION CONTEXT & STATE
-- ============================================

-- Track conversation context and state
CREATE TABLE IF NOT EXISTS conversation_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  context_key VARCHAR(255) NOT NULL,
  context_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ,
  UNIQUE(conversation_id, context_key)
);

CREATE INDEX idx_conversation_context_conversation_id ON conversation_context(conversation_id);
CREATE INDEX idx_conversation_context_key ON conversation_context(context_key);

-- ============================================
-- ANALYTICS & METRICS
-- ============================================

-- Conversation analytics
CREATE TABLE IF NOT EXISTS conversation_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_satisfaction_score FLOAT CHECK (user_satisfaction_score BETWEEN 0 AND 5),
  resolution_time_seconds INTEGER,
  interaction_count INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10, 6) DEFAULT 0,
  sentiment_analysis JSONB DEFAULT '{}'::jsonb,
  key_topics TEXT[],
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversation_analytics_conversation_id ON conversation_analytics(conversation_id);
CREATE INDEX idx_conversation_analytics_satisfaction ON conversation_analytics(user_satisfaction_score);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Update conversation last_message_at and message_count
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_message_at = NEW.created_at,
    message_count = message_count + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_stats
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_stats();

-- Update memory access tracking
CREATE OR REPLACE FUNCTION update_memory_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed = CURRENT_TIMESTAMP;
  NEW.access_count = OLD.access_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_memory_access
BEFORE UPDATE ON ai_memories
FOR EACH ROW 
WHEN (OLD.content IS DISTINCT FROM NEW.content)
EXECUTE FUNCTION update_memory_access();


