-- Enhanced Business Tables with Production Schema Insights
-- Based on analysis of existing production databases

-- Enhanced Companies table with vector embeddings and intelligence
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    hubspot_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    domain VARCHAR(255),
    industry VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Town/Node separation
    owner_id VARCHAR(50), -- Links to towns: aurora, fluenti, collaboration
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
    
    -- Vector embedding for similarity search
    embedding VECTOR(1536),
    
    -- Advanced intelligence
    active_deals_summary JSONB DEFAULT '{}',
    deals_last_analyzed TIMESTAMP,
    market_intelligence JSONB,
    
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enhanced Contacts table with engagement tracking
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    hubspot_id VARCHAR(255) UNIQUE NOT NULL,
    company_id INTEGER REFERENCES companies(id),
    email VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    job_title VARCHAR(255),
    phone VARCHAR(255),
    mobile_phone VARCHAR(50),
    updated_at TIMESTAMP,
    last_sync TIMESTAMP,
    
    -- Town/Node separation
    owner_id VARCHAR(50), -- Links to towns: aurora, fluenti, collaboration
    
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
    
    -- Vector embedding for similarity search
    embedding VECTOR(1536),
    
    -- Generated column for full name
    full_name TEXT GENERATED ALWAYS AS (
        COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
    ) STORED,
    
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enhanced Deals table with AI intelligence
CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY,
    hubspot_id VARCHAR(255) UNIQUE NOT NULL,
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
    
    -- Town/Node separation
    owner_id VARCHAR(50), -- Links to towns: aurora, fluenti, collaboration
    
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
    
    -- Vector embedding for similarity search
    deal_embedding VECTOR(1536),
    
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

-- Enhanced Activities table with comprehensive tracking
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    hubspot_activity_id VARCHAR(255) UNIQUE NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_subtype VARCHAR(100),
    
    -- Relationships
    contact_id INTEGER REFERENCES contacts(id),
    company_id INTEGER REFERENCES companies(id),
    deal_id INTEGER REFERENCES deals(id),
    
    -- Town/Node separation
    owner_id VARCHAR(50), -- Links to towns: aurora, fluenti, collaboration
    
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
    sync_status VARCHAR(50),
    
    -- Vector embedding for similarity search
    embedding VECTOR(1536)
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_embedding ON companies USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100) WHERE is_active = true AND embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_embedding ON contacts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100) WHERE is_active = true AND embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_active ON contacts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_contacts_engagement ON contacts(last_engagement_date, engagement_count);
CREATE INDEX IF NOT EXISTS idx_contacts_full_name ON contacts USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_embedding ON deals USING ivfflat (deal_embedding vector_cosine_ops) WITH (lists = 50) WHERE is_active = true AND deal_embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_active ON deals(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_deals_deal_score ON deals(hs_deal_score) WHERE is_active = true AND is_closed = false;

CREATE INDEX IF NOT EXISTS idx_activities_owner_id ON activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_embedding ON activities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50) WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_contact ON activities(contact_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_deal ON activities(deal_id, activity_date DESC);

-- Functions for maintaining computed metrics
CREATE OR REPLACE FUNCTION update_company_deal_metrics() RETURNS TRIGGER AS $$
BEGIN
    -- Update company deal metrics when deals change
    UPDATE companies SET
        total_deal_count = (SELECT COUNT(*) FROM deals WHERE company_id = NEW.company_id AND is_active = true),
        open_deal_count = (SELECT COUNT(*) FROM deals WHERE company_id = NEW.company_id AND is_active = true AND is_closed = false),
        won_deal_count = (SELECT COUNT(*) FROM deals WHERE company_id = NEW.company_id AND is_active = true AND closed_won = true),
        total_deal_value = (SELECT COALESCE(SUM(amount), 0) FROM deals WHERE company_id = NEW.company_id AND is_active = true),
        open_deal_value = (SELECT COALESCE(SUM(amount), 0) FROM deals WHERE company_id = NEW.company_id AND is_active = true AND is_closed = false),
        won_deal_value = (SELECT COALESCE(SUM(amount), 0) FROM deals WHERE company_id = NEW.company_id AND is_active = true AND closed_won = true),
        last_deal_date = (SELECT MAX(close_date) FROM deals WHERE company_id = NEW.company_id AND is_active = true),
        last_won_date = (SELECT MAX(close_date) FROM deals WHERE company_id = NEW.company_id AND is_active = true AND closed_won = true),
        has_deals = (SELECT COUNT(*) > 0 FROM deals WHERE company_id = NEW.company_id AND is_active = true)
    WHERE id = NEW.company_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_contact_deal_metrics() RETURNS TRIGGER AS $$
BEGIN
    -- Update contact deal metrics when primary contact changes
    UPDATE contacts SET
        total_deal_count = (SELECT COUNT(*) FROM deals WHERE primary_contact_id = NEW.id AND is_active = true),
        open_deal_count = (SELECT COUNT(*) FROM deals WHERE primary_contact_id = NEW.id AND is_active = true AND is_closed = false),
        won_deal_count = (SELECT COUNT(*) FROM deals WHERE primary_contact_id = NEW.id AND is_active = true AND closed_won = true),
        total_deal_value = (SELECT COALESCE(SUM(amount), 0) FROM deals WHERE primary_contact_id = NEW.id AND is_active = true),
        open_deal_value = (SELECT COALESCE(SUM(amount), 0) FROM deals WHERE primary_contact_id = NEW.id AND is_active = true AND is_closed = false),
        won_deal_value = (SELECT COALESCE(SUM(amount), 0) FROM deals WHERE primary_contact_id = NEW.id AND is_active = true AND closed_won = true),
        last_deal_date = (SELECT MAX(close_date) FROM deals WHERE primary_contact_id = NEW.id AND is_active = true),
        last_won_date = (SELECT MAX(close_date) FROM deals WHERE primary_contact_id = NEW.id AND is_active = true AND closed_won = true),
        has_deals = (SELECT COUNT(*) > 0 FROM deals WHERE primary_contact_id = NEW.id AND is_active = true),
        is_primary_on_deals = (SELECT COUNT(*) FROM deals WHERE primary_contact_id = NEW.id AND is_active = true)
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for maintaining computed metrics
CREATE TRIGGER update_company_deals_on_deal_change
    AFTER INSERT OR DELETE OR UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_company_deal_metrics();

CREATE TRIGGER update_contact_primary_deals
    AFTER UPDATE ON deals
    FOR EACH ROW WHEN (old.primary_contact_id IS DISTINCT FROM new.primary_contact_id)
    EXECUTE FUNCTION update_contact_deal_metrics();
