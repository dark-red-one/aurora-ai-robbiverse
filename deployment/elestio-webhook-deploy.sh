#!/bin/bash
# Elestio Webhook Deployment Script
# Creates a self-executing deployment via webhook

echo "🚀 CREATING ELESTIO WEBHOOK DEPLOYMENT"
echo "====================================="

# Create a self-executing script that can be triggered via webhook
cat > /tmp/webhook-deploy.sh << 'EOF'
#!/bin/bash
# Self-executing Aurora deployment for Elestio

set -euo pipefail

echo "📦 Aurora Development Deployment Starting..."

# Install AWS CLI if not present
if ! command -v aws &> /dev/null; then
    echo "📥 Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    apt-get update && apt-get install -y unzip
    unzip awscliv2.zip
    ./aws/install
    rm -rf aws awscliv2.zip
fi

# Configure AWS CLI
aws configure set aws_access_key_id user_32czBlDhal2Uzv3eMjp0V1dOGKT
aws configure set aws_secret_access_key rps_SNXUUDNJZY1O1NSRFQDSA7SG4E3A185HSS4NGJBA1grih9
aws configure set region eur-is-1

# Download and execute the main deployment script
echo "📦 Downloading Aurora deployment script..."
aws s3 cp s3://bguoh9kd1g/scripts/deploy-repo-to-aurora-town.sh . --endpoint-url https://s3api-eur-is-1.runpod.io
chmod +x deploy-repo-to-aurora-town.sh

echo "🚀 Executing Aurora deployment..."
./deploy-repo-to-aurora-town.sh

echo "✅ Aurora development environment deployed!"
echo "📁 Location: /opt/aurora-dev/aurora/"
echo "🚀 To start: cd /opt/aurora-dev/aurora && ./start-dev.sh"
EOF

# Upload the webhook script
aws s3 cp /tmp/webhook-deploy.sh s3://bguoh9kd1g/scripts/webhook-deploy.sh --endpoint-url https://s3api-eur-is-1.runpod.io
rm /tmp/webhook-deploy.sh

echo "✅ Webhook deployment script created"
echo ""
echo "🎯 DEPLOYMENT OPTIONS FOR AURORA-TOWN:"
echo ""
echo "Option 1: Direct download and execute"
echo "curl -s https://s3api-eur-is-1.runpod.io/bguoh9kd1g/scripts/webhook-deploy.sh | bash"
echo ""
echo "Option 2: Manual download and execute"
echo "wget https://s3api-eur-is-1.runpod.io/bguoh9kd1g/scripts/webhook-deploy.sh"
echo "chmod +x webhook-deploy.sh"
echo "./webhook-deploy.sh"
echo ""
echo "Option 3: Via Elestio admin UI (if it has a script runner)"
echo "Upload and execute webhook-deploy.sh"
echo ""
echo "🔧 The script is self-contained and will:"
echo "• Install AWS CLI and configure it"
echo "• Download the Aurora repository"
echo "• Set up complete development environment"
echo "• Configure database connectivity"
echo "• Create start/stop scripts"
echo ""
echo "Try accessing the admin UI and see if there's a way to run scripts!"
