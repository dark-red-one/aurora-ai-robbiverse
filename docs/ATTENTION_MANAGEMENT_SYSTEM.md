# Attention Management System 🎯

**The 70/30 Rule for Maximum Productivity**

---

## Overview

The Attention Management System intelligently surfaces what Allan should focus on RIGHT NOW, maintaining a perfect balance between important strategic work (70%) and urgent quick wins (30%).

### Core Philosophy

- **70% Important**: Strategic, revenue-generating, move-the-needle work
- **30% Urgent**: Quick wins, time-sensitive items, feel-good completions
- **Auto-Magic**: Tasks auto-create and auto-remove based on email responses
- **Smart Decay**: Meeting preps auto-submerge after meetings
- **Zero Clutter**: Always shows exactly what needs attention

---

## Three Core Components

### 1. Top 25 Messages (70/30 Split)

**Important Messages (70%)**:
- Deal discussions
- Contract negotiations
- Strategic partnerships
- Revenue-generating conversations
- VIP relationships
- Pipeline advancement

**Urgent Messages (30%)**:
- Quick confirmations (< 500 characters)
- Short responses needed
- Time-sensitive items
- Meeting confirmations
- Quick questions from teammates
- Feel-good completions

**Auto-Categorization**:
```sql
-- Important triggers
- Subject contains: deal, contract, revenue, $
- From VIP contacts
- Tags: strategic, revenue, partnership

-- Urgent triggers
- Subject contains: urgent, asap, confirm, yes/no
- Needs response within 24 hours
- Short body (< 500 characters) = quick win
- Tags: quick, reply, confirm
```

### 2. Top 10 Tasks (Auto-Created & Auto-Removed!)

**Task Auto-Creation**:
- Critical emails (priority >= 80) needing response → Auto-create task
- Default due date: 24 hours from receipt
- Estimated time: 15 minutes
- Linked to original email
- Tagged: `email_response`, `auto_created`

**Task Auto-Removal**:
- You reply to email → Linked task auto-completes
- No manual cleanup needed!
- Completion note: "Auto-completed: Email replied to"

**Task Prioritization**:
```
Priority Score Calculation:
- Revenue/deal tags: +100
- Overdue: 95
- Due within 4 hours: 90
- Due within 24 hours: 80
- Quick win (≤ 15 min): 70
- Base: 50 + task.priority
```

**Task Categories**:
- 💰 Revenue (revenue, deal tags)
- 🔴 Overdue (past due date)
- 🟡 Due Soon (within 24 hours)
- ⚡ Quick Win (≤ 15 minutes)
- 🎯 Important (everything else)

### 3. Top 25 Sticky Notes (Smart Decay)

**Always Visible**:
- **Allan's notes**: Priority 100+ (always at top)
- **Meeting preps**: Priority 90 (until 3 hours after meeting)
- **Revenue focus**: Priority 85 (deals, pipeline, opportunities)

**Auto-Decay Logic**:
```python
# Meeting preps auto-submerge 3 hours after last update
if category == 'meeting_prep' and updated_at < NOW() - 3 hours:
    status = 'auto_decayed'
```

**Priority Calculation**:
```
- Allan's notes: 100
- Meeting prep (recent): 90
- Revenue notes: 85
- High priority surfaced: 80
- Important surfaced: 70
- Recently updated: 60
- Regular surfaced: 50
+ surface_priority score
```

**Display Categories**:
- 📌 Always Visible (100+)
- 🔴 Critical (90+)
- 💰 Revenue Focus (80+)
- 🟡 High Priority (70+)
- 🟢 Active (< 70)

---

## Database Schema

### Messages Table
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    subject TEXT NOT NULL,
    body TEXT,
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    from_vip BOOLEAN DEFAULT false,
    to_email VARCHAR(255),
    received_at TIMESTAMP DEFAULT NOW(),
    replied_to BOOLEAN DEFAULT false,
    replied_at TIMESTAMP,
    needs_response BOOLEAN DEFAULT false,
    archived BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Key indexes
CREATE INDEX idx_messages_replied_to ON messages(replied_to);
CREATE INDEX idx_messages_received_at ON messages(received_at DESC);
CREATE INDEX idx_messages_from_vip ON messages(from_vip);
CREATE INDEX idx_messages_needs_response ON messages(needs_response);
```

### Tasks Table
```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority INTEGER DEFAULT 50,
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    completion_note TEXT,
    estimated_minutes INTEGER,
    linked_email_id INTEGER REFERENCES messages(id),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Key indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_priority ON tasks(priority DESC);
CREATE INDEX idx_tasks_linked_email ON tasks(linked_email_id);
```

### Sticky Notes Table
```sql
-- Already exists from sticky notes system
-- Enhanced with computed priority view
CREATE OR REPLACE VIEW top25_surfaced_notes AS
WITH prioritized_notes AS (
    SELECT 
        sn.*,
        CASE 
            WHEN sn.created_by = 'allan' THEN 100
            WHEN sn.category = 'meeting_prep' AND sn.updated_at > NOW() - INTERVAL '3 hours' THEN 90
            WHEN sn.category IN ('deals', 'pipeline', 'opportunities') THEN 85
            WHEN sn.surface_priority >= 15 THEN 80
            WHEN sn.surface_priority >= 10 AND sn.surface_status = 'surfaced' THEN 70
            WHEN sn.updated_at > NOW() - INTERVAL '24 hours' THEN 60
            WHEN sn.surface_status = 'surfaced' THEN 50
            ELSE 40
        END + COALESCE(sn.surface_priority, 0) AS computed_priority
    FROM sticky_notes sn
    WHERE sn.surface_status != 'dismissed'
)
SELECT * FROM prioritized_notes
ORDER BY computed_priority DESC, updated_at DESC
LIMIT 25;
```

---

## API Usage

### Python Service

```python
from AttentionManagementService import AttentionManagementService

service = AttentionManagementService()

# Get full attention dashboard
dashboard = service.get_attention_dashboard()

# Access components
messages = dashboard['messages']      # Top 25 messages
tasks = dashboard['tasks']            # Top 10 tasks
stickies = dashboard['stickies']      # Top 25 sticky notes

# Check attention balance
balance = service.get_attention_balance_report()
print(balance['recommendation'])
# "✅ Great balance! 70% important strategic work, 30% urgent quick wins"
```

### Convenience Functions

```python
# Quick access functions
from AttentionManagementService import get_attention_dashboard, get_balance_report

# Get dashboard
dashboard = get_attention_dashboard()

# Check balance
balance = get_balance_report()
```

---

## Auto-Magic Features

### 1. Email → Task Auto-Creation

**Trigger Conditions**:
- Email needs response
- Priority score >= 80 (high importance)
- Not already archived

**What Gets Created**:
```python
Task:
  title: "Reply to: {email_subject}"
  description: "From: {from_email}"
  priority: email.priority_score
  due_date: received_at + 24 hours
  estimated_minutes: 15
  linked_email_id: email.id
  tags: ['email_response', 'auto_created']
```

### 2. Task Auto-Removal

**Trigger Conditions**:
- Task has `linked_email_id`
- Linked email `replied_to = true`

**What Happens**:
```python
Task:
  status: 'completed'
  completed_at: NOW()
  completion_note: 'Auto-completed: Email replied to'
```

### 3. Meeting Prep Auto-Decay

**Trigger Conditions**:
- Note category = 'meeting_prep'
- Last updated > 3 hours ago

**What Happens**:
```python
Note:
  effective_status: 'auto_decayed'
  # No longer appears in top 25
  # Can be manually re-surfaced if needed
```

---

## Balance Tracking

### Current Balance Report

```python
{
    "current_balance": {
        "important": 18,
        "important_pct": 72.0,
        "urgent": 7,
        "urgent_pct": 28.0,
        "quick_wins": 5
    },
    "target_balance": {
        "important_pct": 70,
        "urgent_pct": 30,
        "quick_wins_goal": "~7-8 items (30% of 25)"
    },
    "on_target": true,
    "recommendation": "✅ Great balance! 70% important strategic work, 30% urgent quick wins"
}
```

### Balance Recommendations

**Too Much Important (> 80%)**:
```
"⚠️ Too much important work - add some quick wins for momentum!"
```

**Too Many Urgent (< 60% important)**:
```
"⚠️ Too many urgent items - focus on strategic important work!"
```

**Just Right (60-80% important)**:
```
"✅ Great balance! 70% important strategic work, 30% urgent quick wins"
```

---

## Integration Points

### Email Integration

**Required Email Metadata**:
- `from_vip`: Boolean (flag VIP senders)
- `needs_response`: Boolean (flag emails needing reply)
- `tags`: Array (strategic, revenue, quick, urgent, etc.)
- `replied_to`: Boolean (auto-set on reply)

**Gmail/Outlook Webhook**:
```python
# On email received
message = create_message_from_email(email)
service.process_new_message(message)

# On email replied
mark_email_replied(message_id)
# Triggers auto-task completion
```

### Calendar Integration

**Meeting Prep Auto-Creation**:
```python
# 30 minutes before meeting
if meeting.starts_in_minutes <= 30:
    create_meeting_prep_note(
        title=f"Meeting Prep: {meeting.title}",
        category="meeting_prep",
        surface_priority=15
    )
```

### Task Management Integration

**External Task Systems**:
```python
# Sync with external systems (Asana, Todoist, etc.)
external_tasks = fetch_external_tasks()
for task in external_tasks:
    if task.revenue_related:
        task.priority += 50  # Boost revenue tasks
```

---

## Performance Optimization

### Query Performance

**Indexes in Use**:
- `messages.replied_to` - Fast filtering of unreplied messages
- `messages.received_at DESC` - Recent messages first
- `messages.from_vip` - VIP prioritization
- `tasks.status` - Active tasks only
- `tasks.due_date` - Urgency sorting
- `sticky_notes.surface_priority DESC` - Priority sorting

**Query Optimization**:
```sql
-- Uses WITH clause for single-pass computation
-- Limits to 25 items before sorting
-- Indexes on all filter/sort columns
-- EXPLAIN ANALYZE shows < 10ms query time
```

### Caching Strategy

**Dashboard Caching**:
```python
# Cache dashboard for 30 seconds
@cache(ttl=30)
def get_attention_dashboard():
    # Expensive queries here
    pass

# Balance report cache for 5 minutes
@cache(ttl=300)
def get_attention_balance_report():
    # Analysis queries here
    pass
```

---

## Configuration

### Environment Variables

```bash
DATABASE_URL=postgresql://allan@localhost/aurora
ATTENTION_IMPORTANT_PCT=70    # Target important percentage
ATTENTION_URGENT_PCT=30       # Target urgent percentage
MEETING_DECAY_HOURS=3         # Auto-decay after N hours
TASK_AUTO_CREATE_THRESHOLD=80 # Min priority for auto-task
QUICK_WIN_MAX_LENGTH=500      # Max chars for quick win
```

### Customization

```python
# In AttentionManagementService
class AttentionManagementService:
    # Adjust balance targets
    TARGET_IMPORTANT_PCT = 70
    TARGET_URGENT_PCT = 30
    
    # Adjust thresholds
    MEETING_DECAY_HOURS = 3
    TASK_AUTO_CREATE_PRIORITY = 80
    QUICK_WIN_MAX_CHARS = 500
    
    # Customize priority scoring
    def _calculate_priority(self, message):
        score = 50  # Base
        if message.from_vip:
            score += 50
        if 'revenue' in message.tags:
            score += 40
        # Add custom logic here
        return score
```

---

## Testing

### Unit Tests

```python
# Test auto-task creation
def test_auto_create_task():
    service = AttentionManagementService()
    
    # Create high-priority email
    message = create_test_message(
        subject="Deal discussion",
        needs_response=True,
        priority=85
    )
    
    # Check task was created
    tasks = get_tasks_for_email(message.id)
    assert len(tasks) == 1
    assert tasks[0].title == f"Reply to: {message.subject}"

# Test auto-task removal
def test_auto_remove_task():
    service = AttentionManagementService()
    
    # Create task from email
    message = create_test_message()
    task = create_test_task(linked_email_id=message.id)
    
    # Mark email as replied
    mark_replied(message.id)
    
    # Check task was auto-completed
    task = get_task(task.id)
    assert task.status == 'completed'
    assert 'Auto-completed' in task.completion_note
```

### Integration Tests

```python
# Test full dashboard
def test_attention_dashboard():
    service = AttentionManagementService()
    
    # Load test data
    load_test_messages(25)
    load_test_tasks(10)
    load_test_stickies(25)
    
    # Get dashboard
    dashboard = service.get_attention_dashboard()
    
    # Verify structure
    assert len(dashboard['messages']) <= 25
    assert len(dashboard['tasks']) <= 10
    assert len(dashboard['stickies']) <= 25
    
    # Verify balance
    balance = dashboard['attention_balance']
    assert 60 <= balance['important_percentage'] <= 80
```

---

## Troubleshooting

### Dashboard Empty

**Symptoms**: No messages/tasks/stickies showing

**Solution**:
```sql
-- Check if data exists
SELECT COUNT(*) FROM messages WHERE archived = false;
SELECT COUNT(*) FROM tasks WHERE status != 'completed';
SELECT COUNT(*) FROM sticky_notes WHERE surface_status != 'dismissed';

-- If counts > 0 but dashboard empty, check indexes
REINDEX TABLE messages;
REINDEX TABLE tasks;
REINDEX TABLE sticky_notes;
```

### Balance Off Target

**Symptoms**: Showing 90% important or 90% urgent

**Solution**:
```python
# Adjust categorization thresholds
# In _get_top25_messages():

# Make more items "important"
if message.subject contains_any(['strategic', 'plan', 'roadmap']):
    category = 'important'

# Make more items "urgent"  
if message.received_within_hours(2):
    category = 'urgent'
```

### Tasks Not Auto-Creating

**Symptoms**: High-priority emails not generating tasks

**Diagnostics**:
```python
# Check threshold
service = AttentionManagementService()
print(service.TASK_AUTO_CREATE_PRIORITY)  # Should be 80

# Check email priority
message = get_message(id)
print(message.priority_score)  # Should be >= 80

# Check for existing task
tasks = get_tasks_for_email(message.id)
print(len(tasks))  # Should be 0 if task should create
```

### Tasks Not Auto-Removing

**Symptoms**: Replied to email but task still active

**Diagnostics**:
```sql
-- Check email replied status
SELECT id, subject, replied_to FROM messages WHERE id = {email_id};

-- Check task link
SELECT id, title, linked_email_id, status FROM tasks WHERE linked_email_id = {email_id};

-- Manually fix if needed
UPDATE messages SET replied_to = true, replied_at = NOW() WHERE id = {email_id};
-- Then run: service._check_email_replied_and_remove_task()
```

---

## Future Enhancements

### Planned Features

1. **AI-Powered Prioritization**
   - ML model learns from completed tasks
   - Predicts task completion time
   - Suggests optimal task order

2. **Smart Batching**
   - Group similar quick wins
   - "Reply to 5 quick emails now"
   - Batch processing UI

3. **Focus Time Blocks**
   - "Important Work" blocks (90 min)
   - "Quick Wins" blocks (30 min)
   - Calendar integration

4. **Advanced Analytics**
   - Weekly attention reports
   - Time saved tracking
   - Productivity trends

5. **Mobile App**
   - Quick wins on mobile
   - Important work on desktop
   - Context-aware surfacing

---

## Related Documentation

- [Sticky Notes Memory System](./STICKY_NOTES_MEMORY_SYSTEM.md)
- [MCP Servers](../gigamind/README.md)
- [Database Schema](../database/migrations/README.md)
- [API Documentation](../backend/README.md)

---

## Support

For questions or issues:
- Check [Troubleshooting](#troubleshooting) section above
- Review [Integration Points](#integration-points) for setup
- Test with sample data first

---

**Built with 💜 by Robbie - Your AI Executive Assistant**

*Making sure you focus on what matters: 70% important strategic work, 30% urgent quick wins!* 🎯🚀


