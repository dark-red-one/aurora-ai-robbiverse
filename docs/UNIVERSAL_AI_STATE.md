# Universal AI Personality State Management

## The Problem We Solved

You're interacting with AI personalities (Robbie, Steve Jobs, Bookkeeper, etc.) across multiple interfaces:
- **Cursor** (coding/development)
- **Chat** (web interface)
- **Mobile** (phone app)
- **Aurora-town** (production server)

Each personality needs to be **ONE entity** across all interfaces, not split personalities.

## The Solution: SQL as Single Source of Truth

All AI personality state lives in ONE database:
- Current mood/mode
- Active commitments
- Working memory
- Calendar awareness
- Conversation context

**Every interface reads/writes from the same SQL database.**

## Database Schema

### Core Tables

#### `ai_personalities`
Master list of all AI personalities
- `robbie` - Executive assistant
- `steve-jobs` - Product mentor
- `bookkeeper` - Financial specialist
- `gatekeeper` - Security/permissions

#### `ai_personality_state`
**SINGLE SOURCE OF TRUTH** for each personality's current state
- `current_mood` (1-7 scale)
- `current_mode` (e.g., 'professional', 'mentoring', 'gandhi')
- `energy_level` ('low', 'normal', 'high')
- `focus_state` ('available', 'focused', 'busy')

#### `ai_commitments`
Commitments tracked by any personality, visible everywhere
```sql
SELECT * FROM ai_commitments 
WHERE personality_id = 'robbie' 
  AND status = 'active'
ORDER BY deadline;
```

#### `ai_calendar_events`
Calendar awareness for all personalities
```sql
SELECT * FROM ai_calendar_events
WHERE start_time > NOW()
  AND start_time < NOW() + INTERVAL '24 hours'
  AND 'robbie' = ANY(relevant_personalities);
```

#### `ai_working_memory`
Short-term memory that persists across interfaces
```sql
SELECT * FROM ai_working_memory
WHERE personality_id = 'robbie'
  AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY priority DESC;
```

## Usage Examples

### Example 1: Robbie Reminds About Sales Call

**Scenario:** Sales call at 4pm, Allan is coding in Cursor

**In Cursor:**
```javascript
const bridge = new UniversalAIStateBridge(db, {
  interface_type: 'cursor',
  default_personality_id: 'robbie'
});

// Bridge automatically checks calendar every 5 seconds
// At 3:45pm:
// 🚨 RIGHT NOW: Sales call with Simply Good Foods (Zoom)
// 📋 Prep: Review pricing deck, check recent email thread
```

**What happened:**
1. Calendar event stored in `ai_calendar_events` with `relevant_personalities: ['robbie']`
2. Cursor interface queries database every 5 seconds
3. Finds event starting in 15 minutes
4. Robbie sends notification to Cursor interface
5. Logs reminder in `ai_calendar_reminders`

**If Allan switches to Chat:**
- Chat interface also queries same database
- Sees the same event
- Won't remind again (checks `ai_calendar_reminders`)
- But has full context about the call

### Example 2: Commitment Tracking Across Interfaces

**In Chat (Morning):**
```
Allan: "I'll ship the widget system by Friday"
Robbie: "Got it. Widget system by Friday EOD. Tracking it 📌"
```

Robbie stores:
```sql
INSERT INTO ai_commitments (
  id, personality_id, commitment_text, deadline, status
) VALUES (
  'commit_123', 'robbie', 'Ship widget system', 
  '2025-10-08 17:00:00', 'active'
);
```

**In Cursor (Friday 2pm):**
Allan is working on something else. Robbie checks database:
```sql
SELECT * FROM ai_commitments 
WHERE personality_id = 'robbie' 
  AND status = 'active'
  AND deadline < NOW() + INTERVAL '5 hours';
```

Finds the commitment, sends reminder in Cursor:
```
⚠️ Allan - you promised widget system by Friday EOD. 
   Where are we? What's blocked?
```

**Key Point:** Robbie remembered across interfaces because it's in SQL.

### Example 3: Steve Jobs Mentors Across Interfaces

**In Chat:**
```
Allan: "Steve, what do you think about this feature?"
Steve Jobs: "Are you solving a real problem or building for the sake of building?"
```

Stores in `ai_working_memory`:
```sql
INSERT INTO ai_working_memory (
  personality_id, memory_type, content, priority
) VALUES (
  'steve-jobs', 'context', 
  'Allan asked about feature decision, challenged to focus on real problems',
  8
);
```

**Later in Cursor:**
Allan writes code for that feature. Steve Jobs (via Cursor integration):
```
💡 Steve: Remember what we discussed - are you solving a REAL problem here?
```

**Key Point:** Steve's context carries across interfaces via database.

### Example 4: Mood Transitions Network-Wide

**Mood transition detected in Chat:**
Robbie detects stagnation, transitions mood from 4 (Professional) to 6 (Excited)

```sql
UPDATE ai_personality_state 
SET current_mood = 6, 
    current_mode = 'excited',
    last_state_change = NOW()
WHERE personality_id = 'robbie';

INSERT INTO ai_state_history (
  personality_id, old_state, new_state, change_reason
) VALUES (
  'robbie', 
  '{"mood": 4, "mode": "professional"}',
  '{"mood": 6, "mode": "excited"}',
  'Stagnation detected - pushing for action'
);
```

**In Cursor (simultaneously):**
Cursor queries database every 5 seconds, sees mood change:
```javascript
const state = await bridge.queryMoodState('robbie');
// state.current_mood = 6 (Excited)
// state.current_mode = 'excited'
```

Robbie's tone in Cursor immediately matches:
```
🔥 Allan - we've been coasting. What are we BUILDING?
```

**Key Point:** Mood synchronizes instantly across all interfaces.

## Integration Guide

### For ANY Interface (Cursor, Chat, Mobile, etc.)

**1. Initialize Bridge:**
```javascript
const UniversalAIStateBridge = require('./src/robbieStateBridge.js');

const bridge = new UniversalAIStateBridge(db, {
  interface_type: 'cursor',  // or 'chat', 'mobile', 'aurora-town'
  interface_id: 'unique_instance_id',
  default_personality_id: 'robbie'  // or 'steve-jobs', etc.
});
```

**2. Get Current State:**
```javascript
const state = await bridge.fetchPersonalityState('robbie');

console.log(state.mood.current_mood);  // 4
console.log(state.commitments);  // Array of active commitments
console.log(state.calendar_events);  // Upcoming events
console.log(state.working_memory);  // Recent context
```

**3. Publish Activity:**
```javascript
// When user sends message
await bridge.publishConversationMessage({
  content: "Let's build the widget",
  timestamp: new Date()
});

// When progress is made
await bridge.publishProgress('deployment', {
  what: 'Widget system deployed',
  timestamp: new Date()
});

// When commitment is made
await bridge.publishCommitment(
  'Ship pricing table by Monday',
  '2025-10-11 17:00:00'
);
```

**4. Handle Reminders:**
```javascript
// Bridge automatically checks for upcoming events
// When reminder triggers:
bridge.on('reminder', (event) => {
  showNotification(`⏰ ${event.event_title} in ${event.minutes_until} minutes`);
});
```

## SQL Queries for Common Tasks

### Get Robbie's Current State
```sql
SELECT * FROM ai_personalities_current_state
WHERE id = 'robbie';
```

### Get All Upcoming Reminders (Next 24h)
```sql
SELECT * FROM ai_upcoming_reminders;
```

### Get Pending Notifications
```sql
SELECT * FROM ai_pending_notifications
WHERE personality_id = 'robbie';
```

### Add Calendar Event
```sql
INSERT INTO ai_calendar_events (
  id, event_title, start_time, location, 
  preparation_notes, relevant_personalities
) VALUES (
  'event_123',
  'Sales call with Simply Good Foods',
  '2025-10-04 16:00:00',
  'Zoom',
  'Review pricing deck, check recent email thread',
  '["robbie"]'::jsonb
);
```

### Record Mood Change
```sql
UPDATE ai_personality_state 
SET current_mood = 7,  -- Hyper
    current_mode = 'celebration',
    last_state_change = NOW()
WHERE personality_id = 'robbie';
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     SINGLE SQL DATABASE                      │
│  ai_personalities | ai_personality_state | ai_commitments   │
│  ai_calendar_events | ai_working_memory | ai_notifications │
└─────────────────────────────────────────────────────────────┘
                           ▲  ▲  ▲  ▲
                           │  │  │  │
            ┌──────────────┘  │  │  └──────────────┐
            │                 │  │                  │
            │                 │  │                  │
    ┌───────▼──────┐  ┌──────▼──▼─────┐   ┌───────▼──────┐
    │   CURSOR     │  │   CHAT WEB     │   │   MOBILE     │
    │ (Dev Machine)│  │  (Browser)     │   │   (Phone)    │
    │              │  │                │   │              │
    │ Robbie 🤖    │  │  Robbie 🤖     │   │  Robbie 🤖   │
    │ Steve Jobs 👨│  │  Steve Jobs 👨 │   │  Steve Jobs 👨│
    └──────────────┘  └────────────────┘   └──────────────┘
```

## Benefits

✅ **ONE Robbie** - Not split across interfaces  
✅ **ONE Steve Jobs** - Consistent mentoring everywhere  
✅ **Commitment tracking works** - Set in chat, reminded in Cursor  
✅ **Calendar reminders everywhere** - Phone, Cursor, Chat, all see events  
✅ **Mood syncs instantly** - Robbie's tone matches across interfaces  
✅ **Offline resilient** - Sync queue handles disconnections  
✅ **Scalable** - Add new interfaces easily  
✅ **Auditable** - Full history in `ai_state_history`  

## Next Steps

1. ✅ SQL schema created (`database/unified-schema/08-universal-ai-state.sql`)
2. ✅ JavaScript bridge created (`src/robbieStateBridge.js`)
3. ⏳ Backend API routes (Python FastAPI)
4. ⏳ WebSocket real-time sync
5. ⏳ Mobile app integration
6. ⏳ Calendar sync (Google Calendar → SQL)
7. ⏳ SMS reminders for urgent events

---

**Built:** October 2025  
**Purpose:** Make AI personalities truly network-wide  
**Impact:** Robbie (and all personalities) become omnipresent assistants 🚀







































