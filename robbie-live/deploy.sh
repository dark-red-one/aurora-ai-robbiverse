#!/bin/bash

# Robbie Live - EASY Deploy Script

set -e

echo "🚀 Deploying Robbie Live to aurora.testpilot.ai..."

# Configuration
SERVER="155.138.194.222"  # Aurora server IP (correct!)
SERVER_USER="root"
REMOTE_PATH="/var/www/html/robbie-live"
LOCAL_PATH="$(dirname "$0")"

echo "📦 Preparing files..."

# Create icons directory if it doesn't exist
mkdir -p "$LOCAL_PATH/icons"

# Create placeholder icons if they don't exist
if [ ! -f "$LOCAL_PATH/icons/robbie-192.png" ]; then
    echo "⚠️  Creating placeholder icons..."
    # You can add actual icon generation here or copy existing ones
    touch "$LOCAL_PATH/icons/robbie-192.png"
    touch "$LOCAL_PATH/icons/robbie-512.png"
fi

echo "📤 Uploading to aurora..."

# Create remote directory
ssh ${SERVER_USER}@${SERVER} "mkdir -p $REMOTE_PATH"

# Upload all files
scp -r "$LOCAL_PATH"/* ${SERVER_USER}@${SERVER}:$REMOTE_PATH/

# Set correct permissions
ssh ${SERVER_USER}@${SERVER} "chown -R www-data:www-data $REMOTE_PATH && chmod -R 755 $REMOTE_PATH"

echo "🔄 Reloading nginx..."

# Test nginx config
ssh ${SERVER_USER}@${SERVER} "nginx -t"

# Reload nginx
ssh ${SERVER_USER}@${SERVER} "systemctl reload nginx"

echo ""
echo "✅✅✅ DEPLOYMENT SUCCESSFUL ✅✅✅"
echo ""
echo "URLs:"
echo "  Robbie Live: http://aurora.testpilot.ai/robbie-live/"
echo "  Or: http://45.32.194.172/robbie-live/"
echo ""
echo "Test it:"
echo "  curl -I http://aurora.testpilot.ai/robbie-live/"
echo ""
echo "🎉 Robbie Live is ready!"

