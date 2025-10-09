# 🎯 Priority Surface Engine

## The Surface/Submerge Strategy

**Core Principle:** Allan should ONLY see the **10 things** that matter RIGHT NOW. Everything else sinks below the fold.

This is **attention management** at scale. Not todo lists. Not inbox zero. **Focus on what moves the needle.**

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│           PRIORITY SURFACE (Top 10 Visible)             │
│  ┌────────────────────────────────────────────────┐    │
│  │  1. 🔴 Acme Corp deal closing today  ($50k)    │    │
│  │  2. 🔴 Urgent email from CEO                   │    │
│  │  3. 🔴 Product launch meeting in 2 hours       │    │
│  │  4. 🟡 Schedule Q4 planning session           │    │
│  │  5. 🟡 Review TestPilot roadmap               │    │
│  │  6. 🔴 Contract renewal expires tomorrow       │    │
│  │  7. 🟡 Weekly 1:1 with CTO                    │    │
│  │  8. 🔴 Bug fix needed for demo                │    │
│  │  9. 🟡 Investor update email                  │    │
│  │ 10. 🟢 Delegate hiring task to recruiter      │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         SUBMERGED (Everything Else - Grouped)           │
│  ┌─ Q1: DO NOW (3 more) ───────────────────────┐       │
│  ├─ Q2: SCHEDULE (12 items) ────────────────────┤       │
│  ├─ Q3: DELEGATE (8 items) ─────────────────────┤       │
│  └─ Q4: ELIMINATE (47 items - auto-archive) ────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## Eisenhower Matrix Implementation

Every item gets scored on **2 dimensions**:

### 1️⃣ Importance Score (0-100)

**Revenue Potential** (0-40 points):
- High $ deals get priority
- Weighted by probability of close

**Sender/Participant Importance** (0-30 points):
- Founder/CEO: 30 points
- C-level: 25 points
- VP/Director: 20 points
- Manager: 15 points
- Individual: 10 points

**Business Relationship** (0-20 points):
- Strategic partner: 20 points
- Key customer: 18 points
- Active prospect: 15 points
- Cold lead: 5 points

**Strategic Tag** (0-10 points):
- Manually flagged as strategic

### 2️⃣ Urgency Score (0-100)

**Deadline Proximity** (0-50 points):
- Overdue: 50 points
- Today (< 4 hours): 45 points
- Tomorrow (< 24 hours): 35 points
- This week: 25 points
- Next week: 15 points
- Future: 5 points

**Expected Response Time** (0-30 points):
- Immediate (< 4 hours): 30 points
- Same day: 20 points
- 2 days: 10 points

**Urgency Keywords** (0-20 points):
- "urgent", "asap", "immediate": 10 points
- "critical", "deadline": 8 points
- "today", "now": 7 points
- "emergency": 10 points

---

## Quadrant Classification

```
           URGENT              NOT URGENT
        ┌──────────────┬──────────────────┐
        │              │                  │
I       │  Q1: DO NOW  │  Q2: SCHEDULE    │
M       │  🔴 100% wt  │  🟡 70% weight   │
P       │              │                  │
O       ├──────────────┼──────────────────┤
R       │              │                  │
T       │ Q3: DELEGATE │  Q4: ELIMINATE   │
A       │ 🟢 40% wt    │  ⚪ 10% weight   │
N       │              │                  │
T       └──────────────┴──────────────────┘
```

**Q1: DO NOW** (Important + Urgent)
- Immediate action required
- Highest priority
- Should be < 3-5 items at any time

**Q2: SCHEDULE** (Important + Not Urgent)
- Plan time blocks
- Strategic work lives here
- Most valuable long-term items

**Q3: DELEGATE** (Not Important + Urgent)
- Someone else should do this
- Auto-suggest delegation
- Free up Allan's time

**Q4: ELIMINATE** (Not Important + Not Urgent)
- Noise, spam, FYIs
- Auto-archive after 48 hours
- Never surface these

---

## What Gets Prioritized

### ✅ Emails
- Revenue potential (from sender/company)
- Sender importance score
- Keywords (urgent, asap, deadline)
- Thread activity (responses, mentions)
- Labels (important, starred)

### ✅ Tasks
- Explicit priority (critical, high, medium, low)
- Due dates
- Revenue connection (linked to deals)
- Dependencies (blockers)

### ✅ Meetings
- Start time proximity (urgent if < 2 hours)
- Attendee importance (who's in the meeting?)
- Meeting type (1:1, sales, strategic)
- Revenue connection (sales calls prioritized)

### ✅ Deals (HubSpot)
- Deal amount × close probability = revenue potential
- Close date proximity
- Deal stage (closing soon = urgent)
- Deal score (HubSpot's scoring)

---

## API Endpoints

### Get Top 10 Priorities

```bash
GET http://localhost:8002/api/priorities/surface?top_n=10&user=allan
```

**Response:**
```json
{
  "surfaced": [
    {
      "id": "deal_12345",
      "type": "deal",
      "title": "Acme Corp - Enterprise Plan",
      "priority": "🔴 DO NOW",
      "priority_score": 95.3,
      "importance": 90.0,
      "urgency": 85.0,
      "revenue_potential": 50000,
      "deadline": "2025-10-06T17:00:00Z",
      "context": {
        "amount": 50000,
        "stage": "negotiation",
        "probability": 80
      }
    },
    ...
  ],
  "submerged": {
    "Q1_DO_NOW": [...],
    "Q2_SCHEDULE": [...],
    "Q3_DELEGATE": [...],
    "Q4_ELIMINATE": [...]
  },
  "stats": {
    "total_items": 127,
    "surfaced_count": 10,
    "submerged_count": 117,
    "q1_count": 13,
    "q2_count": 34,
    "q3_count": 28,
    "q4_count": 52
  }
}
```

### Get Items by Quadrant

```bash
GET http://localhost:8002/api/priorities/quadrant/Q1_DO_NOW?user=allan
```

Returns all items in Q1 (DO NOW) quadrant.

### Get Priority Stats

```bash
GET http://localhost:8002/api/priorities/stats?user=allan
```

Returns distribution across quadrants.

---

## Integration with Unified Interface

The Robbie Unified Interface connects to Priority Surface API:

```javascript
// Fetch top 10 priorities
fetch('http://localhost:8002/api/priorities/surface?top_n=10')
  .then(res => res.json())
  .then(data => {
    // Display surfaced items at top
    renderPriorities(data.surfaced);
    
    // Show submerged count (collapsible)
    renderSubmergedCount(data.stats);
  });
```

**UI Layout:**
```
┌─────────────────────────────────────────┐
│  🎯 YOUR TOP 10 PRIORITIES              │
│  ┌────────────────────────────────┐    │
│  │ 1. 🔴 Deal closing - $50k      │    │
│  │ 2. 🔴 CEO email (urgent)       │    │
│  │ 3. 🔴 Meeting in 2 hours       │    │
│  │ ... (7 more)                   │    │
│  └────────────────────────────────┘    │
│                                         │
│  ▼ 117 more items (click to expand)    │
│     • 13 DO NOW                         │
│     • 34 SCHEDULE                       │
│     • 28 DELEGATE                       │
│     • 52 ELIMINATE (auto-archived)      │
└─────────────────────────────────────────┘
```

---

## Auto-Actions

### Q4 Auto-Archive
Items in Q4 (Eliminate) are **automatically archived** after 48 hours of inactivity.

### Q3 Auto-Delegate
Items in Q3 trigger **delegation suggestions**:
- "This looks urgent but not strategic - delegate to [person]?"

### Q1 Alerts
If Q1 has > 10 items, alert Allan:
- "Too many urgent items - consider delegating or rescheduling"

---

## Scoring Examples

### Example 1: High-Value Deal Closing Today
```
Deal: "Acme Corp - $50k contract"
- Revenue: $50k × 80% probability = $40k → 40 points (importance)
- Deadline: Today at 5pm → 45 points (urgency)
- Strategic: Yes → +10 points (importance)
Total Importance: 50
Total Urgency: 45
→ Quadrant: Q1 (DO NOW)
→ Priority Score: 95.3 🔴
```

### Example 2: Strategic Meeting Next Week
```
Meeting: "Q4 Planning with exec team"
- Participants: CEO, CTO, CFO → 30 points (importance)
- Strategic: Yes → 10 points (importance)
- Deadline: Next week → 15 points (urgency)
Total Importance: 60
Total Urgency: 15
→ Quadrant: Q2 (SCHEDULE)
→ Priority Score: 47.5 🟡
```

### Example 3: Newsletter Subscription
```
Email: "Weekly industry newsletter"
- Sender: Marketing automation → 5 points (importance)
- No deadline → 5 points (urgency)
Total Importance: 5
Total Urgency: 5
→ Quadrant: Q4 (ELIMINATE)
→ Priority Score: 3.2 ⚪
→ Auto-archive in 48 hours
```

---

## Configuration

### Thresholds

```python
# Eisenhower thresholds
IMPORTANT_THRESHOLD = 50  # Above = important
URGENT_THRESHOLD = 50     # Above = urgent

# Quadrant weights (for priority score calculation)
Q1_WEIGHT = 1.0   # DO NOW
Q2_WEIGHT = 0.7   # SCHEDULE
Q3_WEIGHT = 0.4   # DELEGATE
Q4_WEIGHT = 0.1   # ELIMINATE

# Auto-actions
Q4_AUTO_ARCHIVE_HOURS = 48    # Archive Q4 items after 48h
Q1_MAX_ITEMS_WARNING = 10     # Warn if > 10 items in Q1
```

### Custom Scoring

Override importance/urgency for specific items:

```python
# In priority_engine.py
item = {
    "id": "task_123",
    "type": "task",
    "title": "Review contract",
    "importance_override": 85,  # Force high importance
    "urgency_override": 90      # Force high urgency
}
```

---

## Real-Time Updates

Priority Surface subscribes to event bus for real-time updates:

```python
# When new email arrives
redis.publish("aurora:priority:update", json.dumps({
    "action": "new_item",
    "type": "email",
    "id": "email_123",
    "requires_rescore": True
}))
```

The web frontend listens and **auto-refreshes** top 10 when priorities change.

---

## Monitoring

### Prometheus Metrics

```
aurora_priorities_total{quadrant="q1"} 13
aurora_priorities_total{quadrant="q2"} 34
aurora_priorities_total{quadrant="q3"} 28
aurora_priorities_total{quadrant="q4"} 52

aurora_priorities_score_avg{type="email"} 42.3
aurora_priorities_score_avg{type="deal"} 78.9
```

### Grafana Dashboard

View priority distribution over time:
- Q1 item count (should stay < 10)
- Average priority scores by type
- Time spent in each quadrant
- Auto-archive rate (Q4)

---

## Best Practices

✅ **Keep Q1 small** - If > 10 items, something needs delegating
✅ **Live in Q2** - Strategic work happens here (schedule it!)
✅ **Delegate Q3** - Don't let urgent-but-not-important eat your time
✅ **Auto-eliminate Q4** - 48 hour auto-archive keeps inbox clean
✅ **Check priorities 3x/day** - Morning, noon, end of day
✅ **Revenue first** - High $ deals always surface to the top
✅ **Trust the system** - If it's not in top 10, it can wait

---

## Summary

🎯 **Surface** the top 10 priorities
🌊 **Submerge** everything else (grouped by quadrant)
📊 **Eisenhower Matrix** classification
🔴 **DO NOW** - Important + Urgent
🟡 **SCHEDULE** - Important + Not Urgent
🟢 **DELEGATE** - Not Important + Urgent
⚪ **ELIMINATE** - Auto-archive after 48 hours
💰 **Revenue-driven** - High $ deals always surface
⚡ **Real-time** - Updates via event bus
📈 **Monitored** - Grafana dashboard

**Allan only sees what matters. Everything else fades away.** ✨
