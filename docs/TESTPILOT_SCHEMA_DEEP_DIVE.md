# TestPilot CPG Database Schema - Deep Dive Analysis

**Created:** October 9, 2025  
**Database:** hykelmayopljuguuueme.supabase.co  
**Schema File:** `database/unified-schema/22-testpilot-production.sql`  
**Purpose:** Technical deep-dive into TestPilot CPG database architecture

---

## Schema Overview

**Total Tables:** 33  
**Total Rows:** 11,136 (as of Oct 9, 2025)  
**Database Engine:** PostgreSQL 16+ (Supabase)  
**Extensions:** uuid-ossp, pgcrypto

---

## Entity Relationship Diagram

```
                    ┌─────────────┐
                    │  companies  │
                    │  (40 rows)  │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌─────────────┐
    │ profiles │    │  tests   │    │credit_pmts  │
    │(39 rows) │    │(34 rows) │    │  (48 rows)  │
    └──────────┘    └─────┬────┘    └─────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
  ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
  │test_variations│ │ia_insights  │ │responses_*   │
  │  (69 rows)    │ │ (25 rows)   │ │(1,298 rows)  │
  └──────────────┘ └─────────────┘ └──────────────┘
         │
         ▼
  ┌──────────────┐
  │testers_session│
  │  (1000 rows) │
  └──────────────┘
```

---

## Core Business Tables

### companies

**Purpose:** Multi-tenant company accounts  
**Rows:** 40  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,  -- URL-safe identifier
    logo_url TEXT,
    settings JSONB DEFAULT '{}',  -- Flexible configuration
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    waiting_list BOOLEAN DEFAULT false,  -- Beta access control
    expert_mode BOOLEAN DEFAULT false    -- Advanced features flag
);
```

**Key Insights:**
- Slug format: `{name}-{random}` (e.g., "acme-inc-1e8c780a")
- Settings JSONB allows per-company customization
- Expert mode enables advanced features (2 companies have this)
- Waiting list controls beta access (tracking new signups)

**Foreign Key Relationships:**
- → profiles (company_id)
- → tests (company_id)
- → products (company_id)
- → credit_payments (company_id)

### profiles

**Purpose:** User accounts with company association  
**Rows:** 39  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',  -- owner, member, admin
    company_joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    email_confirmed BOOLEAN DEFAULT false
);
```

**Key Insights:**
- 39 profiles across 40 companies = some companies have no users yet
- Cascade delete ensures data integrity
- Role system enables team collaboration
- Email confirmation tracking for security

**Sample Profiles:**
- felipe.buscaglia@sidetool.co (Sidetool team member)
- matias.dhers@sidetool.co (Sidetool team member)
- allan+1@testpilotcpg.com (Test account)
- kristina@testpilotcpg.com (TestPilot team)
- isabel@testpilotcpg.com (TestPilot team)

### invites

**Purpose:** Team invitation system  
**Rows:** 7  
**Primary Key:** id (SERIAL)

**Schema:**
```sql
CREATE TABLE invites (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,  -- Secure invitation token
    expires_at TIMESTAMPTZ NOT NULL  -- Time-limited invitations
);
```

**Key Insights:**
- 7 pending invitations
- Token-based security
- Expiration enforcement
- Includes isabel@testpilotcpg.com (pending)

---

## Test Management System

### tests

**Purpose:** Main test configuration and lifecycle  
**Rows:** 34  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft',  -- draft, active, complete, incomplete
    search_term TEXT,  -- For product discovery
    settings JSONB DEFAULT '{}',
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    complete_email BOOLEAN DEFAULT false,  -- Completion notification sent
    objective TEXT,  -- Test goal/hypothesis
    step JSONB,  -- Multi-step wizard state
    block BOOLEAN DEFAULT false,  -- Block access (moderation)
    skin TEXT  -- UI theme/branding
);
```

**Status Distribution:**
- complete: 25 (73.5%)
- active: 6 (17.6%)
- draft: 2 (5.9%)
- incomplete: 1 (2.9%)

**Key Insights:**
- JSONB for flexible settings and step tracking
- Search term drives product discovery
- Block flag for moderation/access control
- Skin allows white-label branding

**Performance Indexes:**
```sql
CREATE INDEX idx_tests_company_id ON tests(company_id);
CREATE INDEX idx_tests_user_id ON tests(user_id);
```

### test_variations

**Purpose:** Product variations (A/B/C testing)  
**Rows:** 69  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE test_variations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    product_id UUID,
    variation_type TEXT NOT NULL,  -- 'A', 'B', 'C'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    prolific_status TEXT DEFAULT 'pending',  -- Prolific API status
    prolific_test_id TEXT,  -- External reference
    calculated_cost DECIMAL DEFAULT 0,  -- Cost estimation
    last_cost_calculation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    participant_count INTEGER DEFAULT 0,  -- Shoppers recruited
    reward_amount DECIMAL DEFAULT 0  -- Shopper incentive
);
```

**Key Insights:**
- 69 variations / 34 tests = ~2 variations per test (A/B common)
- Prolific integration for shopper recruitment
- Real-time cost calculation
- Participant tracking and reward management

### test_demographics

**Purpose:** Target audience definition  
**Rows:** 34  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE test_demographics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    age_ranges TEXT[],  -- ['18-24', '25-34', '35-44']
    genders TEXT[],  -- ['male', 'female', 'non-binary']
    locations TEXT[],  -- ['US-CA', 'US-NY', 'US-TX']
    interests TEXT[],  -- ['health', 'fitness', 'organic']
    tester_count INTEGER DEFAULT 50,  -- Minimum $2,450 per test
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    custom_screening_enabled BOOLEAN DEFAULT false
);
```

**Key Insights:**
- Array types for multi-select targeting
- Default 50 testers = $2,450 minimum revenue
- Custom screening for advanced targeting
- Geographic precision (state-level)

### test_survey_questions

**Purpose:** Custom survey configuration  
**Rows:** 15  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE test_survey_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    selected_questions TEXT[],  -- Question IDs or templates
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Key Insights:**
- 15 custom configurations / 34 tests = 44% use custom surveys
- Array storage for question selection
- Likely references predefined question bank

### test_competitors

**Purpose:** Competitor product assignments  
**Rows:** 371  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE test_competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    product_type TEXT,  -- 'amazon', 'walmart', 'custom'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Key Insights:**
- 371 competitors / 34 tests = ~11 competitors per test
- Heavy competitive benchmarking
- Multi-source competitor data (Amazon, Walmart, custom)

---

## Session & Engagement Tracking

### testers_session

**Purpose:** Individual shopper session tracking  
**Rows:** 1,000 (capped export)  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE testers_session (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'started',  -- started, completed, abandoned
    product_id UUID,
    ended_at TIMESTAMPTZ,
    competitor_id UUID,
    variation_type TEXT,  -- 'A', 'B', 'C'
    prolific_pid TEXT,  -- Prolific participant ID
    walmart_product_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Key Insights:**
- Session lifecycle tracking
- Prolific integration via prolific_pid
- Completion timing analysis
- Variation assignment tracking

### test_times

**Purpose:** Product engagement timing  
**Rows:** 1,000 (capped export)  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE test_times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    testers_session UUID REFERENCES testers_session(id) ON DELETE CASCADE,
    product_id UUID,
    time_spent DECIMAL,  -- Seconds on product page
    click INTEGER DEFAULT 0,  -- Click count
    competitor_id UUID,
    walmart_product_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Key Insights:**
- Granular engagement metrics
- Time-on-page tracking
- Click-through behavior
- Per-product analysis

---

## Product Catalog System

### products

**Purpose:** Client product catalog  
**Rows:** 68  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL,
    image_url TEXT,
    images TEXT[],  -- Multiple product images
    rating DECIMAL,
    is_competitor BOOLEAN DEFAULT false,
    loads JSONB,  -- Custom metadata
    product_url TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    reviews_count INTEGER DEFAULT 0,
    bullet_points TEXT[],  -- Feature highlights
    brand TEXT,
    walmart_id TEXT  -- External reference
);
```

**Key Insights:**
- 68 products / 40 companies = 1.7 products per company
- Rich metadata (images, ratings, reviews)
- JSONB loads for flexible data
- Walmart integration capability

### amazon_products

**Purpose:** Amazon competitor catalog  
**Rows:** 1,000 (capped export)  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE amazon_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    price DECIMAL,
    rating DECIMAL,
    reviews_count INTEGER DEFAULT 0,
    image_url TEXT,
    product_url TEXT,
    search_term TEXT,  -- Discovery query
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    asin TEXT,  -- Amazon Standard Identification Number
    bullet_points TEXT[],
    images TEXT[]
);
```

**Key Insights:**
- Comprehensive Amazon data capture
- ASIN tracking for product identity
- Search term tracking for discovery context
- Multiple images for comparison

### walmart_products

**Purpose:** Walmart competitor catalog  
**Rows:** 760  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE walmart_products (
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
    gtin TEXT,  -- Global Trade Item Number
    brand TEXT,
    bullet_points TEXT[],
    description TEXT
);
```

**Key Insights:**
- More detailed than Amazon (category, availability, seller)
- GTIN for global product identification
- Inventory tracking (availability)
- Seller information (marketplace awareness)

---

## Response & Feedback System

### responses_surveys

**Purpose:** Survey response data  
**Rows:** 206  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE responses_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tester_id UUID,
    product_id UUID,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    -- Rating dimensions (1-5 or 1-10 scale)
    value INTEGER,
    appearance INTEGER,
    confidence INTEGER,
    brand INTEGER,
    convenience INTEGER,
    appetizing INTEGER,
    target_audience INTEGER,
    novelty INTEGER,
    -- Qualitative feedback
    likes_most TEXT,
    improve_suggestions TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Key Insights:**
- 8 quantitative dimensions
- 2 qualitative fields
- Comprehensive product evaluation framework
- Supports AI insight generation

### responses_comparisons

**Purpose:** Head-to-head product comparisons  
**Rows:** 1,000 (capped export)  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE responses_comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    product_id UUID,
    competitor_id UUID,
    tester_id UUID,
    -- Same rating dimensions as surveys
    value INTEGER,
    appearance INTEGER,
    confidence INTEGER,
    brand INTEGER,
    convenience INTEGER,
    appetizing INTEGER,
    target_audience INTEGER,
    novelty INTEGER,
    -- Comparison-specific
    choose_reason TEXT,  -- Why chosen over competitor
    likes_most TEXT,
    improve_suggestions TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Key Insights:**
- Direct competitor comparison
- "Choose reason" captures decision drivers
- Same dimensions as surveys for consistency
- 1,000+ responses indicate high engagement

---

## AI Insights Engine (THE GOLD)

### ia_insights

**Purpose:** AI-generated test insights  
**Rows:** 25  
**Primary Key:** id (SERIAL)

**Schema:**
```sql
CREATE TABLE ia_insights (
    id SERIAL PRIMARY KEY,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    -- Core insights (TEXT = long-form AI generation)
    comparison_between_variants TEXT,
    purchase_drivers TEXT,
    competitive_insights TEXT,
    recommendations TEXT,
    comment_summary TEXT,
    -- Metadata
    variant_type TEXT,  -- Which variant this analyzes
    edited BOOLEAN DEFAULT false,  -- Human edits flag
    sendEmail BOOLEAN,  -- Trigger email notification
    -- Per-variant competitive insights
    competitive_insights_a TEXT,
    competitive_insights_b TEXT,
    competitive_insights_c TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Key Insights:**
- 25 insights / 25 complete tests = 100% insight generation rate
- Long-form text generation (likely GPT-4 or Claude)
- Edit tracking preserves AI vs human distinction
- Per-variant competitive analysis
- Email notification system

**Sample Insight Fields:**
- comparison_between_variants: "Variant A outperformed Variant B by 23% in purchase intent..."
- purchase_drivers: "Top drivers: 1) Perceived value (32%), 2) Brand trust (28%)..."
- recommendations: "Consider emphasizing organic certification more prominently..."

### purchase_drivers

**Purpose:** Quantitative driver analysis  
**Rows:** 57  
**Primary Key:** id (SERIAL)

**Schema:**
```sql
CREATE TABLE purchase_drivers (
    id SERIAL PRIMARY KEY,
    -- Weighted importance scores
    appearance DECIMAL,
    confidence DECIMAL,
    convenience DECIMAL,
    brand DECIMAL,
    value DECIMAL,
    -- Context
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    variant_type TEXT,
    count INTEGER,  -- Sample size
    product_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Key Insights:**
- Quantifies driver importance from qualitative data
- Likely derived via regression or correlation analysis
- Per-variant analysis
- Sample size tracking for statistical significance

### competitive_insights

**Purpose:** Competitive positioning analysis  
**Rows:** 451  
**Primary Key:** id (SERIAL)

**Schema:**
```sql
CREATE TABLE competitive_insights (
    id SERIAL PRIMARY KEY,
    variant_type TEXT,
    competitor_product_id UUID,
    -- Performance metrics
    share_of_buy DECIMAL,  -- % who would buy
    value DECIMAL,
    aesthetics DECIMAL,
    utility DECIMAL,
    trust DECIMAL,
    convenience DECIMAL,
    -- Context
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    count INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Key Insights:**
- 451 insights / 371 competitors = detailed per-competitor analysis
- Share of buy = key conversion metric
- 5 competitive dimensions (value, aesthetics, utility, trust, convenience)
- Aggregated from individual responses

### summary

**Purpose:** Test summary statistics  
**Rows:** 60  
**Primary Key:** id (SERIAL)

**Schema:**
```sql
CREATE TABLE summary (
    id SERIAL PRIMARY KEY,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    variant_type TEXT,
    -- Key metrics
    share_of_buy DECIMAL,  -- Purchase intent %
    share_of_click DECIMAL,  -- Click-through %
    value_score DECIMAL,  -- Composite value rating
    win BOOLEAN DEFAULT false,  -- Winning variant flag
    product_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Key Insights:**
- 60 summaries / 69 variations = 87% have summaries
- Win flag identifies best-performing variant
- Share of buy = primary success metric
- Share of click = engagement metric

---

## Credits & Billing System

### company_credits

**Purpose:** Company credit balances  
**Rows:** 8  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE company_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    total INTEGER DEFAULT 0,  -- Available credits
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Key Insights:**
- 8 companies have credit balances tracked
- Integer credits (likely 1 credit = 1 shopper = $49)
- Real-time balance tracking

### credit_usage

**Purpose:** Credit consumption tracking  
**Rows:** 5  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE credit_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    credits_used INTEGER,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Key Insights:**
- 5 usage records tracked
- Per-test credit allocation
- Audit trail for billing

### credit_payments (REVENUE TABLE)

**Purpose:** Payment transaction history  
**Rows:** 48  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE credit_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT,  -- Stripe integration
    amount_cents INTEGER,  -- $289,961.09 total
    credits_purchased INTEGER,
    status TEXT DEFAULT 'pending',  -- pending, succeeded, failed
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    credits_applied_at TIMESTAMPTZ  -- When credits added to account
);
```

**Revenue Analysis:**
- **Total: $289,961.09** (28,996,109 cents)
- **48 payments**
- **Average: $6,040.86** per payment
- **Largest: $12,740** (Simply Good Foods - closed Oct 2025)

**Status Distribution:**
- succeeded: (majority)
- pending: (processing)
- failed: (declined/errors)

---

## Demographics & Targeting

### custom_screening

**Purpose:** Advanced targeting questions  
**Rows:** 12  
**Primary Key:** id (SERIAL)

**Schema:**
```sql
CREATE TABLE custom_screening (
    id SERIAL PRIMARY KEY,
    question TEXT,
    valid_option TEXT,  -- Accept if answer matches
    invalid_option TEXT,  -- Reject if answer matches
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Key Insights:**
- 12 custom screens / 34 tests = 35% use advanced targeting
- Binary qualification (valid/invalid)
- Examples:
  - "Do you regularly purchase organic food?" → valid: "Yes"
  - "Have you shopped at Whole Foods in past 30 days?" → valid: "Yes"

### shopper_demographic

**Purpose:** Shopper demographic profiles  
**Rows:** 1,000 (capped export)  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE shopper_demographic (
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
    id_prolific TEXT,  -- Prolific participant ID
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Key Insights:**
- Comprehensive demographic capture
- Prolific integration for shopper identity
- International shopper support
- Employment and student status for segmentation

---

## System & Monitoring

### events

**Purpose:** System event tracking  
**Rows:** 1,000 (capped export)  
**Primary Key:** id (UUID)

**Schema:**
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT,  -- 'page_view', 'test_created', 'payment_succeeded'
    metadata JSONB DEFAULT '{}',  -- Flexible event data
    path TEXT,  -- URL path
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Key Insights:**
- Analytics event tracking
- JSONB for flexible event properties
- Likely powers usage analytics

### wrappers_fdw_stats

**Purpose:** Foreign Data Wrapper statistics  
**Rows:** 0  
**Primary Key:** None (composite)

**Schema:**
```sql
CREATE TABLE wrappers_fdw_stats (
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
```

**Key Insights:**
- Supabase Wrappers integration point
- Performance monitoring
- Data transfer tracking
- Currently unused (0 rows)

---

## Performance Optimization

### Indexes

```sql
-- Company associations
CREATE INDEX idx_companies_company_id ON profiles(company_id);
CREATE INDEX idx_tests_company_id ON tests(company_id);
CREATE INDEX idx_tests_user_id ON tests(user_id);

-- Test relationships
CREATE INDEX idx_test_variations_test_id ON test_variations(test_id);
CREATE INDEX idx_responses_test_id ON responses_surveys(test_id);
CREATE INDEX idx_responses_comparisons_test_id ON responses_comparisons(test_id);
CREATE INDEX idx_ia_insights_test_id ON ia_insights(test_id);

-- Sync queue
CREATE INDEX idx_pending_supabase_sync_created ON pending_supabase_sync(created_at);
CREATE INDEX idx_pending_supabase_sync_synced ON pending_supabase_sync(synced_at) 
    WHERE synced_at IS NULL;
```

**Key Insights:**
- Foreign key indexes for join performance
- Partial index on sync queue (unsync records only)
- Missing indexes:
  - products.company_id (should add)
  - testers_session.test_id (should add)
  - competitive_insights.test_id (should add)

### Triggers

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

**Applied to:** companies, profiles, tests, test_variations, test_demographics, products, competitor_products, amazon_products, walmart_products, custom_screening, company_credits, credit_payments

---

## Data Quality & Constraints

### Cascade Deletes

All foreign keys use `ON DELETE CASCADE`:
- Delete company → deletes all associated data
- Delete test → deletes all variations, responses, insights
- Delete profile → deletes authored tests

**Implication:** Data integrity maintained, but **be careful with deletes!**

### Unique Constraints

- companies.slug (URL-safe identifier)
- profiles.email (one account per email)
- invites.token (secure invitation links)

### Default Values

- UUIDs auto-generated
- Timestamps auto-populated
- Booleans default to false (safe defaults)
- JSONB defaults to '{}'

---

## Missing Features & Opportunities

### 1. Vector Embeddings

**Current:** No vector columns  
**Opportunity:** Add pgvector extension
```sql
ALTER TABLE products ADD COLUMN embedding vector(1536);
ALTER TABLE ia_insights ADD COLUMN embedding vector(1536);
```

**Benefits:**
- Semantic product search
- Similar test discovery
- AI-powered recommendations

### 2. Audit Logging

**Current:** Basic created_at/updated_at  
**Opportunity:** Full audit trail
```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY,
    table_name TEXT,
    record_id UUID,
    action TEXT,  -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    user_id UUID,
    created_at TIMESTAMPTZ
);
```

### 3. Advanced Analytics

**Current:** Basic aggregations  
**Opportunity:** Materialized views
```sql
CREATE MATERIALIZED VIEW test_performance AS
SELECT 
    t.id,
    t.name,
    COUNT(DISTINCT ts.id) as sessions,
    AVG(s.share_of_buy) as avg_conversion,
    SUM(cu.credits_used) as cost
FROM tests t
LEFT JOIN testers_session ts ON t.id = ts.test_id
LEFT JOIN summary s ON t.id = s.test_id
LEFT JOIN credit_usage cu ON t.id = cu.test_id
GROUP BY t.id, t.name;
```

### 4. Real-time Features

**Current:** Polling-based updates  
**Opportunity:** Supabase Realtime subscriptions
```typescript
supabase
  .channel('test_updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'tests'
  }, (payload) => {
    // Real-time test status updates
  })
  .subscribe()
```

---

## Conclusion

The TestPilot CPG database schema demonstrates:

1. **Well-structured multi-tenancy** (company-based isolation)
2. **Comprehensive test management** (lifecycle, variations, targeting)
3. **Rich product catalog** (Amazon, Walmart, custom)
4. **Detailed response tracking** (surveys, comparisons, timing)
5. **Sophisticated AI insights** (drivers, competitive analysis, recommendations)
6. **Production-ready billing** (Stripe integration, credit system)

**Strengths:**
- JSONB for flexibility
- Proper foreign key constraints
- Cascade deletes for data integrity
- Performance indexes on key tables
- Comprehensive metadata capture

**Opportunities:**
- Add vector embeddings for semantic features
- Implement audit logging
- Create materialized views for analytics
- Enable Supabase Realtime
- Add missing indexes (products, sessions, insights)

This schema is a **solid foundation** for a SaaS shopper testing platform and serves as an excellent blueprint for HeyShopper development.

---

**Document Status:** ✅ Complete  
**Technical Depth:** Expert-level database architecture analysis  
**Purpose:** Deep-dive reference for engineers building on TestPilot schema

