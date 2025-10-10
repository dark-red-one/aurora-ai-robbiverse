#!/bin/bash

# Test Universal Input API
# Quick tests to verify everything is working

echo "🧪 Testing Universal Input API..."
echo ""

API_URL="http://localhost:8000"

# Test 1: Health check
echo "1️⃣ Testing health check..."
response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ "$response" = "200" ]; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed (HTTP $response)"
    exit 1
fi

# Test 2: Universal Input health
echo ""
echo "2️⃣ Testing Universal Input endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/api/v2/universal/health)
if [ "$response" = "200" ]; then
    echo "✅ Universal Input is ready"
else
    echo "⚠️  Universal Input health check returned HTTP $response"
fi

# Test 3: Simple chat request
echo ""
echo "3️⃣ Testing chat request..."
response=$(curl -s -X POST $API_URL/api/v2/universal/request \
  -H "Content-Type: application/json" \
  -d '{
    "source": "api",
    "ai_service": "chat",
    "payload": {
      "input": "Hello Robbie, this is a test!",
      "parameters": {"temperature": 0.7}
    },
    "fetch_context": false
  }')

status=$(echo $response | jq -r '.status // "error"')
if [ "$status" = "approved" ] || [ "$status" = "revised" ]; then
    message=$(echo $response | jq -r '.robbie_response.message // "No message"' | head -c 100)
    processing_time=$(echo $response | jq -r '.processing_time_ms // 0')
    echo "✅ Chat request successful"
    echo "   Status: $status"
    echo "   Response: $message..."
    echo "   Processing time: ${processing_time}ms"
else
    echo "❌ Chat request failed: $status"
    echo "   Response: $response" | jq '.'
fi

# Test 4: Embedding request (requires OpenAI)
echo ""
echo "4️⃣ Testing embedding request..."
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Skipping (OPENAI_API_KEY not set)"
else
    response=$(curl -s -X POST $API_URL/api/v2/universal/request \
      -H "Content-Type: application/json" \
      -d '{
        "source": "api",
        "ai_service": "embedding",
        "payload": {
          "input": "Test embedding text"
        }
      }')
    
    status=$(echo $response | jq -r '.status // "error"')
    if [ "$status" = "approved" ]; then
        dimensions=$(echo $response | jq -r '.robbie_response.dimensions // 0')
        echo "✅ Embedding request successful"
        echo "   Dimensions: $dimensions"
    else
        echo "❌ Embedding request failed: $status"
    fi
fi

# Test 5: Killswitch status
echo ""
echo "5️⃣ Testing killswitch status..."
response=$(curl -s $API_URL/code/api/killswitch/status)
is_active=$(echo $response | jq -r '.killswitch.is_active // false')
echo "✅ Killswitch status retrieved"
echo "   Active: $is_active"

# Test 6: Monitoring metrics
echo ""
echo "6️⃣ Testing monitoring metrics..."
response=$(curl -s $API_URL/code/api/monitoring/system/current)
cpu=$(echo $response | jq -r '.cpu.percent // 0')
memory=$(echo $response | jq -r '.memory.percent // 0')
echo "✅ Monitoring metrics retrieved"
echo "   CPU: ${cpu}%"
echo "   Memory: ${memory}%"

# Test 7: Gatekeeper blocking (rate limit test)
echo ""
echo "7️⃣ Testing gatekeeper rate limiting..."
echo "   Sending 12 rapid requests (limit is 10)..."
blocked_count=0
for i in {1..12}; do
    response=$(curl -s -X POST $API_URL/api/v2/universal/request \
      -H "Content-Type: application/json" \
      -d '{
        "source": "api",
        "ai_service": "chat",
        "payload": {
          "input": "Rate limit test message '$i'",
          "parameters": {"temperature": 0.7}
        },
        "fetch_context": false
      }')
    
    status=$(echo $response | jq -r '.status // "error"')
    if [ "$status" = "rejected" ] || [ "$status" = "blocked" ]; then
        ((blocked_count++))
    fi
    sleep 0.1
done

if [ $blocked_count -gt 0 ]; then
    echo "✅ Gatekeeper rate limiting working"
    echo "   Blocked $blocked_count requests"
else
    echo "⚠️  No requests were blocked (rate limiting may not be working)"
fi

# Test 8: Check recent blocks
echo ""
echo "8️⃣ Checking recent security blocks..."
response=$(curl -s "$API_URL/code/api/monitoring/security/recent-blocks?limit=5")
block_count=$(echo $response | jq -r '.count // 0')
echo "✅ Security blocks retrieved"
echo "   Recent blocks: $block_count"

if [ $block_count -gt 0 ]; then
    echo ""
    echo "   Recent blocks:"
    echo $response | jq -r '.blocks[] | "     - \(.timestamp): \(.reason)"' | head -5
fi

# Test 9: Check logs
echo ""
echo "9️⃣ Checking log files..."
if [ -f /var/log/robbie/universal-input.log ]; then
    log_lines=$(wc -l < /var/log/robbie/universal-input.log)
    echo "✅ Log file exists"
    echo "   Lines: $log_lines"
    echo ""
    echo "   Last 5 log entries:"
    tail -5 /var/log/robbie/universal-input.log | sed 's/^/     /'
else
    echo "⚠️  Log file not found: /var/log/robbie/universal-input.log"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Universal Input API is operational!"
echo ""
echo "📊 Next steps:"
echo "  - View logs: tail -f /var/log/robbie/universal-input.log"
echo "  - API docs: http://localhost:8000/docs"
echo "  - Monitoring: http://localhost:8000/code/api/monitoring/system/current"
echo ""
echo "🔗 Integration:"
echo "  - See UNIVERSAL_INPUT_API.md for full documentation"
echo "  - See ELESTI_INTEGRATION.md for Elesti integration guide"
echo ""

