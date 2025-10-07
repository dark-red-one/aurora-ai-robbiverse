#!/bin/bash
# Deploy unified chat to Aurora Town when it comes online

set -e

echo "🚀 AURORA UNIFIED CHAT DEPLOYMENT"
echo "================================="

AURORA_TOWN_IP="45.32.194.172"
AURORA_TOWN_USER="root"
CHAT_PATH="/var/www/html/chat"

echo "🏛️ Aurora Town: ${AURORA_TOWN_IP}"
echo "📁 Chat Path: ${CHAT_PATH}"
echo ""

# Wait for Aurora Town to come online
echo "⏳ Waiting for Aurora Town to come online..."
while ! ping -c 1 ${AURORA_TOWN_IP} > /dev/null 2>&1; do
    echo "⏳ Aurora Town not reachable, waiting 30 seconds..."
    sleep 30
done

echo "✅ Aurora Town is online!"

# Create chat directory
echo "📁 Creating chat directory..."
ssh ${AURORA_TOWN_USER}@${AURORA_TOWN_IP} << 'AURORA_SCRIPT'
    mkdir -p /var/www/html/chat
    chown -R www-data:www-data /var/www/html/chat
    chmod -R 755 /var/www/html/chat
    echo "✅ Chat directory created"
AURORA_SCRIPT

# Deploy unified interface
echo "📤 Deploying unified interface..."
scp robbie-unified-interface.html ${AURORA_TOWN_USER}@${AURORA_TOWN_IP}:${CHAT_PATH}/index.html
scp robbie-avatar-chat.html ${AURORA_TOWN_USER}@${AURORA_TOWN_IP}:${CHAT_PATH}/avatar.html
scp robbie-auth-gate.html ${AURORA_TOWN_USER}@${AURORA_TOWN_IP}:${CHAT_PATH}/login.html

# Configure nginx
echo "🔧 Configuring nginx..."
ssh ${AURORA_TOWN_USER}@${AURORA_TOWN_IP} << 'NGINX_SCRIPT'
    # Create nginx config for chat
    cat > /etc/nginx/sites-available/aurora-chat << 'NGINX_CONFIG'
server {
    listen 80;
    server_name aurora.testpilot.ai;
    
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
    ln -sf /etc/nginx/sites-available/aurora-chat /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    echo "✅ Nginx configured"
NGINX_SCRIPT

echo ""
echo "🎉 AURORA UNIFIED CHAT DEPLOYED!"
echo "==============================="
echo ""
echo "✅ Main interface: http://aurora.testpilot.ai/chat"
echo "✅ Avatar chat: http://aurora.testpilot.ai/chat/avatar.html"
echo "✅ Login: http://aurora.testpilot.ai/chat/login.html"
echo ""
echo "🎯 Features deployed:"
echo "• Matrix background animations"
echo "• Avatar chat interface"
echo "• Login/authentication system"
echo "• Multitabbed interface"
echo "• Real-time chat capabilities"
echo ""
echo "🚀 UNIFIED CHAT IS LIVE ON AURORA!"
