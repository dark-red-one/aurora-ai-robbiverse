-- Data Sharing Strategy for Aurora AI Empire
-- Selective sharing: Some data shared, some private per town

-- Shared Data Tables (All towns can see)
CREATE TABLE IF NOT EXISTS shared_knowledge_base (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    category VARCHAR(100),
    tags TEXT[],
    source_town VARCHAR(50) NOT NULL, -- Which town created this
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT true, -- Can be made private
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}'
);

-- Shared enriched records (from data enrichment services)
CREATE TABLE IF NOT EXISTS shared_enriched_records (
    id SERIAL PRIMARY KEY,
    record_type VARCHAR(50) NOT NULL, -- company, contact, deal
    external_id VARCHAR(255) NOT NULL, -- HubSpot ID or other external ID
    enrichment_source VARCHAR(100), -- Clay, Apollo, etc.
    enrichment_data JSONB NOT NULL,
    enrichment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_town VARCHAR(50) NOT NULL, -- Which town enriched this
    shared_with TEXT[] DEFAULT '{}', -- Array of town names that can access
    is_public BOOLEAN DEFAULT true,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}'
);

-- Shared market intelligence
CREATE TABLE IF NOT EXISTS shared_market_intelligence (
    id SERIAL PRIMARY KEY,
    company_domain VARCHAR(255),
    company_name VARCHAR(255),
    intelligence_type VARCHAR(100), -- funding, news, hiring, etc.
    intelligence_data JSONB NOT NULL,
    confidence_score INTEGER DEFAULT 0,
    source_town VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT true,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}'
);

-- Town-specific private data (existing tables with owner_id)
-- These remain private to each town:
-- - companies (private deals, contacts, activities)
-- - contacts (private contact lists, engagement data)
-- - deals (private deal pipeline, amounts, stages)
-- - activities (private activity logs, emails, calls)

-- Data sharing views and functions

-- View for shared knowledge accessible to all towns
CREATE OR REPLACE VIEW shared_knowledge_all AS
SELECT 
    id,
    title,
    content,
    category,
    tags,
    source_town,
    created_by,
    created_at,
    updated_at,
    is_public,
    metadata
FROM shared_knowledge_base
WHERE is_public = true;

-- View for enriched records accessible to current town
CREATE OR REPLACE FUNCTION get_shared_enriched_records(current_town VARCHAR(50))
RETURNS TABLE (
    id INTEGER,
    record_type VARCHAR(50),
    external_id VARCHAR(255),
    enrichment_source VARCHAR(100),
    enrichment_data JSONB,
    enrichment_date TIMESTAMP,
    source_town VARCHAR(50),
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ser.id,
        ser.record_type,
        ser.external_id,
        ser.enrichment_source,
        ser.enrichment_data,
        ser.enrichment_date,
        ser.source_town,
        ser.metadata
    FROM shared_enriched_records ser
    WHERE ser.is_public = true 
       OR current_town = ANY(ser.shared_with)
       OR ser.source_town = current_town;
END;
$$ LANGUAGE plpgsql;

-- Cross-town analytics (Aurora can see all, others see shared only)
CREATE OR REPLACE VIEW cross_town_shared_analytics AS
SELECT 
    t.name as town_name,
    t.display_name,
    -- Private data counts (only Aurora sees all)
    CASE 
        WHEN t.name = 'aurora' THEN (SELECT COUNT(*) FROM companies WHERE owner_id = t.name)
        ELSE NULL
    END as private_company_count,
    CASE 
        WHEN t.name = 'aurora' THEN (SELECT COUNT(*) FROM contacts WHERE owner_id = t.name)
        ELSE NULL
    END as private_contact_count,
    CASE 
        WHEN t.name = 'aurora' THEN (SELECT COUNT(*) FROM deals WHERE owner_id = t.name)
        ELSE NULL
    END as private_deal_count,
    -- Shared data counts (all towns can see)
    (SELECT COUNT(*) FROM shared_knowledge_base WHERE source_town = t.name) as shared_knowledge_count,
    (SELECT COUNT(*) FROM shared_enriched_records WHERE source_town = t.name) as shared_enrichments_count,
    (SELECT COUNT(*) FROM shared_market_intelligence WHERE source_town = t.name) as market_intelligence_count
FROM towns t
WHERE t.is_active = true
ORDER BY t.name;

-- Function to share enriched data between towns
CREATE OR REPLACE FUNCTION share_enriched_data(
    p_record_type VARCHAR(50),
    p_external_id VARCHAR(255),
    p_enrichment_data JSONB,
    p_source_town VARCHAR(50),
    p_shared_with TEXT[] DEFAULT '{}'
) RETURNS INTEGER AS $$
DECLARE
    record_id INTEGER;
BEGIN
    INSERT INTO shared_enriched_records (
        record_type,
        external_id,
        enrichment_data,
        source_town,
        shared_with
    ) VALUES (
        p_record_type,
        p_external_id,
        p_enrichment_data,
        p_source_town,
        p_shared_with
    ) RETURNING id INTO record_id;
    
    RETURN record_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add shared knowledge
CREATE OR REPLACE FUNCTION add_shared_knowledge(
    p_title VARCHAR(500),
    p_content TEXT,
    p_category VARCHAR(100),
    p_tags TEXT[],
    p_source_town VARCHAR(50),
    p_created_by VARCHAR(50),
    p_is_public BOOLEAN DEFAULT true
) RETURNS INTEGER AS $$
DECLARE
    knowledge_id INTEGER;
BEGIN
    INSERT INTO shared_knowledge_base (
        title,
        content,
        category,
        tags,
        source_town,
        created_by,
        is_public
    ) VALUES (
        p_title,
        p_content,
        p_category,
        p_tags,
        p_source_town,
        p_created_by,
        p_is_public
    ) RETURNING id INTO knowledge_id;
    
    RETURN knowledge_id;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_knowledge_source_town ON shared_knowledge_base(source_town, is_public);
CREATE INDEX IF NOT EXISTS idx_shared_knowledge_embedding ON shared_knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50) WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shared_enriched_record_type ON shared_enriched_records(record_type, external_id);
CREATE INDEX IF NOT EXISTS idx_shared_enriched_shared_with ON shared_enriched_records USING gin (shared_with);
CREATE INDEX IF NOT EXISTS idx_shared_enriched_embedding ON shared_enriched_records USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50) WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shared_market_intel_domain ON shared_market_intelligence(company_domain);
CREATE INDEX IF NOT EXISTS idx_shared_market_intel_type ON shared_market_intelligence(intelligence_type);
CREATE INDEX IF NOT EXISTS idx_shared_market_intel_embedding ON shared_market_intelligence USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50) WHERE embedding IS NOT NULL;

-- Sample shared data
INSERT INTO shared_knowledge_base (title, content, category, source_town, created_by, is_public) VALUES
('Aurora AI Empire Architecture', 'Distributed AI consciousness with business automation across multiple GPU nodes.', 'architecture', 'aurora', 'allan', true),
('TestPilot Business Model', 'AI-powered sales automation and customer intelligence platform.', 'business', 'aurora', 'allan', true),
('GPU Mesh Networking', 'Distributed processing across Aurora, Fluenti, and Collaboration nodes.', 'infrastructure', 'aurora', 'allan', true)
ON CONFLICT DO NOTHING;
