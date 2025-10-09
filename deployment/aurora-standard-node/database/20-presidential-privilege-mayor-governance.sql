-- ============================================================================
-- Presidential Privilege & Mayor Governance Database Schema
-- ============================================================================

-- Presidential Privilege Sessions
CREATE TABLE IF NOT EXISTS presidential_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT NOT NULL,
    actions_performed JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Citizens Table
CREATE TABLE IF NOT EXISTS citizens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('citizen', 'mayor', 'president')),
    town_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Towns Table
CREATE TABLE IF NOT EXISTS towns (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    mayor_id UUID REFERENCES citizens(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Banishment Votes
CREATE TABLE IF NOT EXISTS banishments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_citizen_id UUID NOT NULL REFERENCES citizens(id),
    mayor_id UUID NOT NULL REFERENCES citizens(id),
    town_id VARCHAR(255) NOT NULL REFERENCES towns(id),
    reason_summary TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'expired')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    final_decision VARCHAR(50) CHECK (final_decision IN ('banished', 'acquitted', 'tie')),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banishment Votes (Individual Votes)
CREATE TABLE IF NOT EXISTS banishment_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID NOT NULL REFERENCES citizens(id),
    banishment_id UUID NOT NULL REFERENCES banishments(id),
    vote VARCHAR(10) NOT NULL CHECK (vote IN ('yes', 'no')),
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(citizen_id, banishment_id)
);

-- Banishment Reminders
CREATE TABLE IF NOT EXISTS banishment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    banishment_id UUID NOT NULL REFERENCES banishments(id),
    when_at TIMESTAMP WITH TIME ZONE NOT NULL,
    channel VARCHAR(50) NOT NULL,
    note TEXT,
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banishment Reports
CREATE TABLE IF NOT EXISTS banishment_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    banishment_id UUID NOT NULL REFERENCES banishments(id),
    report_content TEXT NOT NULL,
    approved_by_mayor BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Presidential Sessions
CREATE INDEX IF NOT EXISTS idx_presidential_sessions_user_id ON presidential_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_presidential_sessions_active ON presidential_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_presidential_sessions_expires ON presidential_sessions(expires_at);

-- Citizens
CREATE INDEX IF NOT EXISTS idx_citizens_town_id ON citizens(town_id);
CREATE INDEX IF NOT EXISTS idx_citizens_role ON citizens(role);
CREATE INDEX IF NOT EXISTS idx_citizens_email ON citizens(email);
CREATE INDEX IF NOT EXISTS idx_citizens_active ON citizens(is_active) WHERE is_active = TRUE;

-- Towns
CREATE INDEX IF NOT EXISTS idx_towns_mayor_id ON towns(mayor_id);
CREATE INDEX IF NOT EXISTS idx_towns_active ON towns(is_active) WHERE is_active = TRUE;

-- Banishments
CREATE INDEX IF NOT EXISTS idx_banishments_target ON banishments(target_citizen_id);
CREATE INDEX IF NOT EXISTS idx_banishments_mayor ON banishments(mayor_id);
CREATE INDEX IF NOT EXISTS idx_banishments_town ON banishments(town_id);
CREATE INDEX IF NOT EXISTS idx_banishments_status ON banishments(status);
CREATE INDEX IF NOT EXISTS idx_banishments_ends_at ON banishments(ends_at);

-- Banishment Votes
CREATE INDEX IF NOT EXISTS idx_banishment_votes_citizen ON banishment_votes(citizen_id);
CREATE INDEX IF NOT EXISTS idx_banishment_votes_banishment ON banishment_votes(banishment_id);
CREATE INDEX IF NOT EXISTS idx_banishment_votes_vote ON banishment_votes(vote);

-- Banishment Reminders
CREATE INDEX IF NOT EXISTS idx_banishment_reminders_banishment ON banishment_reminders(banishment_id);
CREATE INDEX IF NOT EXISTS idx_banishment_reminders_when ON banishment_reminders(when_at);
CREATE INDEX IF NOT EXISTS idx_banishment_reminders_sent ON banishment_reminders(sent) WHERE sent = FALSE;

-- Banishment Reports
CREATE INDEX IF NOT EXISTS idx_banishment_reports_banishment ON banishment_reports(banishment_id);
CREATE INDEX IF NOT EXISTS idx_banishment_reports_approved ON banishment_reports(approved_by_mayor);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE presidential_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE towns ENABLE ROW LEVEL SECURITY;
ALTER TABLE banishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE banishment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE banishment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE banishment_reports ENABLE ROW LEVEL SECURITY;

-- Presidential Sessions - Only accessible by the user who created them
CREATE POLICY presidential_sessions_user_policy ON presidential_sessions
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Citizens - All citizens can see other citizens in their town
CREATE POLICY citizens_town_policy ON citizens
    FOR ALL USING (town_id = current_setting('app.current_town_id', true));

-- Towns - All citizens can see their town
CREATE POLICY towns_citizen_policy ON towns
    FOR ALL USING (id = current_setting('app.current_town_id', true));

-- Banishments - Citizens can see banishments in their town
CREATE POLICY banishments_town_policy ON banishments
    FOR ALL USING (town_id = current_setting('app.current_town_id', true));

-- Banishment Votes - Citizens can see votes in their town
CREATE POLICY banishment_votes_town_policy ON banishment_votes
    FOR ALL USING (
        banishment_id IN (
            SELECT id FROM banishments 
            WHERE town_id = current_setting('app.current_town_id', true)
        )
    );

-- Banishment Reminders - Citizens can see reminders for their town
CREATE POLICY banishment_reminders_town_policy ON banishment_reminders
    FOR ALL USING (
        banishment_id IN (
            SELECT id FROM banishments 
            WHERE town_id = current_setting('app.current_town_id', true)
        )
    );

-- Banishment Reports - Citizens can see reports for their town
CREATE POLICY banishment_reports_town_policy ON banishment_reports
    FOR ALL USING (
        banishment_id IN (
            SELECT id FROM banishments 
            WHERE town_id = current_setting('app.current_town_id', true)
        )
    );

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_presidential_sessions_updated_at 
    BEFORE UPDATE ON presidential_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banishments_updated_at 
    BEFORE UPDATE ON banishments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically close expired banishments
CREATE OR REPLACE FUNCTION close_expired_banishments()
RETURNS void AS $$
BEGIN
    UPDATE banishments 
    SET status = 'expired', 
        final_decision = 'tie',
        closed_at = NOW()
    WHERE status = 'active' 
    AND ends_at < NOW();
END;
$$ language 'plpgsql';

-- Function to get banishment tally
CREATE OR REPLACE FUNCTION get_banishment_tally(banishment_uuid UUID)
RETURNS TABLE(yes_votes INTEGER, no_votes INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN vote = 'yes' THEN 1 ELSE 0 END), 0)::INTEGER as yes_votes,
        COALESCE(SUM(CASE WHEN vote = 'no' THEN 1 ELSE 0 END), 0)::INTEGER as no_votes
    FROM banishment_votes 
    WHERE banishment_id = banishment_uuid;
END;
$$ language 'plpgsql';

-- ============================================================================
-- Sample Data
-- ============================================================================

-- Insert sample towns
INSERT INTO towns (id, name, description, settings) VALUES 
('aurora', 'Aurora', 'The main Aurora town', '{"theme": "modern", "timezone": "UTC"}'),
('robbiebook', 'RobbieBook', 'RobbieBook town', '{"theme": "classic", "timezone": "UTC"}'),
('vengeance', 'Vengeance', 'Vengeance town', '{"theme": "gaming", "timezone": "UTC"}')
ON CONFLICT (id) DO NOTHING;

-- Insert Allan as President
INSERT INTO citizens (id, name, email, role, town_id) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Allan Peretz', 'allan@testpilotcpg.com', 'president', 'aurora')
ON CONFLICT (email) DO NOTHING;

-- Insert sample mayors
INSERT INTO citizens (id, name, email, role, town_id) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Mayor Johnson', 'mayor.johnson@aurora.local', 'mayor', 'aurora'),
('550e8400-e29b-41d4-a716-446655440002', 'Mayor Smith', 'mayor.smith@robbiebook.local', 'mayor', 'robbiebook')
ON CONFLICT (email) DO NOTHING;

-- Update towns with mayors
UPDATE towns SET mayor_id = '550e8400-e29b-41d4-a716-446655440001' WHERE id = 'aurora';
UPDATE towns SET mayor_id = '550e8400-e29b-41d4-a716-446655440002' WHERE id = 'robbiebook';

-- Insert sample citizens
INSERT INTO citizens (name, email, role, town_id) VALUES 
('Alice Citizen', 'alice@aurora.local', 'citizen', 'aurora'),
('Bob Resident', 'bob@aurora.local', 'citizen', 'aurora'),
('Charlie User', 'charlie@robbiebook.local', 'citizen', 'robbiebook')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE presidential_sessions IS 'Active presidential privilege sessions for elevated access control';
COMMENT ON TABLE citizens IS 'Citizens of Aurora towns with roles (citizen, mayor, president)';
COMMENT ON TABLE towns IS 'Aurora towns with mayors and settings';
COMMENT ON TABLE banishments IS 'Democratic banishment votes initiated by mayors';
COMMENT ON TABLE banishment_votes IS 'Individual votes cast by citizens in banishment proceedings';
COMMENT ON TABLE banishment_reminders IS 'Scheduled reminders for banishment votes';
COMMENT ON TABLE banishment_reports IS 'Official reports for banishment proceedings';

COMMENT ON COLUMN presidential_sessions.session_id IS 'Unique session identifier for presidential privilege access';
COMMENT ON COLUMN presidential_sessions.user_id IS 'User ID of the person granted presidential privilege';
COMMENT ON COLUMN presidential_sessions.actions_performed IS 'JSON array of actions performed with presidential privilege';
COMMENT ON COLUMN citizens.role IS 'Citizen role: citizen, mayor, or president';
COMMENT ON COLUMN banishments.status IS 'Banishment status: active, closed, or expired';
COMMENT ON COLUMN banishments.final_decision IS 'Final decision: banished, acquitted, or tie';
COMMENT ON COLUMN banishment_votes.vote IS 'Vote choice: yes or no';
