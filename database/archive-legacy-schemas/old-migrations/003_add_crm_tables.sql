-- Migration 003: Add CRM Tables
-- Phase 2: Contacts, Companies, Deals

-- ========================================
-- COMPANIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  employee_count INTEGER,
  revenue_range TEXT,
  headquarters JSONB, -- {city, state, country, address}
  website TEXT,
  phone TEXT,
  email TEXT,
  linkedin_url TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  is_vip BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- CONTACTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  job_title TEXT,
  linkedin_url TEXT,
  avatar_url TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  is_vip BOOLEAN DEFAULT FALSE,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- DEALS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  primary_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount_cents BIGINT,
  currency VARCHAR(3) DEFAULT 'USD',
  stage TEXT DEFAULT 'AWARENESS' CHECK (stage IN (
    'AWARENESS', 'ENGAGE', 'QUALIFY', 'PROVE', 'COMMIT', 'EXPAND', 'CLOSED_WON', 'CLOSED_LOST'
  )),
  is_closed BOOLEAN GENERATED ALWAYS AS (stage IN ('CLOSED_WON', 'CLOSED_LOST')) STORED,
  closed_reason TEXT,
  expected_close_date DATE,
  probability INTEGER DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMPTZ
);

-- ========================================
-- DEAL ACTIVITIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS deal_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'note', 'email', 'call', 'meeting', 'stage_change', 'amount_change'
  )),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- CREATE INDEXES
-- ========================================

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_org_id ON companies(org_id);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_is_vip ON companies(is_vip);
CREATE INDEX IF NOT EXISTS idx_companies_name_search ON companies 
USING gin(to_tsvector('english', name));

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_org_id ON contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_is_vip ON contacts(is_vip);
CREATE INDEX IF NOT EXISTS idx_contacts_name_search ON contacts 
USING gin(to_tsvector('english', first_name || ' ' || last_name));

-- Deals indexes
CREATE INDEX IF NOT EXISTS idx_deals_org_id ON deals(org_id);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_is_closed ON deals(is_closed);
CREATE INDEX IF NOT EXISTS idx_deals_expected_close_date ON deals(expected_close_date);

-- Deal activities indexes
CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_id ON deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_activities_user_id ON deal_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_activities_type ON deal_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_deal_activities_created_at ON deal_activities(created_at);

-- ========================================
-- ADD UPDATED_AT TRIGGERS
-- ========================================

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON companies TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON deals TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON deal_activities TO postgres;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 003 Complete: CRM Tables';
  RAISE NOTICE '   - Created companies table';
  RAISE NOTICE '   - Created contacts table';
  RAISE NOTICE '   - Created deals table';
  RAISE NOTICE '   - Created deal_activities table';
  RAISE NOTICE '   - Created performance indexes';
END $$;
