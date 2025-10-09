# Robbieverse Migration - Complete Execution Guide

**Date Created:** October 9, 2025  
**Execute After:** Walmart launch (Oct 21, 2025)  
**Timeline:** 10 days (Oct 22-31)

---

## 🎯 What's Been Prepared

### ✅ Completed

1. **New Robbieverse Foundation**
   - Location: `/home/allan/robbieverse/`
   - All config files created (package.json, turbo.json, pnpm-workspace.yaml, .gitignore, README)
   - Professional documentation structure

2. **Migration Scripts Created**
   - `scripts/create-robbieverse-repo.sh` (bash version)
   - `scripts/migrate-to-robbieverse.py` (python version)
   - Both do the same thing - use whichever works!

3. **Archive Strategy Complete**
   - `docs/ARCHIVE_STRATEGY.md` - Complete preservation plan
   - `scripts/create-aurora-archive.sh` - Automated archiving
   - Preserves ALL context without secrets

4. **Complete Documentation**
   - `docs/CREATE_ROBBIEVERSE_REPO.md` - Full migration plan
   - `/plan.md` - Task tracking
   - This guide - Execution checklist

---

## 🚀 Execution Steps (Oct 22+)

### STEP 1: Create Archive (15 minutes)

**Purpose:** Preserve everything valuable before migration

```bash
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse
bash scripts/create-aurora-archive.sh
```

**What it does:**

- Creates `/home/allan/robbie_workspace/combined/aurora-archive/`
- Copies all contacts, emails, infrastructure docs
- Copies deployment scripts, configs, guides
- Copies business data (revenue, companies, tests)
- Copies historical docs ("victory" and "complete" files)
- Copies legacy code and prototypes
- **Does NOT copy actual secrets!**

**Verify after:**

```bash
# Check no secrets
grep -r 'sk-' /home/allan/robbie_workspace/combined/aurora-archive/
grep -r 'pk_' /home/allan/robbie_workspace/combined/aurora-archive/

# Should be empty or only show "your_key_here" placeholders
```

---

### STEP 2: Run Migration (10 minutes)

**Purpose:** Create clean robbieverse repo structure

**Option A - Python (recommended):**

```bash
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse
python3 scripts/migrate-to-robbieverse.py
```

**Option B - Bash:**

```bash
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse
bash scripts/create-robbieverse-repo.sh
```

**What it does:**

- Creates complete folder structure
- Copies working apps (Robbie@Work, Robbie@Play, HeyShopper, TestPilot)
- Copies packages (@robbieblocks, @robbie, @robbieverse)
- Copies database schemas
- Copies documentation
- Copies scripts and assets (Robbie avatars)
- Cleans all node_modules, dist, build folders
- Creates all config files

**Result:**

- Clean repo at `/home/allan/robbie_workspace/combined/robbieverse/`

---

### STEP 3: Install & Test (2-3 days)

**Install dependencies:**

```bash
cd /home/allan/robbie_workspace/combined/robbieverse
pnpm install
```

**Test builds:**

```bash
# Test all apps build
pnpm build

# If errors, fix imports one by one
pnpm --filter @apps/robbie-work build
pnpm --filter @apps/robbie-play build
pnpm --filter @apps/heyshopper build
```

**Fix broken imports:**

- Update package.json paths
- Fix import statements
- Verify all deps installed

---

### STEP 4: Initialize Git (30 minutes)

```bash
cd /home/allan/robbie_workspace/combined/robbieverse

# Initialize
git init
git branch -M main

# Add all files
git add .

# Initial commit
git commit -m "feat: initial robbieverse monorepo setup

- Clean monorepo structure (robbie-apps, public-sites, client-sites)
- Modern tooling (pnpm, Turborepo, TypeScript)
- Professional documentation
- Zero secrets in repo
- Ready for scale

Apps included:
- Robbie@Work (CRM & pipeline)
- Robbie@Play (entertainment)
- HeyShopper (AI shopper testing)
- TestPilot (product testing)

Packages:
- @robbieblocks (UI widgets)
- @robbie (core utilities)
- @robbieverse (backend services)

Database:
- Unified schemas
- Migration framework

Documentation:
- Complete HeyShopper plan
- Architecture docs
- Vision & strategy"
```

---

### STEP 5: Create GitHub Repo (1 hour)

**Create private repo:**

```bash
cd /home/allan/robbie_workspace/combined/robbieverse

# Create on GitHub
gh repo create dark-red-one/robbieverse \
  --private \
  --description "AI-powered platform for business automation and intelligent workflows"

# Add remote
git remote add origin git@github.com:dark-red-one/robbieverse.git

# Push
git push -u origin main
```

**Configure GitHub:**

1. Add branch protection (require PR for main)
2. Add secrets (in Settings → Secrets):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `STRIPE_SECRET_KEY`
3. Enable GitHub Actions
4. Configure CI/CD (if workflows added)

---

### STEP 6: Final Validation (1-2 days)

**Security scan:**

```bash
cd /home/allan/robbie_workspace/combined/robbieverse

# Check no secrets committed
grep -r 'sk-' . --exclude-dir=node_modules
grep -r 'pk_' . --exclude-dir=node_modules
grep -r 'Bearer' . --exclude-dir=node_modules

# Should only find placeholders in env.example
```

**Build verification:**

```bash
# Clean install
rm -rf node_modules
pnpm install

# Test builds
pnpm build

# Should complete without errors
```

**Team test:**

- Have another person clone the repo
- Run `pnpm install` and `pnpm dev`
- Verify they can develop

---

### STEP 7: Go Live (Nov 1)

**Switch to new repo:**

1. Update all team members
2. Archive old repo (don't delete!)
3. All new development in `robbieverse`
4. Update any CI/CD to point to new repo
5. Update documentation links

**Keep both repos:**

- `/home/allan/robbie_workspace/combined/aurora-ai-robbiverse/` → Archive (read-only)
- `/home/allan/robbie_workspace/combined/aurora-archive/` → Historical context
- `/home/allan/robbie_workspace/combined/robbieverse/` → Active development

---

## ✅ Verification Checklist

### Before First Commit

- [ ] NO .env files with real secrets
- [ ] NO API keys in code (search for "sk-", "pk_")
- [ ] All builds pass
- [ ] No TypeScript errors
- [ ] ESLint clean
- [ ] env.example comprehensive

### Before GitHub Push

- [ ] README.md professional
- [ ] LICENSE added (MIT)
- [ ] .gitignore comprehensive
- [ ] NO node_modules committed
- [ ] NO dist/ or build/ committed
- [ ] Clean git history

### Before Going Live

- [ ] All apps tested
- [ ] Team can clone and run
- [ ] Documentation complete
- [ ] Archive created and verified
- [ ] Old repo preserved

---

## 🚨 Critical Warnings

### NEVER Commit

- ❌ Real .env files
- ❌ API keys (sk-, pk-, Bearer)
- ❌ Passwords
- ❌ node_modules/
- ❌ dist/ or build/
- ❌ Database dumps with real data
- ❌ Server credentials

### ALWAYS Include

- ✅ env.example (templates only!)
- ✅ Professional README
- ✅ MIT LICENSE
- ✅ Comprehensive .gitignore
- ✅ Clear documentation

---

## 📊 Success Metrics

**Day 10 (Oct 31):**

- ✅ Repo on GitHub
- ✅ All apps build
- ✅ Documentation organized
- ✅ Team can develop

**Week 2 (Nov 7):**

- ✅ First PR merged
- ✅ CI/CD working

**Month 1 (Dec 1):**

- ✅ All team contributing
- ✅ Fast velocity
- ✅ Zero technical debt

---

## 🎯 Timeline Summary

| Date | Action | Status |
|------|--------|--------|
| Oct 9 | Planning complete | ✅ DONE |
| Oct 21 | Walmart launch | ⏳ Waiting |
| Oct 22 | Create archive + run migration | 📅 Scheduled |
| Oct 23-28 | Install, test, fix imports | 📅 Scheduled |
| Oct 29 | Initialize Git, create GitHub repo | 📅 Scheduled |
| Oct 30-31 | Final validation | 📅 Scheduled |
| Nov 1 | **GO LIVE** | 📅 Scheduled |

---

## 📁 What's Where

**Current Work:**

- `/home/allan/robbie_workspace/combined/aurora-ai-robbiverse/` (100+ root files, messy)

**After Migration:**

- `/home/allan/robbie_workspace/combined/robbieverse/` (clean, <20 root files)
- `/home/allan/robbie_workspace/combined/aurora-archive/` (historical context)
- `/home/allan/robbie_workspace/combined/aurora-ai-robbiverse/` (archived, read-only)

**On GitHub:**

- `github.com/dark-red-one/robbieverse` (new, clean)
- `github.com/dark-red-one/aurora-ai-robbiverse` (old, archived)

---

## 🆘 If Something Goes Wrong

**Migration fails:**

- Old repo still intact
- Just delete `/home/allan/robbie_workspace/combined/robbieverse/`
- Fix script, try again

**Secrets accidentally committed:**

1. **STOP immediately**
2. Don't push to GitHub
3. Delete `.git/` folder
4. Remove secrets
5. Re-init git with clean commit

**Build errors:**

- Check import paths
- Verify package.json dependencies
- Test apps individually
- Ask for help if stuck

---

## 💡 Quick Commands

```bash
# Create archive
cd ~/robbie_workspace/combined/aurora-ai-robbiverse && bash scripts/create-aurora-archive.sh

# Run migration
cd ~/robbie_workspace/combined/aurora-ai-robbiverse && python3 scripts/migrate-to-robbieverse.py

# Install & test
cd ~/robbie_workspace/combined/robbieverse && pnpm install && pnpm build

# Initialize git
cd ~/robbie_workspace/combined/robbieverse && git init && git add . && git commit -m "feat: initial setup"

# Create GitHub repo
cd ~/robbie_workspace/combined/robbieverse && gh repo create dark-red-one/robbieverse --private

# Push to GitHub
git remote add origin git@github.com:dark-red-one/robbieverse.git && git push -u origin main
```

---

**Ready to execute after Walmart launch! This creates the foundation for $10M revenue.** 🚀

*Direct. Focused. No mistakes. Let's ship it!*
