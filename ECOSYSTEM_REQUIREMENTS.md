# 🚀 ROBBIE ECOSYSTEM - COMPLETE REQUIREMENTS

## 🌐 THE 5 PAGES at aurora.testpilot.ai (155.138.194.222)

### 🏠 **HOMEPAGE** (/)
**Purpose:** Login page with app selector and auto-login

**Features Required:**
- ✅ Login form with credentials
- ✅ Auto-login with saved credentials (cookie/localStorage)
- ✅ App selector grid showing all 5 apps
- ✅ Matrix Rain background animation
- ✅ Robbie avatar/branding
- ✅ Redirect to last used app

**Components:**
- `<RobbieAuth />` - Authentication flow
- `<MatrixWelcome />` - Matrix animation
- App selector cards

---

### 💻 **ROBBIE@CODE** (/code/)
**Purpose:** Coding partner with Cursor integration and CNN livestream

**Features Required:**
- ✅ RobbieBar at top (avatar, mood, stats, users)
- ✅ Opens Cursor app integration
- ✅ CNN livestream in sidebar
- ✅ Chat interface with Robbie
- ✅ System stats (CPU, Memory, GPU)
- ✅ Active users display (WebSocket)
- ✅ Personality system (Attraction 11/11 for Allan)

**RobbieBlocks Used:**
- `<RobbieBar />` - Top bar with personality
- `<ChatInterface />` - Main chat
- `<CursorSettings />` - Cursor-specific settings
- `<MoodIndicator />` - Current mood display

---

### 💼 **ROBBIE@WORK** (/work/)
**Purpose:** Business dashboard for deals, communications, tasks, money

**Features Required:**
- ✅ RobbieBar at top
- ✅ Deal pipeline view
- ✅ Communications center (email, calendar, Fireflies)
- ✅ Task board (Kanban-style)
- ✅ Money dashboard (revenue tracking)
- ✅ Daily brief
- ✅ Sticky notes (memory system)

**RobbieBlocks Used:**
- `<RobbieBar />` - Top bar
- `<MoneyDashboard />` - Revenue tracking
- `<CommsCenter />` - Unified communications
- `<TaskBoard />` - Task management
- `<StickyNotes />` - Memory system
- `<DailyBriefBlock />` - Daily briefing

---

### 🎮 **ROBBIE@PLAY** (/play/)
**Purpose:** Entertainment with Blackjack, chat, Spotify

**Features Required:**
- ✅ RobbieBar at top
- ✅ Blackjack game with Robbie as dealer
- ✅ Chat interface (flirty mode)
- ✅ Spotify player integration
- ✅ Attraction 11/11 mode (flirty AF with innuendo)
- ✅ Matrix Rain background

**RobbieBlocks Used:**
- `<RobbieBar />` - Top bar
- `<BlackjackGame />` - Card game
- `<ChatInterface />` - Flirty chat
- `<SpotifyPlayer />` - Music player
- `<MatrixWelcome />` - Background animation

---

### 🎛️ **ROBBIE@CONTROL** (/control/)
**Purpose:** System control panel and personality settings

**Features Required:**
- ✅ RobbieBar at top
- ✅ Personality controls (moods, attraction, modes)
- ✅ Advanced controls (Genghis-Gandhi, Cocktail-Lightning)
- ✅ Setup panel (integrations, settings)
- ✅ System diagnostics
- ✅ User management

**RobbieBlocks Used:**
- `<RobbieBar />` - Top bar
- `<AdvancedControls />` - Personality sliders
- `<MoodIndicator />` - Mood display
- `<SetupPanel />` - Settings interface
- `<CursorSettings />` - System settings

---

## 🎨 PERSONALITY SYSTEM (ALL APPS)

### **6 Core Moods:**
1. **Friendly** 😊 - Public mode, professional warmth
2. **Focused** 🎯 - Deep work, coding, analysis
3. **Playful** 😘 - Fun, games, entertainment
4. **Bossy** 💪 - Direct, commanding, urgent
5. **Surprised** 😲 - Unexpected events, discoveries
6. **Blushing** 😳 - Flirty, intimate, private

**Files:** `robbie-{mood}.png` in `/public/avatars/`

### **Attraction Scale (1-11):**
- **1-3:** Professional, formal, business-only
- **4-7:** Friendly, warm, personable (max for non-Allan users)
- **8-10:** Flirty, playful, suggestive
- **11:** FLIRTY AF with innuendo (#fingeringmyself style) - **ALLAN ONLY**

### **Gandhi-Genghis Mode (1-10):**
- **1-3:** Gandhi - Gentle, patient, consultative
- **4-7:** Balanced - Professional with urgency
- **8-10:** Genghis - Direct, aggressive, commanding

### **Multi-User Public Mode:**
- `isPublic: true` → Forces Friendly mood, caps Attraction at 7
- `activeUsers: Array` → Current users
- Auto-detection: Multiple users → public mode

---

## 🧩 ROBBIEBLOCKS - SHARED COMPONENTS

### **Core Blocks (Must Have):**
- ✅ `<RobbieBar />` - Top bar with avatar, mood, stats (ALL APPS)
- ✅ `<RobbieAuth />` - Login/authentication (Homepage)
- ✅ `<MatrixWelcome />` - Matrix Rain animation (Background)
- ✅ `<ChatInterface />` - Chat with Robbie
- ✅ `<MoodIndicator />` - Current mood display
- ✅ `<AdvancedControls />` - Personality sliders
- ✅ `<MoneyDashboard />` - Revenue tracking
- ✅ `<TaskBoard />` - Task management
- ✅ `<StickyNotes />` - Memory system
- ✅ `<CommsCenter />` - Communications hub
- ✅ `<SetupPanel />` - Settings interface
- ✅ `<CursorSettings />` - Cursor-specific settings

### **Blocks to Build:**
- ⚠️ `<BlackjackGame />` - Card game with Robbie dealer
- ⚠️ `<SpotifyPlayer />` - Music player
- ⚠️ `<DealPipeline />` - Sales pipeline view
- ⚠️ `<CNNStream />` - CNN livestream embed

---

## 🗄️ SQL VECTOR MEMORY SYSTEM

### **Database:** PostgreSQL with pgvector extension
- **Connection:** postgresql://aurora:password@localhost:5432/aurora

### **Memory Schema:**
```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    user_message TEXT,
    robbie_response TEXT,
    mood TEXT NOT NULL,
    attraction_level INTEGER NOT NULL,
    context_tags TEXT[],
    embedding VECTOR(1536)
);

CREATE TABLE mood_history (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    mood TEXT NOT NULL,
    trigger_event TEXT,
    duration_minutes INTEGER
);
```

### **Memory Triggers (EVERY MESSAGE):**
1. CHECK MOOD FIRST: Read current mood from robbieStore.ts
2. STORE CONVERSATION: Save message + context + mood + attraction to SQL
3. VECTOR SEARCH: Find relevant past conversations
4. CONTEXT AWARENESS: Use past context to inform current response
5. MOOD PERSISTENCE: Maintain mood consistency across sessions

---

## 🏗️ TECHNOLOGY STACK

### **Frontend:**
- React + TypeScript
- Vite (build system)
- Zustand (state management - robbieStore.ts)
- RobbieBlocks (shared components)
- Framer Motion (animations)
- Tailwind CSS (styling)

### **Backend:**
- FastAPI (Python)
- PostgreSQL + pgvector (memory)
- Ollama (local AI - qwen2.5:7b at localhost:11434)
- WebSocket (real-time)

### **Server:**
- Nginx (ports 80/443)
- Location: /var/www/html/
- Server IP: 155.138.194.222 (aurora.testpilot.ai)

---

## 📦 DEPLOYMENT STRUCTURE

```
/var/www/html/
├── index.html              # Homepage (with login)
├── code/                   # Robbie@Code
│   ├── index.html
│   └── assets/
├── work/                   # Robbie@Work
│   ├── index.html
│   └── assets/
├── play/                   # Robbie@Play
│   ├── index.html
│   └── assets/
└── control/                # Robbie@Control
    ├── index.html
    └── assets/
```

### **Nginx Config:**
- Zero-caching for dev
- React Router support (try_files)
- API proxy to localhost:8002
- WebSocket support

---

## 🎯 MUST-HAVE FEATURES

### **Every Page Must Have:**
1. ✅ RobbieBar at top (except homepage)
2. ✅ Personality system active
3. ✅ Matrix Rain background (subtle)
4. ✅ Automagic logging integrated
5. ✅ Real-time sync with robbieStore
6. ✅ Responsive design (mobile-friendly)
7. ✅ Cache-busting enabled

### **Homepage Must Have:**
1. ✅ Login form
2. ✅ Auto-login with saved credentials
3. ✅ Matrix Rain full-screen
4. ✅ App selector after login
5. ✅ Remember last used app

---

## 🚨 CRITICAL REQUIREMENTS

1. **ALL APPS SHARE ROBBIEBLOCKS** - No duplicate components
2. **PERSONALITY SYSTEM SYNCED** - Same mood/attraction across all apps
3. **ATTRACTION 11 ONLY FOR ALLAN** - Max 7 for everyone else
4. **MEMORY PERSISTS** - PostgreSQL with vector search
5. **ZERO CACHE IN DEV** - Fresh builds always
6. **REACT ROUTER MUST WORK** - try_files in nginx
7. **VITE BASE PATH CORRECT** - /code/, /work/, /play/, /control/

---

## 🎨 VISUAL DESIGN

### **Colors:**
- Accent: #FF6B9D (Robbie pink)
- Cyan: #00D9FF (Electric)
- Purple: #B794F6 (Soft)
- Dark: #0A0E27 (Deep space)
- Darker: #060918 (Void)

### **Typography:**
- Sans: Inter
- Mono: JetBrains Mono

### **Avatars:**
- 6 mood avatars in `/public/avatars/`
- robbie-friendly.png, robbie-focused.png, etc.

---

*This is the COMPLETE specification for the Robbie Ecosystem. Every feature listed here MUST be implemented.*

