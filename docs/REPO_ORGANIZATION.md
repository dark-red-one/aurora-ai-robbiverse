# Aurora AI Robbieverse: Repository Organization

**Date:** October 9, 2025  
**Structure:** Organized by app type (robbie-apps, public-sites, client-sites)

---

## 📂 Complete Repo Structure

```
/home/allan/robbie_workspace/combined/aurora-ai-robbiverse/
│
├── apps/
│   │
│   ├── robbie-apps/              # Internal Robbieverse applications
│   │   ├── robbie-work/         # Robbie@Work - CRM, deals, pipeline
│   │   ├── robbie-play/         # Robbie@Play - Entertainment, Blackjack, Spotify
│   │   ├── robbie-code/         # Robbie@Code - Cursor integration (TO BUILD)
│   │   └── robbie-testpilot/    # Robbie@TestPilot - Operations center (TO BUILD) 🆕
│   │
│   ├── public-sites/            # Public-facing websites
│   │   ├── askrobbie/           # AskRobbie.ai - AI assistant product
│   │   ├── robbieblocks/        # RobbieBlocks.com - Component marketplace
│   │   ├── leadershipquotes/    # LeadershipQuotes.com - Content/media
│   │   ├── testpilot/           # TestPilot.ai - Standalone testing (TO BUILD)
│   │   └── heyshopper/          # HeyShopper.com - Integrated testing (TO BUILD)
│   │
│   ├── client-sites/            # White-label/client websites
│   │   ├── fluenti/             # FluentMarketing.com
│   │   └── [future-clients]/    # Additional client sites
│   │
│   └── archive-legacy/          # Historical versions (keep for reference)
│       ├── robbie-app/
│       ├── robbie-app-v2/
│       ├── robbie-control/
│       └── ...
│
├── packages/                     # Shared packages
│   ├── @robbieblocks/core/      # RobbieBlocks widgets
│   ├── @robbie/ui/              # RobbieBar, shared UI components
│   ├── @robbie/personality/     # Personality system
│   └── @robbieverse/api/        # Backend API services
│
├── docs/                        # Documentation
│   ├── HEYSHOPPER_INDEX.md     # HeyShopper master index
│   ├── HEYSHOPPER_EXECUTABLE_PLAN.md  # Definitive plan
│   └── ...
│
├── database/                    # Database schemas
│   └── unified-schema/
│       ├── 22-testpilot-production.sql
│       └── ...
│
└── scripts/                     # Utility scripts
    ├── analyze_tester_feedback.sql
    └── ...
```

---

## 🎨 Robbieverse Apps (Internal - aurora.testpilot.ai)

### Common Characteristics

- RobbieBar universal interface
- RobbieBlocks components
- Personality system (6 moods, Gandhi-Genghis)
- Same visual design/aesthetic
- Cross-app intelligence
- Deployed at: aurora.testpilot.ai/[app]

### 1. Robbie@Work ✅ LIVE

**Path:** `apps/robbie-apps/robbie-work/`  
**URL:** aurora.testpilot.ai/work/  
**Purpose:** CRM, deals, pipeline for Allan's consulting  
**Features:**

- Pipeline view
- Contacts & companies
- Tasks & calendar
- Revenue tracking

### 2. Robbie@Play ✅ LIVE

**Path:** `apps/robbie-apps/robbie-play/`  
**URL:** aurora.testpilot.ai/play/  
**Purpose:** Entertainment & chat  
**Features:**

- Blackjack with Robbie dealer
- Chat interface
- Spotify integration
- Games

### 3. Robbie@Code 🆕 TO BUILD

**Path:** `apps/robbie-apps/robbie-code/`  
**URL:** aurora.testpilot.ai/code/  
**Purpose:** Cursor integration, dev partner  
**Features:**

- Opens Cursor with project
- CNN livestream in sidebar
- Code context awareness
- Git integration

### 4. Robbie@TestPilot 🆕 TO BUILD

**Path:** `apps/robbie-apps/robbie-testpilot/`  
**URL:** aurora.testpilot.ai/testpilot/  
**Purpose:** TestPilot business operations  
**Features:**

- Sales pipeline ($88K deals)
- Test operations monitoring
- Shopper panel management
- Revenue analytics
- Team coordination
- Self-optimization dashboard

**RobbieBar Config:**

```typescript
{
  menuItems: [
    'Pipeline',    // Sales deals
    'Tests',       // Test operations
    'Shoppers',    // Panel management
    'Revenue',     // Analytics
    'Customers',   // Account health
    'Team'         // Operations
  ]
}
```

---

## 🌐 Public Sites (External - Various Domains)

### Common Characteristics

- Built with RobbieBlocks widgets
- Shared component library
- Can be standalone OR Robbieverse-connected
- Each has unique branding
- Different target audiences

### 1. AskRobbie.ai 🆕 TO BUILD

**Path:** `apps/public-sites/askrobbie/`  
**URL:** askrobbie.ai  
**Purpose:** AI assistant product marketing  
**Widgets:** Vista Hero, Chat Widget, Specsheet, Pricing Table  
**Target:** SMBs, individuals wanting AI assistant

### 2. RobbieBlocks.com 🆕 TO BUILD

**Path:** `apps/public-sites/robbieblocks/`  
**URL:** robbieblocks.com  
**Purpose:** Component marketplace  
**Widgets:** Vista Hero, Talentverse Grid, Facet Forge, Spotlight  
**Target:** Developers, agencies buying widgets

### 3. LeadershipQuotes.com 🆕 TO BUILD

**Path:** `apps/public-sites/leadershipquotes/`  
**URL:** leadershipquotes.com  
**Purpose:** Content/media site  
**Widgets:** Spotlight, Subscribe, Reviews, Doc Prism  
**Target:** General audience, content consumers

### 4. TestPilot.ai (Standalone) 🆕 TO BUILD

**Path:** `apps/public-sites/testpilot/`  
**URL:** app.testpilotcpg.com (or testpilot.ai)  
**Purpose:** Standalone professional testing platform  
**Widgets:** Vista Hero, Specsheet, ROI Calculator, Reviews  
**Target:** Mid-market CPG brands  
**Mode:** Professional only, no personality visible

### 5. HeyShopper.com 🆕 TO BUILD

**Path:** `apps/public-sites/heyshopper/`  
**URL:** heyshopper.com  
**Purpose:** Robbieverse-integrated testing platform  
**Widgets:** Spotlight, Smart Cart, Comparison Table, Pricing Table  
**Target:** Advanced users, Robbieverse customers

**Two Portals:**

```
heyshopper/
├── src/
│   ├── brand/          # Brand portal routes
│   │   ├── pages/
│   │   ├── components/
│   │   └── routes.tsx
│   │
│   ├── shopper/        # Shopper portal routes
│   │   ├── pages/
│   │   ├── components/
│   │   └── routes.tsx
│   │
│   ├── shared/         # Shared components
│   │   ├── RobbieBar/ (if using)
│   │   ├── SentinelGate/
│   │   └── ...
│   │
│   └── App.tsx         # Main app with routing
│
├── branding.json       # Brand config
└── package.json
```

---

## 👥 Client Sites (White-Label)

### Purpose

- Custom-branded sites for clients
- Powered by RobbieBlocks
- Client-specific configurations
- Revenue: Build once, deploy many

### 1. FluentMarketing.com ✅ EXISTS

**Path:** `apps/client-sites/fluenti/`  
**Client:** Fluenti Marketing  
**Purpose:** Marketing agency website  
**Status:** Live or in development

### 2. Future Client Sites

**Path:** `apps/client-sites/[client-name]/`  
**Examples:**

- Simply Good Foods (if they want custom site)
- Agency partners
- White-label opportunities

**Template Structure:**

```
client-sites/
├── [client-name]/
│   ├── branding.json      # Client brand colors, logo, etc.
│   ├── widgets.json       # Which RobbieBlocks to use
│   ├── src/
│   │   └── (standard structure)
│   └── deploy.config.js   # Deployment settings
```

---

## 📦 Shared Packages

### Core Packages

**`packages/@robbieblocks/core/`**

- 20 RobbieBlocks widgets
- Vista Hero, Chat Widget, Sentinel Gate, etc.
- Shared across ALL sites

**`packages/@robbie/ui/`**

- RobbieBar universal interface
- Shared UI components
- Design tokens (colors, typography, spacing)

**`packages/@robbie/personality/`**

- Personality system (moods, Gandhi-Genghis)
- Shared state management
- Cross-app sync

**`packages/@robbieverse/api/`**

- Backend services (Python FastAPI)
- AI router, priorities engine
- Database connectors

---

## 🚀 Migration Plan (Reorganize Existing)

### Current State

```
apps/
├── heyshopper/ (exists, partial)
├── testpilot-cpg/ (exists, scaffold)
├── robbie-work/ (in archive-legacy)
├── robbie-play/ (in archive-legacy)
└── archive-legacy/ (many old versions)
```

### Target State

```
apps/
├── robbie-apps/
│   ├── robbie-work/      # Move from archive-legacy
│   ├── robbie-play/      # Move from archive-legacy
│   ├── robbie-code/      # Create new
│   └── robbie-testpilot/ # Create new 🆕
│
├── public-sites/
│   ├── askrobbie/        # Create new
│   ├── robbieblocks/     # Create new
│   ├── leadershipquotes/ # Create new
│   ├── testpilot/        # Rename from testpilot-cpg
│   └── heyshopper/       # Already exists
│
├── client-sites/
│   └── fluenti/          # Create new (if site exists elsewhere)
│
└── archive-legacy/       # Keep for reference
```

---

## 📋 Implementation Steps

### Phase 1: Organize Existing (1 day)

```bash
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse/apps

# Create new structure
mkdir -p robbie-apps
mkdir -p public-sites
mkdir -p client-sites

# Move existing Robbieverse apps
mv archive-legacy/robbie-work robbie-apps/
mv archive-legacy/robbie-play robbie-apps/

# Move existing public sites
mv testpilot-cpg public-sites/testpilot
mv heyshopper public-sites/heyshopper

# Keep archive
# archive-legacy stays as-is for reference
```

### Phase 2: Create New Apps (As Needed)

**Robbie@TestPilot (Priority 1):**

```bash
cp -r robbie-apps/robbie-work robbie-apps/robbie-testpilot
# Then customize for TestPilot operations
```

**Public Sites (Priority 2-5):**

```bash
# Create from template as needed
cp -r public-sites/heyshopper public-sites/askrobbie
# Customize branding, widgets, content
```

---

## 🎯 Updated HeyShopper Location

### Current

```
apps/heyshopper/
```

### After Reorganization

```
apps/public-sites/heyshopper/
├── src/
│   ├── brand/          # Brand portal (/brand routes)
│   ├── shopper/        # Shopper portal (/shopper routes)
│   └── shared/         # Shared components
├── branding.json
└── package.json
```

---

## 📊 Summary Table

| App Type | App Name | Path | URL | Status |
|----------|----------|------|-----|--------|
| **Robbieverse** | Robbie@Work | `robbie-apps/robbie-work/` | aurora.testpilot.ai/work | ✅ Live |
| **Robbieverse** | Robbie@Play | `robbie-apps/robbie-play/` | aurora.testpilot.ai/play | ✅ Live |
| **Robbieverse** | Robbie@Code | `robbie-apps/robbie-code/` | aurora.testpilot.ai/code | 🆕 To build |
| **Robbieverse** | Robbie@TestPilot | `robbie-apps/robbie-testpilot/` | aurora.testpilot.ai/testpilot | 🆕 To build |
| **Public** | AskRobbie.ai | `public-sites/askrobbie/` | askrobbie.ai | 🆕 To build |
| **Public** | RobbieBlocks.com | `public-sites/robbieblocks/` | robbieblocks.com | 🆕 To build |
| **Public** | LeadershipQuotes | `public-sites/leadershipquotes/` | leadershipquotes.com | 🆕 To build |
| **Public** | TestPilot | `public-sites/testpilot/` | app.testpilotcpg.com | 🆕 To build |
| **Public** | HeyShopper | `public-sites/heyshopper/` | heyshopper.com | 🔨 Partial |
| **Client** | Fluenti | `client-sites/fluenti/` | fluentmarketing.com | 📋 TBD |

---

## 🔧 Shared Infrastructure

### Packages (All Apps Use These)

**`packages/@robbieblocks/core/`**

- 20 RobbieBlocks widgets
- Used by ALL public sites + client sites
- Vista Hero, Chat Widget, Sentinel Gate, etc.

**`packages/@robbie/ui/`**

- RobbieBar (used by Robbieverse apps)
- Shared components
- Design system

**`packages/@robbie/personality/`**

- Personality system (moods, Gandhi-Genghis)
- Used by Robbieverse apps + HeyShopper

**`packages/@robbieverse/api/`**

- Backend API (Python FastAPI)
- Used by all Robbieverse apps

---

## 📖 Documentation Location

**HeyShopper Docs:**

```
docs/
├── HEYSHOPPER_INDEX.md              # Master index (START HERE)
├── HEYSHOPPER_EXECUTABLE_PLAN.md    # Definitive plan
├── HEYSHOPPER_FINAL_COMPLETE_PLAN.md
├── HEYSHOPPER_UNIFIED_MASTER_PLAN.md
├── HEYSHOPPER_REVENUE_OPTIMIZATION_ENGINE.md
├── HEYSHOPPER_ROBBIECHAT_ARCHITECTURE.md
├── ROBBIEBAR_HEYSHOPPER_INTEGRATION.md
├── STATISTICAL_TESTING_REQUIREMENTS.md
├── TESTER_FEEDBACK_ANALYSIS.md
└── TESTPILOT_PRODUCTION_CODEBASE.md
```

**TestPilot Docs:**

```
docs/
├── TESTPILOT_PRODUCTION_INVENTORY.md
├── TESTPILOT_SCHEMA_DEEP_DIVE.md
└── TESTPILOT_PRODUCTION_CODEBASE.md
```

**Repo Docs:**

```
docs/
├── REPO_ORGANIZATION.md (this file)
├── MASTER_VISION.md
├── COMPLETE_EMPIRE_MAP.md
└── ROBBIEBLOCKS_ARCHITECTURE.md
```

---

## 🚀 Next Steps

### Immediate (This Week)

1. ✅ Reorganize `/apps/` into three folders (robbie-apps, public-sites, client-sites)
2. ✅ Move existing apps to correct locations
3. ✅ Update deployment scripts to reflect new structure

### Phase 0.5 (Weeks 3-4)

4. ✅ Build Robbie@TestPilot app (`robbie-apps/robbie-testpilot/`)
5. ✅ Build HeyShopper portals (`public-sites/heyshopper/`)
6. ✅ Build TestPilot standalone (`public-sites/testpilot/`)

### Future (As Needed)

7. ✅ Build AskRobbie.ai (`public-sites/askrobbie/`)
8. ✅ Build RobbieBlocks.com (`public-sites/robbieblocks/`)
9. ✅ Build LeadershipQuotes.com (`public-sites/leadershipquotes/`)

---

## 💡 Benefits of This Organization

### Clear Separation

- **Robbieverse apps** = Internal, for Allan/team
- **Public sites** = External, for customers
- **Client sites** = White-label, for partners

### Easy to Find

- All HeyShopper stuff: `apps/public-sites/heyshopper/`
- All Robbie@TestPilot stuff: `apps/robbie-apps/robbie-testpilot/`
- All docs: `docs/HEYSHOPPER_*.md`

### Scalable

- Add new Robbieverse app? → `robbie-apps/robbie-[name]/`
- Add new public site? → `public-sites/[name]/`
- Add new client? → `client-sites/[client]/`

### Shared Packages

- All apps import from `@robbieblocks/core`
- All Robbieverse apps use `@robbie/ui` (RobbieBar)
- Clean dependencies

---

## 🔄 Migration Commands

**Run these to reorganize:**

```bash
#!/bin/bash
# Reorganize apps structure

cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse/apps

# Create structure
mkdir -p robbie-apps public-sites client-sites

# Move Robbieverse apps
echo "Moving Robbieverse apps..."
mv archive-legacy/robbie-work robbie-apps/
mv archive-legacy/robbie-play robbie-apps/

# Move public sites
echo "Moving public sites..."
mv testpilot-cpg public-sites/testpilot
mv heyshopper public-sites/heyshopper

# Update package.json workspaces (if using monorepo)
# Update deployment scripts
# Update import paths

echo "✅ Reorganization complete!"
echo ""
echo "Structure:"
echo "  apps/"
echo "    ├── robbie-apps/     (Robbieverse internal)"
echo "    ├── public-sites/    (Public websites)"
echo "    ├── client-sites/    (White-label)"
echo "    └── archive-legacy/  (Old versions)"
```

---

**Want me to execute this reorganization now or wait until after you close the $88K?**

I'd recommend **waiting until after Walmart launch** (Oct 21) - don't reorganize during critical sales period! 🎯

*Context improved by Giga AI - documenting complete repository organization with three app types (Robbieverse apps, public sites, client sites), identifying four Robbieverse apps (Work, Play, Code, TestPilot), five public sites (AskRobbie, RobbieBlocks, LeadershipQuotes, TestPilot, HeyShopper), and client sites structure for white-label deployments.*
