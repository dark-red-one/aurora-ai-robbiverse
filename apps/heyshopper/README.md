# HeyShopper - Shopper Panel Platform

**Replace Respondent.io with our own platform** 💰

## What This Is

HeyShopper is TestPilot's shopper recruitment and study management platform. Instead of paying Respondent.io margins, we run our own panel and keep 100% of the value.

## Business Model

**Revenue:**
- Recruit shoppers (pay them $50-200/study)
- Run studies for CPG brands (charge brands $100-500/study)
- Margin: $50-300/study
- Volume: 20+ studies/month = $1K-4K/month profit

## Features

### Shopper Side
- Sign up & profile creation
- Browse available studies
- Apply to studies (AI matching)
- Complete studies & get paid
- Track earnings & history

### Brand Side (TestPilot)
- Create study requests
- Set criteria (demographics, behavior, etc.)
- AI matches shoppers to studies
- Manage study execution
- Review results
- Pay shoppers automatically

### Admin (Allan)
- Dashboard of all studies
- Shopper pool management
- Revenue tracking
- Study analytics
- Automated matching

## Tech Stack

Uses same foundation as TestPilot CPG:
- **Frontend:** React + @robbieblocks/core
- **Backend:** @robbieverse/api
- **Database:** Unified schema (shoppers, studies, payments tables)
- **AI:** Robbie in "friendly-helpful" mode
- **Branding:** Consumer-friendly (coral/teal colors, Poppins font)

## Database Tables Needed

```sql
-- Shopper profiles
CREATE TABLE shoppers (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  demographics JSONB,
  shopping_habits JSONB,
  earnings_total DECIMAL,
  studies_completed INTEGER,
  rating DECIMAL
);

-- Study requests
CREATE TABLE studies (
  id UUID PRIMARY KEY,
  title TEXT,
  description TEXT,
  criteria JSONB,
  pay_amount DECIMAL,
  brand_charge DECIMAL,
  status TEXT, -- 'recruiting', 'active', 'complete'
  shopper_count INTEGER
);

-- Matches (AI-powered)
CREATE TABLE study_matches (
  id UUID PRIMARY KEY,
  study_id UUID REFERENCES studies(id),
  shopper_id UUID REFERENCES shoppers(id),
  match_score DECIMAL, -- AI confidence
  status TEXT -- 'invited', 'accepted', 'complete'
);
```

## Revenue Opportunity

**Conservative:**
- 10 studies/month × $100 margin = $1K/month

**Realistic:**
- 20 studies/month × $150 margin = $3K/month

**Aggressive:**
- 40 studies/month × $200 margin = $8K/month

**Annual:** $12K - $96K just from HeyShopper!

## Next Steps

1. Add shopper/study tables to unified schema
2. Build shopper signup flow
3. Build brand study request interface
4. Implement AI matching algorithm
5. Add payment processing (Stripe)
6. Deploy to heyshopper.com

---

**Built to replace Respondent and keep 100% of the value** 💰

**Uses RobbieBlocks, unified auth, Robbie AI for matching** 🤖

