# Aurora Town <-> GitHub Auto-Sync Guide

**Setup Complete:** October 4, 2025  
**Server:** Aurora Town Production (aurora-town-u44170.vm.elestio.app)  
**Repo:** `/opt/aurora-dev/aurora`

---

## 🔄 How It Works

### Auto-Pull (Every 5 Minutes) ✅
- Cron job pulls latest from GitHub automatically
- Stashes any uncommitted work
- Pulls changes
- Restores uncommitted work
- Runs silently in background

**Cron Schedule:**
```
*/5 * * * * /opt/aurora-dev/aurora/deployment/auto-sync-aurora-town.sh
```

**Check sync log:**
```bash
tail -f /opt/aurora-dev/aurora/deployment/sync.log
```

### Manual Push (When Making Changes on Server)
```bash
cd /opt/aurora-dev/aurora

# Add and commit changes
git add -A
git commit -m "Your changes"
git push origin main
```

---

## 📋 Workflow

### When You Code on Vengeance/Local:
1. **Make changes locally**
2. **Push to GitHub:**
   ```bash
   ./deployment/push-to-github.sh "What you did"
   ```
3. **Aurora Town pulls automatically** within 5 minutes ✅

### When You Need to Change Code on Aurora Town:
1. **SSH to server:**
   ```bash
   ssh root@aurora-town-u44170.vm.elestio.app
   ```
2. **Make changes:**
   ```bash
   cd /opt/aurora-dev/aurora
   # Edit files...
   ```
3. **Push changes:**
   ```bash
   git add -A
   git commit -m "Server-side changes"
   git push origin main
   ```
4. **Vengeance and other machines** pull automatically ✅

---

## 🚀 Quick Commands (Run on Aurora Town)

### Check Sync Status
```bash
# View recent syncs
tail -20 /opt/aurora-dev/aurora/deployment/sync.log

# Watch live
tail -f /opt/aurora-dev/aurora/deployment/sync.log
```

### Manual Sync (Force Now)
```bash
/opt/aurora-dev/aurora/deployment/auto-sync-aurora-town.sh
```

### Check Cron Job
```bash
crontab -l
```

### Stop Auto-Sync (If Needed)
```bash
crontab -e
# Comment out or delete the auto-sync line
```

---

## 🔍 Troubleshooting

### Check If Sync Is Running
```bash
crontab -l | grep auto-sync
ps aux | grep auto-sync
```

### View Git Status
```bash
cd /opt/aurora-dev/aurora
git status
git log --oneline -5
```

### Manual Pull (If Needed)
```bash
cd /opt/aurora-dev/aurora
git pull origin main
```

### Restart Auto-Sync
```bash
cd /opt/aurora-dev/aurora
./deployment/setup-aurora-town-auto-sync.sh
```

---

## 📊 Multi-Machine Sync Status

### Your Infrastructure:
1. **Vengeance** (local dev) - Auto-pull every 5 mins ✅
2. **Aurora Town** (Elestio production) - Auto-pull every 5 mins ✅
3. **Iceland** (GPU RunPod) - Manual sync
4. **GitHub** - Central source of truth

### Workflow:
- **Code anywhere** → Push to GitHub
- **Vengeance & Aurora Town** → Pull automatically
- **Always in sync** within 5 minutes

---

## 🎯 Best Practices

**DO:**
- Let auto-sync handle most updates
- Push from wherever you're working
- Commit with clear messages
- Check sync.log if something seems off

**DON'T:**
- Make conflicting edits on multiple machines simultaneously
- Force push (unless you really know why)
- Disable auto-sync without good reason
- Commit secrets (.env files are auto-ignored)

---

## 🔐 Connection Details

**Server:** aurora-town-u44170.vm.elestio.app  
**User:** root  
**Repo Path:** /opt/aurora-dev/aurora  
**GitHub Remote:** https://github.com/dark-red-one/aurora-ai-robbiverse

---

## 🚀 Quick Reference

```bash
# SSH to Aurora Town
ssh root@aurora-town-u44170.vm.elestio.app

# View sync log
tail -f /opt/aurora-dev/aurora/deployment/sync.log

# Manual sync now
/opt/aurora-dev/aurora/deployment/auto-sync-aurora-town.sh

# Check what's running
crontab -l

# View recent commits
cd /opt/aurora-dev/aurora && git log --oneline -10
```

---

**Status:** Auto-sync active on Aurora Town ✅  
**Frequency:** Pulls every 5 minutes  
**Last Setup:** October 4, 2025

---

*Keeping the Aurora AI Empire synchronized - Production Ready* 🚀

