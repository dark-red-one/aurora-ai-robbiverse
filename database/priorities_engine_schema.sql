-- =========================================
-- ROBBIE PRIORITIES ENGINE - DATABASE SCHEMA
-- =========================================

-- Main priorities queue table
CREATE TABLE IF NOT EXISTS priorities_queue (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(100) UNIQUE NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    task_category VARCHAR(50) NOT NULL,
    task_description TEXT NOT NULL,
    
    -- Scoring dimensions
    urgency_score DECIMAL(5,2) DEFAULT 0,
    impact_score DECIMAL(5,2) DEFAULT 0,
    effort_score DECIMAL(5,2) DEFAULT 0,
    context_score DECIMAL(5,2) DEFAULT 0,
    dependency_score DECIMAL(5,2) DEFAULT 0,
    personality_score DECIMAL(5,2) DEFAULT 0,
    total_score DECIMAL(5,2) DEFAULT 0,
    
    -- Metadata
    source VARCHAR(50) NOT NULL,
    source_id VARCHAR(200),
    deadline TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    executed_at TIMESTAMP,
    completed_at TIMESTAMP,
    eliminated_at TIMESTAMP,
    elimination_reason TEXT,
    
    -- Dependencies
    blocks_tasks TEXT[], -- Array of task_ids this blocks
    blocked_by_tasks TEXT[], -- Array of task_ids blocking this
    
    -- Learning
    success_rating INTEGER, -- 1-10 rating after completion
    execution_time INTEGER, -- Actual time taken (seconds)
    estimated_time INTEGER, -- Estimated time (seconds)
    
    -- User context
    user_id VARCHAR(50) DEFAULT 'allan',
    
    -- Indexes
    CONSTRAINT chk_status CHECK (status IN ('pending', 'executing', 'completed', 'eliminated', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_priorities_status ON priorities_queue(status);
CREATE INDEX IF NOT EXISTS idx_priorities_score ON priorities_queue(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_priorities_type ON priorities_queue(task_type);
CREATE INDEX IF NOT EXISTS idx_priorities_deadline ON priorities_queue(deadline);
CREATE INDEX IF NOT EXISTS idx_priorities_user ON priorities_queue(user_id);

-- Priorities history table (audit log)
CREATE TABLE IF NOT EXISTS priorities_history (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    score_before DECIMAL(5,2),
    score_after DECIMAL(5,2),
    reason TEXT,
    user_id VARCHAR(50) DEFAULT 'allan',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_history_task ON priorities_history(task_id);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON priorities_history(timestamp DESC);

-- Priorities eliminations table (smart deletion tracking)
CREATE TABLE IF NOT EXISTS priorities_eliminations (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(100) NOT NULL,
    elimination_type VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    detected_by VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) DEFAULT 'allan',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eliminations_type ON priorities_eliminations(elimination_type);
CREATE INDEX IF NOT EXISTS idx_eliminations_timestamp ON priorities_eliminations(timestamp DESC);

-- Priorities learning table (weight adjustments)
CREATE TABLE IF NOT EXISTS priorities_learning (
    id SERIAL PRIMARY KEY,
    task_type VARCHAR(50) NOT NULL,
    dimension VARCHAR(50) NOT NULL,
    weight_before DECIMAL(5,4) NOT NULL,
    weight_after DECIMAL(5,4) NOT NULL,
    reason TEXT,
    user_id VARCHAR(50) DEFAULT 'allan',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_task_type ON priorities_learning(task_type);
CREATE INDEX IF NOT EXISTS idx_learning_dimension ON priorities_learning(dimension);

-- Priorities weights table (current dimension weights)
CREATE TABLE IF NOT EXISTS priorities_weights (
    id SERIAL PRIMARY KEY,
    dimension VARCHAR(50) UNIQUE NOT NULL,
    weight DECIMAL(5,4) NOT NULL,
    user_id VARCHAR(50) DEFAULT 'allan',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default weights
INSERT INTO priorities_weights (dimension, weight) VALUES
    ('urgency', 0.30),
    ('impact', 0.25),
    ('effort', 0.15),
    ('context_relevance', 0.15),
    ('dependencies', 0.10),
    ('personality', 0.05)
ON CONFLICT (dimension) DO NOTHING;

-- Priorities execution log (what Robbie actually did)
CREATE TABLE IF NOT EXISTS priorities_execution_log (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(100) NOT NULL,
    action_taken TEXT NOT NULL,
    result TEXT,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    execution_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_end TIMESTAMP,
    duration_seconds INTEGER,
    user_id VARCHAR(50) DEFAULT 'allan'
);

CREATE INDEX IF NOT EXISTS idx_execution_task ON priorities_execution_log(task_id);
CREATE INDEX IF NOT EXISTS idx_execution_start ON priorities_execution_log(execution_start DESC);

-- Priorities context table (current user context)
CREATE TABLE IF NOT EXISTS priorities_context (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    context_type VARCHAR(50) NOT NULL,
    context_value TEXT NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 0.5,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_context_user ON priorities_context(user_id);
CREATE INDEX IF NOT EXISTS idx_context_type ON priorities_context(context_type);
CREATE INDEX IF NOT EXISTS idx_context_expires ON priorities_context(expires_at);

-- Priorities metrics table (daily/hourly stats)
CREATE TABLE IF NOT EXISTS priorities_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    metric_hour INTEGER,
    tasks_processed INTEGER DEFAULT 0,
    tasks_executed INTEGER DEFAULT 0,
    tasks_eliminated INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0,
    time_saved_minutes INTEGER DEFAULT 0,
    revenue_impact DECIMAL(10,2) DEFAULT 0,
    user_id VARCHAR(50) DEFAULT 'allan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metrics_date ON priorities_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_user ON priorities_metrics(user_id);

-- View for current pending tasks
CREATE OR REPLACE VIEW priorities_current_queue AS
SELECT 
    task_id,
    task_type,
    task_category,
    task_description,
    total_score,
    deadline,
    created_at,
    status
FROM priorities_queue
WHERE status = 'pending'
ORDER BY total_score DESC, deadline ASC NULLS LAST;

-- View for today's metrics
CREATE OR REPLACE VIEW priorities_today_metrics AS
SELECT 
    SUM(tasks_processed) as total_processed,
    SUM(tasks_executed) as total_executed,
    SUM(tasks_eliminated) as total_eliminated,
    SUM(tasks_failed) as total_failed,
    SUM(time_saved_minutes) as total_time_saved,
    SUM(revenue_impact) as total_revenue_impact
FROM priorities_metrics
WHERE metric_date = CURRENT_DATE;

-- Function to update task score
CREATE OR REPLACE FUNCTION update_task_score(
    p_task_id VARCHAR(100),
    p_urgency DECIMAL(5,2),
    p_impact DECIMAL(5,2),
    p_effort DECIMAL(5,2),
    p_context DECIMAL(5,2),
    p_dependency DECIMAL(5,2),
    p_personality DECIMAL(5,2)
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_total_score DECIMAL(5,2);
    v_old_score DECIMAL(5,2);
    v_urgency_weight DECIMAL(5,4);
    v_impact_weight DECIMAL(5,4);
    v_effort_weight DECIMAL(5,4);
    v_context_weight DECIMAL(5,4);
    v_dependency_weight DECIMAL(5,4);
    v_personality_weight DECIMAL(5,4);
BEGIN
    -- Get current score
    SELECT total_score INTO v_old_score
    FROM priorities_queue
    WHERE task_id = p_task_id;
    
    -- Get current weights
    SELECT weight INTO v_urgency_weight FROM priorities_weights WHERE dimension = 'urgency';
    SELECT weight INTO v_impact_weight FROM priorities_weights WHERE dimension = 'impact';
    SELECT weight INTO v_effort_weight FROM priorities_weights WHERE dimension = 'effort';
    SELECT weight INTO v_context_weight FROM priorities_weights WHERE dimension = 'context_relevance';
    SELECT weight INTO v_dependency_weight FROM priorities_weights WHERE dimension = 'dependencies';
    SELECT weight INTO v_personality_weight FROM priorities_weights WHERE dimension = 'personality';
    
    -- Calculate total score
    v_total_score := (
        p_urgency * v_urgency_weight +
        p_impact * v_impact_weight +
        p_effort * v_effort_weight +
        p_context * v_context_weight +
        p_dependency * v_dependency_weight +
        p_personality * v_personality_weight
    );
    
    -- Update task
    UPDATE priorities_queue
    SET 
        urgency_score = p_urgency,
        impact_score = p_impact,
        effort_score = p_effort,
        context_score = p_context,
        dependency_score = p_dependency,
        personality_score = p_personality,
        total_score = v_total_score,
        updated_at = CURRENT_TIMESTAMP
    WHERE task_id = p_task_id;
    
    -- Log history
    INSERT INTO priorities_history (task_id, action, score_before, score_after, reason)
    VALUES (p_task_id, 'score_update', v_old_score, v_total_score, 'Automatic score recalculation');
    
    RETURN v_total_score;
END;
$$ LANGUAGE plpgsql;

-- Function to eliminate task
CREATE OR REPLACE FUNCTION eliminate_task(
    p_task_id VARCHAR(100),
    p_elimination_type VARCHAR(50),
    p_reason TEXT,
    p_detected_by VARCHAR(50)
) RETURNS BOOLEAN AS $$
BEGIN
    -- Update task status
    UPDATE priorities_queue
    SET 
        status = 'eliminated',
        eliminated_at = CURRENT_TIMESTAMP,
        elimination_reason = p_reason
    WHERE task_id = p_task_id;
    
    -- Log elimination
    INSERT INTO priorities_eliminations (task_id, elimination_type, reason, detected_by)
    VALUES (p_task_id, p_elimination_type, p_reason, p_detected_by);
    
    -- Log history
    INSERT INTO priorities_history (task_id, action, reason)
    VALUES (p_task_id, 'eliminated', p_reason);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get top priority task
CREATE OR REPLACE FUNCTION get_top_priority_task(
    p_confidence_threshold DECIMAL(3,2) DEFAULT 0.7
) RETURNS TABLE (
    task_id VARCHAR(100),
    task_type VARCHAR(50),
    task_description TEXT,
    total_score DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pq.task_id,
        pq.task_type,
        pq.task_description,
        pq.total_score
    FROM priorities_queue pq
    WHERE pq.status = 'pending'
        AND pq.total_score >= (p_confidence_threshold * 10)
        AND (pq.blocked_by_tasks IS NULL OR array_length(pq.blocked_by_tasks, 1) = 0)
    ORDER BY pq.total_score DESC, pq.deadline ASC NULLS LAST
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_priorities_queue_updated_at
    BEFORE UPDATE ON priorities_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aurora_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aurora_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO aurora_app;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Priorities Engine schema created successfully!';
    RAISE NOTICE '📊 Tables: priorities_queue, priorities_history, priorities_eliminations, priorities_learning, priorities_weights, priorities_execution_log, priorities_context, priorities_metrics';
    RAISE NOTICE '🔧 Functions: update_task_score, eliminate_task, get_top_priority_task';
    RAISE NOTICE '👁️ Views: priorities_current_queue, priorities_today_metrics';
END $$;
