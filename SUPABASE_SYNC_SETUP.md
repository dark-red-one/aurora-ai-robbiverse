# 🐘 SUPABASE MASTER + NETWORK SYNC

**Live bidirectional sync across all nodes**  
**Supabase Project:** hykelmayopljuguuueme  
**URL:** https://supabase.com/dashboard/project/hykelmayopljuguuueme

---

## 🎯 ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│  SUPABASE (MASTER - Cloud)                              │
│  Project: hykelmayopljuguuueme                          │
│  - Single source of truth                               │
│  - All nodes sync here                                  │
│  - Automated backups                                    │
│  - Global CDN                                           │
└─────────────────────────────────────────────────────────┘
                    ↕ Bi-directional Sync (every 30s)
        ┌───────────┴─────────┬─────────────┬─────────────┐
        ↓                     ↓             ↓             ↓
┌──────────────┐    ┌──────────────┐   ┌─────────┐  ┌─────────┐
│ RobbieBook1  │    │ Aurora Town  │   │Vengeance│  │ Fluenti │
│ (MacBook)    │    │ (RunPod)     │   │ (Local) │  │(RunPod) │
│              │    │              │   │         │  │         │
│ localhost    │    │ localhost    │   │localhost│  │localhost│
│ :5432        │    │ :5432        │   │ :5432   │  │ :5432   │
│              │    │              │   │         │  │         │
│ Fast reads   │    │ Fast reads   │   │Fast rds │  │Fast rds │
│ Offline OK   │    │ Always sync  │   │Test env │  │Mktg AI  │
└──────────────┘    └──────────────┘   └─────────┘  └─────────┘
```

---

## 📋 SETUP STEPS

### Step 1: Deploy Unified Schema to Supabase

```bash
# Get Supabase connection string from dashboard:
# https://supabase.com/dashboard/project/hykelmayopljuguuueme/settings/database

export SUPABASE_HOST="db.hykelmayopljuguuueme.supabase.co"
export SUPABASE_PORT="5432"
export SUPABASE_DB="postgres"
export SUPABASE_USER="postgres"
export SUPABASE_PASSWORD="[get from Supabase dashboard]"

# Deploy complete unified schema
cd database
psql "postgresql://$SUPABASE_USER:$SUPABASE_PASSWORD@$SUPABASE_HOST:$SUPABASE_PORT/$SUPABASE_DB?sslmode=require" -f init-unified-schema.sql
```

### Step 2: Configure Sync on Each Node

Create `packages/@robbieverse/api/.env`:

```bash
# Supabase Master (replaces Elestio)
MASTER_DB_HOST=db.hykelmayopljuguuueme.supabase.co
MASTER_DB_PORT=5432
MASTER_DB_NAME=postgres
MASTER_DB_USER=postgres.hykelmayopljuguuueme
MASTER_DB_PASSWORD=[from Supabase dashboard]
MASTER_DB_SSL=require

# Local Replica (this node)
LOCAL_DB_HOST=localhost
LOCAL_DB_PORT=5432
LOCAL_DB_NAME=robbieverse
LOCAL_DB_USER=robbie
LOCAL_DB_PASSWORD=robbie_dev_2025

# Sync Configuration
SYNC_ENABLED=true
SYNC_INTERVAL_SECONDS=30
NODE_NAME=[robbiebook1|aurora|vengeance|fluenti]
```

### Step 3: Start Sync Service on Each Node

```bash
cd packages/@robbieverse/api

# Install dependencies
npm install

# Start with sync enabled
SYNC_ENABLED=true npm start

# Should see:
# 🐘 Starting Supabase sync...
# ✅ Connected to master
# ✅ Synced from master (30s intervals)
```

---

## 🌐 NODE-SPECIFIC CONFIGURATION

### RobbieBook1 (MacBook)
```bash
NODE_NAME=robbiebook1
SYNC_ENABLED=true
SYNC_INTERVAL_SECONDS=30

# Auto-start on login (LaunchAgent already configured!)
# Syncs: Every 30 seconds when online
# Offline: Queues writes, syncs when reconnects
```

### Aurora Town (Production RunPod)
```bash
NODE_NAME=aurora
SYNC_ENABLED=true
SYNC_INTERVAL_SECONDS=10  # Faster sync for production

# Always online, primary production node
```

### Vengeance (Local Gaming Rig)
```bash
NODE_NAME=vengeance
SYNC_ENABLED=true
SYNC_INTERVAL_SECONDS=30

# Development/testing node
```

### Fluenti (Marketing RunPod)
```bash
NODE_NAME=fluenti
SYNC_ENABLED=true
SYNC_INTERVAL_SECONDS=30

# Marketing operations node
```

---

## 📊 WHAT SYNCS

**All Tables from Unified Schema:**
- users, sessions, audit_log
- conversations, messages (with vector embeddings!)
- ai_personalities, ai_personality_state, ai_commitments
- contacts, companies, deals (CRM for TestPilot)
- robbieblocks_pages, robbieblocks_components (dynamic CMS!)
- **85+ tables total**

**Sync Strategy:**
- **Reads:** Always from local (< 1ms)
- **Writes:** To Supabase first, then local
- **Offline:** Queue locally, sync when reconnects
- **Conflicts:** Supabase master wins (timestamp-based)

---

## 🔧 SYNC SERVICE FILES

**Already Built:**
- ✅ `packages/@robbieverse/api/src/services/postgres-sync.ts` (275 lines)
- ✅ `database/unified-schema/20-sync-infrastructure.sql` (sync queue tables)
- ✅ `packages/@robbieverse/api/database/pending-sync.sql` (offline queue)

**Status:** Code exists, just needs Supabase credentials!

---

## 🚀 DEPLOYMENT CHECKLIST

### On Supabase
- [ ] Get connection string from dashboard
- [ ] Deploy unified schema (init-unified-schema.sql)
- [ ] Verify pgvector extension enabled
- [ ] Test connection from each node

### On RobbieBook1
- [ ] Update .env with Supabase credentials
- [ ] Start sync service
- [ ] Verify LaunchAgent picks up new config
- [ ] Test offline → online sync

### On Aurora Town
- [ ] Update .env with Supabase credentials
- [ ] Restart API with sync enabled
- [ ] Monitor sync logs

### On Vengeance (Optional)
- [ ] Same as RobbieBook1

### On Fluenti (Optional)
- [ ] Same as Aurora Town

---

## 📈 MONITORING

### Check Sync Status (Any Node)
```bash
# Pending syncs
docker exec robbieverse-postgres psql -U robbie -d robbieverse -c \
  "SELECT COUNT(*) as pending FROM pending_sync WHERE synced_at IS NULL;"

# Recent syncs
docker exec robbieverse-postgres psql -U robbie -d robbieverse -c \
  "SELECT table_name, operation, created_at, synced_at FROM pending_sync ORDER BY created_at DESC LIMIT 10;"

# Sync errors
docker exec robbieverse-postgres psql -U robbie -d robbieverse -c \
  "SELECT * FROM pending_sync WHERE error IS NOT NULL;"
```

### API Logs
```bash
cd packages/@robbieverse/api
tail -f logs/sync.log

# Should see every 30 seconds:
# ✅ Synced from master (12 tables updated)
# ✅ Synced to master (0 pending changes)
```

---

## 💡 BENEFITS

### For TestPilot CPG
- ✅ All nodes have same CRM data
- ✅ Update deal on MacBook → syncs to cloud
- ✅ Add contact on Aurora → available everywhere
- ✅ Offline on plane → syncs when land

### For HeyShopper
- ✅ Shopper data synced across network
- ✅ Studies created anywhere
- ✅ Payments tracked globally

### For All Apps
- ✅ One database, distributed reads
- ✅ Fast local performance
- ✅ Global consistency
- ✅ Disaster recovery (Supabase backups)

---

## 🎯 NEXT STEPS

1. **Get Supabase credentials** from dashboard
2. **Deploy schema** to Supabase
3. **Configure each node** with credentials
4. **Start sync services** on all nodes
5. **Test bidirectional sync** (write on MacBook, read on Aurora)

**Then we have live, synced database across your entire empire!** 🐘🚀

---

*Sync code exists. Just needs Supabase config. 30 minutes to deploy.* ⚡

