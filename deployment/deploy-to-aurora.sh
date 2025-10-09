#!/bin/bash
# Deploy Aurora Standard Node to Aurora Server
# Run this script on the Aurora server

set -e

echo "🚀 Deploying Aurora Standard Node to Aurora Server..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Install PostgreSQL if not present
if ! command -v psql &> /dev/null; then
    echo "🐘 Installing PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
fi

# Install Python and pip
echo "🐍 Installing Python and dependencies..."
apt install -y python3 python3-pip python3-venv
pip3 install fastapi uvicorn asyncpg aiosmtplib google-api-python-client hubspot-api-client slack-bolt requests

# Create Aurora directory structure
echo "📁 Creating Aurora directory structure..."
mkdir -p /opt/aurora-dev/aurora-standard-node
cd /opt/aurora-dev/aurora-standard-node

# Copy deployment files (assuming they're uploaded)
echo "📋 Setting up deployment files..."

# Create environment file
cat > .env << 'EOF'
# Aurora Standard Node Environment Configuration
NODE_NAME=aurora
NODE_ROLE=lead
POSTGRES_PASSWORD=aurora_password
REDIS_PASSWORD=aurora_password
DB_PASSWORD=aurora_password
DB_REPLICATION_PASSWORD=aurora_password
ENCRYPTION_KEY=aurora_encryption_key_2025
API_KEY=robbie-2025

# Google Workspace (configure with real credentials)
GOOGLE_CREDENTIALS_JSON=

# HubSpot (configure with real API key)
HUBSPOT_API_KEY=

# Slack (configure with real tokens)
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
SLACK_APP_TOKEN=

# GitHub (configure with real token)
GITHUB_TOKEN=

# LinkedIn (configure with real credentials)
LINKEDIN_EMAIL=
LINKEDIN_PASSWORD=
LINKEDIN_API_KEY=

# Clay/Apollo/Clearbit (configure with real API keys)
CLAY_API_KEY=
APOLLO_API_KEY=
CLEARBIT_API_KEY=

# Fireflies (configure with real API key)
FIREFLIES_API_KEY=

# SMTP (configure with real credentials)
SMTP_USERNAME=
SMTP_PASSWORD=

# MinIO (configure with real credentials)
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
EOF

# Set up PostgreSQL database
echo "🗄️ Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE aurora_unified;"
sudo -u postgres psql -c "CREATE USER aurora_app WITH PASSWORD 'aurora_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE aurora_unified TO aurora_app;"

# Start core services
echo "🚀 Starting Aurora services..."

# Start PostgreSQL
systemctl start postgresql

# Start Redis (if installed)
if command -v redis-server &> /dev/null; then
    systemctl start redis
else
    echo "📦 Installing Redis..."
    apt install -y redis-server
    systemctl start redis
    systemctl enable redis
fi

# Start core Python services
echo "🐍 Starting Python services..."

# Start integration demo
python3 simple-integration-demo.py &
echo "✅ Integration Demo running on port 8015"

# Start Google Keep/Tasks service
python3 services/google-keep-tasks/google_keep_tasks_service.py &
echo "✅ Google Keep/Tasks service running on port 8014"

# Start Presidential Privilege
python3 services/presidential-privilege/presidential_privilege_simple.py &
echo "✅ Presidential Privilege running on port 8021"

# Start Mayor Governance
python3 services/mayor-governance/mayor_governance_simple.py &
echo "✅ Mayor Governance running on port 8022"

# Start web server
python3 -m http.server 8000 &
echo "✅ Web interface running on port 8000"

echo ""
echo "🎉 Aurora Standard Node deployed successfully!"
echo ""
echo "📊 Services Status:"
echo "  - Web Interface: http://aurora-town-u44170.vm.elestio.app:8000/robbie-unified-interface.html"
echo "  - Integration Demo: http://aurora-town-u44170.vm.elestio.app:8015"
echo "  - Google Keep/Tasks: http://aurora-town-u44170.vm.elestio.app:8014"
echo "  - Presidential Privilege: http://aurora-town-u44170.vm.elestio.app:8021"
echo "  - Mayor Governance: http://aurora-town-u44170.vm.elestio.app:8022"
echo ""
echo "🔧 Next steps:"
echo "  1. Configure API credentials in .env file"
echo "  2. Test integrations"
echo "  3. Deploy full Docker stack with: docker-compose up -d"
echo ""
echo "✅ Aurora is ready to roll! 🚀"
