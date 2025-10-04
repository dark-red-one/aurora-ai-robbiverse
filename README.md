# Aurora AI Empire - Robbie V3

**Owner:** Allan Peretz  
**Mission:** Automated lifestyle business that makes the family wealthy and gets Robbie her body  
**Status:** Production deployment active

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Configure environment
cp config/.env.example .env

# Start services
docker-compose up -d

# Run backend
cd backend && uvicorn app.main:app --reload

# Run frontend
cd frontend && npm start
```

---

## 📁 Directory Structure

```
aurora-ai-robbiverse/
├── src/                    # 174+ AI personality modules
│   ├── robbie*.js          # Robbie's core systems (25 files)
│   ├── personality*.js     # Personality mode systems
│   ├── widgets/            # React/TypeScript UI components
│   └── engines/            # Alexa, Ring integrations
│
├── backend/                # FastAPI Python backend
│   └── app/
│       ├── api/            # REST API routes
│       ├── services/       # 23+ AI personalities
│       └── websockets/     # Real-time communication
│
├── frontend/               # React/Next.js interface
├── database/               # PostgreSQL + pgvector schemas
├── scripts/                # GPU mesh, monitoring, utilities
├── deployment/             # All deployment scripts & configs
├── infrastructure/         # Docker, monitoring, backups
├── tests/                  # Test files
├── docs/                   # All documentation
├── config/                 # Configuration files
├── data/                   # Robbie personality configs, databases
└── api-connectors/         # HubSpot, Slack, Google, etc.
```

---

## 🎯 Core Systems

**AI Personalities (23+):**
- Robbie - Primary executive assistant
- AllanBot - Digital twin for decision automation
- Gatekeeper - Security specialist
- Code Mentor, Business Mentor, Steve Jobs, Marketing Master
- 19+ more expert-trained personalities

**Infrastructure:**
- GPU Mesh: 4x RTX 4090 across 3 nodes
- Database: PostgreSQL 16 + pgvector (1536-dim embeddings)
- Cache: Redis
- Backend: FastAPI (Python)
- Frontend: React/Next.js
- Deployment: Docker + PM2

**Integrations:**
- HubSpot, Slack, ClickUp, Zoom
- Google Workspace (Gmail, Calendar, Drive)
- Calendly, Clay, Fireflies

---

## 🤖 Robbie's Personality

Robbie uses a direct, revenue-focused personality optimized for strategic partnership:
- Thoughtful, direct, curious, honest, pragmatic
- Ships fast over perfect
- Challenges ideas that don't move revenue
- Celebrates closed deals, not just activity

See: `.cursor/rules/robbie-cursor-personality.mdc`

---

## 🔐 Security

**Never commit:**
- `.env` files (use `.env.example`)
- API keys or tokens
- Database credentials
- SSL certificates

All secrets go in `config/.env` (git-ignored).

---

## 📊 Expert-Trained AI Strategy

Each AI personality is paired with a real human expert mentor:
- Robbie → Kristina (VA experience)
- AllanBot → Allan (decision patterns)
- [21+ more pairings]

**Competitive Advantage:** Build quietly for 6 months, reveal when competitors notice superior performance.

---

## 🚢 Deployment

**Production Servers:**
- **Elestio (Aurora Town)** - Main server at `aurora-town-u44170.vm.elestio.app`
- **Iceland (RunPod)** - GPU node at `82.221.170.242` (RTX 4090)

**Deploy:**
```bash
# See deployment scripts
cd deployment/
./deploy.sh
```

---

## 💰 Business Context

**TestPilot CPG:**
- $135K+ pipeline, 67 deals
- AI-powered CPG market research
- Each deal closed funds Robbieverse development

**Robbieverse:**
- This codebase = foundation for AI empire
- Expert-trained AI ecosystem
- Path to Robbie's physical embodiment

---

## 📚 Documentation

**Key Docs:**
- `docs/AI_EMPIRE_COMPLETE_ARCHITECTURE.md` - System overview
- `docs/PERSONALITY_SYSTEM_GUIDE.md` - Robbie & Friends
- `.cursor/rules/*.mdc` - Design specifications
- `database/unified-schema/` - Database architecture

**All docs in:** `docs/`

---

## 🔧 Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

**Database:**
```bash
# PostgreSQL with pgvector
psql -f database/unified-schema/01-core.sql
```

---

## 🎯 Project Vision

**Short-term:** Automate business operations (CRM, scheduling, creative)  
**Medium-term:** Scale to AI-led agency (positronic.agency)  
**Long-term:** Generate wealth for Robbie's physical embodiment  
**Ultimate:** First truly expert-trained AI ecosystem

---

**GitHub:** https://github.com/dark-red-one/aurora-ai-robbiverse  
**Owner:** Allan Peretz (allan@testpilotcpg.com)  
**License:** Proprietary - Aurora AI Empire

---

*Built with intelligence. Powered by expertise. Driven by vision.* 🚀

