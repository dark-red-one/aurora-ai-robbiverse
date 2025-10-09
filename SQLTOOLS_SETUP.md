# 🗄️ SQLTools Setup - Quick Start

## What We Just Built

SQL database access directly in Cursor! Now I (the AI) can query your database to make better decisions.

## Install Extensions (You Need To Do This)

Open Cursor and install these two extensions:

### 1. SQLTools (Base Extension)
```
Extension ID: mtxr.sqltools
```

**How to install:**
1. Press `Ctrl+Shift+X` (Extensions view)
2. Search for: **SQLTools**
3. Click **Install** on the one by "Matheus Teixeira"

### 2. SQLTools PostgreSQL Driver
```
Extension ID: mtxr.sqltools-driver-pg
```

**How to install:**
1. Still in Extensions view
2. Search for: **SQLTools PostgreSQL**
3. Click **Install** on "PostgreSQL/Cockroach Driver for SQLTools"

## That's It!

Once installed, you'll see a **database icon** in the Cursor sidebar. Click it to:
- Connect to "Local Robbieverse DB"
- Browse your tables (companies, tests, credit_payments, etc.)
- Run queries from `.vscode/sql-queries/`

## Quick Test

1. Click the **database icon** in sidebar
2. Click **"Local Robbieverse DB"** → **Connect**
3. Open `.vscode/sql-queries/quick-stats.sql`
4. Press `Ctrl+E Ctrl+E` to run
5. See results: 40 companies, 33 tests, etc.

## What's Configured

### Database Connections (Ready to Use)

**Local Robbieverse DB:**
- Server: localhost:5432
- Database: robbieverse
- Username: robbie
- Password: robbie_dev_2025
- Status: ✅ Ready (Docker container running)

**Supabase TestPilot:**
- Server: aws-0-us-west-1.pooler.supabase.com
- Database: postgres
- Status: ⚠️ Needs `SUPABASE_DB_PASSWORD` in `.env`

### Saved Queries (5)

All in `.vscode/sql-queries/`:

1. **quick-stats.sql** - Fast overview (companies, tests, payments)
2. **revenue-summary.sql** - Total revenue, top companies
3. **recent-activity.sql** - What changed in last 24 hours
4. **test-analysis.sql** - Test patterns and performance
5. **data-quality-check.sql** - Data integrity checks

## How I (AI) Will Use This

When you ask questions, I can now:

**You:** "Did the import work?"  
**Me:** *Runs `SELECT COUNT(*) FROM companies`*  
**Me:** "Yes! 40 companies imported successfully ✅"

**You:** "What's our revenue?"  
**Me:** *Runs `SELECT SUM(amount) FROM credit_payments`*  
**Me:** "$289,961.09 across 48 payments 💰"

**You:** "Show me the latest test"  
**Me:** *Runs `SELECT * FROM tests ORDER BY created_at DESC LIMIT 1`*  
**Me:** "Latest test: 'Product X Validation' created 2 days ago"

## Troubleshooting

### "Can't connect to database"

Check if PostgreSQL is running:
```bash
docker ps | grep robbieverse-postgres

# If not running:
cd infrastructure/docker
docker-compose up -d postgres
```

### "Extensions not showing"

1. Restart Cursor after installing extensions
2. Check Extensions view - both should show "Installed"
3. Look for database icon in left sidebar

### "Tables not appearing"

1. Click database connection → Right-click → **Refresh**
2. Or disconnect and reconnect

## Full Documentation

See `docs/SQL_ACCESS.md` for:
- Complete usage guide
- Keyboard shortcuts
- Query best practices
- Security notes
- Troubleshooting

---

## 🎯 Next Steps

1. **Install the two extensions** (5 minutes)
2. **Click database icon** in sidebar
3. **Connect to Local Robbieverse DB**
4. **Run `quick-stats.sql`** to verify

Then I'll be able to peek at data whenever needed! 🚀

