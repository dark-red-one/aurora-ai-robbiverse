#!/bin/bash
# Direct deployment to aurora.askrobbie.ai/chat

echo "🚀 DEPLOYING TO AURORA.ASKROBBIE.AI/CHAT"
echo "======================================="

# Configuration
AURORA_IP="45.32.194.172"
AURORA_USER="root"
CHAT_PATH="/var/www/html/chat"

echo "📤 Uploading files..."
scp deployment/aurora-askrobbie-package/index.html ${AURORA_USER}@${AURORA_IP}:${CHAT_PATH}/index.html
scp deployment/aurora-askrobbie-package/avatar.html ${AURORA_USER}@${AURORA_IP}:${CHAT_PATH}/avatar.html
scp deployment/aurora-askrobbie-package/login.html ${AURORA_USER}@${AURORA_IP}:${CHAT_PATH}/login.html

echo "🔧 Configuring nginx..."
ssh ${AURORA_USER}@${AURORA_IP} << 'NGINX_SCRIPT'
    # Create nginx config
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
    echo "✅ Nginx configured"
NGINX_SCRIPT

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"
echo "✅ https://aurora.askrobbie.ai/chat/ is LIVE!"
echo "✅ Avatar: https://aurora.askrobbie.ai/chat/avatar.html"
echo "✅ Login: https://aurora.askrobbie.ai/chat/login.html"
echo ""
echo "🚀 UNIFIED CHAT IS LIVE ON AURORA.ASKROBBIE.AI!"
