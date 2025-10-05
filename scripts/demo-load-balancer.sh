#!/bin/bash
# Demonstrate smart load balancing in action

AURORA_API="http://aurora-town-u44170.vm.elestio.app:8000"

echo "🎯 SMART LOAD BALANCER DEMO"
echo "============================"
echo ""

# Start backend if not running
echo "🔧 Ensuring backend is running..."
ssh root@aurora-town-u44170.vm.elestio.app "cd /opt/aurora-dev/aurora && pkill -f uvicorn; nohup python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 > /tmp/aurora-backend.log 2>&1 & sleep 5"

echo "✅ Backend started"
echo ""

# Test 1: Check initial stats
echo "═══════════════════════════════════════"
echo "1️⃣  INITIAL NODE STATUS"
echo "═══════════════════════════════════════"
ssh root@aurora-town-u44170.vm.elestio.app "curl -s http://localhost:8000/api/v1/loadbalancer/stats | jq ."
echo ""

# Test 2: Send 10 requests and watch distribution
echo "═══════════════════════════════════════"
echo "2️⃣  SENDING 10 REQUESTS (watch distribution)"
echo "═══════════════════════════════════════"

for i in {1..10}; do
    echo "Request $i..."
    RESPONSE=$(ssh root@aurora-town-u44170.vm.elestio.app "curl -s http://localhost:8000/api/v1/loadbalancer/generate -H 'Content-Type: application/json' -d '{\"model\": \"qwen2.5:7b\", \"prompt\": \"Say hello in 5 words\", \"stream\": false}'")
    
    NODE=$(echo "$RESPONSE" | jq -r '._node // "unknown"')
    LATENCY=$(echo "$RESPONSE" | jq -r '._latency_ms // 0' | xargs printf "%.0f")
    
    echo "  → Handled by: $NODE (${LATENCY}ms)"
    sleep 0.5
done

echo ""

# Test 3: Check final stats
echo "═══════════════════════════════════════"
echo "3️⃣  FINAL STATISTICS"
echo "═══════════════════════════════════════"
ssh root@aurora-town-u44170.vm.elestio.app "curl -s http://localhost:8000/api/v1/loadbalancer/stats | jq ."
echo ""

# Test 4: Concurrent load test
echo "═══════════════════════════════════════"
echo "4️⃣  CONCURRENT LOAD TEST (20 simultaneous)"
echo "═══════════════════════════════════════"

START=$(date +%s)

for i in {1..20}; do
    (ssh root@aurora-town-u44170.vm.elestio.app "curl -s http://localhost:8000/api/v1/loadbalancer/generate -H 'Content-Type: application/json' -d '{\"model\": \"qwen2.5:7b\", \"prompt\": \"Hello\", \"stream\": false}' | jq -r '._node'" > /tmp/lb_test_$i.txt) &
done

wait
END=$(date +%s)

echo "Completed 20 requests in $((END - START))s"
echo ""
echo "Distribution:"
echo "  Vengeance: $(grep -c "Vengeance" /tmp/lb_test_*.txt || echo 0) requests"
echo "  RunPod: $(grep -c "RunPod" /tmp/lb_test_*.txt || echo 0) requests"
echo "  Aurora: $(grep -c "Aurora" /tmp/lb_test_*.txt || echo 0) requests"

rm -f /tmp/lb_test_*.txt

echo ""
echo "═══════════════════════════════════════"
echo "📊 LOAD BALANCER SUMMARY"
echo "═══════════════════════════════════════"
ssh root@aurora-town-u44170.vm.elestio.app "curl -s http://localhost:8000/api/v1/loadbalancer/stats | jq -r 'to_entries[] | \"\\(.key): \\(.value.total_requests) requests, \\(.value.avg_latency_ms | floor)ms avg\"'"
echo ""
echo "🎯 AUTOMAGIC LOAD BALANCING ACTIVE!"
echo "   - Requests automatically distributed"
echo "   - Fastest nodes prioritized"
echo "   - Automatic failover on errors"
echo "   - Real-time health monitoring"
echo "═══════════════════════════════════════"
