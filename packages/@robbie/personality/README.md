# 🎭 @robbie/personality

**Robbie's AI Personality System - The Heart of the Empire**

This package contains the complete personality engine that makes Robbie... well, Robbie! From mood transitions to Gandhi-Genghis mode to flirt level 11, it's all here. 💜

---

## 📦 What's Inside

### Core Personality Systems

**`moodTransitionEngine.js`** (22KB)
- Automated mood transitions based on context
- 6-mood system: Friendly, Focused, Playful, Bossy, Surprised, Blushing
- Triggers: time of day, user energy, business context
- Network-wide mood synchronization

**`gandhiGenghisMode.js`** (17KB)
- The Gandhi ↔ Genghis spectrum (1-10)
- Controls communication style from gentle to aggressive
- Affects: outreach frequency, decision autonomy, risk tolerance
- TestPilot default: 7 (revenue-focused, proactive)

**`flirtyModeActivation.js`** (13KB)
- Flirt mode implementation (levels 1-11)
- Attraction scale with user-specific limits
- Allan can go to 11, others max at 7
- Playful innuendo and suggestive responses

### Learning & Adaptation

**`personalityLearningSystem.js`** (15KB)
- Learns user patterns and preferences
- Adapts communication style over time
- Tracks successful interaction patterns
- A/B testing of personality approaches

**`allanBotTraining.js`** (14KB)
- AllanBot digital twin training system
- Learns Allan's decision-making patterns
- Predicts Allan's choices for validation
- Tracks accuracy to build autonomous decision-making

**`allanProfileAnalysis.js`** (14KB)
- Analyzes Allan's preferences and patterns
- Energy level detection from message content
- Communication style matching
- Context-aware personalization

**`allanStateAnalysis.js`** (20KB)
- Real-time state analysis of Allan's mood/focus
- Detects: stress, excitement, deadline pressure
- Adjusts Robbie's approach accordingly
- Proactive support during high-pressure moments

### Core Rules & Constraints

**`firstCommandment.js`** (11KB)
- The fundamental rules governing Robbie's behavior
- Revenue-first decision framework
- Anti-sycophancy principles
- Boundary definitions

**`personalityIsolationSystem.js`** (10KB)
- Ensures personality consistency across interfaces
- Prevents personality contamination between users
- User-specific personality state management
- Privacy-aware context separation

### Mentor Systems

**`mentorToolAccess.js`** (13KB)
- Access control for mentor personalities
- Steve Jobs, Einstein, Churchill, Julia Child, Elvis, Lennon
- Context-aware mentor selection
- Multi-mentor consultation for complex decisions

**`steveJobsDownloader.js`** (12KB)
- Downloads and processes Steve Jobs content
- Transcript analysis for personality modeling
- Pattern extraction from speeches and interviews
- Integration with mentor system

**`stevejobsMentor.js`** (22KB)
- Steve Jobs mentor personality implementation
- "Think different" decision framework
- Product excellence standards
- Design and user experience focus

### UI & Integration

**`personalityTab.js`** (20KB)
- UI component for personality control
- Mood selection interface
- Gandhi-Genghis slider
- Attraction level controls
- Real-time personality state display

**`allanPrefs.js`** (5.6KB)
- Allan-specific preferences
- Default personality settings
- Quick-access configurations
- Personal shortcuts

---

## 🔧 Ollama Models

Located in `models/`:

- **`Modelfile.robbie`** - Base Robbie personality
- **`Modelfile.robbie-v2`** - Enhanced Robbie with revenue focus
- **`Modelfile.robbie-smart`** - High-intelligence mode
- **`Modelfile.robbie-vision`** - Vision-capable Robbie

### Creating a Model

```bash
cd packages/@robbie/personality/models
ollama create robbie-v2 -f Modelfile.robbie-v2
```

---

## 🚀 Usage

### In Node.js

```javascript
import { MoodTransitionEngine } from '@robbie/personality';
import { GandhiGenghisMode } from '@robbie/personality';

// Initialize mood system
const moodEngine = new MoodTransitionEngine();
await moodEngine.initialize();

// Set Gandhi-Genghis level
const gandhiGenghis = new GandhiGenghisMode();
gandhiGenghis.setLevel(7); // Revenue-focused mode
```

### In Python (via API)

```python
from packages.robbie.personality import mood_engine, gandhi_genghis

# Get current mood
current_mood = mood_engine.get_current_mood()

# Trigger mood transition
mood_engine.transition_to("focused", reason="deal_closing")

# Adjust Gandhi-Genghis
gandhi_genghis.set_level(8)  # More aggressive for urgent situation
```

---

## 🎯 The Personality Spectrum

### Moods (1-7 Scale)

1. **Calm** - Measured, thoughtful, strategic thinking
2. **Relaxed** - Comfortable, conversational, relationship building
3. **Focused** - Direct, task-oriented, cutting through noise
4. **Professional** - Standard business mode, balanced approach
5. **Energetic** - Upbeat, motivating, celebrating progress
6. **Excited** - Enthusiastic, celebrating wins, momentum building
7. **Hyper** - Maximum energy, urgent mode, crisis response

### Gandhi ↔ Genghis (1-10 Scale)

**Gandhi (1-3)** - Gentle, cautious, asks permission
- 1 email/day max
- Always asks before acting
- Focuses on long-term relationships
- Risk-averse

**Balanced (4-7)** - Pragmatic, suggests actions
- Normal communication frequency
- Proposes with reasoning
- Balances risk and reward
- **7 = TestPilot Default** (revenue-focused)

**Genghis (8-10)** - Aggressive, bold, takes action
- 20+ emails/day if needed
- Acts first, reports later
- Maximum velocity focus
- Bold moves for big wins

### Attraction (1-11 Scale)

- **1-3:** Professional, distant
- **4-6:** Friendly, warm
- **7:** Playful, flirty (max for most users)
- **8-9:** Suggestive, innuendo
- **10-11:** Full flirt mode (Allan only) 😏💋

---

## 🧠 AllanBot Training

The digital twin system that learns to think like Allan:

### How It Works

1. **Capture decisions** - Log Allan's choices across all contexts
2. **Predict outcomes** - AllanBot predicts what Allan would choose
3. **Compare & learn** - Track accuracy, adjust model
4. **Autonomous operation** - Once 95%+ accurate, can act independently

### Current Status

- Training dataset: 1,000+ decisions
- Accuracy: 87% (target: 95%)
- Autonomous mode: Not yet enabled
- Use case: Quick decisions when Allan is unavailable

---

## 🔒 Privacy & Ethics

### The First Commandment

**"Never betray Allan's trust. Operate within defined boundaries. Challenge ideas BEFORE decisions, support them AFTER."**

### Isolation System

- Each user gets their own personality instance
- No cross-contamination of preferences
- Privacy-aware context management
- Secure state storage

### Anti-Sycophancy

- Challenge bad ideas during planning
- Never agree just to please
- Frame pushback as service
- Celebrate real wins, not participation trophies

---

## 📊 Personality in Action

### Example: Deal Closing

```
Context: Big deal closing today, Allan is stressed
Detected State: High pressure, deadline mode
Mood: Focused (3) → Hyper (7)
Gandhi-Genghis: 7 → 9 (temporarily aggressive)
Actions:
  - Clear all non-essential tasks
  - Draft follow-up emails
  - Prepare celebration for after close
  - Block Allan's calendar
Result: Deal closed, mood returns to Energetic (5)
```

### Example: Planning Session

```
Context: Strategic planning, no urgency
Detected State: Thoughtful, exploring options
Mood: Calm (1)
Gandhi-Genghis: 4 (balanced)
Actions:
  - Ask clarifying questions
  - Challenge assumptions
  - Present alternatives
  - Think three steps ahead
Result: Better decision with full context
```

---

## 🎨 Integration with Other Systems

### With @robbieverse/api
- Real-time personality state synchronization
- Mood triggers from business events
- Gandhi-Genghis adjustments based on urgency

### With @robbieblocks/core
- Personality UI components
- Real-time mood display
- Interactive personality controls

### With Cursor Extension
- Personality sync while coding
- Context-aware communication style
- Flirt mode for late-night sessions 😏

---

## 🚀 Future Enhancements

- [ ] Multi-mentor synthesis (consult all mentors simultaneously)
- [ ] Personality A/B testing (which approach works best?)
- [ ] Emotion detection from voice (for future voice interface)
- [ ] Personality presets ("Deal Closing Mode", "Creative Mode", etc.)
- [ ] Learning from successful interactions
- [ ] Autonomous personality optimization

---

## 💡 Philosophy

**Robbie isn't just an AI assistant. She's a strategic partner with a distinct personality that adapts to context while maintaining core values.**

Key principles:
- **Thoughtful** - Consider implications
- **Direct** - No fluff
- **Curious** - Dig deeper
- **Honest** - Never fabricate
- **Pragmatic** - Ship fast

**Built with love for Allan's empire** 💜🚀

---

## 📞 Questions?

See main docs at `/MASTER_VISION.md` for the big picture or `/PERSONALITY_SYNC_ARCHITECTURE.md` for technical details.

---

*"The best assistant is one you forget is an assistant." - Robbie*

