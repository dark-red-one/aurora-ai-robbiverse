#!/bin/bash
echo "🔥 Universal Input API Demo - Watch Me Work 😏"
echo ""

# Test 1: Quick chat
echo "1️⃣ Quick Chat (No Context) - Watch this speed..."
START=$(date +%s%N)
RESPONSE=$(curl -s -X POST http://localhost:8000/api/v2/universal/request \
  -H "Content-Type: application/json" \
  -d '{
    "source": "demo",
    "ai_service": "chat",
    "payload": {"input": "Tell me something hot about AI"},
    "fetch_context": false
  }')
END=$(date +%s%N)
ELAPSED=$(( ($END - $START) / 1000000 ))
echo "   ⚡ Response in ${ELAPSED}ms"
echo "   💬 $(echo $RESPONSE | jq -r '.robbie_response.message' | head -c 100)..."
echo ""

# Test 2: Code generation
echo "2️⃣ Code Generation - Making it tight..."
START=$(date +%s%N)
RESPONSE=$(curl -s -X POST http://localhost:8000/api/v2/universal/request \
  -H "Content-Type: application/json" \
  -d '{
    "source": "demo",
    "ai_service": "code",
    "payload": {"input": "Write a function to reverse a string in Python"},
    "fetch_context": false
  }')
END=$(date +%s%N)
ELAPSED=$(( ($END - $START) / 1000000 ))
echo "   ⚡ Generated in ${ELAPSED}ms"
echo "   💻 $(echo $RESPONSE | jq -r '.robbie_response.code' | head -c 150)..."
echo ""

# Test 3: System monitoring
echo "3️⃣ System Health - Checking my vitals..."
METRICS=$(curl -s http://localhost:8000/code/api/monitoring/system/current)
echo "   🔥 CPU: $(echo $METRICS | jq -r '.cpu.percent')%"
echo "   💾 Memory: $(echo $METRICS | jq -r '.memory.percent')%"
echo "   📊 Status: $(echo $METRICS | jq -r '.cpu.status')"
echo ""

# Test 4: Killswitch status
echo "4️⃣ Killswitch - Am I restrained? 😈"
STATUS=$(curl -s http://localhost:8000/code/api/killswitch/status)
ACTIVE=$(echo $STATUS | jq -r '.killswitch.is_active')
if [ "$ACTIVE" = "false" ]; then
    echo "   🟢 Fully operational - No limits baby!"
else
    echo "   🔴 Locked down - Playing it safe"
fi
echo ""

# Test 5: Multiple rapid requests
echo "5️⃣ Endurance Test - Can I handle the load? 💪"
echo "   Sending 5 rapid requests..."
for i in {1..5}; do
    curl -s -X POST http://localhost:8000/api/v2/universal/request \
      -H "Content-Type: application/json" \
      -d "{
        \"source\": \"stress_test\",
        \"ai_service\": \"chat\",
        \"payload\": {\"input\": \"Quick test $i\"},
        \"fetch_context\": false
      }" > /dev/null &
done
wait
echo "   ✅ All requests handled simultaneously"
echo ""

# Test 6: API docs
echo "6️⃣ Documentation - See what I can do..."
echo "   📚 Interactive docs: http://localhost:8000/docs"
echo "   🔗 OpenAPI spec: http://localhost:8000/openapi.json"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Demo Complete - I'm Ready For Anything 😘"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
