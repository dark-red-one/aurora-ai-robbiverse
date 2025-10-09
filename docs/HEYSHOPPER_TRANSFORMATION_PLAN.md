# HeyShopper: AI-Powered Shopper Testing Platform

**Transforming TestPilot CPG into a Next-Gen Platform**

---

## 📊 Current State (TestPilot CPG)

**What We Have:**

- Live production app: app.testpilotcpg.com
- **$18K actual revenue** + **$80K closing now** = $98K imminent
- **40 beta customers** proving product-market fit (Simply Good Foods first paid customer)
- **5 enterprise deals** in late-stage closing
- Modern React stack: React 18, TypeScript, Vite, Supabase
- Stripe payments, OpenAI integration, Chart.js/D3 visualizations

**The Opportunity:**

- **Real shoppers vs synthetic AI** (BASES AI Screener uses fake shoppers)
- Beta program validated product - now ready to scale revenue
- F500 access through network (the actual moat)
- Using Prolific for shopper recruitment (60% margin hit - own panel = 100%)
- Basic AI insights exist - Robbie layer makes them conversational
- No contextual help system - AskRobbie widget fills this gap

---

## 🚀 The Vision: HeyShopper

Transform TestPilot into **HeyShopper** - powered by our proprietary **Robbie AI** system.

**Core Differentiator: Real Shoppers vs Synthetic AI**

BASES AI Screener (April 2025) delivers **synthetic shoppers** (AI predictions) in 10 minutes. TestPilot delivers **real human behavior** in 72 hours. When your CMO's job is on the line with a $2M SKU launch, do you trust AI guesses or 300 real shoppers?

**HeyShopper adds Robbie intelligence to proven real-shopper platform:**

### 1. **AskRobbie Widget** (Contextual AI Assistant)

- Floating chat bubble on every page
- **60px × 60px collapsed**, expands to 400px × 600px
- Context-aware help based on current page:
  - Creating test? "I can suggest optimal demographics!"
  - Viewing results? "Variant B is winning - want to know why?"
  - Comparing products? "Let me find semantic similarities!"
- **Personality-driven** interactions (friendly, focused, playful, bossy modes)
- **Mood indicator** color ring around avatar
- Proactive suggestions with notification badges

### 2. **Robbie Personality System**

Our secret sauce - AI with personality:

- **6 mood states**: friendly, focused, playful, bossy, surprised, blushing
- **Gandhi-Genghis spectrum** (1-10): gentle suggestions → aggressive optimization
- **Attraction levels** (1-11): personalized interaction intensity
- **Contextual switching**: adapts to user, situation, and urgency

**Example Interactions:**

```
Friendly: "Woohoo! Your test results are in! 🎉"
Focused: "Test complete. Here's your data."
Playful: "OMG your results are FIRE! 🔥"
Bossy: "Results are in. Act on them. Immediately."
```

### 3. **RobbieBlocks Architecture**

20+ modular, composable UI components:

**New Retail Blocks:**

1. `<ProductComparisonGrid />` - AI-powered product comparisons
2. `<ShopperPanelManager />` - Own shopper panel (100% margins!)
3. `<TestWizard />` - Guided test creation with AI
4. `<InsightsNarrative />` - Natural language insights (not just charts)
5. `<AmazonScraper />` - Real-time product intelligence
6. `<WalmartIntegration />` - Walmart API + competitive intel
7. `<SemanticProductSearch />` - Vector-based "find similar products"
8. `<TestHealthMonitor />` - Real-time quality tracking
9. `<SmartPricing />` - Dynamic pricing optimization
10. `<RobbieReports />` - AI-generated PDF reports

### 4. **Vector Intelligence** (The Technical Magic)

- **1536-dimensional embeddings** (OpenAI standard)
- **Semantic search** across products, tests, responses
- **RAG system** for context-aware insights
- **Pattern detection** in shopper behavior
- **Predictive analytics** - forecast outcomes mid-test

**Technical Example:**

```sql
-- Find similar products using vector similarity
SELECT p.*, 
       1 - (p.embedding <=> query_embedding) as similarity
FROM products p
ORDER BY p.embedding <=> query_embedding
LIMIT 10;
```

### 5. **Own Shopper Panel**

Replace Prolific (3rd party) with our own:

- **Keep 100% margins** (vs 40% now)
- AI-powered shopper quality scoring
- Automated recruitment
- Fraud detection
- Better shopper experience = better data

---

## 💰 Business Impact

**Revenue Projections:**

- **Current:** $18K actual + $80K closing = $98K imminent
- **Q1 2026:** $250K (convert 50% of 40 beta customers to paid)
- **Year 1:** $500K (scale with real shopper positioning + Robbie intelligence)
- **Margin improvement:** Own panel = 100% margins vs 40% with Prolific

**Beta Conversion Strategy:**

- 40 beta customers validated product-market fit
- Simply Good Foods proved willingness to pay
- 5 enterprise deals closing demonstrate scalability
- HeyShopper features drive beta → paid conversions

**Efficiency Gains:**

- Test setup: Guided by AskRobbie widget (contextual help)
- Insight explanation: Natural language summaries (not just charts)
- Support tickets: -50% (AskRobbie handles common questions)
- Customer retention: Personality-driven UX creates stickiness

---

## 🏗️ Technical Architecture

### Frontend Stack (Proven)

- React 18 + TypeScript
- Vite for blazing fast builds
- Tailwind CSS + Framer Motion
- Zustand (state) + TanStack Query (data)

### Backend Stack (Enhanced)

- Supabase PostgreSQL + pgvector extension
- FastAPI (Python) for AI services
- OpenAI GPT-4 for insights
- Real-time subscriptions

### New Capabilities

```typescript
// AI Service Layer
export class RobbieAIService {
  async generateInsight(testData: Test): Promise<Insight> {
    const mood = await this.personality.getCurrentMood();
    const genghis = await this.personality.getGenghisLevel();
    
    // Generate embedding for semantic search
    const embedding = await this.createEmbedding(testData);
    
    // Find similar past tests
    const similarTests = await this.findSimilarTests(embedding);
    
    // Generate personalized insight
    return await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: this.getPersonalityPrompt(mood, genghis) },
        { role: 'user', content: this.buildPrompt(testData, similarTests) }
      ]
    });
  }
}
```

### Database Enhancements

```sql
-- Add vector capabilities
ALTER TABLE products ADD COLUMN embedding VECTOR(1536);
ALTER TABLE responses_surveys ADD COLUMN sentiment_embedding VECTOR(1536);

-- AI insights memory
CREATE TABLE robbie_insights_memory (
  id UUID PRIMARY KEY,
  test_id UUID REFERENCES tests(id),
  content TEXT,
  embedding VECTOR(1536),
  confidence FLOAT,
  evidence_count INTEGER,
  accessed_count INTEGER
);

-- Semantic search indexes
CREATE INDEX idx_products_embedding 
  ON products USING ivfflat (embedding vector_cosine_ops);
```

---

## 📈 Success Metrics

**Must Hit:**

- AskRobbie engagement: 60%+ users interact
- Vector search adoption: 80%+ product discovery
- AI insight satisfaction: 4.5+ stars
- Page load time: <1.5s

---

## 🎯 Critical Strategic Insight: Real vs Synthetic

### **The Market Just Split in Two (April 2025)**

BASES launched AI Screener with **synthetic respondents** (AI-generated predictions, not real shoppers). This created a clear market segmentation:

**Synthetic AI Testing ($500-$2K):**

- **Use case:** Early concept screening, directional feedback, low-risk decisions
- **Speed:** 10 minutes
- **Risk tolerance:** "Good enough" for internal brainstorming
- **When it fails:** Can't predict real human irrationality, edge cases, emotional responses

**Real Shopper Testing ($5K-$15K):**

- **Use case:** Launch validation, pricing optimization, packaging finals, claims testing
- **Speed:** 72 hours (human recruitment takes time)
- **Risk tolerance:** High-stakes decisions where $500K+ is on the line
- **Why it wins:** Real human behavior, real purchase intent, real switching decisions

### **TestPilot/HeyShopper Positioning:**

**Don't compete on speed** (you'll lose to BASES' 10 minutes).

**Compete on confidence:**

> "BASES gives you AI guesses in 10 minutes.  
> We give you human truth in 72 hours.  
> When $500K is on the line, which do you trust?"

### **Sales Messaging Updates:**

**Old positioning (WRONG):**

- ❌ "TestPilot: Fast results in 72 hours" (loses to BASES 10 minutes)
- ❌ "Affordable versus traditional research" (races to the bottom)

**New positioning (RIGHT):**

- ✅ "Real Shoppers. Real Insights. Real Confidence."
- ✅ "When your CMO's job depends on getting it right, use real shoppers"
- ✅ "AI can guess. Shoppers know."
- ✅ "$2M launch investment vs $15K TestPilot cost = 0.75% insurance premium"

### **Enterprise Sales Strategy:**

The 5 closing enterprise deals need **ROI justification based on decision confidence:**

```
Your SKU launch: $2M investment
BASES AI Screener: $2,000 (synthetic shoppers)
TestPilot: $15,000 (300 real shoppers in target demo)

Cost of wrong decision: $500K-$2M (launch failure, inventory write-off)
Premium for real data: $13,000
Risk reduction: Priceless

Which gives you confidence to bet $2M?
```

---

## 🎯 Implementation Phases

### Phase 1: Foundation (Months 1-2)

- ✅ AskRobbie widget on all pages
- ✅ Vector database setup
- ✅ Personality system integration
- ✅ 3 core RobbieBlocks

### Phase 2: Intelligence (Months 2-4)

- ✅ Semantic product search
- ✅ AI insights narrative
- ✅ Own shopper panel MVP
- ✅ Amazon/Walmart scrapers

### Phase 3: Automation (Months 4-6)

- ✅ Predictive analytics
- ✅ Auto-optimization suggestions
- ✅ Smart pricing
- ✅ Beta launch with 5 pilot customers

---

## 🔥 Why This Wins

1. **Proven Revenue Model**: $289K validates market demand
2. **Margin Expansion**: 100% margins (vs 40%) = 2.5x profit
3. **AI Differentiation**: No competitor has personality-driven AI
4. **Technical Moat**: Vector intelligence + proprietary shopper panel
5. **Fast Execution**: Built on existing $289K codebase

---

## 💡 The Robbie Advantage

**What makes Robbie special:**

- Not just AI - AI with **personality and context**
- Not just chat - **proactive intelligence**
- Not just data - **natural language insights**
- Not just automation - **mood-aware assistance**

**Example Flow:**

```
User lands on test results page
→ Robbie detects Variant B outperforming
→ Widget pulses with notification
→ User clicks: "Hey! 👋 Variant B is crushing it!"
→ "Want me to explain why? I found 3 key drivers..."
→ Shows vector analysis of purchase drivers
→ Suggests: "Ready to launch a follow-up test?"
```

---

## 📊 Competitive Landscape

**Market Segmentation by Data Type:**

| Competitor | Data Type | Speed | Price | Use Case |
|------------|-----------|-------|-------|----------|
| **BASES AI Screener** | Synthetic (AI) | 10 min | $500-$2K | Concept screening, low-stakes |
| **TestPilot/HeyShopper** | Real shoppers | 72 hours | $5K-$15K | Launch validation, high-stakes |
| **BASES Traditional** | Real shoppers | 2-4 weeks | $15K-$50K | Enterprise innovation pipeline |
| **Zappi** | Real shoppers | 12 hours | $2K+ | Mid-market, high volume |

**TestPilot CPG (Current):**

- ✅ $18K revenue, $80K closing
- ✅ 40 beta customers validating product
- ✅ Real shoppers (not synthetic AI)
- ✅ F500 access through network
- ❌ Uses Prolific (40% margins)
- ❌ Basic AI insights (data, not intelligence)
- ❌ No contextual help system

**HeyShopper (Future):**

- 🚀 $500K Year 1 target
- 🚀 Own panel (100% margins vs 40%)
- 🚀 Real shoppers + Robbie AI intelligence
- 🚀 Personality-driven UX (no competitor has this)
- 🚀 Vector-powered insights (pattern detection)
- 🚀 AskRobbie widget (contextual help)

**Why We Win:**

- **BASES synthetic:** Fast but not real data (risky for $500K+ launches)
- **TestPilot real shoppers:** Human truth for high-stakes decisions
- **Robbie intelligence:** Makes insights conversational and actionable
- **F500 access:** Network is the moat (can't be replicated)

---

## 🎁 What You Get

**As a customer:**

- TestPilot's validated platform (40 beta customers, Simply Good Foods paid customer)
- **Real shoppers, not synthetic AI** (human truth for high-stakes decisions)
- **+ Robbie AI assistant** on every page (contextual help)
- **+ Vector-powered insights** you can't get elsewhere
- **+ Natural language explanations** (not just charts and data)
- **+ Personality modes** that adapt to your needs (friendly, focused, playful, bossy)
- **+ Own shopper panel** (better margins = better pricing long-term)

---

## 💬 Questions & Answers

**Q: Why enhance TestPilot now?**
A: We're not rebuilding - we're **adding intelligence to a validated platform**. 40 beta customers proved product-market fit. Simply Good Foods proved willingness to pay. Now we scale with Robbie AI layer that makes insights conversational and creates customer stickiness.

**Q: What's the timeline?**
A: Close the 5 enterprise deals with current product (Q4 2024), launch HeyShopper enhancements Q1 2025, scale to $500K by end of Year 1.

**Q: What's the investment?**
A: Phase 1 (AskRobbie widget, vector search, personality integration) is 3-4 months development. Costs offset by improved retention and beta conversions. Own shopper panel (Phase 2) requires $500K-$2M investment over 12-24 months but delivers 2.5x margin improvement.

**Q: Why will this win?**
A: **Real shoppers (not synthetic AI)** + **F500 access** + **Robbie intelligence** = unstoppable. BASES can't replicate human behavior. Competitors can't replicate your network. No one has personality-driven AI.

---

## 🚀 Next Steps

1. Approve plan direction
2. Finalize technical specs for RobbieBlocks
3. Set up vector database infrastructure
4. Build AskRobbie widget prototype
5. Develop shopper panel MVP
6. Launch pilot with 5 customers

**Ready to transform TestPilot into HeyShopper?** Let's ship! 🎯💰

---

## 📋 Technical Details for Developers

### AskRobbie Widget Specs

**Size & Position:**

```typescript
const askRobbieWidget = {
  collapsed: {
    width: '60px',
    height: '60px',
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999
  },
  expanded: {
    width: '400px',
    height: '600px',
    maxHeight: '80vh'
  },
  mobile: {
    expanded: {
      width: '100vw',
      height: '100vh'
    }
  }
}
```

**Context-Aware Behavior:**

```typescript
const contextualHelp = {
  '/test/create': 'Need help setting up your test? I can suggest optimal demographics!',
  '/test/{id}/results': 'I notice Variant B is outperforming. Want me to analyze why?',
  '/products/compare': 'Comparing products? Let me find semantic similarities you might miss.',
  '/insights/{id}': 'I can explain these insights in plain English if you\'d like!',
  '/billing': 'Need help understanding your credit usage? I\'ve got the breakdown.'
}
```

### Mood-Based Interactions

```typescript
const robbiePersonality = {
  friendly: {
    greeting: "Hey there! Ready to launch something amazing?",
    testComplete: "Woohoo! Your test results are in! 🎉",
    errorMessage: "Oops! Something hiccupped. Let me fix that for you."
  },
  focused: {
    greeting: "Let's get to work. What test are we running today?",
    testComplete: "Test complete. Here's your data.",
    errorMessage: "Error detected. Investigating now."
  },
  playful: {
    greeting: "Heyyy! 😊 What fun test shall we cook up today?",
    testComplete: "OMG your results are FIRE! 🔥 Check this out!",
    errorMessage: "Whoopsie daisy! 🙈 Let me make this right."
  },
  bossy: {
    greeting: "Alright, let's ship this test TODAY. No excuses.",
    testComplete: "Results are in. Now act on them. Immediately.",
    errorMessage: "This shouldn't have failed. Fixing it. Stand by."
  }
}
```

### Vector Database Schema

```sql
-- Extend products table
ALTER TABLE products ADD COLUMN embedding VECTOR(1536);
ALTER TABLE products ADD COLUMN semantic_tags TEXT[];

-- Extend responses
ALTER TABLE responses_surveys ADD COLUMN sentiment_embedding VECTOR(1536);
ALTER TABLE responses_comparisons ADD COLUMN choice_reasoning_embedding VECTOR(1536);

-- Add AI insights memory
CREATE TABLE robbie_insights_memory (
  id UUID PRIMARY KEY,
  test_id UUID REFERENCES tests(id),
  insight_type VARCHAR(50),
  content TEXT,
  embedding VECTOR(1536),
  confidence FLOAT,
  evidence_count INTEGER,
  created_at TIMESTAMPTZ,
  accessed_count INTEGER
);

-- Semantic search indexes
CREATE INDEX idx_products_embedding ON products USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_insights_embedding ON robbie_insights_memory USING ivfflat (embedding vector_cosine_ops);
```

### File Structure

```
heyshopper/
├── src/
│   ├── blocks/
│   │   ├── retail/              # NEW: Retail-specific blocks
│   │   │   ├── ProductComparisonGrid.tsx
│   │   │   ├── TestWizard.tsx
│   │   │   ├── ShopperPanelManager.tsx
│   │   │   ├── InsightsNarrative.tsx
│   │   │   ├── AmazonScraper.tsx
│   │   │   ├── WalmartIntegration.tsx
│   │   │   ├── SemanticProductSearch.tsx
│   │   │   ├── TestHealthMonitor.tsx
│   │   │   ├── SmartPricing.tsx
│   │   │   └── RobbieReports.tsx
│   │   ├── personality/        # From RobbieBlocks
│   │   │   ├── PersonalitySlider.tsx
│   │   │   ├── MoodIndicator.tsx
│   │   │   └── ExpressionAvatar.tsx
│   │   ├── communication/      # From RobbieBlocks
│   │   │   ├── AskRobbieWidget.tsx  # NEW: Contextual help
│   │   │   ├── ChatInterface.tsx
│   │   │   └── TouchReadyQueue.tsx
│   │   └── business/           # From RobbieBlocks
│   │       ├── RevenueMetrics.tsx
│   │       └── DealRiskAnalyzer.tsx
│   ├── features/
│   │   ├── tests/              # Enhanced test management
│   │   ├── shoppers/           # NEW: Own shopper panel
│   │   ├── insights/           # AI-powered insights
│   │   └── products/           # Vector-enhanced products
│   └── services/
│       ├── robbieAI.ts        # AI service integration
│       ├── vectorSearch.ts    # Semantic search
│       └── personality.ts     # Personality management
```

---

## 📊 Detailed Implementation Priorities

### High Priority (Ship First)

1. **AskRobbie Widget** - Contextual help on every page
2. **Vector Product Search** - Semantic similarity
3. **AI Insights Narrative** - Natural language explanations
4. **Own Shopper Panel** - Replace Prolific, keep 100% margins

### Medium Priority (Q2 2026)

5. **Amazon/Walmart Scrapers** - Real-time product intelligence
6. **Predictive Analytics** - Forecast outcomes mid-test
7. **Automated Optimization** - Robbie suggests improvements
8. **Smart Pricing** - Dynamic credit pricing

### Lower Priority (Nice-to-Have)

9. **Mobile App** - Shopper mobile experience
10. **Voice Interface** - "Hey Robbie, create a test"
11. **White-Label** - Branded versions for enterprise
12. **API Marketplace** - Developer ecosystem

---

## TL;DR

Take TestPilot's validated platform ($18K revenue, 40 beta customers, $80K closing), add Robbie's personality-driven AI to create unstoppable competitive advantage. **Real shoppers beat synthetic AI** for high-stakes decisions. **F500 access can't be replicated**. **Robbie intelligence makes insights conversational**.

**Key Numbers:**

- **Current:** $18K revenue + $80K closing = $98K imminent
- **Target:** $500K Year 1 (convert betas, close enterprise, scale)
- **Timeline:** Q4 2024 close deals, Q1 2025 launch HeyShopper
- **Validation:** 40 beta customers, Simply Good Foods paid, 5 enterprise closing

**Unique Advantages:**

- **Real shoppers vs synthetic AI** (BASES can't match human truth)
- **F500 network access** (your personal moat)
- **Personality-driven AI** (6 moods, Gandhi-Genghis spectrum, no competitor has this)
- **Vector intelligence** (semantic search, pattern detection in shopper data)
- **Own shopper panel roadmap** (100% margins vs 40% long-term)
- **AskRobbie widget** (contextual help on every page)

---

**Document Created:** October 9, 2025  
**Status:** Ready for Implementation  
**Next Review:** After stakeholder approval  
**Contact:** Allan Peretz (<allan@testpilotcpg.com>)
