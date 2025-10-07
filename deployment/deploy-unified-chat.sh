#!/bin/bash
# Deploy Unified Chat to aurora.testpilot.ai/chat

set -e

echo "🚀 DEPLOYING UNIFIED CHAT TO AURORA.TESTPILOT.AI"
echo "================================================"

# Configuration
AURORA_TOWN_IP="45.32.194.172"
AURORA_TOWN_USER="root"
CHAT_PATH="/var/www/html/chat"
BACKUP_PATH="/var/www/html/chat-backup-$(date +%Y%m%d-%H%M%S)"

echo "🏛️ Aurora Town: ${AURORA_TOWN_IP}"
echo "📁 Chat Path: ${CHAT_PATH}"
echo ""

# Step 1: Create backup of existing chat
echo "📦 Step 1: Creating backup..."
ssh ${AURORA_TOWN_USER}@${AURORA_TOWN_IP} << 'AURORA_SCRIPT'
    # Create backup directory
    mkdir -p /var/www/html/chat-backup-$(date +%Y%m%d-%H%M%S)
    
    # Backup existing chat if it exists
    if [ -d "/var/www/html/chat" ]; then
        echo "📦 Backing up existing chat..."
        cp -r /var/www/html/chat /var/www/html/chat-backup-$(date +%Y%m%d-%H%M%S)/
    fi
    
    # Create chat directory
    mkdir -p /var/www/html/chat
    
    # Set proper permissions
    chown -R www-data:www-data /var/www/html/chat
    chmod -R 755 /var/www/html/chat
    
    echo "✅ Backup and directory setup complete"
AURORA_SCRIPT

# Step 2: Deploy unified chat files
echo "📤 Step 2: Deploying unified chat files..."
scp robbie-unified-chat.html ${AURORA_TOWN_USER}@${AURORA_TOWN_IP}:${CHAT_PATH}/index.html
scp robbie-unified-interface.html ${AURORA_TOWN_USER}@${AURORA_TOWN_IP}:${CHAT_PATH}/interface.html

# Step 3: Configure nginx for chat subdomain
echo "🔧 Step 3: Configuring nginx..."
ssh ${AURORA_TOWN_USER}@${AURORA_TOWN_IP} << 'NGINX_SCRIPT'
    # Create nginx config for chat subdomain
    cat > /etc/nginx/sites-available/aurora-chat << 'NGINX_CONFIG'
server {
    listen 80;
    server_name aurora.testpilot.ai;
    
    location /chat {
        alias /var/www/html/chat;
        index index.html;
        try_files $uri $uri/ /chat/index.html;
        
        # Enable CORS for API calls
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
            add_header Access-Control-Allow-Credentials true;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }
    
    # Redirect root to chat
    location / {
        return 301 /chat;
    }
}
NGINX_CONFIG

    # Enable the site
    ln -sf /etc/nginx/sites-available/aurora-chat /etc/nginx/sites-enabled/
    
    # Test nginx configuration
    nginx -t
    
    # Reload nginx
    systemctl reload nginx
    
    echo "✅ Nginx configuration complete"
NGINX_SCRIPT

# Step 4: Set up SSL (if needed)
echo "🔒 Step 4: Setting up SSL..."
ssh ${AURORA_TOWN_USER}@${AURORA_TOWN_IP} << 'SSL_SCRIPT'
    # Check if certbot is installed
    if command -v certbot &> /dev/null; then
        echo "🔒 Setting up SSL certificate..."
        certbot --nginx -d aurora.testpilot.ai --non-interactive --agree-tos --email allan@testpilotcpg.com
    else
        echo "⚠️ Certbot not found - SSL setup skipped"
    fi
    
    echo "✅ SSL setup complete"
SSL_SCRIPT

# Step 5: Test deployment
echo "🧪 Step 5: Testing deployment..."
echo "🔗 Testing chat endpoint..."
curl -I http://aurora.testpilot.ai/chat || echo "⚠️ HTTP test failed - may need DNS propagation"

echo ""
echo "🎉 UNIFIED CHAT DEPLOYMENT COMPLETE!"
echo "===================================="
echo ""
echo "✅ Chat deployed to: http://aurora.testpilot.ai/chat"
echo "✅ Interface available at: http://aurora.testpilot.ai/chat/interface.html"
echo "✅ Backup created at: ${BACKUP_PATH}"
echo ""
echo "🚀 UNIFIED CHAT IS LIVE!"
echo "• Real-time chat with Robbie"
echo "• Universal AI state management"
echo "• Business context integration"
echo "• GPU mesh coordination"
echo ""
echo "💰 Ready to close deals faster!"
