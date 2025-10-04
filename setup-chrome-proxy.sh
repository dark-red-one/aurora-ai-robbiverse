#!/bin/bash
# RobbieBook1.testpilot.ai - Chrome Proxy Setup
# Configure Chrome to use RobbieBook1 transparent proxy

echo "🌐 RobbieBook1.testpilot.ai - Chrome Proxy Setup"
echo "   Configuring Chrome for Accelerated Browsing"
echo "=========================================================="

# Check if Chrome is installed
if [ ! -d "/Applications/Google Chrome.app" ]; then
    echo "❌ Chrome not found. Please install Google Chrome first."
    echo "   Download from: https://www.google.com/chrome/"
    exit 1
fi

echo "✅ Chrome found at /Applications/Google Chrome.app"

# Create Chrome proxy configuration
echo "⚙️  Creating Chrome proxy configuration..."

# Method 1: Chrome command line flags
echo "📋 Method 1: Launch Chrome with proxy flags"
echo "   Command:"
echo "   /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\"
echo "     --proxy-server=http://127.0.0.1:8080 \\"
echo "     --proxy-bypass-list='localhost,127.0.0.1' \\"
echo "     --disable-web-security \\"
echo "     --user-data-dir=/tmp/robbiebook-chrome-profile"
echo ""

# Create Chrome launcher script
cat > start-chrome-with-proxy.sh << 'EOF'
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
EOF

chmod +x start-chrome-with-proxy.sh

# Method 2: Chrome extension approach
echo "📋 Method 2: Chrome Proxy Extension"
echo "   Install 'Proxy SwitchyOmega' extension:"
echo "   1. Open Chrome"
echo "   2. Go to chrome://extensions/"
echo "   3. Enable Developer mode"
echo "   4. Search for 'Proxy SwitchyOmega'"
echo "   5. Install and configure:"
echo "      - Protocol: HTTP"
echo "      - Server: 127.0.0.1"
echo "      - Port: 8080"
echo ""

# Method 3: System proxy (macOS)
echo "📋 Method 3: System Proxy Configuration"
echo "   Configure macOS system proxy:"
echo "   1. System Preferences → Network"
echo "   2. Select your connection → Advanced → Proxies"
echo "   3. Check 'Web Proxy (HTTP)'"
echo "   4. Enter: 127.0.0.1:8080"
echo "   5. Check 'Secure Web Proxy (HTTPS)'"
echo "   6. Enter: 127.0.0.1:8080"
echo ""

# Create automated Chrome setup
cat > configure-chrome-automated.sh << 'EOF'
#!/bin/bash
# Automated Chrome proxy configuration

echo "🤖 Automated Chrome Proxy Configuration"
echo "========================================"

# Create Chrome preferences directory
CHROME_PREFS_DIR="$HOME/Library/Application Support/Google/Chrome/Default"
mkdir -p "$CHROME_PREFS_DIR"

# Backup existing preferences
if [ -f "$CHROME_PREFS_DIR/Preferences" ]; then
    cp "$CHROME_PREFS_DIR/Preferences" "$CHROME_PREFS_DIR/Preferences.backup.$(date +%s)"
    echo "✅ Backed up existing Chrome preferences"
fi

# Create proxy configuration
cat > "$CHROME_PREFS_DIR/Preferences" << 'CHROME_PREFS'
{
  "profile": {
    "default_content_setting_values": {
      "cookies": 1
    }
  },
  "proxy": {
    "mode": "fixed_servers",
    "server": "127.0.0.1:8080"
  },
  "robbiebook_proxy": {
    "enabled": true,
    "server": "127.0.0.1:8080",
    "bypass_list": "localhost,127.0.0.1",
    "setup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
CHROME_PREFS

echo "✅ Chrome proxy preferences configured"
echo "   Proxy: 127.0.0.1:8080"
echo "   Bypass: localhost,127.0.0.1"
EOF

chmod +x configure-chrome-automated.sh

# Create test script
cat > test-chrome-proxy.sh << 'EOF'
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
EOF

chmod +x test-chrome-proxy.sh

# Create Chrome shortcuts
echo "🔗 Creating Chrome shortcuts..."

# Create desktop shortcut
cat > ~/Desktop/RobbieBook1-Chrome.command << 'EOF'
#!/bin/bash
cd /Users/allanperetz/aurora-ai-robbiverse
./start-chrome-with-proxy.sh
EOF

chmod +x ~/Desktop/RobbieBook1-Chrome.command

echo "✅ Desktop shortcut created: RobbieBook1-Chrome.command"

echo ""
echo "🎉 Chrome Proxy Setup Complete!"
echo "================================="
echo ""
echo "🚀 Quick Start Options:"
echo ""
echo "Option 1 - Launch Chrome with Proxy:"
echo "   ./start-chrome-with-proxy.sh"
echo ""
echo "Option 2 - Automated Configuration:"
echo "   ./configure-chrome-automated.sh"
echo ""
echo "Option 3 - Test Configuration:"
echo "   ./test-chrome-proxy.sh"
echo ""
echo "Option 4 - Desktop Shortcut:"
echo "   Double-click 'RobbieBook1-Chrome.command' on Desktop"
echo ""
echo "🌐 What You'll Get:"
echo "   ✅ Accelerated browsing (all pages cached)"
echo "   ✅ Offline browsing (cached pages work without internet)"
echo "   ✅ Aurora AI integration (http://localhost:8000/docs)"
echo "   ✅ Real-time monitoring (http://localhost:8082)"
echo "   ✅ Transparent operation (works with all websites)"
echo ""
echo "🤖 RobbieBook1.testpilot.ai Chrome setup is ready!"









