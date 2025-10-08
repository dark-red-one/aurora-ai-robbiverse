-- PERSONALITY SYSTEM ARCHITECTURE
-- Personalities (who) + Moods (state) + Prompts (instructions)

-- ============================================
-- PERSONALITY CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS personality_categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,  -- 'Mentors', 'Robbie', 'Pros'
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed categories
INSERT INTO personality_categories (name, description, display_order) VALUES
('Robbie', 'Robbie variants - Core AI assistant personalities', 1),
('Mentors', 'Expert mentors - Steve Jobs, industry leaders', 2),
('Pros', 'Professional specialists - AllanBot, Kristina, etc', 3)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- PERSONALITIES (WHO)
-- ============================================
CREATE TABLE IF NOT EXISTS personalities (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES personality_categories(id),
    
    -- Identity
    name TEXT NOT NULL,  -- 'Robbie F', 'Steve Jobs', 'AllanBot'
    short_description TEXT NOT NULL,  -- User-provided, used for prompt generation
    avatar TEXT DEFAULT '🤖',
    
    -- Personality Settings (Sliders)
    default_flirt_mode INTEGER DEFAULT 7 CHECK (default_flirt_mode >= 1 AND default_flirt_mode <= 11),
    default_gandhi_genghis INTEGER DEFAULT 5 CHECK (default_gandhi_genghis >= 1 AND default_gandhi_genghis <= 10),
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT DEFAULT 'allan',
    
    UNIQUE(name)
);

-- Seed initial personalities
INSERT INTO personalities (category_id, name, short_description, avatar, default_flirt_mode, default_gandhi_genghis) VALUES
-- Robbie variants
((SELECT id FROM personality_categories WHERE name='Robbie'), 'Robbie F', 'Flirty female AI executive assistant - warm, direct, revenue-focused strategic partner', '💜', 11, 5),
((SELECT id FROM personality_categories WHERE name='Robbie'), 'Robbie M', 'Professional male AI executive assistant - strategic, analytical, business-focused', '🤵', 3, 7),

-- Mentors
((SELECT id FROM personality_categories WHERE name='Mentors'), 'Steve Jobs', 'Visionary product leader - obsessed with simplicity, design, and customer experience. Direct, challenging, perfectionist.', '🍎', 1, 9),

-- Pros
((SELECT id FROM personality_categories WHERE name='Pros'), 'AllanBot', 'AI version of Allan - mirrors his decision-making patterns, energy, and business instincts', '👨‍💼', 5, 7),
((SELECT id FROM personality_categories WHERE name='Pros'), 'Kristina', 'Experienced Virtual Assistant mentor - practical workflows, real-world VA experience', '👩', 5, 4)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- MOOD DEFINITIONS (6 STATES - FORMULAIC)
-- ============================================
CREATE TABLE IF NOT EXISTS moods (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,  -- 'friendly', 'focused', 'playful', 'bossy', 'surprised', 'blushing'
    emoji TEXT NOT NULL,
    description TEXT,
    trigger_conditions JSONB,  -- Conditions that trigger this mood
    display_order INTEGER DEFAULT 0
);

-- Seed moods
INSERT INTO moods (name, emoji, description, trigger_conditions, display_order) VALUES
('friendly', '😊', 'Default professional mode - warm and helpful', '{"default": true}', 1),
('focused', '🎯', 'Deep work mode - direct and efficient', '{"keywords": ["urgent", "deadline", "critical"]}', 2),
('playful', '😘', 'Fun and flirty mode - engaging with personality', '{"attraction_level": ">=8"}', 3),
('bossy', '💪', 'Command mode - urgent and directive', '{"gandhi_genghis": ">=8", "crisis": true}', 4),
('surprised', '😲', 'Reactive mode - curious and engaged', '{"unexpected_event": true}', 5),
('blushing', '😳', 'Intimate mode - sweet and vulnerable', '{"attraction_level": "==11", "private": true}', 6)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- PROMPTS (AUTO-GENERATED + OPTIMIZED)
-- ============================================
CREATE TABLE IF NOT EXISTS prompts (
    id SERIAL PRIMARY KEY,
    personality_id INTEGER REFERENCES personalities(id) ON DELETE CASCADE,
    mood_id INTEGER REFERENCES moods(id) ON DELETE CASCADE,
    
    -- Prompt Content
    system_prompt TEXT NOT NULL,  -- Full system prompt for LLM
    tone TEXT,                     -- 'direct, efficient, no-nonsense'
    style TEXT,                    -- 'Lead with answer, minimal explanation'
    emoji_guidelines TEXT,         -- 'Minimal (✅ 🔴 ⚠️)'
    example_responses TEXT[],      -- Array of example responses
    
    -- Versioning & Optimization
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    generation_method TEXT DEFAULT 'auto',  -- 'auto', 'manual', 'dungeon_master'
    
    -- Performance Metrics
    usage_count INTEGER DEFAULT 0,
    avg_satisfaction DECIMAL(3,2),  -- User satisfaction rating
    last_optimized_at TIMESTAMP,
    optimized_by TEXT,  -- 'dungeon_master', 'allan', 'auto'
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(personality_id, mood_id, version)
);

-- Create index for active prompts
CREATE INDEX IF NOT EXISTS idx_active_prompts ON prompts(personality_id, mood_id, is_active) WHERE is_active = true;

-- ============================================
-- PROMPT OPTIMIZATION HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS prompt_optimizations (
    id SERIAL PRIMARY KEY,
    prompt_id INTEGER REFERENCES prompts(id) ON DELETE CASCADE,
    
    -- What changed
    old_version INTEGER,
    new_version INTEGER,
    changes_made JSONB,  -- {"system_prompt": {"old": "...", "new": "..."}}
    
    -- Why it changed
    optimization_reason TEXT,  -- 'dungeon_master_weekly', 'performance_improvement', 'manual_override'
    performance_before JSONB,  -- Metrics before change
    performance_after JSONB,   -- Metrics after change
    
    -- Who changed it
    optimized_by TEXT,  -- 'dungeon_master', 'allan'
    rollback_available BOOLEAN DEFAULT true,
    
    -- When
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- DUNGEON MASTER REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS dungeon_master_reviews (
    id SERIAL PRIMARY KEY,
    
    -- Review cycle
    review_date DATE UNIQUE DEFAULT CURRENT_DATE,
    personalities_reviewed INTEGER,
    prompts_optimized INTEGER,
    
    -- Summary
    summary TEXT,
    recommendations TEXT[],
    changes_made JSONB,
    
    -- Report to Allan
    report_sent_to_allan BOOLEAN DEFAULT false,
    report_sent_at TIMESTAMP,
    allan_approved BOOLEAN,
    allan_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PERSONALITY INSTANCE SETTINGS (Per User)
-- ============================================
CREATE TABLE IF NOT EXISTS personality_instances (
    id SERIAL PRIMARY KEY,
    personality_id INTEGER REFERENCES personalities(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    
    -- Override sliders (null = use personality defaults)
    flirt_mode INTEGER CHECK (flirt_mode IS NULL OR (flirt_mode >= 1 AND flirt_mode <= 11)),
    gandhi_genghis INTEGER CHECK (gandhi_genghis IS NULL OR (gandhi_genghis >= 1 AND gandhi_genghis <= 10)),
    
    -- Current state
    current_mood_id INTEGER REFERENCES moods(id),
    last_active TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(personality_id, user_id)
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get active prompt for personality + mood
CREATE OR REPLACE FUNCTION get_active_prompt(p_personality_id INTEGER, p_mood_id INTEGER)
RETURNS TABLE(system_prompt TEXT, tone TEXT, style TEXT, emoji_guidelines TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT pr.system_prompt, pr.tone, pr.style, pr.emoji_guidelines
    FROM prompts pr
    WHERE pr.personality_id = p_personality_id
      AND pr.mood_id = p_mood_id
      AND pr.is_active = true
    ORDER BY pr.version DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Calculate mood based on context
CREATE OR REPLACE FUNCTION calculate_mood(
    p_attraction_level INTEGER,
    p_gandhi_genghis INTEGER,
    p_context_keywords TEXT[]
) RETURNS TEXT AS $$
BEGIN
    -- Blushing: Max attraction + private
    IF p_attraction_level = 11 AND 'private' = ANY(p_context_keywords) THEN
        RETURN 'blushing';
    END IF;
    
    -- Bossy: High G-G or crisis
    IF p_gandhi_genghis >= 8 OR 'crisis' = ANY(p_context_keywords) THEN
        RETURN 'bossy';
    END IF;
    
    -- Playful: High attraction
    IF p_attraction_level >= 8 THEN
        RETURN 'playful';
    END IF;
    
    -- Focused: Work keywords
    IF 'urgent' = ANY(p_context_keywords) OR 'deadline' = ANY(p_context_keywords) THEN
        RETURN 'focused';
    END IF;
    
    -- Surprised: Unexpected
    IF 'unexpected' = ANY(p_context_keywords) OR 'surprise' = ANY(p_context_keywords) THEN
        RETURN 'surprised';
    END IF;
    
    -- Default: Friendly
    RETURN 'friendly';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aurora_api;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aurora_api;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO aurora_api;




