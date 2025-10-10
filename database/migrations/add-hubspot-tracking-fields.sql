-- Migration: Add HubSpot Integration Fields to website_activity
-- Enables cross-page tracking, HubSpot sync, and lead scoring
-- Date: 2025-10-10
-- ============================================

-- Add HubSpot tracking columns
ALTER TABLE website_activity ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE website_activity ADD COLUMN IF NOT EXISTS identified_email VARCHAR(255);
ALTER TABLE website_activity ADD COLUMN IF NOT EXISTS hubspot_contact_id VARCHAR(50);
ALTER TABLE website_activity ADD COLUMN IF NOT EXISTS hubspot_utk VARCHAR(255);
ALTER TABLE website_activity ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE website_activity ADD COLUMN IF NOT EXISTS synced_to_hubspot BOOLEAN DEFAULT false;
ALTER TABLE website_activity ADD COLUMN IF NOT EXISTS hubspot_engagement_id VARCHAR(50);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_website_activity_user_id ON website_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_website_activity_email ON website_activity(identified_email);
CREATE INDEX IF NOT EXISTS idx_website_activity_hsid ON website_activity(hubspot_contact_id);
CREATE INDEX IF NOT EXISTS idx_website_activity_sync ON website_activity(synced_to_hubspot) WHERE synced_to_hubspot = false;

-- Lead scoring function
CREATE OR REPLACE FUNCTION calculate_lead_score(p_user_id VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    visit_count INTEGER;
    total_time INTEGER;
    conversion_count INTEGER;
    page_count INTEGER;
BEGIN
    SELECT 
        COUNT(DISTINCT session_id),
        COALESCE(SUM(time_on_page_seconds), 0),
        COUNT(CASE WHEN converted = true THEN 1 END),
        COUNT(DISTINCT page_url)
    INTO visit_count, total_time, conversion_count, page_count
    FROM website_activity
    WHERE user_id = p_user_id;
    
    -- Scoring logic
    score := score + (visit_count * 10);       -- 10 points per visit
    score := score + (total_time / 60);        -- 1 point per minute on site
    score := score + (conversion_count * 50);  -- 50 points per conversion
    score := score + (page_count * 5);         -- 5 points per unique page
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Update all lead scores
CREATE OR REPLACE FUNCTION update_all_lead_scores()
RETURNS void AS $$
BEGIN
    UPDATE website_activity
    SET lead_score = calculate_lead_score(user_id)
    WHERE user_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update lead score on new activity
CREATE OR REPLACE FUNCTION update_lead_score_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        NEW.lead_score := calculate_lead_score(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lead_score ON website_activity;
CREATE TRIGGER trigger_update_lead_score
    BEFORE INSERT OR UPDATE ON website_activity
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_score_trigger();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ HubSpot integration fields added successfully!';
    RAISE NOTICE '📊 Columns: user_id, identified_email, hubspot_contact_id, hubspot_utk, lead_score';
    RAISE NOTICE '🎯 Lead scoring functions created and ready';
END $$;

