-- CRM entities to support HubSpot bidirectional sync

CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  hubspot_id TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS crm_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  hubspot_id TEXT UNIQUE,
  name TEXT,
  domain TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS crm_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  hubspot_id TEXT UNIQUE,
  name TEXT,
  amount NUMERIC,
  stage TEXT,
  close_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS crm_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  external_id TEXT,
  subject TEXT,
  sender TEXT,
  recipients JSONB DEFAULT '[]'::jsonb,
  body TEXT,
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_company ON crm_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_companies_company ON crm_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_company ON crm_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_emails_company ON crm_emails(company_id);
