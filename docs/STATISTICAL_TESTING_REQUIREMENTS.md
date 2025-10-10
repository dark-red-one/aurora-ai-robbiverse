# TestPilot vs HeyShopper: Architecture & Positioning

**Updated:** October 9, 2025  
**Status:** Strategic clarity achieved

---

## The Two Products

### **TestPilot** - Standalone SaaS Product
**Domain:** `app.testpilotcpg.com`  
**Positioning:** Professional shopper testing platform for CPG brands  
**Current:** $20K revenue, 40 beta customers, $88K closing

**What it is:**
- Clean, focused product testing platform
- Real shoppers (not synthetic AI)
- Professional UI/UX
- Standard modules (pricing, packaging, claims, head-to-head, advertising)
- AI insights generation
- PDF reports

**Who it's for:**
- CPG brand managers
- Marketing teams
- Product developers
- Innovation teams

**Pricing:** $5K-$15K per test (25-30 credits @ $49/shopper)

---

### **HeyShopper** - Robbieverse-Integrated Platform
**Domain:** `heyshopper.com` (or within Aurora ecosystem)  
**Positioning:** AI-powered shopper testing with full Robbieverse integration  
**Target:** Premium tier customers, advanced users

**What it is:**
- **All TestPilot features** (same core platform)
- **+ RobbieChat interface** (conversational everything)
- **+ Vector intelligence** (learns from all past tests)
- **+ Personality system** (moods, Gandhi-Genghis, contextual adaptation)
- **+ Cross-platform memory** (Robbie remembers across all products)
- **+ Proactive automation** (daily briefs, recommendations, insights)
- **+ Activities upsells** (Circle & Cross, heat maps, etc.)
- **+ Statistical rigor** (custom sample size recommendations)

**Who it's for:**
- Robbieverse users (existing Allan ecosystem customers)
- Advanced analytics teams
- Data-driven executives
- High-volume testers (3+ tests/month)

**Pricing:** Premium tier (same base + intelligence layer value-add)

**Key difference:** **Feels standalone but powered by Robbieverse**

---

## The Relationship

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ROBBIEVERSE (The Ecosystem)                        │
│  ┌─────────────────────────────────────────────┐   │
│  │ Shared Infrastructure:                      │   │
│  │ - Vector DB (embeddings for everything)     │   │
│  │ - Personality system (moods, memories)      │   │
│  │ - RobbieChat engine (conversations)         │   │
│  │ - Cross-product intelligence               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ TestPilot    │  │ HeyShopper   │  │ Robbie   │ │
│  │ (Standalone) │  │ (Integrated) │  │ @Work    │ │
│  │              │  │              │  │          │ │
│  │ Uses basic   │  │ Full         │  │ CRM +    │ │
│  │ features     │  │ Robbieverse  │  │ Pipeline │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**TestPilot:**
- Can be used WITHOUT Robbieverse
- Clean, simple, professional
- No personality/mood stuff visible
- Traditional SaaS experience

**HeyShopper:**
- SAME core platform
- But connected to Robbieverse infrastructure
- RobbieChat everywhere
- Cross-product intelligence
- **Feels standalone** (shopper doesn't know about other Robbie products)

---

## Statistical Testing Implementation

### **Module-Specific Sample Size Recommendations:**

```typescript
interface SampleSizeConfig {
  module: TestModule;
  variants: number;
  effectSize: number;      // Minimum detectable difference
  confidence: number;      // Default: 0.95
  power: number;          // Default: 0.80
  costPerShopper: number; // $49
}

const MODULE_DEFAULTS: Record<TestModule, { effectSize: number }> = {
  pricing: { effectSize: 0.10 },      // 10% difference
  packaging: { effectSize: 0.15 },    // 15% difference (visual is stronger)
  claims: { effectSize: 0.08 },       // 8% difference (subtle, need more power)
  head_to_head: { effectSize: 0.12 }, // 12% difference
  advertising: { effectSize: 0.20 }   // 20% brand lift (with control group)
};

function calculateSampleSize(config: SampleSizeConfig): SampleSizeResult {
  const { module, variants, effectSize, confidence, power } = config;
  
  // Z-scores
  const z_alpha = 1.96;  // 95% confidence
  const z_beta = 0.84;   // 80% power
  
  // Base calculation (per variant)
  const p = 1 / variants;  // Expected proportion under null hypothesis
  const d = effectSize;
  
  const n_per_variant = 2 * Math.pow(z_alpha + z_beta, 2) * p * (1 - p) / Math.pow(d, 2);
  
  // Total sample size
  const minimum = Math.ceil(n_per_variant * variants);
  
  // Add safety margins
  const recommended = Math.ceil(minimum * 1.2);  // 20% buffer
  const premium = Math.ceil(minimum * 1.5);      // 50% buffer
  
  // Advertising needs control group
  if (module === 'advertising') {
    return {
      minimum: minimum * 2,      // Test + control
      recommended: recommended * 2,
      premium: premium * 2,
      requiresControlGroup: true
    };
  }
  
  return {
    minimum,
    recommended,
    premium,
    requiresControlGroup: false
  };
}
```

### **RobbieChat Explains Statistical Power:**

```
Allan: "Why 150 shoppers? Can't we do 50?"

Robbie: "Let me explain the stats! 📊

With 50 shoppers testing 3 prices:
- That's only 17 per variant
- Can only detect 20%+ differences reliably
- If $4.99 gets 40% and $5.99 gets 35%, that's 
  NOT statistically different
- Results would be inconclusive 😞

With 150 shoppers:
- That's 50 per variant
- Can detect 10%+ differences
- If $4.99 gets 40% and $5.99 gets 35%, we CAN 
  tell if that's real or random
- Results you can bet $2M on ✅

Think of it like this: Would you launch a $2M SKU 
based on 17 shoppers' opinions? Or 50 per price point?

The $3,675 extra cost ($7,350 vs $3,675) is 0.18% of 
your $2M launch investment. That's cheap insurance for 
decision confidence.

Still want 50 or go with 150?"
```

---

## Implementation Plan

### **Phase 0.5: Statistical Foundation** (Week 3-4)

**Build statistical testing infrastructure:**

1. **Sample size calculator library**
   ```python
   # packages/@robbieverse/api/src/services/statistics.py
   
   from scipy import stats
   import numpy as np
   
   class StatisticalTestingService:
       def recommend_sample_size(
           self,
           module: str,
           num_variants: int,
           effect_size: float = None,
           confidence: float = 0.95,
           power: float = 0.80
       ) -> dict:
           """Calculate required sample size for test module"""
           
           # Use module defaults if not specified
           if effect_size is None:
               effect_size = MODULE_DEFAULTS[module]['effectSize']
           
           # Calculate
           result = self._calculate_sample_size(
               num_variants,
               effect_size,
               confidence,
               power
           )
           
           # Add cost calculations
           result['cost_minimum'] = result['minimum'] * 49
           result['cost_recommended'] = result['recommended'] * 49
           result['cost_premium'] = result['premium'] * 49
           
           # Generate explanation
           result['explanation'] = self._generate_explanation(
               module,
               num_variants,
               effect_size,
               result
           )
           
           return result
   ```

2. **Results significance testing**
   ```python
   class ResultsAnalysisService:
       def analyze_test_results(
           self,
           test_id: str,
           responses: list
       ) -> dict:
           """Perform statistical analysis on test results"""
           
           test = self.get_test(test_id)
           
           if test.module == 'pricing':
               return self._analyze_pricing(responses)
           elif test.module == 'advertising':
               return self._analyze_advertising(responses)
           # ... etc
       
       def _analyze_pricing(self, responses):
           # Chi-square for preference distribution
           chi2, p_value = self._chi_square_test(responses)
           
           # Pairwise comparisons
           pairwise = self._pairwise_z_tests(responses)
           
           # Generate insights
           winner = self._determine_winner(responses, p_value)
           
           return {
               'statistically_significant': p_value < 0.05,
               'p_value': p_value,
               'confidence': 1 - p_value,
               'winner': winner,
               'pairwise_comparisons': pairwise,
               'robbie_explanation': self._generate_explanation(
                   chi2, p_value, winner
               )
           }
   ```

3. **RobbieChat integration**
   ```typescript
   // When customer asks about results
   async function explainResults(testId: string, question: string) {
       // Get statistical analysis
       const stats = await statisticsAPI.analyzeTestResults(testId);
       
       // Get personality context
       const personality = await getCustomerPersonality();
       
       // Generate explanation based on question + stats + personality
       const prompt = `
           Customer asked: "${question}"
           Statistical results: ${JSON.stringify(stats)}
           Personality: ${personality.mood} mood, genghis level ${personality.genghis}
           
           Explain the statistical significance in plain English.
           Match ${personality.mood} tone.
           If genghis > 7, be direct and action-oriented.
           If genghis < 4, be gentle and educational.
       `;
       
       return await robbieAI.generate(prompt);
   }
   ```

---

## Expert Mode: Statistical Controls

### **Simple Mode (Hidden Complexity):**
```
Robbie: "For 3-way pricing, recommend 150 shoppers"
[Just tells you what to do]
```

### **Expert Mode (Shows The Math):**
```
Robbie: "For 3-way pricing test, here's the calculation:

Parameters:
- Variants: 3
- Effect size: 10% (industry standard for pricing)
- Confidence: 95%
- Statistical power: 80%

Formula: n = 2(Z_α/2 + Z_β)² × p(1-p) / d²
Calculation: 2(1.96 + 0.84)² × 0.33(0.67) / 0.10²
Result: 41 per variant × 3 = 123 minimum

Recommended: 150 (20% safety buffer)

Want to adjust parameters?
- Change effect size (current: 10%)
- Change confidence (current: 95%)
- Change power (current: 80%)"
```

**Customer can then:**
```
Allan: "What if I only need to detect 15% differences?"

Robbie: "Good call! At 15% effect size:
- Need only 18 per variant
- Total: 54 shoppers minimum
- Recommended: 75 shoppers (25 per variant)
- Cost: $3,675 (vs $7,350 for 10% detection)

Trade-off: You save $3,675 but can only detect bigger 
differences. If $4.99 and $5.99 are close (within 15%), 
results might be inconclusive.

For pricing decisions, I still recommend 10% sensitivity. 
But your call!"
```

---

## How This Updates HeyShopper Plan

### **Phase 0 (Oct 9-21): Walmart + Foundations**
1. Analyze tester feedback → Fix UX issues
2. Security fixes → Unblock enterprise
3. Multi-retailer pricing → Walmart revenue
4. **Add statistical testing library** → Rigorous recommendations

### **Phase 0.5 (Weeks 3-4): Conversational Foundation**
5. Build RobbieChat conversation engine
6. Implement 5 test modules (pricing, packaging, claims, head-to-head, advertising)
7. **Integrate statistical calculator** → Smart sample size recommendations
8. Expert mode toggle

### **Phase 1 (Weeks 5-8): Conversational Surveys**
9. Replace rigid surveys with RobbieChat conversations
10. Build activities system (Circle & Cross, heat maps, etc.)
11. **Statistical significance testing** in results
12. A/B test: Survey vs Chat (measure completion rates)

### **Phase 2 (Weeks 9-12): Intelligence Layer**
13. Vector-enable all conversations
14. Cross-test learning (Robbie remembers patterns)
15. **Predictive sample size** (based on past test similarity)
16. Automated insights with statistical confidence

---

## The Positioning

### **TestPilot (Standalone)**

**Pitch:**
"Professional shopper testing platform. Real shoppers, real insights, 72 hours."

**Features:**
- 5 test modules
- Real shopper feedback
- AI-generated insights
- Statistical analysis
- PDF reports

**No mention of:**
- Robbie personality
- Cross-product intelligence
- Robbieverse ecosystem

**It just works. Clean. Professional. Simple.**

---

### **HeyShopper (Robbieverse-Integrated)**

**Pitch:**
"The only shopper testing platform with AI that learns YOUR brand. Every test makes Robbie smarter about your products."

**Features:**
- Everything TestPilot has
- **+ Conversational interface** (RobbieChat replaces forms)
- **+ Brand memory** (Robbie learns from every test)
- **+ Predictive insights** (Robbie predicts before you test)
- **+ Cross-product intelligence** (insights from other Robbie products)
- **+ Proactive automation** (daily briefs, recommendations)

**Experience:**
- Chat with Robbie to set up tests
- Chat with Robbie during survey (shoppers)
- Chat with Robbie to explore results
- Robbie remembers everything about your brand

**Feels standalone** (shopper testing product) but **powered by Robbieverse** (shared intelligence)

---

## Statistical Rigor Framework

### **Per-Module Sample Size Defaults:**

```typescript
const STATISTICAL_DEFAULTS = {
  pricing: {
    effectSize: 0.10,        // Detect 10% preference differences
    minShoppersPerVariant: 41,
    recommendedTotal: 150,   // 50 per variant for 3-way
    reasoning: "Price differences are subtle; need power to detect 10% shifts"
  },
  
  packaging: {
    effectSize: 0.15,        // Detect 15% (visual is stronger)
    minShoppersPerVariant: 18,
    recommendedTotal: 75,    // 25 per variant for 3-way
    reasoning: "Visual preferences are stronger; can detect with smaller sample"
  },
  
  claims: {
    effectSize: 0.08,        // Detect 8% (claims are subtle)
    minShoppersPerVariant: 64,
    recommendedTotal: 225,   // 75 per variant for 3-way
    reasoning: "Claims are nuanced; need larger sample for subtle differences"
  },
  
  head_to_head: {
    effectSize: 0.12,        // Detect 12%
    minShoppersPerVariant: 28,
    recommendedTotal: 150,   // 50 per product for 3-way
    reasoning: "Competitive comparisons; moderate sample for clear preferences"
  },
  
  advertising: {
    effectSize: 0.20,        // Detect 20% brand lift
    minShoppersPerVariant: 49,
    recommendedTotal: 150,   // 75 test + 75 control
    requiresControl: true,
    reasoning: "Ad effectiveness needs control group; testing brand lift vs baseline"
  }
};
```

### **RobbieChat Sample Size Conversation:**

```
Allan: "Set up pricing test, 3 prices"

Robbie: "Perfect! For statistically valid pricing test:

📊 Minimum: 123 shoppers (barely significant)
✅ Recommended: 150 shoppers (safe margin)
💎 Premium: 200 shoppers (bulletproof)

Why 150? With 3 price points, you need 50 per variant 
to detect 10% preference differences with 95% confidence.

This costs 150 credits ($7,350). For a $2M launch 
decision, that's 0.37% insurance.

Go with 150?"

[If expert mode enabled:]

Allan: "Show me the math"

Robbie: "You got it! 🤓

Formula: n = 2(Z_α/2 + Z_β)² × p(1-p) / d²

Parameters:
- Z_α/2 = 1.96 (95% confidence interval)
- Z_β = 0.84 (80% statistical power)
- p = 0.33 (expected under null: 1/3 for 3-way)
- d = 0.10 (10% minimum detectable difference)

Calculation:
n = 2(1.96 + 0.84)² × 0.33(0.67) / 0.10²
n = 2(7.84) × 0.2211 / 0.01
n = 40.7 per variant

Minimum: 41 × 3 = 123 shoppers
Recommended: 123 × 1.2 = 147 → round to 150

Want to adjust parameters?"
```

---

## The Competitive Advantage

### **BASES Synthetic:**
- Fixed sample sizes
- No statistical customization
- AI predictions (not real data)
- No sample size justification

### **TestPilot:**
- Real shoppers
- Basic statistical analysis
- Fixed survey forms
- Professional reporting

### **HeyShopper:**
- **Real shoppers** (like TestPilot)
- **+ Custom statistical power analysis** per test design
- **+ Conversational interface** (RobbieChat explains the stats)
- **+ Learns from past tests** to recommend optimal sample sizes
- **+ Expert mode** for power users who want the math
- **+ Feels standalone** but Robbieverse-powered

**Sales pitch:**
```
"BASES guesses with AI. TestPilot tests with real shoppers.

HeyShopper tests with real shoppers AND has an AI that 
learns YOUR brand - recommending exact sample sizes based 
on your test design, explaining statistical significance 
in plain English, and getting smarter with every test.

By Test 3, Robbie knows your products better than you do."
```

---

## Next Steps

1. ✅ Build statistical testing service (Python)
2. ✅ Integrate with RobbieChat (sample size recommendations)
3. ✅ Add to test setup flow (automatic calculations)
4. ✅ Expert mode controls (show/hide math)
5. ✅ Results analysis with significance testing

**Timeline:** Weeks 3-4 for statistical foundation  
**Owner:** Backend (statistical library) + Frontend (RobbieChat integration)

---

**TestPilot = Great standalone product.  
HeyShopper = TestPilot + Robbieverse intelligence.  
Both use same core platform, different positioning.** 🚀

*Feels standalone. Powered by ecosystem. Best of both worlds.*


