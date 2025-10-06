-- STICKY NOTES DATABASE SCHEMA
-- Beautiful sticky notes system with database persistence

BEGIN;

-- Sticky Notes Table
CREATE TABLE IF NOT EXISTS sticky_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('intel', 'reference', 'drafts', 'connections', 'shower-thoughts')),
    author VARCHAR(50) NOT NULL CHECK (author IN ('Allan', 'Robbie')),
    is_locked BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    color_code VARCHAR(20) DEFAULT 'yellow',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) DEFAULT 'Allan',
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sticky_notes_category ON sticky_notes(category);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_author ON sticky_notes(author);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_locked ON sticky_notes(is_locked);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_created_at ON sticky_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_priority ON sticky_notes(priority);

-- Sticky Notes History (for audit trail)
CREATE TABLE IF NOT EXISTS sticky_notes_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sticky_note_id UUID NOT NULL REFERENCES sticky_notes(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'locked', 'unlocked')),
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(50) NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    change_reason TEXT
);

-- Index for history queries
CREATE INDEX IF NOT EXISTS idx_sticky_notes_history_note_id ON sticky_notes_history(sticky_note_id);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_history_changed_at ON sticky_notes_history(changed_at);

-- Sticky Notes Categories (for dynamic categories)
CREATE TABLE IF NOT EXISTS sticky_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    color_code VARCHAR(20) NOT NULL,
    icon VARCHAR(10),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO sticky_categories (name, display_name, color_code, icon, description, sort_order) VALUES
('intel', 'Intel', '#FFE082', '🧠', 'Intelligence and research notes', 1),
('reference', 'Reference', '#A5D6A7', '📚', 'Reference materials and guides', 2),
('drafts', 'Drafts', '#BBDEFB', '📝', 'Draft content and works in progress', 3),
('connections', 'Connections', '#FFCDD2', '🤝', 'Contact and relationship notes', 4),
('shower-thoughts', 'Shower Thoughts', '#E1BEE7', '🚿', 'Creative ideas and insights', 5)
ON CONFLICT (name) DO NOTHING;

-- Sticky Notes Favorites (for user preferences)
CREATE TABLE IF NOT EXISTS sticky_notes_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sticky_note_id UUID NOT NULL REFERENCES sticky_notes(id) ON DELETE CASCADE,
    user_name VARCHAR(50) NOT NULL,
    favorited_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sticky_note_id, user_name)
);

-- Sticky Notes Search (for full-text search)
CREATE INDEX IF NOT EXISTS idx_sticky_notes_search ON sticky_notes USING gin(to_tsvector('english', title || ' ' || content));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sticky_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_sticky_notes_updated_at
    BEFORE UPDATE ON sticky_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_sticky_notes_updated_at();

-- Function to log changes to history
CREATE OR REPLACE FUNCTION log_sticky_notes_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO sticky_notes_history (sticky_note_id, action, new_values, changed_by)
        VALUES (NEW.id, 'created', to_jsonb(NEW), COALESCE(NEW.created_by, 'System'));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO sticky_notes_history (sticky_note_id, action, old_values, new_values, changed_by)
        VALUES (NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW), COALESCE(NEW.created_by, 'System'));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO sticky_notes_history (sticky_note_id, action, old_values, changed_by)
        VALUES (OLD.id, 'deleted', to_jsonb(OLD), 'System');
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log all changes
CREATE TRIGGER trigger_log_sticky_notes_changes
    AFTER INSERT OR UPDATE OR DELETE ON sticky_notes
    FOR EACH ROW
    EXECUTE FUNCTION log_sticky_notes_changes();

-- View for easy querying
CREATE OR REPLACE VIEW sticky_notes_view AS
SELECT 
    sn.*,
    sc.display_name as category_display_name,
    sc.color_code as category_color,
    sc.icon as category_icon,
    CASE 
        WHEN sn.is_locked THEN '🔒'
        ELSE ''
    END as lock_icon,
    CASE 
        WHEN snf.sticky_note_id IS NOT NULL THEN TRUE
        ELSE FALSE
    END as is_favorite
FROM sticky_notes sn
LEFT JOIN sticky_categories sc ON sn.category = sc.name
LEFT JOIN sticky_notes_favorites snf ON sn.id = snf.sticky_note_id AND snf.user_name = sn.author;

COMMIT;
