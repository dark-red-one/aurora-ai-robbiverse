#!/bin/bash
echo "🔥 CLONING AURORA TO COLLABORATION RUNPOD"
echo "========================================"
echo ""
echo "Creating deployment package for Collaboration RunPod..."
echo "This will be identical to Aurora but with 'collaboration' node ID"

# Create deployment package
echo "📦 Creating Aurora deployment package..."
tar -czf aurora-collaboration-deploy.tar.gz \
    --exclude="*.log" \
    --exclude="node_modules" \
    --exclude="__pycache__" \
    --exclude=".git" \
    --exclude="backups" \
    src/ backend/ database/ personalities/ rag/ memory/ config/ \
    gpu_mesh/ monitoring/ security/ scripts/ \
    package*.json requirements.txt \
    *.py *.sh *.md \
    nginx.conf

echo "✅ Deployment package created: aurora-collaboration-deploy.tar.gz"
echo ""
echo "🚀 READY TO DEPLOY TO COLLABORATION RUNPOD!"
echo ""
echo "Instructions for Collaboration RunPod:"
echo "1. Transfer this file to Collaboration RunPod"
echo "2. Extract: tar -xzf aurora-collaboration-deploy.tar.gz"
echo "3. Run: ./complete-linux-node.sh"
echo "4. Update node ID to 'collaboration'"
echo ""
echo "This will create an identical Aurora system with:"
echo "✅ Full AI intelligence (5 personalities)"
echo "✅ GPU mesh networking"
echo "✅ Enterprise security"
echo "✅ Real-time monitoring"
echo "✅ Node identification as 'collaboration'"
echo ""
echo "Ready to expand the empire! 🔥"
