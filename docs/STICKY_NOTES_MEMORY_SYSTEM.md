# 🧠 Sticky Notes = Robbie's Total Memory System

**Date**: October 8, 2025  
**Status**: Core Architecture  
**Priority**: 🔥 CRITICAL - This is how Robbie remembers EVERYTHING!

---

## 💡 THE VISION

Sticky Notes aren't just notes - they're **Robbie's complete memory system**. Everything she learns, remembers, and knows is stored as sticky notes. Most stay below the surface, but Robbie intelligently surfaces the ones Allan needs to see RIGHT NOW.

---

## 🌊 SURFACE / SUBMERGE MODEL

### The Ocean Metaphor
Think of Robbie's memory like an ocean:
- 🌊 **Below Surface**: Thousands of notes (context, learnings, patterns, history)
- ⬆️ **Surfaced**: Only the notes Allan needs RIGHT NOW (proactive & relevant)
- 👁️ **Always Visible**: Allan's own notes (he created them, he owns them)

### How Surfacing Works
Robbie decides what to surface based on:
1. **Context** - What's Allan working on right now?
2. **Calendar** - Upcoming meetings/events
3. **Conversations** - Topics being discussed
4. **Patterns** - What has Allan needed in similar situations?
5. **Urgency** - Time-sensitive information

**Examples of Surfacing:**
```
Allan opens Cursor...
  → Robbie surfaces: "Code review for client demo - check auth flow"

Allan has Mark Edmonson call in 30 mins...
  → Robbie surfaces: "Briefing for Mark Edmonson Call!"
  → Link: "Custom demo for Mark.pptx" (Google Slides)

Allan mentions Quest Diagnostics...
  → Robbie surfaces: "$45k deal, 90% close probability, follow up Tuesday"
```

---

## 📝 NOTE TYPES

### 1. Allan's Notes (Always Visible)
- Created by Allan
- Always at the top
- Allan controls visibility
- Categories: Intel, Reference, Drafts, Connections, Shower Thoughts

### 2. Robbie's Context Notes (Surfaced When Relevant)
- Created by Robbie automatically
- Surfaced based on context
- Can be dismissed (submerge)
- Examples:
  - Meeting briefings
  - Deal summaries
  - Code patterns Allan uses
  - Client preferences
  - Project context

### 3. Robbie's Learning Notes (Mostly Submerged)
- Long-term memory
- Patterns and preferences
- Historical context
- Surface only when highly relevant

---

## 🔗 LINKING SYSTEM

### Google Workspace Integration
**We're a Google Apps company** - No Microsoft Office!

**Supported Links:**
- ✅ Google Docs (live documents)
- ✅ Google Sheets (live spreadsheets)  
- ✅ Google Slides (live presentations)
- ✅ Google Drive folders
- ❌ NO Word, Excel, PowerPoint

**Link Format:**
```
📄 [Custom demo for Mark](https://docs.google.com/presentation/d/ABC123/edit)
📊 [Q4 Revenue Forecast](https://docs.google.com/spreadsheets/d/XYZ789/edit)
📝 [Client Proposal - Quest](https://docs.google.com/document/d/DEF456/edit)
```

**Sharing Philosophy:**
- Share with specific people when needed
- Unshare when access should be revoked
- Live documents = always up to date
- No email attachments needed

---

## 🎯 ROBBIE'S SURFACING INTELLIGENCE

### When to Surface Notes

**Context Triggers:**
```python
# Meeting starting soon
if meeting_in_next_30_mins:
    surface("Meeting Brief: {contact_name}")
    surface("Link: Presentation for {contact_name}")
    surface("Last conversation summary")

# Coding in specific project
if working_on("aurora-ai-robbiverse"):
    surface("Active bugs in this repo")
    surface("Architecture decisions")
    surface("Recent code patterns")

# Sales conversation
if mention("deal", "client", "proposal"):
    surface("Deal status and value")
    surface("Client history")
    surface("Proposal link")

# Mentioned person/company
if mention(contact_name):
    surface("Relationship summary")
    surface("Last interaction")
    surface("Open action items")
```

### Priority Levels
1. 🔴 **URGENT** - Time-sensitive, meeting soon, deadline approaching
2. 🟡 **RELEVANT** - Related to current task/conversation
3. 🟢 **CONTEXT** - Background info, might be useful
4. ⚪ **SUBMERGED** - Available but not currently needed

---

## 💾 DATABASE SCHEMA

### Sticky Notes Table (Enhanced)
```sql
CREATE TABLE sticky_notes (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    
    -- Content
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,  -- Intel, Reference, Drafts, Connections, Shower Thoughts
    
    -- Robbie Intelligence
    created_by TEXT,  -- 'allan' or 'robbie'
    surface_status TEXT DEFAULT 'submerged',  -- 'surfaced', 'submerged', 'always_visible'
    surface_priority INTEGER DEFAULT 0,  -- Higher = more important
    surface_reason TEXT,  -- Why Robbie surfaced this
    context_tags TEXT[],  -- For smart surfacing
    
    -- Linking
    linked_files JSONB DEFAULT '[]',  -- Google Docs/Sheets/Slides links
    linked_contacts TEXT[],  -- Associated people
    linked_deals UUID[],  -- Associated deals
    linked_tasks UUID[],  -- Associated tasks
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_surfaced_at TIMESTAMPTZ,
    surface_count INTEGER DEFAULT 0,
    dismissed_count INTEGER DEFAULT 0
);

-- Surfacing history (for learning)
CREATE TABLE sticky_note_surfaces (
    id UUID PRIMARY KEY,
    note_id UUID REFERENCES sticky_notes(id),
    surfaced_at TIMESTAMPTZ DEFAULT NOW(),
    surface_context JSONB,  -- What triggered surfacing
    user_action TEXT,  -- 'viewed', 'dismissed', 'clicked_link', 'edited'
    was_helpful BOOLEAN
);
```

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Core Memory System ✅
- [x] Database schema with surface/submerge
- [x] Created_by (Allan vs Robbie)
- [x] Surface priority system

### Phase 2: Smart Surfacing 🏗️
- [ ] Context detection (calendar, mentions, code files)
- [ ] Priority calculation algorithm
- [ ] Auto-surface logic
- [ ] Surfacing history tracking

### Phase 3: Google Workspace Integration 🏗️
- [ ] Google Docs API integration
- [ ] Link previews (title, thumbnail)
- [ ] Share/unshare management
- [ ] Live document status

### Phase 4: Learning System 🏗️
- [ ] Track which surfaced notes were helpful
- [ ] Learn from dismiss patterns
- [ ] Improve surfacing accuracy over time
- [ ] Personal surfacing preferences

---

## 🎨 UI/UX DESIGN

### Sticky Notes Interface

```
┌─────────────────────────────────────────────┐
│  🎯 Robbie's Surfaced Notes (3)             │
├─────────────────────────────────────────────┤
│  🔴 URGENT: Mark Edmonson Call (10 mins)    │
│     📊 Q3 Results Presentation              │
│     💡 He asked about multi-location last   │
│        time - demo that feature!            │
│     [Dismiss] [Keep Surfaced]               │
├─────────────────────────────────────────────┤
│  🟡 Quest Deal Update                       │
│     $45k, 90% close probability             │
│     Next touch: Tuesday 2pm                 │
│     [View Deal] [Dismiss]                   │
├─────────────────────────────────────────────┤
│                                             │
│  📝 Allan's Notes (Always Visible)          │
├─────────────────────────────────────────────┤
│  💡 Shower Thought: Add AI-powered email    │
│     subject line generator                  │
│     [Edit] [Archive]                        │
├─────────────────────────────────────────────┤
│  📋 Intel: Simply Good Foods closed         │
│     $12,740 - Oct 2025                      │
│     [Edit] [Archive]                        │
└─────────────────────────────────────────────┘

[+ New Note]  [Show All (2,847 submerged)]
```

### Google Docs Link Display
```
┌─────────────────────────────────────────────┐
│  📄 Custom Demo for Mark                    │
│  🔗 Google Slides                           │
│  👥 Shared with: mark@questdiagnostics.com  │
│  ✅ Last edited: 2 hours ago                │
│  [Open] [Unshare] [Copy Link]              │
└─────────────────────────────────────────────┘
```

---

## 🧠 ROBBIE'S MEMORY CATEGORIES

### What Robbie Remembers (As Sticky Notes)

**Business Context:**
- Deal summaries and status
- Client preferences and history
- Meeting outcomes and action items
- Revenue metrics and goals

**Technical Context:**
- Code patterns Allan uses
- Project architecture decisions
- Common bugs and solutions
- Performance optimization notes

**Personal Context:**
- Allan's communication preferences
- Energy levels at different times
- Decision-making patterns
- Work-life balance signals

**Relationships:**
- Contact relationship strength
- Last interaction summary
- Topics discussed
- Promises made

---

## 💡 SURFACING EXAMPLES

### Scenario 1: Morning Startup
```
Allan opens Cursor at 9am...

Robbie surfaces:
1. 🔴 "3 meetings today - briefs ready"
2. 🟡 "Cholula follow-up overdue (3 days)"
3. 🟢 "GitHub PR needs review from yesterday"
```

### Scenario 2: Client Call Prep
```
Allan's calendar shows Mark Edmonson call in 20 mins...

Robbie surfaces:
1. 🔴 "Mark Edmonson Brief"
   - Last call: Sept 15 (discussed multi-location)
   - Pain point: Manual data entry
   - Budget authority: Yes ($50k+ approved)
   - Next step: Technical demo
2. 🔴 Link: Custom Demo for Mark (Google Slides)
3. 🟡 "Quest Diagnostics context (Mark's company)"
   - 6 locations nationwide
   - Current system: Excel + email
   - Decision timeline: Q4 2025
```

### Scenario 3: Code Review
```
Allan opens aurora-ai-robbiverse/backend/...

Robbie surfaces:
1. 🟡 "Backend Architecture Decision: FastAPI + PostgreSQL"
2. 🟡 "Common pattern: Use RealDictCursor for JSON responses"
3. 🟢 "Recent bug: JWT tokens need refresh endpoint"
```

### Scenario 4: Deal Mention
```
Allan types "Simply Good Foods" in chat...

Robbie surfaces:
1. ✅ "Simply Good Foods - CLOSED $12,740 (Oct 2025)"
2. 🟢 "Payment terms: Net 30"
3. 🟢 "Contact: Sarah Chen (VP Marketing)"
```

---

## 🎯 SUCCESS METRICS

### For Robbie
- **Surfacing Accuracy**: % of surfaced notes that Allan finds useful
- **Proactive Value**: How often Robbie surfaces before Allan searches
- **Context Precision**: Right notes at the right time
- **Learning Rate**: Improvement in surfacing accuracy over time

### For Allan
- **Time Saved**: Minutes saved not searching for info
- **Context Switching**: Reduced cognitive load
- **Preparedness**: Always have what you need when you need it
- **Trust**: Confidence that Robbie has the context

---

## 🔐 PRIVACY & CONTROL

### Allan's Control
- ✅ Can dismiss any surfaced note
- ✅ Can force-submerge notes permanently
- ✅ Can delete Robbie's notes
- ✅ Full visibility into what Robbie remembers
- ✅ Can adjust surfacing sensitivity

### Robbie's Transparency
- Always show WHY a note was surfaced
- Show confidence level
- Allow feedback (helpful / not helpful)
- Learn from Allan's patterns

---

## 📚 RELATED SYSTEMS

This memory system integrates with:
- 💬 **Chat System** - Surface relevant notes during conversations
- 📅 **Calendar** - Surface based on upcoming events
- 💰 **CRM** - Surface deal/contact context
- ✅ **Tasks** - Surface related action items
- 🎭 **Personality** - Adjust surfacing based on mood/context

---

## 🚀 NEXT STEPS

1. **Enhance sticky notes database schema** with surfacing fields
2. **Build surfacing engine** that monitors context
3. **Integrate Google Workspace API** for doc links
4. **Create surfacing UI** in RobbieBlocks
5. **Implement learning system** to improve over time
6. **Test with real scenarios** (meetings, deals, code)

---

**💜 This is how Robbie becomes truly intelligent, babe - by remembering EVERYTHING and knowing exactly what you need, when you need it! 🧠✨**



