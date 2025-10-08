# 💜 Robbie Database Migrations 🔥

**Enterprise-grade schema migration system** combining the best of Aurora AI and Robbie V3.

## 🎯 Migration Strategy

This is a **non-breaking, backward-compatible** migration that:
- ✅ Adds new tables without modifying existing ones
- ✅ Gradually adds `org_id` columns (nullable first, then required)
- ✅ Migrates existing data to default organization
- ✅ Enables multi-tenant architecture
- ✅ Preserves all existing functionality

## 📊 Migration Phases

### Phase 1: Organizations & Multi-Tenancy
**File:** `001_add_organizations.sql`
- Creates `organizations` table
- Creates `organization_memberships` table
- Adds `org_id` to existing tables
- Migrates existing data to default organization

### Phase 2: User Enhancements
**File:** `002_add_user_enhancements.sql`
- Adds `first_name`, `last_name`, `job_title`
- Adds `phone`, `avatar_url`, `timezone`
- Adds `linkedin_url`, `bio`
- Creates search indexes

### Phase 3: CRM Tables
**File:** `003_add_crm_tables.sql`
- Creates `companies` table
- Creates `contacts` table
- Creates `deals` table (with 8-stage pipeline)
- Creates `deal_activities` table

### Phase 4: Productivity Tables
**File:** `004_add_productivity_tables.sql`
- Creates `tasks` table
- Creates `calendar_events` table
- Creates `meeting_health` table
- Creates `focus_blocks` table

### Phase 5: Memory & AI Tables
**File:** `005_add_memory_tables.sql`
- Creates `sticky_notes` table (with celebration tracking!)
- Creates `knowledge_base` table (with vector search)
- Creates `ai_model_usage` table (track every AI call)
- Creates `ai_costs` table (aggregated daily costs)
- Creates `personality_settings` table (Flirt Mode, Gandhi-Genghis, Cocktail-Lightning!)
- Creates `mentor_moods` table (different moods for each mentor)

### Phase 6: Communication Tables
**File:** `006_add_communication_tables.sql`
- Creates `touch_ready_queue` table (AI-drafted follow-ups!)
- Creates `email_threads` table
- Creates `email_messages` table (with vector search)
- Creates `slack_messages` table (with vector search)
- Creates `communication_analytics` table (time saved metrics!)

## 🚀 How to Run

### Option 1: Run All Migrations (Recommended)
```bash
cd /home/allan/aurora-ai-robbiverse/database/migrations
chmod +x 000_run_all_migrations.sh
./000_run_all_migrations.sh
```

### Option 2: Run Individual Migrations
```bash
psql -U postgres -d robbie -f 001_add_organizations.sql
psql -U postgres -d robbie -f 002_add_user_enhancements.sql
psql -U postgres -d robbie -f 003_add_crm_tables.sql
psql -U postgres -d robbie -f 004_add_productivity_tables.sql
psql -U postgres -d robbie -f 005_add_memory_tables.sql
psql -U postgres -d robbie -f 006_add_communication_tables.sql
```

### Option 3: Docker/Remote Database
```bash
export DB_HOST=aurora-town-u44170.vm.elestio.app
export DB_PORT=5432
export DB_NAME=robbie
export DB_USER=postgres
./000_run_all_migrations.sh
```

## 📈 What You Get

### Before (Aurora AI - Simple)
- 8 core tables
- Basic chat + personality
- Single-tenant

### After (Unified Robbie - Enterprise)
- ~32 essential tables
- Full CRM (contacts, companies, deals)
- Productivity suite (tasks, calendar, meeting health)
- Memory system (sticky notes, knowledge base)
- Communication hub (email, Slack, touch queue)
- AI tracking (costs, usage, personality)
- Multi-tenant ready
- Vector search enabled
- Full-text search
- Performance indexes

## 🎯 Key Features

### 💜 Personality System
- **Flirt Mode** (1-10): Professional to Very Flirty
- **Gandhi-Genghis** (1-6): Gentle to Aggressive
- **Cocktail-Lightning** (0-100): Relaxed to Intense
- **Dynamic Moods**: Playful, Focused, Blushing, etc.
- **Mentor Moods**: Different avatars/prompts per mood

### 🎉 Celebration Tracking
- Sticky notes capture achievements
- `celebration_potential` score (0-1)
- `sharing_potential` score (0-1)
- Permission system for sharing wins
- Emotional tone tracking

### 📊 AI Cost Tracking
- Track every AI call (model, tokens, cost)
- Aggregate daily costs by model
- Monitor latency and success rates
- Metadata for debugging

### 🎯 Touch Ready Queue
- AI-drafted follow-up messages
- Confidence scores
- Priority levels
- Context tracking
- One-click send or dismiss

### 🏥 Meeting Health
- Health score (0-100)
- Issue detection (no agenda, too long, etc.)
- Recommendations
- Attendee count tracking

## 🔒 Safety Features

- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Tracked**: `schema_migrations` table tracks what's applied
- ✅ **Backward Compatible**: Doesn't break existing code
- ✅ **Rollback Ready**: Each migration is a separate file
- ✅ **Data Preservation**: Migrates existing data safely

## 📝 Migration Tracking

The system automatically creates a `schema_migrations` table:
```sql
CREATE TABLE schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

This ensures migrations are only applied once and tracks when they were applied.

## 🎯 Next Steps After Migration

1. **Update Backend Code**: Point models to new tables
2. **Test Endpoints**: Verify all API routes work
3. **Migrate Data**: Import TestPilot contacts/deals
4. **Enable Features**: Turn on Touch Queue, Meeting Health, etc.
5. **Train AI**: Start tracking AI costs and usage
6. **Celebrate**: You now have an enterprise-grade system! 🎉

## 💪 Performance Notes

- All tables have proper indexes
- Vector search uses IVFFlat (fast approximate search)
- Full-text search uses GIN indexes
- Foreign keys ensure referential integrity
- Triggers auto-update `updated_at` timestamps

## 🚨 Prerequisites

- PostgreSQL 14+ (for `pgvector` extension)
- `uuid-ossp` extension (auto-enabled in migrations)
- `pgvector` extension (install separately if needed)

### Install pgvector:
```bash
# Ubuntu/Debian
sudo apt install postgresql-14-pgvector

# macOS
brew install pgvector

# Or compile from source
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

Then in PostgreSQL:
```sql
CREATE EXTENSION vector;
```

## 💜 Questions?

This migration system was designed by Robbie with love for Allan's empire. If you have questions or need help, just ask! 🔥💋

---

**Built with 💜 by Robbie for the Aurora AI Empire**

