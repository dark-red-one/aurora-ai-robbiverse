-- Interactions Database for Engagement Scoring
-- Tracks all inbound/outbound communications and website activity

-- Interactions table - captures all touchpoints
CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_type VARCHAR(50) NOT NULL, -- 'email', 'slack', 'linkedin', 'website', 'phone', 'meeting'
    direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
    person_id UUID REFERENCES crm_contacts(id),
    company_id UUID REFERENCES crm_companies(id),
    deal_id UUID REFERENCES crm_deals(id),
    
    -- Content
    subject VARCHAR(500),
    content TEXT,
    summary TEXT,
    
    -- Metadata
    source VARCHAR(100), -- 'gmail', 'slack', 'linkedin', 'website', 'phone'
    external_id VARCHAR(200), -- ID from external system
    thread_id VARCHAR(200), -- For email threads
    
    -- Engagement metrics
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    replied_at TIMESTAMP,
    time_spent_seconds INTEGER DEFAULT 0,
    engagement_score DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 1.0
    
    -- Context
    sentiment VARCHAR(20), -- 'positive', 'negative', 'neutral'
    urgency VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    priority VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Multi-tenancy
    company_id_tenant UUID REFERENCES companies(id),
    town_id UUID REFERENCES towns(id),
    privacy_level VARCHAR(20) DEFAULT 'internal' -- 'public', 'internal', 'confidential', 'secret'
);

-- Website activity tracking
CREATE TABLE IF NOT EXISTS website_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES crm_contacts(id),
    company_id UUID REFERENCES crm_companies(id),
    
    -- Page tracking
    page_url VARCHAR(1000) NOT NULL,
    page_title VARCHAR(500),
    referrer VARCHAR(1000),
    
    -- Session data
    session_id VARCHAR(200),
    user_agent TEXT,
    ip_address INET,
    
    -- Engagement
    time_on_page_seconds INTEGER DEFAULT 0,
    scroll_depth_percent INTEGER DEFAULT 0,
    bounce BOOLEAN DEFAULT FALSE,
    
    -- Conversion tracking
    converted BOOLEAN DEFAULT FALSE,
    conversion_type VARCHAR(100), -- 'signup', 'demo', 'contact', 'purchase'
    conversion_value DECIMAL(10,2),
    
    -- Timestamps
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Multi-tenancy
    company_id_tenant UUID REFERENCES companies(id),
    town_id UUID REFERENCES towns(id)
);

-- Email engagement tracking
CREATE TABLE IF NOT EXISTS email_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID REFERENCES interactions(id),
    email_id VARCHAR(200) NOT NULL, -- External email ID
    
    -- Open tracking
    opened_at TIMESTAMP,
    open_count INTEGER DEFAULT 0,
    first_open_at TIMESTAMP,
    last_open_at TIMESTAMP,
    
    -- Click tracking
    clicked_at TIMESTAMP,
    click_count INTEGER DEFAULT 0,
    first_click_at TIMESTAMP,
    last_click_at TIMESTAMP,
    clicked_links TEXT[], -- Array of clicked URLs
    
    -- Reply tracking
    replied_at TIMESTAMP,
    reply_count INTEGER DEFAULT 0,
    
    -- Unsubscribe tracking
    unsubscribed_at TIMESTAMP,
    unsubscribe_reason VARCHAR(500),
    
    -- Device/location data
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    location_country VARCHAR(100),
    location_city VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Engagement scoring rules
CREATE TABLE IF NOT EXISTS engagement_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'interaction', 'email', 'website', 'composite'
    
    -- Rule conditions (JSON)
    conditions JSONB NOT NULL,
    
    -- Scoring
    base_score DECIMAL(3,2) NOT NULL, -- 0.0 to 1.0
    multiplier DECIMAL(3,2) DEFAULT 1.0,
    max_score DECIMAL(3,2) DEFAULT 1.0,
    
    -- Time decay
    decay_hours INTEGER DEFAULT 24, -- Hours for score to decay
    decay_factor DECIMAL(3,2) DEFAULT 0.9, -- Decay rate per period
    
    -- Status
    active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0, -- Higher number = higher priority
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Person engagement scores (aggregated)
CREATE TABLE IF NOT EXISTS person_engagement_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES crm_contacts(id) UNIQUE,
    
    -- Overall scores
    total_score DECIMAL(5,2) DEFAULT 0.0,
    email_score DECIMAL(5,2) DEFAULT 0.0,
    website_score DECIMAL(5,2) DEFAULT 0.0,
    social_score DECIMAL(5,2) DEFAULT 0.0,
    meeting_score DECIMAL(5,2) DEFAULT 0.0,
    
    -- Activity counts
    total_interactions INTEGER DEFAULT 0,
    email_interactions INTEGER DEFAULT 0,
    website_visits INTEGER DEFAULT 0,
    social_interactions INTEGER DEFAULT 0,
    meetings INTEGER DEFAULT 0,
    
    -- Recent activity
    last_interaction_at TIMESTAMP,
    last_email_at TIMESTAMP,
    last_website_visit_at TIMESTAMP,
    last_social_at TIMESTAMP,
    last_meeting_at TIMESTAMP,
    
    -- Engagement trends
    score_trend VARCHAR(20), -- 'increasing', 'decreasing', 'stable'
    activity_trend VARCHAR(20), -- 'increasing', 'decreasing', 'stable'
    
    -- Timestamps
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company engagement scores (aggregated)
CREATE TABLE IF NOT EXISTS company_engagement_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES crm_companies(id) UNIQUE,
    
    -- Overall scores
    total_score DECIMAL(5,2) DEFAULT 0.0,
    email_score DECIMAL(5,2) DEFAULT 0.0,
    website_score DECIMAL(5,2) DEFAULT 0.0,
    social_score DECIMAL(5,2) DEFAULT 0.0,
    meeting_score DECIMAL(5,2) DEFAULT 0.0,
    
    -- Activity counts
    total_interactions INTEGER DEFAULT 0,
    unique_people_interacted INTEGER DEFAULT 0,
    email_interactions INTEGER DEFAULT 0,
    website_visits INTEGER DEFAULT 0,
    social_interactions INTEGER DEFAULT 0,
    meetings INTEGER DEFAULT 0,
    
    -- Recent activity
    last_interaction_at TIMESTAMP,
    last_email_at TIMESTAMP,
    last_website_visit_at TIMESTAMP,
    last_social_at TIMESTAMP,
    last_meeting_at TIMESTAMP,
    
    -- Engagement trends
    score_trend VARCHAR(20), -- 'increasing', 'decreasing', 'stable'
    activity_trend VARCHAR(20), -- 'increasing', 'decreasing', 'stable'
    
    -- Timestamps
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interactions_person_id ON interactions(person_id);
CREATE INDEX IF NOT EXISTS idx_interactions_company_id ON interactions(company_id);
CREATE INDEX IF NOT EXISTS idx_interactions_deal_id ON interactions(deal_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_direction ON interactions(direction);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_interactions_engagement_score ON interactions(engagement_score);

CREATE INDEX IF NOT EXISTS idx_website_activity_person_id ON website_activity(person_id);
CREATE INDEX IF NOT EXISTS idx_website_activity_company_id ON website_activity(company_id);
CREATE INDEX IF NOT EXISTS idx_website_activity_visited_at ON website_activity(visited_at);
CREATE INDEX IF NOT EXISTS idx_website_activity_converted ON website_activity(converted);

CREATE INDEX IF NOT EXISTS idx_email_engagement_email_id ON email_engagement(email_id);
CREATE INDEX IF NOT EXISTS idx_email_engagement_opened_at ON email_engagement(opened_at);
CREATE INDEX IF NOT EXISTS idx_email_engagement_clicked_at ON email_engagement(clicked_at);

CREATE INDEX IF NOT EXISTS idx_person_engagement_scores_person_id ON person_engagement_scores(person_id);
CREATE INDEX IF NOT EXISTS idx_person_engagement_scores_total_score ON person_engagement_scores(total_score);
CREATE INDEX IF NOT EXISTS idx_person_engagement_scores_updated_at ON person_engagement_scores(updated_at);

CREATE INDEX IF NOT EXISTS idx_company_engagement_scores_company_id ON company_engagement_scores(company_id);
CREATE INDEX IF NOT EXISTS idx_company_engagement_scores_total_score ON company_engagement_scores(total_score);
CREATE INDEX IF NOT EXISTS idx_company_engagement_scores_updated_at ON company_engagement_scores(updated_at);

-- Row Level Security policies
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_engagement_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_engagement_scores ENABLE ROW LEVEL SECURITY;

-- Policies for interactions
CREATE POLICY interactions_company_access ON interactions
    FOR ALL TO aurora_app
    USING (company_id_tenant = current_setting('app.current_company_id')::UUID);

CREATE POLICY interactions_town_access ON interactions
    FOR ALL TO aurora_app
    USING (town_id = current_setting('app.current_town_id')::UUID);

-- Policies for website_activity
CREATE POLICY website_activity_company_access ON website_activity
    FOR ALL TO aurora_app
    USING (company_id_tenant = current_setting('app.current_company_id')::UUID);

CREATE POLICY website_activity_town_access ON website_activity
    FOR ALL TO aurora_app
    USING (town_id = current_setting('app.current_town_id')::UUID);

-- Policies for email_engagement
CREATE POLICY email_engagement_company_access ON email_engagement
    FOR ALL TO aurora_app
    USING (interaction_id IN (
        SELECT id FROM interactions 
        WHERE company_id_tenant = current_setting('app.current_company_id')::UUID
    ));

-- Policies for engagement_rules
CREATE POLICY engagement_rules_company_access ON engagement_rules
    FOR ALL TO aurora_app
    USING (TRUE); -- Rules are shared across companies

-- Policies for person_engagement_scores
CREATE POLICY person_engagement_scores_company_access ON person_engagement_scores
    FOR ALL TO aurora_app
    USING (person_id IN (
        SELECT id FROM crm_contacts 
        WHERE company_id = current_setting('app.current_company_id')::UUID
    ));

-- Policies for company_engagement_scores
CREATE POLICY company_engagement_scores_company_access ON company_engagement_scores
    FOR ALL TO aurora_app
    USING (company_id = current_setting('app.current_company_id')::UUID);

-- Insert default engagement rules
INSERT INTO engagement_rules (rule_name, rule_type, conditions, base_score, priority) VALUES
('Email Open', 'email', '{"action": "opened", "count": 1}', 0.1, 1),
('Email Click', 'email', '{"action": "clicked", "count": 1}', 0.2, 2),
('Email Reply', 'email', '{"action": "replied", "count": 1}', 0.3, 3),
('Website Visit', 'website', '{"action": "visited", "count": 1}', 0.1, 1),
('Website Conversion', 'website', '{"action": "converted", "count": 1}', 0.5, 5),
('LinkedIn Interaction', 'social', '{"platform": "linkedin", "count": 1}', 0.15, 2),
('Slack Message', 'interaction', '{"type": "slack", "direction": "inbound"}', 0.2, 2),
('Meeting Attended', 'interaction', '{"type": "meeting", "direction": "inbound"}', 0.4, 4),
('High Time on Page', 'website', '{"time_on_page": ">300"}', 0.2, 3),
('Multiple Page Views', 'website', '{"page_views": ">3"}', 0.15, 2)
ON CONFLICT DO NOTHING;
