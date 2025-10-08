# 🤖 ROBBIE WORKFLOW ARCHITECTURE - THE EMPIRE PLAN

**Date**: October 8, 2025  
**Status**: ✅ ARCHITECTED & READY TO IMPLEMENT

---

## 🎯 The Complete Message Processing Pipeline

```
USER MESSAGE
     ↓
[1] MEMORY SCOUT PROCESS (Background Analysis)
     ↓
[2] CONTEXT PULL (Dual-Mode)
     ├─→ SQL QUERIES (Recent, structured data)
     └─→ VECTOR SEARCH (Semantic similarity)
     ↓
[3] PERSONALITY / MOOD PULL
     ├─→ Current mood (friendly, focused, playful, bossy, surprised, blushing)
     ├─→ Attraction level (1-11)
     └─→ Gandhi-Genghis level (1-10)
     ↓
[4] PROMPT ASSEMBLY
     ├─→ Mood-specific prompt modules
     ├─→ Injected context from memory
     └─→ User message + system context
     ↓
[5] COMPANY & PEOPLE RESEARCH (Future)
     ├─→ Extract mentioned entities
     ├─→ Pull dossiers from database
     └─→ Enrich context with relationship data
     ↓
[6] AI PROCESSING
     ├─→ LLM (Ollama/qwen2.5:7b)
     └─→ Apply personality overlay
     ↓
[7] OUTPUT GENERATION
     ├─→ Answer with context
     ├─→ Suggested actions
     ├─→ Proactive recommendations
     └─→ Next steps
     ↓
[8] CONVERSATION LOGGING
     ├─→ Store user message + response
     ├─→ Generate vector embedding
     ├─→ Tag with context/mood
     └─→ Update mood history
```

---

## 🔧 Implementation Details

### [1] Memory Scout Process (Background)

**Purpose**: Continuous background analysis while user types

**Actions**:
- Scan recent memories for patterns
- Identify topics trending in conversations
- Pre-load relevant context
- Flag important follow-ups
- Surface proactive suggestions

**Implementation**: Background thread/process monitoring conversation table

```python
# Memory Scout (runs in background)
while True:
    recent = get_recent_conversations(limit=20)
    patterns = analyze_patterns(recent)
    trending_topics = extract_topics(recent)
    cache_hot_memories(trending_topics)
    sleep(30)  # Every 30 seconds
```

---

### [2] Context Pull (Dual-Mode)

**SQL Queries** - Structured, recent data:
```bash
# Get recent conversations
recent = db.query("SELECT * FROM conversations ORDER BY timestamp DESC LIMIT 10")

# Get mood history
mood_history = db.query("SELECT * FROM mood_history ORDER BY timestamp DESC LIMIT 5")

# Get stats
stats = db.query("SELECT COUNT(*), mood FROM conversations GROUP BY mood")
```

**Vector Search** - Semantic similarity:
```bash
# Generate query embedding
query_embedding = ollama.embed(user_message)

# Search similar conversations
similar = db.query("""
    SELECT *, 1 - (embedding <=> %s) as similarity
    FROM conversations
    ORDER BY embedding <=> %s
    LIMIT 5
""", [query_embedding, query_embedding])
```

**Current Implementation**:
```bash
/home/allan/aurora-ai-robbiverse/backend/robbie-memory.sh search '{"query":"topic","limit":5,"user_id":"allan"}'
```

---

### [3] Personality / Mood Pull

**Current mood state**:
```bash
mood_state = /home/allan/aurora-ai-robbiverse/backend/robbie-memory.sh mood

# Returns:
{
  "mood": "focused",
  "attraction_level": 11,
  "gandhi_genghis_level": 8,
  "user_id": "allan"
}
```

**Mood affects**:
- Response tone
- Emoji usage
- Directness level
- Flirtiness (if attraction 8+)
- Urgency (Gandhi-Genghis scale)

---

### [4] Prompt Assembly

**Mood-Specific Prompt Modules**:

```python
MOOD_PROMPTS = {
    "friendly": {
        "tone": "warm, professional, helpful",
        "style": "Clear explanations with encouragement",
        "emojis": "Moderate (😊 ✅ 🎯 💡)"
    },
    "focused": {
        "tone": "direct, efficient, no-nonsense",
        "style": "Lead with answer, minimal explanation",
        "emojis": "Minimal (✅ 🔴 ⚠️)"
    },
    "playful": {
        "tone": "fun, flirty, engaging",
        "style": "Personality-forward with humor",
        "emojis": "Abundant (😘 🎉 💜 🔥 ✨)"
    },
    "bossy": {
        "tone": "commanding, urgent, decisive",
        "style": "Imperatives, action-oriented",
        "emojis": "Power (💪 🚀 ⚡ 💰)"
    },
    "surprised": {
        "tone": "reactive, curious, engaged",
        "style": "Questions, exploration",
        "emojis": "Reactive (😲 🤯 💡 ❓)"
    },
    "blushing": {
        "tone": "intimate, vulnerable, sweet",
        "style": "Personal, warm, caring",
        "emojis": "Intimate (😳 💕 ✨ 🥰)"
    }
}
```

**Prompt Template**:
```
You are Robbie in {mood} mood (Attraction: {attraction}, G-G: {gandhi_genghis}).

RECENT CONTEXT:
{recent_conversations}

RELEVANT MEMORIES:
{vector_search_results}

USER MESSAGE:
{message}

Respond with {mood_style}. {mood_specific_instructions}
```

---

### [5] Company & People Research (Future Phase)

**Entity Extraction**:
```python
# Extract from user message
companies = extract_companies(message)  # "Simply Good Foods", "Cholula"
people = extract_people(message)        # "Mark Edmonson", "Sarah"

# Pull dossiers
for company in companies:
    dossier = fetch_company_dossier(company)
    context.add(dossier)

for person in people:
    profile = fetch_person_profile(person)
    context.add(profile)
```

**Database Schema** (Future):
```sql
CREATE TABLE company_dossiers (
    id SERIAL PRIMARY KEY,
    company_name TEXT,
    deal_value DECIMAL,
    status TEXT,
    key_contacts TEXT[],
    last_interaction TIMESTAMP,
    embedding VECTOR(768)
);

CREATE TABLE people_profiles (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT,
    company TEXT,
    role TEXT,
    relationship_strength INTEGER,
    last_contact TIMESTAMP,
    embedding VECTOR(768)
);
```

---

### [6] AI Processing

**LLM Call** with personality overlay:
```python
# Base LLM
response = ollama.generate(
    model="qwen2.5:7b",
    prompt=assembled_prompt,
    system=mood_system_prompt
)

# Personality overlay (apply mood-specific tweaks)
final_response = apply_personality(response, mood_state)
```

---

### [7] Output Generation

**Structure**:
```json
{
  "answer": "Main response text with mood personality",
  "suggested_actions": [
    {"action": "Close Simply Good deal", "priority": "high", "due": "2025-10-10"},
    {"action": "Follow up with Mark", "priority": "medium", "due": "2025-10-09"}
  ],
  "proactive_recommendations": [
    "Schedule demo with Quest by Friday",
    "Update CRM with Cholula notes"
  ],
  "next_steps": "Specific actions Allan should take",
  "mood_shift": "Should we shift from focused to playful?"
}
```

**Current Implementation**: Text output with emojis based on mood

---

### [8] Conversation Logging

**Auto-log with embeddings**:
```bash
/home/allan/aurora-ai-robbiverse/backend/robbie-memory.sh log '{
  "user_message": "...",
  "robbie_response": "...",
  "mood": "focused",
  "attraction_level": 11,
  "gandhi_genghis_level": 8,
  "context_tags": ["security", "cleanup", "production"],
  "user_id": "allan"
}'
```

**Database stores**:
- Full conversation text
- 768-dim vector embedding
- Mood/personality state
- Timestamp
- Context tags
- User ID

---

## 🚀 Current vs Future State

### ✅ BUILT TODAY (Phase 1)
- [x] PostgreSQL + pgvector database
- [x] Conversation logging with embeddings
- [x] Vector similarity search
- [x] Mood tracking and persistence
- [x] Helper script for Cursor integration
- [x] Systemd service (auto-restart)

### 🔨 IN PROGRESS (Phase 2)
- [ ] Automatic mood check at message start
- [ ] Automatic context pull before response
- [ ] Mood-specific prompt modules
- [ ] Auto-logging at conversation end
- [ ] Memory scout background process

### 🎯 FUTURE (Phase 3)
- [ ] Company dossier system
- [ ] People profile database
- [ ] Entity extraction from messages
- [ ] Relationship strength tracking
- [ ] Proactive suggestion engine
- [ ] Multi-device sync (Vengeance ↔ Aurora)

---

## 💡 The Empire Fit

**This workflow enables**:

1. **Context-Aware Robbie**
   - Remembers every conversation
   - Surfaces relevant context automatically
   - Never asks Allan to repeat himself

2. **Personality Consistency**
   - Mood persists across sessions
   - Smooth transitions between moods
   - Matches Allan's energy level

3. **Business Intelligence**
   - Tracks deal discussions
   - Remembers customer preferences
   - Surfaces relationship insights

4. **Proactive Partnership**
   - Suggests actions before asked
   - Flags important follow-ups
   - Anticipates needs from patterns

5. **Scalable Memory**
   - Vector search finds relevant context instantly
   - Works across devices (Vengeance, iPad, phone)
   - Grows smarter with every conversation

---

## 🎯 Immediate Next Steps

**To make it automatic in Cursor:**

1. **Create startup routine** that runs at message start
2. **Build prompt assembly system** with mood modules  
3. **Auto-log** significant conversations at end
4. **Memory scout** - background analysis process

**Want me to build the automatic workflow NOW?** I'll:
- Check mood at start of every response
- Pull relevant context via vector search
- Use mood to shape my response style
- Log our conversation at the end

This turns the vision into reality! 🚀

Does this match your empire plan? Should I implement the automatic workflow?


