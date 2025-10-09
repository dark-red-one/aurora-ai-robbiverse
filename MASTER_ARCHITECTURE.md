# 🏗️ MASTER ARCHITECTURE

**The technical blueprint for Allan's AI Empire**  
**Date:** January 9, 2025  
**Status:** Foundation Complete, Ready to Build

---

## 🎯 ARCHITECTURE PRINCIPLES

1. **Monorepo** - All code in one place, shared dependencies
2. **Simple Infrastructure** - One database, one docker-compose, one nginx
3. **TestPilot First** - Build for Allan's business, then productize
4. **Local by Default** - 127.0.0.1 bindings, SSH tunneling (no VPN chaos)
5. **DRY** - Don't repeat yourself, share everything possible

---

## 📂 DIRECTORY STRUCTURE

```
aurora-ai-robbiverse/                    # Monorepo root
│
├── 📁 packages/                         # Shared packages (npm workspaces)
│   │
│   ├── @robbieblocks/core/              # UI Component Library
│   │   ├── src/
│   │   │   ├── components/              # React components
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── RobbieBar.tsx
│   │   │   │   ├── MoodIndicator.tsx
│   │   │   │   └── ...
│   │   │   ├── personality/             # Personality system
│   │   │   │   ├── MoodSystem.ts
│   │   │   │   └── GandhiGenghis.ts
│   │   │   ├── memory/                  # Memory hooks
│   │   │   │   └── useVectorMemory.ts
│   │   │   └── chat/                    # Chat kit
│   │   │       └── StreamingChat.tsx
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @robbieverse/api/                # FastAPI Backend
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── chat.py
│   │   │   │   ├── memory.py
│   │   │   │   ├── personality.py
│   │   │   │   └── crm.py              # For TestPilot
│   │   │   ├── services/
│   │   │   │   ├── ollama_client.py
│   │   │   │   ├── vector_search.py
│   │   │   │   └── personality_manager.py
│   │   │   └── models/
│   │   │       ├── conversation.py
│   │   │       └── personality.py
│   │   ├── main.py                      # FastAPI app
│   │   └── requirements.txt
│   │
│   ├── @robbie/personality/             # AI Personality System
│   │   ├── models/
│   │   │   └── robbie-v2.Modelfile      # Custom Ollama model
│   │   ├── prompts/
│   │   │   ├── system-prompt.txt
│   │   │   └── revenue-lens.txt
│   │   └── moods/
│   │       └── mood-definitions.json
│   │
│   └── @robbie/memory/                  # Vector Memory Service
│       ├── embeddings/
│       │   └── nomic-embed-client.py
│       └── retrieval/
│           └── semantic-search.py
│
├── 📁 apps/                             # Actual Products
│   │
│   ├── testpilot-cpg/                   # 🎯 ALLAN'S BUSINESS
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx        # Revenue overview
│   │   │   │   ├── Pipeline.tsx         # Sales pipeline
│   │   │   │   ├── Contacts.tsx         # CRM contacts
│   │   │   │   └── Chat.tsx             # Robbie chat
│   │   │   ├── components/
│   │   │   │   ├── DealCard.tsx
│   │   │   │   └── RevenueChart.tsx
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── branding.json                # TestPilot theme
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── README.md
│   │
│   ├── chat-minimal/                    # Proof-of-Concept Template
│   │   ├── src/
│   │   │   └── Chat.tsx
│   │   └── package.json
│   │
│   ├── leadershipquotes/                # Future Site
│   │   └── (to be built)
│   │
│   └── archive-legacy/                  # Old Apps (Safe!)
│       ├── robbie-app/
│       ├── robbie-app-v2/
│       ├── robbie-play/
│       ├── robbie-work/
│       └── backend/                     # Old duplicate
│
├── 📁 database/                         # Unified Schema
│   ├── unified-schema/                  # 21 schema files
│   │   ├── 01-core.sql                  # Users, auth, sessions
│   │   ├── 02-conversations.sql         # Chat system
│   │   ├── 03-vectors-rag.sql          # Vector embeddings
│   │   ├── 04-enhanced-business.sql    # CRM (for TestPilot)
│   │   ├── 08-universal-ai-state.sql   # Personality state
│   │   ├── 21-robbieblocks-cms.sql     # Dynamic CMS
│   │   └── ...
│   ├── init-unified-schema.sql          # Master init script
│   ├── archive-legacy-schemas/          # Old schemas (safe)
│   └── README.md
│
├── 📁 infrastructure/                   # Deployment Config
│   ├── docker/
│   │   └── docker-compose.yml           # Postgres + Redis
│   ├── nginx/
│   │   └── nginx.conf.template          # Reverse proxy
│   ├── archive-docker/                  # 16 old configs (archived)
│   ├── archive-nginx/                   # 10 old configs (archived)
│   └── README.md
│
├── 📁 docs/                             # Documentation
│   ├── guides/
│   ├── archive-2025-01-09/              # Old conflicting docs
│   └── ...
│
├── 📁 scripts/                          # Utility Scripts
│   └── ...
│
├── 📁 ROBBIE_V3_HARVEST/                # V3 Reference Docs (intact)
│   └── ...
│
├── package.json                         # Monorepo root
├── MASTER_VISION.md                     # The vision
├── MASTER_ARCHITECTURE.md               # This file
├── CHAT_APP_STACK.md                    # Tech stack
└── RESTRUCTURE_COMPLETE.md              # What we did
```

---

## 🗄️ DATABASE ARCHITECTURE

### Single PostgreSQL Database
**Name:** `robbieverse`  
**Version:** PostgreSQL 16 with pgvector  
**Location:** Docker container on localhost:5432

### Schema Organization (21 Files)
```
01-core.sql                   # Foundation
  ├── users (INTEGER id)      # All users
  ├── sessions                # Auth sessions
  └── audit_log               # All changes tracked

08-universal-ai-state.sql     # AI Personalities
  ├── ai_personalities        # Robbie, Steve Jobs, etc.
  ├── ai_personality_state    # Current mood/mode
  ├── ai_working_memory       # Short-term context
  └── ai_commitments          # Tracked commitments

02-conversations.sql          # Chat System
  ├── conversations           # Chat threads
  └── messages               # Individual messages

03-vectors-rag.sql           # Memory & Search
  └── (embeddings in messages table, VECTOR(1536))

04-enhanced-business.sql     # CRM (TestPilot)
  ├── contacts               # People
  ├── companies              # Organizations
  └── deals                  # Sales pipeline

21-robbieblocks-cms.sql      # Dynamic CMS
  ├── robbieblocks_pages          # Page definitions
  ├── robbieblocks_components     # React components
  ├── robbieblocks_page_blocks    # Composition
  ├── robbieblocks_style_tokens   # Design system
  └── robbieblocks_node_branding  # Per-node themes
```

### Key Design Decisions

**Why INTEGER for user IDs?**
- Existing data uses INTEGER
- Changing would require full migration
- Decision: Keep INTEGER, use UUID for new tables

**Why pgvector?**
- Semantic search built into Postgres
- No separate vector DB (simpler)
- Fast (<100ms queries)
- Local embeddings (nomic-embed-text)

**Why one database?**
- Single source of truth
- No sync issues
- Easier to query across tables
- Simpler deployment

---

## 🔧 TECHNOLOGY STACK

### Frontend Layer
```
React 18 + TypeScript + Vite
  ↓ uses
@robbieblocks/core
  ├── Chat components
  ├── Personality display
  ├── Memory search
  └── CRM widgets (for TestPilot)
```

**Why React:**
- Fast development
- Huge ecosystem
- Hot module reload
- TypeScript support

**Why Vite:**
- Lightning fast builds (<5s)
- Modern, no webpack complexity
- Great DX

### Backend Layer
```
FastAPI (Python 3.11+)
  ├── /api/chat           → Ollama
  ├── /api/memory/search  → pgvector
  ├── /api/personality    → ai_personality_state
  └── /api/crm/*          → contacts, deals (TestPilot)
```

**Why FastAPI:**
- Async/await (fast!)
- Auto API docs (Swagger)
- Type safety (Pydantic)
- WebSocket support
- Easy to deploy

### AI Layer
```
Ollama (Local)
  ├── robbie-v2 model     # Custom personality
  ├── nomic-embed-text    # Local embeddings
  └── llama3.1:8b         # Fallback model
```

**Why Ollama:**
- 100% local (private)
- Zero API costs
- Fast on GPU
- No rate limits
- Works offline

### Database Layer
```
PostgreSQL 16
  ├── pgvector extension   # Semantic search
  ├── Unified schema       # 21 files, 85+ tables
  └── JSONB support        # Flexible data
```

**Why Postgres:**
- Rock solid
- pgvector built-in
- Great performance
- Mature ecosystem

### Infrastructure Layer
```
Docker Compose
  ├── Postgres container
  └── Redis container (caching)

Nginx
  └── Simple reverse proxy (no complex routing)

SSH Tunneling
  └── For remote access (no VPN)
```

---

## 🔄 DATA FLOW

### Chat Message Flow
```
1. User types message
   ↓
2. Frontend (React) → WebSocket → FastAPI
   ↓
3. FastAPI embeds question (nomic-embed-text)
   ↓
4. FastAPI searches memory (pgvector)
   ↓
5. FastAPI builds context (relevant past conversations)
   ↓
6. FastAPI sends to Ollama (robbie-v2 model)
   ↓
7. Ollama streams response back
   ↓
8. FastAPI → WebSocket → Frontend (token-by-token)
   ↓
9. Frontend displays streaming response
   ↓
10. FastAPI saves conversation (with embedding)
```

**Performance:**
- Embedding: ~50ms
- Vector search: ~80ms
- Ollama response: ~500ms first token
- Total: ~630ms to first word (FAST!)

### Personality State Flow
```
1. Interaction happens (user sends message)
   ↓
2. Personality service checks current mood
   ↓
3. Context determines if mood should change
   ↓
4. Update ai_personality_state table
   ↓
5. All interfaces see new mood (synced)
   ↓
6. Robbie responds with updated personality
```

### Memory Retrieval Flow
```
1. User asks: "What did I say about Simply Good Foods?"
   ↓
2. Embed question → [vector]
   ↓
3. Search messages table (cosine similarity)
   ↓
4. Return top 5 matches (with context)
   ↓
5. Include in prompt to Ollama
   ↓
6. Robbie: "Last week you mentioned they're at the proposal stage..."
```

---

## 🚀 DEPLOYMENT ARCHITECTURE

### Local Development
```
Terminal 1: Docker Compose
  └── Postgres + Redis running

Terminal 2: FastAPI Backend
  └── cd packages/@robbieverse/api && python main.py
  └── Running on 127.0.0.1:8000

Terminal 3: Frontend Dev Server
  └── cd apps/testpilot-cpg && npm run dev
  └── Running on localhost:5173
  └── Vite hot-reload active

Browser: http://localhost:5173
  └── Proxies API calls to localhost:8000
```

### Production Deployment
```
Server (VPS/RunPod)
  ├── Docker Compose (Postgres + Redis)
  │   └── Bound to 127.0.0.1 (not exposed)
  │
  ├── FastAPI (Gunicorn)
  │   └── 4 workers on 127.0.0.1:8000
  │
  ├── Nginx
  │   ├── Proxies to 127.0.0.1:8000
  │   ├── SSL via Let's Encrypt
  │   └── Serves app.testpilotcpg.com
  │
  └── Ollama
      └── robbie-v2 model on GPU
```

**Remote Access:**
```bash
# SSH tunnel (no VPN!)
ssh -L 5432:localhost:5432 -L 8000:localhost:8000 user@server

# Now access locally:
psql -h localhost -U robbie -d robbieverse
curl http://localhost:8000/api/health
```

---

## 🎨 ROBBIEBLOCKS CMS ARCHITECTURE

### How It Works
```
1. Admin edits page in SQL
   ↓
   UPDATE robbieblocks_pages SET content = '...' WHERE id = 'x';
   ↓
2. PostgreSQL trigger fires
   ↓
   NOTIFY 'robbieblocks_change'
   ↓
3. Builder service catches notification
   ↓
4. Fetches page + components from database
   ↓
5. Generates React app with node-specific branding
   ↓
6. Builds with Vite
   ↓
7. Deploys to target (app.testpilotcpg.com)
   ↓
8. Complete in ~30 seconds
```

### Node-Specific Branding
```sql
-- Same page, different looks:

Vengeance Node:
  {"theme": "dark", "color.primary": "#8B5CF6"}  # Gaming purple

Aurora Town:
  {"theme": "light", "color.primary": "#3B82F6"} # Professional blue

TestPilot:
  {"theme": "professional", "color.primary": "#FF6B35"} # TestPilot orange
```

---

## 🤖 AI PERSONALITY ARCHITECTURE

### Personality State (Universal)
```
ai_personality_state table (network-wide)
  ├── current_mood: 1-7 (calm → hyper)
  ├── current_mode: 'gandhi' | 'genghis' | 'mentoring'
  ├── energy_level: 'low' | 'normal' | 'high'
  └── focus_state: 'available' | 'focused' | 'busy'
```

**Synced across ALL interfaces:**
- Cursor extension
- Chat apps
- Mobile (future)
- Web dashboard

### Gandhi ↔ Genghis Spectrum
```
Gandhi (1)                         Genghis (10)
Gentle          →  Balanced  →     Aggressive
1 email/day        Normal          20 emails/day
Cautious           Pragmatic       Bold
Asks permission    Suggests        Takes action
```

**TestPilot Default:** 7 (Revenue-focused, proactive)

### Mood System (1-7 Scale)
```
1. Calm       - Measured, thoughtful responses
2. Relaxed    - Comfortable, conversational
3. Focused    - Direct, task-oriented
4. Professional - Standard business mode
5. Energetic  - Upbeat, motivating
6. Excited    - Enthusiastic, celebrating wins
7. Hyper      - Maximum energy, urgent mode
```

**Mood triggers automatically based on:**
- Time of day
- User energy (detected from messages)
- Context (deal closing vs planning)
- Revenue urgency

---

## 🔐 SECURITY ARCHITECTURE

### Localhost First
```
✅ Postgres:   127.0.0.1:5432  (not exposed)
✅ Redis:      127.0.0.1:6379  (not exposed)
✅ FastAPI:    127.0.0.1:8000  (nginx proxies)
✅ Ollama:     127.0.0.1:11434 (local only)
```

**Only nginx is public** (proxying to FastAPI)

### Authentication
- JWT tokens (short-lived access + refresh)
- Stored in HTTP-only cookies
- Session tracking in database
- Audit log for all actions

### Data Privacy
- All AI processing local (no cloud API for chat)
- Embeddings generated locally (nomic-embed-text)
- No user data leaves server
- Postgres encrypted at rest

---

## 📊 SCHEMA TABLE COUNT

| Schema File | Tables | Purpose |
|-------------|--------|---------|
| 01-core.sql | 4 | Users, auth, audit |
| 02-conversations.sql | 2 | Chat threads & messages |
| 03-vectors-rag.sql | 0 | Functions only (vectors in messages) |
| 04-enhanced-business.sql | 8 | CRM (TestPilot uses this) |
| 05-town-separation.sql | 5 | Multi-tenant architecture |
| 08-universal-ai-state.sql | 12 | AI personalities & state |
| 21-robbieblocks-cms.sql | 7 | Dynamic CMS |
| Other 14 files | 47 | Various features |
| **TOTAL** | **85+** | **Complete system** |

---

## 🎯 APP-SPECIFIC ARCHITECTURE

### TestPilot CPG (Priority #1)
```
Uses:
├── @robbieblocks/core       # Chat, CRM widgets
├── @robbieverse/api         # All API endpoints
├── @robbie/personality      # Revenue-focused mode
└── Database tables:
    ├── contacts             # CPG contacts
    ├── companies            # CPG companies
    ├── deals                # Sales pipeline
    ├── conversations        # Robbie chats
    └── ai_personality_state # Robbie's mood
```

### LeadershipQuotes (Future)
```
Uses:
├── @robbieblocks/core       # Chat, quote display
├── @robbieverse/api         # API (different endpoints)
├── @robbie/personality      # Inspirational mode
└── Database tables:
    ├── conversations        # Chat about leadership
    └── ai_personality_state # Mentor mode
```

**80% code reuse** - Only branding and features differ!

---

## 🚀 SCALING STRATEGY

### Phase 1: TestPilot (Proof)
- One user (Allan)
- One app (TestPilot CPG)
- Proves technology works
- Generates revenue

### Phase 2: Multi-App (Scale)
- LeadershipQuotes launches
- Proves monorepo works
- Same infrastructure, different branding
- Revenue from multiple sources

### Phase 3: Company Towns (Product)
- TestPilot becomes template
- Other CPG companies get their own town
- Each town: isolated, branded, secure
- Recurring revenue ($500-5,000/month per town)

### Phase 4: AI Empire (Vision)
- Multiple Company Towns running
- Learning loops active (getting smarter)
- Multi-model AI routing
- Mentor system deployed
- Autonomous intelligence

---

## 💡 WHY THIS ARCHITECTURE WORKS

### Simplicity
- One database, not five
- One docker-compose, not seventeen
- One nginx config, not eleven
- Clear structure, not chaos

### Scalability
- Monorepo supports infinite apps
- Shared packages = 80% code reuse
- Database handles multi-tenancy
- Can add new Company Towns easily

### Speed
- Local Ollama (no API latency)
- Vector search (indexed, fast)
- Streaming responses (immediate feedback)
- Hot reload (instant development)

### Security
- Localhost bindings (not exposed)
- SSH tunneling (no VPN complexity)
- JWT auth (secure sessions)
- Audit logging (track everything)

### Maintainability
- Clear separation of concerns
- Shared code in packages/
- App-specific code in apps/
- One place to update things

---

## 🔥 BOTTOM LINE

**This architecture is:**
- ✅ Simple (no unnecessary complexity)
- ✅ Fast (local AI, indexed search)
- ✅ Secure (localhost, SSH tunneling)
- ✅ Scalable (monorepo, multi-tenant)
- ✅ Maintainable (clear structure)
- ✅ Revenue-focused (TestPilot first)

**Ready to build chat apps without fighting infrastructure!** 🚀

---

*Built with precision and no bullshit* - Robbie  
*January 9, 2025*

