#!/usr/bin/env python3
"""
Robbieverse Repository Migration Script
Executes the complete migration from aurora-ai-robbiverse to robbieverse
"""

import os
import shutil
import subprocess
from pathlib import Path

# Colors for output
GREEN = '\033[0;32m'
BLUE = '\033[0;34m'
RED = '\033[0;31m'
NC = '\033[0m'  # No Color

def print_step(step_num, message):
    print(f"{BLUE}Step {step_num}/10: {message}...{NC}")

def print_success(message):
    print(f"{GREEN}✅ {message}{NC}")

def print_error(message):
    print(f"{RED}❌ {message}{NC}")

# Configuration
SOURCE_REPO = Path("/home/allan/robbie_workspace/combined/aurora-ai-robbiverse")
NEW_REPO = Path("/home/allan/robbie_workspace/combined/robbieverse")

def main():
    print("🚀 Creating Robbieverse Repository")
    print("==================================\n")
    
    # Step 1: Create structure
    print_step(1, "Creating folder structure")
    NEW_REPO.mkdir(parents=True, exist_ok=True)
    os.chdir(NEW_REPO)
    
    # Create all folders
    folders = [
        "apps/robbie-apps/work",
        "apps/robbie-apps/play",
        "apps/robbie-apps/code",
        "apps/robbie-apps/testpilot",
        "apps/public-sites/askrobbie",
        "apps/public-sites/robbieblocks",
        "apps/public-sites/leadershipquotes",
        "apps/public-sites/testpilot",
        "apps/public-sites/heyshopper",
        "apps/client-sites/template",
        "apps/client-sites/fluenti",
        "packages/@robbieblocks/core",
        "packages/@robbieblocks/retail",
        "packages/@robbie/ui",
        "packages/@robbie/personality",
        "packages/@robbie/auth",
        "packages/@robbie/chat",
        "packages/@robbieverse/api",
        "packages/@robbieverse/database",
        "packages/@robbieverse/ai",
        "database/migrations",
        "database/schemas",
        "database/seeds/dev",
        "database/seeds/prod",
        "docs/heyshopper",
        "docs/architecture",
        "docs/deployment",
        "scripts/dev",
        "scripts/deployment",
        "scripts/analysis",
        "scripts/maintenance",
        ".github/workflows",
        ".vscode",
        ".cursor/rules",
    ]
    
    for folder in folders:
        Path(folder).mkdir(parents=True, exist_ok=True)
    
    # Initialize git
    subprocess.run(["git", "init"], cwd=NEW_REPO, capture_output=True)
    subprocess.run(["git", "branch", "-M", "main"], cwd=NEW_REPO, capture_output=True)
    
    print_success("Structure created")
    
    # Step 2: Copy Robbieverse apps
    print_step(2, "Copying Robbieverse apps")
    
    robbie_work = SOURCE_REPO / "apps/archive-legacy/robbie-work"
    if robbie_work.exists():
        shutil.copytree(robbie_work, NEW_REPO / "apps/robbie-apps/work", dirs_exist_ok=True)
    
    robbie_play = SOURCE_REPO / "apps/archive-legacy/robbie-play"
    if robbie_play.exists():
        shutil.copytree(robbie_play, NEW_REPO / "apps/robbie-apps/play", dirs_exist_ok=True)
    
    print_success("Robbieverse apps copied")
    
    # Step 3: Copy public sites
    print_step(3, "Copying public sites")
    
    heyshopper = SOURCE_REPO / "apps/heyshopper"
    if heyshopper.exists():
        shutil.copytree(heyshopper, NEW_REPO / "apps/public-sites/heyshopper", dirs_exist_ok=True)
    
    testpilot = SOURCE_REPO / "apps/testpilot-cpg"
    if testpilot.exists():
        shutil.copytree(testpilot, NEW_REPO / "apps/public-sites/testpilot", dirs_exist_ok=True)
    
    print_success("Public sites copied")
    
    # Step 4: Copy packages
    print_step(4, "Copying packages")
    
    packages_source = SOURCE_REPO / "packages"
    if packages_source.exists():
        for pkg_namespace in ["@robbieblocks", "@robbie", "@robbieverse"]:
            pkg_dir = packages_source / pkg_namespace
            if pkg_dir.exists():
                dest_dir = NEW_REPO / "packages" / pkg_namespace
                shutil.copytree(pkg_dir, dest_dir, dirs_exist_ok=True)
    
    print_success("Packages copied")
    
    # Step 5: Copy database
    print_step(5, "Copying database schemas")
    
    db_source = SOURCE_REPO / "database/unified-schema"
    if db_source.exists():
        for sql_file in db_source.glob("*.sql"):
            shutil.copy(sql_file, NEW_REPO / "database/schemas")
        
        # Rename for clarity
        renames = {
            "22-testpilot-production.sql": "testpilot.sql",
            "08-universal-ai-state.sql": "personality.sql",
            "03-vectors-rag.sql": "vector-storage.sql",
        }
        for old_name, new_name in renames.items():
            old_path = NEW_REPO / "database/schemas" / old_name
            if old_path.exists():
                old_path.rename(NEW_REPO / "database/schemas" / new_name)
    
    print_success("Database copied")
    
    # Step 6: Copy documentation
    print_step(6, "Copying documentation")
    
    docs_source = SOURCE_REPO / "docs"
    if docs_source.exists():
        # HeyShopper docs
        for pattern in ["HEYSHOPPER_*.md", "ROBBIEBAR_*.md", "STATISTICAL_*.md", "TESTER_*.md", "TESTPILOT_*.md"]:
            for doc in docs_source.glob(pattern):
                shutil.copy(doc, NEW_REPO / "docs/heyshopper")
        
        # Architecture docs
        arch_docs = [
            "ROBBIEBLOCKS_ARCHITECTURE.md",
            "PERSONALITY_SYNC_ARCHITECTURE.md",
            "PRIORITIES_ENGINE_ARCHITECTURE.md",
        ]
        for doc_name in arch_docs:
            doc_path = SOURCE_REPO / doc_name
            if doc_path.exists():
                shutil.copy(doc_path, NEW_REPO / "docs/architecture")
    
    # Copy vision docs
    for doc_name in ["MASTER_VISION.md", "COMPLETE_EMPIRE_MAP.md"]:
        doc_path = SOURCE_REPO / doc_name
        if doc_path.exists():
            shutil.copy(doc_path, NEW_REPO / "docs")
    
    # Copy this migration plan
    migration_plan = SOURCE_REPO / "docs/CREATE_ROBBIEVERSE_REPO.md"
    if migration_plan.exists():
        shutil.copy(migration_plan, NEW_REPO / "docs")
    
    print_success("Documentation copied")
    
    # Step 7: Copy scripts
    print_step(7, "Copying scripts")
    
    scripts_source = SOURCE_REPO / "scripts"
    if scripts_source.exists():
        for script in scripts_source.glob("analyze_*"):
            shutil.copy(script, NEW_REPO / "scripts/analysis")
    
    print_success("Scripts copied")
    
    # Step 8: Copy assets
    print_step(8, "Copying assets")
    
    assets_dir = NEW_REPO / "packages/@robbie/ui/assets"
    assets_dir.mkdir(parents=True, exist_ok=True)
    
    for avatar in SOURCE_REPO.glob("robbie-*.png"):
        shutil.copy(avatar, assets_dir)
    
    print_success("Assets copied")
    
    # Step 9: Clean everything
    print_step(9, "Cleaning (removing node_modules, dist, secrets)")
    
    patterns_to_remove = [
        "**/node_modules",
        "**/dist",
        "**/build",
        "**/.env",
        "**/.env.local",
        "**/*.pyc",
        "**/__pycache__",
    ]
    
    for pattern in patterns_to_remove:
        for item in NEW_REPO.rglob(pattern.replace("**/", "")):
            if item.is_dir():
                shutil.rmtree(item, ignore_errors=True)
            elif item.is_file():
                item.unlink(missing_ok=True)
    
    print_success("Cleaned")
    
    # Step 10: Create config files
    print_step(10, "Creating configuration files")
    
    # .gitignore
    gitignore_content = """# Dependencies
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
"""
    (NEW_REPO / ".gitignore").write_text(gitignore_content)
    
    # pnpm-workspace.yaml
    workspace_content = """packages:
  - 'apps/robbie-apps/*'
  - 'apps/public-sites/*'
  - 'apps/client-sites/*'
  - 'packages/@robbieblocks/*'
  - 'packages/@robbie/*'
  - 'packages/@robbieverse/*'
"""
    (NEW_REPO / "pnpm-workspace.yaml").write_text(workspace_content)
    
    # turbo.json
    turbo_content = """{
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
"""
    (NEW_REPO / "turbo.json").write_text(turbo_content)
    
    # .env.example
    env_example = """# Application
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
"""
    (NEW_REPO / ".env.example").write_text(env_example)
    
    # README.md
    readme = """# Robbieverse

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
"""
    (NEW_REPO / "README.md").write_text(readme)
    
    # package.json
    package_json = """{
  "name": "robbieverse",
  "version": "1.0.0",
  "private": true,
  "description": "AI-powered platform for business automation and intelligent workflows",
  "author": "Allan Peretz <allan@testpilotcpg.com>",
  "license": "MIT",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \\"**/*.{ts,tsx,js,jsx,json,md}\\"",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "prettier": "^3.0.0"
  },
  "packageManager": "pnpm@8.10.0"
}
"""
    (NEW_REPO / "package.json").write_text(package_json)
    
    print_success("Configuration files created")
    
    print()
    print(f"{GREEN}========================================{NC}")
    print(f"{GREEN}✅ ROBBIEVERSE REPO CREATED SUCCESSFULLY!{NC}")
    print(f"{GREEN}========================================{NC}")
    print()
    print("Next steps:")
    print(f"1. cd {NEW_REPO}")
    print("2. pnpm install")
    print("3. Create .env from .env.example")
    print("4. pnpm dev")
    print()
    print("Happy coding! 🚀")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print_error(f"Migration failed: {e}")
        raise


