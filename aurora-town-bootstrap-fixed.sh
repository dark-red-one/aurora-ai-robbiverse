#!/bin/bash
# Aurora-Town Bootstrap Script (Fixed for Ubuntu 24.04)
# Run this on the Elestio aurora-town VM

set -euo pipefail

echo "🚀 AURORA-TOWN BOOTSTRAP DEPLOYMENT"
echo "=================================="

# 1. Install AWS CLI v2 (proper method for Ubuntu 24.04)
echo "📦 Installing AWS CLI v2..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
apt-get update && apt-get install -y unzip
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# 2. Configure AWS CLI
echo "⚙️ Configuring AWS CLI..."
aws configure set aws_access_key_id user_32czBlDhal2Uzv3eMjp0V1dOGKT
aws configure set aws_secret_access_key rps_SNXUUDNJZY1O1NSRFQDSA7SG4E3A185HSS4NGJBA1grih9
aws configure set region eur-is-1

# 3. Test S3 connection
echo "🔍 Testing S3 connection..."
aws s3 ls s3://bguoh9kd1g/scripts/ --endpoint-url https://s3api-eur-is-1.runpod.io

# 4. Download and run the full bootstrap script
echo "📦 Downloading full bootstrap script..."
aws s3 cp s3://bguoh9kd1g/scripts/aurora-town-bootstrap.sh . --endpoint-url https://s3api-eur-is-1.runpod.io
chmod +x aurora-town-bootstrap.sh

echo "🚀 Running full Aurora-Town deployment..."
./aurora-town-bootstrap.sh

echo "✅ Aurora-Town deployment complete!"
