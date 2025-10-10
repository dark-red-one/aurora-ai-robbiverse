#!/bin/bash
# RobbieBook1.testpilot.ai - Aurora AI Empire
# Transparent Proxy Setup Script

echo "🤖 RobbieBook1.testpilot.ai - Aurora AI Empire"
echo "   Setting up Transparent Proxy with Aggressive Caching"
echo "=========================================================="

# Install required Python packages
echo "📦 Installing required packages..."
pip3 install aiohttp aiofiles

# Make proxy executable
chmod +x robbiebook-proxy.py

# Create cache directory
mkdir -p robbiebook_cache

# Create browser configuration script
echo "🌐 Creating browser configuration..."
cat > configure-robbiebook-browser.sh << 'EOF'
#!/bin/bash
echo "🌐 RobbieBook1.testpilot.ai Browser Configuration"
echo "================================================"
echo ""
echo "To use the RobbieBook1 proxy, configure your browser:"
echo ""
echo "📋 Proxy Settings:"
echo "   HTTP Proxy:  127.0.0.1:8080"
echo "   HTTPS Proxy: 127.0.0.1:8080"
echo "   SOCKS Proxy: Not configured"
echo ""
echo "🔧 Browser Configuration:"
echo ""
echo "Chrome:"
echo "   1. Open Chrome"
echo "   2. Go to Settings > Advanced > System"
echo "   3. Click 'Open proxy settings'"
echo "   4. Check 'Use a proxy server'"
echo "   5. Enter: 127.0.0.1:8080"
echo ""
echo "Firefox:"
echo "   1. Open Firefox"
echo "   2. Go to Settings > General > Network Settings"
echo "   3. Click 'Settings'"
echo "   4. Select 'Manual proxy configuration'"
echo "   5. HTTP Proxy: 127.0.0.1, Port: 8080"
echo "   6. Check 'Use this proxy server for all protocols'"
echo ""
echo "Safari:"
echo "   1. Open System Preferences > Network"
echo "   2. Select your connection > Advanced > Proxies"
echo "   3. Check 'Web Proxy (HTTP)'"
echo "   4. Enter: 127.0.0.1:8080"
echo ""
echo "🚀 Quick Start:"
echo "   1. Start proxy: python3 robbiebook-proxy.py"
echo "   2. Configure browser with above settings"
echo "   3. Browse normally - pages will be cached automatically"
echo "   4. Check cache: ls -la robbiebook_cache/"
echo ""
echo "💡 Features:"
echo "   ✅ Aggressive caching for speed"
echo "   ✅ Offline browsing support"
echo "   ✅ Compressed storage"
echo "   ✅ Cache statistics"
echo "   ✅ Transparent operation"
EOF

chmod +x configure-robbiebook-browser.sh

# Create start script
echo "🚀 Creating start script..."
cat > start-robbiebook-proxy.sh << 'EOF'
#!/bin/bash
echo "🤖 Starting RobbieBook1.testpilot.ai Proxy..."
echo "   Cache: ./robbiebook_cache"
echo "   Port: 8080"
echo "   Press Ctrl+C to stop"
echo ""
python3 robbiebook-proxy.py
EOF

chmod +x start-robbiebook-proxy.sh

# Create stop script
echo "🛑 Creating stop script..."
cat > stop-robbiebook-proxy.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping RobbieBook1.testpilot.ai Proxy..."
pkill -f "robbiebook-proxy.py" || true
echo "✅ Proxy stopped"
EOF

chmod +x stop-robbiebook-proxy.sh

# Create cache management script
echo "📊 Creating cache management script..."
cat > robbiebook-cache-stats.sh << 'EOF'
#!/bin/bash
echo "📊 RobbieBook1.testpilot.ai Cache Statistics"
echo "==========================================="

if pgrep -f "robbiebook-proxy.py" > /dev/null; then
    echo "🟢 Status: Running"
else
    echo "🔴 Status: Not running"
fi

echo ""
echo "💾 Cache Information:"
if [ -d "robbiebook_cache" ]; then
    cache_size=$(du -sh robbiebook_cache 2>/dev/null | cut -f1)
    cache_files=$(find robbiebook_cache -name "*.cache" | wc -l)
    echo "   Cache Size: $cache_size"
    echo "   Cached Files: $cache_files"
    
    echo ""
    echo "📁 Recent Cached Files:"
    find robbiebook_cache -name "*.cache" -type f -exec ls -la {} \; | head -10
else
    echo "   No cache directory found"
fi

echo ""
echo "🔧 Cache Management:"
echo "   Clear cache: rm -rf robbiebook_cache/*"
echo "   View cache: ls -la robbiebook_cache/"
echo "   Cache size: du -sh robbiebook_cache/"
EOF

chmod +x robbiebook-cache-stats.sh

echo ""
echo "🎉 RobbieBook1.testpilot.ai Proxy Setup Complete!"
echo "================================================="
echo ""
echo "🚀 Quick Start:"
echo "   1. Start proxy: ./start-robbiebook-proxy.sh"
echo "   2. Configure browser: ./configure-robbiebook-browser.sh"
echo "   3. Check stats: ./robbiebook-cache-stats.sh"
echo "   4. Stop proxy: ./stop-robbiebook-proxy.sh"
echo ""
echo "📁 Files created:"
echo "   robbiebook-proxy.py          - Main proxy server"
echo "   start-robbiebook-proxy.sh    - Start script"
echo "   stop-robbiebook-proxy.sh     - Stop script"
echo "   configure-robbiebook-browser.sh - Browser config guide"
echo "   robbiebook-cache-stats.sh    - Cache statistics"
echo "   robbiebook_cache/            - Cache directory"
echo ""
echo "🌐 Proxy Settings:"
echo "   HTTP/HTTPS: 127.0.0.1:8080"
echo ""
echo "💡 Features:"
echo "   ✅ Aggressive caching for speed"
echo "   ✅ Offline browsing support"
echo "   ✅ Compressed storage"
echo "   ✅ Real-time statistics"
echo "   ✅ Transparent operation"
echo ""
echo "🔧 Next Steps:"
echo "   1. Run: ./start-robbiebook-proxy.sh"
echo "   2. Configure your browser with proxy settings"
echo "   3. Start browsing - pages will be cached automatically!"
echo ""
echo "🤖 RobbieBook1.testpilot.ai is ready to accelerate your browsing!"









