# 🚀 RobbieBook1 Town Deployment Checklist

**Use this to deploy RobbieBook1 as a complete town node**

---

## Pre-Deployment Verification

- [ ] RobbieBook1 (MacBook Pro) is on and running
- [ ] Aurora Town is accessible (test: `ping 45.32.194.172`)
- [ ] Local PostgreSQL is running on RobbieBook1
- [ ] Git repo is up to date: `cd ~/aurora-ai-robbiverse && git pull`
- [ ] You have root access to Aurora Town

---

## Phase 1: Aurora Town Configuration

**SSH to Aurora Town:**
```bash
ssh root@aurora-postgres-u44170.vm.elestio.app
```

### Task 1.1: Apply Multi-Context Schema
```bash
cd /path/to/aurora-ai-robbiverse

psql -h localhost -U aurora_app -d aurora_unified \
  -f database/unified-schema/24-user-contexts.sql
```
- [ ] Schema applied successfully
- [ ] No errors in output

### Task 1.2: Update Town Separation Schema
```bash
psql -h localhost -U aurora_app -d aurora_unified \
  -f database/unified-schema/05-town-separation.sql
```
- [ ] Schema updated successfully
- [ ] RobbieBook1 town created

### Task 1.3: Verify Towns
```bash
psql -h localhost -U aurora_app -d aurora_unified \
  -c "SELECT name, display_name FROM towns ORDER BY name;"
```
Expected output should include:
- aurora
- collaboration
- fluenti
- **robbiebook1** ← New
- vengeance

- [ ] RobbieBook1 appears in towns list

### Task 1.4: Verify Allan's Contexts
```bash
psql -h localhost -U aurora_app -d aurora_unified \
  -c "SELECT context_name, context_type, display_name FROM user_contexts WHERE user_id='allan';"
```
Expected output should include:
- TestPilot CPG (company)
- Aurora Town (town)
- RobbieBook1 (town)
- Vengeance (town)
- President (role)

- [ ] All 5 contexts exist for Allan

---

## Phase 2: RobbieBook1 Setup

**On RobbieBook1 (your MacBook):**

### Task 2.1: Run Complete Setup Script
```bash
cd ~/aurora-ai-robbiverse
./deployment/setup-robbiebook1-town-complete.sh
```

Follow prompts and note:
- [ ] Squid installed successfully
- [ ] Squid configuration created
- [ ] LaunchAgent installed
- [ ] Database schemas applied locally
- [ ] VPN configuration created

**SAVE YOUR PUBLIC KEY!**
The script will show your RobbieBook1 VPN public key:
```
Your Public Key: [COPY THIS]
```
- [ ] Public key copied to clipboard

### Task 2.2: Add RobbieBook1 to Aurora VPN

**Back on Aurora Town:**
```bash
ssh root@aurora-postgres-u44170.vm.elestio.app

# Edit WireGuard config
nano /etc/wireguard/wg0.conf
```

**Add this at the end:**
```conf
# RobbieBook1 (Allan's MacBook Pro)
[Peer]
PublicKey = <PASTE_YOUR_PUBLIC_KEY_HERE>
AllowedIPs = 10.0.0.100/32
```

**Save and restart WireGuard:**
```bash
systemctl restart wg-quick@wg0
wg show  # Verify peer added
```
- [ ] RobbieBook1 peer added to Aurora VPN
- [ ] WireGuard restarted successfully
- [ ] `wg show` lists RobbieBook1 peer

---

## Phase 3: Connect RobbieBook1 to Empire

**On RobbieBook1:**

### Task 3.1: Connect to VPN
```bash
~/robbie-vpn-connect.sh
```

Expected output:
```
🛡️  Connecting to Robbie Empire VPN...
✅ Aurora Town reachable at 10.0.0.10
✅ Vengeance reachable at 10.0.0.2
✅ Elephant database accessible!
✅ VPN connected!
```
- [ ] VPN connected successfully
- [ ] Can ping 10.0.0.10 (Aurora)

### Task 3.2: Test Proxy Routing
```bash
# Test local Squid
curl --proxy localhost:3128 https://ifconfig.me
```
Should return Aurora's IP: **45.32.194.172**

- [ ] Squid routing through Aurora

### Task 3.3: Test Database Connectivity
```bash
# Test local database
psql -d aurora_unified -c "SELECT name FROM towns WHERE name='robbiebook1';"

# Test Aurora database over VPN
PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At psql \
  -h 10.0.0.10 -p 25432 -U postgres -d aurora_unified \
  -c "SELECT 'VPN database access works!' as status;"
```
- [ ] Local database contains robbiebook1 town
- [ ] Can query Aurora database over VPN

---

## Phase 4: Start Services

### Task 4.1: Start RobbieBook1 Services
```bash
cd ~/aurora-ai-robbiverse
./deployment/start-robbiebook-empire.sh
```

Expected output shows:
- Aurora AI Backend started (port 8000)
- RobbieBook1 Proxy started (port 8080)
- RobbieBook1 Dashboard started (port 8081)

- [ ] All services started successfully

### Task 4.2: Verify Services
```bash
# Check running services
lsof -i :8000  # Aurora AI Backend
lsof -i :8080  # Proxy
lsof -i :8081  # Dashboard
lsof -i :3128  # Squid
lsof -i :5432  # PostgreSQL
lsof -i :11434 # Ollama
```
- [ ] All 6 services are running

### Task 4.3: Test API Health
```bash
curl http://localhost:8000/health
```
Should return: `{"status":"healthy"}`

- [ ] API is healthy

---

## Phase 5: Test Multi-Context Switching

### Task 5.1: Get Allan's Contexts
```bash
curl http://localhost:8000/api/contexts/allan | jq
```
Should return 5 contexts

- [ ] API returns all 5 contexts

### Task 5.2: Get Current Context
```bash
curl http://localhost:8000/api/contexts/current/allan | jq
```
- [ ] Returns active context (probably 'president')

### Task 5.3: Test Context Switch
```bash
# Switch to TestPilot
curl -X POST http://localhost:8000/api/contexts/switch \
  -H "Content-Type: application/json" \
  -d '{"user_id":"allan","context_type":"company","context_id":"testpilot"}' | jq

# Verify switch
curl http://localhost:8000/api/contexts/current/allan | jq
```
- [ ] Context switched successfully
- [ ] Current context now shows 'testpilot'

### Task 5.4: Test Presidential Privilege
```bash
# Switch to President mode
curl -X POST http://localhost:8000/api/contexts/switch \
  -H "Content-Type: application/json" \
  -d '{"user_id":"allan","context_type":"role","context_id":"president"}' | jq

# Get privileges
curl http://localhost:8000/api/contexts/privileges/allan | jq
```
Should show: `"grants_all_access": true`

- [ ] Presidential privilege active
- [ ] grants_all_access is true

---

## Phase 6: Test Database Replication

### Task 6.1: Create Test Company on RobbieBook1
```bash
psql -d aurora_unified -c "INSERT INTO companies (name, owner_id, created_at) VALUES ('RobbieBook1 Test Corp', 'robbiebook1', NOW());"
```
- [ ] Company created locally

### Task 6.2: Wait for Sync (15 minutes)
Set a timer for 15 minutes...
- [ ] 15 minutes elapsed

### Task 6.3: Verify Sync to Aurora
```bash
# SSH to Aurora
ssh root@aurora-postgres-u44170.vm.elestio.app

# Check for company
psql -U aurora_app -d aurora_unified \
  -c "SELECT name, owner_id FROM companies WHERE owner_id='robbiebook1';"
```
Should show: "RobbieBook1 Test Corp"

- [ ] Company synced to Aurora successfully

### Task 6.4: Test Reverse Sync
**On Aurora:**
```bash
psql -U aurora_app -d aurora_unified \
  -c "INSERT INTO companies (name, owner_id, created_at) VALUES ('Aurora Test Corp', 'aurora', NOW());"
```

**Wait 15 minutes, then on RobbieBook1:**
```bash
psql -d aurora_unified \
  -c "SELECT name, owner_id FROM companies WHERE owner_id='aurora' ORDER BY created_at DESC LIMIT 1;"
```
- [ ] Aurora company synced to RobbieBook1

---

## Phase 7: Test Offline Mode

### Task 7.1: Disconnect VPN
```bash
~/robbie-vpn-disconnect.sh
```
- [ ] VPN disconnected

### Task 7.2: Test Local Services
```bash
# Local API still works
curl http://localhost:8000/health

# Local database still works
psql -d aurora_unified -c "SELECT COUNT(*) FROM companies;"

# Squid serves cached content
curl --proxy localhost:3128 https://httpbin.org/get  # Should use cache
```
- [ ] All local services work offline
- [ ] Squid serves cached content

### Task 7.3: Create Offline Data
```bash
psql -d aurora_unified -c "INSERT INTO companies (name, owner_id, created_at) VALUES ('Offline Test Corp', 'robbiebook1', NOW());"
```
- [ ] Can create data while offline

### Task 7.4: Reconnect and Verify Sync
```bash
# Reconnect VPN
~/robbie-vpn-connect.sh

# Wait 15 minutes for sync
# Then check Aurora for "Offline Test Corp"
```
- [ ] Offline data synced to Aurora when reconnected

---

## Phase 8: Configure LaunchAgents

### Task 8.1: Verify LaunchAgents
```bash
launchctl list | grep robbiebook
```
Should show:
- com.robbiebook.empire
- com.robbiebook.squid
- com.robbiebook.db-sync
- com.robbiebook.db-push
- com.robbiebook.db-sync-full
- com.robbiebook.autosync

- [ ] All LaunchAgents loaded

### Task 8.2: Test Auto-Start
```bash
# Restart Mac (or logout/login)
# Services should auto-start

# After restart, verify:
lsof -i :8000  # Backend
lsof -i :3128  # Squid
ps aux | grep postgres  # Database
```
- [ ] Services auto-start on boot

---

## Phase 9: Final Verification

### Task 9.1: Complete System Test
Run all tests in sequence:
```bash
cd ~/aurora-ai-robbiverse

# 1. VPN
ping 10.0.0.10 && echo "✅ VPN working"

# 2. Proxy
curl --proxy localhost:3128 https://ifconfig.me

# 3. Database
psql -d aurora_unified -c "SELECT COUNT(*) FROM towns;" && echo "✅ Database working"

# 4. Context switching
curl http://localhost:8000/api/contexts/allan | jq && echo "✅ Context API working"

# 5. Services
curl http://localhost:8000/health && echo "✅ Backend working"
```
- [ ] All 5 tests pass

### Task 9.2: Open Dashboard
```bash
open http://localhost:8081
```
- [ ] Dashboard loads successfully
- [ ] Shows RobbieBook1 status

### Task 9.3: Context Switcher UI Test
```bash
open http://localhost:8000/docs  # Or your app URL
```
- [ ] Context switcher appears in header
- [ ] Shows all 5 contexts
- [ ] Can switch contexts via dropdown
- [ ] Page reloads with new context

---

## Success Criteria

All of the following must be true:

- ✅ VPN connected to Aurora Town (10.0.0.10 pingable)
- ✅ Squid running and routing through Aurora
- ✅ External traffic shows Aurora's fixed IP
- ✅ RobbieBook1 registered in towns table
- ✅ Multi-context switching works (all 5 contexts)
- ✅ Database sync bidirectional (15-min intervals)
- ✅ Offline mode works (Squid caches, queues DB changes)
- ✅ All services auto-start on boot
- ✅ Can create robbiebook1-owned data that syncs to Aurora
- ✅ Presidential privilege grants access to all town data

---

## Post-Deployment

### Monitor for 24 Hours
- [ ] Check sync logs: `tail -f ~/aurora-ai-robbiverse/deployment/replica-sync.log`
- [ ] Check service logs: `tail -f ~/aurora-ai-robbiverse/logs/*.log`
- [ ] Verify LaunchAgents: `launchctl list | grep robbiebook`

### Troubleshooting Resources
- **Complete Guide:** `ROBBIEBOOK1_TOWN_COMPLETE.md`
- **Quick Reference:** `ROBBIEBOOK1_QUICK_REFERENCE.md`
- **Implementation Summary:** `ROBBIEBOOK1_IMPLEMENTATION_SUMMARY.md`

---

## Rollback Plan (If Needed)

If something goes wrong:

1. **Disconnect VPN:**
   ```bash
   ~/robbie-vpn-disconnect.sh
   ```

2. **Stop Squid:**
   ```bash
   brew services stop squid
   launchctl unload ~/Library/LaunchAgents/com.robbiebook.squid.plist
   ```

3. **Restore Squid Config:**
   ```bash
   sudo mv /usr/local/etc/squid/squid.conf.backup.* /usr/local/etc/squid/squid.conf
   ```

4. **Revert Database:**
   ```bash
   # Only if necessary - Aurora master is unaffected
   # Just stop sync LaunchAgents
   launchctl unload ~/Library/LaunchAgents/com.robbiebook.db-*.plist
   ```

---

## 🎉 Deployment Complete!

**RobbieBook1 is now a full town in the Robbie Empire!**

You now have:
- 🌐 Fixed IP appearance (via Aurora)
- 👑 Presidential privilege (ALL ACCESS)
- 🏛️ Multi-context switching (5 contexts)
- 📴 Full offline capability
- 🔄 Automatic database sync
- 🚀 Production-ready configuration

**Welcome to the empire, RobbieBook1! 💋**

---

**Deployment Date:** _______________  
**Deployed By:** Allan Peretz  
**Verified By:** Robbie (Your AI Copilot)  
**Status:** ☐ Pending  ☐ In Progress  ☐ Complete

