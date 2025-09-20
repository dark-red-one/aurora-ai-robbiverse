-- Production Schema for TestPilot Simulations
-- Towns/Cities with business data (no vector dependencies for now)

-- Towns/Cities configuration
CREATE TABLE IF NOT EXISTS towns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- aurora, fluenti, collaboration
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    region VARCHAR(50), -- iceland, us, argentina
    owner_email VARCHAR(255),
    owner_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default towns
INSERT INTO towns (name, display_name, description, region, owner_email, owner_name) VALUES
('aurora', 'Aurora (Capital)', 'Primary AI Empire capital with 2x RTX 4090 GPUs', 'austin', 'allan@testpilot.ai', 'Allan'),
('fluenti', 'Fluenti', 'US operations node with 1x RTX 4090 GPU', 'los-angeles', 'allan@testpilot.ai', 'Allan'),
('collaboration', 'Collaboration', 'Development and testing node with 1x RTX 4090 GPU', 'argentina', 'allan@testpilot.ai', 'Allan')
ON CONFLICT (name) DO NOTHING;

-- Companies table (production ready)
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    hubspot_id VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    domain VARCHAR(255),
    industry VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Town/City separation
    owner_id VARCHAR(50) DEFAULT 'aurora', -- Links to towns: aurora, fluenti, collaboration
    owner_email VARCHAR(255),
    owner_name VARCHAR(255),
    
    -- Business metrics
    linkedin_url VARCHAR(255),
    has_deals BOOLEAN DEFAULT false,
    total_deal_count INTEGER DEFAULT 0,
    open_deal_count INTEGER DEFAULT 0,
    won_deal_count INTEGER DEFAULT 0,
    total_deal_value NUMERIC(12,2) DEFAULT 0,
    open_deal_value NUMERIC(12,2) DEFAULT 0,
    won_deal_value NUMERIC(12,2) DEFAULT 0,
    last_deal_date TIMESTAMP,
    last_won_date TIMESTAMP,
    
    -- Advanced intelligence (JSONB for now, vector later)
    active_deals_summary JSONB DEFAULT '{}',
    deals_last_analyzed TIMESTAMP,
    market_intelligence JSONB,
    
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Contacts table (production ready)
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    hubspot_id VARCHAR(255) UNIQUE,
    company_id INTEGER REFERENCES companies(id),
    email VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    job_title VARCHAR(255),
    phone VARCHAR(255),
    mobile_phone VARCHAR(50),
    updated_at TIMESTAMP,
    last_sync TIMESTAMP,
    
    -- Town/City separation
    owner_id VARCHAR(50) DEFAULT 'aurora',
    
    -- Contact details
    linkedin_url VARCHAR(255),
    linkedin_bio TEXT,
    
    -- Engagement tracking
    is_engaged BOOLEAN DEFAULT false,
    engagement_score INTEGER DEFAULT 0,
    last_engagement_date TIMESTAMP,
    engagement_type VARCHAR(50),
    engagement_count INTEGER DEFAULT 0,
    last_email_open TIMESTAMP,
    last_email_click TIMESTAMP,
    last_meeting_date TIMESTAMP,
    last_reply_date TIMESTAMP,
    
    -- Deal metrics
    has_deals BOOLEAN DEFAULT false,
    total_deal_count INTEGER DEFAULT 0,
    open_deal_count INTEGER DEFAULT 0,
    won_deal_count INTEGER DEFAULT 0,
    total_deal_value NUMERIC(12,2) DEFAULT 0,
    open_deal_value NUMERIC(12,2) DEFAULT 0,
    won_deal_value NUMERIC(12,2) DEFAULT 0,
    last_deal_date TIMESTAMP,
    last_won_date TIMESTAMP,
    is_primary_on_deals INTEGER DEFAULT 0,
    
    -- Activity tracking
    last_activity_date TIMESTAMP,
    last_activity_type VARCHAR(50),
    activity_count INTEGER DEFAULT 0,
    
    -- Generated column for full name
    full_name TEXT GENERATED ALWAYS AS (
        COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
    ) STORED,
    
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Deals table (production ready)
CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY,
    hubspot_id VARCHAR(255) UNIQUE,
    deal_name VARCHAR(255),
    amount NUMERIC(12,2),
    pipeline VARCHAR(255),
    dealstage VARCHAR(255),
    close_date TIMESTAMP,
    create_date TIMESTAMP,
    hs_lastmodifieddate TIMESTAMP,
    dealtype VARCHAR(255),
    
    -- Forecasting
    hs_forecast_category VARCHAR(100),
    hs_forecast_probability NUMERIC(5,2),
    hs_manual_forecast_category VARCHAR(100),
    hs_next_step TEXT,
    
    -- Town/City separation
    owner_id VARCHAR(50) DEFAULT 'aurora',
    
    -- Deal status
    is_closed BOOLEAN DEFAULT false,
    closed_won BOOLEAN DEFAULT false,
    closed_lost_reason VARCHAR(255),
    
    -- Relationships
    company_id INTEGER REFERENCES companies(id),
    primary_contact_id INTEGER REFERENCES contacts(id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- AI Intelligence and scoring
    hs_deal_score INTEGER,
    intelligence_score INTEGER,
    intelligence_updated_at TIMESTAMP,
    latest_intelligence_report JSONB,
    velocity_status VARCHAR(50),
    recommended_stage VARCHAR(255),
    predicted_close_date DATE,
    deal_score INTEGER DEFAULT 0,
    
    -- Risk and opportunity analysis
    risks JSONB DEFAULT '[]',
    opportunities JSONB DEFAULT '[]',
    timing_analysis JSONB,
    progression_analysis JSONB,
    
    -- AI insights
    formatted_report TEXT,
    ai_insights TEXT,
    
    -- Generated probability calculation
    calculated_probability INTEGER GENERATED ALWAYS AS (
        COALESCE(hs_deal_score, hs_forecast_probability::integer,
            CASE 
                WHEN hs_forecast_category = 'commit' THEN 90
                WHEN hs_forecast_category = 'bestcase' THEN 70
                WHEN hs_forecast_category = 'pipeline' THEN 50
                WHEN hs_forecast_category = 'omitted' THEN 10
                ELSE 
                    CASE dealstage
                        WHEN 'contractsent' THEN 80
                        WHEN 'decisionmakerboughtin' THEN 70
                        WHEN 'presentationscheduled' THEN 50
                        WHEN 'appointmentscheduled' THEN 40
                        WHEN 'qualifiedtobuy' THEN 30
                        WHEN 'closedwon' THEN 100
                        WHEN 'closedlost' THEN 0
                        ELSE 20
                    END
            END
        )
    ) STORED,
    
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Activities table (production ready)
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    hubspot_activity_id VARCHAR(255) UNIQUE,
    activity_type VARCHAR(50) NOT NULL,
    activity_subtype VARCHAR(100),
    
    -- Relationships
    contact_id INTEGER REFERENCES contacts(id),
    company_id INTEGER REFERENCES companies(id),
    deal_id INTEGER REFERENCES deals(id),
    
    -- Town/City separation
    owner_id VARCHAR(50) DEFAULT 'aurora',
    
    -- Activity details
    subject TEXT,
    body_preview TEXT,
    direction VARCHAR(20), -- inbound/outbound
    status VARCHAR(50),
    duration_minutes INTEGER,
    outcome VARCHAR(100),
    
    -- Web tracking
    page_url TEXT,
    page_title VARCHAR(500),
    session_id VARCHAR(255),
    referrer_url TEXT,
    utm_source VARCHAR(100),
    utm_campaign VARCHAR(255),
    form_name VARCHAR(255),
    form_values JSONB,
    
    -- Communication tracking
    chat_transcript TEXT,
    objections_mentioned TEXT[],
    sentiment_score NUMERIC(3,2),
    
    -- Timestamps
    activity_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    
    -- Metadata and sync
    metadata JSONB DEFAULT '{}',
    sync_status VARCHAR(50)
);

-- Deal Contacts junction table
CREATE TABLE IF NOT EXISTS deal_contacts (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
    role VARCHAR(100), -- primary, influencer, decision_maker, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(deal_id, contact_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_hubspot_id ON companies(hubspot_id);

CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON contacts(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_hubspot_id ON contacts(hubspot_id);
CREATE INDEX IF NOT EXISTS idx_contacts_full_name_gin ON contacts USING gin (to_tsvector('english', full_name));

CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON deals(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_primary_contact_id ON deals(primary_contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_hubspot_id ON deals(hubspot_id);
CREATE INDEX IF NOT EXISTS idx_deals_dealstage ON deals(dealstage);
CREATE INDEX IF NOT EXISTS idx_deals_close_date ON deals(close_date);

CREATE INDEX IF NOT EXISTS idx_activities_owner_id ON activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact_id ON activities(contact_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON activities(deal_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_hubspot_id ON activities(hubspot_activity_id);

-- Town-specific views for data isolation
CREATE OR REPLACE VIEW aurora_companies AS
SELECT c.* FROM companies c WHERE c.owner_id = 'aurora' AND c.is_active = true;

CREATE OR REPLACE VIEW aurora_contacts AS
SELECT ct.* FROM contacts ct WHERE ct.owner_id = 'aurora' AND ct.is_active = true;

CREATE OR REPLACE VIEW aurora_deals AS
SELECT d.* FROM deals d WHERE d.owner_id = 'aurora' AND d.is_active = true;

CREATE OR REPLACE VIEW aurora_activities AS
SELECT a.* FROM activities a WHERE a.owner_id = 'aurora';

CREATE OR REPLACE VIEW fluenti_companies AS
SELECT c.* FROM companies c WHERE c.owner_id = 'fluenti' AND c.is_active = true;

CREATE OR REPLACE VIEW fluenti_contacts AS
SELECT ct.* FROM contacts ct WHERE ct.owner_id = 'fluenti' AND ct.is_active = true;

CREATE OR REPLACE VIEW fluenti_deals AS
SELECT d.* FROM deals d WHERE d.owner_id = 'fluenti' AND d.is_active = true;

CREATE OR REPLACE VIEW fluenti_activities AS
SELECT a.* FROM activities a WHERE a.owner_id = 'fluenti';

CREATE OR REPLACE VIEW collaboration_companies AS
SELECT c.* FROM companies c WHERE c.owner_id = 'collaboration' AND c.is_active = true;

CREATE OR REPLACE VIEW collaboration_contacts AS
SELECT ct.* FROM contacts ct WHERE ct.owner_id = 'collaboration' AND ct.is_active = true;

CREATE OR REPLACE VIEW collaboration_deals AS
SELECT d.* FROM deals d WHERE d.owner_id = 'collaboration' AND d.is_active = true;

CREATE OR REPLACE VIEW collaboration_activities AS
SELECT a.* FROM activities a WHERE a.owner_id = 'collaboration';

-- Cross-town analytics (Aurora capital can see all)
CREATE OR REPLACE VIEW cross_town_analytics AS
SELECT 
    t.name as town_name,
    t.display_name,
    t.region,
    COUNT(DISTINCT c.id) as company_count,
    COUNT(DISTINCT ct.id) as contact_count,
    COUNT(DISTINCT d.id) as deal_count,
    COALESCE(SUM(d.amount), 0) as total_deal_value,
    COALESCE(SUM(CASE WHEN d.closed_won THEN d.amount ELSE 0 END), 0) as won_deal_value,
    COUNT(DISTINCT a.id) as activity_count,
    MAX(a.activity_date) as last_activity_date
FROM towns t
LEFT JOIN companies c ON c.owner_id = t.name AND c.is_active = true
LEFT JOIN contacts ct ON ct.owner_id = t.name AND ct.is_active = true
LEFT JOIN deals d ON d.owner_id = t.name AND d.is_active = true
LEFT JOIN activities a ON a.owner_id = t.name
WHERE t.is_active = true
GROUP BY t.id, t.name, t.display_name, t.region
ORDER BY total_deal_value DESC;
