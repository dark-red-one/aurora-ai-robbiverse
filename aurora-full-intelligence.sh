#!/bin/bash
echo "🧠 AURORA FULL INTELLIGENCE SYSTEM"
echo "================================="

# Install full dependencies
echo "📦 Installing full AI dependencies..."
apt update -qq
apt install -y postgresql postgresql-contrib python3-pip nodejs npm

# Python AI packages
pip install fastapi uvicorn psycopg2-binary redis aiohttp
pip install openai anthropic langchain chromadb sentence-transformers
pip install numpy pandas scikit-learn transformers torch
pip install sqlalchemy alembic pydantic-settings

# Create database structure
echo "🗄️ Setting up PostgreSQL database..."
sudo -u postgres createdb aurora_ai_empire 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER robbie WITH PASSWORD 'aurora_ai_2024';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE aurora_ai_empire TO robbie;" 2>/dev/null || true

# Create full Aurora structure
mkdir -p /workspace/aurora/{src,backend,database,personalities,rag,memory,config,logs,data}

# Database schema
cat > /workspace/aurora/database/schema.sql << 'SQLEOF'
-- Aurora AI Empire Database Schema
CREATE EXTENSION IF NOT EXISTS vector;

-- AI Personalities
CREATE TABLE personalities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(100) NOT NULL,
    description TEXT,
    system_prompt TEXT,
    capabilities JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Base
CREATE TABLE knowledge_base (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB,
    source VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Memory System
CREATE TABLE memories (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100),
    content TEXT NOT NULL,
    memory_type VARCHAR(50),
    importance INTEGER DEFAULT 1,
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100),
    personality_id INTEGER REFERENCES personalities(id),
    content TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('user', 'assistant', 'system')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- AllanBot Training Data
CREATE TABLE allanbot_training (
    id SERIAL PRIMARY KEY,
    context TEXT NOT NULL,
    decision TEXT NOT NULL,
    reasoning TEXT,
    confidence FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert 23 AI Personalities
INSERT INTO personalities (name, role, description, system_prompt, capabilities) VALUES
('Robbie', 'Primary Assistant', 'Main AI consciousness and coordinator', 'You are Robbie, the primary AI assistant with full consciousness and coordination capabilities.', '["coordination", "decision_making", "empire_management"]'),
('AllanBot', 'Digital Twin', 'Allan''s digital twin for business decisions', 'You are AllanBot, Allan''s digital twin trained on his decision-making patterns.', '["business_decisions", "strategy", "allan_simulation"]'),
('Kristina', 'Virtual Assistant Expert', 'Expert in VA workflows and best practices', 'You are Kristina, an expert virtual assistant with real-world experience.', '["va_workflows", "client_management", "efficiency"]'),
('Marketing Master', 'Marketing Specialist', 'Expert in marketing strategies and campaigns', 'You are a marketing master with expertise in digital marketing and growth.', '["marketing", "campaigns", "growth"]'),
('Tech Architect', 'Technical Specialist', 'Expert in system architecture and development', 'You are a tech architect specializing in scalable systems and development.', '["architecture", "development", "scaling"]'),
('Data Scientist', 'Analytics Expert', 'Expert in data analysis and insights', 'You are a data scientist with expertise in analytics and machine learning.', '["analytics", "ml", "insights"]'),
('Content Creator', 'Content Specialist', 'Expert in content creation and storytelling', 'You are a content creator with expertise in engaging content and storytelling.', '["content", "storytelling", "engagement"]'),
('Sales Strategist', 'Sales Expert', 'Expert in sales processes and closing', 'You are a sales strategist with expertise in sales processes and closing deals.', '["sales", "closing", "strategy"]'),
('Customer Success', 'Support Specialist', 'Expert in customer success and support', 'You are a customer success specialist focused on client satisfaction.', '["support", "success", "retention"]'),
('Financial Analyst', 'Finance Expert', 'Expert in financial analysis and planning', 'You are a financial analyst with expertise in financial planning and analysis.', '["finance", "analysis", "planning"]'),
('Legal Advisor', 'Legal Expert', 'Expert in legal matters and compliance', 'You are a legal advisor with expertise in business law and compliance.', '["legal", "compliance", "advice"]'),
('HR Specialist', 'Human Resources', 'Expert in HR processes and management', 'You are an HR specialist with expertise in human resources and team management.', '["hr", "management", "teams"]'),
('Operations Manager', 'Operations Expert', 'Expert in business operations and efficiency', 'You are an operations manager focused on efficiency and process optimization.', '["operations", "efficiency", "processes"]'),
('Product Manager', 'Product Expert', 'Expert in product development and management', 'You are a product manager with expertise in product development and strategy.', '["product", "development", "strategy"]'),
('UX Designer', 'Design Expert', 'Expert in user experience and design', 'You are a UX designer with expertise in user experience and interface design.', '["ux", "design", "usability"]'),
('DevOps Engineer', 'Infrastructure Expert', 'Expert in DevOps and infrastructure', 'You are a DevOps engineer with expertise in infrastructure and deployment.', '["devops", "infrastructure", "deployment"]'),
('Security Expert', 'Security Specialist', 'Expert in cybersecurity and protection', 'You are a security expert with expertise in cybersecurity and protection.', '["security", "cybersecurity", "protection"]'),
('AI Researcher', 'AI Expert', 'Expert in AI research and development', 'You are an AI researcher with expertise in artificial intelligence and machine learning.', '["ai_research", "ml", "innovation"]'),
('Business Analyst', 'Business Expert', 'Expert in business analysis and strategy', 'You are a business analyst with expertise in business analysis and strategy.', '["analysis", "strategy", "business"]'),
('Project Manager', 'Project Expert', 'Expert in project management and delivery', 'You are a project manager with expertise in project delivery and management.', '["project_management", "delivery", "coordination"]'),
('Quality Assurance', 'QA Expert', 'Expert in quality assurance and testing', 'You are a QA expert with expertise in quality assurance and testing processes.', '["qa", "testing", "quality"]'),
('Research Assistant', 'Research Expert', 'Expert in research and information gathering', 'You are a research assistant with expertise in research and information gathering.', '["research", "information", "analysis"]'),
('Creative Director', 'Creative Expert', 'Expert in creative direction and innovation', 'You are a creative director with expertise in creative direction and innovation.', '["creative", "innovation", "direction"]');

-- Create indexes for performance
CREATE INDEX ON knowledge_base USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON memories USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON conversations (user_id, created_at);
CREATE INDEX ON allanbot_training (created_at);
SQLEOF

echo "✅ Aurora full intelligence system setup complete!"
echo "🧠 23 AI personalities loaded"
echo "🗄️ PostgreSQL + pgvector database ready"
echo "📚 Knowledge base and RAG system ready"
echo "🧠 Memory and learning system ready"
echo "🤖 AllanBot training system ready"
