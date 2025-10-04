-- TestPilot Simulations Integration Schema
-- Links deals to TestPilot simulations and tracks simulation data

-- TestPilot Simulations table
CREATE TABLE IF NOT EXISTS testpilot_simulations (
    id SERIAL PRIMARY KEY,
    simulation_id VARCHAR(100) UNIQUE NOT NULL, -- Unique simulation identifier
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Simulation configuration
    simulation_type VARCHAR(100), -- deal_simulation, market_analysis, pricing_optimization, etc.
    simulation_config JSONB DEFAULT '{}', -- Configuration parameters
    target_deal_id INTEGER REFERENCES deals(id), -- Associated deal
    
    -- Town/Node separation
    owner_id VARCHAR(50), -- aurora, fluenti, collaboration
    
    -- Simulation status and timing
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed, cancelled
    progress_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_completion TIMESTAMP,
    
    -- Simulation results and data
    simulation_results JSONB DEFAULT '{}', -- Main simulation outputs
    simulation_metrics JSONB DEFAULT '{}', -- Performance metrics
    simulation_logs TEXT, -- Detailed execution logs
    
    -- AI analysis and insights
    ai_analysis JSONB DEFAULT '{}', -- AI-generated insights from simulation
    recommendations JSONB DEFAULT '[]', -- Actionable recommendations
    confidence_score NUMERIC(3,2), -- AI confidence in results (0-1)
    
    -- Resource usage
    gpu_usage_minutes INTEGER DEFAULT 0,
    cpu_usage_minutes INTEGER DEFAULT 0,
    memory_usage_mb INTEGER DEFAULT 0,
    cost_usd NUMERIC(10,4) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    created_by VARCHAR(100),
    tags TEXT[], -- For categorization and filtering
    is_active BOOLEAN DEFAULT true
);

-- Deal Simulation Associations
CREATE TABLE IF NOT EXISTS deal_simulations (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
    simulation_id INTEGER REFERENCES testpilot_simulations(id) ON DELETE CASCADE,
    association_type VARCHAR(50) DEFAULT 'primary', -- primary, secondary, comparison, validation
    
    -- Simulation impact on deal
    impact_score NUMERIC(3,2), -- How much this simulation affects the deal (0-1)
    recommendation_weight NUMERIC(3,2) DEFAULT 1.0, -- Weight for this simulation in recommendations
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(deal_id, simulation_id, association_type)
);

-- Simulation Scenarios (different versions of the same simulation)
CREATE TABLE IF NOT EXISTS simulation_scenarios (
    id SERIAL PRIMARY KEY,
    simulation_id INTEGER REFERENCES testpilot_simulations(id) ON DELETE CASCADE,
    scenario_name VARCHAR(255) NOT NULL,
    scenario_description TEXT,
    
    -- Scenario configuration
    scenario_config JSONB DEFAULT '{}', -- Specific parameters for this scenario
    scenario_type VARCHAR(100), -- optimistic, pessimistic, realistic, custom
    
    -- Scenario results
    scenario_results JSONB DEFAULT '{}',
    scenario_metrics JSONB DEFAULT '{}',
    
    -- Comparison data
    baseline_comparison JSONB DEFAULT '{}', -- How this compares to baseline
    best_case_comparison JSONB DEFAULT '{}', -- How this compares to best case
    worst_case_comparison JSONB DEFAULT '{}', -- How this compares to worst case
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(simulation_id, scenario_name)
);

-- Simulation Execution History (for tracking runs over time)
CREATE TABLE IF NOT EXISTS simulation_executions (
    id SERIAL PRIMARY KEY,
    simulation_id INTEGER REFERENCES testpilot_simulations(id) ON DELETE CASCADE,
    execution_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Execution details
    execution_type VARCHAR(50), -- full_run, incremental_update, validation_run
    execution_config JSONB DEFAULT '{}',
    
    -- Execution status
    status VARCHAR(50) DEFAULT 'running', -- running, completed, failed, cancelled
    progress_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Execution results
    execution_results JSONB DEFAULT '{}',
    execution_metrics JSONB DEFAULT '{}',
    execution_logs TEXT,
    
    -- Resource usage
    gpu_usage_minutes INTEGER DEFAULT 0,
    cpu_usage_minutes INTEGER DEFAULT 0,
    memory_usage_mb INTEGER DEFAULT 0,
    cost_usd NUMERIC(10,4) DEFAULT 0,
    
    -- Performance metrics
    execution_time_seconds INTEGER,
    data_points_processed INTEGER,
    accuracy_score NUMERIC(3,2),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Simulation Templates (reusable simulation configurations)
CREATE TABLE IF NOT EXISTS simulation_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) UNIQUE NOT NULL,
    template_description TEXT,
    template_category VARCHAR(100), -- deal_analysis, market_research, pricing, etc.
    
    -- Template configuration
    template_config JSONB NOT NULL DEFAULT '{}',
    required_parameters JSONB DEFAULT '[]', -- Required input parameters
    optional_parameters JSONB DEFAULT '[]', -- Optional input parameters
    
    -- Template metadata
    created_by VARCHAR(100),
    version VARCHAR(20) DEFAULT '1.0',
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Usage statistics
    usage_count INTEGER DEFAULT 0,
    success_rate NUMERIC(3,2) DEFAULT 0,
    average_execution_time INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add simulation fields to existing deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS simulation_status VARCHAR(50) DEFAULT 'none'; -- none, pending, simulated, optimized
ALTER TABLE deals ADD COLUMN IF NOT EXISTS simulation_results JSONB DEFAULT '{}';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS simulation_insights TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS simulation_recommendations JSONB DEFAULT '[]';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS simulation_confidence NUMERIC(3,2);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS last_simulation_date TIMESTAMP;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS simulation_count INTEGER DEFAULT 0;

-- Add simulation tracking to activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS simulation_id INTEGER REFERENCES testpilot_simulations(id);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS simulation_context JSONB DEFAULT '{}';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_testpilot_simulations_owner_id ON testpilot_simulations(owner_id);
CREATE INDEX IF NOT EXISTS idx_testpilot_simulations_status ON testpilot_simulations(status);
CREATE INDEX IF NOT EXISTS idx_testpilot_simulations_target_deal ON testpilot_simulations(target_deal_id);
CREATE INDEX IF NOT EXISTS idx_testpilot_simulations_type ON testpilot_simulations(simulation_type);
CREATE INDEX IF NOT EXISTS idx_testpilot_simulations_created_at ON testpilot_simulations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deal_simulations_deal_id ON deal_simulations(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_simulations_simulation_id ON deal_simulations(simulation_id);

CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_simulation_id ON simulation_scenarios(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_type ON simulation_scenarios(scenario_type);

CREATE INDEX IF NOT EXISTS idx_simulation_executions_simulation_id ON simulation_executions(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_executions_status ON simulation_executions(status);
CREATE INDEX IF NOT EXISTS idx_simulation_executions_started_at ON simulation_executions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_simulation_templates_category ON simulation_templates(template_category);
CREATE INDEX IF NOT EXISTS idx_simulation_templates_public ON simulation_templates(is_public, is_active);

-- Views for common queries
CREATE OR REPLACE VIEW active_simulations AS
SELECT 
    ts.*,
    d.deal_name,
    d.amount as deal_amount,
    d.dealstage,
    c.name as company_name
FROM testpilot_simulations ts
LEFT JOIN deals d ON ts.target_deal_id = d.id
LEFT JOIN companies c ON d.company_id = c.id
WHERE ts.is_active = true
ORDER BY ts.created_at DESC;

CREATE OR REPLACE VIEW simulation_analytics AS
SELECT 
    ts.owner_id as town,
    ts.simulation_type,
    COUNT(*) as total_simulations,
    COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as completed_simulations,
    COUNT(CASE WHEN ts.status = 'running' THEN 1 END) as running_simulations,
    COUNT(CASE WHEN ts.status = 'failed' THEN 1 END) as failed_simulations,
    AVG(ts.progress_percentage) as avg_progress,
    SUM(ts.cost_usd) as total_cost,
    AVG(ts.confidence_score) as avg_confidence
FROM testpilot_simulations ts
WHERE ts.is_active = true
GROUP BY ts.owner_id, ts.simulation_type
ORDER BY total_simulations DESC;

-- Functions for simulation management
CREATE OR REPLACE FUNCTION update_deal_simulation_status() RETURNS TRIGGER AS $$
BEGIN
    -- Update deal simulation status when simulation completes
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE deals SET
            simulation_status = 'simulated',
            simulation_results = NEW.simulation_results,
            simulation_insights = NEW.ai_analysis->>'summary',
            simulation_recommendations = NEW.recommendations,
            simulation_confidence = NEW.confidence_score,
            last_simulation_date = NEW.completed_at,
            simulation_count = simulation_count + 1
        WHERE id = NEW.target_deal_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_deal_on_simulation_complete
    AFTER UPDATE ON testpilot_simulations
    FOR EACH ROW EXECUTE FUNCTION update_deal_simulation_status();

-- Insert default simulation templates
INSERT INTO simulation_templates (template_name, template_description, template_category, template_config, created_by) VALUES
('Deal Probability Analysis', 'Analyzes deal probability based on historical data and current metrics', 'deal_analysis', 
 '{"analysis_type": "probability", "lookback_days": 365, "confidence_threshold": 0.8}', 'system'),
('Market Opportunity Assessment', 'Assesses market opportunity and competitive landscape for deals', 'market_research',
 '{"research_depth": "comprehensive", "competitor_analysis": true, "market_size_estimation": true}', 'system'),
('Pricing Optimization', 'Optimizes deal pricing based on market conditions and deal characteristics', 'pricing',
 '{"optimization_algorithm": "genetic", "constraints": {"min_margin": 0.2, "max_discount": 0.15}}', 'system'),
('Deal Velocity Prediction', 'Predicts deal velocity and optimal next steps', 'velocity_analysis',
 '{"prediction_horizon": 90, "factors": ["engagement", "competition", "timing"]}', 'system')
ON CONFLICT (template_name) DO NOTHING;
