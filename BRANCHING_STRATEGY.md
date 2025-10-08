# 🔀 ROBBIE ECOSYSTEM - BRANCHING STRATEGY

## 🎯 **THE SITUATION:**

We have a **partially working** ecosystem:
- ✅ 1/5 apps shows something (Robbie@Code)
- 🔴 3/5 apps completely blank (Work, Play, Control)
- ⚠️ 1/5 is just static HTML (Homepage)
- ✅ All components exist but aren't properly wired up

---

## 🏗️ **PROPOSED BRANCH STRUCTURE:**

### **1. `main` (STABLE/PRODUCTION)**
**Purpose:** What's currently deployed and "working"
**State:** Partially broken but deployed
**Rule:** Only merge from `staging` after full testing

### **2. `staging` (INTEGRATION/TESTING)**
**Purpose:** Where we test the complete rebuild before going live
**State:** Will contain the new nuclear rebuild
**Rule:** Must pass all tests before merging to `main`

### **3. `dev-rebuild` (ACTIVE DEVELOPMENT)**
**Purpose:** Where we do the actual nuclear rebuild work
**State:** Work in progress, can be broken during development
**Rule:** Merge to `staging` when features are complete

---

## 🚀 **RECOMMENDED APPROACH:**

### **Option A: Safe Parallel Deployment** ⭐ RECOMMENDED
```bash
# Keep current broken apps running on main
# Build new apps in staging
# Deploy staging to /staging/ subdirectory
# Test both simultaneously
# Switch when ready

/var/www/html/              # Current (main branch)
├── code/                   # Partially working
├── work/                   # Broken
├── play/                   # Broken
└── control/                # Broken

/var/www/html/staging/      # New rebuild (staging branch)
├── code/                   # Fully working
├── work/                   # Fully working
├── play/                   # Fully working
└── control/                # Fully working
```

**URLs:**
- Production: `http://aurora.testpilot.ai/code/`
- Staging: `http://aurora.testpilot.ai/staging/code/`

**Benefits:**
- ✅ Can compare old vs new side-by-side
- ✅ No downtime
- ✅ Easy rollback if needed
- ✅ Test in production environment
- ✅ Switch with just nginx config change

### **Option B: Direct Replacement**
```bash
# Backup main to branch
# Rebuild directly on main
# Deploy when ready
# Hope nothing breaks
```

**Risks:**
- 🔴 No easy rollback
- 🔴 Downtime during rebuild
- 🔴 Can't compare versions

---

## 📋 **IMPLEMENTATION PLAN:**

### **Step 1: Create Branches**
```bash
# Save current state
git add -A
git commit -m "💾 SNAPSHOT: Current state before nuclear rebuild"
git push origin main

# Create staging branch
git checkout -b staging
git push -u origin staging

# Create development branch
git checkout -b dev-rebuild
git push -u origin dev-rebuild
```

### **Step 2: Document Current Deployment**
```bash
# Backup current deployment
sudo tar -czf /tmp/current-deployment-$(date +%Y%m%d).tar.gz /var/www/html/
```

### **Step 3: Build in dev-rebuild**
```bash
# Work on dev-rebuild branch
git checkout dev-rebuild

# Create shared robbieblocks
# Build all 5 apps
# Test locally
```

### **Step 4: Deploy to Staging**
```bash
# Merge to staging when features complete
git checkout staging
git merge dev-rebuild

# Deploy to /staging/ subdirectory
sudo mkdir -p /var/www/html/staging
sudo cp -r builds/* /var/www/html/staging/

# Update nginx for staging paths
```

### **Step 5: Test Staging**
```bash
# Test all features at staging URLs
# Fix any issues in dev-rebuild
# Merge fixes to staging
```

### **Step 6: Go Live**
```bash
# When staging is perfect
git checkout main
git merge staging

# Deploy to production
sudo cp -r /var/www/html/staging/* /var/www/html/

# Update nginx (remove /staging/ paths)
sudo systemctl reload nginx
```

---

## 🎯 **DEPLOYMENT DIRECTORIES:**

### **During Development:**
```
/var/www/html/
├── index.html              # Current homepage (static)
├── code/                   # Current Robbie@Code (test page)
├── work/                   # Current broken
├── play/                   # Current broken
├── control/                # Current broken
└── staging/                # NEW BUILDS HERE
    ├── index.html          # New homepage with auth
    ├── code/               # New Robbie@Code
    ├── work/               # New Robbie@Work
    ├── play/               # New Robbie@Play
    └── control/            # New Robbie@Control
```

### **After Go-Live:**
```
/var/www/html/
├── index.html              # New homepage with auth
├── code/                   # New Robbie@Code
├── work/                   # New Robbie@Work
├── play/                   # New Robbie@Play
└── control/                # New Robbie@Control
```

---

## 🔧 **NGINX CONFIGURATION:**

### **During Staging:**
```nginx
# Main production (current/broken)
location /code/ { ... }
location /work/ { ... }
location /play/ { ... }
location /control/ { ... }

# Staging (new builds)
location /staging/code/ { ... }
location /staging/work/ { ... }
location /staging/play/ { ... }
location /staging/control/ { ... }
```

### **After Go-Live:**
```nginx
# Production (new builds)
location /code/ { ... }
location /work/ { ... }
location /play/ { ... }
location /control/ { ... }
```

---

## 🎯 **DECISION TIME:**

### **Recommendation: Option A (Parallel Deployment)**

**Why:**
1. **Zero downtime** - Current site stays up
2. **Easy testing** - Compare side-by-side
3. **Safe rollback** - Just switch nginx config
4. **No pressure** - Take time to get it right
5. **Production testing** - Test in real environment

**Timeline:**
- **Week 1:** Build in `dev-rebuild` branch
- **Week 2:** Deploy to `/staging/` and test
- **Week 3:** Fix any issues
- **Week 4:** Go live (switch nginx to staging dirs)

---

## 🚀 **READY TO START?**

### **Next Commands:**
```bash
# 1. Save current state
git add -A
git commit -m "💾 SNAPSHOT: Before nuclear rebuild"
git push origin main

# 2. Create branches
git checkout -b staging
git push -u origin staging
git checkout -b dev-rebuild
git push -u origin dev-rebuild

# 3. Backup deployment
sudo tar -czf /tmp/current-$(date +%Y%m%d).tar.gz /var/www/html/

# 4. Start building!
```

**Want me to execute this plan?** 🚀

