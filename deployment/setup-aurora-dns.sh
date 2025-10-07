#!/bin/bash
# Setup DNS for aurora.askrobbie.ai

echo "🔧 SETTING UP AURORA.ASKROBBIE.AI DNS"
echo "====================================="

# Configuration
AURORA_IP="45.32.194.172"
AURORA_USER="root"

echo "📋 DNS Configuration needed:"
echo "• Domain: aurora.askrobbie.ai"
echo "• IP: ${AURORA_IP}"
echo "• Type: A record"
echo ""

echo "🔧 Setting up nginx for aurora.askrobbie.ai..."
ssh ${AURORA_USER}@${AURORA_IP} << 'NGINX_SCRIPT'
    # Create nginx config for aurora.askrobbie.ai
    cat > /etc/nginx/sites-available/aurora-askrobbie << 'NGINX_CONFIG'
server {
    listen 80;
    server_name aurora.askrobbie.ai;
    
    location /chat {
        alias /var/www/html/chat;
        index index.html;
        try_files $uri $uri/ /chat/index.html;
        
        # Enable CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }
    
    location / {
        return 301 /chat;
    }
}
NGINX_CONFIG

    # Enable site
    ln -sf /etc/nginx/sites-available/aurora-askrobbie /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    echo "✅ Nginx configured for aurora.askrobbie.ai"
NGINX_SCRIPT

echo ""
echo "📋 DNS SETUP REQUIRED:"
echo "====================="
echo "1. Add A record: aurora.askrobbie.ai → ${AURORA_IP}"
echo "2. Wait for DNS propagation (5-15 minutes)"
echo "3. Test: https://aurora.askrobbie.ai/chat/"
echo ""
echo "🔧 Alternative: Use IP directly"
echo "• http://${AURORA_IP}/chat/"
echo "• Add to /etc/hosts: ${AURORA_IP} aurora.askrobbie.ai"
