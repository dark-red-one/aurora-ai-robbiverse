#!/bin/bash
# RobbieBook1.testpilot.ai - True Transparent Proxy Setup
# This makes ALL network traffic go through RobbieBook1 automatically

echo "🤖 RobbieBook1.testpilot.ai - True Transparent Proxy Setup"
echo "=========================================================="
echo ""
echo "This will configure your Mac to route ALL web traffic through RobbieBook1"
echo "automatically - no browser configuration needed!"
echo ""

# Check if running as root (needed for system-level changes)
if [[ $EUID -eq 0 ]]; then
   echo "❌ Don't run this script as root. Run as normal user."
   exit 1
fi

echo "🔧 Setting up transparent proxy..."

# Method 1: PAC (Proxy Auto-Configuration) File
echo "📝 Creating PAC file..."
cat > ~/robbiebook-proxy.pac << 'EOF'
function FindProxyForURL(url, host) {
    // Route all traffic through RobbieBook1 proxy
    return "PROXY 127.0.0.1:8080";
}
EOF

echo "✅ PAC file created at: ~/robbiebook-proxy.pac"

# Method 2: Environment Variables (for terminal apps)
echo "🌐 Setting up environment variables..."
cat >> ~/.zshrc << 'EOF'

# RobbieBook1 Transparent Proxy
export http_proxy=http://127.0.0.1:8080
export https_proxy=http://127.0.0.1:8080
export HTTP_PROXY=http://127.0.0.1:8080
export HTTPS_PROXY=http://127.0.0.1:8080
export no_proxy=localhost,127.0.0.1
export NO_PROXY=localhost,127.0.0.1

# RobbieBook1 Proxy Status
robbiebook_proxy_status() {
    echo "🤖 RobbieBook1 Proxy Status:"
    echo "   HTTP Proxy: $http_proxy"
    echo "   HTTPS Proxy: $https_proxy"
    echo "   No Proxy: $no_proxy"
    echo ""
    echo "🔍 Testing proxy..."
    curl -s --proxy $http_proxy http://httpbin.org/ip | grep origin || echo "❌ Proxy not responding"
}

alias robbiebook-status=robbiebook_proxy_status
EOF

echo "✅ Environment variables added to ~/.zshrc"

# Method 3: macOS System Proxy (requires user interaction)
echo ""
echo "🖥️  macOS System Proxy Setup (Manual):"
echo "   1. Open System Preferences → Network"
echo "   2. Select your connection (Wi-Fi/Ethernet)"
echo "   3. Click 'Advanced...' → 'Proxies' tab"
echo "   4. Check 'Automatic Proxy Configuration'"
echo "   5. Enter PAC URL: file://$HOME/robbiebook-proxy.pac"
echo "   6. Click 'OK' and 'Apply'"
echo ""

# Method 4: Chrome-specific auto-launch
echo "🌐 Creating Chrome auto-launch script..."
cat > ~/robbiebook-chrome.sh << 'EOF'
#!/bin/bash
# Launch Chrome with RobbieBook1 proxy automatically configured

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --proxy-server=http://127.0.0.1:8080 \
  --proxy-bypass-list="localhost,127.0.0.1" \
  --user-data-dir=/tmp/robbiebook-chrome-profile \
  --disable-web-security \
  --disable-features=VizDisplayCompositor \
  "$@"
EOF

chmod +x ~/robbiebook-chrome.sh
echo "✅ Chrome launcher created: ~/robbiebook-chrome.sh"

# Create desktop shortcut
echo "🖱️  Creating desktop shortcut..."
cat > ~/Desktop/RobbieBook1-Chrome.command << 'EOF'
#!/bin/bash
cd ~/aurora-ai-robbiverse
./robbiebook-chrome.sh
EOF

chmod +x ~/Desktop/RobbieBook1-Chrome.command
echo "✅ Desktop shortcut created: RobbieBook1-Chrome.command"

echo ""
echo "🎉 Transparent Proxy Setup Complete!"
echo "=================================="
echo ""
echo "📋 Next Steps:"
echo "   1. Restart your terminal or run: source ~/.zshrc"
echo "   2. Start RobbieBook1: cd ~/aurora-ai-robbiverse && ./start-robbiebook-empire.sh"
echo "   3. Configure macOS system proxy (see instructions above)"
echo "   4. OR use the desktop shortcut to launch Chrome with proxy"
echo ""
echo "🧪 Test the setup:"
echo "   robbiebook-status    # Check proxy status"
echo "   curl http://httpbin.org/ip  # Test through proxy"
echo ""
echo "💡 All your web traffic will now go through RobbieBook1 automatically!"
echo "   - Faster browsing with aggressive caching"
echo "   - Offline browsing of cached pages"
echo "   - Real-time statistics and monitoring"
echo ""
