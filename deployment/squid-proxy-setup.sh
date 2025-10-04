#!/bin/bash
# Aurora RobbieVerse - Squid Proxy Setup
# Transparent proxy with aggressive caching for speed and offline browsing

set -e

echo "🚀 Setting up Squid Transparent Proxy for Aurora RobbieVerse"
echo "=========================================================="

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is designed for macOS. Please adapt for your system."
    exit 1
fi

# Install Squid if not present
if ! command -v squid &> /dev/null; then
    echo "📦 Installing Squid proxy server..."
    if command -v brew &> /dev/null; then
        brew install squid
    else
        echo "❌ Homebrew not found. Please install Squid manually:"
        echo "   brew install squid"
        exit 1
    fi
else
    echo "✅ Squid is already installed"
fi

# Create Squid configuration directory
SQUID_DIR="/usr/local/etc/squid"
CACHE_DIR="/usr/local/var/cache/squid"
LOG_DIR="/usr/local/var/logs/squid"

echo "📁 Setting up Squid directories..."
sudo mkdir -p "$CACHE_DIR"
sudo mkdir -p "$LOG_DIR"
sudo chown -R $(whoami):staff "$CACHE_DIR"
sudo chown -R $(whoami):staff "$LOG_DIR"

# Create optimized Squid configuration
echo "⚙️  Creating optimized Squid configuration..."
sudo tee "$SQUID_DIR/squid.conf" > /dev/null << 'EOF'
# Aurora RobbieVerse - Optimized Squid Configuration
# Transparent proxy with aggressive caching

# Basic settings
http_port 3128 transparent
https_port 3129 transparent ssl-bump cert=/usr/local/etc/squid/ssl_cert.pem key=/usr/local/etc/squid/ssl_key.pem

# Cache settings - Aggressive caching for speed
cache_dir ufs /usr/local/var/cache/squid 2048 16 256
maximum_object_size 100 MB
maximum_object_size_in_memory 512 KB

# Memory settings
cache_mem 256 MB
memory_pools on
memory_pools_limit 64 MB

# Disk space settings
cache_swap_low 90
cache_swap_high 95

# Logging
access_log /usr/local/var/logs/squid/access.log squid
cache_log /usr/local/var/logs/squid/cache.log
pid_filename /usr/local/var/run/squid.pid

# Cache policies - Aggressive caching
refresh_pattern ^ftp:           1440    20%     10080
refresh_pattern ^gopher:        1440    0%      1440
refresh_pattern -i (/cgi-bin/|\?) 0     0%      0
refresh_pattern .               0       20%     4320

# Cache everything for offline browsing
refresh_pattern .               10080   90%     43200 override-expire override-lastmod ignore-no-cache ignore-no-store ignore-private

# ACL definitions
acl localnet src 192.168.0.0/16
acl localnet src 10.0.0.0/8
acl localnet src 172.16.0.0/12
acl localnet src fc00::/7
acl localnet src fe80::/10

acl SSL_ports port 443
acl Safe_ports port 80          # http
acl Safe_ports port 21          # ftp
acl Safe_ports port 443         # https
acl Safe_ports port 70          # gopher
acl Safe_ports port 210         # wais
acl Safe_ports port 1025-65535  # unregistered ports
acl Safe_ports port 280         # http-mgmt
acl Safe_ports port 488         # gss-http
acl Safe_ports port 591         # filemaker
acl Safe_ports port 777         # multiling http
acl CONNECT method CONNECT

# Access rules
http_access deny !Safe_ports
http_access deny CONNECT !SSL_ports
http_access allow localhost manager
http_access deny manager
http_access allow localnet
http_access allow localhost
http_access deny all

# Cache management
cache_mgr admin@aurora-robbiverse.local

# Performance tuning
client_persistent_connections on
server_persistent_connections on
pipeline_prefetch on

# SSL Bump for HTTPS caching
ssl_bump peek all
ssl_bump bump all

# Custom headers for better caching
request_header_replace User-Agent Aurora-RobbieVerse-Proxy/1.0

# Error pages
error_directory /usr/local/share/squid/errors/en

# Cache peer (optional - for additional speed)
# cache_peer parent.example.com parent 3128 0 no-query

# Log format
logformat custom %ts.%03tu %6tr %>a %Ss/%03>Hs %<st %rm %ru %[un %Sh/%<a %mt
access_log /usr/local/var/logs/squid/access.log custom

# Cache store log for offline browsing
store_id_program /usr/local/libexec/squid/storeid_file_rewrite
store_id_children 20 startup=10 idle=5 concurrency=0
EOF

# Create SSL certificate for HTTPS caching
echo "🔐 Creating SSL certificate for HTTPS caching..."
sudo mkdir -p /usr/local/etc/squid
cd /usr/local/etc/squid

# Generate self-signed certificate
sudo openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 \
    -subj "/C=US/ST=State/L=City/O=Aurora-RobbieVerse/CN=localhost" \
    -keyout ssl_key.pem -out ssl_cert.pem

sudo chown $(whoami):staff ssl_key.pem ssl_cert.pem
sudo chmod 600 ssl_key.pem
sudo chmod 644 ssl_cert.pem

# Create store ID program for better caching
echo "📝 Creating store ID program..."
sudo tee /usr/local/libexec/squid/storeid_file_rewrite > /dev/null << 'EOF'
#!/bin/bash
# Store ID program for better caching
echo "$1"
EOF

sudo chmod +x /usr/local/libexec/squid/storeid_file_rewrite

# Initialize cache directory
echo "🗂️  Initializing cache directory..."
sudo squid -z -f /usr/local/etc/squid/squid.conf

# Create startup script
echo "🚀 Creating startup script..."
sudo tee /usr/local/bin/start-squid-proxy > /dev/null << 'EOF'
#!/bin/bash
# Start Aurora RobbieVerse Squid Proxy

echo "🚀 Starting Aurora RobbieVerse Squid Proxy..."
echo "   Cache: /usr/local/var/cache/squid"
echo "   Logs:  /usr/local/var/logs/squid"
echo "   Port:  3128 (HTTP), 3129 (HTTPS)"
echo ""

# Start Squid
squid -f /usr/local/etc/squid/squid.conf -N -d 1
EOF

sudo chmod +x /usr/local/bin/start-squid-proxy

# Create stop script
echo "🛑 Creating stop script..."
sudo tee /usr/local/bin/stop-squid-proxy > /dev/null << 'EOF'
#!/bin/bash
# Stop Aurora RobbieVerse Squid Proxy

echo "🛑 Stopping Aurora RobbieVerse Squid Proxy..."
pkill -f "squid.*squid.conf" || true
echo "✅ Squid proxy stopped"
EOF

sudo chmod +x /usr/local/bin/stop-squid-proxy

# Create cache management script
echo "📊 Creating cache management script..."
sudo tee /usr/local/bin/squid-cache-stats > /dev/null << 'EOF'
#!/bin/bash
# Aurora RobbieVerse Squid Cache Statistics

echo "📊 Aurora RobbieVerse Squid Cache Statistics"
echo "============================================"

if [ -f /usr/local/var/run/squid.pid ]; then
    echo "🟢 Status: Running (PID: $(cat /usr/local/var/run/squid.pid))"
else
    echo "🔴 Status: Not running"
    exit 1
fi

echo ""
echo "💾 Cache Information:"
du -sh /usr/local/var/cache/squid 2>/dev/null || echo "   Cache directory not found"

echo ""
echo "📈 Cache Statistics:"
squidclient -h localhost -p 3128 mgr:info 2>/dev/null | grep -E "(cache|memory|disk)" || echo "   Unable to get statistics"

echo ""
echo "🌐 Recent Requests:"
tail -10 /usr/local/var/logs/squid/access.log 2>/dev/null || echo "   No access log found"
EOF

sudo chmod +x /usr/local/bin/squid-cache-stats

# Create browser configuration script
echo "🌐 Creating browser configuration script..."
sudo tee /usr/local/bin/configure-browser-proxy > /dev/null << 'EOF'
#!/bin/bash
# Configure browser to use Aurora RobbieVerse proxy

echo "🌐 Aurora RobbieVerse Browser Proxy Configuration"
echo "================================================"
echo ""
echo "To use the Aurora RobbieVerse proxy, configure your browser:"
echo ""
echo "📋 Manual Configuration:"
echo "   HTTP Proxy: 127.0.0.1:3128"
echo "   HTTPS Proxy: 127.0.0.1:3129"
echo "   SOCKS Proxy: Not configured"
echo ""
echo "🔧 Browser Settings:"
echo "   Chrome: Settings > Advanced > System > Open proxy settings"
echo "   Firefox: Settings > General > Network Settings > Settings"
echo "   Safari: System Preferences > Network > Advanced > Proxies"
echo ""
echo "🚀 Quick Start:"
echo "   1. Start proxy: start-squid-proxy"
echo "   2. Configure browser with above settings"
echo "   3. Browse normally - pages will be cached automatically"
echo "   4. Check stats: squid-cache-stats"
echo "   5. Stop proxy: stop-squid-proxy"
echo ""
echo "💡 Offline Browsing:"
echo "   - Cached pages will be available offline"
echo "   - Check /usr/local/var/cache/squid for cached content"
echo "   - Use 'squid-cache-stats' to see what's cached"
EOF

sudo chmod +x /usr/local/bin/configure-browser-proxy

# Create systemd service (if available)
if command -v launchctl &> /dev/null; then
    echo "🔧 Creating launchd service..."
    sudo tee /Library/LaunchDaemons/com.aurora-robbiverse.squid.plist > /dev/null << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.aurora-robbiverse.squid</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/squid</string>
        <string>-f</string>
        <string>/usr/local/etc/squid/squid.conf</string>
        <string>-N</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/usr/local/var/logs/squid/launchd.log</string>
    <key>StandardErrorPath</key>
    <string>/usr/local/var/logs/squid/launchd.error.log</string>
</dict>
</plist>
EOF

    echo "✅ Launchd service created (use 'sudo launchctl load' to enable)"
fi

echo ""
echo "🎉 Aurora RobbieVerse Squid Proxy Setup Complete!"
echo "================================================="
echo ""
echo "🚀 Quick Start:"
echo "   1. Start proxy:    start-squid-proxy"
echo "   2. Configure browser: configure-browser-proxy"
echo "   3. Check stats:    squid-cache-stats"
echo "   4. Stop proxy:     stop-squid-proxy"
echo ""
echo "📁 Files created:"
echo "   Config: /usr/local/etc/squid/squid.conf"
echo "   Cache:  /usr/local/var/cache/squid"
echo "   Logs:   /usr/local/var/logs/squid"
echo "   SSL:    /usr/local/etc/squid/ssl_*.pem"
echo ""
echo "🌐 Proxy Settings:"
echo "   HTTP:  127.0.0.1:3128"
echo "   HTTPS: 127.0.0.1:3129"
echo ""
echo "💡 Features:"
echo "   ✅ Aggressive caching for speed"
echo "   ✅ Offline browsing support"
echo "   ✅ HTTPS content caching"
echo "   ✅ Performance monitoring"
echo "   ✅ Automatic startup (optional)"
echo ""
echo "🔧 Next Steps:"
echo "   1. Run: start-squid-proxy"
echo "   2. Configure your browser with the proxy settings"
echo "   3. Start browsing - pages will be cached automatically!"









