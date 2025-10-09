-- Quick database statistics
-- Use this to get a fast overview of key tables
SELECT 
  'companies' as table_name, COUNT(*) as rows FROM companies
UNION ALL
SELECT 'tests', COUNT(*) FROM tests
UNION ALL
SELECT 'credit_payments', COUNT(*) FROM credit_payments
UNION ALL
SELECT 'test_variations', COUNT(*) FROM test_variations
UNION ALL
SELECT 'test_demographics', COUNT(*) FROM test_demographics
UNION ALL
SELECT 'products', COUNT(*) FROM products
ORDER BY table_name;

