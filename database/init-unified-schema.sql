-- ============================================
-- ROBBIEVERSE UNIFIED SCHEMA INITIALIZATION
-- ============================================
-- 
-- Master initialization script for the complete Robbieverse database
-- This script applies all unified schema files in the correct order
--
-- Date: January 9, 2025
-- Version: 1.0.0
-- Total Schema Files: 21
--
-- Usage:
--   psql -h [host] -U [user] -d [database] -f init-unified-schema.sql
--
-- ============================================
\ echo '🚀 Initializing Robbieverse Unified Schema...' \ echo '' -- ============================================
-- 01: CORE TABLES (Users, Auth, System)
-- ============================================
\ echo '📦 [01/21] Loading core tables (users, auth, sessions)...' \ i unified - schema / 01 - core.sql -- ============================================
-- 02: CONVERSATIONS
-- ============================================
\ echo '💬 [02/21] Loading conversation system...' \ i unified - schema / 02 - conversations.sql -- ============================================
-- 03: VECTORS & RAG
-- ============================================
\ echo '🧠 [03/21] Loading vector embeddings & RAG...' \ i unified - schema / 03 - vectors - rag.sql -- ============================================
-- 04: ENHANCED BUSINESS TABLES
-- ============================================
\ echo '💼 [04/21] Loading business intelligence tables...' \ i unified - schema / 04 - enhanced - business - tables.sql -- ============================================
-- 05: TOWN SEPARATION
-- ============================================
\ echo '🏘️  [05/21] Loading multi-tenant town architecture...' \ i unified - schema / 05 - town - separation.sql -- ============================================
-- 06: TESTPILOT SIMULATIONS
-- ============================================
\ echo '🧪 [06/21] Loading TestPilot simulation tables...' \ i unified - schema / 06 - testpilot - simulations.sql -- ============================================
-- 07: DATA SHARING STRATEGY
-- ============================================
\ echo '🔄 [07/21] Loading cross-town data sharing...' \ i unified - schema / 07 - data - sharing - strategy.sql -- ============================================
-- 08: UNIVERSAL AI STATE
-- ============================================
\ echo '🤖 [08/21] Loading AI personality state management...' \ i unified - schema / 08 - universal - ai - state.sql -- ============================================
-- 09: GOOGLE WORKSPACE SYNC
-- ============================================
\ echo '📧 [09/21] Loading Google Workspace sync tables...' \ i unified - schema / 09 - google - workspace - sync.sql -- ============================================
-- 10: EXTENSIONS
-- ============================================
\ echo '🔌 [10/21] Loading PostgreSQL extensions...' \ i unified - schema / 10 - extensions.sql -- ============================================
-- 11: TENANCY
-- ============================================
\ echo '🏢 [11/21] Loading multi-tenancy system...' \ i unified - schema / 11 - tenancy.sql -- ============================================
-- 12: RBAC & PRIVACY
-- ============================================
\ echo '🔒 [12/21] Loading role-based access control...' \ i unified - schema / 12 - rbac_and_privacy.sql -- ============================================
-- 13: SLACK INTEGRATION
-- ============================================
\ echo '💬 [13/21] Loading Slack integration tables...' \ i unified - schema / 13 - slack.sql -- ============================================
-- 14: SERVICE TABLES
-- ============================================
\ echo '⚙️  [14/21] Loading service infrastructure tables...' \ i unified - schema / 14 - service_tables.sql -- ============================================
-- 15: INDEXES
-- ============================================
\ echo '⚡ [15/21] Loading performance indexes...' \ i unified - schema / 15 - indexes.sql -- ============================================
-- 16: AUDIT LOG
-- ============================================
\ echo '📝 [16/21] Loading audit logging system...' \ i unified - schema / 16 - audit_log.sql -- ============================================
-- 17: CRM ENTITIES
-- ============================================
\ echo '📊 [17/21] Loading CRM integration tables...' \ i unified - schema / 17 - crm - entities.sql -- ============================================
-- 18: LINKEDIN INTEGRATION
-- ============================================
\ echo '👔 [18/21] Loading LinkedIn integration...' \ i unified - schema / 18 - linkedin - integration.sql -- ============================================
-- 19: INTERACTIONS DATABASE
-- ============================================
\ echo '📈 [19/21] Loading user interaction tracking...' \ i unified - schema / 19 - interactions - database.sql -- ============================================
-- 20: SYNC INFRASTRUCTURE
-- ============================================
\ echo '🔄 [20/21] Loading sync infrastructure...' \ i unified - schema / 20 - sync - infrastructure.sql -- ============================================
-- 21: ROBBIEBLOCKS CMS
-- ============================================
\ echo '🎨 [21/21] Loading RobbieBlocks CMS & auto-deployment...' \ i unified - schema / 21 - robbieblocks - cms.sql -- ============================================
-- FINALIZATION
-- ============================================
\ echo '' \ echo '✅ Robbieverse Unified Schema initialization complete!' \ echo '' \ echo '📊 Schema Statistics:'
SELECT schemaname as schema,
    COUNT(*) as table_count
FROM pg_tables
WHERE schemaname = 'public'
GROUP BY schemaname;
\ echo '' \ echo '🎯 Key Tables:'
SELECT tablename,
    pg_size_pretty(
        pg_total_relation_size(schemaname || '.' || tablename)
    ) as size
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'users',
        'conversations',
        'ai_personalities',
        'robbieblocks_pages',
        'robbieblocks_components',
        'deals',
        'companies',
        'contacts'
    )
ORDER BY tablename;
\ echo '' \ echo '🚀 Database ready for Robbieverse deployment!' \ echo ''
