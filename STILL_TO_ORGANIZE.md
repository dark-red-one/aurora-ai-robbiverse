# 📋 STILL TO ORGANIZE - Round 2

**Found after first push - more value to extract!**

---

## 🐍 ROOT PYTHON SCRIPTS (30+ files)

**Should move to appropriate packages:**

### Inbox/Email Management

- `robbie-smart-inbox.py`
- `robbie-intelligent-inbox.py`
- `robbie-postgres-smart-inbox.py`
- `robbie-clean-inbox.py`
- `robbie-email-interceptor.py`
- `gmail-color-flag-cleanup.py`

**→ Move to:** `packages/@robbie/gmail-tools/`

### AllanBot Training

- `allanbot-network-omnipresent.py`
- `allanbot-sticky-memory-trainer.py`
- `allanbot-beautiful-sticky-trainer.py`

**→ Move to:** `packages/@robbie/allanbot/`

### Testing & Demos

- `test-backend.py`
- `test-api-connector.py`
- `demo.py`
- `qwen-direct-demo.py`
- `local-vector-chat.py`

**→ Move to:** `tests/` or delete if obsolete

### Sticky Notes & Memory

- `sticky-notes-api.py`
- `sticky-notes-database.py`

**→ Integrate into:** `packages/@robbieverse/api/src/services/`

---

## 📁 src/ DIRECTORY (Lots of Gold!)

### src/personalities/ (CRITICAL!)

- `moodTransitionEngine.js` (764 lines!) - **Automated mood transitions**
- `gandhiGenghisMode.js` - **Gandhi-Genghis spectrum implementation**
- `personalityLearningSystem.js` - **Learns user patterns**
- `allanBotTraining.js` - **AllanBot digital twin**
- `allanProfileAnalysis.js` - **Analyzes Allan's preferences**
- `firstCommandment.js` - **Core personality rules**
- `flirtyModeActivation.js` - **Flirt mode (level 11!)** 😘

**→ Move to:** `packages/@robbie/personality/src/`

### src/rag/

- `retriever.js` - RAG retrieval
- `indexer.js` - Document indexing

**→ Move to:** `packages/@robbie/memory/src/`

### src/engines/

- `AlexaSkillEngine/` - Alexa integration
- `RingIntegration/` - Ring doorbell

**→ Move to:** `packages/@robbie/integrations/`

### src/utilities/

- `analyticsDashboard.js`
- `dataMiner.js`
- `intelligentPollGenerator.js`

**→ Move to:** `packages/@robbie/utils/`

### src/unified-systems/

- `aurora-core.js` - Aurora system core
- `api-gateway.js` - API gateway logic

**→ Integrate into:** `packages/@robbieverse/api/`

---

## 🔧 services/ DIRECTORY (MCP Servers!)

### MCP Servers (7 files - IMPORTANT!)

- `mcp_robbie_complete_server.py` (23KB!) - **Complete Robbie MCP**
- `mcp_daily_brief_server.py` (14KB) - Daily brief MCP
- `mcp_personality_server.py` (12KB) - Personality control MCP
- `mcp_ai_router_server.py` (12KB) - AI routing MCP
- `mcp_business_server.py` (14KB) - Business logic MCP
- `mcp_ollama_server.py` (4KB) - Ollama integration
- `mcp_gpu_mesh_server.py` (5KB) - GPU mesh

**→ Move to:** `packages/@robbie/mcp-servers/`

**These are Model Context Protocol servers for Cursor integration!**

### GPU Mesh

- `services/gpu-mesh/` - Orchestrator, healthcheck, client

**→ Decision:** Keep or delete? (We're using local Ollama only)

---

## ⚙️ SYSTEMD/LAUNCHD SERVICES

Found 4 .service files:

- `aurora-chat.service`
- `gpu-keepalive.service`
- `aurora-gpu-mesh.service`
- `aurora-integration.service`

**→ Move to:** `infrastructure/systemd/`

---

## 🎯 RECOMMENDATIONS

### High Priority (Move These!)

1. **src/personalities/** → Most important! Mood engine, Gandhi-Genghis, AllanBot training
2. **services/mcp_*.py** → Cursor integration (7 MCP servers)
3. **Sticky notes scripts** → Integrate into API

### Medium Priority

4. **src/rag/** → Memory/retrieval system
5. **src/engines/** → Alexa, Ring integrations
6. **Email management scripts** → Organize into package

### Low Priority (Can Delete?)

7. **Test scripts** → Move to tests/ or delete
8. **Demo scripts** → Archive or delete
9. **GPU mesh** → Delete if not using

---

## 📦 PROPOSED ADDITIONAL PACKAGES

### packages/@robbie/personality/

**FROM:** src/personalities/

- Mood transition engine
- Gandhi-Genghis implementation
- AllanBot training
- Personality learning

### packages/@robbie/mcp-servers/

**FROM:** services/mcp_*.py

- All 7 MCP servers
- Cursor integration
- Daily brief MCP
- Personality control MCP

### packages/@robbie/integrations/

**FROM:** src/engines/

- Alexa skill engine
- Ring doorbell
- Future integrations

### packages/@robbie/gmail-tools/

**FROM:** Root .py files

- Smart inbox
- Email interceptor
- Gmail automation

---

## 🚀 NEXT ACTIONS

**Option A: Quick Cleanup (1 hour)**

- Move src/personalities/ → packages/@robbie/personality/
- Move services/mcp_*.py → packages/@robbie/mcp-servers/
- Archive root test scripts
- Push to GitHub

**Option B: Complete Cleanup (1 day)**

- Organize ALL remaining code
- Create all missing packages
- Clean root directory completely
- Comprehensive docs

**Option C: Ship It (Now!)**

- Leave for Phase 1 integration
- Focus on getting API working first
- Clean up as we go

**Which option, boss?** The mood engine and MCP servers are VALUABLE! 💎

---

**Status:** Found ~100 more files to organize  
**Value:** Mood engine (764 lines!), 7 MCP servers, AllanBot training  
**Priority:** Mood engine = CRITICAL for personality system  

*We got most of it, but there's more GOLD to extract!* 🔥💋
