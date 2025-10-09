-- Revenue summary from TestPilot CPG
-- Shows total revenue, payment counts, and trends
SELECT 
  SUM(amount) as total_revenue,
  COUNT(*) as total_payments,
  AVG(amount) as avg_payment,
  MIN(amount) as min_payment,
  MAX(amount) as max_payment,
  MIN(created_at) as first_payment,
  MAX(created_at) as last_payment
FROM credit_payments;

-- Revenue by company
SELECT 
  c.name as company_name,
  COUNT(cp.id) as payment_count,
  SUM(cp.amount) as total_spent,
  MAX(cp.created_at) as last_payment
FROM companies c
LEFT JOIN credit_payments cp ON c.id = cp.company_id
GROUP BY c.id, c.name
ORDER BY total_spent DESC NULLS LAST
LIMIT 20;

