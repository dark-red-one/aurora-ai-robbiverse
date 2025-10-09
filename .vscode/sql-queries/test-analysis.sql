-- Test analysis queries
-- Understand test patterns and performance

-- Tests by company
SELECT 
  c.name as company_name,
  COUNT(t.id) as test_count,
  COUNT(DISTINCT t.status) as unique_statuses,
  MAX(t.created_at) as latest_test
FROM companies c
LEFT JOIN tests t ON c.id = t.company_id
GROUP BY c.id, c.name
HAVING COUNT(t.id) > 0
ORDER BY test_count DESC;

-- Test variations per test
SELECT 
  t.name as test_name,
  t.status,
  COUNT(tv.id) as variation_count,
  t.created_at
FROM tests t
LEFT JOIN test_variations tv ON t.id = tv.test_id
GROUP BY t.id, t.name, t.status, t.created_at
ORDER BY t.created_at DESC
LIMIT 20;

-- Demographics coverage
SELECT 
  COUNT(DISTINCT test_id) as tests_with_demographics,
  COUNT(*) as total_demographic_rules
FROM test_demographics;

