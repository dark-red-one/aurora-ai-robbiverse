# 🗄️ Robbieverse Database Schema

**Complete unified schema for the Allan AI Empire**

---

## 📂 Directory Structure

```
database/
├── init-unified-schema.sql          # Master initialization script
├── unified-schema/                   # Production-ready schema files (21 files)
│   ├── 01-core.sql                  # Users, auth, sessions, audit
│   ├── 02-conversations.sql         # Conversation system
│   ├── 03-vectors-rag.sql          # Vector embeddings & semantic search
│   ├── 04-enhanced-business-tables.sql  # CRM, deals, companies
│   ├── 05-town-separation.sql      # Multi-tenant architecture
│   ├── 06-testpilot-simulations.sql # Business simulations
│   ├── 07-data-sharing-strategy.sql # Cross-town data sharing
│   ├── 08-universal-ai-state.sql   # AI personalities & moods
│   ├── 09-google-workspace-sync.sql # Gmail, Calendar, Drive
│   ├── 10-extensions.sql           # PostgreSQL extensions
│   ├── 11-tenancy.sql              # Multi-tenancy system
│   ├── 12-rbac_and_privacy.sql     # Role-based access control
│   ├── 13-slack.sql                # Slack integration
│   ├── 14-service_tables.sql       # Service infrastructure
│   ├── 15-indexes.sql              # Performance indexes
│   ├── 16-audit_log.sql            # Audit logging
│   ├── 17-crm-entities.sql         # HubSpot CRM sync
│   ├── 18-linkedin-integration.sql # LinkedIn data sync
│   ├── 19-interactions-database.sql # User interaction tracking
│   ├── 20-sync-infrastructure.sql  # Bi-directional sync
│   └── 21-robbieblocks-cms.sql     # 🆕 Dynamic CMS + auto-deploy
├── archive-legacy-schemas/          # Archived old schema files
│   └── old-migrations/              # Pre-unification migrations
└── production-schema/               # Original production schemas

```

---

## 🚀 Quick Start

### Initialize Complete Schema

```bash
# Local PostgreSQL
psql -U robbie -d robbieverse -f database/init-unified-schema.sql

# ElephantSQL Master
psql -h [elephant-host] -U [user] -d [db] -f database/init-unified-schema.sql

# With environment variables
PGHOST=localhost PGUSER=robbie PGDATABASE=robbieverse psql -f database/init-unified-schema.sql
```

### Initialize Individual Schemas

```bash
# Just the core tables
psql -U robbie -d robbieverse -f database/unified-schema/01-core.sql

# Just RobbieBlocks CMS
psql -U robbie -d robbieverse -f database/unified-schema/21-robbieblocks-cms.sql
```

---

## 📊 Schema Overview

| # | Schema File | Purpose | Tables | Status |
|---|-------------|---------|--------|--------|
| 01 | core.sql | Users, auth, sessions | 4 | ✅ |
| 02 | conversations.sql | Chat & messaging | 3 | ✅ |
| 03 | vectors-rag.sql | Semantic search | 2 | ✅ |
| 04 | enhanced-business-tables.sql | CRM core | 8 | ✅ |
| 05 | town-separation.sql | Multi-tenancy | 5 | ✅ |
| 06 | testpilot-simulations.sql | Business sims | 4 | ✅ |
| 07 | data-sharing-strategy.sql | Cross-town | 3 | ✅ |
| 08 | universal-ai-state.sql | AI personalities | 12 | ✅ |
| 09 | google-workspace-sync.sql | Google sync | 6 | ✅ |
| 10 | extensions.sql | PG extensions | 0 | ✅ |
| 11 | tenancy.sql | Multi-tenant | 2 | ✅ |
| 12 | rbac_and_privacy.sql | Access control | 5 | ✅ |
| 13 | slack.sql | Slack integration | 4 | ✅ |
| 14 | service_tables.sql | Infrastructure | 7 | ✅ |
| 15 | indexes.sql | Performance | 0 | ✅ |
| 16 | audit_log.sql | Audit trail | 1 | ✅ |
| 17 | crm-entities.sql | HubSpot sync | 4 | ✅ |
| 18 | linkedin-integration.sql | LinkedIn | 3 | ✅ |
| 19 | interactions-database.sql | User tracking | 2 | ✅ |
| 20 | sync-infrastructure.sql | Bi-dir sync | 3 | ✅ |
| 21 | robbieblocks-cms.sql | **CMS + Deploy** | 7 | 🆕 |

**Total:** 85+ tables, 4,600+ lines of SQL

---

## 🎨 RobbieBlocks CMS (NEW!)

The latest addition to the unified schema enables **dynamic web app generation from SQL**.

### Key Features

✅ **Store React components in SQL** - Components are data, not code  
✅ **Compose pages from components** - Drag-and-drop in SQL  
✅ **Auto-build on DB change** - PostgreSQL NOTIFY triggers builds  
✅ **Node-specific branding** - Dark mode on Vengeance, light on Aurora  
✅ **Deployment tracking** - Full history of every build  

### Tables

- `robbieblocks_pages` - Page definitions
- `robbieblocks_components` - React component library
- `robbieblocks_page_blocks` - Page composition
- `robbieblocks_style_tokens` - Design system tokens
- `robbieblocks_node_branding` - Per-node customization
- `robbieblocks_deploys` - Deployment history
- `robbieblocks_change_triggers` - Auto-deploy queue

### Example Usage

```sql
-- Create a new page
INSERT INTO robbieblocks_pages (page_key, app_namespace, page_name, page_route, layout_template, status)
VALUES ('robbie-play-home', 'play', 'Play Home', '/play/', 'single-column', 'published');

-- Add components to page
INSERT INTO robbieblocks_page_blocks (page_id, component_id, block_order, zone, props)
SELECT 
    (SELECT id FROM robbieblocks_pages WHERE page_key = 'robbie-play-home'),
    (SELECT id FROM robbieblocks_components WHERE component_key = 'robbie-bar'),
    1, 'sidebar', '{"mood": "playful"}'::jsonb;

-- 🔔 Auto-deploy triggers automatically!
-- Vengeance and Aurora Town both rebuild with their own branding
```

---

## 🔄 Database Sync Architecture

### Master-Replica Setup

```
┌─────────────────────────────────┐
│      ElephantSQL Master         │
│   (Single source of truth)      │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┬─────────────────┬──────────────┐
    ↓                 ↓                 ↓              ↓
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│Vengeance│    │ Aurora  │    │ Collab  │    │ Fluenti │
│  Local  │    │  Local  │    │  Local  │    │  Local  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

**Sync Strategy:**

- Master → Local: Every 5 minutes (pull latest)
- Local → Master: Immediate (on write)
- Conflict resolution: Last-write-wins with audit trail

---

## 🧪 Testing & Validation

### Run Schema Tests

```bash
# Test initialization
./scripts/test-schema-init.sh

# Validate all constraints
./scripts/validate-schema.sh

# Check for missing indexes
./scripts/analyze-performance.sh
```

### Verify Installation

```sql
-- Check table count
SELECT COUNT(*) as table_count 
FROM pg_tables 
WHERE schemaname = 'public';
-- Expected: 85+

-- Verify RobbieBlocks tables
SELECT tablename 
FROM pg_tables 
WHERE tablename LIKE 'robbieblocks%';
-- Expected: 7 tables

-- Check AI personality state
SELECT * FROM ai_personalities_current_state;
-- Should show: robbie, steve-jobs, bookkeeper, gatekeeper
```

---

## 📝 Migration from Legacy

If you have an existing database with old schemas:

```bash
# 1. Backup existing data
pg_dump -U robbie robbieverse > backup_$(date +%Y%m%d).sql

# 2. Archive old schemas (already done)
# Legacy files moved to database/archive-legacy-schemas/

# 3. Initialize unified schema
psql -U robbie -d robbieverse -f database/init-unified-schema.sql

# 4. Migrate data (if needed)
psql -U robbie -d robbieverse -f scripts/migrate-legacy-data.sql
```

---

## 🔧 Maintenance

### Regular Tasks

**Daily:**

- Check sync status: `SELECT * FROM sync_status;`
- Monitor deploy queue: `SELECT * FROM robbieblocks_active_deploys;`

**Weekly:**

- Vacuum analyze: `VACUUM ANALYZE;`
- Check index usage: `SELECT * FROM pg_stat_user_indexes;`

**Monthly:**

- Archive old audit logs
- Review and optimize slow queries
- Update table statistics

---

## 🎯 Performance Tips

1. **Use indexes wisely** - Schema includes optimized indexes
2. **Enable query logging** - Track slow queries
3. **Regular VACUUM** - Keep tables healthy
4. **Connection pooling** - Use PgBouncer
5. **Monitor with pg_stat_statements** - Identify bottlenecks

---

## 📚 Documentation

- **Architecture:** `../docs/ROBBIE_EMPIRE_COMPLETE_GUIDE.md`
- **RobbieBlocks:** `../ROBBIEBLOCKS_CMS_ARCHITECTURE.md`
- **Schema Inventory:** `../SCHEMA_INVENTORY_COMPLETE.md`
- **API Reference:** `../docs/API_REFERENCE.md`

---

## 🚨 Troubleshooting

### Common Issues

**"Extension vector not found"**

```sql
-- Install pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

**"Table already exists"**

```bash
# Schema uses CREATE TABLE IF NOT EXISTS
# Safe to run multiple times
psql -U robbie -d robbieverse -f database/init-unified-schema.sql
```

**"Relation does not exist"**

```bash
# Run schemas in order (use master init script)
psql -U robbie -d robbieverse -f database/init-unified-schema.sql
```

---

## 🤝 Contributing

When adding new tables:

1. Create a new numbered file in `unified-schema/` (e.g., `22-new-feature.sql`)
2. Add to `init-unified-schema.sql` in the correct sequence
3. Document in this README
4. Test initialization from scratch
5. Update `SCHEMA_INVENTORY_COMPLETE.md`

---

## 📞 Support

Questions? Issues?

- Check docs: `/docs/`
- Review architecture: `ROBBIEBLOCKS_CMS_ARCHITECTURE.md`
- Ask Robbie in Cursor: "Explain the schema for [table]"

---

**Built with 💜 by Robbie AI**  
**For Allan's AI Empire**  
**January 9, 2025**
