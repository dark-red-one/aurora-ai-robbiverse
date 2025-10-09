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
cp "$SOURCE_REPO/COMPLETE_EMPIRE_MAP.md" docs/EMPIRE.md 2>/dev/null
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

# .env.example
cat > .env.example << 'EOF'
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/robbieverse
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=robbieverse
POSTGRES_USER=robbie
POSTGRES_PASSWORD=your_password_here

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI
OPENAI_API_KEY=sk-your_openai_key_here

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Email
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
FROM_EMAIL=robbie@heyshopper.com
EOF

# README.md
cat > README.md << 'EOF'
# Robbieverse

**AI-powered platform for business automation, personality-driven assistance, and intelligent workflows.**

## 🚀 Products

- **Robbie@Work** - CRM & pipeline management
- **Robbie@Play** - Entertainment & chat
- **HeyShopper** - AI-powered shopper testing
- **TestPilot** - Professional product testing

## ⚡ Quick Start

```bash
# Install dependencies
pnpm install

# Start all apps
pnpm dev

# Build all apps
pnpm build
```

## 📚 Documentation

See `/docs` for complete documentation.

## 📄 License

MIT License - Built with ❤️ by Allan Peretz
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

