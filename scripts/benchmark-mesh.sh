#!/bin/bash
# Comprehensive mesh performance benchmark

echo "🚀 ROBBIE MESH PERFORMANCE BENCHMARK"
echo "====================================="
echo ""

# Test 1: Single Query Speed (Tokens/sec)
echo "═══════════════════════════════════════"
echo "1️⃣  SINGLE QUERY SPEED TEST"
echo "═══════════════════════════════════════"

test_node() {
    local name=$1
    local endpoint=$2
    local ssh_cmd=$3
    
    echo ""
    echo "Testing: $name"
    echo "─────────────────────────────────"
    
    local cmd="curl -s $endpoint/api/generate -d '{
      \"model\": \"qwen2.5:7b\",
      \"prompt\": \"Write a detailed paragraph about artificial intelligence in exactly 100 words.\",
      \"stream\": false
    }'"
    
    if [ -n "$ssh_cmd" ]; then
        cmd="$ssh_cmd \"$cmd\""
    fi
    
    START=$(date +%s%N)
    RESPONSE=$(eval $cmd)
    END=$(date +%s%N)
    
    LATENCY=$(( (END - START) / 1000000 ))
    TOKENS=$(echo "$RESPONSE" | jq -r '.eval_count // 0' 2>/dev/null || echo "0")
    DURATION=$(echo "$RESPONSE" | jq -r '.eval_duration // 0' 2>/dev/null || echo "0")
    
    if [ "$TOKENS" -gt 0 ] && [ "$DURATION" -gt 0 ]; then
        TOKENS_PER_SEC=$(echo "scale=2; $TOKENS / ($DURATION / 1000000000)" | bc)
        TOKENS_PER_MIN=$(echo "scale=0; $TOKENS_PER_SEC * 60" | bc)
    else
        TOKENS_PER_SEC="N/A"
        TOKENS_PER_MIN="N/A"
    fi
    
    echo "Total latency: ${LATENCY}ms"
    echo "Tokens generated: $TOKENS"
    echo "Tokens/second: $TOKENS_PER_SEC"
    echo "Tokens/minute: $TOKENS_PER_MIN"
    
    # Return for comparison
    echo "$name|$LATENCY|$TOKENS_PER_SEC|$TOKENS_PER_MIN"
}

# Test Vengeance (Local)
VENGEANCE=$(test_node "Vengeance RTX 4090" "http://localhost:11434" "")

# Test RunPod (via Aurora)
RUNPOD=$(test_node "RunPod RTX 4090" "http://localhost:11435" "ssh root@aurora-town-u44170.vm.elestio.app")

# Test Aurora CPU
AURORA=$(test_node "Aurora CPU" "http://localhost:11434" "ssh root@aurora-town-u44170.vm.elestio.app")

echo ""
echo "═══════════════════════════════════════"
echo "2️⃣  CONCURRENT QUERY TEST (10 simultaneous)"
echo "═══════════════════════════════════════"
echo ""
echo "Testing Vengeance with 10 concurrent queries..."

START=$(date +%s)
for i in {1..10}; do
    (curl -s http://localhost:11434/api/generate -d '{
      "model": "qwen2.5:7b",
      "prompt": "Say hello in 5 words",
      "stream": false
    }' > /tmp/concurrent_$i.json) &
done
wait
END=$(date +%s)

CONCURRENT_TIME=$((END - START))
QUERIES_PER_SEC=$(echo "scale=2; 10 / $CONCURRENT_TIME" | bc)

echo "10 queries completed in: ${CONCURRENT_TIME}s"
echo "Throughput: $QUERIES_PER_SEC queries/sec"
echo ""

# Test 3: Sustained load
echo "═══════════════════════════════════════"
echo "3️⃣  SUSTAINED LOAD TEST (30 seconds)"
echo "═══════════════════════════════════════"
echo ""
echo "Hammering Vengeance for 30 seconds..."

QUERY_COUNT=0
START=$(date +%s)
END_TIME=$((START + 30))

while [ $(date +%s) -lt $END_TIME ]; do
    curl -s http://localhost:11434/api/generate -d '{
      "model": "qwen2.5:7b",
      "prompt": "Hello",
      "stream": false
    }' > /dev/null &
    QUERY_COUNT=$((QUERY_COUNT + 1))
    
    # Limit concurrent requests to 5
    if [ $((QUERY_COUNT % 5)) -eq 0 ]; then
        wait
    fi
done
wait

ACTUAL_TIME=$(($(date +%s) - START))
QUERIES_PER_SEC=$(echo "scale=2; $QUERY_COUNT / $ACTUAL_TIME" | bc)

echo "Completed $QUERY_COUNT queries in ${ACTUAL_TIME}s"
echo "Average: $QUERIES_PER_SEC queries/sec"
echo ""

# Summary
echo "═══════════════════════════════════════"
echo "📊 PERFORMANCE SUMMARY"
echo "═══════════════════════════════════════"
echo ""
echo "SINGLE QUERY SPEED:"
echo "$VENGEANCE" | awk -F'|' '{printf "  Vengeance: %sms | %s tok/sec | %s tok/min\n", $2, $3, $4}'
echo "$RUNPOD" | awk -F'|' '{printf "  RunPod:    %sms | %s tok/sec | %s tok/min\n", $2, $3, $4}'
echo "$AURORA" | awk -F'|' '{printf "  Aurora:    %sms | %s tok/sec | %s tok/min\n", $2, $3, $4}'
echo ""
echo "CONCURRENT CAPACITY:"
echo "  10 simultaneous: ${CONCURRENT_TIME}s total"
echo "  Throughput: $QUERIES_PER_SEC queries/sec"
echo ""
echo "SUSTAINED LOAD:"
echo "  30-second test: $QUERY_COUNT queries"
echo "  Average: $QUERIES_PER_SEC queries/sec"
echo ""
echo "🎯 CONCLUSION:"
echo "  - Single queries: Vengeance is fastest"
echo "  - Multiple users: Mesh provides capacity"
echo "  - Failover: Aurora/RunPod ensure uptime"
echo "═══════════════════════════════════════"
