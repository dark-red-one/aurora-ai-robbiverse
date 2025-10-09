-- TestPilot CPG Production Tables (from Supabase)
-- Replicated from hykelmayopljuguuueme.supabase.co
-- Date: January 9, 2025

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Business Tables
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    waiting_list BOOLEAN DEFAULT false,
    expert_mode BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    company_joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    email_confirmed BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS invites (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- Product Testing Platform
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft',
    search_term TEXT,
    settings JSONB DEFAULT '{}',
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    complete_email BOOLEAN DEFAULT false,
    objective TEXT,
    step JSONB,
    block BOOLEAN DEFAULT false,
    skin TEXT
);

CREATE TABLE IF NOT EXISTS test_variations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    product_id UUID,
    variation_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    prolific_status TEXT DEFAULT 'pending',
    prolific_test_id TEXT,
    calculated_cost DECIMAL DEFAULT 0,
    last_cost_calculation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    participant_count INTEGER DEFAULT 0,
    reward_amount DECIMAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS test_demographics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    age_ranges TEXT[],
    genders TEXT[],
    locations TEXT[],
    interests TEXT[],
    tester_count INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    custom_screening_enabled BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS test_survey_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    selected_questions TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    product_type TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS testers_session (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'started',
    product_id UUID,
    ended_at TIMESTAMPTZ,
    competitor_id UUID,
    variation_type TEXT,
    prolific_pid TEXT,
    walmart_product_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    testers_session UUID REFERENCES testers_session(id) ON DELETE CASCADE,
    product_id UUID,
    time_spent DECIMAL,
    click INTEGER DEFAULT 0,
    competitor_id UUID,
    walmart_product_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Products & Competitors
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL,
    image_url TEXT,
    images TEXT[],
    rating DECIMAL,
    is_competitor BOOLEAN DEFAULT false,
    loads JSONB,
    product_url TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    reviews_count INTEGER DEFAULT 0,
    bullet_points TEXT[],
    brand TEXT,
    walmart_id TEXT
);

CREATE TABLE IF NOT EXISTS competitor_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    image_url TEXT,
    price DECIMAL,
    source_type TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS amazon_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    price DECIMAL,
    rating DECIMAL,
    reviews_count INTEGER DEFAULT 0,
    image_url TEXT,
    product_url TEXT,
    search_term TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    asin TEXT,
    bullet_points TEXT[],
    images TEXT[]
);

CREATE TABLE IF NOT EXISTS walmart_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    price DECIMAL,
    rating DECIMAL,
    reviews_count INTEGER DEFAULT 0,
    image_url TEXT,
    product_url TEXT,
    search_term TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    walmart_id TEXT,
    images TEXT[],
    product_category TEXT,
    product_short_description TEXT,
    product_availability TEXT,
    sold_by TEXT,
    sku TEXT,
    gtin TEXT,
    brand TEXT,
    bullet_points TEXT[],
    description TEXT
);

-- Responses & Feedback
CREATE TABLE IF NOT EXISTS responses_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tester_id UUID,
    product_id UUID,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    value INTEGER,
    appearance INTEGER,
    confidence INTEGER,
    brand INTEGER,
    convenience INTEGER,
    likes_most TEXT,
    improve_suggestions TEXT,
    appetizing INTEGER,
    target_audience INTEGER,
    novelty INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS responses_comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    product_id UUID,
    competitor_id UUID,
    value INTEGER,
    appearance INTEGER,
    confidence INTEGER,
    brand INTEGER,
    convenience INTEGER,
    likes_most TEXT,
    improve_suggestions TEXT,
    choose_reason TEXT,
    tester_id UUID,
    appetizing INTEGER,
    target_audience INTEGER,
    novelty INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS responses_comparisons_walmart (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    tester_id UUID,
    product_id UUID,
    competitor_id UUID,
    likes_most TEXT,
    improve_suggestions TEXT,
    choose_reason TEXT,
    value INTEGER,
    appearance INTEGER,
    confidence INTEGER,
    brand INTEGER,
    convenience INTEGER,
    appetizing INTEGER,
    target_audience INTEGER,
    novelty INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rating INTEGER,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- AI Insights (THE GOLD! 💰)
CREATE TABLE IF NOT EXISTS ia_insights (
    id SERIAL PRIMARY KEY,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    comparison_between_variants TEXT,
    purchase_drivers TEXT,
    competitive_insights TEXT,
    recommendations TEXT,
    sendEmail BOOLEAN,
    comment_summary TEXT,
    variant_type TEXT,
    edited BOOLEAN DEFAULT false,
    competitive_insights_a TEXT,
    competitive_insights_b TEXT,
    competitive_insights_c TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ia_insights_backup (
    id SERIAL PRIMARY KEY,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    comparison_between_variants TEXT,
    purchase_drivers TEXT,
    competitive_insights TEXT,
    recommendations TEXT,
    sendEmail BOOLEAN,
    comment_summary TEXT,
    backup_created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ia_insights_backup_20241226 (
    id SERIAL PRIMARY KEY,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    comparison_between_variants TEXT,
    purchase_drivers TEXT,
    competitive_insights TEXT,
    recommendations TEXT,
    sendEmail BOOLEAN,
    comment_summary TEXT,
    variant_type TEXT,
    edited BOOLEAN DEFAULT false,
    competitive_insights_a TEXT,
    competitive_insights_b TEXT,
    competitive_insights_c TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS insight_status (
    id SERIAL PRIMARY KEY,
    insight_data TEXT,
    variant_type TEXT,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_drivers (
    id SERIAL PRIMARY KEY,
    appearance DECIMAL,
    confidence DECIMAL,
    convenience DECIMAL,
    brand DECIMAL,
    value DECIMAL,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    variant_type TEXT,
    count INTEGER,
    product_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS competitive_insights (
    id SERIAL PRIMARY KEY,
    variant_type TEXT,
    competitor_product_id UUID,
    share_of_buy DECIMAL,
    value DECIMAL,
    aesthetics DECIMAL,
    utility DECIMAL,
    trust DECIMAL,
    convenience DECIMAL,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    count INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS competitive_insights_analysis (
    id SERIAL PRIMARY KEY,
    variant_id UUID,
    analysis TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS competitive_insights_walmart (
    id BIGINT PRIMARY KEY,
    variant_type TEXT,
    competitor_product_id UUID,
    share_of_buy DECIMAL,
    value DECIMAL,
    aesthetics DECIMAL,
    utility DECIMAL,
    trust DECIMAL,
    convenience DECIMAL,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    count INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS summary (
    id SERIAL PRIMARY KEY,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    variant_type TEXT,
    share_of_buy DECIMAL,
    share_of_click DECIMAL,
    value_score DECIMAL,
    win BOOLEAN DEFAULT false,
    product_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Demographics & Targeting
CREATE TABLE IF NOT EXISTS custom_screening (
    id SERIAL PRIMARY KEY,
    question TEXT,
    valid_option TEXT,
    invalid_option TEXT,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shopper_demographic (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    age TEXT,
    sex TEXT,
    ethnicity TEXT,
    country_birth TEXT,
    country_residence TEXT,
    nationality TEXT,
    student TEXT,
    employment_status TEXT,
    language TEXT,
    id_prolific TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Credits & Billing
CREATE TABLE IF NOT EXISTS company_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    total INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    credits_used INTEGER,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT,
    amount_cents INTEGER,
    credits_purchased INTEGER,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    credits_applied_at TIMESTAMPTZ
);

-- System
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT,
    metadata JSONB DEFAULT '{}',
    path TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wrappers_fdw_stats (
    fdw_name TEXT,
    create_times INTEGER,
    rows_in INTEGER,
    rows_out INTEGER,
    bytes_in BIGINT,
    bytes_out BIGINT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sync queue for offline writes
CREATE TABLE IF NOT EXISTS pending_supabase_sync (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_tests_company_id ON tests(company_id);
CREATE INDEX IF NOT EXISTS idx_tests_user_id ON tests(user_id);
CREATE INDEX IF NOT EXISTS idx_test_variations_test_id ON test_variations(test_id);
CREATE INDEX IF NOT EXISTS idx_responses_test_id ON responses_surveys(test_id);
CREATE INDEX IF NOT EXISTS idx_responses_comparisons_test_id ON responses_comparisons(test_id);
CREATE INDEX IF NOT EXISTS idx_ia_insights_test_id ON ia_insights(test_id);
CREATE INDEX IF NOT EXISTS idx_pending_supabase_sync_created ON pending_supabase_sync(created_at);
CREATE INDEX IF NOT EXISTS idx_pending_supabase_sync_synced ON pending_supabase_sync(synced_at) WHERE synced_at IS NULL;

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables with updated_at
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name IN ('companies', 'profiles', 'tests', 'test_variations', 'test_demographics', 'test_survey_questions', 'products', 'competitor_products', 'amazon_products', 'walmart_products', 'custom_screening', 'company_credits', 'credit_payments')
        AND column_name = 'updated_at'
    LOOP
        EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', table_name, table_name);
    END LOOP;
END $$;
