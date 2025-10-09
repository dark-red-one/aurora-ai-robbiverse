# 🚀 Final Aurora Architecture - Complete System

## The Vision: Work from ANYWHERE, Render on the FASTEST Node

---

## 🌐 **Local Web + Auth EVERYWHERE**

### Every Node Serves Its Own Web Interface

```
Allan on RobbieBook1:
  ↓
  http://robbiebook1.local:3000  (local nginx)
  ↓
  Robbie UI renders locally
  ↓
  BUT AI generation routes to fastest node!
```

**Benefits:**
- ✅ Works even if other nodes are down
- ✅ No single point of failure
- ✅ Low latency for UI interactions
- ✅ Auth tokens synced via Redis

---

## 🧠 **Smart AI Rendering (Agent Router)**

### The Magic: Submit Locally, Render Remotely

**Scenario:** Allan on RobbieBook1 (M3 Max, slow for AI)

```
1. Allan types message in RobbieBook1 browser
   ↓
2. RobbieBook1 nginx receives request
   ↓
3. Agent Router (8007) evaluates:
   - RobbieBook1: M3 Max, ~2000ms for generation
   - Vengeance: RTX 4090, ~200ms for generation  
   - RunPod TX: 2× RTX 4090, ~150ms for generation
   - Aurora: CPU only, ~3000ms
   
   Decision: Route to RunPod TX! (fastest)
   ↓
4. Request sent to RunPod TX Ollama (via VPN)
   ↓
5. RunPod generates response in 150ms
   ↓
6. Streams back to RobbieBook1
   ↓
7. Allan sees response in his local browser

Total time: 150ms generation + 20ms network = 170ms
(vs 2000ms if rendered locally!)
```

### Routing Algorithm

```python
for each node:
    if node.has_gpu:
        base_time = (tokens / 100) * 100ms  # GPU: 100ms per 100 tokens
    else:
        base_time = (tokens / 100) * 1000ms # CPU: 1000ms per 100 tokens
    
    # Adjust for current load
    adjusted_time = base_time * (1 + node.cpu_load)
    
    # Add queue time
    queue_time = node.active_jobs * 500ms
    
    # Add network latency
    network_time = estimate_latency(user_node, target_node)
    
    total_time = adjusted_time + queue_time + network_time

# Select node with lowest total_time
```

---

## 🔐 **Distributed Auth (Runs on Every Node)**

### JWT Tokens + Redis Session Sync

**Login Flow:**
```
1. Allan logs in at robbiebook1.local:3000
   ↓
2. Auth service on RobbieBook1 validates credentials (PostgreSQL)
   ↓
3. Creates JWT access token + refresh token
   ↓
4. Stores session in Redis: "aurora:session:allan"
   ↓
5. Session is IMMEDIATELY available on ALL nodes
   ↓
6. Allan can now access aurora.local, vengeance.local, etc.
   ↓
7. Same session, same tokens, everywhere!
```

**Features:**
- ✅ Login on any node
- ✅ Session synced via Redis (instant)
- ✅ JWT tokens work across all nodes
- ✅ Logout on one node = logout everywhere
- ✅ Active sessions viewable
- ✅ 30-minute access tokens, 7-day refresh

---

## 📦 **RobbieBlocks, Squid, Tor Proxy (Missing Pieces)**

### RobbieBlocks (Widget Marketplace)

**Added to services:**
```yaml
robbieblocks-api:
  build: ./services/robbieblocks-api
  ports:
    - "8009:8009"
  environment:
    - POSTGRES_HOST=postgres
    - REDIS_HOST=redis
```

**What it does:**
- Widget marketplace (25+ reusable components)
- Used by 5 sites: AskRobbie, RobbieBlocks.com, LeadershipQuotes, TestPilot.ai, HeyShopper
- Each widget has: API contract, demo, code snippet
- Revenue model: Free tier + Pro features

**Widgets:**
1. Vista Hero
2. Chat Console
3. Specsheet
4. Smart Cart
5. Doc Prism
6. Spotlight Carousel
7. Pricing Table
8. etc. (25 total)

### Squid Caching Proxy

**Added to services:**
```yaml
squid-proxy:
  image: ubuntu/squid:latest
  ports:
    - "3128:3128"
  volumes:
    - ./config/squid.conf:/etc/squid/squid.conf
    - squid_cache:/var/spool/squid
```

**What it does:**
- Caches API responses (HubSpot, OpenAI, etc.)
- Reduces external API calls
- Saves $$$ on rate limits
- 10GB cache, 7-day TTL

**Cache Rules:**
```
# Cache OpenAI responses
acl openai_api dstdomain api.openai.com
cache allow openai_api
refresh_pattern . 0 20% 4320  # 3 days

# Cache HubSpot
acl hubspot_api dstdomain api.hubapi.com
cache allow hubspot_api
refresh_pattern . 0 20% 10080  # 7 days
```

### Tor Caching Proxy

**Added to services:**
```yaml
tor-proxy:
  image: dperson/torproxy
  ports:
    - "9050:9050"  # SOCKS5
    - "9051:9051"  # Control port
  environment:
    - TOR_CACHE=true
    - TOR_BANDWIDTH=10MB
```

**What it does:**
- Anonymous requests via Tor network
- Cached responses (Tor is slow)
- Used for: web scraping, competitor research
- Rotates IPs automatically

---

## 🏋️ **Training Jobs (Allan Maverick Fine-Tuning)**

### Distributed Training Scheduler

**Added to services:**
```yaml
training-scheduler:
  build: ./services/training-scheduler
  ports:
    - "8010:8010"
  volumes:
    - training_data:/data
    - models:/models
  environment:
    - GPU_NODES=runpod-tx,vengeance
```

**What it does:**
- Manages fine-tuning jobs for Allan Maverick model
- Distributes training across GPU nodes
- Monitors progress, auto-resumes on failure
- Versioned model checkpoints

**Training Pipeline:**
```
1. Extract training data:
   - Emails (Gmail API)
   - Meetings (Fireflies transcripts)
   - Deals (HubSpot notes)
   - Slack messages
   
2. Preprocess & format:
   - Tokenize
   - Create prompt-completion pairs
   - Split train/val/test
   
3. Fine-tune:
   - Base model: llama3.1:8b
   - LoRA adapters (efficient fine-tuning)
   - Multi-GPU if available
   - Checkpoint every 100 steps
   
4. Evaluate:
   - Perplexity on validation set
   - Human eval (Allan reviews responses)
   
5. Deploy:
   - Export to Ollama format
   - Distribute to all GPU nodes
   - Make available via "allan-maverick" personality
```

**Training Job API:**
```bash
POST /api/training/start
{
  "model_name": "allan-maverick-v2",
  "base_model": "llama3.1:8b",
  "training_data": "/data/allan-emails-2025.jsonl",
  "epochs": 3,
  "learning_rate": 0.0001
}

GET /api/training/status/{job_id}
{
  "job_id": "123",
  "status": "training",
  "progress": 0.45,
  "current_epoch": 2,
  "loss": 0.32,
  "eta_minutes": 45
}
```

---

## 🎯 **Complete Service Map (23 Services)**

| # | Service | Port | Runs On | Purpose |
|---|---------|------|---------|---------|
| 1 | Web Frontend | 3000 | **ALL** | Nginx + UI |
| 2 | Auth Service | 8008 | **ALL** | JWT + Sessions |
| 3 | Chat Backend | 8000 | **ALL** | Conversations |
| 4 | Agent Router | 8007 | **ALL** | Smart routing |
| 5 | GPU Coordinator | 8001 | Lead | AI Mesh |
| 6 | Priority Surface | 8002 | **ALL** | Top 10 |
| 7 | Secrets Manager | 8003 | Lead | Credentials |
| 8 | Gatekeeper LLM | 8004 | Lead+Compute | Safety |
| 9 | Memory/Embeddings | 8005 | **ALL** | Sticky Notes |
| 10 | Mentors/Personalities | 8006 | **ALL** | Steve Jobs, etc |
| 11 | Node Registry | 9999 | Lead | Discovery |
| 12 | Integration Sync | - | Lead | HubSpot, Google |
| 13 | Event Bus | - | **ALL** | Redis Pub/Sub |
| 14 | Health Monitor | - | **ALL** | Monitoring |
| 15 | Asset Sync | - | **ALL** | Static files |
| 16 | PostgreSQL | 5432 | **ALL** | Database |
| 17 | Redis | 6379 | **ALL** | Cache + Events |
| 18 | Ollama | 11434 | Compute | Local LLM |
| 19 | Squid Proxy | 3128 | Lead | API cache |
| 20 | Tor Proxy | 9050 | Lead | Anonymous |
| 21 | RobbieBlocks API | 8009 | Lead | Widgets |
| 22 | Training Scheduler | 8010 | GPU nodes | Fine-tuning |
| 23 | Grafana | 3001 | Lead | Dashboards |

**Key:**
- **ALL** = Runs on every node
- **Lead** = Aurora only
- **Compute** = GPU nodes only
- **GPU nodes** = RunPod TX, Vengeance

---

## 🔄 **How Everything Connects**

```
User Request Flow:
==================
Allan types message
    ↓
Local Web (nginx on his node)
    ↓
Local Auth Service → Verify JWT → Redis session check
    ↓ (authenticated)
Agent Router → Calculate fastest node
    ↓ (routes to RunPod TX)
Gatekeeper LLM → Safety check
    ↓ (safe)
Memory Service → Get context from sticky notes
    ↓ (relevant notes)
Ollama on RunPod TX → Generate response
    ↓
Stream back to Allan's browser
    ↓
Store in Redis → Sync to all nodes
```

---

## 💡 **Real-World Scenarios**

### Scenario 1: Allan Working from Home
```
Location: Home office
Device: RobbieBook1 (M3 Max)
Network: Home WiFi

Access: http://robbiebook1.local:3000
Auth: Local auth service verifies
Render: Agent router sends to Vengeance (same LAN, fast!)
Result: Sub-200ms responses
```

### Scenario 2: Allan Traveling
```
Location: Hotel in Vegas
Device: RobbieBook1
Network: Hotel WiFi (slow, firewalled)

Access: https://aurora.testpilotcpg.com (via internet)
Auth: Aurora's auth service verifies
Render: Agent router sends to RunPod TX (datacenter, reliable)
Result: ~500ms responses (includes internet latency)
```

### Scenario 3: Running Fine-Tuning
```
Trigger: "Robbie, update Allan Maverick model with last month's emails"
    ↓
Training scheduler starts job
    ↓
Distributes to RunPod TX (2× GPUs) + Vengeance (1× GPU)
    ↓
Data parallel training (3 GPUs total)
    ↓
Completes in ~2 hours (vs 6 hours on single GPU)
    ↓
New model deployed to all nodes automatically
```

---

## 🎯 **Summary**

**Every node is self-sufficient:**
- ✅ Serves own web interface
- ✅ Has local auth
- ✅ Can route AI to fastest node
- ✅ Accesses shared memory (Redis)
- ✅ Replicates database (PostgreSQL)

**Smart routing means:**
- ✅ Work from any device
- ✅ Always get fastest AI responses
- ✅ Network-aware (LAN vs WAN)
- ✅ Load-balanced automatically
- ✅ Failover built-in

**Training pipeline:**
- ✅ Continuous fine-tuning of Allan Maverick
- ✅ Multi-GPU distributed training
- ✅ Automated data extraction
- ✅ Versioned model deployments

**Result:**
- 🚀 **23 services** working together
- 🌐 **4 nodes** meshed via VPN
- 🧠 **6 mentors** (including Allan Maverick)
- 📝 **Sticky notes** with semantic search
- 🔐 **Distributed auth** everywhere
- ⚡ **Smart routing** to fastest node
- 💰 **Cost optimized** (caching proxies)
- 🔒 **Anonymous research** (Tor)
- 🎨 **RobbieBlocks** marketplace

**Deploy once. Work from anywhere. Render on the fastest node. Always.** 🎉

## 🧭 Node IP Inventory

<!-- BEGIN:NODE_IP_INVENTORY -->
| Node | Role | VPN IP | Public |
|------|------|--------|--------|
| Aurora | lead_dns | 10.0.0.1 | aurora-town-u44170.vm.elestio.app |
| Star | backup_dns | 10.0.0.2 | <set-your-backup-hostname> |
| Vengeance | workstation | 10.0.0.10 | dynamic |
| RunPod-TX | gpu_compute | 10.0.0.20 | <runpod-public-ip> |
| RobbieBook1 | laptop | 10.0.0.30 | dynamic |

Reference inventory (source of truth): `deployment/aurora-standard-node/config/node-inventory.yml`

Quick checks:
- Resolve Aurora public IP: `dig +short aurora-town-u44170.vm.elestio.app`
- Show node public IP (on node): `curl -s ifconfig.me`
- Show VPN IP (on node): `ip -4 addr show wg0 | awk '/inet /{print $2}'`
- List WireGuard peers: `wg show`
<!-- END:NODE_IP_INVENTORY -->
