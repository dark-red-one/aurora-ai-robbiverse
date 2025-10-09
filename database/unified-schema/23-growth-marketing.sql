-- ============================================================================
-- ROBBIE@GROWTH MARKETING PLATFORM SCHEMA
-- ============================================================================
-- Marketing operations: LinkedIn/Buffer automation, budgets, campaigns, ROI
-- Built for TestPilot CPG revenue acceleration
-- Date: October 9, 2025
-- ============================================================================
-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- ============================================================================
-- BUFFER INTEGRATION
-- ============================================================================
-- Buffer social media accounts (LinkedIn, Twitter, etc.)
CREATE TABLE IF NOT EXISTS buffer_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_type TEXT NOT NULL CHECK (
        account_type IN (
            'linkedin_personal',
            'linkedin_company',
            'twitter',
            'facebook',
            'instagram'
        )
    ),
    account_name TEXT NOT NULL,
    account_handle TEXT,
    -- @testpilotcpg, etc.
    buffer_profile_id TEXT UNIQUE,
    access_token TEXT,
    -- Encrypted in production
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Buffer scheduled/posted content
CREATE TABLE IF NOT EXISTS buffer_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buffer_id TEXT UNIQUE,
    account_id UUID NOT NULL REFERENCES buffer_accounts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_urls JSONB DEFAULT '[]'::jsonb,
    -- ["url1", "url2"]
    scheduled_at TIMESTAMPTZ,
    posted_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (
        status IN (
            'draft',
            'pending_approval',
            'approved',
            'scheduled',
            'posted',
            'failed'
        )
    ),
    engagement JSONB DEFAULT '{
        "likes": 0,
        "comments": 0,
        "shares": 0,
        "impressions": 0,
        "clicks": 0
    }'::jsonb,
    created_by TEXT DEFAULT 'robbie',
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    campaign_id UUID,
    -- Link to marketing_campaigns
    utm_params JSONB DEFAULT '{}'::jsonb,
    -- {source, medium, campaign, content}
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- ============================================================================
-- MARKETING BUDGETS
-- ============================================================================
-- Marketing budget allocations by period and category
CREATE TABLE IF NOT EXISTS marketing_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    total_budget NUMERIC(12, 2) NOT NULL CHECK (total_budget >= 0),
    spent NUMERIC(12, 2) DEFAULT 0 CHECK (spent >= 0),
    remaining NUMERIC(12, 2) GENERATED ALWAYS AS (total_budget - spent) STORED,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    category TEXT NOT NULL CHECK (
        category IN (
            'ads',
            'tools',
            'content',
            'events',
            'agencies',
            'other'
        )
    ),
    owner TEXT,
    -- Who manages this budget
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_period CHECK (period_end >= period_start)
);
-- Individual marketing expenses
CREATE TABLE IF NOT EXISTS marketing_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES marketing_budgets(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    vendor TEXT,
    category TEXT,
    -- Additional subcategory
    receipt_url TEXT,
    invoice_number TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'approved',
            'rejected',
            'paid'
        )
    ),
    submitted_by TEXT,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- ============================================================================
-- MARKETING CAMPAIGNS
-- ============================================================================
-- Marketing campaigns with multi-channel tracking
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    goal TEXT,
    -- "Generate 50 SQLs", "Launch new product", etc.
    budget_allocated NUMERIC(12, 2) DEFAULT 0 CHECK (budget_allocated >= 0),
    budget_spent NUMERIC(12, 2) DEFAULT 0 CHECK (budget_spent >= 0),
    start_date DATE NOT NULL,
    end_date DATE,
    channels JSONB DEFAULT '[]'::jsonb,
    -- ["linkedin", "twitter", "email"]
    target_metrics JSONB DEFAULT '{}'::jsonb,
    -- {leads: 100, conversions: 10, revenue: 120000}
    actual_metrics JSONB DEFAULT '{
        "leads": 0,
        "mqls": 0,
        "sqls": 0,
        "opportunities": 0,
        "conversions": 0,
        "revenue": 0,
        "impressions": 0,
        "clicks": 0,
        "engagement_rate": 0
    }'::jsonb,
    roi NUMERIC(10, 2),
    -- Calculated: (Revenue - Cost) / Cost
    roi_percentage NUMERIC(5, 2),
    -- ROI as percentage
    status TEXT NOT NULL DEFAULT 'planning' CHECK (
        status IN (
            'planning',
            'active',
            'paused',
            'completed',
            'cancelled'
        )
    ),
    owner TEXT,
    -- Campaign manager
    utm_campaign TEXT,
    -- UTM campaign code for tracking
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_dates CHECK (
        end_date IS NULL
        OR end_date >= start_date
    )
);
-- Campaign performance tracking (daily snapshots)
CREATE TABLE IF NOT EXISTS campaign_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    spend_to_date NUMERIC(12, 2) DEFAULT 0,
    revenue_to_date NUMERIC(12, 2) DEFAULT 0,
    roi_to_date NUMERIC(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, snapshot_date)
);
-- ============================================================================
-- AUTOMATION SETTINGS
-- ============================================================================
-- Growth automation configuration per user
CREATE TABLE IF NOT EXISTS growth_automation_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    automation_level INTEGER DEFAULT 50 CHECK (
        automation_level >= 0
        AND automation_level <= 100
    ),
    action_settings JSONB DEFAULT '{
        "linkedin_post": {
            "enabled": true,
            "requires_approval": true,
            "max_per_day": 3
        },
        "linkedin_comment": {
            "enabled": true,
            "requires_approval": false,
            "max_per_day": 10
        },
        "linkedin_dm": {
            "enabled": false,
            "requires_approval": true,
            "max_per_day": 5
        },
        "linkedin_connection_request": {
            "enabled": true,
            "requires_approval": true,
            "max_per_day": 10
        },
        "buffer_schedule": {
            "enabled": true,
            "requires_approval": true
        },
        "twitter_post": {
            "enabled": false,
            "requires_approval": true,
            "max_per_day": 5
        }
    }'::jsonb,
    guardrails JSONB DEFAULT '{
        "max_posts_per_day": 3,
        "max_comments_per_day": 10,
        "max_dms_per_day": 5,
        "max_connections_per_day": 10,
        "blacklist_keywords": ["urgent", "limited time", "buy now", "act fast"],
        "require_approval_above_followers": 10000,
        "quiet_hours": {
            "start": "22:00",
            "end": "07:00"
        },
        "min_quality_score": 7
    }'::jsonb,
    notification_settings JSONB DEFAULT '{
        "approval_required": true,
        "daily_summary": true,
        "budget_alerts": true,
        "lead_alerts": true
    }'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
-- ============================================================================
-- LINKEDIN AUTOMATION QUEUE
-- ============================================================================
-- Queue for LinkedIn actions awaiting approval or execution
CREATE TABLE IF NOT EXISTS linkedin_action_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type TEXT NOT NULL CHECK (
        action_type IN (
            'post',
            'comment',
            'dm',
            'connection_request',
            'like',
            'share'
        )
    ),
    target_profile_url TEXT,
    target_post_url TEXT,
    content TEXT,
    reason TEXT,
    -- Why Robbie wants to do this
    quality_score INTEGER CHECK (
        quality_score >= 1
        AND quality_score <= 10
    ),
    priority INTEGER DEFAULT 5 CHECK (
        priority >= 1
        AND priority <= 10
    ),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'approved',
            'rejected',
            'executed',
            'failed'
        )
    ),
    requires_approval BOOLEAN DEFAULT true,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    result JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    contact_id UUID,
    -- Link to CRM if applicable
    deal_id UUID,
    -- Link to deal if applicable
    campaign_id UUID REFERENCES marketing_campaigns(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- ============================================================================
-- LEAD SCORING & TRACKING
-- ============================================================================
-- LinkedIn lead scoring and engagement tracking
CREATE TABLE IF NOT EXISTS linkedin_lead_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
    linkedin_profile_url TEXT,
    score INTEGER DEFAULT 0 CHECK (
        score >= 0
        AND score <= 100
    ),
    score_breakdown JSONB DEFAULT '{
        "title_match": 0,
        "engagement": 0,
        "company_size": 0,
        "activity_recency": 0,
        "connection_degree": 0,
        "deal_stage": 0
    }'::jsonb,
    engagement_history JSONB DEFAULT '{
        "profile_views": 0,
        "post_likes": 0,
        "post_comments": 0,
        "messages_sent": 0,
        "messages_received": 0,
        "connection_accepted": false
    }'::jsonb,
    last_interaction_at TIMESTAMPTZ,
    temperature TEXT DEFAULT 'cold' CHECK (temperature IN ('cold', 'warm', 'hot')),
    next_action TEXT,
    -- Recommended next step
    next_action_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contact_id)
);
-- ============================================================================
-- CONTENT LIBRARY
-- ============================================================================
-- Reusable content snippets for social posts
CREATE TABLE IF NOT EXISTS content_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT CHECK (
        content_type IN (
            'case_study',
            'insight',
            'tip',
            'announcement',
            'question',
            'statistic'
        )
    ),
    tags JSONB DEFAULT '[]'::jsonb,
    -- ["cpg", "testing", "retail"]
    performance_score NUMERIC(5, 2),
    -- Average engagement when used
    use_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_by TEXT DEFAULT 'robbie',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
-- Buffer accounts
CREATE INDEX IF NOT EXISTS idx_buffer_accounts_type ON buffer_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_buffer_accounts_active ON buffer_accounts(is_active);
-- Buffer posts
CREATE INDEX IF NOT EXISTS idx_buffer_posts_account ON buffer_posts(account_id);
CREATE INDEX IF NOT EXISTS idx_buffer_posts_status ON buffer_posts(status);
CREATE INDEX IF NOT EXISTS idx_buffer_posts_scheduled ON buffer_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_buffer_posts_campaign ON buffer_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_buffer_posts_created_by ON buffer_posts(created_by);
-- Marketing budgets
CREATE INDEX IF NOT EXISTS idx_budgets_category ON marketing_budgets(category);
CREATE INDEX IF NOT EXISTS idx_budgets_active ON marketing_budgets(is_active);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON marketing_budgets(period_start, period_end);
-- Marketing expenses
CREATE INDEX IF NOT EXISTS idx_expenses_budget ON marketing_expenses(budget_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON marketing_expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON marketing_expenses(expense_date);
-- Marketing campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON marketing_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_utm ON marketing_campaigns(utm_campaign);
-- Campaign performance
CREATE INDEX IF NOT EXISTS idx_campaign_perf_campaign ON campaign_performance(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_perf_date ON campaign_performance(snapshot_date);
-- LinkedIn action queue
CREATE INDEX IF NOT EXISTS idx_linkedin_queue_status ON linkedin_action_queue(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_queue_type ON linkedin_action_queue(action_type);
CREATE INDEX IF NOT EXISTS idx_linkedin_queue_priority ON linkedin_action_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_linkedin_queue_contact ON linkedin_action_queue(contact_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_queue_campaign ON linkedin_action_queue(campaign_id);
-- LinkedIn lead scores
CREATE INDEX IF NOT EXISTS idx_lead_scores_contact ON linkedin_lead_scores(contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_score ON linkedin_lead_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scores_temperature ON linkedin_lead_scores(temperature);
-- Content library
CREATE INDEX IF NOT EXISTS idx_content_library_type ON content_library(content_type);
CREATE INDEX IF NOT EXISTS idx_content_library_active ON content_library(is_active);
CREATE INDEX IF NOT EXISTS idx_content_library_tags ON content_library USING GIN(tags);
-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATES
-- ============================================================================
-- Update buffer_accounts.updated_at
CREATE OR REPLACE FUNCTION update_buffer_accounts_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_buffer_accounts BEFORE
UPDATE ON buffer_accounts FOR EACH ROW EXECUTE FUNCTION update_buffer_accounts_timestamp();
-- Update buffer_posts.updated_at
CREATE TRIGGER trigger_update_buffer_posts BEFORE
UPDATE ON buffer_posts FOR EACH ROW EXECUTE FUNCTION update_buffer_accounts_timestamp();
-- Update marketing_budgets.updated_at
CREATE TRIGGER trigger_update_marketing_budgets BEFORE
UPDATE ON marketing_budgets FOR EACH ROW EXECUTE FUNCTION update_buffer_accounts_timestamp();
-- Update marketing_expenses.updated_at
CREATE TRIGGER trigger_update_marketing_expenses BEFORE
UPDATE ON marketing_expenses FOR EACH ROW EXECUTE FUNCTION update_buffer_accounts_timestamp();
-- Auto-update budget spent when expense is approved
CREATE OR REPLACE FUNCTION update_budget_spent() RETURNS TRIGGER AS $$ BEGIN IF NEW.status = 'approved'
    AND (
        OLD.status IS NULL
        OR OLD.status != 'approved'
    ) THEN
UPDATE marketing_budgets
SET spent = spent + NEW.amount,
    updated_at = CURRENT_TIMESTAMP
WHERE id = NEW.budget_id;
END IF;
IF OLD.status = 'approved'
AND NEW.status != 'approved' THEN
UPDATE marketing_budgets
SET spent = spent - OLD.amount,
    updated_at = CURRENT_TIMESTAMP
WHERE id = NEW.budget_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_budget_spent
AFTER
INSERT
    OR
UPDATE ON marketing_expenses FOR EACH ROW EXECUTE FUNCTION update_budget_spent();
-- ============================================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================================
-- Marketing overview dashboard
CREATE OR REPLACE VIEW marketing_overview AS
SELECT -- Budget summary
    (
        SELECT SUM(total_budget)
        FROM marketing_budgets
        WHERE is_active = true
    ) as total_budget,
    (
        SELECT SUM(spent)
        FROM marketing_budgets
        WHERE is_active = true
    ) as total_spent,
    (
        SELECT SUM(remaining)
        FROM marketing_budgets
        WHERE is_active = true
    ) as total_remaining,
    -- Campaign summary
    (
        SELECT COUNT(*)
        FROM marketing_campaigns
        WHERE status = 'active'
    ) as active_campaigns,
    (
        SELECT COUNT(*)
        FROM marketing_campaigns
        WHERE status = 'completed'
    ) as completed_campaigns,
    (
        SELECT SUM(budget_spent)
        FROM marketing_campaigns
        WHERE status IN ('active', 'completed')
    ) as campaign_spend,
    (
        SELECT SUM((actual_metrics->>'revenue')::numeric)
        FROM marketing_campaigns
        WHERE status IN ('active', 'completed')
    ) as campaign_revenue,
    -- LinkedIn summary
    (
        SELECT COUNT(*)
        FROM linkedin_action_queue
        WHERE status = 'pending'
            AND requires_approval = true
    ) as pending_approvals,
    (
        SELECT COUNT(*)
        FROM linkedin_lead_scores
        WHERE temperature = 'hot'
    ) as hot_leads,
    (
        SELECT COUNT(*)
        FROM linkedin_lead_scores
        WHERE temperature = 'warm'
    ) as warm_leads,
    -- Buffer summary
    (
        SELECT COUNT(*)
        FROM buffer_posts
        WHERE status = 'scheduled'
    ) as scheduled_posts,
    (
        SELECT COUNT(*)
        FROM buffer_posts
        WHERE status = 'posted'
            AND posted_at > CURRENT_DATE - INTERVAL '30 days'
    ) as posts_last_30_days;
-- Campaign ROI analysis
CREATE OR REPLACE VIEW campaign_roi_analysis AS
SELECT c.id,
    c.name,
    c.status,
    c.start_date,
    c.end_date,
    c.budget_allocated,
    c.budget_spent,
    (c.actual_metrics->>'revenue')::numeric as revenue,
    (c.actual_metrics->>'conversions')::integer as conversions,
    (c.actual_metrics->>'leads')::integer as leads,
    c.roi,
    c.roi_percentage,
    CASE
        WHEN (c.actual_metrics->>'conversions')::integer > 0 THEN c.budget_spent / (c.actual_metrics->>'conversions')::integer
        ELSE 0
    END as cac,
    -- Customer Acquisition Cost
    CASE
        WHEN (c.actual_metrics->>'leads')::integer > 0 THEN c.budget_spent / (c.actual_metrics->>'leads')::integer
        ELSE 0
    END as cpl,
    -- Cost Per Lead
    c.channels,
    c.utm_campaign,
    c.owner
FROM marketing_campaigns c
WHERE c.status IN ('active', 'completed')
ORDER BY c.roi DESC NULLS LAST;
-- LinkedIn engagement pipeline
CREATE OR REPLACE VIEW linkedin_engagement_pipeline AS
SELECT lls.id,
    c.id as contact_id,
    c.first_name,
    c.last_name,
    c.email,
    c.company_domain,
    lls.score,
    lls.temperature,
    lls.last_interaction_at,
    lls.next_action,
    lls.next_action_date,
    lp.profile_url,
    lp.headline,
    lp.connections,
    d.id as deal_id,
    d.name as deal_name,
    d.stage as deal_stage,
    d.amount as deal_amount,
    (
        SELECT COUNT(*)
        FROM linkedin_action_queue laq
        WHERE laq.contact_id = c.id
            AND laq.status = 'executed'
    ) as total_interactions
FROM linkedin_lead_scores lls
    JOIN crm_contacts c ON c.id = lls.contact_id
    LEFT JOIN linkedin_profiles lp ON lp.contact_id = c.id
    LEFT JOIN crm_deals d ON d.associated_contacts @> jsonb_build_array(c.id::text)
ORDER BY lls.score DESC,
    lls.temperature DESC;
-- ============================================================================
-- FUNCTIONS
-- ============================================================================
-- Calculate lead score based on multiple factors
CREATE OR REPLACE FUNCTION calculate_lead_score(p_contact_id UUID) RETURNS INTEGER AS $$
DECLARE v_score INTEGER := 0;
v_contact RECORD;
v_profile RECORD;
v_deal RECORD;
v_engagement RECORD;
BEGIN -- Get contact data
SELECT * INTO v_contact
FROM crm_contacts
WHERE id = p_contact_id;
IF NOT FOUND THEN RETURN 0;
END IF;
-- Get LinkedIn profile
SELECT * INTO v_profile
FROM linkedin_profiles
WHERE contact_id = p_contact_id;
-- Get deal data
SELECT * INTO v_deal
FROM crm_deals
WHERE associated_contacts @> jsonb_build_array(p_contact_id::text)
ORDER BY amount DESC NULLS LAST
LIMIT 1;
-- Get lead score record
SELECT * INTO v_engagement
FROM linkedin_lead_scores
WHERE contact_id = p_contact_id;
-- Title match (decision maker)
IF v_profile.headline ILIKE '%VP%'
OR v_profile.headline ILIKE '%Director%'
OR v_profile.headline ILIKE '%Manager%'
OR v_profile.headline ILIKE '%Head of%' THEN v_score := v_score + 30;
END IF;
-- Engagement score
IF v_engagement IS NOT NULL THEN v_score := v_score + LEAST(
    (v_engagement.engagement_history->>'post_likes')::integer * 2 + (
        v_engagement.engagement_history->>'post_comments'
    )::integer * 5 + (
        v_engagement.engagement_history->>'messages_received'
    )::integer * 10,
    30
);
END IF;
-- Company size (connections as proxy)
IF v_profile.connections > 500 THEN v_score := v_score + 20;
ELSIF v_profile.connections > 200 THEN v_score := v_score + 10;
END IF;
-- Activity recency
IF v_profile.last_activity > NOW() - INTERVAL '7 days' THEN v_score := v_score + 10;
ELSIF v_profile.last_activity > NOW() - INTERVAL '30 days' THEN v_score := v_score + 5;
END IF;
-- Deal stage bonus
IF v_deal IS NOT NULL THEN CASE
    v_deal.stage
    WHEN 'negotiation' THEN v_score := v_score + 20;
WHEN 'proposal' THEN v_score := v_score + 15;
WHEN 'qualified' THEN v_score := v_score + 10;
ELSE v_score := v_score + 5;
END CASE
;
END IF;
-- Cap at 100
RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;
-- Get pending actions requiring approval
CREATE OR REPLACE FUNCTION get_pending_approvals(p_limit INTEGER DEFAULT 10) RETURNS TABLE (
        id UUID,
        action_type TEXT,
        content TEXT,
        reason TEXT,
        quality_score INTEGER,
        priority INTEGER,
        target_profile_url TEXT,
        contact_name TEXT,
        deal_name TEXT,
        created_at TIMESTAMPTZ
    ) AS $$ BEGIN RETURN QUERY
SELECT laq.id,
    laq.action_type,
    laq.content,
    laq.reason,
    laq.quality_score,
    laq.priority,
    laq.target_profile_url,
    CONCAT(c.first_name, ' ', c.last_name) as contact_name,
    d.name as deal_name,
    laq.created_at
FROM linkedin_action_queue laq
    LEFT JOIN crm_contacts c ON c.id = laq.contact_id
    LEFT JOIN crm_deals d ON d.id = laq.deal_id
WHERE laq.status = 'pending'
    AND laq.requires_approval = true
ORDER BY laq.priority DESC,
    laq.created_at ASC
LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE buffer_accounts IS 'Social media accounts managed through Buffer';
COMMENT ON TABLE buffer_posts IS 'Scheduled and posted content via Buffer';
COMMENT ON TABLE marketing_budgets IS 'Marketing budget allocations by period and category';
COMMENT ON TABLE marketing_expenses IS 'Individual marketing expenses and approvals';
COMMENT ON TABLE marketing_campaigns IS 'Multi-channel marketing campaigns with tracking';
COMMENT ON TABLE campaign_performance IS 'Daily campaign performance snapshots';
COMMENT ON TABLE growth_automation_settings IS 'User-specific automation preferences and guardrails';
COMMENT ON TABLE linkedin_action_queue IS 'Queue of LinkedIn actions awaiting approval/execution';
COMMENT ON TABLE linkedin_lead_scores IS 'Calculated lead scores based on engagement and profile data';
COMMENT ON TABLE content_library IS 'Reusable content snippets for social posts';
COMMENT ON VIEW marketing_overview IS 'High-level marketing performance dashboard';
COMMENT ON VIEW campaign_roi_analysis IS 'Campaign ROI and cost metrics';
COMMENT ON VIEW linkedin_engagement_pipeline IS 'LinkedIn leads with scores and next actions';
COMMENT ON FUNCTION calculate_lead_score IS 'Calculate 0-100 lead score based on profile, engagement, and deal data';
COMMENT ON FUNCTION get_pending_approvals IS 'Get LinkedIn actions awaiting approval';