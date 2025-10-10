-- User Contexts Schema - Multi-Context Switching System
-- Allows users like Allan to switch between TestPilot, Aurora Town, Presidential privileges

-- Multi-context access for users with multiple roles
CREATE TABLE IF NOT EXISTS user_contexts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    context_type VARCHAR(50) NOT NULL,  -- 'town', 'company', 'role'
    context_name VARCHAR(100) NOT NULL,
    context_id VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, context_type, context_id)
);

-- Presidential/Super-admin privileges
CREATE TABLE IF NOT EXISTS user_privileges (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    user_email VARCHAR(255) NOT NULL,
    privilege_level VARCHAR(50) NOT NULL,  -- 'president', 'mayor', 'citizen', 'employee'
    description TEXT,
    grants_all_access BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Current active context per session
CREATE TABLE IF NOT EXISTS user_active_contexts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    active_context_type VARCHAR(50) NOT NULL,
    active_context_id VARCHAR(100) NOT NULL,
    switched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, session_id)
);

-- Create index for fast context lookups
CREATE INDEX IF NOT EXISTS idx_user_contexts_user_id ON user_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_active_contexts_user_id ON user_active_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_contexts_context_id ON user_contexts(context_id);

-- Allan's contexts
INSERT INTO user_contexts (user_id, user_email, context_type, context_name, context_id, display_name, permissions)
VALUES 
    ('allan', 'allan@testpilotcpg.com', 'company', 'TestPilot CPG', 'testpilot', 'TestPilot CPG', 
     '{"manage_deals": true, "manage_contacts": true, "view_revenue": true, "manage_tests": true}'::jsonb),
    ('allan', 'allan@testpilotcpg.com', 'town', 'Aurora Town', 'aurora', 'Aurora Town (Capital)', 
     '{"manage_ai": true, "manage_gpu": true, "view_all_towns": true, "manage_services": true}'::jsonb),
    ('allan', 'allan@testpilotcpg.com', 'town', 'RobbieBook1', 'robbiebook1', 'RobbieBook1 (Mobile Dev)', 
     '{"manage_services": true, "offline_mode": true, "local_development": true}'::jsonb),
    ('allan', 'allan@testpilotcpg.com', 'town', 'Vengeance', 'vengeance', 'Vengeance (Private@Home)', 
     '{"manage_services": true, "manage_gpu": true, "local_training": true}'::jsonb),
    ('allan', 'allan@testpilotcpg.com', 'role', 'President', 'president', 'President of the Universe (All Access)', 
     '{"god_mode": true, "view_all": true, "manage_all": true, "presidential_privilege": true}'::jsonb)
ON CONFLICT (user_id, context_type, context_id) DO NOTHING;

-- Allan's Presidential Privilege
INSERT INTO user_privileges (user_id, user_email, privilege_level, description, grants_all_access)
VALUES ('allan', 'allan@testpilotcpg.com', 'president', 'President of the Universe - All Access Including Presidential Privilege', true)
ON CONFLICT (user_id) DO NOTHING;

-- Set Allan's default context to Presidential mode
INSERT INTO user_active_contexts (user_id, session_id, active_context_type, active_context_id)
VALUES ('allan', 'default', 'role', 'president')
ON CONFLICT (user_id, session_id) DO UPDATE 
SET active_context_type = 'role', active_context_id = 'president', switched_at = CURRENT_TIMESTAMP;

-- Context filtering function - returns data based on user's active context
CREATE OR REPLACE FUNCTION get_user_accessible_data(
    p_user_id VARCHAR,
    p_table VARCHAR
) RETURNS TABLE(id INT, data JSONB) AS $$
DECLARE
    is_president BOOLEAN;
    active_ctx VARCHAR;
    active_ctx_type VARCHAR;
BEGIN
    -- Check for presidential privilege
    SELECT grants_all_access INTO is_president
    FROM user_privileges 
    WHERE user_id = p_user_id;
    
    -- Get active context
    SELECT active_context_id, active_context_type INTO active_ctx, active_ctx_type
    FROM user_active_contexts 
    WHERE user_id = p_user_id 
    LIMIT 1;
    
    -- President sees everything
    IF is_president AND (active_ctx = 'president' OR active_ctx_type = 'role') THEN
        RETURN QUERY EXECUTE format(
            'SELECT id::int, to_jsonb(%I.*) FROM %I WHERE is_active = true',
            p_table, p_table
        );
    ELSE
        -- Filter by active context (town or company)
        RETURN QUERY EXECUTE format(
            'SELECT id::int, to_jsonb(%I.*) FROM %I WHERE owner_id = %L AND is_active = true',
            p_table, p_table, active_ctx
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to switch user context
CREATE OR REPLACE FUNCTION switch_user_context(
    p_user_id VARCHAR,
    p_session_id VARCHAR,
    p_context_type VARCHAR,
    p_context_id VARCHAR
) RETURNS JSONB AS $$
DECLARE
    context_exists BOOLEAN;
    result JSONB;
BEGIN
    -- Verify context exists for user
    SELECT EXISTS(
        SELECT 1 FROM user_contexts 
        WHERE user_id = p_user_id 
        AND context_type = p_context_type 
        AND context_id = p_context_id
        AND is_active = true
    ) INTO context_exists;
    
    IF NOT context_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Context not found or not accessible'
        );
    END IF;
    
    -- Update or insert active context
    INSERT INTO user_active_contexts (user_id, session_id, active_context_type, active_context_id, switched_at)
    VALUES (p_user_id, p_session_id, p_context_type, p_context_id, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, session_id) 
    DO UPDATE SET 
        active_context_type = p_context_type,
        active_context_id = p_context_id,
        switched_at = CURRENT_TIMESTAMP;
    
    -- Return new context with permissions
    SELECT jsonb_build_object(
        'success', true,
        'context', jsonb_build_object(
            'type', context_type,
            'id', context_id,
            'name', context_name,
            'display_name', display_name,
            'permissions', permissions
        )
    ) INTO result
    FROM user_contexts
    WHERE user_id = p_user_id 
    AND context_type = p_context_type 
    AND context_id = p_context_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- View to see all user contexts with active status
CREATE OR REPLACE VIEW user_contexts_with_active AS
SELECT 
    uc.*,
    CASE 
        WHEN uac.active_context_id = uc.context_id AND uac.active_context_type = uc.context_type 
        THEN true 
        ELSE false 
    END as is_currently_active
FROM user_contexts uc
LEFT JOIN user_active_contexts uac ON uc.user_id = uac.user_id;

-- Comments
COMMENT ON TABLE user_contexts IS 'Stores all contexts (towns, companies, roles) accessible to each user';
COMMENT ON TABLE user_privileges IS 'Special privileges like Presidential access that grant all-access';
COMMENT ON TABLE user_active_contexts IS 'Tracks which context each user/session is currently operating in';
COMMENT ON FUNCTION get_user_accessible_data IS 'Returns filtered data based on user active context and presidential privilege';
COMMENT ON FUNCTION switch_user_context IS 'Switches user to specified context and returns permissions';

