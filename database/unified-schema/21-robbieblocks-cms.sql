-- RobbieBlocks CMS + Auto-Deployment System
-- Part 21: Dynamic web content management with auto-deployment
-- Version: 1.0.0
-- Date: January 9, 2025
-- ============================================
-- ROBBIEBLOCKS PAGES
-- ============================================
CREATE TABLE IF NOT EXISTS robbieblocks_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_key VARCHAR(255) UNIQUE NOT NULL,
    -- 'robbie-play-home', 'robbie-work-dashboard'
    app_namespace VARCHAR(50) NOT NULL,
    -- 'play', 'work', 'code', 'shared'
    page_name VARCHAR(255) NOT NULL,
    page_route VARCHAR(255) NOT NULL,
    -- '/play/', '/work/dashboard'
    layout_template VARCHAR(50) NOT NULL,
    -- 'single-column', 'sidebar-left', 'dashboard'
    meta_title VARCHAR(255),
    meta_description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ,
    created_by INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX idx_robbieblocks_pages_app ON robbieblocks_pages(app_namespace);
CREATE INDEX idx_robbieblocks_pages_status ON robbieblocks_pages(status);
CREATE INDEX idx_robbieblocks_pages_route ON robbieblocks_pages(page_route);
COMMENT ON TABLE robbieblocks_pages IS 'Page definitions for dynamic React app generation';
-- ============================================
-- ROBBIEBLOCKS COMPONENTS
-- ============================================
CREATE TABLE IF NOT EXISTS robbieblocks_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_key VARCHAR(255) UNIQUE NOT NULL,
    -- 'robbie-bar', 'chat-interface', 'matrix-rain'
    component_name VARCHAR(255) NOT NULL,
    component_type VARCHAR(50) NOT NULL,
    -- 'layout', 'widget', 'feature', 'ui'
    react_code TEXT NOT NULL,
    -- Actual React component code
    props_schema JSONB NOT NULL,
    -- JSON Schema for props validation
    css_styles TEXT,
    -- Scoped CSS or Tailwind classes
    dependencies TEXT [] DEFAULT '{}',
    -- ['react', '@emotion/styled', etc.]
    version VARCHAR(20) DEFAULT '1.0.0',
    is_published BOOLEAN DEFAULT false,
    preview_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX idx_robbieblocks_components_type ON robbieblocks_components(component_type);
CREATE INDEX idx_robbieblocks_components_published ON robbieblocks_components(is_published);
CREATE INDEX idx_robbieblocks_components_key ON robbieblocks_components(component_key);
COMMENT ON TABLE robbieblocks_components IS 'React component library stored in SQL';
-- ============================================
-- PAGE BLOCKS (COMPOSITION)
-- ============================================
CREATE TABLE IF NOT EXISTS robbieblocks_page_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID REFERENCES robbieblocks_pages(id) ON DELETE CASCADE,
    component_id UUID REFERENCES robbieblocks_components(id),
    block_order INTEGER NOT NULL,
    zone VARCHAR(50) NOT NULL,
    -- 'header', 'sidebar', 'main', 'footer'
    props JSONB DEFAULT '{}'::jsonb,
    -- Component props
    conditions JSONB DEFAULT '{}'::jsonb,
    -- Show/hide conditions
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(page_id, block_order)
);
CREATE INDEX idx_page_blocks_page ON robbieblocks_page_blocks(page_id, block_order);
CREATE INDEX idx_page_blocks_component ON robbieblocks_page_blocks(component_id);
CREATE INDEX idx_page_blocks_zone ON robbieblocks_page_blocks(page_id, zone);
COMMENT ON TABLE robbieblocks_page_blocks IS 'Page composition - which components appear on which pages';
-- ============================================
-- STYLE TOKENS (DESIGN SYSTEM)
-- ============================================
CREATE TABLE IF NOT EXISTS robbieblocks_style_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_key VARCHAR(255) UNIQUE NOT NULL,
    -- 'color.primary', 'font.heading', 'spacing.xl'
    token_category VARCHAR(50) NOT NULL,
    -- 'color', 'font', 'spacing', 'shadow', 'animation'
    default_value TEXT NOT NULL,
    -- '#8B5CF6', '16px', '0 4px 6px rgba(0,0,0,0.1)'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_style_tokens_category ON robbieblocks_style_tokens(token_category);
CREATE INDEX idx_style_tokens_key ON robbieblocks_style_tokens(token_key);
COMMENT ON TABLE robbieblocks_style_tokens IS 'Design system tokens - colors, fonts, spacing';
-- Insert default style tokens
INSERT INTO robbieblocks_style_tokens (
        token_key,
        token_category,
        default_value,
        description
    )
VALUES -- Colors
    (
        'color.primary',
        'color',
        '#8B5CF6',
        'Primary brand color'
    ),
    (
        'color.secondary',
        'color',
        '#EC4899',
        'Secondary accent color'
    ),
    (
        'color.background',
        'color',
        '#0F172A',
        'Background color'
    ),
    (
        'color.surface',
        'color',
        '#1E293B',
        'Surface color'
    ),
    (
        'color.text',
        'color',
        '#F1F5F9',
        'Primary text color'
    ),
    (
        'color.text-muted',
        'color',
        '#94A3B8',
        'Muted text color'
    ),
    (
        'color.success',
        'color',
        '#10B981',
        'Success state color'
    ),
    (
        'color.warning',
        'color',
        '#F59E0B',
        'Warning state color'
    ),
    (
        'color.error',
        'color',
        '#EF4444',
        'Error state color'
    ),
    -- Typography
    (
        'font.heading',
        'font',
        'Montserrat, sans-serif',
        'Heading font family'
    ),
    (
        'font.body',
        'font',
        'Inter, sans-serif',
        'Body font family'
    ),
    (
        'font.mono',
        'font',
        'Fira Code, monospace',
        'Monospace font family'
    ),
    (
        'font.size.xs',
        'font',
        '0.75rem',
        'Extra small font size'
    ),
    (
        'font.size.sm',
        'font',
        '0.875rem',
        'Small font size'
    ),
    (
        'font.size.base',
        'font',
        '1rem',
        'Base font size'
    ),
    (
        'font.size.lg',
        'font',
        '1.125rem',
        'Large font size'
    ),
    (
        'font.size.xl',
        'font',
        '1.25rem',
        'Extra large font size'
    ),
    (
        'font.size.2xl',
        'font',
        '1.5rem',
        '2XL font size'
    ),
    (
        'font.size.3xl',
        'font',
        '1.875rem',
        '3XL font size'
    ),
    -- Spacing
    (
        'spacing.xs',
        'spacing',
        '0.25rem',
        'Extra small spacing'
    ),
    (
        'spacing.sm',
        'spacing',
        '0.5rem',
        'Small spacing'
    ),
    (
        'spacing.md',
        'spacing',
        '1rem',
        'Medium spacing'
    ),
    (
        'spacing.lg',
        'spacing',
        '1.5rem',
        'Large spacing'
    ),
    (
        'spacing.xl',
        'spacing',
        '2rem',
        'Extra large spacing'
    ),
    ('spacing.2xl', 'spacing', '3rem', '2XL spacing'),
    -- Shadows
    (
        'shadow.sm',
        'shadow',
        '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'Small shadow'
    ),
    (
        'shadow.md',
        'shadow',
        '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'Medium shadow'
    ),
    (
        'shadow.lg',
        'shadow',
        '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'Large shadow'
    ),
    (
        'shadow.xl',
        'shadow',
        '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        'Extra large shadow'
    ),
    -- Animations
    (
        'animation.fast',
        'animation',
        '150ms',
        'Fast animation duration'
    ),
    (
        'animation.normal',
        'animation',
        '300ms',
        'Normal animation duration'
    ),
    (
        'animation.slow',
        'animation',
        '500ms',
        'Slow animation duration'
    ),
    (
        'animation.ease',
        'animation',
        'cubic-bezier(0.4, 0, 0.2, 1)',
        'Ease animation curve'
    ) ON CONFLICT (token_key) DO NOTHING;
-- ============================================
-- NODE BRANDING
-- ============================================
CREATE TABLE IF NOT EXISTS robbieblocks_node_branding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id VARCHAR(100) UNIQUE NOT NULL,
    node_name VARCHAR(255) NOT NULL,
    style_overrides JSONB NOT NULL,
    -- {'color.primary': '#7C3AED', 'font.heading': 'Press Start 2P'}
    enabled_apps TEXT [] DEFAULT '{}',
    -- ['play', 'code', 'work']
    custom_css TEXT,
    -- Additional CSS
    custom_scripts TEXT,
    -- Additional JS
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_node_branding_node_id ON robbieblocks_node_branding(node_id);
COMMENT ON TABLE robbieblocks_node_branding IS 'Per-node customization - themes, enabled apps, custom styles';
-- Insert default node branding configurations
INSERT INTO robbieblocks_node_branding (
        node_id,
        node_name,
        style_overrides,
        enabled_apps
    )
VALUES (
        'vengeance-local',
        'Vengeance Gaming Rig',
        '{
   "color.primary": "#8B5CF6",
   "color.secondary": "#EC4899",
   "color.background": "#0F172A",
   "font.heading": "Press Start 2P",
   "font.body": "Inter",
   "theme": "dark"
 }'::jsonb,
        ARRAY ['play', 'code']
    ),
    (
        'aurora-town-local',
        'Aurora Town Production',
        '{
   "color.primary": "#3B82F6",
   "color.secondary": "#10B981",
   "color.background": "#FFFFFF",
   "color.text": "#1E293B",
   "font.heading": "Montserrat",
   "font.body": "Inter",
   "theme": "light"
 }'::jsonb,
        ARRAY ['work', 'code']
    ),
    (
        'collaboration-local',
        'Collaboration Node',
        '{
   "color.primary": "#06B6D4",
   "color.secondary": "#8B5CF6",
   "color.background": "#FFFFFF",
   "color.text": "#1E293B",
   "font.heading": "Montserrat",
   "font.body": "Inter",
   "theme": "light"
 }'::jsonb,
        ARRAY ['work', 'play', 'code']
    ),
    (
        'fluenti-local',
        'Fluenti Development',
        '{
   "color.primary": "#F59E0B",
   "color.secondary": "#EF4444",
   "color.background": "#18181B",
   "font.heading": "Inter",
   "font.body": "Inter",
   "theme": "dark"
 }'::jsonb,
        ARRAY ['work', 'code']
    ) ON CONFLICT (node_id) DO NOTHING;
-- ============================================
-- DEPLOY HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS robbieblocks_deploys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id VARCHAR(100),
    app_namespace VARCHAR(50) NOT NULL,
    build_hash VARCHAR(64) NOT NULL,
    -- SHA256 of build
    pages_count INTEGER,
    components_count INTEGER,
    deploy_status VARCHAR(50) DEFAULT 'pending' CHECK (
        deploy_status IN (
            'pending',
            'building',
            'deploying',
            'success',
            'failed'
        )
    ),
    build_duration_ms INTEGER,
    deploy_duration_ms INTEGER,
    error_message TEXT,
    build_log TEXT,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    triggered_by VARCHAR(50) NOT NULL -- 'page_change', 'component_update', 'manual', 'schedule'
);
CREATE INDEX idx_deploys_node ON robbieblocks_deploys(node_id, started_at DESC);
CREATE INDEX idx_deploys_status ON robbieblocks_deploys(deploy_status);
CREATE INDEX idx_deploys_app ON robbieblocks_deploys(app_namespace, started_at DESC);
COMMENT ON TABLE robbieblocks_deploys IS 'Deployment history and status tracking';
-- ============================================
-- CHANGE TRIGGERS
-- ============================================
CREATE TABLE IF NOT EXISTS robbieblocks_change_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trigger_type VARCHAR(50) NOT NULL,
    -- 'page_update', 'component_update', 'style_change', 'branding_change'
    entity_type VARCHAR(50) NOT NULL,
    -- 'page', 'component', 'style_token', 'node_branding'
    entity_id UUID NOT NULL,
    affected_apps TEXT [],
    -- Which apps need to rebuild
    affected_nodes TEXT [],
    -- Which nodes need to redeploy
    auto_deploy BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ
);
CREATE INDEX idx_change_triggers_unprocessed ON robbieblocks_change_triggers(created_at)
WHERE processed_at IS NULL;
CREATE INDEX idx_change_triggers_type ON robbieblocks_change_triggers(trigger_type);
COMMENT ON TABLE robbieblocks_change_triggers IS 'Change detection queue for auto-deployment';
-- ============================================
-- AUTO-DEPLOY TRIGGER FUNCTIONS
-- ============================================
-- Trigger on page updates
CREATE OR REPLACE FUNCTION trigger_page_rebuild() RETURNS TRIGGER AS $$ BEGIN -- Insert change trigger
INSERT INTO robbieblocks_change_triggers (
        trigger_type,
        entity_type,
        entity_id,
        affected_apps,
        auto_deploy
    )
VALUES (
        'page_update',
        'page',
        NEW.id,
        ARRAY [NEW.app_namespace],
        true
    );
-- Notify listeners
PERFORM pg_notify(
    'robbieblocks_change',
    json_build_object(
        'type',
        'page_update',
        'app',
        NEW.app_namespace,
        'page_id',
        NEW.id,
        'page_key',
        NEW.page_key
    )::text
);
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER page_update_trigger
AFTER
UPDATE OF updated_at ON robbieblocks_pages FOR EACH ROW
    WHEN (NEW.status = 'published') EXECUTE FUNCTION trigger_page_rebuild();
-- Trigger on component updates
CREATE OR REPLACE FUNCTION trigger_component_rebuild() RETURNS TRIGGER AS $$
DECLARE affected_pages RECORD;
app_list TEXT [];
BEGIN -- Find all pages using this component
SELECT ARRAY_AGG(DISTINCT p.app_namespace) INTO app_list
FROM robbieblocks_page_blocks pb
    JOIN robbieblocks_pages p ON pb.page_id = p.id
WHERE pb.component_id = NEW.id
    AND p.status = 'published';
IF app_list IS NOT NULL THEN -- Insert change trigger
INSERT INTO robbieblocks_change_triggers (
        trigger_type,
        entity_type,
        entity_id,
        affected_apps,
        auto_deploy
    )
VALUES (
        'component_update',
        'component',
        NEW.id,
        app_list,
        true
    );
-- Notify listeners
PERFORM pg_notify(
    'robbieblocks_change',
    json_build_object(
        'type',
        'component_update',
        'component_id',
        NEW.id,
        'component_key',
        NEW.component_key,
        'affected_apps',
        app_list
    )::text
);
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER component_update_trigger
AFTER
UPDATE OF updated_at ON robbieblocks_components FOR EACH ROW
    WHEN (NEW.is_published = true) EXECUTE FUNCTION trigger_component_rebuild();
-- Trigger on node branding changes
CREATE OR REPLACE FUNCTION trigger_branding_rebuild() RETURNS TRIGGER AS $$ BEGIN -- Insert change trigger for all enabled apps on this node
INSERT INTO robbieblocks_change_triggers (
        trigger_type,
        entity_type,
        entity_id,
        affected_apps,
        affected_nodes,
        auto_deploy
    )
VALUES (
        'branding_change',
        'node_branding',
        NEW.id,
        NEW.enabled_apps,
        ARRAY [NEW.node_id],
        true
    );
-- Notify listeners
PERFORM pg_notify(
    'robbieblocks_change',
    json_build_object(
        'type',
        'branding_change',
        'node_id',
        NEW.node_id,
        'enabled_apps',
        NEW.enabled_apps
    )::text
);
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER branding_update_trigger
AFTER
UPDATE OF style_overrides,
    enabled_apps ON robbieblocks_node_branding FOR EACH ROW EXECUTE FUNCTION trigger_branding_rebuild();
-- ============================================
-- HELPER FUNCTIONS
-- ============================================
-- Get full page configuration with all components
CREATE OR REPLACE FUNCTION get_page_config(page_key_param VARCHAR) RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
SELECT json_build_object(
        'page',
        row_to_json(p),
        'blocks',
        (
            SELECT json_agg(
                    json_build_object(
                        'block',
                        row_to_json(pb),
                        'component',
                        row_to_json(c)
                    )
                    ORDER BY pb.block_order
                )
            FROM robbieblocks_page_blocks pb
                JOIN robbieblocks_components c ON pb.component_id = c.id
            WHERE pb.page_id = p.id
        )
    ) INTO result
FROM robbieblocks_pages p
WHERE p.page_key = page_key_param
    AND p.status = 'published';
RETURN result;
END;
$$ LANGUAGE plpgsql;
-- Get node-specific styling
CREATE OR REPLACE FUNCTION get_node_styles(node_id_param VARCHAR) RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
SELECT json_build_object(
        'base_tokens',
        (
            SELECT json_object_agg(token_key, default_value)
            FROM robbieblocks_style_tokens
        ),
        'overrides',
        nb.style_overrides,
        'enabled_apps',
        nb.enabled_apps
    ) INTO result
FROM robbieblocks_node_branding nb
WHERE nb.node_id = node_id_param;
RETURN result;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- VIEWS
-- ============================================
-- Active deployments view
CREATE OR REPLACE VIEW robbieblocks_active_deploys AS
SELECT d.id,
    d.node_id,
    d.app_namespace,
    d.deploy_status,
    d.started_at,
    EXTRACT(
        EPOCH
        FROM (CURRENT_TIMESTAMP - d.started_at)
    )::INTEGER as running_seconds,
    d.build_duration_ms,
    d.deploy_duration_ms
FROM robbieblocks_deploys d
WHERE d.deploy_status IN ('pending', 'building', 'deploying')
ORDER BY d.started_at DESC;
-- Published pages summary
CREATE OR REPLACE VIEW robbieblocks_published_pages AS
SELECT p.app_namespace,
    COUNT(DISTINCT p.id) as page_count,
    COUNT(DISTINCT pb.component_id) as component_count,
    MAX(p.updated_at) as last_update
FROM robbieblocks_pages p
    LEFT JOIN robbieblocks_page_blocks pb ON p.id = pb.page_id
WHERE p.status = 'published'
GROUP BY p.app_namespace;
-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE TRIGGER update_robbieblocks_pages_updated_at BEFORE
UPDATE ON robbieblocks_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_robbieblocks_components_updated_at BEFORE
UPDATE ON robbieblocks_components FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_robbieblocks_page_blocks_updated_at BEFORE
UPDATE ON robbieblocks_page_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_robbieblocks_style_tokens_updated_at BEFORE
UPDATE ON robbieblocks_style_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_robbieblocks_node_branding_updated_at BEFORE
UPDATE ON robbieblocks_node_branding FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON SCHEMA public IS 'RobbieBlocks CMS enables dynamic React app generation from SQL with automatic deployment triggers';