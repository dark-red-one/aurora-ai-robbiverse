-- Analyze Tester Experience Feedback
-- Purpose: Identify top pain points from low-rating feedback before Walmart launch
-- Run this against: hykelmayopljuguuueme.supabase.co
-- ============================================
-- 1. LOW RATINGS ANALYSIS (1-2 stars)
-- ============================================
-- Get all low-rating feedback with comments
SELECT rating,
    comment,
    created_at,
    DATE(created_at) as feedback_date
FROM feedback
WHERE rating IN (1, 2)
    AND comment IS NOT NULL
    AND comment NOT IN ('.', 'NA', 'N/A', 'na', 'n/a', 'nothing', '')
ORDER BY created_at DESC;
-- ============================================
-- 2. RATING DISTRIBUTION
-- ============================================
-- See overall feedback distribution
SELECT rating,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM feedback
GROUP BY rating
ORDER BY rating;
-- ============================================
-- 3. TREND ANALYSIS (By Month)
-- ============================================
-- Track if feedback is improving or degrading over time
SELECT DATE_TRUNC('month', created_at) as month,
    AVG(rating) as avg_rating,
    COUNT(*) as total_feedback,
    COUNT(
        CASE
            WHEN rating <= 2 THEN 1
        END
    ) as low_ratings,
    COUNT(
        CASE
            WHEN rating >= 4 THEN 1
        END
    ) as high_ratings
FROM feedback
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
-- ============================================
-- 4. COMMON THEMES IN LOW RATINGS
-- ============================================
-- Manually categorize common complaints (run this and read comments)
SELECT rating,
    comment,
    CASE
        WHEN LOWER(comment) LIKE '%experience%'
        OR LOWER(comment) LIKE '%better%' THEN 'UX/Experience'
        WHEN LOWER(comment) LIKE '%study%'
        OR LOWER(comment) LIKE '%test%' THEN 'Study/Test Quality'
        WHEN LOWER(comment) LIKE '%price%'
        OR LOWER(comment) LIKE '%cost%'
        OR LOWER(comment) LIKE '%expensive%' THEN 'Pricing'
        WHEN LOWER(comment) LIKE '%slow%'
        OR LOWER(comment) LIKE '%loading%'
        OR LOWER(comment) LIKE '%wait%' THEN 'Performance'
        WHEN LOWER(comment) LIKE '%confus%'
        OR LOWER(comment) LIKE '%understand%' THEN 'Clarity/Instructions'
        WHEN LOWER(comment) LIKE '%bug%'
        OR LOWER(comment) LIKE '%error%'
        OR LOWER(comment) LIKE '%fail%' THEN 'Technical Issues'
        ELSE 'Other'
    END as issue_category
FROM feedback
WHERE rating IN (1, 2)
    AND comment IS NOT NULL
    AND comment NOT IN ('.', 'NA', 'N/A', 'na', 'n/a', 'nothing', '')
ORDER BY issue_category,
    created_at DESC;
-- ============================================
-- 5. RECENT FEEDBACK (Last 30 Days)
-- ============================================
-- Focus on recent feedback to identify current issues
SELECT rating,
    comment,
    created_at
FROM feedback
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    AND comment IS NOT NULL
    AND comment NOT IN ('.', 'NA', 'N/A', 'na', 'n/a', 'nothing', '')
ORDER BY rating ASC,
    created_at DESC;
-- ============================================
-- 6. HIGH-VALUE FEEDBACK (Detailed Comments)
-- ============================================
-- Find feedback with substantial comments (actionable insights)
SELECT rating,
    comment,
    LENGTH(comment) as comment_length,
    created_at
FROM feedback
WHERE LENGTH(comment) > 20 -- Substantial comments
    AND comment NOT IN ('.', 'NA', 'N/A', 'na', 'n/a', 'nothing', '')
ORDER BY rating ASC,
    comment_length DESC
LIMIT 50;
-- ============================================
-- 7. QUICK WINS - Top 3 Issues to Fix
-- ============================================
-- Summary for Allan: What needs fixing ASAP?
-- Run queries above, then manually create priority list based on:
-- 1. Frequency (how many testers mention it)
-- 2. Severity (low ratings)
-- 3. Recency (recent complaints)
-- 4. Fixability (can we fix before Oct 21?)
/*
 EXAMPLE OUTPUT FORMAT:
 
 TOP 3 ISSUES TO FIX BEFORE WALMART LAUNCH:
 
 1. [ISSUE NAME] - [FREQUENCY]
 - Example quotes: "..." / "..." / "..."
 - Fix: [Specific solution]
 - Effort: [Hours/Days]
 
 2. [ISSUE NAME] - [FREQUENCY]
 - Example quotes: "..." / "..." / "..."
 - Fix: [Specific solution]
 - Effort: [Hours/Days]
 
 3. [ISSUE NAME] - [FREQUENCY]
 - Example quotes: "..." / "..." / "..."
 - Fix: [Specific solution]
 - Effort: [Hours/Days]
 */
