# SQL Database Access in Cursor

## Overview

This workspace is configured with SQLTools extension to enable direct SQL queries from Cursor. This allows both you (Allan) and the AI to inspect data, verify imports, and make better development decisions.

## Setup

### 1. Install Extensions

Install these extensions in Cursor:

1. **SQLTools** (`mtxr.sqltools`) - Base extension
2. **SQLTools PostgreSQL Driver** (`mtxr.sqltools-driver-pg`) - PostgreSQL support

```bash
# Install via command palette (Ctrl+Shift+P):
# "Extensions: Install Extensions"
# Search for: SQLTools
# Search for: SQLTools PostgreSQL
```

### 2. Database Connections

Two connections are pre-configured in `.vscode/settings.json`:

#### Local Robbieverse DB
- **Server**: localhost:5432
- **Database**: robbieverse
- **User**: robbie
- **Password**: robbie_dev_2025
- **Use for**: Development, testing, data inspection

#### Supabase TestPilot (Read-Only)
- **Server**: aws-0-us-west-1.pooler.supabase.com
- **Database**: postgres
- **User**: postgres.hykelmayopljuguuueme
- **Password**: Set `SUPABASE_DB_PASSWORD` in `.env`
- **Use for**: Production data inspection (read-only)

## Usage

### Quick Start

1. Click the **SQLTools icon** in the Cursor sidebar (database icon)
2. Click **"Local Robbieverse DB"** → **Connect**
3. Browse tables in the sidebar
4. Right-click any table → **Show Table Records**

### Running Queries

#### Option 1: Use Saved Queries
Navigate to `.vscode/sql-queries/` and open any `.sql` file:
- `quick-stats.sql` - Fast overview of key tables
- `revenue-summary.sql` - Revenue analysis and top companies
- `recent-activity.sql` - What changed in last 24 hours
- `test-analysis.sql` - Test patterns and performance
- `data-quality-check.sql` - Verify data integrity

**To run:**
1. Open the `.sql` file
2. Press `Ctrl+E Ctrl+E` (or right-click → **Run on Active Connection**)
3. View results in the SQLTools Results panel

#### Option 2: Ad-hoc Queries
1. Create new `.sql` file or use `Ctrl+E Ctrl+Q` (New SQL File)
2. Write your query
3. Press `Ctrl+E Ctrl+E` to run
4. Results appear in bottom panel

### Common Queries

**Check import success:**
```sql
SELECT 
  'companies' as table_name, COUNT(*) as rows FROM companies
UNION ALL
SELECT 'tests', COUNT(*) FROM tests
UNION ALL
SELECT 'credit_payments', COUNT(*) FROM credit_payments;
```

**Revenue total:**
```sql
SELECT SUM(amount) as total_revenue 
FROM credit_payments;
-- Expected: ~$289,961.09
```

**Latest activity:**
```sql
SELECT * FROM tests 
ORDER BY created_at DESC 
LIMIT 10;
```

**Data quality check:**
```sql
-- Find orphaned records
SELECT t.* 
FROM tests t
LEFT JOIN companies c ON t.company_id = c.id
WHERE c.id IS NULL;
```

## Keyboard Shortcuts

- `Ctrl+E Ctrl+E` - Execute query
- `Ctrl+E Ctrl+Q` - New SQL file
- `Ctrl+E Ctrl+H` - Show query history
- `Ctrl+E Ctrl+B` - Bookmark query
- `Ctrl+E Ctrl+D` - Describe table

## AI Usage

The AI can reference data directly when making decisions:

**Example AI workflow:**
1. User: "Did the import work?"
2. AI runs: `SELECT COUNT(*) FROM companies` via SQLTools
3. AI: "Yes! Imported 40 companies successfully"

**What AI can do:**
- Verify row counts after imports
- Check data quality issues
- Analyze revenue trends
- Find edge cases in data
- Validate schema changes

## Troubleshooting

### Connection Failed

**Local DB not running:**
```bash
# Check if Postgres container is running
docker ps | grep robbieverse-postgres

# Start if needed
cd infrastructure/docker
docker-compose up -d postgres
```

**Wrong password:**
- Local DB uses `robbie_dev_2025` (in `.vscode/settings.json`)
- If changed, update both `docker-compose.yml` and settings

### Query Timeout

**Long-running query:**
- Increase `connectionTimeout` in `.vscode/settings.json`
- Add `LIMIT` to large queries
- Check for missing indexes

### Tables Not Showing

**Schema not loaded:**
1. Disconnect from database (right-click connection → Disconnect)
2. Reconnect (right-click → Connect)
3. Right-click connection → **Refresh**

### Results Not Appearing

**Panel hidden:**
- View → Output → Select "SQLTools" from dropdown
- Or click "Results" tab at bottom of Cursor

## Security Notes

### Local Database (Safe)
- Password in settings: `robbie_dev_2025`
- Only accessible from localhost
- Dev environment only
- Safe to commit settings to git

### Supabase (Read-Only)
- Uses anon key (read-only permissions)
- Password stored in `.env` (gitignored)
- Cannot modify production data
- Safe for inspection and analytics

### Best Practices
- Don't commit `.env` files (already in `.gitignore`)
- Use read-only user for production databases
- Test destructive queries on local DB first
- Always use transactions for multi-step updates

## Query Best Practices

### Performance
```sql
-- ✅ Good: Use LIMIT for exploration
SELECT * FROM tests LIMIT 100;

-- ❌ Bad: Unbounded query
SELECT * FROM tests;

-- ✅ Good: Use indexes
SELECT * FROM tests WHERE id = 123;

-- ❌ Bad: Function on indexed column
SELECT * FROM tests WHERE UPPER(name) = 'TEST';
```

### Safety
```sql
-- ✅ Good: Check before delete
SELECT COUNT(*) FROM tests WHERE status = 'draft';
-- Then if count looks right:
DELETE FROM tests WHERE status = 'draft';

-- ❌ Bad: Delete without checking
DELETE FROM tests WHERE status = 'draft';
```

### Readability
```sql
-- ✅ Good: Clear, formatted
SELECT 
  c.name as company_name,
  COUNT(t.id) as test_count
FROM companies c
LEFT JOIN tests t ON c.id = t.company_id
GROUP BY c.id, c.name
ORDER BY test_count DESC;

-- ❌ Bad: Hard to read
SELECT c.name,COUNT(t.id) FROM companies c LEFT JOIN tests t ON c.id=t.company_id GROUP BY c.id,c.name;
```

## Saved Queries

All queries in `.vscode/sql-queries/` are tracked in git for team use. Add your own:

1. Create new `.sql` file in that directory
2. Add descriptive comment at top
3. Test thoroughly
4. Commit to git

**Naming convention:**
- `action-subject.sql` (e.g., `find-orphaned-tests.sql`)
- Use hyphens, not underscores or spaces
- Keep names short but descriptive

## Resources

- [SQLTools Documentation](https://vscode-sqltools.mteixeira.dev/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [SQL Style Guide](https://www.sqlstyle.guide/)

---

**Quick access: Click the database icon in Cursor sidebar to get started!** 🗄️

