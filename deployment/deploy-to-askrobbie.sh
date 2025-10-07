#!/bin/bash
# Deploy unified chat to aurora.askrobbie.ai/chat

set -e

echo "🚀 DEPLOYING TO AURORA.ASKROBBIE.AI"
echo "=================================="

# Configuration
AURORA_IP="45.32.194.172"
AURORA_USER="root"
CHAT_PATH="/var/www/html/chat"

echo "🏛️ Aurora: ${AURORA_IP}"
echo "📁 Chat Path: ${CHAT_PATH}"
echo ""

# Deploy the correct unified chat files
echo "📤 Deploying unified chat files..."
scp robbie-unified-chat.html ${AURORA_USER}@${AURORA_IP}:${CHAT_PATH}/index.html
scp robbie-avatar-chat.html ${AURORA_USER}@${AURORA_IP}:${CHAT_PATH}/avatar.html
scp robbie-auth-gate.html ${AURORA_USER}@${AURORA_IP}:${CHAT_PATH}/login.html

# Configure nginx for aurora.askrobbie.ai
echo "🔧 Configuring nginx..."
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
echo "🎉 UNIFIED CHAT DEPLOYED TO AURORA.ASKROBBIE.AI!"
echo "==============================================="
echo ""
echo "✅ Main interface: https://aurora.askrobbie.ai/chat"
echo "✅ Avatar chat: https://aurora.askrobbie.ai/chat/avatar.html"
echo "✅ Login: https://aurora.askrobbie.ai/chat/login.html"
echo ""
echo "🎯 Features deployed:"
echo "• Matrix background animations"
echo "• Robbie avatar chat with mood changes"
echo "• Beautiful login form with animations"
echo "• Universal AI state management"
echo "• Real-time chat capabilities"
echo ""
echo "🚀 UNIFIED CHAT IS LIVE ON AURORA.ASKROBBIE.AI!"
