# 🎭 PERSONALITY SYSTEM ARCHITECTURE

**Date**: October 8, 2025  
**Status**: ✅ DATABASE SCHEMA COMPLETE

---

## 🎯 The Three-Layer System

```
PERSONALITY (Who You Are)
    ↓ Settings: Sliders (Flirt 1-11, Gandhi-Genghis 1-10)
    ↓ Description: Short text → Auto-generates prompts
    ↓
MOOD (Current State)
    ↓ Calculated: 6 moods based on context/keywords
    ↓ Formulaic: friendly/focused/playful/bossy/surprised/blushing
    ↓
PROMPT (Instructions)
    ↓ Auto-generated: From personality + mood
    ↓ Optimized: Weekly by Dungeon Master
    ↓ Versioned: Rollback capability
```

---

## 📊 Database Schema

### personality_categories
```
Mentors   - Expert advisors (Steve Jobs, industry leaders)
Robbie    - Robbie variants (F, M, etc)
Pros      - Professional specialists (AllanBot, Kristina)
```

### personalities
```sql
id  | category  | name         | description                          | avatar | flirt | g-g
----|-----------|--------------|--------------------------------------|--------|-------|----
1   | Robbie    | Robbie F     | Flirty female executive assistant... | 💜     | 11    | 5
2   | Robbie    | Robbie M     | Professional male executive...       | 🤵     | 3     | 7
3   | Mentors   | Steve Jobs   | Visionary product leader...          | 🍎     | 1     | 9
4   | Pros      | AllanBot     | AI version of Allan...               | 👨‍💼    | 5     | 7
5   | Pros      | Kristina     | VA mentor...                         | 👩     | 5     | 4
```

### moods (6 States - Calculated)
```
friendly   😊  - Default professional mode
focused    🎯  - Deep work, urgent deadlines
playful    😘  - High attraction, fun energy
bossy      💪  - Crisis mode, high G-G
surprised  😲  - Unexpected events
blushing   😳  - Maximum intimacy (Attraction 11 + private)
```

### prompts (Auto-Generated + Optimized)
```sql
personality_id | mood_id | system_prompt | version | is_active | performance
---------------|---------|---------------|---------|-----------|------------
1 (Robbie F)   | 2 (🎯)  | "You are..."  | 3       | true      | 4.2/5.0
1 (Robbie F)   | 3 (😘)  | "You are..."  | 5       | true      | 4.8/5.0
3 (Steve)      | 2 (🎯)  | "You are..."  | 2       | true      | 4.5/5.0
```

**Each personality × each mood = unique prompt**  
Example: `Robbie F` in `playful` mood has different prompt than `Steve Jobs` in `playful` mood

---

## 🤖 How It Works

### 1. Personality Selection
User/context selects active personality:
```sql
SELECT * FROM personalities WHERE name = 'Robbie F';
-- Returns: flirt=11, gandhi_genghis=5, description="..."
```

### 2. Mood Calculation (Formulaic)
```sql
SELECT calculate_mood(11, 5, ARRAY['urgent', 'deadline']);
-- Returns: 'focused' (because keywords match)
```

### 3. Prompt Retrieval
```sql
SELECT * FROM get_active_prompt(1, 2);  -- personality_id=1, mood_id=2
-- Returns: system_prompt, tone, style, emoji_guidelines
```

### 4. Response Generation
```python
# Get personality
personality = db.get_personality('Robbie F')

# Calculate mood
mood = calculate_mood(
    attraction=11,
    gandhi_genghis=5,
    keywords=['urgent', 'deadline']
)  # Returns 'focused'

# Get prompt
prompt = db.get_active_prompt(personality.id, mood.id)

# Generate response
response = llm.generate(
    system_prompt=prompt.system_prompt,
    user_message=message
)
```

---

## 🧙 Dungeon Master System

**Purpose**: Weekly optimization of all prompts

**Process**:
1. **Analyze Performance** (every Sunday)
   - Review usage_count for each prompt
   - Check avg_satisfaction scores
   - Identify underperforming prompts

2. **Optimize Prompts**
   - Tweak system_prompt based on performance
   - Update tone/style if needed
   - Add/remove example responses
   - Create new version (rollback preserved)

3. **Report to Allan via Robbie**
   ```
   Subject: 📊 Weekly Prompt Optimization Report
   
   Dungeon Master reviewed 138 prompts (23 personalities × 6 moods).
   
   OPTIMIZED:
   - Robbie F (playful): Improved flirt balance → v6
   - Steve Jobs (bossy): More direct feedback → v4
   - AllanBot (focused): Better revenue lens → v3
   
   PERFORMANCE:
   - Avg satisfaction: 4.3/5.0 (↑0.2 from last week)
   - Usage: 847 conversations this week
   
   ROLLBACK AVAILABLE: All changes reversible
   
   [Approve] [Rollback] [Review Details]
   ```

4. **Rollback Capability**
   ```sql
   -- Rollback to previous version
   UPDATE prompts 
   SET is_active = false 
   WHERE personality_id = 1 AND mood_id = 3 AND version = 6;
   
   UPDATE prompts 
   SET is_active = true 
   WHERE personality_id = 1 AND mood_id = 3 AND version = 5;
   ```

---

## 🎨 Auto-Prompt Generation

**From Short Description:**

Input: 
```
"Flirty female AI executive assistant - warm, direct, revenue-focused strategic partner"
```

Auto-generates 6 mood prompts:
```python
def generate_prompts(description, mood):
    base = f"You are {description}."
    
    mood_overlays = {
        'friendly': "Be warm and professional. Provide clear help.",
        'focused': "Be direct and efficient. Lead with answer. No fluff.",
        'playful': "Be fun and engaging. Use personality and flirt.",
        'bossy': "Be commanding and urgent. Give direct orders.",
        'surprised': "React with curiosity. Ask clarifying questions.",
        'blushing': "Be sweet and intimate. This is private mode."
    }
    
    return base + " " + mood_overlays[mood]
```

**Then optimized over time by Dungeon Master**

---

## 📈 Growth Strategy

**Adding New Personalities:**
```sql
-- 1. Allan provides short description in Control Center
INSERT INTO personalities (category_id, name, short_description, avatar)
VALUES (
    (SELECT id FROM personality_categories WHERE name='Pros'),
    'Marketing Maven',
    'Expert brand strategist - focuses on positioning, messaging, and audience psychology',
    '📢'
);

-- 2. System AUTO-GENERATES 6 prompts (one per mood)
-- Runs: generate_prompts_for_personality(new_personality_id)

-- 3. Dungeon Master optimizes weekly
-- Improves prompts based on usage/performance
```

**Categories can grow:**
```sql
INSERT INTO personality_categories (name, description) VALUES
('Sales Team', 'Sales-focused AI personalities'),
('Developers', 'Technical specialist AIs'),
('Creatives', 'Design and content AIs');
```

---

## 🏛️ Control Center UI

**President Allan Can:**
- ✅ View all personalities by category
- ✅ Edit short descriptions
- ✅ Adjust default sliders (flirt, gandhi-genghis)
- ✅ Review auto-generated prompts
- ✅ Manually edit any prompt
- ✅ Approve/reject Dungeon Master changes
- ✅ Rollback to previous versions
- ✅ See performance metrics per prompt
- ✅ Add new personalities (auto-generates prompts)

**Dungeon Master Can (Automated):**
- 🤖 Review all prompts weekly
- 🤖 Optimize based on performance
- 🤖 Generate report for Allan
- 🤖 Track metrics and trends
- ⚠️ Cannot deploy without Allan approval

---

## 🔄 The Workflow

```
Allan creates new personality
    ↓
Provides: Name, Category, Short Description, Avatar
    ↓
System AUTO-GENERATES 6 prompts (one per mood)
    ↓
Prompts go live immediately (version 1)
    ↓
Usage tracked: conversations, satisfaction, context
    ↓
Dungeon Master reviews weekly
    ↓
Optimizes prompts → creates version 2
    ↓
Reports to Allan: "Here's what I changed and why"
    ↓
Allan approves OR rolls back
    ↓
Cycle repeats
```

---

## 💡 Key Advantages

1. **Dynamic Growth** - Add personalities anytime, prompts auto-generate
2. **Category Organization** - Mentors, Robbie, Pros (expandable)
3. **Automatic Optimization** - Dungeon Master improves over time
4. **Rollback Safety** - Nothing is permanent, always reversible
5. **Performance Tracking** - Know what works, what doesn't
6. **Separation of Concerns**:
   - Personality = WHO (settings)
   - Mood = STATE (calculated)
   - Prompt = INSTRUCTIONS (generated + optimized)

---

## 🎯 Immediate Next Steps

1. Build auto-prompt generator (takes description → generates 6 prompts)
2. Build Dungeon Master optimization engine
3. Build Control Center UI for Allan to manage
4. Add Dungeon Master as personality with weekly cron job
5. Implement rollback interface

---

**This scales to 100+ personalities without confusion** 🚀

**Last Updated**: October 8, 2025




