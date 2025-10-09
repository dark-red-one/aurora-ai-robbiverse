# 🎯 Tri-Level Priority System

## The Three Priority Domains

Every item in the Aurora ecosystem belongs to one of three domains:

```
┌─────────────────────────────────────────────────────────┐
│                    HUMAN PRIORITIES                      │
│         (What Allan MUST do himself)                     │
│  ┌────────────────────────────────────────────────┐    │
│  │ • Strategic decisions                           │    │
│  │ • High-stakes negotiations                      │    │
│  │ • C-level meetings                              │    │
│  │ • Critical client conversations                 │    │
│  │ • Team leadership moments                       │    │
│  │ • Creative/strategic thinking                   │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  🎯 Surface these to Allan's attention               │
│  ⚠️ NEVER automate these                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    AGENT PRIORITIES                      │
│         (What Robbie does FOR Allan)                     │
│  ┌────────────────────────────────────────────────┐    │
│  │ • Email triage & drafting                       │    │
│  │ • Meeting prep & research                       │    │
│  │ • Data analysis & reporting                     │    │
│  │ • Follow-ups & reminders                        │    │
│  │ • CRM updates                                   │    │
│  │ • Content generation                            │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  🤖 Robbie executes these autonomously                │
│  📊 Report results to Allan                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     SELF PRIORITIES                      │
│         (What Robbie does FOR Robbie)                    │
│  ┌────────────────────────────────────────────────┐    │
│  │ • System health checks                          │    │
│  │ • Database optimization                         │    │
│  │ • Model fine-tuning                             │    │
│  │ • Learning from outcomes                        │    │
│  │ • Weight adjustments                            │    │
│  │ • Cache management                              │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  🔧 Silent background maintenance                     │
│  🧠 Self-improvement & learning                       │
└─────────────────────────────────────────────────────────┘
```

---

## How Classification Works

### Task Classification Algorithm

```python
def classify_priority_domain(task: Dict) -> str:
    """
    Classify task into one of three domains:
    - human: Requires Allan's direct attention/action
    - agent: Robbie can handle autonomously
    - self: Robbie's internal maintenance
    """
    
    # HUMAN PRIORITIES (requires human judgment)
    human_indicators = [
        task.get('revenue_potential', 0) > 50000,  # High $ deals
        task.get('sender_tier') in ['founder', 'c_level'],  # Senior execs
        'strategic' in task.get('tags', []),
        'decision' in task.get('type'),
        'negotiation' in task.get('type'),
        task.get('risk_level', 0) > 7,  # High risk
        'approval_required' in task.get('flags', [])
    ]
    
    if any(human_indicators):
        return 'human'
    
    # SELF PRIORITIES (internal system tasks)
    self_indicators = [
        task.get('source') == 'system',
        task.get('category') in ['maintenance', 'optimization', 'learning'],
        task.get('task_type').startswith('system_'),
        'internal' in task.get('tags', [])
    ]
    
    if any(self_indicators):
        return 'self'
    
    # AGENT PRIORITIES (everything else)
    return 'agent'
```

---

## Human Priorities: Surface Strategy

**Goal**: Show Allan ONLY what requires his attention

### What Gets Surfaced

1. **High-Value Deals** ($50k+)
   ```
   🔴 Acme Corp deal - $120k - Needs your approval
   💰 Close date: Today at 5pm
   📊 Probability: 75%
   🎯 Action: Review contract terms
   ```

2. **Strategic Decisions**
   ```
   🟡 Q4 Product Roadmap - Your input needed
   👥 Waiting on your decision
   ⏰ Team blocked until you decide
   ```

3. **VIP Communications**
   ```
   🔴 Email from Peter Rahal (CEO, RXBAR)
   📧 Subject: Partnership discussion
   🎯 Suggested action: Reply within 2 hours
   ```

4. **Crisis/Urgent**
   ```
   🔴 Server outage - Customer facing
   ⚠️ Requires immediate decision
   💬 Team waiting on Slack
   ```

### What Gets Submerged

Everything else! Agent and Self priorities run in the background.

---

## Agent Priorities: Autonomous Execution

**Goal**: Robbie handles routine work WITHOUT bothering Allan

### What Robbie Does Autonomously

1. **Email Triage** (auto mode > 7)
   ```python
   - Read incoming emails
   - Categorize by importance
   - Archive newsletters/spam
   - Flag urgent for Allan
   - Draft replies for low-stakes emails
   ```

2. **Meeting Prep** (auto mode > 6)
   ```python
   - Research attendees (LinkedIn, CRM)
   - Pull relevant context (previous conversations)
   - Generate agenda suggestions
   - Prepare briefing doc
   - Notify Allan 15 min before
   ```

3. **CRM Updates** (auto mode > 8)
   ```python
   - Update deal stages based on emails
   - Log interactions automatically
   - Track commitments from meetings
   - Flag at-risk deals
   ```

4. **Follow-ups** (auto mode > 7)
   ```python
   - Send follow-up emails after 3 days
   - Reminder emails for pending responses
   - Meeting scheduling on behalf of Allan
   ```

### Confidence Thresholds

```python
AUTO_MODE_THRESHOLDS = {
    10: 0.5,  # Full auto - 50% confidence needed
    9:  0.6,  # High auto - 60% confidence
    8:  0.7,  # Medium auto - 70% confidence
    7:  0.8,  # Low auto - 80% confidence
    6:  0.9,  # Manual - 90% confidence
    5:  1.0,  # Always ask - 100% (impossible)
}
```

**Example:**
```python
task = {
    'type': 'email_draft',
    'confidence': 0.75,  # 75% confident reply is good
    'auto_mode': 8       # Allan has auto=8
}

threshold = AUTO_MODE_THRESHOLDS[8]  # 0.7 (70%)
if 0.75 >= 0.7:
    execute_task()  # ✅ Go ahead!
else:
    notify_allan_for_approval()  # ⚠️ Ask first
```

---

## Self Priorities: Silent Optimization

**Goal**: Robbie maintains & improves itself WITHOUT human intervention

### Background Tasks (Always Running)

1. **System Health Monitoring**
   ```python
   every 5 minutes:
     - Check database connections
     - Monitor API rate limits
     - Verify GPU availability
     - Test email/calendar access
   ```

2. **Performance Optimization**
   ```python
   every hour:
     - Analyze slow queries
     - Optimize indexes
     - Clear expired cache entries
     - Compress old logs
   ```

3. **Learning & Adaptation**
   ```python
   after each task:
     - Track success rate
     - Measure execution time
     - Adjust scoring weights
     - Update effort estimates
   ```

4. **Maintenance Windows**
   ```python
   every night at 3am:
     - Database backups
     - Log rotation
     - Model fine-tuning
     - Dependency updates
   ```

### Smart Resource Allocation

```python
def allocate_resources():
    """
    Robbie intelligently balances resources across priorities
    """
    
    # Human priorities: 60% of resources (respond fast!)
    human_queue.max_threads = 6
    human_queue.priority_boost = 2.0
    
    # Agent priorities: 35% of resources (get work done)
    agent_queue.max_threads = 3
    agent_queue.priority_boost = 1.0
    
    # Self priorities: 5% of resources (background only)
    self_queue.max_threads = 1
    self_queue.priority_boost = 0.5
    self_queue.only_during_idle = True
```

### Self-Improvement Cycle

```
┌─────────────────────────────────────┐
│   1. Execute Task                   │
│      (Agent priority)               │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│   2. Measure Outcome                │
│      • Success rate                 │
│      • Execution time               │
│      • Allan's feedback             │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│   3. Learn & Adjust (Self)          │
│      • Update scoring weights       │
│      • Refine effort estimates      │
│      • Improve prompts              │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│   4. Apply Learning                 │
│      Next task executes better!     │
└─────────────────────────────────────┘
```

---

## Practical Examples

### Example 1: Incoming Email Classification

```python
Email arrives: "Subject: $100k deal - need approval"

1. CLASSIFY DOMAIN
   - Revenue: $100k → HIGH
   - Keyword: "approval" → HUMAN REQUIRED
   → Domain: HUMAN

2. CALCULATE SCORES
   - Importance: 95 (high revenue)
   - Urgency: 85 (needs approval)
   - Quadrant: Q1 (DO NOW)

3. SURFACE TO ALLAN
   → Shows in top 10 priorities
   → Push notification sent
   → Flagged as "Needs your action"
```

### Example 2: Routine Follow-up

```python
Task: "Follow up on proposal sent 3 days ago"

1. CLASSIFY DOMAIN
   - Revenue: $5k → LOW
   - No approval needed
   → Domain: AGENT

2. CHECK CONFIDENCE
   - Confidence: 85%
   - Auto mode: 8 (threshold: 70%)
   - 85% > 70% ✅

3. EXECUTE AUTONOMOUSLY
   → Robbie drafts follow-up email
   → Sends on behalf of Allan
   → Logs action in CRM
   → Allan gets summary later
```

### Example 3: Database Optimization

```python
Task: "Optimize slow queries"

1. CLASSIFY DOMAIN
   - Source: system
   - Category: optimization
   → Domain: SELF

2. SCHEDULE EXECUTION
   - Current time: 2pm (work hours)
   - Only during idle? YES
   - High-priority tasks pending? YES
   → Defer until 3am tonight

3. EXECUTE SILENTLY
   → Runs at 3am
   → No notification to Allan
   → Logs success in system
```

---

## Priority Routing Matrix

```
                      HUMAN    AGENT    SELF
                      ─────    ─────    ────
Surface to UI          ✅       ❌       ❌
Push notifications     ✅       ❌       ❌
Requires approval      ✅       ⚠️       ❌
Auto-execute           ❌       ✅       ✅
Background only        ❌       ❌       ✅
Show in reports        ✅       ✅       ⚪
Track success          ✅       ✅       ✅
```

Legend:
- ✅ Always
- ❌ Never
- ⚠️ Depends on confidence threshold
- ⚪ Optional (internal metrics only)

---

## Integration with Priority Surface

The **Priority Surface Engine** (Eisenhower Matrix) focuses on **HUMAN priorities**:

```javascript
// Priority Surface API call
GET /api/priorities/surface?top_n=10

// Returns ONLY human priorities
{
  "surfaced": [
    {
      "domain": "human",
      "id": "deal_12345",
      "priority": "🔴 DO NOW",
      "title": "Acme deal - needs approval"
    }
  ],
  "agent_queue_count": 23,  // Running in background
  "self_queue_count": 5     // Maintenance tasks
}
```

**Agent priorities** run via the **Priorities Engine**:

```python
# priorities-engine.py runs every minute
while True:
    # Get top agent priority
    task = get_top_priority_task(domain='agent')
    
    if task.confidence > threshold:
        execute_task(task)
    
    await asyncio.sleep(60)
```

**Self priorities** run via **Node Health Monitor**:

```python
# health-monitor service (always running)
while True:
    # System maintenance
    check_database_health()
    optimize_performance()
    rotate_logs()
    
    # Learning
    adjust_weights_based_on_outcomes()
    
    await asyncio.sleep(300)  # Every 5 minutes
```

---

## Configuration

### Per-User Settings

```sql
CREATE TABLE user_priority_settings (
    user_id TEXT PRIMARY KEY,
    
    -- Domain allocation (% of attention)
    human_attention_pct INTEGER DEFAULT 80,   -- 80% focus on what Allan must do
    agent_visibility_pct INTEGER DEFAULT 15,  -- 15% awareness of Robbie's work
    self_visibility_pct INTEGER DEFAULT 5,    -- 5% system health awareness
    
    -- Auto mode thresholds
    agent_auto_threshold DECIMAL DEFAULT 0.7,
    
    -- Notification preferences
    notify_human_priorities BOOLEAN DEFAULT true,
    notify_agent_completions BOOLEAN DEFAULT false,
    notify_self_issues BOOLEAN DEFAULT true,
    
    -- Surfacing rules
    surface_count INTEGER DEFAULT 10,
    surface_only_q1 BOOLEAN DEFAULT false,
    
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Success Metrics by Domain

### Human Priorities
- **Response time**: How fast Allan acts on surfaced items
- **Accuracy**: % of surfaced items actually important
- **Completion rate**: % of Q1 items completed
- **False positives**: Items surfaced but not needed

### Agent Priorities
- **Autonomy rate**: % tasks executed without approval
- **Success rate**: % tasks completed successfully
- **Time saved**: Hours Allan didn't spend on routine work
- **Confidence growth**: Increasing auto mode over time

### Self Priorities
- **System uptime**: 99.9%+ availability
- **Performance**: Query response times
- **Learning rate**: Improvement in task scoring accuracy
- **Resource efficiency**: CPU/memory optimization

---

## Visual Dashboard

```
┌──────────────────────────────────────────────────────────┐
│  🎯 ALLAN'S TOP 10 PRIORITIES (Human Domain)             │
│  ┌────────────────────────────────────────────────┐     │
│  │ 1. 🔴 Acme Corp deal - needs approval ($120k)  │     │
│  │ 2. 🔴 Email from Peter Rahal (CEO RXBAR)       │     │
│  │ 3. 🟡 Q4 roadmap decision needed              │     │
│  │ ...                                            │     │
│  └────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  🤖 ROBBIE'S ACTIVE WORK (Agent Domain)                  │
│  ┌────────────────────────────────────────────────┐     │
│  │ • Drafting 3 email replies                     │     │
│  │ • Preparing for 2pm meeting                    │     │
│  │ • Updating HubSpot with latest interactions    │     │
│  │ • Analyzing inbox (47 new emails)              │     │
│  │                                                │     │
│  │ ▶ Show details                                 │     │
│  └────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  🔧 SYSTEM HEALTH (Self Domain)                          │
│  ┌────────────────────────────────────────────────┐     │
│  │ Status: ✅ All systems operational              │     │
│  │ Database: ✅ Optimized                          │     │
│  │ GPU Mesh: ✅ 3/3 nodes healthy                  │     │
│  │ API Limits: ✅ 23% used                         │     │
│  │                                                │     │
│  │ ▶ Advanced metrics                             │     │
│  └────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

---

## Summary

**Three Priority Domains:**

🎯 **HUMAN** - What Allan must do himself
- Surface to top 10
- Eisenhower Q1/Q2
- Push notifications
- Never automate

🤖 **AGENT** - What Robbie does for Allan
- Autonomous execution
- Confidence-based approval
- Background processing
- Report results

🔧 **SELF** - What Robbie does for Robbie
- Silent maintenance
- Learning & optimization
- System health
- No human interruption

**Result:** Allan sees ONLY what needs his attention. Everything else runs smoothly in the background. 🚀
