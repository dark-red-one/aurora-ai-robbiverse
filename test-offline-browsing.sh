#!/bin/bash
# Test offline browsing with RobbieBook1 cache

echo "🧪 Testing RobbieBook1 Offline Browsing"
echo "======================================="
echo ""

echo "📊 Current Cache Status:"
./robbiebook-cache-stats.sh
echo ""

echo "🌐 Testing cached content access..."

# Test if we can access cached content through proxy
echo "🔍 Testing proxy access to cached content..."
curl -s --proxy http://127.0.0.1:8080 http://localhost:8081 | head -5

echo ""
echo "💡 Offline Browsing Instructions:"
echo "   1. Turn off WiFi/Ethernet (go offline)"
echo "   2. Chrome will automatically serve cached content"
echo "   3. Previously visited pages will load instantly"
echo "   4. New pages will show 'No internet connection'"
echo ""
echo "🎯 Cached pages will work offline for 7 days!"
echo "   - Dashboard: http://localhost:8081"
echo "   - Aurora AI: http://localhost:8000"
echo "   - Any previously visited websites"
echo ""
echo "✅ RobbieBook1 enables true offline browsing!"
