# 🔑 RobbieBook Connection Guide

**Never get stuck connecting to RobbieBook1 again!**

## 🎯 Quick Connection Fix

### Aurora → RobbieBook1

```bash
# Run this on Aurora to fix connections
./deployment/robbiebook-connection-fix.sh

# Test all connections
~/test-connections.sh
```

### RobbieBook1 → Aurora/Vengeance

```bash
# On RobbieBook1, add Aurora's key:
mkdir -p ~/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIB4Y7MrfY4a4TxAReeOAJO6uWvinzl/ogQIcljMbJvm1 allan@runpod' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Test connection
ssh allan@192.168.1.246
```

## 🌐 Network Details

### RobbieBook1 (MacBook Pro)

- **IP:** 192.199.240.226
- **User:** allanperetz
- **SSH Port:** 22
- **Status:** ✅ Reachable from Aurora

### Aurora (Current)

- **IP:** 192.168.1.246 (internal)
- **External:** 82.221.170.242:24505
- **User:** allan
- **Status:** ✅ Primary node

### Vengeance (Local)

- **Hostname:** vengeance
- **User:** allan
- **Status:** ✅ Connected

## 🔄 Sync Commands

### Aurora → RobbieBook1

```bash
# Full sync
rsync -av --exclude='.git' . allanperetz@192.199.240.226:~/aurora-sync/

# Quick sync (just changes)
rsync -av --exclude='.git' --exclude='node_modules' . allanperetz@192.199.240.226:~/aurora-sync/
```

### RobbieBook1 → Aurora

```bash
# From RobbieBook1
rsync -av --exclude='.git' ~/aurora-sync/ allan@192.168.1.246:~/robbie_workspace/combined/aurora-ai-robbiverse/
```

## 🚨 Troubleshooting

### Connection Failed?

1. **Check network:** `ping 192.199.240.226`
2. **Check SSH:** `ssh -v allanperetz@192.199.240.226`
3. **Check keys:** `cat ~/.ssh/id_ed25519.pub`
4. **Re-run fix:** `./deployment/robbiebook-connection-fix.sh`

### Sync Failed?

1. **Check space:** `df -h`
2. **Check permissions:** `ls -la ~/.ssh/`
3. **Manual sync:** Use `scp` instead of `rsync`

## 🎯 Quick Reference

| From | To | Command |
|------|----|---------|
| Aurora | RobbieBook1 | `rsync -av . allanperetz@192.199.240.226:~/aurora-sync/` |
| RobbieBook1 | Aurora | `rsync -av ~/aurora-sync/ allan@192.168.1.246:~/robbie_workspace/combined/aurora-ai-robbiverse/` |
| Aurora | Vengeance | `rsync -av . vengeance:~/robbie_workspace/combined/aurora-ai-robbiverse/` |

## 🔧 Emergency Fixes

### Reset SSH Keys

```bash
# On Aurora
rm ~/.ssh/id_ed25519*
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N "" -C "aurora@robbie-empire"

# On RobbieBook1
rm ~/.ssh/authorized_keys
echo 'NEW_AURORA_KEY' >> ~/.ssh/authorized_keys
```

### Test All Connections

```bash
# Run this anytime
~/test-connections.sh
```

---
**This guide ensures you never get stuck connecting to RobbieBook1 again!** 🚀
