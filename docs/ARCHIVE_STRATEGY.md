# Aurora AI Robbiverse - Archive Strategy

**Date:** October 9, 2025  
**Purpose:** Preserve all historical context, credentials references, and valuable "messy" content before switching to new `robbieverse` repo

---

## 🎯 Archive Goals

**What to preserve:**

- ✅ All credentials reference files (no actual secrets, just structure/examples)
- ✅ All email addresses, contacts, team info
- ✅ Historical documentation and decision logs
- ✅ Server configs and infrastructure notes
- ✅ Deployment guides and runbooks
- ✅ All "messy but valuable" context that won't fit clean repo

**What NOT to archive:**

- ❌ Actual secrets (.env files with real keys)
- ❌ node_modules, dist, build folders
- ❌ Database dumps with real data
- ❌ Truly obsolete/broken code

---

## 📂 Archive Structure

Create: `/home/allan/robbie_workspace/combined/aurora-archive/`

```
aurora-archive/
│
├── README.md                          # What's here, why, how to search
│
├── credentials-reference/             # Reference structures (NO REAL SECRETS!)
│   ├── env-examples/
│   │   ├── elestio-aurora.env.example
│   │   ├── runpod-gpu.env.example
│   │   ├── supabase.env.example
│   │   └── stripe.env.example
│   ├── server-access/
│   │   ├── aurora-town-ssh-guide.md
│   │   ├── robbiebook1-access.md
│   │   ├── iceland-gpu-access.md
│   │   └── vengeance-sync-guide.md
│   └── api-keys-inventory.md         # What keys exist WHERE (not actual keys)
│
├── contacts-and-teams/                # All people, emails, roles
│   ├── testpilot-contacts.csv
│   ├── testpilot-team.md
│   ├── invites.json
│   ├── profiles.json
│   ├── customer-emails.md
│   └── partner-contacts.md
│
├── infrastructure/                    # Server configs, deployment history
│   ├── servers/
│   │   ├── elestio-aurora-town/
│   │   ├── runpod-iceland/
│   │   ├── runpod-collaboration/
│   │   ├── runpod-fluenti/
│   │   └── robbiebook1-local/
│   ├── deployment-scripts/
│   │   ├── deploy-all-three-apps-FINAL.sh
│   │   ├── nginx-configs/
│   │   └── vpn-configs/
│   ├── database-configs/
│   │   ├── postgres-setup-guides.md
│   │   ├── supabase-sync-setup.md
│   │   └── vector-extension-setup.md
│   └── monitoring/
│       ├── health-check-scripts.sh
│       └── maintenance-procedures.md
│
├── historical-docs/                   # All the "victory" and "complete" docs
│   ├── victories/
│   │   ├── CONSOLIDATION_VICTORY.md
│   │   ├── RESTRUCTURE_COMPLETE.md
│   │   ├── SUPABASE_SYNC_COMPLETE.md
│   │   ├── AURORA_DEPLOYMENT_COMPLETE.md
│   │   └── PRODUCTION_DEPLOYMENT_COMPLETE.md
│   ├── analysis/
│   │   ├── GPU_MESH_ANALYSIS.md
│   │   ├── SCHEMA_ANALYSIS_COMPLETE.md
│   │   ├── VALUE_EXTRACTION_REPORT.md
│   │   └── ECOSYSTEM_EVALUATION.md
│   ├── inventories/
│   │   ├── EMPIRE_INVENTORY_COMPLETE.md
│   │   ├── DOMAIN_EMPIRE_INVENTORY.md
│   │   ├── SCHEMA_INVENTORY_COMPLETE.md
│   │   └── TESTPILOT_PRODUCTION_INVENTORY.md
│   └── guides/
│       ├── RUNPOD_ACTIVATION_GUIDE.md
│       ├── ROBBIEBOOK1_COMPLETE_SETUP.md
│       ├── SQLTOOLS_SETUP.md
│       └── CREDENTIALS_SETUP_GUIDE.md
│
├── legacy-code/                       # Old but potentially useful code
│   ├── experiments/
│   │   ├── mock_ollama.py
│   │   ├── simple_ollama_mock.py
│   │   ├── simple_websocket_test.py
│   │   └── test_*.py files
│   ├── prototypes/
│   │   ├── robbie-simple-attention.py
│   │   ├── robbie-conversation-analyzer.py
│   │   └── robbie-summary-dashboard.py
│   └── old-scripts/
│       ├── setup-*.sh files
│       ├── sync-*.sh files
│       └── maintenance-*.sh files
│
├── snapshots/                         # Compressed server snapshots
│   ├── iceland-workspace-20251004.tar.gz
│   ├── aurora-town-live-20251004.tar.gz
│   └── README.md (what each snapshot contains)
│
├── business-data/                     # TestPilot production data exports
│   ├── exports/
│   │   ├── companies.json
│   │   ├── contacts.json
│   │   ├── deals.json
│   │   ├── credit_payments.json
│   │   ├── export_summary.json
│   │   └── README.md (export date, what's included)
│   └── analysis/
│       ├── revenue-analysis.md
│       ├── customer-segmentation.md
│       └── pipeline-snapshot-oct2025.md
│
└── SEARCH_INDEX.md                    # How to find things in this archive
```

---

## 📋 What to Archive from Current Repo

### 1. Credentials Reference (NO ACTUAL SECRETS!)

**Files to copy:**

```bash
# From root
db.testpilot.ai                        # → credentials-reference/server-access/
db.testpilot.ai.updated                # → credentials-reference/server-access/

# From docs
docs/CREDENTIALS_SETUP_GUIDE.md        # → infrastructure/
docs/ROBBIEBOOK1_COMPLETE_SETUP.md     # → infrastructure/servers/
docs/RUNPOD_ACTIVATION_GUIDE.md        # → infrastructure/servers/

# From deployment
deployment/VENGEANCE_SYNC_GUIDE.md     # → infrastructure/servers/
deployment/*.conf files                 # → infrastructure/vpn-configs/
deployment/*.sh scripts                 # → infrastructure/deployment-scripts/
```

### 2. Contacts & People

**Files to copy:**

```bash
scripts/exports/invites.json           # → contacts-and-teams/
scripts/exports/profiles.json          # → contacts-and-teams/
packages/@robbie/utils/universalInbox.js  # Extract emails → contacts-and-teams/
packages/@robbie/utils/teamPollingSystem.js  # Extract emails → contacts-and-teams/

# Create new file: contacts-and-teams/all-emails-inventory.md
# List ALL email addresses found across the codebase with context
```

### 3. Infrastructure & Deployment

**Everything in:**

```bash
deployment/                            # → infrastructure/deployment-scripts/
*.conf files (nginx, vpn)              # → infrastructure/nginx-configs/
*.sh setup scripts                     # → infrastructure/deployment-scripts/
docs/*_SETUP.md                        # → infrastructure/
docs/*_DEPLOYMENT*.md                  # → infrastructure/
```

### 4. Historical Documentation

**All "complete" and "victory" docs:**

```bash
*_COMPLETE.md                          # → historical-docs/victories/
*_VICTORY.md                           # → historical-docs/victories/
*_INVENTORY*.md                        # → historical-docs/inventories/
*_ANALYSIS*.md                         # → historical-docs/analysis/
*_GUIDE.md                             # → historical-docs/guides/
```

### 5. Business Data

**TestPilot production exports:**

```bash
scripts/exports/*.json                 # → business-data/exports/
# Document what's in each file, when exported, revenue totals
```

### 6. Legacy Code

**Experimental/prototype code:**

```bash
mock_*.py                              # → legacy-code/experiments/
simple_*.py                            # → legacy-code/experiments/
test_*.py (root level)                 # → legacy-code/experiments/
robbie-*-attention.py                  # → legacy-code/prototypes/
robbie-conversation-*.py               # → legacy-code/prototypes/
```

### 7. Snapshots

**Existing snapshots:**

```bash
snapshots/*.tar.gz                     # → snapshots/
# Add README explaining each snapshot
```

---

## 🔍 SEARCH_INDEX.md Structure

```markdown
# Aurora Archive Search Index

## Quick Lookups

### "Where are the SSH credentials?"
→ `credentials-reference/server-access/`

### "Where are customer emails?"
→ `contacts-and-teams/` + `business-data/exports/`

### "How did we deploy to Aurora Town?"
→ `infrastructure/deployment-scripts/` + `historical-docs/victories/AURORA_DEPLOYMENT_COMPLETE.md`

### "What servers do we have?"
→ `infrastructure/servers/` (one folder per server)

### "Where's the TestPilot production data?"
→ `business-data/exports/`

### "How do I access Elestio?"
→ `infrastructure/servers/elestio-aurora-town/`

### "What emails exist in the system?"
→ `contacts-and-teams/all-emails-inventory.md`

## Full File Index

[Alphabetical list of every file with short description]
```

---

## 🚀 Archive Creation Script

**Create:** `scripts/create-aurora-archive.sh`

```bash
#!/bin/bash
# Create comprehensive archive of aurora-ai-robbiverse before migration

set -e

SOURCE="/home/allan/robbie_workspace/combined/aurora-ai-robbiverse"
ARCHIVE="/home/allan/robbie_workspace/combined/aurora-archive"

echo "🗄️ Creating Aurora AI Robbiverse Archive..."

# Create structure
mkdir -p "$ARCHIVE"/{credentials-reference,contacts-and-teams,infrastructure,historical-docs,legacy-code,snapshots,business-data}
mkdir -p "$ARCHIVE/credentials-reference"/{env-examples,server-access}
mkdir -p "$ARCHIVE/infrastructure"/{servers,deployment-scripts,database-configs,monitoring}
mkdir -p "$ARCHIVE/historical-docs"/{victories,analysis,inventories,guides}
mkdir -p "$ARCHIVE/legacy-code"/{experiments,prototypes,old-scripts}

# Copy credentials reference (NO SECRETS!)
echo "📋 Copying credentials reference..."
cp "$SOURCE/db.testpilot.ai" "$ARCHIVE/credentials-reference/server-access/" 2>/dev/null || true
cp "$SOURCE/docs/CREDENTIALS_SETUP_GUIDE.md" "$ARCHIVE/credentials-reference/" 2>/dev/null || true

# Copy contacts
echo "👥 Copying contacts and teams..."
cp "$SOURCE/scripts/exports/invites.json" "$ARCHIVE/contacts-and-teams/" 2>/dev/null || true
cp "$SOURCE/scripts/exports/profiles.json" "$ARCHIVE/contacts-and-teams/" 2>/dev/null || true

# Copy infrastructure
echo "🏗️ Copying infrastructure..."
cp -r "$SOURCE/deployment/"*.sh "$ARCHIVE/infrastructure/deployment-scripts/" 2>/dev/null || true
cp "$SOURCE/"*.conf "$ARCHIVE/infrastructure/" 2>/dev/null || true

# Copy historical docs
echo "📚 Copying historical documentation..."
cp "$SOURCE/"*_COMPLETE.md "$ARCHIVE/historical-docs/victories/" 2>/dev/null || true
cp "$SOURCE/"*_VICTORY.md "$ARCHIVE/historical-docs/victories/" 2>/dev/null || true
cp "$SOURCE/"*_INVENTORY*.md "$ARCHIVE/historical-docs/inventories/" 2>/dev/null || true
cp "$SOURCE/"*_ANALYSIS*.md "$ARCHIVE/historical-docs/analysis/" 2>/dev/null || true
cp "$SOURCE/docs/"*_GUIDE.md "$ARCHIVE/historical-docs/guides/" 2>/dev/null || true

# Copy business data
echo "💰 Copying business data..."
cp -r "$SOURCE/scripts/exports/"*.json "$ARCHIVE/business-data/exports/" 2>/dev/null || true

# Copy legacy code
echo "🧪 Copying legacy code..."
cp "$SOURCE/"mock_*.py "$ARCHIVE/legacy-code/experiments/" 2>/dev/null || true
cp "$SOURCE/"simple_*.py "$ARCHIVE/legacy-code/experiments/" 2>/dev/null || true
cp "$SOURCE/"test_*.py "$ARCHIVE/legacy-code/experiments/" 2>/dev/null || true
cp "$SOURCE/"robbie-*-*.py "$ARCHIVE/legacy-code/prototypes/" 2>/dev/null || true

# Copy snapshots
echo "📦 Copying snapshots..."
cp "$SOURCE/snapshots/"*.tar.gz "$ARCHIVE/snapshots/" 2>/dev/null || true

# Create README
cat > "$ARCHIVE/README.md" << 'EOF'
# Aurora AI Robbiverse - Historical Archive

**Created:** October 9, 2025  
**Purpose:** Preserve all context from aurora-ai-robbiverse before migration to clean robbieverse repo

## What's Here

This archive contains everything that's valuable but doesn't belong in the clean robbieverse repository:

- **credentials-reference/** - How to access servers (NO actual secrets)
- **contacts-and-teams/** - All people, emails, customer data
- **infrastructure/** - Server configs, deployment scripts, setup guides
- **historical-docs/** - All "victory" docs, analyses, inventories, guides
- **legacy-code/** - Experiments, prototypes, old scripts
- **snapshots/** - Compressed server snapshots from production
- **business-data/** - TestPilot production data exports

## How to Search

See `SEARCH_INDEX.md` for quick lookups.

## Critical Notes

1. **NO REAL SECRETS** - All actual API keys, passwords removed
2. **Reference Only** - Shows structure, not actual credentials
3. **Historical Context** - Decisions, deployments, server evolution
4. **Business Intelligence** - Customer data, revenue, contacts

## When to Use This

- "How did we set up X server?"
- "Where's the SSH guide for Y?"
- "What emails do we have for customers?"
- "What was the architecture decision for Z?"
- "How much revenue did we have in Oct 2025?"

---

**Do NOT delete this archive. It's our institutional memory.**
EOF

# Create search index
cat > "$ARCHIVE/SEARCH_INDEX.md" << 'EOF'
# Aurora Archive Search Index

## Quick Reference

| Looking for... | Go to... |
|----------------|----------|
| SSH/Server Access | `credentials-reference/server-access/` |
| Customer Emails | `contacts-and-teams/` |
| Deployment Scripts | `infrastructure/deployment-scripts/` |
| Server Setup Guides | `historical-docs/guides/` |
| Revenue Data | `business-data/exports/` |
| Infrastructure Docs | `infrastructure/` |
| Old Experiments | `legacy-code/experiments/` |

## By Topic

### Servers & Infrastructure
- Elestio Aurora Town: `infrastructure/servers/elestio-aurora-town/`
- RunPod Iceland GPU: `infrastructure/servers/runpod-iceland/`
- RobbieBook1 Local: `infrastructure/servers/robbiebook1-local/`
- VPN Configs: `infrastructure/vpn-configs/`

### People & Contacts
- TestPilot Contacts: `contacts-and-teams/testpilot-contacts.csv`
- Customer Emails: `contacts-and-teams/invites.json`
- Team Info: `contacts-and-teams/profiles.json`

### Business Data
- Revenue: `business-data/exports/credit_payments.json`
- Companies: `business-data/exports/companies.json`
- Export Summary: `business-data/exports/export_summary.json`

### Historical Context
- Deployment History: `historical-docs/victories/`
- Architecture Decisions: `historical-docs/analysis/`
- Setup Guides: `historical-docs/guides/`
EOF

echo ""
echo "✅ Archive created successfully!"
echo "📍 Location: $ARCHIVE"
echo ""
echo "⚠️  IMPORTANT: Verify no actual secrets were copied!"
echo "   Run: grep -r 'sk-' '$ARCHIVE' (should be empty)"
echo "   Run: grep -r 'password' '$ARCHIVE' (review results)"
```

---

## ✅ Verification Checklist

After creating archive:

- [ ] NO actual .env files copied
- [ ] NO actual API keys (search for "sk-", "pk_", "Bearer")
- [ ] NO actual passwords (search for actual password strings)
- [ ] All contacts/emails preserved
- [ ] All deployment guides preserved
- [ ] All infrastructure docs preserved
- [ ] All business data exported
- [ ] README and SEARCH_INDEX created

---

## 🎯 When to Create Archive

**Timing:** Create archive BEFORE running robbieverse migration

**Steps:**

1. Run `scripts/create-aurora-archive.sh`
2. Verify no secrets included
3. Test search index (find a few things)
4. **THEN** run robbieverse migration
5. Keep `aurora-archive/` permanently

---

**This archive is our institutional memory. Never delete it.** 🧠

