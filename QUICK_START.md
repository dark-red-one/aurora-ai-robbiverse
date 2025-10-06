# 🚀 Aurora AI RobbieVerse - Quick Start

## 🔑 IMMEDIATE CONNECTION FIX

**If you can't connect to RobbieBook1 or other nodes:**

```bash
# Fix all connections
./deployment/robbiebook-connection-fix.sh

# Test everything
~/test-connections.sh

# Sync to RobbieBook1
rsync -av . allanperetz@192.199.240.226:~/aurora-sync/
```

## 🌐 Network Overview

| Node | IP/Address | Status | Purpose |
|------|------------|--------|---------|
| **Aurora** | 192.168.1.246 | ✅ Primary | Main development hub |
| **Vengeance** | vengeance | ✅ Connected | Local backup |
| **RobbieBook1** | 192.199.240.226 | ⚠️ Needs key | MacBook Pro |
| **RunPod** | 82.221.170.242:24505 | ✅ Active | Cloud GPU |

## 🎯 Essential Commands

### Sync Everything
```bash
# Sync all nodes to primary-ready state
./deployment/sync-all-nodes-primary-ready.sh
```

### Test Connections
```bash
# Quick connection test
~/test-connections.sh

# Manual connection test
ssh vengeance "echo 'Vengeance OK'"
ssh allanperetz@192.199.240.226 "echo 'RobbieBook1 OK'"
```

### Start Services
```bash
# Start backend
cd backend && python3 app/main.py

# Start enhanced auth
cd infrastructure/chat-ultimate && python3 enhanced_auth_backend.py
```

## 📚 Documentation

- [RobbieBook Connection Guide](docs/ROBBIEBOOK_CONNECTION_GUIDE.md) - Never get stuck again
- [RunPod Network](docs/ACTUAL_RUNPOD_NETWORK.md) - 5x RTX 4090 setup
- [Complete Setup](docs/ROBBIEBOOK1_COMPLETE_SETUP.md) - RobbieBook1 details

## 🚨 Emergency Fixes

### SSH Keys Not Working?
```bash
# Reset and regenerate
rm ~/.ssh/id_ed25519*
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N "" -C "aurora@robbie-empire"
cat ~/.ssh/id_ed25519.pub
```

### Can't Connect to RobbieBook1?
1. Check network: `ping 192.199.240.226`
2. Add Aurora's key to RobbieBook1: `~/.ssh/authorized_keys`
3. Test: `ssh allanperetz@192.199.240.226`

### Services Not Starting?
```bash
# Check what's running
ps aux | grep python

# Kill old processes
pkill -f "python3.*backend"

# Restart services
./deployment/sync-all-nodes-primary-ready.sh
```

---
**This is your go-to reference for Aurora AI RobbieVerse!** 🚀
