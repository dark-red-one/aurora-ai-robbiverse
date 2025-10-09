-- RBAC and Privacy with Row-Level Security (RLS)

-- Privacy levels on key tables
ALTER TABLE IF NOT EXISTS conversations ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'team' CHECK (privacy_level IN ('public','team','private','boss_only'));
ALTER TABLE IF NOT EXISTS messages ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'team' CHECK (privacy_level IN ('public','team','private','boss_only'));
ALTER TABLE IF NOT EXISTS sticky_notes ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'team' CHECK (privacy_level IN ('public','team','private','boss_only'));

-- Enable RLS
ALTER TABLE IF NOT EXISTS conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF NOT EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF NOT EXISTS sticky_notes ENABLE ROW LEVEL SECURITY;

-- Helper: evaluate role from GUC
CREATE OR REPLACE FUNCTION app_has_boss_access() RETURNS BOOLEAN LANGUAGE SQL IMMUTABLE AS $$
  SELECT COALESCE(current_setting('app.role', true) IN ('owner','admin'), false);
$$;

-- Policy: company isolation
CREATE POLICY IF NOT EXISTS conversations_company_isolation ON conversations
  USING (company_id IS NULL OR company_id::text = current_setting('app.company_id', true));

CREATE POLICY IF NOT EXISTS messages_company_isolation ON messages
  USING (company_id IS NULL OR company_id::text = current_setting('app.company_id', true));

CREATE POLICY IF NOT EXISTS sticky_notes_company_isolation ON sticky_notes
  USING (company_id IS NULL OR company_id::text = current_setting('app.company_id', true));

-- Policy: privacy enforcement
CREATE POLICY IF NOT EXISTS conversations_privacy ON conversations
  USING (
    privacy_level <> 'boss_only' OR app_has_boss_access()
  )
  WITH CHECK (
    company_id IS NULL OR company_id::text = current_setting('app.company_id', true)
  );

CREATE POLICY IF NOT EXISTS messages_privacy ON messages
  USING (
    privacy_level <> 'boss_only' OR app_has_boss_access()
  )
  WITH CHECK (
    company_id IS NULL OR company_id::text = current_setting('app.company_id', true)
  );

CREATE POLICY IF NOT EXISTS sticky_notes_privacy ON sticky_notes
  USING (
    privacy_level <> 'boss_only' OR app_has_boss_access()
  )
  WITH CHECK (
    company_id IS NULL OR company_id::text = current_setting('app.company_id', true)
  );

-- Optional: creator-only for private rows
CREATE OR REPLACE FUNCTION app_is_creator(created_by UUID) RETURNS BOOLEAN LANGUAGE SQL IMMUTABLE AS $$
  SELECT created_by::text = current_setting('app.user_id', true);
$$;

CREATE POLICY IF NOT EXISTS conversations_private_creator ON conversations
  USING (privacy_level <> 'private' OR app_is_creator(created_by));

CREATE POLICY IF NOT EXISTS messages_private_creator ON messages
  USING (privacy_level <> 'private' OR app_is_creator(created_by));
