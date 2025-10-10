-- Town/Node Separation Schema
-- Each town (Aurora, Fluenti, Collaboration) gets separate data isolation
-- Towns/Nodes configuration
CREATE TABLE IF NOT EXISTS towns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    -- aurora, fluenti, collaboration
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    region VARCHAR(50),
    -- iceland, us, etc.
    owner_email VARCHAR(255),
    owner_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Insert default towns
INSERT INTO towns (
        name,
        display_name,
        description,
        region,
        owner_email,
        owner_name
    )
VALUES (
        'aurora',
        'Aurora (Capital)',
        'Primary AI Empire capital with 2x RTX 4090 GPUs',
        'iceland',
        'allan@testpilotcpg.com',
        'Allan'
    ),
    (
        'fluenti',
        'Fluenti',
        'US operations node with 1x RTX 4090 GPU',
        'us',
        'allan@testpilotcpg.com',
        'Allan'
    ),
    (
        'collaboration',
        'Collaboration',
        'Development and testing node with 1x RTX 4090 GPU',
        'iceland',
        'allan@testpilotcpg.com',
        'Allan'
    ),
    (
        'vengeance',
        'Vengeance (Private@Home)',
        'Allan private local development with 1x RTX 4090',
        'home',
        'allan@testpilot.ai',
        'Allan'
    ) ON CONFLICT (name) DO NOTHING;
-- User roles and permissions per town
CREATE TABLE IF NOT EXISTS town_users (
    id SERIAL PRIMARY KEY,
    town_id INTEGER REFERENCES towns(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    -- matches owner_id in business tables
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    -- admin, user, readonly
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(town_id, user_id)
);
-- Data isolation views for each town
-- Aurora (Capital) - Full access to all data
CREATE OR REPLACE VIEW aurora_companies AS
SELECT c.*
FROM companies c
    JOIN towns t ON c.owner_id = t.name
WHERE t.name = 'aurora'
    AND c.is_active = true;
CREATE OR REPLACE VIEW aurora_contacts AS
SELECT ct.*
FROM contacts ct
    JOIN towns t ON ct.owner_id = t.name
WHERE t.name = 'aurora'
    AND ct.is_active = true;
CREATE OR REPLACE VIEW aurora_deals AS
SELECT d.*
FROM deals d
    JOIN towns t ON d.owner_id = t.name
WHERE t.name = 'aurora'
    AND d.is_active = true;
CREATE OR REPLACE VIEW aurora_activities AS
SELECT a.*
FROM activities a
    JOIN towns t ON a.owner_id = t.name
WHERE t.name = 'aurora';
-- Fluenti (US Operations) - US-focused data
CREATE OR REPLACE VIEW fluenti_companies AS
SELECT c.*
FROM companies c
    JOIN towns t ON c.owner_id = t.name
WHERE t.name = 'fluenti'
    AND c.is_active = true;
CREATE OR REPLACE VIEW fluenti_contacts AS
SELECT ct.*
FROM contacts ct
    JOIN towns t ON ct.owner_id = t.name
WHERE t.name = 'fluenti'
    AND ct.is_active = true;
CREATE OR REPLACE VIEW fluenti_deals AS
SELECT d.*
FROM deals d
    JOIN towns t ON d.owner_id = t.name
WHERE t.name = 'fluenti'
    AND d.is_active = true;
CREATE OR REPLACE VIEW fluenti_activities AS
SELECT a.*
FROM activities a
    JOIN towns t ON a.owner_id = t.name
WHERE t.name = 'fluenti';
-- Collaboration (Development/Testing) - Test data
CREATE OR REPLACE VIEW collaboration_companies AS
SELECT c.*
FROM companies c
    JOIN towns t ON c.owner_id = t.name
WHERE t.name = 'collaboration'
    AND c.is_active = true;
CREATE OR REPLACE VIEW collaboration_contacts AS
SELECT ct.*
FROM contacts ct
    JOIN towns t ON ct.owner_id = t.name
WHERE t.name = 'collaboration'
    AND ct.is_active = true;
CREATE OR REPLACE VIEW collaboration_deals AS
SELECT d.*
FROM deals d
    JOIN towns t ON d.owner_id = t.name
WHERE t.name = 'collaboration'
    AND d.is_active = true;
CREATE OR REPLACE VIEW collaboration_activities AS
SELECT a.*
FROM activities a
    JOIN towns t ON a.owner_id = t.name
WHERE t.name = 'collaboration';
-- Vengeance (Private@Home) - Allan's local private development
CREATE OR REPLACE VIEW vengeance_companies AS
SELECT c.*
FROM companies c
    JOIN towns t ON c.owner_id = t.name
WHERE t.name = 'vengeance'
    AND c.is_active = true;
CREATE OR REPLACE VIEW vengeance_contacts AS
SELECT ct.*
FROM contacts ct
    JOIN towns t ON ct.owner_id = t.name
WHERE t.name = 'vengeance'
    AND ct.is_active = true;
CREATE OR REPLACE VIEW vengeance_deals AS
SELECT d.*
FROM deals d
    JOIN towns t ON d.owner_id = t.name
WHERE t.name = 'vengeance'
    AND d.is_active = true;
CREATE OR REPLACE VIEW vengeance_activities AS
SELECT a.*
FROM activities a
    JOIN towns t ON a.owner_id = t.name
WHERE t.name = 'vengeance';
-- Cross-town analytics (Aurora can see all)
CREATE OR REPLACE VIEW cross_town_analytics AS
SELECT t.name as town_name,
    t.display_name,
    COUNT(DISTINCT c.id) as company_count,
    COUNT(DISTINCT ct.id) as contact_count,
    COUNT(DISTINCT d.id) as deal_count,
    COALESCE(SUM(d.amount), 0) as total_deal_value,
    COALESCE(
        SUM(
            CASE
                WHEN d.closed_won THEN d.amount
                ELSE 0
            END
        ),
        0
    ) as won_deal_value,
    COUNT(DISTINCT a.id) as activity_count
FROM towns t
    LEFT JOIN companies c ON c.owner_id = t.name
    AND c.is_active = true
    LEFT JOIN contacts ct ON ct.owner_id = t.name
    AND ct.is_active = true
    LEFT JOIN deals d ON d.owner_id = t.name
    AND d.is_active = true
    LEFT JOIN activities a ON a.owner_id = t.name
WHERE t.is_active = true
GROUP BY t.id,
    t.name,
    t.display_name
ORDER BY total_deal_value DESC;
-- Functions for town-based data access
CREATE OR REPLACE FUNCTION get_town_data(town_name VARCHAR(50), table_name VARCHAR(50)) RETURNS TABLE (id INTEGER, data JSONB) AS $$ BEGIN CASE
        table_name
        WHEN 'companies' THEN RETURN QUERY
        SELECT c.id,
            to_jsonb(c.*) as data
        FROM companies c
        WHERE c.owner_id = town_name
            AND c.is_active = true;
WHEN 'contacts' THEN RETURN QUERY
SELECT ct.id,
    to_jsonb(ct.*) as data
FROM contacts ct
WHERE ct.owner_id = town_name
    AND ct.is_active = true;
WHEN 'deals' THEN RETURN QUERY
SELECT d.id,
    to_jsonb(d.*) as data
FROM deals d
WHERE d.owner_id = town_name
    AND d.is_active = true;
WHEN 'activities' THEN RETURN QUERY
SELECT a.id,
    to_jsonb(a.*) as data
FROM activities a
WHERE a.owner_id = town_name;
ELSE RETURN;
END CASE
;
END;
$$ LANGUAGE plpgsql;
-- Row Level Security (RLS) policies for data isolation
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
-- Policy functions for town-based access
CREATE OR REPLACE FUNCTION current_town() RETURNS VARCHAR(50) AS $$ BEGIN -- This would be set by the application based on the current node/town
    RETURN current_setting('app.current_town', true);
END;
$$ LANGUAGE plpgsql;
-- RLS policies (commented out for now - can be enabled for strict isolation)
-- CREATE POLICY town_isolation_companies ON companies
--     FOR ALL TO PUBLIC
--     USING (owner_id = current_town());
-- CREATE POLICY town_isolation_contacts ON contacts
--     FOR ALL TO PUBLIC
--     USING (owner_id = current_town());
-- CREATE POLICY town_isolation_deals ON deals
--     FOR ALL TO PUBLIC
--     USING (owner_id = current_town());
-- CREATE POLICY town_isolation_activities ON activities
--     FOR ALL TO PUBLIC
--     USING (owner_id = current_town());
-- Indexes for town-based queries
CREATE INDEX IF NOT EXISTS idx_companies_town ON companies(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_contacts_town ON contacts(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_deals_town ON deals(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_activities_town ON activities(owner_id);
-- Insert sample users for each town
INSERT INTO town_users (town_id, user_id, user_email, user_name, role)
VALUES (
        (
            SELECT id
            FROM towns
            WHERE name = 'aurora'
        ),
        'allan',
        'allan@testpilotcpg.com',
        'Allan',
        'admin'
    ),
    (
        (
            SELECT id
            FROM towns
            WHERE name = 'fluenti'
        ),
        'allan',
        'allan@testpilotcpg.com',
        'Allan',
        'admin'
    ),
    (
        (
            SELECT id
            FROM towns
            WHERE name = 'collaboration'
        ),
        'allan',
        'allan@testpilotcpg.com',
        'Allan',
        'admin'
    ),
    (
        (
            SELECT id
            FROM towns
            WHERE name = 'vengeance'
        ),
        'allan',
        'allan@testpilot.ai',
        'Allan',
        'admin'
    ) ON CONFLICT (town_id, user_id) DO NOTHING;