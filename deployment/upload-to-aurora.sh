#!/bin/bash
# Upload Aurora Standard Node files to Aurora Server
# Run this from local machine

set -e

echo "📤 Uploading Aurora Standard Node to Aurora Server..."

# Create deployment package
echo "📦 Creating deployment package..."
cd /Users/allanperetz/aurora-ai-robbiverse/deployment/aurora-standard-node

# Create tar package
tar -czf aurora-standard-node.tar.gz \
    services/ \
    database/ \
    simple-integration-demo.py \
    docker-compose.yml \
    .env \
    *.md

echo "📤 Uploading to Aurora server..."

# Upload the package (you'll need to run this manually with correct credentials)
echo "Run this command to upload:"
echo "scp aurora-standard-node.tar.gz root@aurora-town-u44170.vm.elestio.app:/opt/aurora-dev/"
echo ""
echo "Then SSH to Aurora and run:"
echo "cd /opt/aurora-dev && tar -xzf aurora-standard-node.tar.gz && cd aurora-standard-node && chmod +x deploy-to-aurora.sh && ./deploy-to-aurora.sh"

echo "✅ Upload package created: aurora-standard-node.tar.gz"
echo "📋 Manual upload instructions above"
