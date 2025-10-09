-- Migration 001: Add Organizations & Multi-Tenancy
-- Phase 1: Foundation for multi-tenant architecture
-- Non-breaking: Adds new tables, doesn't modify existing ones yet

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- ORGANIZATIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  org_type TEXT NOT NULL DEFAULT 'personal' CHECK (org_type IN ('personal', 'corporate', 'nonprofit', 'government')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'trial')),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- ORGANIZATION MEMBERSHIPS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS organization_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(org_id, user_id)
);

-- ========================================
-- ADD ORG_ID TO EXISTING TABLES (NULLABLE FOR NOW)
-- ========================================

-- Add org_id to users (nullable initially)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- Add org_id to conversations (nullable initially)
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- Add org_id to messages (nullable initially)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- Add org_id to mentors (nullable initially)
ALTER TABLE mentors 
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- ========================================
-- CREATE DEFAULT ORGANIZATION
-- ========================================

-- Insert default organization for existing data
INSERT INTO organizations (name, org_type, status, settings)
VALUES (
  'Default Organization',
  'personal',
  'active',
  '{"description": "Default organization for existing users"}'::jsonb
)
ON CONFLICT DO NOTHING;

-- ========================================
-- MIGRATE EXISTING DATA
-- ========================================

-- Update existing users with default org_id
UPDATE users 
SET org_id = (SELECT id FROM organizations WHERE name = 'Default Organization')
WHERE org_id IS NULL;

-- Update existing conversations with default org_id
UPDATE conversations 
SET org_id = (SELECT id FROM organizations WHERE name = 'Default Organization')
WHERE org_id IS NULL;

-- Update existing messages with default org_id
UPDATE messages 
SET org_id = (SELECT id FROM organizations WHERE name = 'Default Organization')
WHERE org_id IS NULL;

-- Update existing mentors with default org_id
UPDATE mentors 
SET org_id = (SELECT id FROM organizations WHERE name = 'Default Organization')
WHERE org_id IS NULL;

-- ========================================
-- MAKE ORG_ID REQUIRED
-- ========================================

-- Now make org_id NOT NULL (after data migration)
ALTER TABLE users 
ALTER COLUMN org_id SET NOT NULL;

ALTER TABLE conversations 
ALTER COLUMN org_id SET NOT NULL;

ALTER TABLE messages 
ALTER COLUMN org_id SET NOT NULL;

ALTER TABLE mentors 
ALTER COLUMN org_id SET NOT NULL;

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

CREATE INDEX IF NOT EXISTS idx_org_memberships_org_id ON organization_memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_id ON organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_role ON organization_memberships(role);

CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_conversations_org_id ON conversations(org_id);
CREATE INDEX IF NOT EXISTS idx_messages_org_id ON messages(org_id);
CREATE INDEX IF NOT EXISTS idx_mentors_org_id ON mentors(org_id);

-- ========================================
-- CREATE UPDATED_AT TRIGGER
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_memberships TO postgres;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- Log migration
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 001 Complete: Organizations & Multi-Tenancy';
  RAISE NOTICE '   - Created organizations table';
  RAISE NOTICE '   - Created organization_memberships table';
  RAISE NOTICE '   - Added org_id to existing tables';
  RAISE NOTICE '   - Migrated existing data to default organization';
  RAISE NOTICE '   - Created performance indexes';
END $$;
