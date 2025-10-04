#!/bin/bash
# RobbieBook1 Chrome Launcher with Proxy

echo "🚀 Starting Chrome with RobbieBook1 Proxy..."
echo "   Proxy: 127.0.0.1:8080"
echo "   Profile: /tmp/robbiebook-chrome-profile"
echo ""

# Kill any existing Chrome instances with our profile
pkill -f "robbiebook-chrome-profile" 2>/dev/null || true

# Start Chrome with proxy configuration
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --proxy-server=http://127.0.0.1:8080 \
  --proxy-bypass-list="localhost,127.0.0.1" \
  --disable-web-security \
  --user-data-dir=/tmp/robbiebook-chrome-profile \
  --new-window \
  --incognito \
  "http://localhost:8000/docs" \
  "http://localhost:8082" \
  "http://httpbin.org/status/200" &

echo "✅ Chrome started with RobbieBook1 proxy!"
echo "   - Aurora AI API: http://localhost:8000/docs"
echo "   - RobbieBook1 Dashboard: http://localhost:8082"
echo "   - Test Page: http://httpbin.org/status/200"
