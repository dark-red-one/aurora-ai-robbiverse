# HeyShopper: Real Shoppers + Robbie Intelligence

**Updated:** October 9, 2025  
**Status:** Ready for Implementation

---

## Executive Summary

Transform TestPilot CPG ($20K revenue, 40 beta customers, $88K closing) into **HeyShopper** - the only shopper testing platform that combines **real human shoppers** with **personalized AI intelligence** that learns each customer's brand.

### The Core Differentiator: Real vs Synthetic

**BASES AI Screener** (April 2025): Synthetic respondents (AI predictions) in 10 minutes for $500-$2K  
**HeyShopper**: Real shoppers in 72 hours for $5K-$15K

**When $2M is on the line, which do you trust?**

---

## Current State (Reality Check)

### Revenue

- **Actual closed:** $20,250 (Fluenti $8,250 + Wave 2 $12,000)
- **Closing now:** $88K pipeline (Simply Good Foods $12,740 at 90%, Lasko $15K at 70%, Perrigo $30K at 70%, Bayer $30K at 70%)
- **Total imminent:** ~$108K

### Validation

- 40 beta customers proved product-market fit
- Simply Good Foods converted beta → paid (proof of model)
- 5 enterprise deals in late-stage closing
- F500 access through network (the actual moat)

### **THE GOLDMINE: You're Sitting on Rich Feedback Data** 💰

**Product Feedback (What Shoppers Think About Products):**

- **206 survey responses** with ratings + qualitative text (`likes_most`, `improve_suggestions`)
- **1,000+ comparison responses** with `choose_reason` (WHY they picked one product over another)
- **92 Walmart comparisons** (multi-retailer competitive data)

**Platform Experience Feedback (What Shoppers Think About TestPilot):**

- **1,000 tester experience feedback entries** (rating 1-5 + comments)
- Real voices: *"I would love the experience to be better"*, *"What can be made better is the study"*
- Continuous product improvement data from actual users

**AI Insights Already Being Generated:**

- **25 AI insights** with `comparison_between_variants`, `purchase_drivers`, `competitive_insights`
- **57 purchase driver analyses** (quantified what makes people buy)
- **451 competitive insights** (how products stack up vs competitors)
- **Comment summaries** already being created from qualitative feedback

**This is MASSIVE competitive advantage - BASES synthetic can't generate real quotes!**

### Critical Issues

- **Rich data not being leveraged** - 1,000+ feedback entries sitting unused, no vector search
- **Tester experience pain points captured but not fixed** - Low ratings show UX needs work
- Using Prolific (40% margins vs 100% with own panel)
- Manual report review (Allan + Dr. Dave doesn't scale past $500K)
- No contextual help system (high support burden)
- Security concerns (GitGuardian alerts, no RLS) blocking enterprise

---

## The Market Split: Real vs Synthetic

### Synthetic AI Testing ($500-$2K)

- **Provider:** BASES AI Screener
- **Speed:** 10 minutes
- **Use case:** Concept screening, directional feedback, low-risk decisions
- **When it fails:** Can't predict real human irrationality, edge cases, emotional responses

### Real Shopper Testing ($5K-$15K) ← **THIS IS US**

- **Provider:** TestPilot/HeyShopper
- **Speed:** 72 hours (human recruitment takes time)
- **Use case:** Launch validation, pricing optimization, packaging finals, claims testing
- **Why it wins:** Real human behavior, real purchase intent, real switching decisions

### Traditional Research ($15K-$50K)

- **Provider:** BASES Traditional, Zappi Enterprise
- **Speed:** 2-4 weeks
- **Use case:** Comprehensive innovation pipelines, ongoing tracking

### Our Positioning

**Don't compete on speed** (lose to BASES 10 minutes).  
**Compete on confidence:**

> "BASES gives you AI guesses in 10 minutes.  
> HeyShopper gives you real shoppers + AI that learns YOUR brand in 72 hours.  
> When $500K is on the line, which gives you confidence?"

---

## The HeyShopper Difference

### What Competitors Offer

- **BASES synthetic:** Same AI predictions for everyone
- **Zappi/traditional:** Same insights, no personalization
- **Everyone:** Generic support, no intelligence layer

### What HeyShopper Offers

**Real Shoppers + Personalized AI:**

1. **Every test Robbie sees** → learns your brand, products, customers
2. **Next test is smarter** → "Based on your Cholula results, try this..."
3. **Switching cost grows** → Competitor tools don't know your brand
4. **Customer locked in** → More tests = smarter Robbie = higher value

**The Lock-In Loop:**

```
Customer runs Test 1 → Robbie learns brand preferences
Customer runs Test 2 → Robbie suggests based on Test 1 patterns
Customer runs Test 3 → Robbie predicts outcomes from Test 1+2 data
Competitor tools → Start from zero, no brand memory
```

---

## The Feedback Intelligence Strategy

### **Two Types of Feedback = Two Growth Engines**

#### 1. Product Feedback → Customer Lock-In

**What you have:**

- 1,298 shopper responses with qualitative text across products
- Real quotes: *"Love the price point but wish it looked more premium"*
- `choose_reason` data explaining WHY shoppers picked Product A over B

**How Robbie uses it:**

```typescript
// Customer runs Variant B hot sauce test
// Robbie searches past Product A feedback for similar patterns

const similarFeedback = await vectorSearch(`
  SELECT likes_most, improve_suggestions, product_id
  FROM responses_surveys
  WHERE company_id = $customerId
  ORDER BY embedding <=> $testEmbedding
  LIMIT 20
`);

// Robbie: "Based on your Cholula test, shoppers valued bold packaging 
// over price. Here's what they said:
// - 'Eye-catching label made me pick it up'
// - 'Premium look justified higher price'
// Expect same pattern with this jalapeño sauce."
```

**Result:** Every new test gets smarter based on past tests → switching cost grows exponentially

#### 2. Platform Experience Feedback → Product Improvement

**What you have:**

- 1,000 tester feedback entries about the TestPilot experience itself
- Ratings distribution to identify pain points
- Comments like *"I would love the experience to be better"*, *"What can be made better is the study"*

**How to use it:**

**Phase 0 (Immediate):**

1. **Analyze low ratings** (1-2 stars): What specific issues do testers cite?
2. **Fix top 3 pain points** before Walmart launch (Oct 21)
3. **Track improvement** in post-Walmart feedback scores

**Phase 1 (Weeks 3-8):**
4. **Vector search feedback** by topic: "What do testers say about 'setup'?"
5. **Robbie monitors live** feedback and flags issues: "3 testers just complained about slow loading"
6. **Auto-suggest fixes** based on patterns: "67% mention navigation confusion - add tutorial"

**Phase 2 (Months 3-4):**
7. **Predictive quality scoring**: Robbie detects when test quality is dropping mid-flight
8. **A/B test improvements**: Try different UX flows, measure feedback impact
9. **Close the loop**: Show testers "We fixed X based on your feedback"

### **The Competitive Advantage This Creates**

**BASES Synthetic:**

- AI predicts: "Shoppers will rate packaging 3.8/5"
- No real quotes
- No continuous improvement data

**HeyShopper:**

- 50 real shoppers rate packaging 3.8/5 AND tell you why:
  - *"Looks cheap"*, *"Font hard to read"*, *"Color doesn't pop"*
- Robbie finds past tests where fixing these issues → 23% sales lift
- Platform improves continuously based on 1,000 tester feedback entries

**You're not just collecting data - you're building an intelligence engine that gets smarter every day.**

---

## Phase 0: Close $88K + Ship Walmart (Next 12 Days)

### Critical Path (Oct 9-21)

**Week 1 (Oct 9-15):**

1. **Analyze tester experience feedback** (4 hours) → Fix pain points before Walmart
   - Query all 1-2 star ratings from `feedback` table
   - Identify top 3 most-mentioned issues
   - Create fix list for Andre (quick wins before Oct 21)
2. **Security fixes** (2-3 days) → Unblock enterprise pipeline
   - Row Level Security on all tables
   - Rotate exposed Supabase credentials
   - GitGuardian alerts remediation
3. **Multi-retailer pricing UI** (3-4 days) → Capture Walmart revenue
   - Amazon-only: $5,000
   - Walmart-only: $5,000
   - Amazon + Walmart bundle: $8,000 (60% discount for 2x data)
4. **Real vs Synthetic messaging** (1 day) → Update all sales materials
   - "Real Shoppers. Real Insights. Real Confidence."
   - "Real quotes, not AI predictions" (show actual feedback examples)
   - BASES comparison: They can't generate qualitative feedback
   - Enterprise ROI calculator

**Week 2 (Oct 16-21):**
4. **Close Simply Good Foods** ($12,740) → First paid customer proof
5. **Walmart soft launch** (Oct 21) → Press release, beta customers only
6. **Convert 2-3 from $88K pipeline** → Hit $50K+ by month-end

### Success Metrics

- $50K+ actual closed revenue by Oct 31
- Walmart tested by 5 beta customers
- Security audit passed
- 0 enterprise deals blocked on security

---

## Phase 1: Robbie Intelligence MVP (Weeks 3-8)

### The Minimum Viable Robbie

**Goal:** Make switching to competitors painful by building brand memory.

### Feature 1: AskRobbie Widget (Week 3-4)

**What It Does:**

- Floating chat bubble (60px collapsed, 400px × 600px expanded)
- Context-aware help based on current page
- Mood-driven personality (friendly, focused, playful, bossy)
- Notification badges for proactive suggestions

**Why It Matters:**

- Reduces support tickets 50% (self-service help)
- Increases engagement 60%+ (always-available guidance)
- Differentiates from competitors (no one has contextual AI)

**Implementation:**

```typescript
// Priority 1: Basic widget
- Collapsed state with Robbie avatar
- Expanded chat interface
- Context detection (page-based help)
- OpenAI API integration for responses

// Priority 2: Intelligence
- Remember past conversations
- Suggest based on user's test history
- Proactive notifications when relevant
```

### Feature 2: Vector Insights Engine (Week 5-6)

**What It Does:**

- Generate embeddings for every test, product, response
- Semantic search across customer's past tests
- Pattern detection ("Variant B always wins for premium brands")
- Competitive intelligence ("Similar tests showed 23% click lift")

**Why It Matters:**

- Robbie gets smarter with every test → customer lock-in
- Insights competitors can't replicate (trained on YOUR data)
- Predictive recommendations increase test ROI

**Implementation:**

```sql
-- Add vector capabilities
ALTER TABLE tests ADD COLUMN embedding VECTOR(1536);
ALTER TABLE products ADD COLUMN embedding VECTOR(1536);
ALTER TABLE responses_surveys ADD COLUMN sentiment_embedding VECTOR(1536);

-- Create insights memory
CREATE TABLE robbie_insights_memory (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES companies(id),
  test_id UUID REFERENCES tests(id),
  insight_type VARCHAR(50), -- pattern, prediction, recommendation
  content TEXT,
  embedding VECTOR(1536),
  confidence FLOAT,
  evidence_count INTEGER,
  created_at TIMESTAMPTZ
);

-- Semantic search
CREATE INDEX idx_tests_embedding ON tests USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_insights_embedding ON robbie_insights_memory USING ivfflat (embedding vector_cosine_ops);
```

### Feature 3: Personality-Driven UX (Week 7-8)

**What It Does:**

- Robbie adapts tone to user preferences
- 6 moods: friendly, focused, playful, bossy, surprised, blushing
- Gandhi-Genghis spectrum (1-10): gentle → aggressive
- Messages feel human, not robotic

**Why It Matters:**

- Emotional connection → brand loyalty
- Competitors feel cold and generic
- Users enjoy using the platform (NPS boost)

**Implementation:**

```typescript
// Mood-based messaging
const robbiePersonality = {
  friendly: {
    testComplete: "Woohoo! Your test results are in! 🎉",
    suggestion: "Hey! I noticed Variant B is performing well. Want me to explain why?"
  },
  focused: {
    testComplete: "Test complete. Here's your data.",
    suggestion: "Variant B outperforming. Analysis available."
  },
  playful: {
    testComplete: "OMG your results are FIRE! 🔥 Check this out!",
    suggestion: "Ooh! Variant B is crushing it! Let me show you the magic! ✨"
  },
  bossy: {
    testComplete: "Results are in. Act on them. Immediately.",
    suggestion: "Variant B is winning. Run follow-up test NOW."
  }
}
```

### Success Metrics

- AskRobbie widget: 60%+ engagement
- Vector insights: 80%+ find patterns they missed
- Personality system: 4.5+ star satisfaction
- Beta → paid conversion: 50%+ (20 betas → 10 paid customers)

---

## Phase 2: Remove Scale Blockers (Months 3-4)

### Problem: Manual Processes Don't Scale

**Current bottlenecks:**

1. Allan + Dr. Dave review every report (4 hours per test)
2. Customers need hand-holding during setup
3. Support tickets high (no self-service)
4. Own panel doesn't exist (40% margin hit with Prolific)

### Feature 4: Automated Report QA (Week 9-10)

**What It Does:**

- AI pre-checks statistical significance
- Automated outlier detection
- Flag suspicious responses for human review
- 90% of reports auto-approved, 10% flagged

**Why It Matters:**

- Scale from $500K → $2M without hiring report reviewers
- Allan + Dr. Dave focus on flagged reports only
- Faster turnaround time (48 hours → 24 hours)

### Feature 5: Test Setup Wizard (Week 11-12)

**What It Does:**

- Guided step-by-step test creation
- Smart defaults based on category
- Template library (CPG brands, cosmetics, etc.)
- AI suggests demographics based on product

**Why It Matters:**

- Reduce setup time: 30 min → <10 min
- Reduce support tickets: -50%
- Enable self-serve at scale

### Feature 6: Video Upload (Week 13)

**What It Does:**

- Upload video ads/content for shopper feedback
- Requested by 18 Chestnuts, First Quality, others
- Instant new revenue stream

**Why It Matters:**

- Closes waiting deals immediately
- Differentiates from competitors
- Minimal dev effort (4-6 days max)

### Feature 7: Customer Dashboard (Week 14-16)

**What It Does:**

- View all past tests in one place
- Track credit usage and spend
- Download all reports as PDFs
- Invite team members

**Why It Matters:**

- Enterprise buyers need visibility
- Enables beta → paid conversions
- Reduces "Where's my test?" support tickets

### Success Metrics

- Report review time: 4 hours → 30 min per test
- Test setup time: 30 min → <10 min
- Support tickets: -50%
- Revenue capacity: $500K → $2M with same team

---

## Phase 3: Enterprise Features (Months 5-6)

### Problem: $30K Enterprise Deals Need Different Features

**Enterprise blockers:**

1. No team collaboration (1 user per account)
2. Limited screening (1 custom question max)
3. No white-label or co-branding
4. Security concerns (RLS, compliance)

### Feature 8: Team Collaboration

- Multi-user accounts (10 seats enterprise plan)
- Role-based permissions (admin, analyst, viewer)
- Comment threads on reports
- Shared test history

### Feature 9: Enhanced Screening

- Custom demographic targeting
- Psychographic variables
- Competitor product usage screening
- 5+ custom screening questions

### Feature 10: White-Label Reports

- Customer branding on PDFs
- Co-branded reports for agencies
- Custom report templates
- API access for integration

### Feature 11: Security & Compliance

- SOC 2 compliance roadmap
- GDPR/CCPA data handling
- SSO integration (SAML)
- Penetration testing

### Success Metrics

- $30K+ deal close rate: 0% → 30%+
- Enterprise pipeline: $300K+
- Average deal size: $5K → $15K
- Enterprise NPS: 50+

---

## Technical Implementation Details

### Database Schema Updates

```sql
-- Phase 1: Vector intelligence
ALTER TABLE tests ADD COLUMN embedding VECTOR(1536);
ALTER TABLE products ADD COLUMN embedding VECTOR(1536);
ALTER TABLE responses_surveys ADD COLUMN sentiment_embedding VECTOR(1536);

CREATE TABLE robbie_insights_memory (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES companies(id),
  test_id UUID REFERENCES tests(id),
  insight_type VARCHAR(50),
  content TEXT,
  embedding VECTOR(1536),
  confidence FLOAT,
  evidence_count INTEGER,
  created_at TIMESTAMPTZ
);

-- Phase 1: Personality system
CREATE TABLE robbie_personality_state (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  mood VARCHAR(20) CHECK (mood IN ('friendly', 'focused', 'playful', 'bossy', 'surprised', 'blushing')),
  genghis_level INTEGER CHECK (genghis_level BETWEEN 1 AND 10),
  attraction_level INTEGER CHECK (attraction_level BETWEEN 1 AND 11),
  last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Phase 2: Customer usage tracking
CREATE TABLE customer_usage_analytics (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES companies(id),
  tests_completed INTEGER DEFAULT 0,
  avg_setup_time_minutes INTEGER,
  support_tickets_count INTEGER DEFAULT 0,
  last_test_date TIMESTAMPTZ,
  churn_risk_score FLOAT,
  upsell_opportunity_score FLOAT
);

-- Phase 3: Team collaboration
CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(20) CHECK (role IN ('admin', 'analyst', 'viewer')),
  invited_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ
);
```

### RobbieBlocks Structure

```
heyshopper/
├── src/
│   ├── blocks/
│   │   ├── communication/
│   │   │   ├── AskRobbieWidget.tsx          # Phase 1, Week 3-4
│   │   │   ├── ChatInterface.tsx
│   │   │   └── ContextualHelp.tsx
│   │   ├── insights/
│   │   │   ├── VectorInsightsPanel.tsx      # Phase 1, Week 5-6
│   │   │   ├── PatternDetection.tsx
│   │   │   └── PredictiveRecommendations.tsx
│   │   ├── personality/
│   │   │   ├── MoodSelector.tsx             # Phase 1, Week 7-8
│   │   │   ├── PersonalityIndicator.tsx
│   │   │   └── ExpressionAvatar.tsx
│   │   ├── automation/
│   │   │   ├── ReportQA.tsx                 # Phase 2, Week 9-10
│   │   │   ├── TestWizard.tsx               # Phase 2, Week 11-12
│   │   │   └── VideoUpload.tsx              # Phase 2, Week 13
│   │   └── enterprise/
│   │       ├── TeamCollaboration.tsx        # Phase 3, Month 5
│   │       ├── EnhancedScreening.tsx        # Phase 3, Month 5
│   │       └── WhiteLabelReports.tsx        # Phase 3, Month 6
│   ├── services/
│   │   ├── robbieAI.ts                      # OpenAI integration
│   │   ├── vectorSearch.ts                  # Semantic search
│   │   ├── personality.ts                   # Mood management
│   │   └── analytics.ts                     # Usage tracking
│   └── hooks/
│       ├── useRobbiePersonality.ts
│       ├── useVectorInsights.ts
│       └── useContextualHelp.ts
```

---

## Success Metrics & Goals

### Phase 0 (Oct 9-21): Close $88K + Ship Walmart

- ✅ $50K+ closed revenue by Oct 31
- ✅ Walmart tested by 5 beta customers
- ✅ Security audit passed
- ✅ Simply Good Foods converted

### Phase 1 (Weeks 3-8): Robbie Intelligence MVP

- ✅ AskRobbie engagement: 60%+ users interact
- ✅ Vector insights: 80%+ find useful patterns
- ✅ Personality satisfaction: 4.5+ stars
- ✅ Beta → paid conversion: 50% (20 → 10 customers)

### Phase 2 (Months 3-4): Remove Scale Blockers

- ✅ Report review time: 4 hours → 30 min
- ✅ Test setup time: 30 min → <10 min
- ✅ Support tickets: -50%
- ✅ Revenue capacity: $500K → $2M

### Phase 3 (Months 5-6): Enterprise Features

- ✅ $30K+ deal close rate: 30%+
- ✅ Enterprise pipeline: $300K+
- ✅ Average deal size: $15K+

### Year 1 Financial Goals

- **Q4 2024:** $108K (current + closing pipeline)
- **Q1 2025:** $250K (beta conversions)
- **Q2 2025:** $375K (enterprise deals start closing)
- **Q3-Q4 2025:** $500K annual run rate

---

## The Real vs Synthetic Sales Pitch

### Old Positioning (WRONG)

❌ "TestPilot: Fast results in 72 hours"  
❌ "Affordable versus traditional research"

### New Positioning (RIGHT)

✅ **"Real Shoppers. Real Insights. Real Confidence."**  
✅ **"AI can guess. Shoppers know."**  
✅ **"When $2M is on the line, which do you trust?"**

### Enterprise Sales Framework

```
Your SKU launch: $2M investment
BASES AI Screener: $2,000 (synthetic shoppers)
HeyShopper: $15,000 (300 real shoppers in target demo)

Cost of wrong decision: $500K-$2M (launch failure, inventory write-off)
Premium for real data: $13,000
Risk reduction: Priceless

Which gives you confidence to bet $2M?
```

### The HeyShopper Advantage

**BASES gives everyone the same AI predictions.**

**HeyShopper gives each customer a personalized AI trained on:**

- Their products
- Their shoppers
- Their past tests
- Their brand preferences

**The more they use it, the smarter it gets FOR THEM.**

That's the moat. That's why they can't leave.

---

## Next Steps

### Immediate (This Week)

1. ✅ Review and approve this plan
2. ✅ Prioritize Phase 0 security fixes
3. ✅ Update all sales materials with Real vs Synthetic positioning
4. ✅ Close Simply Good Foods ($12,740)

### Week 2 (Oct 16-21)

5. ✅ Walmart soft launch (press release, beta only)
6. ✅ Convert 2-3 from $88K pipeline
7. ✅ Start AskRobbie widget development (separate repo)

### Weeks 3-8

8. ✅ Build Robbie Intelligence MVP
9. ✅ Convert 10 beta customers to paid
10. ✅ Prove customer lock-in with brand memory

**Timeline:** 6 months to $500K run rate  
**Investment:** Development costs offset by beta conversions and margin improvements

---

**This isn't about fixing broken TestPilot. This is about adding intelligence that makes customers never want to leave.** 🚀

*Real shoppers + Robbie AI = Unstoppable competitive advantage.*
