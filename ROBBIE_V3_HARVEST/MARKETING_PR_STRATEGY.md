# 📊 Marketing & PR Strategy - Robbie v3 Integration

> Note: This document is superseded by `docs/CONSOLIDATED_MARKETING_PLAYBOOK.md`. Refer there for the latest, prioritized playbook.

## **Overview**

This document captures our comprehensive marketing and PR strategy, including technology automation, segmentation frameworks, and integration points with Robbie v3's AI-powered infrastructure.

---

## **A. Segmentation & Pipeline Framework**

### **Unified Sales Stages**
```
awareness → engage → qualify → prove → commit → expand → closed-won → closed-lost
```

### **Stage Placement Rules**

**Awareness:**
- Identified visitor
- LinkedIn follower/liker
- Newsletter subscriber
- Webinar attendee

**Engage:**
- Any reply
- Meeting booked
- Content interaction > threshold
- Warm intro

**Qualify:**
- ICP fit confirmed (industry/category, revenue band, pain match)
- Budget/timeframe known

**Prove:**
- Pilot, POC, proposal shared
- Trial underway

**Commit:**
- Verbal yes
- Redlines
- Security review
- PO in progress

**Expand:**
- Live customer + expansion signal (usage, new brand, new region)

### **Warm vs. Cold Classification**

**Warm = Prior relationship strength ≥ threshold:**
- Shared deals
- Alumni connections
- Mentor calls
- VIP intro

**Cold = None of the above**

### **Database Schema Integration**
- `app.deals.stage` - Current deal stage
- `app.deals.is_warm` - Warm/cold classification
- `app.companies.revenue_band` - Company revenue tier
- `app.companies.short_term_potential` - Short-term opportunity value

---

## **B. Assignment & Capacity-Aware Routing**

### **A/B/C Assignment Rules**

**A = ≥$500M revenue or ≥$100k short-term:**
- Founder + Tom (+ optional Dr. Dave)

**B = $50M–$500M and $20k–$100k short-term:**
- Tom + Kristina

**C = <$50M and <$20k:**
- Tina

### **Capacity Management**
- Use `app.v_team_workload` for capacity tracking
- Active deals, overdue tasks, interactions monitoring
- Conflict handling: if owner ≥120% capacity, reroute to next in list
- Log override reasons for transparency

### **Fallback System**
- DB trigger `assign_deal_owner()` ensures no orphan deals
- Role-based assignment as final fallback

---

## **C. Engagement Engine (Assessor)**

### **Input Sources**
- CRM activity
- Inbox replies
- LinkedIn engagements
- News monitoring
- PR signals
- Calendar milestones

### **Output Generation**
- Ranked "touch-ready" opportunities
- Channel recommendations
- Draft content
- Why-now reasoning
- Evidence links
- Stored in `app.engagement_opportunities`

### **Guardrails & Policies**
- Policy-driven limits from `app.comms_policies`
- Fatigue suppression from `app.comms_fatigue`
- Sentiment events (`app.sentiment_events`) enforce cool-offs
- Auto "Closed Lost – Negative Sentiment" for early stage negative sentiment

### **Learning Loop**
- Rejections require reason (bad timing, not relevant, etc.)
- Logged in `engagement_opportunities.status` + reasoning
- Continuous improvement based on feedback

---

## **D. Transcript Mining & AI Processing**

### **Extraction Capabilities**
- AI confidence model detects commitment phrases
- "I will / we'll send / by Friday" detection
- Proposed next steps extraction
- Sticky notes generation

### **Output Storage**
- `app.transcript_insights.next_steps`
- `app.transcript_insights.knowledge_snippets`

### **UI Integration**
- Show extracted items with confidence scores
- Allow edit/approve functionality
- Create tasks/notes from approved extractions

### **Feedback Loop**
- Manual corrections improve AI model
- Continuous learning and accuracy improvement

---

## **E. Communication Guardrails**

### **Hard Limits**
- Default 3 touches/week
- ≥48h spacing between touches
- Enforced in `app.comms_policies`

### **Cooling Off Periods**
- 14 days after negative sentiment (≤-0.4)
- Recorded in `app.sentiment_events`
- Automatic enforcement

### **Channel Diversity**
- Prefer alternating channels
- Monotony penalized in scoring
- Multi-channel engagement strategy

### **Batch Windows**
- 3 daily batches by default
- Calendar-aware scheduling
- Optimized for recipient timezone

---

## **F. Campaign Orchestration & Smart Scheduling**

### **Calendar-Aware Windows**
- Avoid conflict with deep-work blocks
- Weight for recipient timezone
- Respect personal calendar preferences

### **Best-Time Models**
- Learn open/reply patterns per persona
- Machine learning optimization
- Continuous improvement

### **Fallback Strategy**
- "Friday 3pm" send for low-risk touches
- Tuned from historical outcomes
- Data-driven optimization

### **Schema Integration**
- Orchestration jobs run via MCP workflows
- Updates logged in `app.mcp_calls`
- Full audit trail

---

## **G. KPI Framework & Metrics**

### **Engagement Metrics**
- Engagement rate per stage (Awareness→Engage, Engage→Qualify, etc.)
- Time-to-Reply
- Time-in-Stage
- Win-rate by Segment

### **Financial Metrics**
- Discount impact vs. close rate
- Revenue attribution
- Cost per acquisition

### **Efficiency Metrics**
- Fatigue suppression saves (touches withheld)
- Sentiment-correct closures (negative prevented early)
- Automation effectiveness

### **Data Sources**
- `app.v_pipeline_health` - Pipeline performance
- `app.v_abc_segmentation` - Segmentation analysis
- `app.v_weekly_digest` - Weekly performance summary

---

## **H. Integration & Reliability**

### **CRM Integration**
- HubSpot as visible system
- PostgreSQL as control plane
- Bidirectional sync

### **MCP Workflows**
- Handles sync cycles
- One toolbelt for both app + CrewAI
- Unified automation platform

### **Sync Cadence**
- Near-real-time for alerts
- Hourly for enrichment
- Daily for reporting

### **Failure Handling**
- Clear "not connected" state
- Retries with backoff
- Manual resync capabilities
- Comprehensive error logging

---

## **I. Brand & Voice Guidelines**

### **Assistant Signature**
- "TestPilot's Digital Assistant — askrobbie.ai"
- Consistent branding across all touchpoints

### **Tone & Style**
- Energetic and engaging
- Admiring of founders' strategic choices
- Never over-familiar
- Trust earned with receipts and evidence

### **Communication Principles**
- Data-driven insights
- Personalized approach
- Respectful of time and attention
- Value-first messaging

---

## **J. Priority Screens & Dashboards**

### **Marketing Dashboards**
- Segmentation Matrix (HubSpot Sync View)
- Backed by `app.v_abc_segmentation`
- Real-time segmentation updates

### **Guardrails Console**
- Shows violations prevented
- Fatigue suppressions tracking
- Policy compliance monitoring

### **Automation Orchestrator**
- MCP Health monitoring
- Service status tracking
- Retry ETA visibility

---

## **K. Robbie v3 Integration Opportunities**

### **AI-Powered Capabilities**
- **Content Generation**: Use RTX 4090 models for personalized outreach
- **Sentiment Analysis**: Real-time PR monitoring with local AI
- **Campaign Optimization**: Database-driven performance tracking
- **Automated Reporting**: AI-generated marketing insights

### **Technical Advantages**
- **Local AI Processing**: No API costs, maximum privacy, unlimited usage
- **Real-time Sync**: Marketing data stays current across all systems
- **Scalable Infrastructure**: Aurora handles massive marketing data loads
- **Integrated Workflow**: Marketing, PR, and development unified system

### **Database Extensions Needed**
- Marketing campaigns tracking
- Lead scoring and qualification
- Content performance metrics
- PR monitoring and sentiment
- A/B testing results
- Attribution modeling

---

## **L. Implementation Roadmap**

### **Phase 1: Foundation**
- [ ] Extend database schema for marketing data
- [ ] Set up AI-powered content generation
- [ ] Implement sentiment monitoring
- [ ] Create basic marketing dashboards

### **Phase 2: Automation**
- [ ] Build engagement engine
- [ ] Implement assignment routing
- [ ] Set up communication guardrails
- [ ] Create campaign orchestration

### **Phase 3: Optimization**
- [ ] Advanced AI models for personalization
- [ ] Machine learning for best-time models
- [ ] Predictive analytics for pipeline
- [ ] Advanced reporting and insights

### **Phase 4: Scale**
- [ ] Multi-channel campaign management
- [ ] Advanced attribution modeling
- [ ] Predictive lead scoring
- [ ] Full automation suite

---

## **M. Success Metrics**

### **Engagement Metrics**
- 25% increase in engagement rates
- 40% reduction in time-to-reply
- 60% improvement in qualification accuracy

### **Efficiency Metrics**
- 50% reduction in manual tasks
- 30% increase in team capacity
- 80% improvement in campaign ROI

### **Quality Metrics**
- 90% reduction in fatigue violations
- 95% accuracy in sentiment detection
- 85% improvement in personalization scores

---

**Last Updated**: January 15, 2025  
**Version**: 1.0  
**Status**: Strategic Reference Document





