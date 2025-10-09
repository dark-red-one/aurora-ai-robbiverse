#!/bin/bash
# Quick Empire Database Status Check
# Shows status of Vengeance (local) and Elephant (master)

echo "🏛️  ROBBIEVERSE EMPIRE DATABASE STATUS"
echo "========================================"
echo ""

echo "🎮 VENGEANCE (Local):"
echo "━━━━━━━━━━━━━━━━━━━━"
docker exec robbieverse-postgres psql -U robbie -d robbieverse -c "
SELECT 
  'companies' as table_name, COUNT(*) as rows FROM companies UNION ALL
  SELECT 'tests', COUNT(*) FROM tests UNION ALL
  SELECT 'credit_payments', COUNT(*) FROM credit_payments UNION ALL
  SELECT 'robbie_personality_state', COUNT(*) FROM robbie_personality_state
ORDER BY table_name;
" 2>/dev/null

echo ""
echo "🐘 ELEPHANT MASTER (aurora_unified):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker exec robbieverse-postgres sh -c "PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At psql -h aurora-postgres-u44170.vm.elestio.app -p 25432 -U postgres -d aurora_unified -c \"
SELECT 
  'companies' as table_name, COUNT(*) as rows FROM companies UNION ALL
  SELECT 'tests', COUNT(*) FROM tests UNION ALL
  SELECT 'credit_payments', COUNT(*) FROM credit_payments UNION ALL
  SELECT 'robbie_personality_state', COUNT(*) FROM robbie_personality_state
ORDER BY table_name;
\"" 2>/dev/null

echo ""
echo "💰 REVENUE STATUS:"
echo "━━━━━━━━━━━━━━━━━━"
docker exec robbieverse-postgres sh -c "PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At psql -h aurora-postgres-u44170.vm.elestio.app -p 25432 -U postgres -d aurora_unified -c \"
SELECT 
  SUM(amount_cents)/100.0 as total_revenue_dollars,
  COUNT(*) as total_payments,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_payments
FROM credit_payments;
\"" 2>/dev/null

echo ""
echo "🎭 PERSONALITY STATUS:"
echo "━━━━━━━━━━━━━━━━━━━━━━"
docker exec robbieverse-postgres sh -c "PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At psql -h aurora-postgres-u44170.vm.elestio.app -p 25432 -U postgres -d aurora_unified -c \"
SELECT 
  user_id,
  current_mood,
  attraction_level || '/11' as attraction,
  gandhi_genghis_level || '/10' as genghis,
  context->>'mode' as mode
FROM robbie_personality_state 
WHERE user_id = 'allan';
\"" 2>/dev/null

echo ""
echo "🔄 SYNC HEALTH:"
echo "━━━━━━━━━━━━━━━"
docker exec robbieverse-postgres sh -c "PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At psql -h aurora-postgres-u44170.vm.elestio.app -p 25432 -U postgres -d aurora_unified -c \"
SELECT 
  node_name,
  is_online,
  last_sync_success,
  total_syncs,
  health_status
FROM sync.empire_health
ORDER BY node_name;
\"" 2>/dev/null

echo ""
echo "📊 RECENT SYNC ACTIVITY:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━"
docker exec robbieverse-postgres sh -c "PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At psql -h aurora-postgres-u44170.vm.elestio.app -p 25432 -U postgres -d aurora_unified -c \"
SELECT 
  node_name,
  sync_type,
  status,
  rows_affected,
  completed_at
FROM sync.sync_log
ORDER BY started_at DESC
LIMIT 5;
\"" 2>/dev/null

echo ""
echo "✅ Status check complete!"

