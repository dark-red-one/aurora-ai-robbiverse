# 🏛️ RobbieBook1 Quick Reference

**Your mobile dev town with dynamic IP routing through Aurora**

---

## 🚀 Essential Commands

### Setup (First Time Only)
```bash
cd ~/aurora-ai-robbiverse
./deployment/setup-robbiebook1-town-complete.sh
```

### VPN
```bash
# Connect
~/robbie-vpn-connect.sh

# Disconnect
~/robbie-vpn-disconnect.sh

# Status
sudo wg show

# Test
ping 10.0.0.10  # Aurora Town
```

### Services
```bash
# Start all
./deployment/start-robbiebook-empire.sh

# Check status
lsof -i :8000  # Backend
lsof -i :3128  # Squid

# View logs
tail -f logs/*.log
```

### Context Switching
```bash
# Get all contexts
curl http://localhost:8000/api/contexts/allan

# Current context
curl http://localhost:8000/api/contexts/current/allan

# Switch to President mode (ALL ACCESS)
curl -X POST http://localhost:8000/api/contexts/switch \
  -H "Content-Type: application/json" \
  -d '{"user_id":"allan","context_type":"role","context_id":"president"}'

# Switch to TestPilot
curl -X POST http://localhost:8000/api/contexts/switch \
  -H "Content-Type: application/json" \
  -d '{"user_id":"allan","context_type":"company","context_id":"testpilot"}'
```

### Database
```bash
# Local
psql -d aurora_unified

# Aurora (via VPN)
PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At psql \
  -h 10.0.0.10 -p 25432 -U postgres -d aurora_unified

# Force sync now
/usr/local/bin/robbiebook-db-sync-full
```

---

## 🏛️ Your Contexts

| Icon | Context | Type | Use When |
|------|---------|------|----------|
| 👑 | President of Universe | Role | Need ALL ACCESS everywhere |
| 🏛️ | Aurora Town | Town | Managing GPU infrastructure |
| 🏢 | TestPilot CPG | Company | Working on deals/customers |
| 💻 | RobbieBook1 | Town | Local development |
| 🏠 | Vengeance | Town | Home server work |

---

## 🌐 Network Setup

```
Your Mac (dynamic IP)
  → Squid (localhost:3128)
    → VPN (10.0.0.100)
      → Aurora (10.0.0.10, fixed IP)
        → Internet
```

**Result:** External services see Aurora's IP, not yours

---

## 📊 Service Ports

| Port | Service | URL |
|------|---------|-----|
| 8000 | Aurora AI Backend | http://localhost:8000 |
| 8080 | Proxy | http://127.0.0.1:8080 |
| 8081 | Dashboard | http://localhost:8081 |
| 3128 | Squid | http://localhost:3128 |
| 5432 | PostgreSQL | localhost:5432 |
| 11434 | Ollama | http://localhost:11434 |

---

## 🔧 Troubleshooting

### VPN Not Working
```bash
# Reconnect
sudo wg-quick down ~/.wireguard/robbie-empire.conf
sudo wg-quick up ~/.wireguard/robbie-empire.conf

# Check logs
journalctl -xe | grep wireguard
```

### Squid Not Working
```bash
# Restart
brew services restart squid

# Check logs
tail -f /usr/local/var/logs/squid/cache.log
```

### Database Sync Stuck
```bash
# View sync logs
tail -f ~/aurora-ai-robbiverse/deployment/replica-sync.log

# Force full sync
/usr/local/bin/robbiebook-db-sync-full
```

### Context Switcher Not Showing
```bash
# Check if schema applied
psql -d aurora_unified -c "SELECT * FROM user_contexts WHERE user_id='allan';"

# Should see 5 contexts: president, aurora, testpilot, robbiebook1, vengeance
```

---

## 🎯 Quick Tests

### Test VPN
```bash
ping 10.0.0.10 && echo "✅ VPN working"
```

### Test Squid Routing
```bash
curl --proxy localhost:3128 https://ifconfig.me
# Should show: 45.32.194.172 (Aurora's IP)
```

### Test Database
```bash
psql -d aurora_unified -c "SELECT name FROM towns;"
# Should see: aurora, fluenti, collaboration, vengeance, robbiebook1
```

### Test Context Switching
```bash
curl http://localhost:8000/api/contexts/allan | jq
# Should see 5 contexts
```

---

## 📱 Offline Mode

### What Works Offline
- ✅ Cached web content (30 days)
- ✅ Local database
- ✅ Local AI models
- ✅ All services

### When Reconnecting
- 🔄 Pushes queued changes to Aurora
- 🔄 Pulls latest data
- 🔄 Refreshes cache

---

## 🚨 Emergency Commands

### Kill Everything
```bash
pkill -f uvicorn
pkill -f squid
sudo wg-quick down ~/.wireguard/robbie-empire.conf
```

### Restart Everything
```bash
brew services restart squid
sudo wg-quick up ~/.wireguard/robbie-empire.conf
./deployment/start-robbiebook-empire.sh
```

### Nuclear Option (Full Reset)
```bash
# Backup first!
cp ~/.wireguard/robbie-empire.conf ~/robbie-vpn-backup.conf

# Re-run setup
./deployment/setup-robbiebook1-town-complete.sh
```

---

**For full documentation:** See `ROBBIEBOOK1_TOWN_COMPLETE.md`

**RobbieBook1 = Your mobile empire node 🚀**

