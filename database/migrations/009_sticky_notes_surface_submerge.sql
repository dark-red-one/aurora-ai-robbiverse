-- ===================================================================
-- Migration 009: Sticky Notes Surface/Submerge Intelligence System
-- Date: 2025-10-08
-- Description: Transform sticky notes into Robbie's complete memory
--              with surface/submerge capabilities
-- ===================================================================

-- Add new columns to existing sticky_notes table
ALTER TABLE sticky_notes
ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'allan',
ADD COLUMN IF NOT EXISTS surface_status TEXT DEFAULT 'submerged' CHECK (surface_status IN ('surfaced', 'submerged', 'always_visible')),
ADD COLUMN IF NOT EXISTS surface_priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS surface_reason TEXT,
ADD COLUMN IF NOT EXISTS context_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS linked_files JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS linked_contacts TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS linked_deals UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS linked_tasks UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_surfaced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS surface_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dismissed_count INTEGER DEFAULT 0;

-- Create index on surface status for fast queries
CREATE INDEX IF NOT EXISTS idx_sticky_notes_surface_status ON sticky_notes(surface_status);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_surface_priority ON sticky_notes(surface_priority DESC);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_context_tags ON sticky_notes USING GIN(context_tags);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_created_by ON sticky_notes(created_by);

-- Set Allan's existing notes to always_visible
UPDATE sticky_notes 
SET surface_status = 'always_visible',
    created_by = 'allan'
WHERE created_by IS NULL OR created_by = 'allan';

-- Create surfacing history table
CREATE TABLE IF NOT EXISTS sticky_note_surfaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID REFERENCES sticky_notes(id) ON DELETE CASCADE,
    surfaced_at TIMESTAMPTZ DEFAULT NOW(),
    surface_context JSONB DEFAULT '{}',
    user_action TEXT CHECK (user_action IN ('viewed', 'dismissed', 'clicked_link', 'edited', 'archived')),
    was_helpful BOOLEAN,
    time_to_action_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sticky_note_surfaces_note_id ON sticky_note_surfaces(note_id);
CREATE INDEX IF NOT EXISTS idx_sticky_note_surfaces_surfaced_at ON sticky_note_surfaces(surfaced_at DESC);
CREATE INDEX IF NOT EXISTS idx_sticky_note_surfaces_was_helpful ON sticky_note_surfaces(was_helpful);

-- Create context detection triggers table
CREATE TABLE IF NOT EXISTS context_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_type TEXT NOT NULL CHECK (trigger_type IN (
        'meeting_soon', 'contact_mentioned', 'deal_mentioned',
        'file_opened', 'calendar_event', 'email_received',
        'slack_message', 'time_of_day', 'location', 'custom'
    )),
    trigger_value TEXT NOT NULL,
    note_ids UUID[] DEFAULT '{}',
    surface_priority INTEGER DEFAULT 5,
    surface_window_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_context_triggers_type ON context_triggers(trigger_type);
CREATE INDEX IF NOT EXISTS idx_context_triggers_active ON context_triggers(is_active);

-- Create Google Workspace links table
CREATE TABLE IF NOT EXISTS google_workspace_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID REFERENCES sticky_notes(id) ON DELETE CASCADE,
    link_type TEXT NOT NULL CHECK (link_type IN ('doc', 'sheet', 'slide', 'drive', 'form')),
    file_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    shared_with TEXT[] DEFAULT '{}',
    last_modified TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_google_workspace_links_note_id ON google_workspace_links(note_id);
CREATE INDEX IF NOT EXISTS idx_google_workspace_links_type ON google_workspace_links(link_type);

-- Create learning patterns table
CREATE TABLE IF NOT EXISTS sticky_note_learning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type TEXT NOT NULL CHECK (pattern_type IN (
        'surface_timing', 'surface_context', 'user_preference',
        'helpful_factor', 'dismiss_reason', 'engagement_pattern'
    )),
    pattern_data JSONB NOT NULL DEFAULT '{}',
    confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score BETWEEN 0 AND 1),
    usage_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sticky_note_learning_type ON sticky_note_learning(pattern_type);
CREATE INDEX IF NOT EXISTS idx_sticky_note_learning_confidence ON sticky_note_learning(confidence_score DESC);

-- Insert default context triggers
INSERT INTO context_triggers (trigger_type, trigger_value, surface_priority, surface_window_minutes) VALUES
    ('meeting_soon', '30_minutes_before', 10, 30),
    ('meeting_soon', '10_minutes_before', 15, 10),
    ('time_of_day', 'morning_startup', 8, 60),
    ('time_of_day', 'afternoon_checkin', 6, 120),
    ('time_of_day', 'evening_wrap', 7, 60)
ON CONFLICT DO NOTHING;

-- Create function to auto-surface notes based on context
CREATE OR REPLACE FUNCTION auto_surface_notes_by_context(
    p_trigger_type TEXT,
    p_trigger_value TEXT
) RETURNS TABLE (
    note_id UUID,
    title TEXT,
    surface_priority INTEGER,
    surface_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sn.id as note_id,
        sn.title,
        ct.surface_priority,
        'Auto-surfaced: ' || ct.trigger_type || ' - ' || ct.trigger_value as surface_reason
    FROM sticky_notes sn
    CROSS JOIN context_triggers ct
    WHERE ct.trigger_type = p_trigger_type
    AND ct.trigger_value = p_trigger_value
    AND ct.is_active = true
    AND sn.id = ANY(ct.note_ids)
    AND sn.surface_status = 'submerged'
    ORDER BY ct.surface_priority DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to track surfacing effectiveness
CREATE OR REPLACE FUNCTION track_surface_effectiveness(
    p_note_id UUID,
    p_was_helpful BOOLEAN,
    p_user_action TEXT,
    p_time_to_action_seconds INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Update surface history
    INSERT INTO sticky_note_surfaces (
        note_id,
        was_helpful,
        user_action,
        time_to_action_seconds,
        surface_context
    ) VALUES (
        p_note_id,
        p_was_helpful,
        p_user_action,
        p_time_to_action_seconds,
        jsonb_build_object(
            'surfaced_at', NOW(),
            'action', p_user_action,
            'helpful', p_was_helpful
        )
    );
    
    -- Update note surface_count
    UPDATE sticky_notes
    SET surface_count = surface_count + 1,
        last_surfaced_at = NOW()
    WHERE id = p_note_id;
    
    -- If dismissed, increment dismiss count
    IF p_user_action = 'dismissed' THEN
        UPDATE sticky_notes
        SET dismissed_count = dismissed_count + 1
        WHERE id = p_note_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create view for surfaced notes (what Allan should see NOW)
CREATE OR REPLACE VIEW surfaced_notes_view AS
SELECT 
    sn.id,
    sn.title,
    sn.content,
    sn.category,
    sn.created_by,
    sn.surface_priority,
    sn.surface_reason,
    sn.context_tags,
    sn.linked_files,
    sn.last_surfaced_at,
    sn.surface_count,
    sn.dismissed_count,
    COALESCE(gwl.links, '[]'::json) as google_docs_links,
    sn.created_at,
    sn.updated_at
FROM sticky_notes sn
LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object(
        'type', link_type,
        'name', file_name,
        'url', file_url,
        'shared_with', shared_with
    )) as links
    FROM google_workspace_links
    WHERE note_id = sn.id
) gwl ON true
WHERE sn.surface_status IN ('surfaced', 'always_visible')
ORDER BY 
    CASE sn.surface_status
        WHEN 'always_visible' THEN 1
        WHEN 'surfaced' THEN 2
    END,
    sn.surface_priority DESC,
    sn.updated_at DESC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON sticky_notes TO allan;
GRANT SELECT, INSERT, UPDATE, DELETE ON sticky_note_surfaces TO allan;
GRANT SELECT, INSERT, UPDATE, DELETE ON context_triggers TO allan;
GRANT SELECT, INSERT, UPDATE, DELETE ON google_workspace_links TO allan;
GRANT SELECT, INSERT, UPDATE, DELETE ON sticky_note_learning TO allan;
GRANT SELECT ON surfaced_notes_view TO allan;

-- Add comments
COMMENT ON COLUMN sticky_notes.created_by IS 'Who created this note: "allan" or "robbie"';
COMMENT ON COLUMN sticky_notes.surface_status IS 'surfaced=visible now, submerged=hidden, always_visible=Allan''s notes';
COMMENT ON COLUMN sticky_notes.surface_priority IS 'Higher = more important (0-100)';
COMMENT ON COLUMN sticky_notes.surface_reason IS 'Why Robbie surfaced this note';
COMMENT ON COLUMN sticky_notes.context_tags IS 'Tags for smart surfacing matching';
COMMENT ON COLUMN sticky_notes.linked_files IS 'Google Docs/Sheets/Slides links (JSONB)';

COMMENT ON TABLE sticky_note_surfaces IS 'Track every time a note is surfaced and user action';
COMMENT ON TABLE context_triggers IS 'Defines what context triggers what notes to surface';
COMMENT ON TABLE google_workspace_links IS 'Google Workspace file links (Docs/Sheets/Slides only!)';
COMMENT ON TABLE sticky_note_learning IS 'Machine learning patterns for smarter surfacing';

-- Verification
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 009 complete!';
    RAISE NOTICE '   - Sticky notes now support surface/submerge';
    RAISE NOTICE '   - Context triggers configured';
    RAISE NOTICE '   - Google Workspace links ready';
    RAISE NOTICE '   - Learning system initialized';
    RAISE NOTICE '   - Allan''s notes set to always_visible';
END $$;



