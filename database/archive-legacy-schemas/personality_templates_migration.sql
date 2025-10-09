-- Aurora RobbieVerse Migration: Personalities and Templates
-- Creates tables for custom personalities and conversation templates

BEGIN;

-- Custom Personalities
CREATE TABLE IF NOT EXISTS custom_personalities (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    traits JSONB NOT NULL DEFAULT '[]'::jsonb,
    communication_style TEXT,
    expertise JSONB NOT NULL DEFAULT '[]'::jsonb,
    personality_prompt TEXT NOT NULL,
    response_style TEXT,
    emoji_usage TEXT,
    formality_level TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_personalities_user_id ON custom_personalities(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_personalities_created_at ON custom_personalities(created_at);

-- Conversation Templates
CREATE TABLE IF NOT EXISTS conversation_templates (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    personality TEXT NOT NULL,
    initial_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    suggested_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    context_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_templates_user_id ON conversation_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_templates_category ON conversation_templates(category);
CREATE INDEX IF NOT EXISTS idx_conversation_templates_created_at ON conversation_templates(created_at);

COMMIT;






















































