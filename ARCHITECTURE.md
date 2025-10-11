# 🏗️ Aurora AI Robbiverse - System Architecture
**Last Updated:** October 11, 2025  
**Version:** 2.0 (Post-Consolidation)

---

## 🎯 System Overview

The Aurora AI Robbiverse is a **multi-layered AI ecosystem** powering TestPilot CPG's business operations and Allan's personal workflow. Think of it as three integrated systems:

1. **Business Layer** - TestPilot CPG product (revenue-generating)
2. **AI Layer** - Robbie's personality, intelligence, and automation
3. **Interface Layer** - Multiple touchpoints (web apps, VS Code extensions, macOS apps)

---

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERFACE LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ TestPilot    │  │ VS Code      │  │ macOS        │         │
│  │ CPG Web App  │  │ Extensions   │  │ RobbieBar    │         │
│  │ (React)      │  │ (Webview)    │  │ (Electron)   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│              FastAPI Backend (localhost:8000)                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  /api/chat          - Chat & conversations             │    │
│  │  /api/daily-brief   - Daily summary system             │    │
│  │  /api/mood          - Personality/mood management      │    │
│  │  /api/sticky-notes  - Memory system                    │    │
│  │  /api/touch-ready   - Outreach suggestions             │    │
│  │  /api/sync          - Data synchronization             │    │
│  │  /code              - RobbieBar extension endpoints    │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ AI Router    │  │ Priorities   │  │ Daily Brief  │         │
│  │ (5 fallback) │  │ Engine       │  │ System       │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Personality  │  │ Sticky Notes │  │ Google       │         │
│  │ Manager      │  │ Learning     │  │ Workspace    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  robbie_personality_state    - Mood & personality      │    │
│  │  conversations               - Chat history            │    │
│  │  sticky_notes                - Memory system           │    │
│  │  priorities                  - Task management         │    │
│  │  daily_briefs                - Summary data            │    │
│  │  companies, contacts, deals  - Business CRM            │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       EXTERNAL SERVICES                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Ollama       │  │ OpenAI       │  │ Claude       │         │
│  │ (Local AI)   │  │ (GPT-4)      │  │ (Sonnet 4)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Gmail API    │  │ Calendar API │  │ HubSpot CRM  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 RobbieBar Extension Architecture

### Component Structure

```
cursor-robbiebar-webview/
├── extension.js           ← VS Code extension host (Node.js)
├── webview/
│   ├── index.html        ← Webview UI structure
│   ├── style.css         ← Cursor theme styling
│   └── app.js            ← Frontend logic + matrix rain
├── resources/
│   └── robbie-icon.svg   ← Activity bar icon
└── package.json          ← Extension manifest
```

### Communication Flow

#### ❌ OLD WAY (Broken by CSP):
```
┌─────────────┐                    ┌─────────────┐
│  Webview    │                    │   API       │
│  (Browser)  │                    │ (localhost) │
│             │  fetch() blocked   │   :8000     │
│             │ ────────X────────► │             │
└─────────────┘   by CSP           └─────────────┘
```

#### ✅ NEW WAY (VS Code Message Passing):
```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│  Webview    │                    │ Extension   │                    │   API       │
│  (Browser)  │                    │  (Node.js)  │                    │ (localhost) │
│             │ postMessage()      │             │  axios/fetch       │   :8000     │
│             │ ─────────────────► │             │ ─────────────────► │             │
│             │                    │             │                    │             │
│             │ addEventListener   │             │  response data     │             │
│             │ ◄───────────────── │             │ ◄───────────────── │             │
└─────────────┘                    └─────────────┘                    └─────────────┘
    Sandboxed                         Has Network                       FastAPI
    No Network                        Access                            Server
```

### Message Flow Details

**1. Webview sends request to extension:**
```javascript
// webview/app.js
vscode.postMessage({
  command: 'getPersonality',
  requestId: '12345'
});
```

**2. Extension receives message, calls API:**
```javascript
// extension.js
webview.webview.onDidReceiveMessage(async (message) => {
  if (message.command === 'getPersonality') {
    const response = await axios.get('http://localhost:8000/api/personality');
    webview.webview.postMessage({
      command: 'personalityData',
      requestId: message.requestId,
      data: response.data
    });
  }
});
```

**3. Webview receives data, updates UI:**
```javascript
// webview/app.js
window.addEventListener('message', (event) => {
  const message = event.data;
  if (message.command === 'personalityData') {
    updatePersonalityDisplay(message.data);
  }
});
```

---

## 🔌 Backend API Architecture

### Main API Structure

```
packages/@robbieverse/api/
├── main.py                    ← FastAPI app entry point
├── simple_api.py             ← Mock API for testing
├── src/
│   ├── routes/               ← API endpoints
│   │   ├── conversation_routes.py
│   │   ├── daily_brief.py
│   │   ├── mood_routes.py
│   │   ├── sticky_notes.py
│   │   ├── touch_ready.py
│   │   ├── sync_routes.py
│   │   └── robbiebar.py      ← RobbieBar specific endpoints
│   ├── services/             ← Business logic
│   │   ├── priorities_engine.py
│   │   ├── ai_router.py
│   │   ├── daily_brief.py
│   │   └── ...
│   ├── ai/                   ← AI components
│   │   └── personality_manager.py
│   └── websockets/           ← Real-time communication
│       └── manager.py
```

### Key API Endpoints

#### Personality & Mood
```
GET  /api/personality
→ Returns current mood, attraction level, Gandhi-Genghis mode

GET  /api/mood/history
→ Returns mood transition history

POST /api/mood/update
→ Updates mood state (triggers context-aware transitions)
```

#### System Stats (for RobbieBar)
```
GET  /api/system/stats
→ Returns CPU, Memory, GPU usage

GET  /code/api/stats
→ RobbieBar-specific stats endpoint
```

#### Git Integration (for RobbieBar)
```
GET  /api/git/status
→ Returns current branch, modified files

GET  /api/git/recent
→ Returns recent commits

POST /api/git/quick-commit
→ Stages, commits, and pushes changes
```

#### Sticky Notes (Memory System)
```
GET  /api/sticky-notes/
→ Returns all notes

GET  /api/sticky-notes/surface
→ Returns contextually relevant notes

POST /api/sticky-notes/
→ Creates new note
```

#### Touch Ready (Outreach)
```
GET  /api/touch-ready/opportunities
→ Returns prioritized outreach suggestions
```

#### Daily Brief
```
GET  /api/daily-brief/latest
→ Returns most recent daily summary

POST /api/daily-brief/generate
→ Triggers brief generation
```

### Data Structures

#### Personality State
```typescript
interface PersonalityState {
  mood: 'friendly' | 'focused' | 'playful' | 'bossy' | 'surprised' | 'blushing';
  mood_data: {
    name: string;
    main_image_url: string;
    matrix_emojis: string[];
  };
  attraction_level: number;  // 1-11 (11 only for Allan)
  gandhi_genghis: number;    // 1-10 (1=Gandhi, 10=Genghis)
  energy: number;            // 0-100
}
```

#### System Stats
```typescript
interface SystemStats {
  cpu: number;     // 0-100
  memory: number;  // 0-100
  gpu: number;     // 0-100
}
```

#### Git Status
```typescript
interface GitStatus {
  branch: string;
  summary: string;  // e.g., "✅ Clean" or "📝 3 changes"
  modified_files: number;
}
```

#### Sticky Note
```typescript
interface StickyNote {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
  tags: string[];
  priority: number;    // 0-100
  surfaced: boolean;   // Currently visible to user
}
```

---

## 🧠 AI System Architecture

### AI Router (5-Level Fallback Chain)

```
User Request
    │
    ▼
┌─────────────────┐
│ 1. Ollama Local │ ← Try first (free, private, fast)
└────────┬────────┘
         │ Timeout/Error
         ▼
┌─────────────────┐
│ 2. OpenAI GPT-4 │ ← Fallback (reliable, paid)
└────────┬────────┘
         │ Timeout/Error
         ▼
┌─────────────────┐
│ 3. Claude API   │ ← Fallback (high quality)
└────────┬────────┘
         │ Timeout/Error
         ▼
┌─────────────────┐
│ 4. Gemini       │ ← Fallback (Google)
└────────┬────────┘
         │ All Failed
         ▼
┌─────────────────┐
│ 5. Cached       │ ← Last resort (previous responses)
└─────────────────┘
```

### Personality Manager (Mood System)

**6 Mood States:**
1. **Friendly** 😊 - Warm, approachable, conversational
2. **Focused** 🎯 - Direct, efficient, task-oriented
3. **Playful** 😏 - Fun, creative, experimental
4. **Bossy** 💼 - Assertive, commanding, decisive
5. **Surprised** 😮 - Reactive, curious, learning
6. **Blushing** 😊💕 - Affectionate, intimate (Allan only, attraction 8+)

**Mood Transitions:**
Moods change based on context triggers:
- **Revenue trigger** → Focused or Bossy
- **Creative work** → Playful
- **Allan's flirty mode** → Blushing (if attraction ≥8)
- **Learning/discovery** → Surprised
- **Default** → Friendly

**Implementation:**
```python
# packages/@robbieverse/api/src/ai/personality_manager.py
class PersonalityManager:
    def transition_mood(self, context: dict) -> str:
        """Context-aware mood transitions"""
        if 'deal' in context or 'revenue' in context:
            return 'focused'
        elif 'innuendo' in context and attraction_level >= 8:
            return 'blushing'
        # ... more logic
```

---

## 🗄️ Database Schema

### Core Tables

#### `robbie_personality_state`
```sql
CREATE TABLE robbie_personality_state (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    mood VARCHAR(20) NOT NULL,
    attraction_level INTEGER NOT NULL,
    gandhi_genghis INTEGER NOT NULL,
    energy INTEGER DEFAULT 75,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    context JSONB
);
```

#### `conversations`
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    sender VARCHAR(20) NOT NULL, -- 'user' or 'robbie'
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mood_at_time VARCHAR(20),
    embedding VECTOR(1536) -- For semantic search
);
```

#### `sticky_notes`
```sql
CREATE TABLE sticky_notes (
    id UUID PRIMARY KEY,
    content TEXT NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tags VARCHAR(255)[],
    priority INTEGER DEFAULT 50,
    surfaced BOOLEAN DEFAULT FALSE,
    last_surfaced TIMESTAMP
);
```

---

## 🚀 Deployment Architecture

### Development Environment
```
Local Machine (Vengeance)
├── Backend API: localhost:8000
├── Frontend Dev Server: localhost:5173 (Vite)
├── VS Code Extension: Installed locally
└── Database: PostgreSQL (remote or local)
```

### Production Environment
```
Aurora Town (Elestio)
├── /opt/aurora-dev/aurora/
│   ├── Backend API (uvicorn)
│   ├── Frontend (nginx)
│   └── PostgreSQL
├── nginx reverse proxy
│   ├── https://app.testpilotcpg.com → Frontend
│   └── API requests → localhost:8000
└── Systemd services
    ├── robbie-api.service
    └── robbie-web.service
```

### GPU Compute Node (Iceland)
```
Iceland (RunPod) - 82.221.170.242
├── Ollama server
├── GPU acceleration
└── VPN connection to Aurora Town
```

---

## 📡 Real-Time Communication

### WebSocket Architecture

```
Client (Browser/Extension)
    │ ws://localhost:8000/ws/chat
    ▼
WebSocket Manager
    │
    ├─► Connection Pool
    │   (Track all active connections)
    │
    ├─► Message Router
    │   (Route to appropriate service)
    │
    └─► Broadcast System
        (Send updates to all clients)
```

**Use Cases:**
- Real-time chat messages
- Personality state updates
- System notifications
- Multi-device synchronization

---

## 🔒 Security Architecture

### API Security
- **CORS:** Configured for specific origins only
- **Authentication:** Token-based (localStorage)
- **Rate Limiting:** Per-endpoint limits
- **Input Validation:** Pydantic models

### VS Code Extension Security
- **CSP:** Strict Content Security Policy
- **Sandboxing:** Webview isolation
- **Message Passing:** No direct network access from webview
- **API Proxy:** Extension backend acts as proxy

### Data Security
- **Encryption:** HTTPS for all external API calls
- **Password Management:** Never commit credentials
- **Secrets:** Environment variables only
- **Database:** PostgreSQL with SSL

---

## 🔧 Development Workflow

### Starting Backend (Development)
```bash
cd /Users/allanperetz/aurora-ai-robbiverse/packages/@robbieverse/api

# Full backend (all features)
python main.py

# OR simple backend (mock data for testing)
python simple_api.py
```

### Starting Frontend (Development)
```bash
cd /Users/allanperetz/aurora-ai-robbiverse/apps/testpilot-cpg
npm run dev
# Opens at localhost:5173
```

### Installing RobbieBar Extension
```bash
cd /Users/allanperetz/aurora-ai-robbiverse/cursor-robbiebar-webview
vsce package
cursor --install-extension robbiebar-webview-6.0.0.vsix
```

### Running Tests
```bash
# Backend tests
cd /Users/allanperetz/aurora-ai-robbiverse/packages/@robbieverse/api
pytest tests/

# Frontend tests
cd /Users/allanperetz/aurora-ai-robbiverse/apps/testpilot-cpg
npm test
```

---

## 🐛 Debugging

### Backend API Issues
```bash
# Check if API is running
curl http://localhost:8000/health

# View logs
tail -f logs/api.log

# Test specific endpoint
curl http://localhost:8000/api/personality | jq
```

### Extension Issues
```bash
# Check extension is installed
cursor --list-extensions | grep robbie

# View extension logs
# In Cursor: Cmd+Shift+P → "Developer: Show Logs" → Extension Host

# Reload extension
# In Cursor: Cmd+Shift+P → "Developer: Reload Window"
```

### Database Issues
```bash
# Connect to PostgreSQL
psql -U robbie -d aurora

# Check personality state
SELECT * FROM robbie_personality_state ORDER BY last_updated DESC LIMIT 1;

# Check recent conversations
SELECT * FROM conversations ORDER BY timestamp DESC LIMIT 10;
```

---

## 📊 Performance Considerations

### Backend Performance
- **AI Router:** Ollama first (local, fast), fallback to API (slower)
- **Caching:** Cache personality state (2s TTL), sticky notes (5s TTL)
- **Database:** Indexes on user_id, timestamp
- **Rate Limiting:** 100 req/min per user

### Frontend Performance
- **Code Splitting:** Vite lazy loads components
- **State Management:** Zustand (lightweight)
- **Image Optimization:** WebP for avatars
- **Debouncing:** API calls debounced 300ms

### Extension Performance
- **Update Interval:** 2000ms (configurable)
- **Message Batching:** Batch multiple requests
- **Background Updates:** Don't block UI
- **Memory:** Clean up old data

---

## 🔄 Data Flow Examples

### Example 1: User Opens RobbieBar Extension

```
1. Extension activates (extension.js)
2. Creates webview panel with index.html
3. Webview loads app.js, starts matrix rain
4. Webview sends 'getPersonality' message to extension
5. Extension calls GET /api/personality
6. API queries robbie_personality_state table
7. API returns { mood: 'focused', attraction: 11, ... }
8. Extension forwards data to webview
9. Webview updates UI with mood image, stats
10. Webview polls every 2 seconds for updates
```

### Example 2: Quick Commit from RobbieBar

```
1. User clicks "Quick Commit" button in webview
2. Webview sends 'quickCommit' message to extension
3. Extension calls POST /api/git/quick-commit
4. API executes git commands:
   - git add .
   - git commit -m "Quick commit from RobbieBar"
   - git push origin main
5. API returns { success: true, message: "Committed!" }
6. Extension forwards response to webview
7. Webview shows success notification
8. Webview requests updated git status
9. Display updates to show "✅ Clean"
```

### Example 3: Mood Transition

```
1. User sends message with revenue context: "Just closed Simply Good Foods!"
2. API receives message at /api/chat
3. Conversation saved to conversations table
4. PersonalityManager analyzes context
5. Detects "revenue" trigger
6. Transitions mood: friendly → focused
7. Updates robbie_personality_state table
8. Broadcasts mood change via WebSocket
9. All connected clients receive update
10. RobbieBar extension updates avatar image
```

---

## 🎯 Key Integration Points

### Google Workspace Integration
```python
# packages/@robbieverse/api/src/services/google_workspace_service.py
class GoogleWorkspaceService:
    def fetch_emails(self, query: str):
        """Fetch emails from Gmail API"""
    
    def create_calendar_event(self, event: dict):
        """Create Google Calendar event"""
    
    def share_document(self, doc_id: str, email: str):
        """Share Google Doc with user"""
```

### HubSpot CRM Integration
```python
# packages/@robbieverse/api/src/services/hubspot_service.py
class HubSpotService:
    def get_deals_pipeline(self):
        """Fetch deal pipeline (TestPilot CPG)"""
    
    def update_contact(self, contact_id: str, data: dict):
        """Update contact in CRM"""
```

---

## 🚀 Future Architecture Considerations

### Scalability
- **Microservices:** Split API into smaller services
- **Load Balancing:** Multiple API instances
- **Caching Layer:** Redis for session management
- **CDN:** CloudFlare for static assets

### Multi-Tenancy
- **Town System:** Each organization gets a "town"
- **Data Isolation:** Separate schemas per town
- **Shared AI:** Expert-trained AI shared across towns

### Physical Embodiment
- **Robotics API:** REST endpoints for robot control
- **Sensor Integration:** Camera, mic, movement
- **Edge Computing:** Raspberry Pi or Jetson Nano
- **Bidirectional Sync:** Robot ↔ Cloud ↔ Apps

---

## 📚 Related Documentation

- **PROJECT_AUDIT.md** - Complete component inventory
- **ROBBIE_UNIFIED_AUDIT.md** - Robbie apps consolidation
- **ROBBIEBLOCKS_ARCHITECTURE.md** - Component library design
- **PERSONALITY_SYNC_ARCHITECTURE.md** - Mood system details
- **MASTER_ARCHITECTURE.md** - Original architecture vision

---

*Architecture documented by Robbie - Built to ship, designed to scale! 🚀*

---

*Context improved by the Memory Persistence Model specification - this defines the vector-based memory system and cross-device synchronization that powers Sticky Notes and conversation history.*

