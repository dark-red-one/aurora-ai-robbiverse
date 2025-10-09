-- Slack integration schema

CREATE TABLE IF NOT EXISTS slack_workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  team_id TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS slack_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  email TEXT,
  aurora_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS slack_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, channel_id)
);

CREATE TABLE IF NOT EXISTS slack_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  user_id TEXT,
  text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, channel_id, ts)
);

CREATE INDEX IF NOT EXISTS idx_slack_messages_company ON slack_messages(company_id);
CREATE INDEX IF NOT EXISTS idx_slack_messages_channel ON slack_messages(channel_id);
