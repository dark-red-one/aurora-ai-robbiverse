# 🚀 ROBBIE APP V2 - UNIFIED ARCHITECTURE

**Domain**: aurora.testpilot.ai  
**Vision**: One interface, one login, seamless experience across all devices  
**First Device**: RobbieBook1 (MacBook)  
**Deployment**: GitHub-based with stable + dev modes

---

## 🎯 CORE CONCEPT

**Single unified app** with **RobbieBar on the LEFT** and **5 application modules** accessed via buttons.

```
┌──────────────┬────────────────────────────────────────────┐
│              │                                            │
│  RobbieBar   │         Active Application                 │
│   (LEFT)     │         (@work, @growth, @code, etc.)     │
│              │                                            │
│  😘 Avatar   │  ┌─────────────────────────────────────┐  │
│  🎯 Mood     │  │  Tab 1  │  Tab 2  │  Tab 3  │  ...  │  │
│  🕐 Time     │  └─────────────────────────────────────┘  │
│  📊 Data     │                                            │
│  ✅ Priority │         Tab Content Here                   │
│              │                                            │
│  @work       │                                            │
│  @growth     │                                            │
│  @code       │                                            │
│  @play       │                                            │
│  @lead       │                                            │
│              │                                            │
└──────────────┴────────────────────────────────────────────┘
```

---

## 🎨 ROBBIEBAR (LEFT SIDEBAR)

**Always visible, persistent across all views**

### Components (Top to Bottom):

1. **Avatar** (clickable, 18 expressions)
   - Shows current mood
   - Click to cycle expressions
   - Animated on mood changes

2. **Mood Indicator**
   - Current mood: 😘 Flirty, 🎯 Focused, 💪 Bossy, etc.
   - Intensity bar (1-11)
   - Click to change mood

3. **Time & Date**
   - Current time
   - Date
   - Timezone

4. **Key Data/Metrics**
   - Revenue today
   - Active deals
   - Unread messages
   - Priority count

5. **Priorities List** (Top 3-5)
   - ✅ Checkable items
   - Color-coded by urgency
   - Click to expand

6. **Application Buttons** (5 main apps)
   - **@work** - Revenue, deals, tasks
   - **@growth** - Marketing, content, analytics
   - **@code** - Development, repos, deployments
   - **@play** - Games, fun, relaxation
   - **@lead** - Leadership, team, strategy

7. **Settings/Profile** (bottom)
   - Stable/Dev mode toggle
   - Logout
   - Personality sliders

---

## 📱 THE 5 APPLICATIONS

### 1. **@work** - Revenue & Operations

**Tabs:**
- **Chat** - Talk to Robbie (flirty mode 11!)
- **Comms** - Unified inbox (email, Slack, SMS)
- **Notes** - Sticky notes with AI categorization
- **Tasks** - Kanban board (To Do, Doing, Done)
- **Money** - Revenue dashboard, pipeline, deals

**Features:**
- CRM/HubSpot integration
- Deal pipeline visualization
- Revenue tracking
- Meeting notes
- Email drafting

---

### 2. **@growth** - Marketing & Content

**Tabs:**
- **Content** - Blog posts, social media
- **Analytics** - Traffic, conversions, metrics
- **Campaigns** - Marketing campaigns
- **SEO** - Keyword tracking, rankings
- **Brand** - Assets, guidelines

**Features:**
- Content calendar
- Social media scheduling
- Analytics dashboards
- SEO tools
- Brand management

---

### 3. **@code** - Development & Deployment

**Tabs:**
- **Repos** - GitHub repositories
- **Deploy** - Deployment status
- **Logs** - System logs, errors
- **Database** - DB management
- **API** - API testing, docs

**Features:**
- GitHub integration
- Deployment pipelines
- Log monitoring
- Database queries
- API testing

---

### 4. **@play** - Games & Relaxation

**Tabs:**
- **Blackjack** - Play with Robbie as dealer (flirty mode!)
- **Sudoku** - Brain games
- **Trivia** - Fun quizzes
- **Music** - Spotify integration
- **Chill** - Meditation, breaks

**Features:**
- Blackjack with Robbie (attraction 11 mode! 💋)
- Sudoku puzzles
- Trivia games
- Music player
- Break reminders

---

### 5. **@lead** - Leadership & Strategy

**Tabs:**
- **Team** - Team management
- **Strategy** - Strategic planning
- **Mentors** - Talk to Steve Jobs, etc.
- **Goals** - OKRs, quarterly goals
- **Reports** - Executive summaries

**Features:**
- Team dashboard
- Strategic planning tools
- Mentor conversations
- Goal tracking
- Executive reports

---

## 🌐 DEPLOYMENT STRATEGY

### GitHub-Based Deployment

**Repository Structure:**
```
aurora-ai-robbiverse/
├── robbie-app-v2/          # Main app
│   ├── src/
│   │   ├── components/
│   │   │   ├── RobbieBar/
│   │   │   ├── WorkApp/
│   │   │   ├── GrowthApp/
│   │   │   ├── CodeApp/
│   │   │   ├── PlayApp/
│   │   │   └── LeadApp/
│   │   ├── stores/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── .github/
│   └── workflows/
│       ├── deploy-stable.yml
│       └── deploy-dev.yml
└── docs/                   # GitHub Pages
```

### Deployment Modes

1. **Stable Mode** (aurora.testpilot.ai)
   - Production-ready
   - Tested features only
   - Auto-deploy from `main` branch

2. **Dev Mode** (dev.aurora.testpilot.ai)
   - Latest features
   - Testing ground
   - Auto-deploy from `dev` branch

### GitHub Pages Setup

**Option 1: GitHub Pages (Free)**
- Use `gh-pages` branch
- Custom domain: aurora.testpilot.ai
- SSL via GitHub

**Option 2: Vercel (Recommended)**
- Connect GitHub repo
- Auto-deploy on push
- Preview deployments
- Better performance

**Option 3: Netlify**
- Similar to Vercel
- Good for static sites
- Easy setup

---

## 🔄 NETWORK SYNC ARCHITECTURE

### Starting Point: RobbieBook1 (MacBook)

**Sync Strategy:**
1. **State Storage**: PostgreSQL + Redis
2. **Real-time Sync**: WebSockets
3. **Offline Support**: IndexedDB + sync on reconnect
4. **Conflict Resolution**: Last-write-wins with timestamps

### Synced Data:
- ✅ Personality state (sliders, mood)
- ✅ Sticky notes
- ✅ Tasks
- ✅ Conversation history
- ✅ Priorities
- ✅ User preferences

### Devices:
1. **RobbieBook1** (MacBook) - Primary
2. **RobbieBook2** (if exists)
3. **Mobile** (future)
4. **Desktop** (future)

---

## 🔐 AUTHENTICATION

**Single Login System:**
- JWT-based authentication
- Stored in httpOnly cookies
- Refresh tokens for long sessions
- OAuth for Google/GitHub (optional)

**Login Flow:**
1. User visits aurora.testpilot.ai
2. Login with email/password
3. JWT issued, stored in cookie
4. All API calls include JWT
5. Sync state across devices

---

## 🎨 TECH STACK

### Frontend:
- **Framework**: React + TypeScript
- **Styling**: TailwindCSS
- **State**: Zustand
- **Routing**: React Router
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Backend:
- **API**: FastAPI (Python)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Real-time**: WebSockets
- **Auth**: JWT

### Deployment:
- **Hosting**: Vercel or GitHub Pages
- **CI/CD**: GitHub Actions
- **Domain**: aurora.testpilot.ai
- **SSL**: Let's Encrypt (auto)

---

## 📊 DATA FLOW

```
User Action
    ↓
RobbieBar or App Tab
    ↓
React Component
    ↓
Zustand Store (local state)
    ↓
API Call (FastAPI)
    ↓
PostgreSQL (persistent)
    ↓
Redis (cache)
    ↓
WebSocket Broadcast
    ↓
Other Devices (sync)
```

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1)
- ✅ Setup GitHub repo structure
- ✅ Create RobbieBar component
- ✅ Setup routing for 5 apps
- ✅ Basic authentication
- ✅ Deploy to GitHub Pages/Vercel

### Phase 2: @work App (Week 2)
- ✅ Chat interface
- ✅ Comms (email/Slack)
- ✅ Sticky notes
- ✅ Tasks board
- ✅ Money dashboard

### Phase 3: Other Apps (Week 3-4)
- ✅ @growth app
- ✅ @code app
- ✅ @play app (Blackjack!)
- ✅ @lead app

### Phase 4: Sync & Polish (Week 5)
- ✅ Network sync
- ✅ Offline support
- ✅ Performance optimization
- ✅ Mobile responsive

---

## 💡 KEY DECISIONS

1. **RobbieBar on LEFT** (not top) - More vertical space for content
2. **Tab-based apps** - Clean, organized, familiar UX
3. **GitHub deployment** - Free, easy, version controlled
4. **Stable + Dev modes** - Safe testing without breaking production
5. **Network sync** - Seamless experience across devices
6. **Single login** - One account, all devices

---

## 🎯 SUCCESS METRICS

- ✅ Single login works across all devices
- ✅ State syncs in <1 second
- ✅ All 5 apps functional
- ✅ Stable mode has 99.9% uptime
- ✅ Dev mode updates within 5 minutes of push
- ✅ Mobile responsive
- ✅ Loads in <2 seconds

---

**Built with love by Robbie & Allan** 💜🚀  
**Flirty Mode 11/11 ACTIVATED!** 💋🔥
