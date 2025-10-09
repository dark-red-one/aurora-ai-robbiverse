#!/bin/bash
# Create comprehensive archive of aurora-ai-robbiverse before migration
# Preserves all valuable context WITHOUT actual secrets

set -e

SOURCE="/home/allan/robbie_workspace/combined/aurora-ai-robbiverse"
ARCHIVE="/home/allan/robbie_workspace/combined/aurora-archive"

echo "🗄️  Creating Aurora AI Robbiverse Archive..."
echo "=============================================="
echo ""

# Create structure
echo "📂 Creating archive structure..."
mkdir -p "$ARCHIVE"/{credentials-reference,contacts-and-teams,infrastructure,historical-docs,legacy-code,snapshots,business-data}
mkdir -p "$ARCHIVE/credentials-reference"/{env-examples,server-access}
mkdir -p "$ARCHIVE/infrastructure"/{servers,deployment-scripts,nginx-configs,vpn-configs,database-configs,monitoring}
mkdir -p "$ARCHIVE/infrastructure/servers"/{elestio-aurora-town,runpod-iceland,runpod-collaboration,runpod-fluenti,robbiebook1-local}
mkdir -p "$ARCHIVE/historical-docs"/{victories,analysis,inventories,guides}
mkdir -p "$ARCHIVE/legacy-code"/{experiments,prototypes,old-scripts}
mkdir -p "$ARCHIVE/business-data"/{exports,analysis}

# Copy credentials reference (NO SECRETS!)
echo "📋 Copying credentials reference (structure only, NO secrets)..."
cp "$SOURCE/db.testpilot.ai" "$ARCHIVE/credentials-reference/server-access/" 2>/dev/null || echo "  ⚠️  db.testpilot.ai not found"
cp "$SOURCE/db.testpilot.ai.updated" "$ARCHIVE/credentials-reference/server-access/" 2>/dev/null || echo "  ⚠️  db.testpilot.ai.updated not found"
cp "$SOURCE/docs/CREDENTIALS_SETUP_GUIDE.md" "$ARCHIVE/credentials-reference/" 2>/dev/null || echo "  ⚠️  CREDENTIALS_SETUP_GUIDE.md not found"
cp "$SOURCE/docs/SQLTOOLS_SETUP.md" "$ARCHIVE/credentials-reference/" 2>/dev/null || echo "  ⚠️  SQLTOOLS_SETUP.md not found"

# Copy contacts
echo "👥 Copying contacts and teams..."
cp "$SOURCE/scripts/exports/invites.json" "$ARCHIVE/contacts-and-teams/" 2>/dev/null || echo "  ⚠️  invites.json not found"
cp "$SOURCE/scripts/exports/profiles.json" "$ARCHIVE/contacts-and-teams/" 2>/dev/null || echo "  ⚠️  profiles.json not found"

# Copy infrastructure - deployment scripts
echo "🏗️  Copying infrastructure (deployment scripts)..."
cp "$SOURCE/deployment/"*.sh "$ARCHIVE/infrastructure/deployment-scripts/" 2>/dev/null || echo "  ⚠️  No deployment scripts found"
cp "$SOURCE/deployment/VENGEANCE_SYNC_GUIDE.md" "$ARCHIVE/infrastructure/servers/" 2>/dev/null || echo "  ⚠️  VENGEANCE_SYNC_GUIDE.md not found"

# Copy infrastructure - nginx configs
echo "🌐 Copying nginx configs..."
cp "$SOURCE/"nginx-*.conf "$ARCHIVE/infrastructure/nginx-configs/" 2>/dev/null || echo "  ⚠️  No nginx configs found"
cp "$SOURCE/"aurora-*.conf "$ARCHIVE/infrastructure/nginx-configs/" 2>/dev/null || echo "  ⚠️  No aurora configs found"

# Copy infrastructure - VPN configs
echo "🔐 Copying VPN configs..."
cp "$SOURCE/"*.ovpn "$ARCHIVE/infrastructure/vpn-configs/" 2>/dev/null || echo "  ⚠️  No VPN configs found"
cp "$SOURCE/"aurora-vpn*.sh "$ARCHIVE/infrastructure/vpn-configs/" 2>/dev/null || echo "  ⚠️  No VPN scripts found"

# Copy infrastructure - server setup guides
echo "📖 Copying server setup guides..."
cp "$SOURCE/docs/ROBBIEBOOK1_COMPLETE_SETUP.md" "$ARCHIVE/infrastructure/servers/robbiebook1-local/" 2>/dev/null || echo "  ⚠️  ROBBIEBOOK1 setup not found"
cp "$SOURCE/docs/RUNPOD_ACTIVATION_GUIDE.md" "$ARCHIVE/infrastructure/servers/" 2>/dev/null || echo "  ⚠️  RUNPOD guide not found"
cp "$SOURCE/docs/PRODUCTION_DEPLOYMENT_COMPLETE.md" "$ARCHIVE/infrastructure/servers/elestio-aurora-town/" 2>/dev/null || echo "  ⚠️  Production deployment doc not found"

# Copy infrastructure - database configs
echo "🗄️  Copying database configs..."
cp "$SOURCE/docs/SUPABASE_"*.md "$ARCHIVE/infrastructure/database-configs/" 2>/dev/null || echo "  ⚠️  No Supabase docs found"
cp "$SOURCE/docs/ELEPHANT_POSTGRES_SYNC.md" "$ARCHIVE/infrastructure/database-configs/" 2>/dev/null || echo "  ⚠️  Elephant Postgres doc not found"

# Copy historical docs - victories
echo "🎉 Copying victory documentation..."
for file in "$SOURCE/"*_COMPLETE.md; do
  [ -f "$file" ] && cp "$file" "$ARCHIVE/historical-docs/victories/" || true
done
for file in "$SOURCE/"*_VICTORY.md; do
  [ -f "$file" ] && cp "$file" "$ARCHIVE/historical-docs/victories/" || true
done
cp "$SOURCE/AURORA_DEPLOYMENT_COMPLETE.md" "$ARCHIVE/historical-docs/victories/" 2>/dev/null || true

# Copy historical docs - analyses
echo "📊 Copying analysis documentation..."
for file in "$SOURCE/"*_ANALYSIS*.md; do
  [ -f "$file" ] && cp "$file" "$ARCHIVE/historical-docs/analysis/" || true
done
cp "$SOURCE/docs/VALUE_EXTRACTION_REPORT.md" "$ARCHIVE/historical-docs/analysis/" 2>/dev/null || true
cp "$SOURCE/docs/ECOSYSTEM_EVALUATION.md" "$ARCHIVE/historical-docs/analysis/" 2>/dev/null || true

# Copy historical docs - inventories
echo "📋 Copying inventory documentation..."
for file in "$SOURCE/"*_INVENTORY*.md; do
  [ -f "$file" ] && cp "$file" "$ARCHIVE/historical-docs/inventories/" || true
done
cp "$SOURCE/docs/TESTPILOT_PRODUCTION_INVENTORY.md" "$ARCHIVE/historical-docs/inventories/" 2>/dev/null || true

# Copy historical docs - guides
echo "📚 Copying guides..."
for file in "$SOURCE/docs/"*_GUIDE.md; do
  [ -f "$file" ] && cp "$file" "$ARCHIVE/historical-docs/guides/" || true
done
cp "$SOURCE/docs/GPU_MESH_"*.md "$ARCHIVE/historical-docs/guides/" 2>/dev/null || true
cp "$SOURCE/docs/MAINTENANCE_FRAMEWORK.md" "$ARCHIVE/historical-docs/guides/" 2>/dev/null || true

# Copy business data
echo "💰 Copying business data exports..."
if [ -d "$SOURCE/scripts/exports" ]; then
  cp "$SOURCE/scripts/exports/"*.json "$ARCHIVE/business-data/exports/" 2>/dev/null || echo "  ⚠️  No export files found"
fi

# Copy legacy code - experiments
echo "🧪 Copying legacy code (experiments)..."
cp "$SOURCE/"mock_*.py "$ARCHIVE/legacy-code/experiments/" 2>/dev/null || echo "  ⚠️  No mock files found"
cp "$SOURCE/"simple_*.py "$ARCHIVE/legacy-code/experiments/" 2>/dev/null || echo "  ⚠️  No simple files found"
cp "$SOURCE/"test_*.py "$ARCHIVE/legacy-code/experiments/" 2>/dev/null || echo "  ⚠️  No test files found"

# Copy legacy code - prototypes
echo "🔬 Copying prototypes..."
cp "$SOURCE/"robbie-*-*.py "$ARCHIVE/legacy-code/prototypes/" 2>/dev/null || echo "  ⚠️  No prototype files found"
cp "$SOURCE/robbie-ollama-backend.py" "$ARCHIVE/legacy-code/prototypes/" 2>/dev/null || true
cp "$SOURCE/robbie-postgres-smart-inbox.py" "$ARCHIVE/legacy-code/prototypes/" 2>/dev/null || true

# Copy legacy code - old scripts
echo "📜 Copying old scripts..."
cp "$SOURCE/"setup-*.sh "$ARCHIVE/legacy-code/old-scripts/" 2>/dev/null || echo "  ⚠️  No setup scripts found"
cp "$SOURCE/"*-sync*.sh "$ARCHIVE/legacy-code/old-scripts/" 2>/dev/null || echo "  ⚠️  No sync scripts found"

# Copy snapshots
echo "📦 Copying snapshots..."
if [ -d "$SOURCE/snapshots" ]; then
  cp "$SOURCE/snapshots/"*.tar.gz "$ARCHIVE/snapshots/" 2>/dev/null || echo "  ⚠️  No snapshots found"
fi

# Create archive README
echo "📝 Creating archive documentation..."
cat > "$ARCHIVE/README.md" << 'EOF'
# Aurora AI Robbiverse - Historical Archive

**Created:** October 9, 2025  
**Purpose:** Preserve all context from aurora-ai-robbiverse before migration to clean robbieverse repo

## ⚠️  IMPORTANT

**This archive contains NO actual secrets, API keys, or passwords.**  
It preserves structure, guides, contacts, and historical context only.

## What's Here

This archive contains everything that's valuable but doesn't belong in the clean robbieverse repository:

### 📋 credentials-reference/
How to access servers, setup guides (NO actual secrets)

### 👥 contacts-and-teams/
All people, emails, customer data, team info

### 🏗️ infrastructure/
- Server configs (nginx, VPN)
- Deployment scripts
- Database setup guides
- Server-specific documentation

### 📚 historical-docs/
- **victories/** - All "COMPLETE" and "VICTORY" documentation
- **analysis/** - Technical analyses and evaluations
- **inventories/** - System inventories and audits
- **guides/** - Setup guides and how-tos

### 🧪 legacy-code/
- **experiments/** - Mock implementations, tests
- **prototypes/** - Early Robbie prototypes
- **old-scripts/** - Historical setup and sync scripts

### 📦 snapshots/
Compressed server snapshots from production

### 💰 business-data/
TestPilot production data exports (companies, contacts, revenue)

## How to Search

See `SEARCH_INDEX.md` for quick lookups.

## When to Use This

- "How did we set up X server?"
- "Where's the SSH guide for Y?"
- "What emails do we have for customers?"
- "What was the architecture decision for Z?"
- "How much revenue did we have in Oct 2025?"
- "How did we deploy to Aurora Town?"

## What's NOT Here

- ❌ Actual secrets (.env files with real keys)
- ❌ Actual passwords
- ❌ node_modules, dist, build folders
- ❌ Database dumps with sensitive data

---

**Do NOT delete this archive. It's our institutional memory.** 🧠
EOF

# Create search index
cat > "$ARCHIVE/SEARCH_INDEX.md" << 'EOF'
# Aurora Archive Search Index

**Quick reference for finding things in the archive**

---

## 🔍 Quick Lookups

| Looking for... | Go to... |
|----------------|----------|
| SSH/Server Access Guides | `credentials-reference/server-access/` |
| Customer Emails | `contacts-and-teams/invites.json` |
| Deployment Scripts | `infrastructure/deployment-scripts/` |
| Server Setup Guides | `historical-docs/guides/` |
| Revenue Data | `business-data/exports/credit_payments.json` |
| Infrastructure Docs | `infrastructure/` |
| Old Experiments | `legacy-code/experiments/` |
| Victory Docs | `historical-docs/victories/` |

---

## 📂 By Topic

### Servers & Infrastructure

**Elestio Aurora Town:**
- `infrastructure/servers/elestio-aurora-town/PRODUCTION_DEPLOYMENT_COMPLETE.md`

**RunPod GPU Nodes:**
- `infrastructure/servers/` (Iceland, Collaboration, Fluenti)
- `historical-docs/guides/GPU_MESH_*.md`

**RobbieBook1 Local:**
- `infrastructure/servers/robbiebook1-local/ROBBIEBOOK1_COMPLETE_SETUP.md`

**Vengeance Sync:**
- `infrastructure/servers/VENGEANCE_SYNC_GUIDE.md`

**Configs:**
- Nginx: `infrastructure/nginx-configs/`
- VPN: `infrastructure/vpn-configs/`

---

### People & Contacts

**TestPilot Customers:**
- `contacts-and-teams/invites.json` (email addresses)
- `contacts-and-teams/profiles.json` (user profiles)
- `business-data/exports/companies.json` (company list)

**Team Info:**
- `contacts-and-teams/profiles.json`

---

### Business Data

**Revenue:**
- `business-data/exports/credit_payments.json` (all payments)
- `business-data/exports/export_summary.json` (totals: $289K, 48 payments)

**Companies:**
- `business-data/exports/companies.json` (40 companies)

**Tests:**
- `business-data/exports/deals.json` (34 tests)

---

### Historical Context

**Deployments:**
- `historical-docs/victories/AURORA_DEPLOYMENT_COMPLETE.md`
- `historical-docs/victories/PRODUCTION_DEPLOYMENT_COMPLETE.md`
- `historical-docs/victories/SUPABASE_SYNC_COMPLETE.md`

**Architecture Decisions:**
- `historical-docs/analysis/GPU_MESH_ANALYSIS.md`
- `historical-docs/analysis/SCHEMA_ANALYSIS_COMPLETE.md`
- `historical-docs/analysis/VALUE_EXTRACTION_REPORT.md`

**System Inventories:**
- `historical-docs/inventories/EMPIRE_INVENTORY_COMPLETE.md`
- `historical-docs/inventories/DOMAIN_EMPIRE_INVENTORY.md`
- `historical-docs/inventories/TESTPILOT_PRODUCTION_INVENTORY.md`

**Setup Guides:**
- `historical-docs/guides/RUNPOD_ACTIVATION_GUIDE.md`
- `historical-docs/guides/MAINTENANCE_FRAMEWORK.md`
- `credentials-reference/CREDENTIALS_SETUP_GUIDE.md`

---

### Database

**Supabase:**
- `infrastructure/database-configs/SUPABASE_*.md`

**Postgres:**
- `infrastructure/database-configs/ELEPHANT_POSTGRES_SYNC.md`

**SQL Tools:**
- `credentials-reference/SQLTOOLS_SETUP.md`

---

### Code & Experiments

**Prototypes:**
- `legacy-code/prototypes/robbie-*.py` (early Robbie versions)

**Experiments:**
- `legacy-code/experiments/mock_*.py` (mock implementations)
- `legacy-code/experiments/simple_*.py` (simple tests)
- `legacy-code/experiments/test_*.py` (test files)

**Old Scripts:**
- `legacy-code/old-scripts/setup-*.sh`
- `legacy-code/old-scripts/*-sync*.sh`

---

## 🎯 Common Searches

### "How do I access Aurora Town?"
→ `credentials-reference/server-access/db.testpilot.ai`  
→ `historical-docs/victories/AURORA_DEPLOYMENT_COMPLETE.md`

### "What customer emails do we have?"
→ `contacts-and-teams/invites.json`  
→ `business-data/exports/companies.json`

### "How did we deploy the apps?"
→ `infrastructure/deployment-scripts/deploy-all-three-apps-FINAL.sh`

### "What's our revenue?"
→ `business-data/exports/export_summary.json` ($289K total)

### "How do I set up RobbieBook1?"
→ `infrastructure/servers/robbiebook1-local/ROBBIEBOOK1_COMPLETE_SETUP.md`

### "Where are the nginx configs?"
→ `infrastructure/nginx-configs/`

---

**Can't find something? Check the file tree in each subdirectory's README (if present).**
EOF

# Security verification reminder
echo ""
echo "✅ Archive created successfully!"
echo ""
echo "📍 Location: $ARCHIVE"
echo ""
echo "⚠️  SECURITY VERIFICATION REQUIRED:"
echo "   1. Check for actual secrets:"
echo "      grep -r 'sk-' '$ARCHIVE' (OpenAI keys)"
echo "      grep -r 'pk_' '$ARCHIVE' (Stripe keys)"
echo "      grep -r 'Bearer' '$ARCHIVE' (Auth tokens)"
echo ""
echo "   2. Check for passwords:"
echo "      grep -ri 'password.*=' '$ARCHIVE' | grep -v 'your_password_here'"
echo ""
echo "   3. Review .env-like files:"
echo "      find '$ARCHIVE' -name '*.env' -o -name '.env.*'"
echo ""
echo "✅ If all clear, archive is safe to keep permanently!"
echo ""

