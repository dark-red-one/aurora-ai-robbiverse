# Schema Readiness Plan (Pre-Ship)

This prepares the database to cover full scope without switching services yet.

## What’s added
- Extensions: uuid-ossp, vector, pgcrypto (compat)
- Tenancy: `companies`, `towns`, `company_towns`, `company_members` + company_id on core tables
- RBAC/RLS: privacy levels; company isolation; creator-only for private
- Slack: workspaces, users, channels, messages
- Centralized service tables: `user_sessions`, `widgets`, `widget_usage`, `training_jobs`, `secrets`, `api_connectivity_status`, `sync_registry`
- Indexes: performance and uniqueness
- Audit log: `audit_log`
- CRM entities: `crm_contacts`, `crm_companies`, `crm_deals`, `crm_emails`

## Next steps to activate
1. Apply migrations under `database/unified-schema/` in numeric order
2. Standardize UUID defaults in services to `uuid_generate_v4()` (post-ship)
3. Pass GUCs per request: `SET LOCAL app.company_id`, `app.user_id`, `app.role`
4. Gradually remove service-side CREATE TABLE blocks after verifying migrations applied
5. Update integration-sync to use `crm_*` tables
6. Add Slack Bolt service and wire to new slack tables

## Notes
- RLS is enabled but permissive; enforcement requires app to set GUCs
- Existing data remains valid; new columns are nullable for backfill
- Unique and index names chosen to be idempotent (`IF NOT EXISTS`)
