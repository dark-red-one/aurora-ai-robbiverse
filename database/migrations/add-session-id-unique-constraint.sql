-- Migration: Add unique constraint to website_activity.session_id
-- Date: 2025-10-10
-- Purpose: Enable upsert logic in tracking API (ON CONFLICT DO UPDATE)

-- Add unique constraint to session_id if it doesn't exist
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_session_id' 
        AND conrelid = 'website_activity'::regclass
    ) THEN
        -- Add unique constraint
        ALTER TABLE website_activity 
        ADD CONSTRAINT unique_session_id UNIQUE (session_id);
        
        RAISE NOTICE 'Added unique constraint to website_activity.session_id';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on website_activity.session_id';
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_website_activity_session_id 
ON website_activity(session_id);

-- Create index for page_url filtering (for analytics queries)
CREATE INDEX IF NOT EXISTS idx_website_activity_page_url 
ON website_activity(page_url);

-- Create index for visited_at (for time-based queries)
CREATE INDEX IF NOT EXISTS idx_website_activity_visited_at 
ON website_activity(visited_at DESC);

-- Create index for conversions
CREATE INDEX IF NOT EXISTS idx_website_activity_converted 
ON website_activity(converted) 
WHERE converted = TRUE;

-- Summary
SELECT 
    'website_activity' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT session_id) as unique_sessions,
    SUM(CASE WHEN converted THEN 1 ELSE 0 END) as total_conversions
FROM website_activity;

-- Verify indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'website_activity'
ORDER BY indexname;

