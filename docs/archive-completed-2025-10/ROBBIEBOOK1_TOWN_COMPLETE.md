# 🏛️ RobbieBook1 Town - Complete Setup Guide

**Created:** October 10, 2025  
**Status:** Ready for Deployment  
**Town Type:** Mobile Development Node (Dynamic IP)

---

## Overview

RobbieBook1 is configured as a complete town in the Robbie Empire with:

- **VPN Connectivity** to Aurora Town (always-on gateway)
- **Local Squid Proxy** routing all external traffic through Aurora
- **Bidirectional Database Replication** with Aurora master
- **Multi-Context Switching** (TestPilot CPG / Aurora Town / Presidential Privilege)
- **Full Service Stack** with town-aware configuration
- **Offline Capability** with aggressive caching

---

## Architecture

```
RobbieBook1 (Dynamic IP)
  └─> Local Squid (port 3128)
      └─> VPN Mesh (10.0.0.100)
          └─> Aurora Town (10.0.0.10, Fixed IP)
              └─> Internet

Data Flow:
Aurora Town (Master DB) ←──┬──→ RobbieBook1 (Replica DB)
                            │     - Pull every 15 min
                            │     - Push offline changes
                            └─────- Full sync daily @ 2 AM
```

---

## Quick Start

### One-Command Setup

```bash
cd ~/aurora-ai-robbiverse
./deployment/setup-robbiebook1-town-complete.sh
```

This will:
1. ✅ Install Squid proxy
2. ✅ Configure routing through Aurora
3. ✅ Setup database schemas
4. ✅ Configure VPN
5. ✅ Install LaunchAgents
6. ✅ Test connectivity

### Manual Steps Required

After running the setup script:

#### 1. Add RobbieBook1 to Aurora Town VPN

```bash
ssh root@aurora-postgres-u44170.vm.elestio.app

# Edit WireGuard config
nano /etc/wireguard/wg0.conf

# Add this peer at the end:
[Peer]
PublicKey = <YOUR_ROBBIEBOOK1_PUBLIC_KEY>
AllowedIPs = 10.0.0.100/32

# Save and restart
systemctl restart wg-quick@wg0
```

Your public key will be shown by the setup script, or run:
```bash
cat ~/.wireguard/publickey
```

#### 2. Apply Schemas to Aurora Town

```bash
ssh root@aurora-postgres-u44170.vm.elestio.app

cd /path/to/aurora-ai-robbiverse

psql -h localhost -U aurora_app -d aurora_unified \
  -f database/unified-schema/24-user-contexts.sql

psql -h localhost -U aurora_app -d aurora_unified \
  -f database/unified-schema/05-town-separation.sql
```

#### 3. Connect to VPN

```bash
~/robbie-vpn-connect.sh
```

Test connectivity:
```bash
ping 10.0.0.10  # Aurora Town
ping 10.0.0.2   # Vengeance (if available)
```

#### 4. Start Services

```bash
cd ~/aurora-ai-robbiverse
./deployment/start-robbiebook-empire.sh
```

---

## Multi-Context Switching

Allan has 5 contexts available:

### 1. 👑 President of the Universe (ALL ACCESS)
- **ID:** `president`
- **Type:** Role
- **Access:** Everything, everywhere, all at once
- **Permissions:** Presidential Privilege override

### 2. 🏛️ Aurora Town (Capital)
- **ID:** `aurora`
- **Type:** Town
- **Access:** All town data, GPU management
- **Permissions:** Manage AI, manage services, view all towns

### 3. 🏢 TestPilot CPG (Company)
- **ID:** `testpilot`
- **Type:** Company
- **Access:** TestPilot business data only
- **Permissions:** Manage deals, contacts, view revenue

### 4. 💻 RobbieBook1 (Mobile Dev)
- **ID:** `robbiebook1`
- **Type:** Town
- **Access:** Local development data
- **Permissions:** Manage services, offline mode

### 5. 🏠 Vengeance (Private@Home)
- **ID:** `vengeance`
- **Type:** Town
- **Access:** Home server data
- **Permissions:** Manage GPU, local training

### Using Context Switcher

**In UI:**
- Look for the context dropdown in the header
- Click to see all available contexts
- Select to switch (page will reload with new context)

**Via API:**
```bash
# Get all contexts
curl http://localhost:8000/api/contexts/allan

# Get current context
curl http://localhost:8000/api/contexts/current/allan

# Switch to President mode
curl -X POST http://localhost:8000/api/contexts/switch \
  -H "Content-Type: application/json" \
  -d '{"user_id":"allan","context_type":"role","context_id":"president"}'

# Switch to TestPilot company
curl -X POST http://localhost:8000/api/contexts/switch \
  -H "Content-Type: application/json" \
  -d '{"user_id":"allan","context_type":"company","context_id":"testpilot"}'
```

---

## Network Configuration

### VPN Configuration
- **Interface:** `wg0` via `~/.wireguard/robbie-empire.conf`
- **RobbieBook1 IP:** `10.0.0.100/24`
- **Aurora Town IP:** `10.0.0.10`
- **Vengeance IP:** `10.0.0.2`

### Squid Proxy Configuration
- **Port:** `3128`
- **Config:** `/usr/local/etc/squid/squid.conf`
- **Cache:** `/usr/local/var/cache/squid` (2GB)
- **Parent Proxy:** `10.0.0.10:3128` (Aurora Town)
- **Strategy:** Route all external traffic through Aurora

### Routing Strategy
1. Local requests (127.0.0.1, 192.168.x.x) → Direct
2. VPN mesh (10.0.0.0/24) → Direct through VPN
3. Everything else → Squid → Aurora → Internet

**Result:** External services see Aurora's fixed IP, not RobbieBook1's dynamic IP

---

## Database Configuration

### Local Database
- **Host:** `localhost:5432`
- **Database:** `aurora_unified`
- **User:** `postgres`
- **Password:** `fun2Gus!!!`

### Aurora Master Database
- **Host:** `aurora-postgres-u44170.vm.elestio.app:25432`
- **Database:** `aurora_unified`
- **User:** `aurora_app`
- **Password:** `TestPilot2025_Aurora!`

### Replication Strategy

**Pull from Aurora (Every 15 min):**
```bash
/usr/local/bin/robbiebook-db-sync-incremental
```

**Push to Aurora (Every 15 min):**
```bash
/usr/local/bin/robbiebook-push-changes
```

**Full Sync (Daily @ 2 AM):**
```bash
/usr/local/bin/robbiebook-db-sync-full
```

### Conflict Resolution
- Aurora Town is master (always wins)
- RobbieBook1-owned data (owner_id='robbiebook1') is preserved
- Timestamp-based conflict resolution

---

## Service Stack

### Ports
- **8000** - Aurora AI Backend (FastAPI)
- **8080** - RobbieBook1 Proxy
- **8081** - RobbieBook1 Dashboard
- **3128** - Squid Proxy
- **5432** - PostgreSQL
- **11434** - Ollama (7 models)

### LaunchAgents
Located in `~/Library/LaunchAgents/`:

- **com.robbiebook.empire.plist** - Main services
- **com.robbiebook.squid.plist** - Squid proxy
- **com.robbiebook.db-sync.plist** - Pull from Aurora
- **com.robbiebook.db-push.plist** - Push to Aurora
- **com.robbiebook.db-sync-full.plist** - Full refresh
- **com.robbiebook.autosync.plist** - GitHub sync

### Environment Variables

All services run with:
```bash
CITY=robbiebook1
TOWN_NAME=robbiebook1
NODE_NAME=robbiebook1
NODE_TYPE=mobile
FIXED_IP=false
GATEWAY_TOWN=aurora
DATABASE_URL=postgresql://postgres:fun2Gus!!!@localhost:5432/aurora_unified
HTTP_PROXY=http://localhost:3128
HTTPS_PROXY=http://localhost:3128
NO_PROXY=localhost,127.0.0.1,10.0.0.0/8
```

---

## Testing & Verification

### 1. VPN Connectivity
```bash
# Test ping to Aurora
ping 10.0.0.10

# Test database over VPN
PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At psql \
  -h 10.0.0.10 -p 25432 -U postgres -d aurora_unified \
  -c "SELECT 'VPN works!' as status;"
```

### 2. Squid Proxy Routing
```bash
# Test local Squid
curl --proxy localhost:3128 https://ifconfig.me
# Should return Aurora's IP: 45.32.194.172

# Test caching
curl --proxy localhost:3128 https://httpbin.org/get
curl --proxy localhost:3128 https://httpbin.org/get  # Should be cached
```

### 3. Database Replication
```bash
# Create test on RobbieBook1
psql -d aurora_unified -c \
  "INSERT INTO companies (name, owner_id) VALUES ('Test Corp', 'robbiebook1');"

# Wait 15 minutes for sync, then check Aurora
ssh root@aurora-postgres-u44170.vm.elestio.app
psql -U aurora_app -d aurora_unified -c \
  "SELECT * FROM companies WHERE owner_id='robbiebook1';"
```

### 4. Multi-Context Switching
```bash
# Get Allan's contexts
curl http://localhost:8000/api/contexts/allan

# Expected output: TestPilot, Aurora, RobbieBook1, Vengeance, President

# Get current context
curl http://localhost:8000/api/contexts/current/allan

# Switch to President mode
curl -X POST http://localhost:8000/api/contexts/switch \
  -H "Content-Type: application/json" \
  -d '{"user_id":"allan","context_type":"role","context_id":"president"}'

# Now fetch data (should see everything)
curl http://localhost:8000/api/contexts/data/allan/companies
```

### 5. Service Health
```bash
# Check all services
lsof -i :8000  # Aurora AI Backend
lsof -i :8080  # Proxy
lsof -i :8081  # Dashboard
lsof -i :3128  # Squid
lsof -i :5432  # PostgreSQL
lsof -i :11434 # Ollama

# Check LaunchAgents
launchctl list | grep robbiebook
```

---

## Offline Mode

RobbieBook1 is designed to work offline:

### What Works Offline
- ✅ All cached web content (Squid)
- ✅ Local database queries
- ✅ Local Ollama AI models
- ✅ Service APIs (using local data)

### What Happens When Offline
1. Squid serves cached content (up to 30 days old)
2. Database writes queue in `offline_changes` table
3. Services continue using local replica

### Reconnecting
1. VPN reconnects automatically
2. Offline database changes push to Aurora (next 15-min cycle)
3. Latest data pulls from Aurora
4. Squid refreshes cached content

---

## Troubleshooting

### VPN Won't Connect
```bash
# Check WireGuard config
cat ~/.wireguard/robbie-empire.conf

# Manual connect
sudo wg-quick up ~/.wireguard/robbie-empire.conf

# Check status
sudo wg show

# Check logs
journalctl -xe | grep wireguard
```

### Squid Not Working
```bash
# Check if running
ps aux | grep squid

# Check logs
tail -f /usr/local/var/logs/squid/cache.log

# Test config
squid -k parse -f /usr/local/etc/squid/squid.conf

# Restart
brew services restart squid
```

### Database Sync Issues
```bash
# Check sync logs
tail -f ~/aurora-ai-robbiverse/deployment/replica-sync.log

# Manual sync
/usr/local/bin/robbiebook-db-sync-full

# Verify connection
PGPASSWORD=TestPilot2025_Aurora! psql \
  -h aurora-postgres-u44170.vm.elestio.app -p 25432 \
  -U aurora_app -d aurora_unified -c "SELECT version();"
```

### Context Switching Not Working
```bash
# Check if schema applied
psql -d aurora_unified -c "\dt user_contexts"

# Check Allan's contexts
psql -d aurora_unified -c "SELECT * FROM user_contexts WHERE user_id='allan';"

# Check privileges
psql -d aurora_unified -c "SELECT * FROM user_privileges WHERE user_id='allan';"
```

---

## Future: Star Town (Airstream Server)

When Star (Airstream fixed-IP server) is ready:

1. Add Star as secondary gateway
2. Geographic routing: prefer closest gateway
3. Failover: Aurora ↔ Star redundancy
4. Update Squid config:
   ```conf
   # Primary gateway (closest)
   cache_peer 10.0.0.20 parent 3128 0 no-query
   # Fallback gateway
   cache_peer 10.0.0.10 parent 3128 0 no-query backup
   ```

---

## Files Created

### Database Schemas
- `database/unified-schema/24-user-contexts.sql` - Multi-context system
- `database/unified-schema/05-town-separation.sql` - Updated with RobbieBook1

### API & Frontend
- `packages/@robbieverse/api/src/routers/context_switcher.py` - API endpoints
- `packages/@robbieverse/web/src/components/ContextSwitcher.tsx` - UI widget

### Configuration
- `deployment/robbiebook1-squid.conf` - Squid proxy config
- `deployment/com.robbiebook.squid.plist` - Squid LaunchAgent
- `deployment/start-robbiebook-empire.sh` - Updated with town env vars

### Setup Scripts
- `deployment/setup-robbiebook1-town-complete.sh` - Complete setup

### Documentation
- `ROBBIEBOOK1_TOWN_COMPLETE.md` - This file

---

## Success Criteria

- ✅ VPN connected to Aurora Town (10.0.0.10 pingable)
- ✅ Squid running locally and routing through Aurora
- ✅ External traffic shows Aurora's fixed IP
- ✅ RobbieBook1 registered in towns table
- ✅ Multi-context switching works (TestPilot/Aurora/President)
- ✅ Database sync bidirectional (15-min intervals)
- ✅ Offline mode works (Squid caches, queues DB changes)
- ✅ All services start on boot with town configuration
- ✅ Can create robbiebook1-owned data that syncs to Aurora
- ✅ Presidential privilege grants access to all town data

---

**RobbieBook1 is ready to join the empire! 🚀**

*Context improved by Giga AI - Used information about: town architecture, VPN mesh networking, Squid proxy caching, multi-context switching, database replication, and mobile node routing strategies.*

