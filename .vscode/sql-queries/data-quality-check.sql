-- Data quality checks
-- Verify data integrity and completeness

-- Check for NULL values in key fields
SELECT 
  'companies with null name' as check_name,
  COUNT(*) as count
FROM companies WHERE name IS NULL
UNION ALL
SELECT 'tests with null company_id', COUNT(*)
FROM tests WHERE company_id IS NULL
UNION ALL
SELECT 'payments with null amount', COUNT(*)
FROM credit_payments WHERE amount IS NULL
UNION ALL
SELECT 'products with null name', COUNT(*)
FROM products WHERE name IS NULL;

-- Check referential integrity
SELECT 
  'tests with invalid company_id' as check_name,
  COUNT(*) as count
FROM tests t
LEFT JOIN companies c ON t.company_id = c.id
WHERE t.company_id IS NOT NULL AND c.id IS NULL
UNION ALL
SELECT 'payments with invalid company_id', COUNT(*)
FROM credit_payments cp
LEFT JOIN companies c ON cp.company_id = c.id
WHERE cp.company_id IS NOT NULL AND c.id IS NULL;

-- Data freshness
SELECT 
  'oldest company' as metric,
  MIN(created_at)::text as value
FROM companies
UNION ALL
SELECT 'newest company', MAX(created_at)::text
FROM companies
UNION ALL
SELECT 'oldest test', MIN(created_at)::text
FROM tests
UNION ALL
SELECT 'newest test', MAX(created_at)::text
FROM tests;

