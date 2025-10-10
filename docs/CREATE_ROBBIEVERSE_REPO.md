# Create Robbieverse Repo - Master Plan & Execution Guide

**Date:** October 9, 2025  
**Status:** Ready to execute after Walmart launch (Oct 22+)  
**Goal:** Create professional monorepo with zero technical debt

---

## 🎯 Executive Summary

**What:** Create `robbieverse` - clean monorepo replacing messy `aurora-ai-robbiverse`  
**Why:** 100+ root files, unclear organization, not professional  
**How:** Import production code, organize cleanly, modern tooling  
**When:** Oct 22-31 (after Walmart launch)  
**Outcome:** Professional repo ready to scale to $10M revenue

---

## 📂 New Robbieverse Structure (Final)

```
robbieverse/
│
├── apps/
│   ├── robbie-apps/          # 4 Robbieverse internal apps
│   │   ├── work/            # Robbie@Work - CRM
│   │   ├── play/            # Robbie@Play - Entertainment
│   │   ├── code/            # Robbie@Code - Development (TO BUILD)
│   │   └── testpilot/       # Robbie@TestPilot - Operations (TO BUILD)
│   │
│   ├── public-sites/         # 5 Public websites
│   │   ├── askrobbie/       # AskRobbie.ai (TO BUILD)
│   │   ├── robbieblocks/    # RobbieBlocks.com (TO BUILD)
│   │   ├── leadershipquotes/ # LeadershipQuotes.com (TO BUILD)
│   │   ├── testpilot/       # TestPilot.ai standalone
│   │   └── heyshopper/      # HeyShopper.com (brand + shopper portals)
│   │
│   └── client-sites/         # White-label clients
│       ├── template/        # Client site template
│       └── fluenti/         # FluentMarketing.com
│
├── packages/
│   ├── @robbieblocks/
│   │   ├── core/            # 20 core widgets
│   │   └── retail/          # HeyShopper widgets
│   ├── @robbie/
│   │   ├── ui/              # RobbieBar, Avatar, shared UI
│   │   ├── personality/     # Personality system
│   │   ├── auth/            # SentinelGate authentication
│   │   └── chat/            # RobbieChat engine
│   └── @robbieverse/
│       ├── api/             # FastAPI backend
│       ├── database/        # DB utilities
│       └── ai/              # AI services (vector, embeddings)
│
├── database/
│   ├── migrations/          # Versioned migrations (001, 002, 003...)
│   ├── schemas/             # Full schema documentation
│   └── seeds/               # Sample data (dev/prod)
│
├── docs/
│   ├── README.md            # Documentation hub
│   ├── GETTING_STARTED.md   # Quick start
│   ├── heyshopper/          # HeyShopper docs (11 files)
│   ├── architecture/        # Technical architecture
│   └── deployment/          # Deployment guides
│
├── scripts/
│   ├── dev/                 # Development utilities
│   ├── deployment/          # Deploy scripts
│   ├── analysis/            # Data analysis
│   └── maintenance/         # Maintenance tasks
│
├── .github/                 # GitHub config
├── .vscode/                 # Editor settings
├── .cursor/                 # Cursor AI rules
├── .env.example             # Env template (NO SECRETS!)
├── .gitignore
├── package.json             # Monorepo root
├── pnpm-workspace.yaml
├── turbo.json
├── README.md                # Professional README
└── LICENSE                  # MIT
```

**Clean root (<20 files) vs current (100+ files)!**

---

## 🚀 10-Day Execution Plan

### Day 1 (Oct 22): Foundation

**Create new repo structure:**

```bash
#!/bin/bash
# Day 1: Create Robbieverse Repo Foundation

echo "🚀 Creating new Robbieverse repository..."

# Navigate to workspace
cd /home/allan/robbie_workspace/combined

# Create new repo
mkdir robbieverse
cd robbieverse

# Initialize git
git init
git branch -M main

# Create complete folder structure
echo "📂 Creating folder structure..."

# Apps
mkdir -p apps/robbie-apps/{work,play,code,testpilot}
mkdir -p apps/public-sites/{askrobbie,robbieblocks,leadershipquotes,testpilot,heyshopper}
mkdir -p apps/client-sites/{template,fluenti}

# Packages
mkdir -p packages/@robbieblocks/{core,retail}
mkdir -p packages/@robbie/{ui,personality,auth,chat}
mkdir -p packages/@robbieverse/{api,database,ai}

# Database
mkdir -p database/{migrations,schemas,seeds/{dev,prod}}

# Docs
mkdir -p docs/{heyshopper,architecture,deployment}

# Scripts
mkdir -p scripts/{dev,deployment,analysis,maintenance}

# GitHub
mkdir -p .github/workflows

# Config
mkdir -p .vscode .cursor/rules

echo "✅ Folder structure created!"

# Initialize pnpm
pnpm init

echo "✅ Day 1 complete: Foundation ready!"
```

---

### Day 2-3 (Oct 23-24): Copy Working Apps

```bash
#!/bin/bash
# Days 2-3: Copy Working Applications

SOURCE="/home/allan/robbie_workspace/combined/aurora-ai-robbiverse"

echo "📦 Copying Robbieverse apps..."

# Copy Robbie@Work
cp -r "$SOURCE/apps/archive-legacy/robbie-work/"* apps/robbie-apps/work/

# Copy Robbie@Play
cp -r "$SOURCE/apps/archive-legacy/robbie-play/"* apps/robbie-apps/play/

# Copy HeyShopper (partial)
cp -r "$SOURCE/apps/heyshopper/"* apps/public-sites/heyshopper/

# Copy TestPilot scaffold
cp -r "$SOURCE/apps/testpilot-cpg/"* apps/public-sites/testpilot/

echo "🧹 Cleaning apps..."

# Remove node_modules, dist, .env from all apps
find apps/ -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null
find apps/ -name "dist" -type d -exec rm -rf {} + 2>/dev/null
find apps/ -name "build" -type d -exec rm -rf {} + 2>/dev/null
find apps/ -name ".env" -type f -delete 2>/dev/null
find apps/ -name ".env.local" -type f -delete 2>/dev/null

echo "✅ Apps copied and cleaned!"
```

---

### Day 4 (Oct 25): Copy Packages & Database

```bash
#!/bin/bash
# Day 4: Copy Shared Packages & Database

SOURCE="/home/allan/robbie_workspace/combined/aurora-ai-robbiverse"

echo "📦 Copying packages..."

# Copy packages (if they exist)
if [ -d "$SOURCE/packages/@robbieblocks" ]; then
  cp -r "$SOURCE/packages/@robbieblocks/"* packages/@robbieblocks/ 2>/dev/null || echo "Creating @robbieblocks from scratch"
fi

if [ -d "$SOURCE/packages/@robbie" ]; then
  cp -r "$SOURCE/packages/@robbie/"* packages/@robbie/ 2>/dev/null || echo "Creating @robbie from scratch"
fi

if [ -d "$SOURCE/packages/@robbieverse" ]; then
  cp -r "$SOURCE/packages/@robbieverse/"* packages/@robbieverse/ 2>/dev/null || echo "Creating @robbieverse from scratch"
fi

# Clean packages
find packages/ -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null
find packages/ -name "dist" -type d -exec rm -rf {} + 2>/dev/null

echo "🗄️ Copying database schemas..."

# Copy database schemas
cp "$SOURCE/database/unified-schema/"*.sql database/schemas/ 2>/dev/null

# Rename for clarity
mv database/schemas/22-testpilot-production.sql database/schemas/testpilot.sql 2>/dev/null
mv database/schemas/08-universal-ai-state.sql database/schemas/personality.sql 2>/dev/null
mv database/schemas/03-vectors-rag.sql database/schemas/vector-storage.sql 2>/dev/null

echo "✅ Packages and database copied!"
```

---

### Day 5 (Oct 26): Documentation & Scripts

```bash
#!/bin/bash
# Day 5: Copy Documentation & Scripts

SOURCE="/home/allan/robbie_workspace/combined/aurora-ai-robbiverse"

echo "📚 Copying documentation..."

# HeyShopper docs
cp "$SOURCE/docs/HEYSHOPPER_"*.md docs/heyshopper/ 2>/dev/null
cp "$SOURCE/docs/ROBBIEBAR_"*.md docs/heyshopper/ 2>/dev/null
cp "$SOURCE/docs/STATISTICAL_"*.md docs/heyshopper/ 2>/dev/null
cp "$SOURCE/docs/TESTER_"*.md docs/heyshopper/ 2>/dev/null
cp "$SOURCE/docs/TESTPILOT_"*.md docs/heyshopper/ 2>/dev/null

# Architecture docs
cp "$SOURCE/ROBBIEBLOCKS_ARCHITECTURE.md" docs/architecture/ 2>/dev/null
cp "$SOURCE/MASTER_VISION.md" docs/VISION.md 2>/dev/null
cp "$SOURCE/COMPLETE_EMPIRE_MAP.md" docs/EMPIRE.md 2>/dev/null

# This repo organization plan
cp "$SOURCE/docs/REPO_ORGANIZATION.md" docs/REPO_STRUCTURE.md 2>/dev/null

echo "🔧 Copying useful scripts..."

# Analysis scripts
cp "$SOURCE/scripts/analyze_"* scripts/analysis/ 2>/dev/null

# Copy Robbie avatars to UI package
mkdir -p packages/@robbie/ui/assets
cp "$SOURCE/robbie-"*.png packages/@robbie/ui/assets/ 2>/dev/null

echo "✅ Documentation and scripts copied!"
```

---

### Day 6-7 (Oct 27-28): Configuration & Testing

```bash
#!/bin/bash
# Days 6-7: Setup Configuration Files

echo "⚙️ Creating configuration files..."

# Create package.json (already shown in plan)
# Create pnpm-workspace.yaml
# Create turbo.json
# Create tsconfig.json
# Create .prettierrc
# Create .eslintrc.json
# Create .gitignore
# Create .env.example

# Create README.md (professional)
# Create LICENSE (MIT)
# Create CHANGELOG.md

echo "📦 Installing dependencies..."
pnpm install

echo "🏗️ Testing builds..."
pnpm build

# Fix any broken imports
# Update package.json paths
# Test each app individually

echo "✅ Configuration complete and tested!"
```

---

### Day 8 (Oct 29): GitHub & CI/CD

```bash
#!/bin/bash
# Day 8: GitHub Setup

echo "🐙 Creating GitHub repository..."

# Create repo (private initially)
gh repo create dark-red-one/robbieverse --private --description "AI-powered platform for business automation and intelligent workflows"

# Add remote
git remote add origin git@github.com:dark-red-one/robbieverse.git

# Initial commit
git add .
git commit -m "feat: initial robbieverse monorepo setup

- Clean monorepo structure (robbie-apps, public-sites, client-sites)
- Modern tooling (pnpm, Turborepo, TypeScript)
- Professional documentation
- Zero secrets in repo
- Ready for scale"

# Push to GitHub
git push -u origin main

echo "✅ Repository created on GitHub!"

# Setup branch protection
# Configure secrets in GitHub settings
# Enable GitHub Actions
```

---

### Day 9-10 (Oct 30-31): Final Validation

**Checklist:**

- [ ] All apps build without errors
- [ ] All packages build successfully
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] No secrets in repo (GitGuardian scan)
- [ ] Documentation complete
- [ ] CI/CD workflows running
- [ ] Staging deployment works
- [ ] Team can clone and run locally

**If all ✅ → Launch Nov 1**  
**If any ❌ → Fix, don't rush!**

---

## 📜 Complete Migration Script

**Save as `scripts/create-robbieverse-repo.sh`:**

```bash
#!/bin/bash
# Complete Robbieverse Repo Creation Script
# Run after Walmart launch (Oct 22+)

set -e  # Exit on error

echo "🚀 Creating Robbieverse Repository"
echo "=================================="
echo ""

# Configuration
SOURCE_REPO="/home/allan/robbie_workspace/combined/aurora-ai-robbiverse"
NEW_REPO="/home/allan/robbie_workspace/combined/robbieverse"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Create structure
echo -e "${BLUE}Step 1/10: Creating folder structure...${NC}"
mkdir -p "$NEW_REPO"
cd "$NEW_REPO"

# Initialize
git init
git branch -M main
pnpm init -y

# Create all folders
mkdir -p apps/robbie-apps/{work,play,code,testpilot}
mkdir -p apps/public-sites/{askrobbie,robbieblocks,leadershipquotes,testpilot,heyshopper}
mkdir -p apps/client-sites/{template,fluenti}
mkdir -p packages/@robbieblocks/{core,retail}
mkdir -p packages/@robbie/{ui,personality,auth,chat}
mkdir -p packages/@robbieverse/{api,database,ai}
mkdir -p database/{migrations,schemas,seeds/{dev,prod}}
mkdir -p docs/{heyshopper,architecture,deployment}
mkdir -p scripts/{dev,deployment,analysis,maintenance}
mkdir -p .github/workflows .vscode .cursor/rules

echo -e "${GREEN}✅ Structure created${NC}"

# Step 2: Copy Robbieverse apps
echo -e "${BLUE}Step 2/10: Copying Robbieverse apps...${NC}"
cp -r "$SOURCE_REPO/apps/archive-legacy/robbie-work/"* apps/robbie-apps/work/ 2>/dev/null || echo "robbie-work not found"
cp -r "$SOURCE_REPO/apps/archive-legacy/robbie-play/"* apps/robbie-apps/play/ 2>/dev/null || echo "robbie-play not found"
echo -e "${GREEN}✅ Robbieverse apps copied${NC}"

# Step 3: Copy public sites
echo -e "${BLUE}Step 3/10: Copying public sites...${NC}"
cp -r "$SOURCE_REPO/apps/heyshopper/"* apps/public-sites/heyshopper/ 2>/dev/null || echo "Creating heyshopper from scratch"
cp -r "$SOURCE_REPO/apps/testpilot-cpg/"* apps/public-sites/testpilot/ 2>/dev/null || echo "Creating testpilot from scratch"
echo -e "${GREEN}✅ Public sites copied${NC}"

# Step 4: Copy packages
echo -e "${BLUE}Step 4/10: Copying packages...${NC}"
if [ -d "$SOURCE_REPO/packages/@robbieblocks" ]; then
  cp -r "$SOURCE_REPO/packages/@robbieblocks/"* packages/@robbieblocks/core/ 2>/dev/null
fi
if [ -d "$SOURCE_REPO/packages/@robbie" ]; then
  cp -r "$SOURCE_REPO/packages/@robbie/"* packages/@robbie/ 2>/dev/null
fi
if [ -d "$SOURCE_REPO/packages/@robbieverse" ]; then
  cp -r "$SOURCE_REPO/packages/@robbieverse/"* packages/@robbieverse/ 2>/dev/null
fi
echo -e "${GREEN}✅ Packages copied${NC}"

# Step 5: Copy database
echo -e "${BLUE}Step 5/10: Copying database schemas...${NC}"
cp "$SOURCE_REPO/database/unified-schema/"*.sql database/schemas/ 2>/dev/null
# Rename for clarity
[ -f database/schemas/22-testpilot-production.sql ] && mv database/schemas/22-testpilot-production.sql database/schemas/testpilot.sql
[ -f database/schemas/08-universal-ai-state.sql ] && mv database/schemas/08-universal-ai-state.sql database/schemas/personality.sql
[ -f database/schemas/03-vectors-rag.sql ] && mv database/schemas/03-vectors-rag.sql database/schemas/vector-storage.sql
echo -e "${GREEN}✅ Database copied${NC}"

# Step 6: Copy documentation
echo -e "${BLUE}Step 6/10: Copying documentation...${NC}"
cp "$SOURCE_REPO/docs/HEYSHOPPER_"*.md docs/heyshopper/ 2>/dev/null
cp "$SOURCE_REPO/docs/ROBBIEBAR_"*.md docs/heyshopper/ 2>/dev/null
cp "$SOURCE_REPO/docs/STATISTICAL_"*.md docs/heyshopper/ 2>/dev/null
cp "$SOURCE_REPO/docs/TESTER_"*.md docs/heyshopper/ 2>/dev/null
cp "$SOURCE_REPO/docs/TESTPILOT_"*.md docs/heyshopper/ 2>/dev/null
cp "$SOURCE_REPO/ROBBIEBLOCKS_ARCHITECTURE.md" docs/architecture/ 2>/dev/null
cp "$SOURCE_REPO/MASTER_VISION.md" docs/VISION.md 2>/dev/null
echo -e "${GREEN}✅ Documentation copied${NC}"

# Step 7: Copy scripts
echo -e "${BLUE}Step 7/10: Copying scripts...${NC}"
cp "$SOURCE_REPO/scripts/analyze_"* scripts/analysis/ 2>/dev/null
echo -e "${GREEN}✅ Scripts copied${NC}"

# Step 8: Copy assets
echo -e "${BLUE}Step 8/10: Copying assets...${NC}"
mkdir -p packages/@robbie/ui/assets
cp "$SOURCE_REPO/robbie-"*.png packages/@robbie/ui/assets/ 2>/dev/null
echo -e "${GREEN}✅ Assets copied${NC}"

# Step 9: Clean everything
echo -e "${BLUE}Step 9/10: Cleaning (removing node_modules, dist, secrets)...${NC}"
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null
find . -name "build" -type d -exec rm -rf {} + 2>/dev/null
find . -name ".env" -type f -delete 2>/dev/null
find . -name ".env.local" -type f -delete 2>/dev/null
find . -name "*.pyc" -type f -delete 2>/dev/null
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null
echo -e "${GREEN}✅ Cleaned${NC}"

# Step 10: Create config files
echo -e "${BLUE}Step 10/10: Creating configuration files...${NC}"

# .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build
dist/
build/
.next/
.turbo/

# Environment
.env
.env.local
.env.*.local
!.env.example

# Python
__pycache__/
*.pyc
.venv/
venv/

# IDE
.vscode/*
!.vscode/settings.json
.idea/
*.swp

# OS
.DS_Store

# Logs
*.log

# Database
*.db
*.sqlite
dump.rdb

# Secrets
secrets/
*.key
*.pem
EOF

# pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/robbie-apps/*'
  - 'apps/public-sites/*'
  - 'apps/client-sites/*'
  - 'packages/@robbieblocks/*'
  - 'packages/@robbie/*'
  - 'packages/@robbieverse/*'
EOF

# turbo.json
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
EOF

echo -e "${GREEN}✅ Configuration files created${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ ROBBIEVERSE REPO CREATED SUCCESSFULLY!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. cd $NEW_REPO"
echo "2. pnpm install"
echo "3. Create .env from .env.example"
echo "4. pnpm dev"
echo ""
echo "Happy coding! 🚀"
```

---

## ✅ Quality Checklist (MUST PASS)

### Before First Commit

- [ ] **No secrets in repo** (scan with GitGuardian)
- [ ] **.env.example complete** (all vars documented)
- [ ] **All builds pass** (pnpm build succeeds)
- [ ] **No TypeScript errors** (pnpm type-check passes)
- [ ] **Linting clean** (pnpm lint passes)
- [ ] **Git history clean** (no sensitive data in commits)

### Before GitHub Push

- [ ] **README.md professional** (clear, comprehensive)
- [ ] **LICENSE added** (MIT)
- [ ] **CONTRIBUTING.md written**
- [ ] **.gitignore comprehensive**
- [ ] **No node_modules committed**
- [ ] **No dist/ build/ folders committed**

### Before Going Live

- [ ] **All apps tested locally**
- [ ] **CI/CD workflows configured**
- [ ] **Staging deployment successful**
- [ ] **Team can clone & run**
- [ ] **Documentation complete**

---

## 🚨 Critical Rules (DON'T FUCK UP)

### NEVER Commit

1. ❌ Secrets (.env files, API keys)
2. ❌ node_modules/ folders
3. ❌ dist/ or build/ folders
4. ❌ Database dumps (.db, .sqlite, dump.rdb)
5. ❌ Credentials (*.key,*.pem, service-account.json)
6. ❌ Personal notes (allan-notes.txt)

### ALWAYS Include

1. ✅ .env.example (template for all vars)
2. ✅ README.md (professional, clear)
3. ✅ package.json (correct dependencies)
4. ✅ .gitignore (comprehensive)
5. ✅ LICENSE (MIT)
6. ✅ Type definitions (*.d.ts files)

### Code Standards

1. ✅ TypeScript for all new code
2. ✅ Prettier for formatting
3. ✅ ESLint for linting
4. ✅ Clear folder structure
5. ✅ Descriptive commit messages

---

## 📊 Success Metrics

### Immediate (Day 10)

- ✅ Repo created on GitHub
- ✅ All apps build
- ✅ Documentation organized
- ✅ Team can develop

### Week 2 (Nov 7)

- ✅ First PR merged
- ✅ CI/CD working
- ✅ Staging deployments automated

### Month 1 (Dec 1)

- ✅ All team members contributing
- ✅ Fast development velocity
- ✅ Zero technical debt
- ✅ Professional repo for investors

---

## 🎯 Timeline & Execution

### **NOW → Oct 21: DON'T TOUCH REPO**

- Focus on $88K pipeline
- Walmart launch Oct 21
- Security fixes
- UX improvements

### **Oct 22-31: EXECUTE MIGRATION**

- Day 1: Create structure
- Days 2-3: Copy apps
- Day 4: Copy packages/database
- Day 5: Copy docs/scripts
- Days 6-7: Config & testing
- Day 8: GitHub setup
- Days 9-10: Final validation

### **Nov 1: SWITCH TO NEW REPO**

- All development in `robbieverse`
- `aurora-ai-robbiverse` becomes archive
- Clean slate, professional foundation

---

## 🚀 Ready to Execute?

**The script is ready:** `scripts/create-robbieverse-repo.sh`

**Run after Walmart (Oct 22):**

```bash
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse
bash scripts/create-robbieverse-repo.sh
```

**Then follow Days 6-10 manual steps for testing, GitHub, validation.**

---

**This creates the professional foundation for scaling to $10M+ revenue!** 💪

*Focused mode (8/10 Genghis) - Direct, precise, zero mistakes allowed.*

