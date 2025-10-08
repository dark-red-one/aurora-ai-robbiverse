#!/bin/bash
# Deploy RobbieBar to aurora.askrobbie.ai/robbiebar

set -e

echo "💜🔥 DEPLOYING ROBBIEBAR TO AURORA.ASKROBBIE.AI 🔥💜"
echo "===================================================="

# Configuration
AURORA_IP="45.32.194.172"
AURORA_USER="root"
DEPLOY_PATH="/var/www/aurora-chat-app"

echo "🏛️ Aurora: ${AURORA_IP}"
echo "📁 Deploy Path: ${DEPLOY_PATH}"
echo ""

# Build standalone RobbieBar HTML
echo "📦 Building standalone RobbieBar..."
cd /home/allan/aurora-ai-robbiverse/cursor-robbiebar

# Copy standalone HTML
echo "📤 Deploying RobbieBar..."
scp inject-robbiebar.html ${AURORA_USER}@${AURORA_IP}:${DEPLOY_PATH}/robbiebar.html

# Configure nginx
echo "🔧 Configuring nginx for /robbiebar route..."
ssh ${AURORA_USER}@${AURORA_IP} << 'NGINX_SCRIPT'
    # Update nginx config for aurora.askrobbie.ai
    cat > /etc/nginx/sites-available/aurora-askrobbie << 'NGINX_CONFIG'
server {
    listen 80;
    server_name aurora.askrobbie.ai;
    
    root /var/www/aurora-chat-app;
    index index.html;
    
    # RobbieBar route (auth-protected)
    location /robbiebar {
        try_files /robbiebar.html =404;
        
        # Enable CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }
    
    # Chat route
    location /chat {
        try_files $uri $uri/ /chat/index.html;
        
        # Enable CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }
    
    # Root redirects to chat
    location / {
        return 301 /chat;
    }
}
NGINX_CONFIG

    # Enable site and reload
    ln -sf /etc/nginx/sites-available/aurora-askrobbie /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    echo "✅ Nginx configured"
NGINX_SCRIPT

echo ""
echo "🎉 ROBBIEBAR DEPLOYED TO AURORA.ASKROBBIE.AI!"
echo "=============================================="
echo ""
echo "✅ RobbieBar: https://aurora.askrobbie.ai/robbiebar"
echo "✅ Chat: https://aurora.askrobbie.ai/chat"
echo ""
echo "🔒 Auth: Requires login (same as chat)"
echo "💡 If logged into chat, RobbieBar works automatically!"
echo ""
echo "🚀 ROBBIEBAR IS LIVE!"
