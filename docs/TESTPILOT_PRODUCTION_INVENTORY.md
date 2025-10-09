# TestPilot CPG Production Application - Complete Inventory

**Document Created:** October 9, 2025  
**Production Site:** app.testpilotcpg.com  
**Marketing Site:** testpilotcpg.com  
**Builder:** Sidetool (github.com/sidetoolco)  
**Database:** Supabase (hykelmayopljuguuueme.supabase.co)  
**Status:** Live Production with $289,961.09 Revenue

---

## Executive Summary

TestPilot CPG is a **live production shopper testing platform** built by Sidetool that allows CPG brands to run product tests with real consumers. This is NOT code in our repository - we only have a replicated read-only copy of the production database schema and data for reference, analytics, and future integration.

**Key Metrics (as of October 9, 2025):**
- 40 companies using the platform
- 34 tests run (25 complete, 6 active, 2 draft, 1 incomplete)
- 48 payments totaling $289,961.09
- 11,136 total database rows across 33 tables
- 1,000+ shopper sessions tracked
- 25 AI insights generated

---

## Production Application Overview

### Public Website (testpilotcpg.com)

**Main Value Proposition:**
"Take Your CPG Launches to New Heights!"

**Key Features:**
- Realistic eCommerce simulations
- 1.2 million US-based shoppers available
- 72-hour insight delivery
- Improves product success rates

**Navigation Structure:**
1. **Use Cases** - Pricing optimization, claims refinement, packaging validation
2. **How It Works** - 3-step process:
   - Choose Your Audience (demographics/psychographics)
   - Configure Your Test (upload products, select competitors)
   - Take Action (analyze behavior and feedback)
3. **Pricing** - $49 per shopper, minimum 50 shoppers per test leg
4. **Meet ACE** - Automated Clarity Engine (AI analysis tool)
5. **Demo** - Free consultation scheduling
6. **Login** - Access to app.testpilotcpg.com

### Application Platform (app.testpilotcpg.com)

**Architecture:**
- **Frontend:** Next.js, React + Vite
- **Backend:** Node.js, NestJS
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel + GCP
- **Languages:** TypeScript, JavaScript, Python

**Core Functionality:**
- Multi-tenant company accounts
- Test configuration and management
- Product catalog (Amazon/Walmart integration)
- Shopper recruitment via Prolific
- Real-time dashboard and analytics
- AI-powered insights generation
- Stripe payment processing

---

## Database Schema Analysis

### Complete Table Inventory (33 Tables)

#### 1. Core Business (3 tables)

**companies** - 40 rows
- Company accounts with branding
- Features: waiting_list, expert_mode flags
- Links to all other tables via company_id

**profiles** - 39 rows  
- User accounts linked to companies
- Role-based access (owner, member)
- Email confirmation tracking

**invites** - 7 rows
- Team invitation system
- Token-based with expiration

#### 2. Product Testing Platform (7 tables)

**tests** - 34 rows
- Main test configurations
- Status: complete (25), active (6), draft (2), incomplete (1)
- Links to company and user
- JSONB settings for flexibility

**test_variations** - 69 rows
- A/B/C product variations
- Prolific integration status
- Cost calculation and participant tracking

**test_demographics** - 34 rows
- Target audience definition
- Age, gender, location, interests
- Tester count (default 50)
- Custom screening enabled flag

**test_survey_questions** - 15 rows
- Custom survey questions per test
- Stored as text arrays

**test_competitors** - 371 rows
- Competitor products to compare against
- Links products to tests

**testers_session** - 1,000 rows (capped)
- Individual shopper sessions
- Status tracking and timing
- Prolific participant ID linking

**test_times** - 1,000 rows (capped)
- Time spent on products
- Click tracking
- Engagement metrics

#### 3. Product Catalogs (4 tables)

**products** - 68 rows
- TestPilot client products
- Rich metadata: images, pricing, ratings
- Walmart ID integration

**competitor_products** - 1,000 rows (capped)
- Combined competitor catalog
- Source type tracking (Amazon/Walmart)

**amazon_products** - 1,000 rows (capped)
- Amazon product data
- ASIN, bullet points, images
- Rating and review counts

**walmart_products** - 760 rows
- Walmart product data  
- Comprehensive metadata (SKU, GTIN, brand)
- Product availability tracking

#### 4. Responses & Feedback (4 tables)

**responses_surveys** - 206 rows
- Survey responses from shoppers
- Ratings: value, appearance, confidence, brand, convenience
- Qualitative: likes_most, improve_suggestions
- Additional metrics: appetizing, target_audience, novelty

**responses_comparisons** - 1,000 rows (capped)
- Head-to-head product comparisons
- Same rating dimensions as surveys
- Choose reason tracking

**responses_comparisons_walmart** - 92 rows
- Walmart-specific comparisons
- Same structure as general comparisons

**feedback** - 1,000 rows (capped)
- General platform feedback
- Rating and comments

#### 5. AI Insights - THE GOLD (9 tables)

**ia_insights** - 25 rows
- AI-generated insights per test
- Key fields:
  - comparison_between_variants
  - purchase_drivers
  - competitive_insights (A/B/C variants)
  - recommendations
  - comment_summary
- Edit tracking and email flags

**ia_insights_backup** - 13 rows
- Backup before edits

**ia_insights_backup_20241226** - 26 rows
- Dated backup snapshot

**insight_status** - 487 rows
- Insight generation tracking
- Status and timing data

**purchase_drivers** - 57 rows
- AI analysis of what drives purchases
- Dimensions: appearance, confidence, convenience, brand, value
- Aggregated by test and variant

**competitive_insights** - 451 rows
- Competitive positioning analysis
- Share of buy calculations
- Multi-dimensional scoring

**competitive_insights_analysis** - 0 rows
- Placeholder for deeper analysis

**competitive_insights_walmart** - 209 rows
- Walmart-specific competitive insights

**summary** - 60 rows
- Test summary statistics
- Share of buy, share of click
- Value scores and winners

#### 6. Demographics & Targeting (2 tables)

**custom_screening** - 12 rows
- Custom screening questions
- Valid/invalid option tracking

**shopper_demographic** - 1,000 rows (capped)
- Shopper demographic profiles
- Age, sex, ethnicity, nationality
- Employment and student status
- Language preferences
- Prolific ID linking

#### 7. Credits & Billing (3 tables)

**company_credits** - 8 rows
- Company credit balances
- Total credits available

**credit_usage** - 5 rows
- Credits consumed per test
- Usage tracking

**credit_payments** - 48 rows
- **REVENUE TABLE**
- Stripe payment intent IDs
- Total: $289,961.09 (28,996,109 cents)
- Status tracking: pending, succeeded
- Credits applied timestamp

#### 8. System (2 tables)

**events** - 1,000 rows (capped)
- System event tracking
- Type, metadata (JSONB), path
- Audit trail

**wrappers_fdw_stats** - 0 rows
- Foreign Data Wrapper statistics
- Supabase Wrappers integration point

---

## Revenue Intelligence

### Payment Breakdown

**Total Revenue:** $289,961.09  
**Total Payments:** 48  
**Average Payment:** $6,040.86

### Top Companies by Activity

Based on test count and payment history:
1. **Test INC** - 20 tests (60% of all tests)
2. **Colgate** - Multiple tests
3. **Acme Inc** - Expert mode enabled
4. **Various CPG brands** - 37 additional companies

### Test Completion Rate

- Complete: 25 tests (73.5%)
- Active: 6 tests (17.6%)
- Draft: 2 tests (5.9%)
- Incomplete: 1 test (2.9%)

**Insight:** 91% of tests either complete or actively running shows strong platform engagement.

### Business Model Validation

**Pricing:** $49/shopper × 50 minimum = $2,450 per test leg  
**With 3 variants:** $7,350 per full test  
**Current revenue:** $289K / $7.35K = ~39 test equivalents

This validates the credit-based SaaS model for shopper testing platforms.

---

## Tech Stack & Architecture

### Frontend Stack
- **Framework:** Next.js (React)
- **Build:** Vite
- **Language:** TypeScript
- **Deployment:** Vercel

### Backend Stack
- **Framework:** NestJS
- **Runtime:** Node.js
- **Language:** TypeScript
- **APIs:** RESTful + GraphQL (via Supabase)

### Database & Storage
- **Database:** Supabase (PostgreSQL 16+)
- **Features Used:**
  - Row Level Security (RLS)
  - Realtime subscriptions
  - Foreign Data Wrappers (FDWs)
  - REST API auto-generation
  - Edge Functions
- **Extensions:** uuid-ossp, pgcrypto
- **Storage:** Supabase Storage for images

### Third-Party Integrations
- **Payments:** Stripe
- **Shopper Recruitment:** Prolific
- **Product Data:** Amazon API, Walmart API
- **AI Processing:** (Unknown - likely OpenAI or custom)

### Infrastructure
- **Hosting:** Vercel (frontend), GCP (backend services)
- **CDN:** Vercel Edge Network
- **Database:** Supabase global infrastructure
- **Monitoring:** (Unknown - likely Sentry, LogRocket, or similar)

---

## Integration with Robbieverse

### Current State: Read-Only Replication

**Purpose:**
- Analytics and insights without impacting production
- Local AI processing on 2x RTX 4090 GPUs
- Development reference for HeyShopper
- Disaster recovery backup

**Sync Configuration:**
```typescript
// 30-second sync interval
// Read-only mode (no writes to Supabase)
// Full schema replication
// 11,136 rows synchronized
```

**Sync Service Location:**
- Schema: `database/unified-schema/22-testpilot-production.sql`
- Data Exports: `scripts/exports/*.json`
- Sync Service: `packages/@robbieverse/api/src/services/supabase-sync.ts`

### Data Flow Architecture

```
┌─────────────────────────────────────┐
│   SUPABASE (Production Master)       │
│   app.testpilotcpg.com              │
│   • 33 tables                        │
│   • $289K revenue                    │
│   • ZERO writes from Robbieverse     │
└──────────────┬──────────────────────┘
               │
               │ 📥 READ-ONLY SYNC
               │ (Every 30 seconds)
               ↓
┌─────────────────────────────────────┐
│   ROBBIEVERSE NETWORK                │
│   • RobbieBook1 (MacBook)            │
│   • Aurora Town (Elestio)            │
│   • GPU Nodes (RunPod RTX 4090s)     │
│                                      │
│   Uses:                              │
│   • Analytics on local GPUs          │
│   • HeyShopper development           │
│   • Revenue intelligence             │
│   • AI insights generation           │
└─────────────────────────────────────┘
```

### Future Integration Opportunities

1. **Robbie AI Integration**
   - Analyze test results with Robbie's personality
   - Generate natural language insights
   - Proactive test recommendations

2. **Revenue Dashboard**
   - Real-time TestPilot revenue in Robbie@Work
   - Deal flow tracking
   - Company engagement metrics

3. **HeyShopper Blueprint**
   - Use TestPilot schema as foundation
   - Replace Prolific with own shopper panel
   - Keep 100% of margins ($49/shopper vs $30/shopper)

4. **Cross-Platform Intelligence**
   - TestPilot data informs HeyShopper features
   - Shared AI insights engine
   - Unified analytics across both platforms

---

## Sidetool GitHub Organization

**Organization:** github.com/sidetoolco  
**Access Granted:** October 9, 2025  
**Total Repositories:** 76

### Known Information

**Tech Stack (from org profile):**
- TypeScript, JavaScript, Python
- React, Next.js, Vite
- Node.js, NestJS
- Supabase, PostgreSQL
- HTML, Astro

**Documentation References:**
- `/docs` - Technical documentation & guides
- `/hives` - Core components and building blocks

### Repositories to Investigate

**Priority 1: Find TestPilot CPG Code**
- Search for: `testpilot`, `cpg`, `shopper`, `testing`
- Look for: Frontend app, backend API, shared libraries

**Priority 2: Shared Components**
- `/hives` repositories
- Authentication libraries
- Payment integration code
- Product catalog integrations

**Priority 3: Deployment & Infrastructure**
- Vercel configurations
- GCP setup
- CI/CD pipelines
- Environment management

### Clone Strategy

**If TestPilot repositories found:**
```bash
# Clone to archive for reference
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse/archive
mkdir testpilot-production-code
cd testpilot-production-code

# Clone relevant repos
git clone https://github.com/sidetoolco/[testpilot-frontend]
git clone https://github.com/sidetoolco/[testpilot-backend]
git clone https://github.com/sidetoolco/[shared-components]

# Document
echo "Cloned: $(date)" > README.md
git log --oneline -20 >> README.md
```

**Repository Documentation Needed:**
- Last commit dates
- Active contributors
- Deployment process
- Environment variables
- API keys and secrets management

---

## Key Findings & Insights

### 1. Proven Business Model

TestPilot CPG demonstrates that shopper testing platforms are viable:
- $289K revenue validates market demand
- 40 companies = strong B2B traction
- 73.5% test completion rate = product-market fit
- Credit-based pricing = predictable revenue

### 2. AI as Competitive Advantage

The **Automated Clarity Engine (ACE)** is the differentiator:
- 25 AI insights generated automatically
- Multi-dimensional analysis (purchase drivers, competitive insights)
- Natural language recommendations
- This is what customers pay for - not just data collection

### 3. Integration Strategy Validated

Prolific + Amazon/Walmart integration proves:
- Third-party shopper panels work
- Product catalogs can be automated
- Real-time eCommerce simulation is feasible

### 4. HeyShopper Opportunity

TestPilot CPG is the **perfect blueprint** for HeyShopper:
- Copy the schema exactly
- Replace Prolific with own shopper panel (keep 100% margins)
- Use same AI insights engine (leverage Robbie's intelligence)
- Target $500K+ revenue in year 1

### 5. Technical Architecture Lessons

**What Works:**
- Supabase for rapid development
- NestJS for scalable backend
- Next.js for modern frontend
- Stripe for payments
- JSONB for flexible data

**What to Improve:**
- Add vector embeddings for semantic search
- Real-time collaboration features
- Mobile app for shoppers
- Advanced analytics dashboard

---

## Data Export Inventory

All production data exported to `scripts/exports/`:

### Complete File List (35 files)

1. `export_summary.json` - Overview of all exports
2. `companies.json` - 40 company records
3. `profiles.json` - 39 user profiles
4. `invites.json` - 7 pending invites
5. `tests.json` - 34 test configurations
6. `test_variations.json` - 69 product variations
7. `test_demographics.json` - 34 demographic targets
8. `test_survey_questions.json` - 15 survey configs
9. `test_competitors.json` - 371 competitor assignments
10. `testers_session.json` - 1,000 shopper sessions
11. `test_times.json` - 1,000 time tracking records
12. `products.json` - 68 client products
13. `competitor_products.json` - 1,000 competitor products
14. `amazon_products.json` - 1,000 Amazon products
15. `walmart_products.json` - 760 Walmart products
16. `responses_surveys.json` - 206 survey responses
17. `responses_comparisons.json` - 1,000 comparison responses
18. `responses_comparisons_walmart.json` - 92 Walmart comparisons
19. `feedback.json` - 1,000 feedback records
20. `ia_insights.json` - 25 AI insights (THE GOLD)
21. `ia_insights_backup.json` - 13 backup insights
22. `ia_insights_backup_20241226.json` - 26 dated backup
23. `insight_status.json` - 487 status records
24. `purchase_drivers.json` - 57 driver analyses
25. `competitive_insights.json` - 451 competitive analyses
26. `competitive_insights_analysis.json` - 0 records (empty)
27. `competitive_insights_walmart.json` - 209 Walmart insights
28. `summary.json` - 60 test summaries
29. `custom_screening.json` - 12 screening rules
30. `shopper_demographic.json` - 1,000 shopper profiles
31. `company_credits.json` - 8 credit balances
32. `credit_usage.json` - 5 usage records
33. `credit_payments.json` - 48 payment records ($289K)
34. `events.json` - 1,000 system events
35. `wrappers_fdw_stats.json` - 0 records (empty)
36. `rpc_functions.json` - RPC function definitions

**Total Exported:** 11,136 rows  
**Export Date:** October 9, 2025, 3:20 PM UTC

---

## Next Steps & Recommendations

### Immediate Actions

1. **Explore Sidetool GitHub** ✅ GRANTED ACCESS
   - Browse 76 repositories
   - Find TestPilot CPG code
   - Document repository structure

2. **Clone Key Repositories**
   - TestPilot frontend (if accessible)
   - TestPilot backend (if accessible)
   - Shared component libraries
   - Store in `archive/testpilot-production-code/`

3. **Document Deployment**
   - Vercel configuration
   - Environment variables needed
   - Supabase setup process
   - Third-party API keys

### Strategic Planning

1. **HeyShopper Development**
   - Use TestPilot schema as foundation
   - Build own shopper panel
   - Integrate Robbie AI for insights
   - Target $500K revenue year 1

2. **TestPilot CPG Growth**
   - Current: $289K revenue
   - Add Robbie AI layer for insights
   - Improve retention with AI
   - Expand to more CPG categories

3. **Cross-Platform Intelligence**
   - Unified analytics dashboard
   - Shared AI insights engine
   - Cross-platform user accounts
   - Combined revenue reporting

### Technical Debt & Improvements

1. **Add Vector Embeddings**
   - Semantic search for products
   - AI-powered product recommendations
   - Similar test discovery

2. **Real-time Features**
   - Live test monitoring
   - Shopper activity streaming
   - Instant insight generation

3. **Mobile Applications**
   - Shopper mobile app (React Native)
   - Brand manager dashboard (iOS/Android)
   - Push notifications for insights

4. **Advanced Analytics**
   - Cohort analysis
   - Retention metrics
   - LTV calculations
   - Predictive modeling

---

## Security & Compliance Notes

### Data Access

**Current Access:**
- ✅ Read-only access to Supabase (service_role key)
- ✅ Local replica with no write-back
- ✅ Zero risk to production
- ✅ Safe for development and analytics

**Production Access:**
- ❌ No write access to Supabase production
- ❌ No access to Stripe dashboard
- ❌ No access to Prolific account
- ❌ No access to admin users

### Credentials Management

**What We Have:**
- Supabase project ID: `hykelmayopljuguuuueme`
- Supabase URL: `https://hykelmayopljuguuuueme.supabase.co`
- Service role key (read-only)

**What We Need (for full control):**
- Supabase admin password
- Stripe account access
- Prolific API credentials
- Vercel deployment access
- GCP project access

### Compliance Considerations

**Data Privacy:**
- Shopper PII in demographics table
- Email addresses in profiles table
- Payment data (Stripe IDs only, not card numbers)
- Test responses (potentially sensitive)

**Required Actions:**
- Review data retention policies
- Implement PII redaction
- GDPR compliance audit
- CCPA compliance audit

---

## Conclusion

TestPilot CPG at app.testpilotcpg.com is a **proven, revenue-generating shopper testing platform** with:

- **$289,961.09 in revenue** validates business model
- **40 companies** using the platform demonstrates market demand
- **25 AI insights generated** shows technical sophistication
- **73.5% test completion rate** indicates product-market fit

This platform serves as the **perfect blueprint** for HeyShopper development and demonstrates that the shopper testing market is viable and profitable.

The read-only replication to Robbieverse enables:
- Safe analytics and insights
- Local AI processing on GPU nodes
- Development reference without production risk
- Revenue intelligence and tracking

**Next Move:** Explore Sidetool's GitHub repositories to understand the codebase architecture and potentially clone key components for reference.

---

**Document Status:** ✅ Complete  
**Last Updated:** October 9, 2025  
**Maintained By:** Robbie (Allan's AI Copilot)  
**Purpose:** Complete inventory of TestPilot CPG production application for future reference and HeyShopper development

