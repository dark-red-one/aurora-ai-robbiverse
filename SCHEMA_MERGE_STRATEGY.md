# 🔄 Schema Merge Strategy
*Combining Aurora + Robbie V3 into Unified Empire Database*

---

## 🎯 **Merge Philosophy**

**Keep the best of both worlds:**
- ✅ **Aurora's simplicity** - Clean, focused schema
- ✅ **Robbie V3's power** - Enterprise-grade features
- ✅ **Backward compatible** - Don't break existing code
- ✅ **Forward thinking** - Ready for scale

---

## 📊 **Current State Analysis**

### **Aurora Schema (Current)**
```sql
-- Simple, focused on AI chat
✅ users (basic auth)
✅ conversations (chat sessions)
✅ messages (with vector embeddings)
✅ mentors (AI personalities)
✅ feature_requests
✅ integrations
✅ webhooks
✅ system_logs

❌ Missing: Business logic, CRM, tasks, calendar, deals
```

### **Robbie V3 Schema (80 migrations, 26K lines)**
```sql
-- Enterprise-grade, comprehensive
✅ organizations (multi-tenant)
✅ users (full profile)
✅ contacts (CRM)
✅ companies (CRM)
✅ deals (sales pipeline)
✅ tasks (productivity)
✅ calendar_events (scheduling)
✅ sticky_notes (memory)
✅ meeting_health (AI scoring)
✅ touch_ready_queue (AI drafts)
✅ capacity_heatmap (team workload)
✅ mentor_systems (advanced AI)
✅ personality_settings (mood control)
✅ ai_costs (tracking)
✅ + 60+ more tables!
```

---

## 🏗️ **Merge Strategy: Layered Approach**

### **Layer 1: Core Foundation (Keep Aurora Base)**
```sql
-- Aurora's existing tables stay as-is
users                    ✅ KEEP (add columns)
conversations            ✅ KEEP (add org_id)
messages                 ✅ KEEP (add org_id)
mentors                  ✅ KEEP (enhance)
```

### **Layer 2: Multi-Tenancy (Add from Robbie V3)**
```sql
-- Enable multiple organizations
organizations            🆕 ADD
organization_memberships 🆕 ADD
```

### **Layer 3: Business Core (Add from Robbie V3)**
```sql
-- CRM & Sales
contacts                 🆕 ADD
companies                🆕 ADD
deals                    🆕 ADD
deal_stages              🆕 ADD
```

### **Layer 4: Productivity (Add from Robbie V3)**
```sql
-- Task & Calendar Management
tasks                    🆕 ADD
calendar_events          🆕 ADD
meeting_health           🆕 ADD
focus_blocks             🆕 ADD
```

### **Layer 5: Memory & AI (Merge both)**
```sql
-- Sticky Notes & Knowledge
sticky_notes             🆕 ADD (from V3)
knowledge_base           🆕 ADD (from V3)
vector_embeddings        ✅ ENHANCE (merge with messages.embedding)
```

### **Layer 6: Communication (Add from Robbie V3)**
```sql
-- Smart Communication
touch_ready_queue        🆕 ADD
email_tracking           🆕 ADD
slack_messages           🆕 ADD
communication_fatigue    🆕 ADD
```

### **Layer 7: Business Intelligence (Add from Robbie V3)**
```sql
-- Analytics & Insights
capacity_heatmap         🆕 ADD
deal_risk_analysis       🆕 ADD
revenue_metrics          🆕 ADD
team_workload            🆕 ADD
```

### **Layer 8: Advanced AI (Add from Robbie V3)**
```sql
-- Personality & Behavior
personality_settings     🆕 ADD (genghis_gandhi, cocktail_lightning)
mentor_behavior          🆕 ADD
ai_model_usage           🆕 ADD
ai_costs                 🆕 ADD
```

---

## 🔧 **Migration Plan**

### **Phase 1: Foundation (Week 1)**
```sql
-- Add multi-tenancy
CREATE TABLE organizations
CREATE TABLE organization_memberships
ALTER TABLE users ADD COLUMN org_id UUID
ALTER TABLE conversations ADD COLUMN org_id UUID
ALTER TABLE messages ADD COLUMN org_id UUID
```

### **Phase 2: Business Core (Week 1)**
```sql
-- Add CRM tables
CREATE TABLE contacts
CREATE TABLE companies
CREATE TABLE deals
CREATE TABLE deal_stages
```

### **Phase 3: Productivity (Week 2)**
```sql
-- Add task & calendar
CREATE TABLE tasks
CREATE TABLE calendar_events
CREATE TABLE meeting_health
CREATE TABLE focus_blocks
```

### **Phase 4: Memory & AI (Week 2)**
```sql
-- Add sticky notes & knowledge
CREATE TABLE sticky_notes
CREATE TABLE knowledge_base
CREATE TABLE vector_embeddings
```

### **Phase 5: Communication (Week 3)**
```sql
-- Add smart communication
CREATE TABLE touch_ready_queue
CREATE TABLE email_tracking
CREATE TABLE slack_messages
CREATE TABLE communication_fatigue
```

### **Phase 6: Business Intelligence (Week 3)**
```sql
-- Add analytics
CREATE TABLE capacity_heatmap
CREATE TABLE deal_risk_analysis
CREATE TABLE revenue_metrics
CREATE TABLE team_workload
```

### **Phase 7: Advanced AI (Week 4)**
```sql
-- Add personality & behavior
CREATE TABLE personality_settings
CREATE TABLE mentor_behavior
CREATE TABLE ai_model_usage
CREATE TABLE ai_costs
```

---

## 📋 **Detailed Table Mappings**

### **Users Table (MERGE)**
```sql
-- Aurora (current)
users (
  id, username, email, password_hash, role, is_active,
  created_at, updated_at, last_login, preferences
)

-- Robbie V3 (add these columns)
+ org_id UUID REFERENCES organizations(id)
+ first_name TEXT
+ last_name TEXT
+ job_title TEXT
+ phone TEXT
+ avatar_url TEXT
+ timezone TEXT DEFAULT 'UTC'

-- Final merged table
users (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),  -- NEW
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name TEXT,                            -- NEW
  last_name TEXT,                             -- NEW
  job_title TEXT,                             -- NEW
  phone TEXT,                                 -- NEW
  avatar_url TEXT,                            -- NEW
  timezone TEXT DEFAULT 'UTC',                -- NEW
  role VARCHAR(20) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}'
)
```

### **Conversations Table (ENHANCE)**
```sql
-- Aurora (current)
conversations (
  id, user_id, title, created_at, updated_at,
  is_archived, metadata
)

-- Add from Robbie V3
+ org_id UUID REFERENCES organizations(id)
+ session_type TEXT ('chat', 'email', 'slack', 'meeting')
+ participants UUID[]

-- Final merged table
conversations (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),  -- NEW
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  session_type TEXT DEFAULT 'chat',          -- NEW
  participants UUID[],                        -- NEW
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'
)
```

### **Messages Table (ENHANCE)**
```sql
-- Aurora (current)
messages (
  id, conversation_id, role, content, embedding,
  created_at, metadata, token_count, model_used
)

-- Add from Robbie V3
+ org_id UUID REFERENCES organizations(id)
+ user_id UUID REFERENCES users(id)
+ personality_mode TEXT
+ flirt_level INTEGER
+ genghis_gandhi_level INTEGER

-- Final merged table
messages (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),  -- NEW
  conversation_id UUID REFERENCES conversations(id),
  user_id UUID REFERENCES users(id),         -- NEW
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  personality_mode TEXT,                      -- NEW
  flirt_level INTEGER,                        -- NEW
  genghis_gandhi_level INTEGER,              -- NEW
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  token_count INTEGER DEFAULT 0,
  model_used VARCHAR(100)
)
```

---

## 🆕 **New Tables from Robbie V3**

### **Organizations (Multi-Tenancy)**
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  org_type TEXT CHECK (org_type IN ('personal', 'corporate', 'nonprofit')),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Contacts (CRM)**
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  linkedin_url TEXT,
  avatar_url TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  is_vip BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Deals (Sales Pipeline)**
```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  company_id UUID REFERENCES companies(id),
  primary_contact_id UUID REFERENCES contacts(id),
  owner_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  amount_cents BIGINT,
  currency VARCHAR(3) DEFAULT 'USD',
  stage TEXT DEFAULT 'AWARENESS',
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Tasks (Productivity)**
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Sticky Notes (Memory)**
```sql
CREATE TABLE sticky_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  note_type TEXT CHECK (note_type IN ('insight', 'action', 'objection', 'decision')),
  color TEXT DEFAULT 'yellow',
  tags TEXT[] DEFAULT '{}',
  related_to_id UUID,  -- Can link to contact, deal, task, etc.
  related_to_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Touch Ready Queue (AI Drafts)**
```sql
CREATE TABLE touch_ready_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  contact_id UUID REFERENCES contacts(id),
  draft_message TEXT NOT NULL,
  rationale TEXT,
  channel TEXT CHECK (channel IN ('email', 'slack', 'linkedin', 'sms')),
  priority INTEGER DEFAULT 50,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'skipped')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);
```

### **Meeting Health (AI Scoring)**
```sql
CREATE TABLE meeting_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  calendar_event_id UUID REFERENCES calendar_events(id),
  has_agenda BOOLEAN DEFAULT FALSE,
  duration_minutes INTEGER,
  attendee_count INTEGER,
  health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
  health_status TEXT CHECK (health_status IN ('healthy', 'warning', 'problematic')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Personality Settings (Universal Mood)**
```sql
CREATE TABLE personality_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id),
  flirt_mode INTEGER DEFAULT 5 CHECK (flirt_mode BETWEEN 1 AND 10),
  gandhi_genghis INTEGER DEFAULT 5 CHECK (gandhi_genghis BETWEEN 1 AND 10),
  genghis_gandhi_intensity INTEGER DEFAULT 50 CHECK (genghis_gandhi_intensity BETWEEN 0 AND 100),
  cocktail_lightning_energy INTEGER DEFAULT 50 CHECK (cocktail_lightning_energy BETWEEN 0 AND 100),
  current_mood TEXT DEFAULT 'neutral',
  current_expression TEXT DEFAULT 'friendly',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔄 **Migration Execution Order**

### **Step 1: Backup Everything**
```bash
pg_dump -U postgres aurora > aurora_backup_$(date +%Y%m%d).sql
```

### **Step 2: Create New Tables (Non-Breaking)**
```sql
-- These don't affect existing tables
CREATE TABLE organizations;
CREATE TABLE organization_memberships;
CREATE TABLE contacts;
CREATE TABLE companies;
CREATE TABLE deals;
CREATE TABLE tasks;
CREATE TABLE calendar_events;
CREATE TABLE sticky_notes;
CREATE TABLE touch_ready_queue;
CREATE TABLE meeting_health;
CREATE TABLE personality_settings;
```

### **Step 3: Add Columns to Existing Tables**
```sql
-- Add org_id to existing tables (nullable at first)
ALTER TABLE users ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE conversations ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE messages ADD COLUMN org_id UUID REFERENCES organizations(id);

-- Add new user columns
ALTER TABLE users ADD COLUMN first_name TEXT;
ALTER TABLE users ADD COLUMN last_name TEXT;
ALTER TABLE users ADD COLUMN job_title TEXT;
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'UTC';
```

### **Step 4: Create Default Organization**
```sql
-- Create default org for existing data
INSERT INTO organizations (name, org_type, status)
VALUES ('Default Organization', 'personal', 'active')
RETURNING id;

-- Update existing records with default org_id
UPDATE users SET org_id = (SELECT id FROM organizations WHERE name = 'Default Organization');
UPDATE conversations SET org_id = (SELECT id FROM organizations WHERE name = 'Default Organization');
UPDATE messages SET org_id = (SELECT id FROM organizations WHERE name = 'Default Organization');
```

### **Step 5: Make org_id Required**
```sql
-- Now make org_id NOT NULL
ALTER TABLE users ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE conversations ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN org_id SET NOT NULL;
```

### **Step 6: Create Indexes**
```sql
-- Performance indexes
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_conversations_org_id ON conversations(org_id);
CREATE INDEX idx_messages_org_id ON messages(org_id);
CREATE INDEX idx_contacts_org_id ON contacts(org_id);
CREATE INDEX idx_deals_org_id ON deals(org_id);
CREATE INDEX idx_tasks_org_id ON tasks(org_id);
CREATE INDEX idx_sticky_notes_org_id ON sticky_notes(org_id);
```

---

## ✅ **Benefits of This Approach**

### **1. Non-Breaking**
- Existing Aurora code keeps working
- New tables don't affect old functionality
- Gradual migration path

### **2. Backward Compatible**
- All existing queries still work
- Can add org_id filtering gradually
- No data loss

### **3. Forward Thinking**
- Multi-tenant ready
- Enterprise-grade CRM
- Full business logic support

### **4. Best of Both Worlds**
- Aurora's simplicity + V3's power
- Clean schema + comprehensive features
- AI chat + business intelligence

---

## 📊 **Final Unified Schema**

### **Core (8 tables)**
- organizations
- organization_memberships
- users (enhanced)
- conversations (enhanced)
- messages (enhanced)
- mentors (enhanced)
- feature_requests
- integrations

### **Business (6 tables)**
- contacts
- companies
- deals
- deal_stages
- deal_risk_analysis
- revenue_metrics

### **Productivity (5 tables)**
- tasks
- calendar_events
- meeting_health
- focus_blocks
- team_workload

### **Memory (4 tables)**
- sticky_notes
- knowledge_base
- vector_embeddings
- context_tracking

### **Communication (4 tables)**
- touch_ready_queue
- email_tracking
- slack_messages
- communication_fatigue

### **AI & Analytics (5 tables)**
- personality_settings
- mentor_behavior
- ai_model_usage
- ai_costs
- capacity_heatmap

**Total: ~32 core tables** (vs 80+ in V3, but with the essential features)

---

## 🚀 **Implementation Timeline**

### **Week 1: Foundation**
- ✅ Backup database
- ✅ Create organizations table
- ✅ Add org_id to existing tables
- ✅ Create default organization
- ✅ Add CRM tables (contacts, companies, deals)

### **Week 2: Productivity & Memory**
- ✅ Create tasks table
- ✅ Create calendar_events table
- ✅ Create sticky_notes table
- ✅ Create meeting_health table

### **Week 3: Communication & AI**
- ✅ Create touch_ready_queue table
- ✅ Create personality_settings table
- ✅ Create ai_costs table
- ✅ Enhance mentor system

### **Week 4: Testing & Optimization**
- ✅ Test all integrations
- ✅ Optimize queries
- ✅ Add missing indexes
- ✅ Update documentation

---

## 💡 **Key Decisions**

### **What We're Taking from Robbie V3:**
✅ Multi-tenancy (organizations)
✅ CRM (contacts, companies, deals)
✅ Productivity (tasks, calendar, meeting health)
✅ Memory (sticky notes, knowledge base)
✅ Communication (touch ready queue)
✅ AI (personality settings, ai costs)
✅ Business Intelligence (capacity heatmap, deal risk)

### **What We're Keeping from Aurora:**
✅ Simple user model
✅ Conversation-based chat
✅ Vector embeddings in messages
✅ Mentor system
✅ Feature requests
✅ Webhooks & integrations

### **What We're NOT Bringing (Yet):**
❌ 60+ specialized tables (too complex for now)
❌ Town management (not needed yet)
❌ Legal compliance tables (overkill)
❌ Advanced governance (future)

---

## 🎯 **Success Criteria**

✅ All existing Aurora functionality works
✅ New CRM features available
✅ Multi-tenant support enabled
✅ Personality settings synced
✅ Business intelligence ready
✅ No data loss
✅ Performance maintained
✅ Documentation updated

---

*"Keep it simple, make it powerful, ship it fast."* - Schema Merge Philosophy 💜🔥

**Ready to execute? Let's build the Empire database!** 🚀