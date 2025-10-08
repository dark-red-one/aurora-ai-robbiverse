#!/bin/bash

# 💻 DEPLOY ROBBIE@CODE TO AURORA.TESTPILOT.AI/CODE
# Deploy coding assistant with personality

set -e

echo "💻 DEPLOYING ROBBIE@CODE TO AURORA.TESTPILOT.AI/CODE"
echo "================================================="

# Configuration
AURORA_IP="45.32.194.172"
AURORA_USER="root"
BASE_PATH="/var/www/html/code"

echo "📋 Configuration:"
echo "  Server: ${AURORA_USER}@${AURORA_IP}"
echo "  Path: ${BASE_PATH}"
echo ""

# Build Robbie@Code
echo "📦 Building Robbie@Code..."
cd /home/allan/aurora-ai-robbiverse/robbie-app
npm run build

# Upload to server
echo "📤 Uploading Robbie@Code..."
scp -r dist/* ${AURORA_USER}@${AURORA_IP}:${BASE_PATH}/

# Set permissions
echo "🔧 Setting permissions..."
ssh ${AURORA_USER}@${AURORA_IP} << 'SET_PERMISSIONS'
    chown -R www-data:www-data /var/www/html/code
    chmod -R 755 /var/www/html/code
    echo "✅ Permissions set"
SET_PERMISSIONS

echo ""
echo "🎉 ROBBIE@CODE DEPLOYED!"
echo "======================="
echo "✅ Live at: https://aurora.testpilot.ai/code"
echo "✅ Login: https://aurora.testpilot.ai/login"
echo ""
echo "🚀 Robbie@Code is ready for coding assistance!"













