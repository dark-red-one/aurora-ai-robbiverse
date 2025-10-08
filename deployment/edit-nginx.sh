#!/bin/bash
# Edit nginx configs with proper permissions
# Usage: ./edit-nginx.sh [config-file]

CONFIG_FILE="${1:-robbie-apps}"
CONFIG_PATH="/etc/nginx/sites-available/$CONFIG_FILE"

echo "🔧 Nginx Config Editor"
echo "======================"
echo "📁 Config: $CONFIG_FILE"
echo "📍 Path: $CONFIG_PATH"
echo ""

if [ ! -f "$CONFIG_PATH" ]; then
    echo "❌ Config file not found: $CONFIG_PATH"
    exit 1
fi

echo "📋 Current config preview (last 10 lines):"
echo 'fun2Gus!!!' | sudo -S tail -10 "$CONFIG_PATH"
echo ""

echo "💡 To edit this file:"
echo "1. Make your changes in a local file"
echo "2. Run: echo 'fun2Gus!!!' | sudo -S cp your-file $CONFIG_PATH"
echo "3. Test: echo 'fun2Gus!!!' | sudo -S nginx -t"
echo "4. Reload: echo 'fun2Gus!!!' | sudo -S systemctl reload nginx"
echo ""

echo "🛠️ Quick commands:"
echo "   Test config:    echo 'fun2Gus!!!' | sudo -S nginx -t"
echo "   Reload nginx:   echo 'fun2Gus!!!' | sudo -S systemctl reload nginx"
echo "   View config:    echo 'fun2Gus!!!' | sudo -S cat $CONFIG_PATH"
echo "   View logs:      echo 'fun2Gus!!!' | sudo -S tail -f /var/log/nginx/error.log"

