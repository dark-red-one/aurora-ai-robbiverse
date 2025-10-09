# 🔄 Aurora Standard Node - Migration Strategy

## 🤔 The Question: What About Existing Apps?

**Aurora Town on Elestio already has stuff running:**
- PostgreSQL database with data
- Backend APIs (Python/FastAPI)
- AI personalities system
- Chat interfaces
- Ollama LLM gateway
- Business integrations (Gmail, Calendar, etc.)
- Cron jobs and automation

**How does the standard node deployment fit?**

---

## 🎯 Strategy: Augment, Don't Replace

The standard node package is **infrastructure foundation**, not a replacement for your apps.

### Think of it as:
```
OLD WAY (Manual Setup):
└─ Aurora Town
   ├─ Manually installed PostgreSQL ❌
   ├─ Manually configured services ❌
   ├─ No standardization ❌
   ├─ Your apps running ✅
   └─ No redundancy ❌

NEW WAY (Standard Node):
└─ Aurora (Lead Node)
   ├─ Standardized infrastructure ✅ (VPN, monitoring, etc.)
   ├─ Your existing apps ✅ (keep running!)
   ├─ Augmented with new services ✅ (chat backend, event bus, etc.)
   └─ Replicated to other nodes ✅ (RunPod TX, Vengeance, etc.)
```

---

## 📦 What Happens to Each Component

### 1. **PostgreSQL Database** ✅ KEEP & AUGMENT

**Current:**
- `aurora-postgres-u44170.vm.elestio.app:25432`
- Contains all your data (conversations, emails, contacts, deals)

**After Standard Node:**
- **Keep using** the existing Elestio PostgreSQL (it's managed and working!)
- **Add streaming replication** to other nodes
- Standard node configs **point to existing DB** (not replace it)
- Result: Same database, now replicated for reads everywhere

**Migration:** None! Just configure replication slots on existing DB.

---

### 2. **Backend API (FastAPI)** ✅ KEEP & ENHANCE

**Current:**
- Your Python FastAPI backend in `backend/app/`
- Serves `/api/chat`, `/api/conversations`, etc.
- Runs on port 8000 (probably)

**After Standard Node:**
- **Option A (Recommended):** Keep running, add to standard node as custom service
- **Option B:** Replace with new distributed chat backend
- **Option C:** Run both (existing backend + new services)

**Migration:**
```yaml
# Add to docker-compose.yml
custom-backend:
  build: /opt/aurora-dev/aurora/backend
  container_name: aurora-custom-backend
  ports:
    - "8002:8000"  # Different port to avoid conflict
  environment:
    - DATABASE_URL=postgresql://...
  networks:
    - aurora-mesh
```

---

### 3. **AI Personalities System** ✅ KEEP

**Current:**
- `backend/app/services/ai/` (RobbieAI, DualLLMCoordinator, etc.)
- 23+ personality files in `src/personality*.js`

**After Standard Node:**
- **Keep all personality code**
- **Integrate with GPU mesh** for distributed processing
- **Use event bus** for personality state sync

**Migration:**
```python
# In your existing RobbieAI class
async def process_message(self, message):
    # Route to GPU mesh instead of local Ollama
    async with aiohttp.ClientSession() as session:
        response = await session.post(
            'http://10.0.0.1:8001/tasks/submit',  # GPU coordinator
            json={
                'task_type': 'llm_inference',
                'payload': {'message': message}
            }
        )
    # Rest of your logic stays the same
```

---

### 4. **Chat Interfaces** ✅ KEEP & SERVE FROM NGINX

**Current:**
- `robbie-unified-interface.html` (4789 lines!)
- `robbie-terminal.html`
- Various chat UIs in `infrastructure/chat-*/`

**After Standard Node:**
- **Keep all HTML files**
- **Serve from nginx** (part of standard node)
- **Connect to new chat backend** (or keep connecting to old one)

**Migration:**
```nginx
# Add to nginx config (standard node includes nginx)
server {
    listen 80;
    server_name chat.aurora.local;
    
    # Serve your existing chat interfaces
    root /opt/aurora-dev/aurora/;
    
    location / {
        try_files $uri $uri/ /robbie-unified-interface.html;
    }
    
    # Proxy API calls to backend
    location /api/ {
        proxy_pass http://aurora-custom-backend:8000;
    }
}
```

---

### 5. **Ollama LLM Gateway** ✅ KEEP & DISTRIBUTE

**Current:**
- Runs on Aurora Town: `http://aurora-town-u44170.vm.elestio.app:11434`
- Used for local LLM inference

**After Standard Node:**
- **Keep on Aurora** (still accessible)
- **Add Ollama to other nodes** (RunPod TX, Vengeance)
- **Route via GPU mesh** for intelligent distribution

**No migration needed** - GPU mesh will discover and use it.

---

### 6. **Business Integrations** ✅ KEEP

**Current:**
- Gmail sync (`robbie-email-interceptor.py`, etc.)
- Calendar sync
- Fireflies transcripts
- Contact scoring

**After Standard Node:**
- **Keep running** as is
- **Optionally containerize** for easier management
- **Use event bus** to notify other nodes of updates

**Migration (optional):**
```yaml
# Add to docker-compose.yml
gmail-sync:
  build: ./custom-services/gmail-sync
  container_name: aurora-gmail-sync
  environment:
    - DATABASE_URL=postgresql://...
    - REDIS_URL=redis://redis:6379
  volumes:
    - /opt/aurora-dev/aurora/credentials:/credentials:ro
  networks:
    - aurora-mesh
```

---

### 7. **Cron Jobs** ✅ MIGRATE TO SERVICES

**Current:**
- `robbie-master-cron.py`
- Various scheduled tasks

**After Standard Node:**
- **Convert to Docker services** with restart policies
- **Or use Kubernetes CronJobs** (if scaling further)

**Migration:**
```yaml
robbie-cron:
  build: ./custom-services/cron
  container_name: aurora-cron
  restart: unless-stopped
  environment:
    - RUN_INTERVAL=300  # 5 minutes
  networks:
    - aurora-mesh
```

---

## 🔄 Migration Process (Zero Downtime)

### Phase 1: Parallel Deployment (Week 1)

```
Aurora Town (Existing)        Aurora Town (New Standard Node)
├─ PostgreSQL ✅              ├─ Connect to existing PostgreSQL ✅
├─ Backend API ✅             ├─ New services (chat, event bus) ✅
├─ Ollama ✅                  ├─ VPN mesh ✅
└─ Running on ports           ├─ Monitoring ✅
   8000, 11434, etc.          └─ Running on new ports
                                 8001 (GPU coordinator)
                                 6379 (Redis)
                                 9090 (Prometheus)
```

**Result:** Old and new run side-by-side. Test new infrastructure without disruption.

---

### Phase 2: Replication Setup (Week 1-2)

```
Aurora PostgreSQL
└─> Add replication slots
    ├─> RunPod TX (new replica) ✅
    ├─> Vengeance (new replica) ✅
    └─> RobbieBook1 (new replica) ✅
```

**Result:** Your data now replicated to all nodes. Old apps still use master.

---

### Phase 3: Traffic Migration (Week 2-3)

```
Gradual cutover:
1. Test users → New chat backend ✅
2. Monitor performance ✅
3. If good → Route more traffic ✅
4. If issues → Roll back instantly ✅
5. Eventually → All traffic on new stack ✅
```

**Result:** Smooth transition with rollback option.

---

### Phase 4: Decommission Old (Optional)

Once fully migrated and stable:
- Stop old services
- Keep data and configs as backup
- Run 100% on standard node infrastructure

**Or:** Keep both running indefinitely (they don't conflict).

---

## 📊 What Gets Added vs Replaced

| Component | Action | Why |
|-----------|--------|-----|
| **PostgreSQL** | Keep + Replicate | Elestio managed DB is solid |
| **Backend API** | Keep + Augment | Your code works, just add features |
| **AI Personalities** | Keep + Distribute | Route through GPU mesh |
| **Chat UIs** | Keep + Serve from nginx | Your interfaces work |
| **Ollama** | Keep + Add to nodes | Distributed LLM access |
| **Business Integrations** | Keep + Containerize | Don't fix what works |
| **Cron Jobs** | Migrate to containers | Better reliability |
| **VPN** | **NEW** | Didn't exist before |
| **Event Bus** | **NEW** | Didn't exist before |
| **Monitoring** | **NEW** | Prometheus/Grafana |
| **Chat Backend** | **NEW** | Distributed API |
| **GPU Mesh** | **NEW** | Intelligent routing |

---

## 🎯 Recommended Approach

### Step 1: Deploy Standard Node (Non-Disruptive)
```bash
ssh root@aurora-town-u44170.vm.elestio.app
cd /opt/aurora-standard-node
# Deploy with different ports to avoid conflicts
```

### Step 2: Point New Services to Existing Database
```bash
# In .env
DB_PRIMARY_HOST=aurora-postgres-u44170.vm.elestio.app
DB_PRIMARY_PORT=25432
```

### Step 3: Test New Services
- Chat backend on new port (8003)
- GPU mesh on port 8001
- Event bus working
- Monitoring showing data

### Step 4: Gradually Migrate Traffic
- Frontend → Can use old or new backend
- LLM calls → Can use local Ollama or GPU mesh
- Data → Always from same PostgreSQL

### Step 5: Eventually Standardize
- All nodes run standard package
- Custom apps added as services
- Full redundancy and failover

---

## 💰 Business Benefits

### During Migration:
- ✅ **Zero downtime** (parallel deployment)
- ✅ **Instant rollback** (keep old system running)
- ✅ **Test safely** (new services on different ports)

### After Migration:
- ✅ **100x scaling** (distributed infrastructure)
- ✅ **99.99% uptime** (redundancy)
- ✅ **Faster development** (standardized deployment)
- ✅ **Better monitoring** (Prometheus/Grafana)
- ✅ **GPU efficiency** (mesh distribution)

---

## 🚀 TL;DR

**Standard node package is infrastructure, not replacement:**

✅ **Keeps:** Your existing apps, data, personalities, UIs
✅ **Adds:** VPN mesh, replication, monitoring, event bus, GPU coordination
✅ **Enhances:** Your apps get distributed, redundant, scalable
✅ **Result:** Same functionality + enterprise infrastructure

**Migration:** Parallel deployment → Test → Gradually migrate → Keep what works

**No need to rewrite anything. Just wrap it in better infrastructure.** 🎉

---

*Part of the Aurora Standard Node Deployment System*
