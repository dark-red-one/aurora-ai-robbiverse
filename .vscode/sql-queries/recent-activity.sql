-- Recent activity (last 24 hours)
-- Check what's been added/updated recently
SELECT 
  'companies' as table_name,
  COUNT(*) as new_records
FROM companies 
WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 'tests', COUNT(*) 
FROM tests 
WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 'credit_payments', COUNT(*) 
FROM credit_payments 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY new_records DESC;

-- Latest entries across key tables
SELECT 'company' as type, name as description, created_at 
FROM companies 
ORDER BY created_at DESC 
LIMIT 5
UNION ALL
SELECT 'test', name, created_at 
FROM tests 
ORDER BY created_at DESC 
LIMIT 5
ORDER BY created_at DESC
LIMIT 10;

