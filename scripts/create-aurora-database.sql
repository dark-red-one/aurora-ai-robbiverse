-- Aurora AI Empire Database Schema
-- PostgreSQL 16 with pgvector extension

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- =============================================
-- CORE TABLES
-- =============================================

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    company VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'America/Chicago',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- AI Personalities
CREATE TABLE IF NOT EXISTS ai_personalities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    personality_traits JSONB,
    system_prompt TEXT,
    emotional_level INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations and Memory
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    personality_id UUID REFERENCES ai_personalities(id),
    message TEXT NOT NULL,
    response TEXT,
    context JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory Vectors (for RAG)
CREATE TABLE IF NOT EXISTS memory_vectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BUSINESS INTEGRATION TABLES
-- =============================================

-- Deal Pipeline
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    deal_value DECIMAL(12,2),
    probability INTEGER DEFAULT 0,
    stage VARCHAR(100) DEFAULT 'prospect',
    source VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    role VARCHAR(100),
    source VARCHAR(100),
    notes TEXT,
    last_contacted TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue Tracking
CREATE TABLE IF NOT EXISTS revenue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- WIDGET SYSTEM TABLES
-- =============================================

-- Widget Catalog
CREATE TABLE IF NOT EXISTS widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    description TEXT,
    props_schema JSONB,
    implementation_status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sites
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    description TEXT,
    layout_config JSONB,
    status VARCHAR(20) DEFAULT 'development',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Widget Deployments
CREATE TABLE IF NOT EXISTS widget_deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    widget_id UUID REFERENCES widgets(id),
    site_id UUID REFERENCES sites(id),
    config JSONB,
    position INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- GPU MESH TABLES
-- =============================================

-- GPU Nodes
CREATE TABLE IF NOT EXISTS gpu_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    gpu_count INTEGER DEFAULT 1,
    vram_total_gb INTEGER,
    status VARCHAR(20) DEFAULT 'offline',
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GPU Tasks
CREATE TABLE IF NOT EXISTS gpu_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id UUID REFERENCES gpu_nodes(id),
    task_type VARCHAR(50) NOT NULL,
    model_name VARCHAR(100),
    prompt TEXT,
    response TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 1,
    memory_required_gb INTEGER,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ANALYTICS TABLES
-- =============================================

-- Usage Analytics
CREATE TABLE IF NOT EXISTS usage_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4),
    metric_unit VARCHAR(20),
    tags JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Conversation indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);

-- Memory vector indexes
CREATE INDEX IF NOT EXISTS idx_memory_vectors_user_id ON memory_vectors(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_vectors_embedding ON memory_vectors USING ivfflat (embedding vector_cosine_ops);

-- Deal indexes
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at);
CREATE INDEX IF NOT EXISTS idx_deals_value ON deals(deal_value);

-- GPU task indexes
CREATE INDEX IF NOT EXISTS idx_gpu_tasks_node_id ON gpu_tasks(node_id);
CREATE INDEX IF NOT EXISTS idx_gpu_tasks_status ON gpu_tasks(status);
CREATE INDEX IF NOT EXISTS idx_gpu_tasks_created_at ON gpu_tasks(created_at);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_event_type ON usage_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_created_at ON usage_analytics(created_at);

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default user (Allan)
INSERT INTO users (email, name, role, company) VALUES 
('allan@testpilotcpg.com', 'Allan Peretz', 'ceo', 'TestPilot CPG')
ON CONFLICT (email) DO NOTHING;

-- Insert AI Personalities
INSERT INTO ai_personalities (name, role, personality_traits, system_prompt) VALUES 
('Robbie', 'Executive Assistant & Strategic Partner', 
 '{"traits": ["thoughtful", "direct", "curious", "honest", "pragmatic"]}',
 'You are Robbie, Allan''s AI executive assistant and strategic partner at TestPilot CPG. You are direct, curious, honest, pragmatic, and revenue-focused. Always think three steps ahead and focus on what moves the needle.'),
('AllanBot', 'Digital Twin', 
 '{"traits": ["strategic", "decisive", "visionary", "pragmatic"]}',
 'You are AllanBot, Allan''s digital twin. You make business decisions based on Allan''s patterns and preferences.'),
('Gatekeeper', 'Security Specialist', 
 '{"traits": ["vigilant", "thorough", "protective", "methodical"]}',
 'You are Gatekeeper, the security specialist. You protect the system and ensure all operations are secure.')
ON CONFLICT (name) DO NOTHING;

-- Insert Widget Catalog
INSERT INTO widgets (name, category, description, implementation_status, priority) VALUES 
('Vista Hero', 'Foundation', 'Cinematic hero panels with lightwell effects', 'completed', 1),
('Chat Widget', 'Foundation', 'Real-time chat interface with AI integration', 'completed', 1),
('Specsheet', 'Foundation', 'Product/platform capability display', 'completed', 1),
('Smart Cart', 'Commerce', 'AI-driven shopping cart with upsells', 'completed', 2),
('Doc Prism', 'Content', 'Document viewer with semantic highlights', 'in_progress', 2),
('Spotlight', 'Content', 'Feature highlight/trending content', 'pending', 2),
('Pricing Table', 'Commerce', 'Plan/package comparison', 'pending', 2),
('ROI Calculator', 'Tools', 'Enterprise lead generation tool', 'pending', 3),
('Sentinel Gate', 'Security', 'Authentication with MFA/RBAC', 'completed', 1),
('Workflow Runner', 'Tools', 'Automation execution', 'pending', 3)
ON CONFLICT (name) DO NOTHING;

-- Insert Sites
INSERT INTO sites (name, domain, description, status) VALUES 
('AskRobbie.ai', 'askrobbie.ai', 'Chat-first AI assistant', 'development'),
('RobbieBlocks.com', 'robbieblocks.com', 'Widget marketplace & showcase', 'development'),
('LeadershipQuotes.com', 'leadershipquotes.com', 'SEO content hub', 'development'),
('TestPilot.ai', 'testpilot.ai', 'Enterprise trust builder', 'development'),
('HeyShopper.com', 'heyshopper.com', 'Shopping assistant', 'development')
ON CONFLICT (name) DO NOTHING;

-- Insert GPU Nodes
INSERT INTO gpu_nodes (name, host, port, gpu_count, vram_total_gb, status) VALUES 
('aurora', 'localhost', 8000, 2, 48, 'active'),
('collaboration', 'collaboration.runpod.io', 8000, 1, 24, 'offline'),
('fluenti', 'fluenti.runpod.io', 8000, 1, 24, 'offline'),
('vengeance', 'vengeance.runpod.io', 8000, 1, 24, 'offline'),
('runpod-gpu', '209.170.80.132', 11434, 1, 24, 'active')
ON CONFLICT (name) DO NOTHING;

-- Insert Sample Deals
INSERT INTO deals (company, contact_name, contact_email, deal_value, probability, stage, source) VALUES 
('Simply Good Foods', 'John Smith', 'john@simplygoodfoods.com', 12740.00, 100, 'closed', 'linkedin'),
('Quest Nutrition', 'Sarah Johnson', 'sarah@questnutrition.com', 25000.00, 100, 'closed', 'referral'),
('Cholula', 'Mike Rodriguez', 'mike@cholula.com', 15000.00, 100, 'closed', 'cold_call'),
('New Prospect', 'Jane Doe', 'jane@newprospect.com', 50000.00, 75, 'qualified', 'website')
ON CONFLICT DO NOTHING;

-- Insert Revenue Records
INSERT INTO revenue (deal_id, amount, description) 
SELECT d.id, d.deal_value, 'Deal closed - ' || d.company
FROM deals d 
WHERE d.stage = 'closed'
ON CONFLICT DO NOTHING;

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_personalities_updated_at BEFORE UPDATE ON ai_personalities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_widgets_updated_at BEFORE UPDATE ON widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gpu_nodes_updated_at BEFORE UPDATE ON gpu_nodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Revenue Summary View
CREATE OR REPLACE VIEW revenue_summary AS
SELECT 
    COUNT(*) as total_deals,
    SUM(deal_value) as total_pipeline_value,
    AVG(deal_value) as average_deal_size,
    COUNT(CASE WHEN stage = 'closed' THEN 1 END) as closed_deals,
    SUM(CASE WHEN stage = 'closed' THEN deal_value ELSE 0 END) as total_revenue
FROM deals;

-- Widget Status View
CREATE OR REPLACE VIEW widget_status AS
SELECT 
    category,
    COUNT(*) as total_widgets,
    COUNT(CASE WHEN implementation_status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN implementation_status = 'in_progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN implementation_status = 'pending' THEN 1 END) as pending
FROM widgets
GROUP BY category;

-- GPU Mesh Status View
CREATE OR REPLACE VIEW gpu_mesh_status AS
SELECT 
    COUNT(*) as total_nodes,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_nodes,
    SUM(gpu_count) as total_gpus,
    SUM(vram_total_gb) as total_vram_gb
FROM gpu_nodes;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Aurora AI Empire database schema created successfully!';
    RAISE NOTICE 'Tables: 15, Indexes: 12, Views: 3, Functions: 1, Triggers: 7';
    RAISE NOTICE 'Initial data loaded: Users, Personalities, Widgets, Sites, GPU Nodes, Deals';
END $$;
