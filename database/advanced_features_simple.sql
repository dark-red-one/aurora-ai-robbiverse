-- Aurora RobbieVerse Migration: Advanced Features (Simplified)
-- Creates tables for collaborative templates, personality learning, and semantic search

-- Template Collaboration Tables
CREATE TABLE IF NOT EXISTS template_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id TEXT NOT NULL REFERENCES conversation_templates(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visibility TEXT NOT NULL CHECK (visibility IN ('private', 'public', 'shared', 'community')),
    shared_with_users JSONB NOT NULL DEFAULT '[]'::jsonb,
    allow_forking BOOLEAN NOT NULL DEFAULT true,
    allow_editing BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS template_forks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_template_id TEXT NOT NULL REFERENCES conversation_templates(id) ON DELETE CASCADE,
    forked_template_id TEXT NOT NULL REFERENCES conversation_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS template_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id TEXT NOT NULL REFERENCES conversation_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(template_id, user_id)
);

CREATE TABLE IF NOT EXISTS template_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id TEXT NOT NULL REFERENCES conversation_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Personality Learning Tables
CREATE TABLE IF NOT EXISTS personality_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    personality_id TEXT NOT NULL,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('positive', 'negative', 'neutral', 'rollback', 'branch')),
    context_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personality_learning_profiles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    personality_id TEXT NOT NULL,
    learning_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, personality_id)
);

CREATE TABLE IF NOT EXISTS adaptive_personalities (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    base_personality_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    adapted_traits JSONB NOT NULL DEFAULT '[]'::jsonb,
    adapted_communication_style TEXT,
    adapted_expertise JSONB NOT NULL DEFAULT '[]'::jsonb,
    personality_prompt TEXT NOT NULL,
    learning_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Semantic Search Tables
CREATE TABLE IF NOT EXISTS search_indexes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    conversation_index JSONB NOT NULL DEFAULT '{}'::jsonb,
    message_index JSONB NOT NULL DEFAULT '{}'::jsonb,
    template_index JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_global BOOLEAN NOT NULL DEFAULT false
);

-- Add metadata column to existing tables if not exists
ALTER TABLE conversation_templates 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_shares_template_id ON template_shares(template_id);
CREATE INDEX IF NOT EXISTS idx_template_shares_visibility ON template_shares(visibility);
CREATE INDEX IF NOT EXISTS idx_template_shares_owner ON template_shares(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_template_forks_original ON template_forks(original_template_id);
CREATE INDEX IF NOT EXISTS idx_template_forks_forked ON template_forks(forked_template_id);

CREATE INDEX IF NOT EXISTS idx_template_ratings_template ON template_ratings(template_id);
CREATE INDEX IF NOT EXISTS idx_template_ratings_rating ON template_ratings(rating);

CREATE INDEX IF NOT EXISTS idx_template_usage_stats_template ON template_usage_stats(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_stats_created_at ON template_usage_stats(created_at);

CREATE INDEX IF NOT EXISTS idx_personality_interactions_user_id ON personality_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_interactions_personality_id ON personality_interactions(personality_id);
CREATE INDEX IF NOT EXISTS idx_personality_interactions_created_at ON personality_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_personality_learning_profiles_user_id ON personality_learning_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_adaptive_personalities_user_id ON adaptive_personalities(user_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_personalities_base_personality ON adaptive_personalities(base_personality_id);

CREATE INDEX IF NOT EXISTS idx_search_indexes_user_id ON search_indexes(user_id);
CREATE INDEX IF NOT EXISTS idx_search_indexes_global ON search_indexes(is_global);











