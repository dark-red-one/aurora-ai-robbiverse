#!/bin/bash
# Aurora-Town Remote Deployment
# This script can be run from anywhere to deploy to aurora-town

set -euo pipefail

echo "🚀 AURORA-TOWN REMOTE DEPLOYMENT"
echo "================================"

# Configuration
AURORA_TOWN_HOST="aurora-town-u44170.vm.elestio.app"
AURORA_TOWN_USER="root"
AURORA_TOWN_PASSWORD="yjAcD7ot-GqWp-BlkDS5zy"
S3_BUCKET="bguoh9kd1g"
S3_ENDPOINT="https://s3api-eur-is-1.runpod.io"

echo "📡 Deploying Aurora repository to aurora-town..."

# Create deployment commands
DEPLOY_COMMANDS=$(cat << 'EOF'
set -euo pipefail
echo "📦 Starting Aurora development deployment..."

# Install base packages
apt-get update -y
apt-get install -y git python3 python3-pip python3-venv nodejs npm postgresql-client curl wget vim htop build-essential

# Create development directory
mkdir -p /opt/aurora-dev
cd /opt/aurora-dev

# Download latest repository bundle
LATEST_BUNDLE=$(aws s3 ls s3://bguoh9kd1g/backups/git/ --endpoint-url https://s3api-eur-is-1.runpod.io | tail -1 | awk '{print $4}')
if [ -n "$LATEST_BUNDLE" ]; then
    aws s3 cp s3://bguoh9kd1g/backups/git/$LATEST_BUNDLE . --endpoint-url https://s3api-eur-is-1.runpod.io
    git clone $LATEST_BUNDLE aurora
    cd aurora
    echo "✅ Aurora repository restored"
else
    echo "❌ No git bundle found"
    exit 1
fi

# Set up Python environment
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn psycopg2-binary redis requests aiohttp pydantic pydantic-settings python-dotenv prometheus-client

# Set up Node.js environment
if [ -f package.json ]; then
    npm install
fi

# Configure environment
cat > .env << 'ENVEOF'
NODE_ENV=development
CITY=aurora
REGION=austin
AURORA_DB_HOST=aurora-postgres-u44170.vm.elestio.app
AURORA_DB_PORT=25432
AURORA_DB_NAME=aurora_unified
AURORA_DB_USER=aurora_app
AURORA_DB_PASSWORD=TestPilot2025_Aurora!
AURORA_DB_SSLMODE=require
S3_ENDPOINT=https://s3api-eur-is-1.runpod.io
S3_BUCKET=bguoh9kd1g
ENVEOF

# Test database
source venv/bin/activate
python3 -c "import psycopg2; conn=psycopg2.connect(host='aurora-postgres-u44170.vm.elestio.app', port=25432, dbname='aurora_unified', user='aurora_app', password='TestPilot2025_Aurora!', sslmode='require'); print('✅ Database connected'); conn.close()"

# Create startup script
cat > start-dev.sh << 'STARTEOF'
#!/bin/bash
source venv/bin/activate
echo "🚀 Starting Aurora development services..."
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &
if [ -f package.json ]; then npm run dev & fi
if [ -f src/unified-systems/api-gateway.js ]; then node src/unified-systems/api-gateway.js & fi
if [ -d gpu-monitor ]; then python3 -m http.server 8081 --directory gpu-monitor & fi
echo "✅ Services started - Backend: :8000, Frontend: :3000, Gateway: :8080, Monitor: :8081"
STARTEOF

chmod +x start-dev.sh

echo "✅ Aurora development environment deployed to aurora-town!"
echo "📁 Location: /opt/aurora-dev/aurora/"
echo "🚀 Start: cd /opt/aurora-dev/aurora && ./start-dev.sh"
EOF
)

# Upload deployment script to S3
echo "$DEPLOY_COMMANDS" > /tmp/aurora-town-deploy.sh
aws s3 cp /tmp/aurora-town-deploy.sh s3://$S3_BUCKET/scripts/aurora-town-deploy.sh --endpoint-url $S3_ENDPOINT
rm /tmp/aurora-town-deploy.sh

echo "✅ Deployment script uploaded to S3"
echo ""
echo "🎯 TO EXECUTE ON AURORA-TOWN:"
echo ""
echo "Run this single command on aurora-town VM:"
echo "aws s3 cp s3://$S3_BUCKET/scripts/aurora-town-deploy.sh . --endpoint-url $S3_ENDPOINT && sudo chmod +x aurora-town-deploy.sh && sudo ./aurora-town-deploy.sh"
echo ""
echo "This will deploy the complete Aurora development environment!"
