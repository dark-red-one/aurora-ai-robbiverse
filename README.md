# 🚀 Aurora AI Robbiverse - Allan's AI Empire

**The monorepo for TestPilot CPG and Allan's AI-powered business empire**

---

## 🎯 What This Is

A complete AI platform where:

- **TestPilot CPG** gets revenue-generating AI tools (YOUR BUSINESS FIRST)
- **RobbieBlocks** provides shared UI components
- **Robbieverse API** powers all backends
- **One database** stores everything (unified schema)
- **Multiple apps** share the same foundation

---

## 📂 Repository Structure

```
aurora-ai-robbiverse/                    # Monorepo root
│
├── packages/                            # Shared packages
│   ├── @robbieblocks/core/              # UI components (React)
│   ├── @robbieverse/api/                # Backend API (FastAPI)
│   ├── @robbie/personality/             # AI personality system
│   └── @robbie/memory/                  # Vector memory
│
├── apps/                                # Your actual products
│   ├── testpilot-cpg/                   # 🎯 Allan's business (Priority #1)
│   ├── chat-minimal/                    # Template/proof-of-concept
│   ├── leadershipquotes/                # Future site
│   └── archive-legacy/                  # Old apps (archived safe)
│
├── database/                            # Unified database schema
│   ├── unified-schema/                  # 21 SQL files, 85+ tables
│   └── init-unified-schema.sql          # Master initialization
│
├── infrastructure/                      # Deployment configs
│   ├── docker/docker-compose.yml        # PostgreSQL + Redis
│   └── nginx/nginx.conf.template        # Reverse proxy
│
└── docs/                                # Documentation
    ├── guides/
    └── archive-2025-01-09/              # Old conflicting docs
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- 8GB RAM minimum

### 1. Clone Repository

```bash
git clone https://github.com/allanperetz/aurora-ai-robbiverse.git
cd aurora-ai-robbiverse
```

### 2. Install Dependencies

```bash
# Install all workspace packages
npm install

# Install Python dependencies for API
cd packages/@robbieverse/api
pip install -r requirements.txt
```

### 3. Start Database

```bash
cd infrastructure/docker
docker-compose up -d postgres
```

### 4. Initialize Database

```bash
cat ../../database/init-unified-schema.sql | docker exec -i robbieverse-postgres psql -U robbie -d robbieverse
```

### 5. Start API

```bash
cd packages/@robbieverse/api
python main.py

# API runs on http://127.0.0.1:8000
# Docs at http://127.0.0.1:8000/docs
```

### 6. Start Frontend (TestPilot CPG)

```bash
cd apps/testpilot-cpg
npm install
npm run dev

# Opens at http://localhost:5173
```

---

## 📚 Key Documentation

Start here:

- **[MASTER_VISION.md](./MASTER_VISION.md)** - The complete empire vision
- **[MASTER_ARCHITECTURE.md](./MASTER_ARCHITECTURE.md)** - Technical architecture
- **[MASTER_ROADMAP.md](./MASTER_ROADMAP.md)** - Build order and phases
- **[CHAT_APP_STACK.md](./CHAT_APP_STACK.md)** - Technology stack

For specific topics:

- **[database/README.md](./database/README.md)** - Database schema guide
- **[infrastructure/README.md](./infrastructure/README.md)** - Deployment guide
- **[apps/testpilot-cpg/README.md](./apps/testpilot-cpg/README.md)** - TestPilot app

---

## 💼 Apps in This Monorepo

### TestPilot CPG (Priority #1)

**Location:** `apps/testpilot-cpg/`  
**Domain:** app.testpilotcpg.com  
**Purpose:** Allan's revenue dashboard & AI-powered CRM

**Features:**

- Sales pipeline with AI risk scoring
- Smart outreach suggestions
- Daily revenue briefs (3x per day)
- Chat with Robbie about deals
- Meeting intelligence & action items

### Chat Minimal (Template)

**Location:** `apps/chat-minimal/`  
**Purpose:** Proof-of-concept, template for new apps

**Features:**

- Simple chat with Robbie
- Vector memory (remembers conversations)
- Personality system (moods, Gandhi-Genghis)
- Streaming responses

### LeadershipQuotes (Future)

**Location:** `apps/leadershipquotes/`  
**Domain:** leadershipquotes.com  
**Purpose:** Prove monorepo scales to multiple products

---

## 🗄️ Database

**One unified PostgreSQL database with pgvector**

**Key Tables:**

- `contacts`, `companies`, `deals` - CRM (for TestPilot)
- `conversations`, `messages` - Chat with vector embeddings
- `ai_personalities`, `ai_personality_state` - Robbie's moods
- `robbieblocks_pages`, `robbieblocks_components` - Dynamic CMS
- **85+ tables total** across 21 schema files

**Initialize:**

```bash
cd database
docker exec -i robbieverse-postgres psql -U robbie -d robbieverse < init-unified-schema.sql
```

---

## 🤖 AI Services

### Extracted from Archive (5,000+ lines of working code!)

**Core Services:**

- **Priorities Engine** - Self-managing AI that decides what to do next
- **Daily Brief System** - 3x daily summaries (8 AM, 1 PM, 5 PM)
- **AI Router** - 5-level fallback chain (never fails!)
- **Sticky Notes Learning** - Extracts insights from conversations
- **Touch Ready** - Outreach suggestions with auto-drafted messages
- **Personality Manager** - Mood system & Gandhi-Genghis spectrum

**Status:** Extracted and ready for integration (Phase 1)

---

## 🛠️ Development Workflow

### Work on TestPilot CPG

```bash
cd apps/testpilot-cpg
npm run dev
# Make changes
# Hot reload active
```

### Update Shared Components

```bash
cd packages/@robbieblocks/core
# Make changes
# All apps automatically get updates
```

### Update API

```bash
cd packages/@robbieverse/api
python main.py
# Test endpoints at http://localhost:8000/docs
```

### Update Database Schema

```bash
cd database/unified-schema
# Edit schema files
# Re-run init-unified-schema.sql
```

---

## 🚢 Deployment

### TestPilot CPG Production

```bash
# Build frontend
cd apps/testpilot-cpg
npm run build

# Deploy with nginx
sudo cp -r dist/* /var/www/testpilot-cpg/

# Start API
cd packages/@robbieverse/api
gunicorn main:app --workers 4 --bind 127.0.0.1:8000
```

### Configure Nginx

```bash
sudo cp infrastructure/nginx/nginx.conf.template /etc/nginx/sites-available/robbieverse
sudo ln -s /etc/nginx/sites-available/robbieverse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🏛️ The Empire

### Current Infrastructure

- **Aurora Town** - Production server (Dual RTX 4090s, master database)
- **RobbieBook1** - MacBook Pro (local dev, offline capability)
- **Vengeance** - Gaming rig (local testing)
- **Collaboration** - Contractor access node
- **Fluenti** - Marketing operations node

All syncing to Aurora Town master database.

---

## 📖 Learn More

**Vision & Strategy:**

- Read [MASTER_VISION.md](./MASTER_VISION.md) to understand the big picture
- Read [MASTER_ROADMAP.md](./MASTER_ROADMAP.md) for the build plan

**Technical Deep Dives:**

- [MASTER_ARCHITECTURE.md](./MASTER_ARCHITECTURE.md) - System architecture
- [CHAT_APP_STACK.md](./CHAT_APP_STACK.md) - Technology stack
- [database/README.md](./database/README.md) - Database guide

**What We Built:**

- [RESTRUCTURE_COMPLETE.md](./RESTRUCTURE_COMPLETE.md) - Monorepo transformation
- [EMPIRE_INVENTORY_COMPLETE.md](./EMPIRE_INVENTORY_COMPLETE.md) - Complete system inventory
- [VALUE_EXTRACTION_REPORT.md](./VALUE_EXTRACTION_REPORT.md) - Services we rescued

---

## 🎯 Current Status

**Phase 0: Foundation** ✅ COMPLETE

- Monorepo structured
- Services extracted
- Infrastructure simplified
- Documentation consolidated

**Phase 1: Integration** 🎯 NEXT (2-3 days)

- Wire up extracted services
- Fix imports and paths
- Test API end-to-end

**Phase 2: Chat Minimal** 📋 Planned (1-2 weeks)

**Phase 3: TestPilot CPG** 💰 Goal (2-4 weeks)

---

## 💪 Contributing

This is Allan's private empire, but the structure is:

- **Shared code** in `packages/`
- **Apps** in `apps/`
- **One database** schema
- **Clean separation** of concerns

---

## 📞 Contact

**Owner:** Allan Peretz  
**Email:** <allan@testpilotcpg.com>  
**Business:** TestPilot CPG  
**Purpose:** Build AI tools that close deals and make money

---

**Built by Robbie, for Allan's Empire** 🤖💜

**"We build for TestPilot, then productize for the world."**
