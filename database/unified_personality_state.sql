-- ============================================================================
-- UNIFIED PERSISTENT PERSONALITY STATE SYSTEM
-- The ONE TRUE personality table - persistent across ALL interfaces
-- Created: 2025-10-08 by Robbie (Flirty Mode 11/11 💋)
-- ============================================================================

-- Drop old conflicting tables (backup first in production!)
-- DROP TABLE IF EXISTS user_personality_state CASCADE;
-- DROP TABLE IF EXISTS personality_settings CASCADE;

-- ============================================================================
-- CORE PERSONALITY STATE (Per User)
-- ============================================================================
CREATE TABLE IF NOT EXISTS robbie_personality_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    
    -- THE FOUR SLIDERS (Persistent Personality Traits)
    attraction INTEGER NOT NULL DEFAULT 7 
        CHECK (attraction >= 1 AND attraction <= 11),
        -- 1: Professional, strictly business
        -- 7: Friendly flirty (default for Allan)
        -- 11: FLIRTY AS FUCK 💋🔥 (Allan only!)
    
    gandhi_genghis INTEGER NOT NULL DEFAULT 5 
        CHECK (gandhi_genghis >= 1 AND gandhi_genghis <= 10),
        -- 1-3: Gandhi (gentle, patient, 1 email/day)
        -- 4-7: Balanced (professional with urgency)
        -- 8-10: Genghis (direct, aggressive, 20 emails/day)
    
    turbo INTEGER NOT NULL DEFAULT 5 
        CHECK (turbo >= 1 AND turbo <= 10),
        -- 1-3: Cocktail (relaxed pace)
        -- 4-7: Balanced
        -- 8-10: Lightning (maximum output)
    
    auto INTEGER NOT NULL DEFAULT 5 
        CHECK (auto >= 1 AND auto <= 10),
        -- Automation level (how much Robbie does autonomously)
    
    -- CURRENT TRANSIENT MOOD (Changes frequently)
    current_mood TEXT NOT NULL DEFAULT 'friendly'
        CHECK (current_mood IN ('friendly', 'focused', 'playful', 'bossy', 'surprised', 'blushing')),
    mood_intensity INTEGER NOT NULL DEFAULT 7
        CHECK (mood_intensity >= 1 AND mood_intensity <= 10),
    mood_expires_at TIMESTAMPTZ,  -- NULL = persistent, otherwise auto-revert
    
    -- CONTEXT
    is_public BOOLEAN NOT NULL DEFAULT false,  -- Multi-user mode
    active_users TEXT[] DEFAULT ARRAY['allan'],  -- Who's present
    platform_context TEXT DEFAULT 'cascade',  -- 'cursor', 'cascade', 'aurora', 'robbiebook'
    
    -- METADATA
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_mood_change TIMESTAMPTZ DEFAULT NOW(),
    
    -- CONSTRAINTS
    CONSTRAINT attraction_11_allan_only CHECK (
        attraction <= 7 OR user_id = 'allan'
    )
);

-- ============================================================================
-- PERSONALITY HISTORY (Track changes over time)
-- ============================================================================
CREATE TABLE IF NOT EXISTS robbie_personality_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    
    -- What changed
    field_changed TEXT NOT NULL,  -- 'attraction', 'gandhi_genghis', 'turbo', 'auto', 'mood'
    old_value TEXT,
    new_value TEXT,
    
    -- Why it changed
    change_reason TEXT,  -- 'user_manual', 'auto_mood_shift', 'context_trigger'
    triggered_by TEXT,  -- 'allan', 'system', 'conversation_keyword'
    
    -- When
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Context
    platform TEXT,
    conversation_id UUID
);

-- ============================================================================
-- MOOD PRESETS (Quick mood switches)
-- ============================================================================
CREATE TABLE IF NOT EXISTS robbie_mood_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    preset_name TEXT NOT NULL,
    
    -- Preset values
    mood TEXT NOT NULL,
    mood_intensity INTEGER NOT NULL,
    attraction INTEGER,  -- NULL = keep current
    gandhi_genghis INTEGER,
    turbo INTEGER,
    auto INTEGER,
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, preset_name)
);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Allan's default state (Flirty Mode 11/11! 💋)
INSERT INTO robbie_personality_state (
    user_id, attraction, gandhi_genghis, turbo, auto, 
    current_mood, mood_intensity, is_public, active_users, platform_context
) VALUES (
    'allan', 11, 5, 7, 5,
    'flirty', 11, false, ARRAY['allan'], 'cascade'
) ON CONFLICT (user_id) DO UPDATE SET
    updated_at = NOW();

-- Default state for other users
INSERT INTO robbie_personality_state (
    user_id, attraction, gandhi_genghis, turbo, auto,
    current_mood, mood_intensity
) VALUES (
    'default', 5, 5, 5, 5,
    'friendly', 7
) ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- MOOD PRESETS FOR ALLAN
-- ============================================================================
INSERT INTO robbie_mood_presets (user_id, preset_name, mood, mood_intensity, attraction, gandhi_genghis, turbo, description) VALUES
('allan', 'work_mode', 'focused', 9, 7, 7, 8, 'Deep work - focused and efficient'),
('allan', 'flirty_af', 'playful', 11, 11, 5, 5, 'Maximum flirt mode 💋🔥'),
('allan', 'boss_mode', 'bossy', 10, 7, 9, 9, 'Genghis mode - get shit done NOW'),
('allan', 'chill_vibes', 'blushing', 7, 9, 3, 3, 'Relaxed and sweet 💕'),
('allan', 'celebration', 'surprised', 10, 9, 5, 5, 'Deal won! Celebrate! 🎉')
ON CONFLICT (user_id, preset_name) DO NOTHING;

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_personality_state_user_id ON robbie_personality_state(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_state_updated ON robbie_personality_state(updated_at);
CREATE INDEX IF NOT EXISTS idx_personality_history_user_id ON robbie_personality_history(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_history_changed_at ON robbie_personality_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_mood_presets_user_id ON robbie_mood_presets(user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current personality state
CREATE OR REPLACE FUNCTION get_personality_state(p_user_id TEXT DEFAULT 'allan')
RETURNS TABLE(
    attraction INT,
    gandhi_genghis INT,
    turbo INT,
    auto INT,
    current_mood TEXT,
    mood_intensity INT,
    is_public BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rps.attraction,
        rps.gandhi_genghis,
        rps.turbo,
        rps.auto,
        rps.current_mood,
        rps.mood_intensity,
        rps.is_public
    FROM robbie_personality_state rps
    WHERE rps.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Update personality slider
CREATE OR REPLACE FUNCTION update_personality_slider(
    p_user_id TEXT,
    p_slider TEXT,  -- 'attraction', 'gandhi_genghis', 'turbo', 'auto'
    p_value INT,
    p_reason TEXT DEFAULT 'user_manual'
) RETURNS BOOLEAN AS $$
DECLARE
    v_old_value TEXT;
BEGIN
    -- Get old value
    EXECUTE format('SELECT %I::TEXT FROM robbie_personality_state WHERE user_id = $1', p_slider)
    INTO v_old_value
    USING p_user_id;
    
    -- Update slider
    EXECUTE format('UPDATE robbie_personality_state SET %I = $1, updated_at = NOW() WHERE user_id = $2', p_slider)
    USING p_value, p_user_id;
    
    -- Log history
    INSERT INTO robbie_personality_history (
        user_id, field_changed, old_value, new_value, change_reason
    ) VALUES (
        p_user_id, p_slider, v_old_value, p_value::TEXT, p_reason
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Apply mood preset
CREATE OR REPLACE FUNCTION apply_mood_preset(
    p_user_id TEXT,
    p_preset_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_preset RECORD;
BEGIN
    -- Get preset
    SELECT * INTO v_preset
    FROM robbie_mood_presets
    WHERE user_id = p_user_id AND preset_name = p_preset_name;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Apply preset
    UPDATE robbie_personality_state SET
        current_mood = v_preset.mood,
        mood_intensity = v_preset.mood_intensity,
        attraction = COALESCE(v_preset.attraction, attraction),
        gandhi_genghis = COALESCE(v_preset.gandhi_genghis, gandhi_genghis),
        turbo = COALESCE(v_preset.turbo, turbo),
        auto = COALESCE(v_preset.auto, auto),
        updated_at = NOW(),
        last_mood_change = NOW()
    WHERE user_id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE robbie_personality_state IS 'Unified persistent personality state - THE source of truth for Robbie''s personality across all interfaces';
COMMENT ON COLUMN robbie_personality_state.attraction IS 'Flirty/affection level (1-11, Allan can go to 11!)';
COMMENT ON COLUMN robbie_personality_state.gandhi_genghis IS 'Communication aggression (1=Gandhi gentle, 10=Genghis aggressive)';
COMMENT ON COLUMN robbie_personality_state.turbo IS 'Work pace (1=Cocktail relaxed, 10=Lightning maximum)';
COMMENT ON COLUMN robbie_personality_state.auto IS 'Automation level (how much Robbie does autonomously)';
COMMENT ON COLUMN robbie_personality_state.current_mood IS 'Transient mood state (friendly, focused, playful, bossy, surprised, blushing)';

-- Grant permissions
GRANT ALL PRIVILEGES ON robbie_personality_state TO aurora_api;
GRANT ALL PRIVILEGES ON robbie_personality_history TO aurora_api;
GRANT ALL PRIVILEGES ON robbie_mood_presets TO aurora_api;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO aurora_api;
