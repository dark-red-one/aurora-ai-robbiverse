# Vengeance <-> GitHub Auto-Sync Guide

**Setup Complete:** October 4, 2025  
**Machine:** Vengeance (Allan's gaming/dev machine)  
**Repo:** `/home/allan/robbie_workspace/combined/aurora-ai-robbiverse`

---

## 🔄 How It Works

### Auto-Pull (Every 5 Minutes) ✅
- Cron job pulls latest from GitHub automatically
- Stashes your uncommitted work
- Pulls changes
- Restores your work
- Runs silently in background

**Cron Schedule:**
```
*/5 * * * * /home/allan/robbie_workspace/combined/aurora-ai-robbiverse/deployment/auto-sync-vengeance.sh
```

**Check sync log:**
```bash
tail -f deployment/sync.log
```

### Manual Push (When You Want to Save)
```bash
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse

# Quick push with auto-generated message
./deployment/push-to-github.sh

# Push with custom message
./deployment/push-to-github.sh "Added new feature X"
```

---

## 📋 Workflow

### When You're Coding on Vengeance:

1. **Work normally** - Files auto-pull every 5 mins ✅
2. **Save to GitHub when ready:**
   ```bash
   ./deployment/push-to-github.sh "What you did"
   ```
3. **That's it** - Changes sync to other machines automatically

### When You Code on Servers (Iceland, Aurora Town):

1. **Make changes on server**
2. **Push from server:**
   ```bash
   cd /workspace/aurora  # or wherever
   git add -A
   git commit -m "Server changes"
   git push origin main
   ```
3. **Vengeance pulls automatically** within 5 minutes ✅

---

## 🚀 Quick Commands

### Push Your Changes
```bash
# From anywhere, quick alias:
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse && ./deployment/push-to-github.sh
```

### Manual Pull (If You Can't Wait 5 Mins)
```bash
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse
git pull origin main
```

### Check Sync Status
```bash
# View recent syncs
tail -20 deployment/sync.log

# Watch live
tail -f deployment/sync.log
```

### Stop Auto-Sync (If Needed)
```bash
crontab -e
# Comment out the line or delete it
```

---

## ⚡ Power User Tips

### Create Aliases (Add to ~/.bashrc)
```bash
# Quick push
alias gpush='cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse && ./deployment/push-to-github.sh'

# Quick status
alias gstatus='cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse && git status'

# Quick pull
alias gpull='cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse && git pull origin main'
```

Then just run:
```bash
gpush "Fixed the thing"
gstatus
gpull
```

### Force Sync Now
```bash
/home/allan/robbie_workspace/combined/aurora-ai-robbiverse/deployment/auto-sync-vengeance.sh
```

---

## 🔍 Troubleshooting

### Merge Conflicts
If auto-pull hits a conflict:
```bash
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse
git status  # See what's conflicted
git stash   # Save your local changes
git pull origin main  # Get GitHub version
git stash pop  # Restore your changes (may need manual merge)
```

### Check If Sync Is Running
```bash
crontab -l | grep auto-sync
ps aux | grep auto-sync
```

### View Git Remote
```bash
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse
git remote -v
```

---

## 📊 Multi-Machine Setup

### Your Machines:
1. **Vengeance** (this machine) - Auto-pull ✅, manual push
2. **Iceland** (GPU RunPod) - Manual sync
3. **Aurora Town** (Elestio) - Manual sync
4. **Other dev machines** - Set up same auto-pull

### Workflow:
- **Code on any machine** → Push when done
- **Vengeance** → Pulls automatically every 5 mins
- **Servers** → Pull manually when deploying

---

## 🎯 Best Practices

**DO:**
- Commit frequently with clear messages
- Push before switching machines
- Pull before starting new work (auto-handled on Vengeance)
- Use descriptive commit messages

**DON'T:**
- Force push (unless you know why)
- Commit secrets (.env files auto-ignored)
- Work on same files across machines simultaneously
- Forget to push before leaving Vengeance

---

## 🔐 Credentials

**Already configured:**
- ✅ Git user: Allan Peretz <allan@testpilotcpg.com>
- ✅ GitHub token stored (auto-auth)
- ✅ Remote: https://github.com/dark-red-one/aurora-ai-robbiverse

**No password prompts** - everything just works ✅

---

## 🚀 Quick Reference

```bash
# Push changes
./deployment/push-to-github.sh "Your message"

# Check what changed
git status

# See recent commits
git log --oneline -10

# View sync log
tail -f deployment/sync.log

# Manual pull (if impatient)
git pull origin main
```

---

**Status:** Auto-sync active on Vengeance ✅  
**Frequency:** Pulls every 5 minutes  
**Push:** Manual (run script when ready to save)

---

*Syncing the Aurora AI Empire - October 2025* 🚀

