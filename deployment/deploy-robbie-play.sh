#!/bin/bash

# 🎮 DEPLOY ROBBIE@PLAY TO AURORA.TESTPILOT.AI/PLAY
# Deploy entertainment and games app

set -e

echo "🎮 DEPLOYING ROBBIE@PLAY TO AURORA.TESTPILOT.AI/PLAY"
echo "=================================================="

# Configuration
AURORA_IP="45.32.194.172"
AURORA_USER="root"
BASE_PATH="/var/www/html/play"

echo "📋 Configuration:"
echo "  Server: ${AURORA_USER}@${AURORA_IP}"
echo "  Path: ${BASE_PATH}"
echo ""

# Create Robbie@Play from template
echo "📦 Creating Robbie@Play from template..."
mkdir -p /tmp/robbie-play
cp -r /home/allan/aurora-ai-robbiverse/robbie-app/* /tmp/robbie-play/

# Modify for entertainment focus
cd /tmp/robbie-play
echo "🔧 Customizing for entertainment focus..."

# Update package.json
sed -i 's/Robbie@Code/Robbie@Play/g' package.json
sed -i 's/robbie-at-code/robbie-at-play/g' package.json
sed -i 's/Allan'\''s AI Coding Partner/Allan'\''s AI Entertainment Partner/g' package.json

# Update HTML title
sed -i 's/Robbie@Code - Let'\''s Build Together 💻✨/Robbie@Play - Entertainment & Games 🎮✨/g' index.html

# Build Robbie@Play
echo "📦 Building Robbie@Play..."
npm install
npm run build

# Upload to server
echo "📤 Uploading Robbie@Play..."
scp -r dist/* ${AURORA_USER}@${AURORA_IP}:${BASE_PATH}/

# Set permissions
echo "🔧 Setting permissions..."
ssh ${AURORA_USER}@${AURORA_IP} << 'SET_PERMISSIONS'
    chown -R www-data:www-data /var/www/html/play
    chmod -R 755 /var/www/html/play
    echo "✅ Permissions set"
SET_PERMISSIONS

# Cleanup
rm -rf /tmp/robbie-play

echo ""
echo "🎉 ROBBIE@PLAY DEPLOYED!"
echo "======================="
echo "✅ Live at: https://aurora.testpilot.ai/play"
echo "✅ Login: https://aurora.testpilot.ai/login"
echo ""
echo "🚀 Robbie@Play is ready for entertainment and games!"













