#!/bin/bash
# Test Chrome proxy configuration

echo "🧪 Testing Chrome Proxy Configuration"
echo "====================================="

# Test 1: Check if proxy is working
echo "1️⃣ Testing proxy connection..."
if curl -s -x http://127.0.0.1:8080 -I http://httpbin.org/status/200 | grep -q "X-RobbieBook-Proxy"; then
    echo "   ✅ Proxy working correctly"
else
    echo "   ❌ Proxy not responding"
fi

# Test 2: Check cache performance
echo "2️⃣ Testing cache performance..."
echo "   First request (should be MISS):"
curl -s -x http://127.0.0.1:8080 -I http://httpbin.org/html | grep "X-Cache-Status"
echo "   Second request (should be HIT):"
curl -s -x http://127.0.0.1:8080 -I http://httpbin.org/html | grep "X-Cache-Status"

# Test 3: Check Aurora AI through proxy
echo "3️⃣ Testing Aurora AI through proxy..."
curl -s -x http://127.0.0.1:8080 http://localhost:8000/health | python3 -c "import sys,json; data=json.load(sys.stdin); print(f'   ✅ Aurora AI: {data[\"status\"]}')" 2>/dev/null || echo "   ❌ Aurora AI not accessible through proxy"

echo ""
echo "🎉 Chrome proxy testing complete!"
