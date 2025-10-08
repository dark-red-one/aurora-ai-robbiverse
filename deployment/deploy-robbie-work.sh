#!/bin/bash

# 💼 DEPLOY ROBBIE@WORK TO AURORA.TESTPILOT.AI/WORK
# Deploy business productivity suite

set -e

echo "💼 DEPLOYING ROBBIE@WORK TO AURORA.TESTPILOT.AI/WORK"
echo "=================================================="

# Configuration
AURORA_IP="45.32.194.172"
AURORA_USER="root"
BASE_PATH="/var/www/html/work"

echo "📋 Configuration:"
echo "  Server: ${AURORA_USER}@${AURORA_IP}"
echo "  Path: ${BASE_PATH}"
echo ""

# Create Robbie@Work from template
echo "📦 Creating Robbie@Work from template..."
mkdir -p /tmp/robbie-work
cp -r /home/allan/aurora-ai-robbiverse/robbie-app/* /tmp/robbie-work/

# Modify for business focus
cd /tmp/robbie-work
echo "🔧 Customizing for business focus..."

# Update package.json
sed -i 's/Robbie@Code/Robbie@Work/g' package.json
sed -i 's/robbie-at-code/robbie-at-work/g' package.json
sed -i 's/Allan'\''s AI Coding Partner/Allan'\''s AI Business Partner/g' package.json

# Update HTML title
sed -i 's/Robbie@Code - Let'\''s Build Together 💻✨/Robbie@Work - Business Productivity Suite 💼✨/g' index.html

# Build Robbie@Work
echo "📦 Building Robbie@Work..."
npm install
npm run build

# Upload to server
echo "📤 Uploading Robbie@Work..."
scp -r dist/* ${AURORA_USER}@${AURORA_IP}:${BASE_PATH}/

# Set permissions
echo "🔧 Setting permissions..."
ssh ${AURORA_USER}@${AURORA_IP} << 'SET_PERMISSIONS'
    chown -R www-data:www-data /var/www/html/work
    chmod -R 755 /var/www/html/work
    echo "✅ Permissions set"
SET_PERMISSIONS

# Cleanup
rm -rf /tmp/robbie-work

echo ""
echo "🎉 ROBBIE@WORK DEPLOYED!"
echo "======================="
echo "✅ Live at: https://aurora.testpilot.ai/work"
echo "✅ Login: https://aurora.testpilot.ai/login"
echo ""
echo "🚀 Robbie@Work is ready for business productivity!"













