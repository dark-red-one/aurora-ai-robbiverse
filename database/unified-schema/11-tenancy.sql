-- Multi-tenant core: companies, towns, memberships

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS towns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS company_towns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  town_id UUID NOT NULL REFERENCES towns(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, town_id)
);

-- Roles within a company
CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','manager','employee','contractor')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, user_id)
);

-- Add company/town references to key domain tables (nullable for backfill)
ALTER TABLE IF EXISTS conversations ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE IF EXISTS conversations ADD COLUMN IF NOT EXISTS town_id UUID REFERENCES towns(id);
ALTER TABLE IF EXISTS messages ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE IF EXISTS messages ADD COLUMN IF NOT EXISTS town_id UUID REFERENCES towns(id);
ALTER TABLE IF EXISTS sticky_notes ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE IF EXISTS sticky_notes ADD COLUMN IF NOT EXISTS town_id UUID REFERENCES towns(id);

-- Creator columns to support privacy rules
ALTER TABLE IF NOT EXISTS conversations ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE IF NOT EXISTS messages ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_conversations_company ON conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_messages_company ON messages(company_id);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_company ON sticky_notes(company_id);
