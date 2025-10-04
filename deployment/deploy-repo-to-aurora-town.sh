#!/bin/bash
# Deploy Aurora Repository to Aurora-Town
# Run this on aurora-town VM to set up development environment

set -euo pipefail

echo "📦 DEPLOYING AURORA REPOSITORY TO AURORA-TOWN"
echo "=============================================="

# Configuration
S3_BUCKET="bguoh9kd1g"
S3_ENDPOINT="https://s3api-eur-is-1.runpod.io"
AURORA_DB_HOST="aurora-postgres-u44170.vm.elestio.app"
AURORA_DB_PORT="25432"
AURORA_DB_NAME="aurora_unified"
AURORA_DB_USER="aurora_app"
AURORA_DB_PASSWORD="TestPilot2025_Aurora!"

echo "🔍 Setting up development environment on aurora-town..."

# 1. Install development dependencies
echo "📦 Installing development packages..."
apt-get update
apt-get install -y \
    git \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    postgresql-client \
    redis-tools \
    build-essential \
    curl \
    wget \
    vim \
    htop

# 2. Create development directory
echo "📁 Creating development directory..."
mkdir -p /opt/aurora-dev
cd /opt/aurora-dev

# 3. Download latest Aurora repository bundle
echo "📦 Downloading latest Aurora repository..."
LATEST_BUNDLE=$(aws s3 ls s3://$S3_BUCKET/backups/git/ --endpoint-url $S3_ENDPOINT | tail -1 | awk '{print $4}')
if [ -n "$LATEST_BUNDLE" ]; then
    aws s3 cp s3://$S3_BUCKET/backups/git/$LATEST_BUNDLE . --endpoint-url $S3_ENDPOINT
    git clone $LATEST_BUNDLE aurora
    cd aurora
    echo "✅ Aurora repository restored"
else
    echo "❌ No git bundle found - creating fresh repo"
    mkdir aurora
    cd aurora
    git init
fi

# 4. Set up Python virtual environment
echo "🐍 Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate

# Install core dependencies
pip install --upgrade pip
pip install \
    fastapi \
    uvicorn[standard] \
    psycopg2-binary \
    redis \
    requests \
    aiohttp \
    pydantic \
    pydantic-settings \
    python-dotenv \
    prometheus-client \
    structlog \
    rich \
    click \
    typer

# Install API connector dependencies
if [ -f api-connectors/requirements.txt ]; then
    pip install -r api-connectors/requirements.txt
fi

# 5. Install Node.js dependencies
echo "📦 Setting up Node.js environment..."
if [ -f package.json ]; then
    npm install
else
    # Create basic package.json
    cat > package.json << 'EOF'
{
  "name": "aurora-town-dev",
  "version": "1.0.0",
  "description": "Aurora Town Development Environment",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "build": "webpack --mode production"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "pg": "^8.11.3",
    "redis": "^4.6.10",
    "ws": "^8.14.2",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1"
  },
  "type": "module"
}
EOF
    npm install
fi

# 6. Configure environment
echo "⚙️ Configuring environment..."
cat > .env << EOF
NODE_ENV=development
CITY=aurora
REGION=austin
AURORA_DB_HOST=$AURORA_DB_HOST
AURORA_DB_PORT=$AURORA_DB_PORT
AURORA_DB_NAME=$AURORA_DB_NAME
AURORA_DB_USER=$AURORA_DB_USER
AURORA_DB_PASSWORD=$AURORA_DB_PASSWORD
AURORA_DB_SSLMODE=require
S3_ENDPOINT=$S3_ENDPOINT
S3_BUCKET=$S3_BUCKET
RUNPOD_GPU_HOST=209.170.80.132
RUNPOD_GPU_PORT=8000
EOF

# 7. Test database connectivity
echo "🔍 Testing database connectivity..."
source venv/bin/activate
python3 -c "
import psycopg2
try:
    conn = psycopg2.connect(
        host='$AURORA_DB_HOST',
        port=$AURORA_DB_PORT,
        dbname='$AURORA_DB_NAME',
        user='$AURORA_DB_USER',
        password='$AURORA_DB_PASSWORD',
        sslmode='require'
    )
    with conn.cursor() as cur:
        cur.execute('SELECT COUNT(*) FROM towns WHERE name = %s', ('aurora',))
        count = cur.fetchone()[0]
    conn.close()
    print(f'✅ Database connected - Aurora town configured: {count > 0}')
except Exception as e:
    print(f'❌ Database error: {e}')
    exit(1)
"

# 8. Create development startup script
echo "🚀 Creating development startup script..."
cat > start-dev.sh << 'EOF'
#!/bin/bash
# Aurora Development Startup Script

set -e

echo "🚀 Starting Aurora Development Environment..."

# Activate Python environment
source venv/bin/activate

# Start backend in background
echo "📡 Starting Aurora backend (port 8000)..."
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend in background (if available)
if [ -f package.json ]; then
    echo "🌐 Starting frontend (port 3000)..."
    npm run dev &
    FRONTEND_PID=$!
fi

# Start API gateway (if available)
if [ -f src/unified-systems/api-gateway.js ]; then
    echo "🚪 Starting API gateway (port 8080)..."
    node src/unified-systems/api-gateway.js &
    GATEWAY_PID=$!
fi

# Start monitoring dashboard (if available)
if [ -d gpu-monitor ]; then
    echo "📊 Starting GPU monitor (port 8081)..."
    python3 -m http.server 8081 --directory gpu-monitor &
    MONITOR_PID=$!
fi

echo ""
echo "✅ Aurora development environment started!"
echo ""
echo "🌐 Available services:"
echo "• Aurora Backend: http://localhost:8000"
echo "• Frontend: http://localhost:3000"
echo "• API Gateway: http://localhost:8080"
echo "• GPU Monitor: http://localhost:8081"
echo "• Database: $AURORA_DB_HOST:$AURORA_DB_PORT"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for interrupt
trap 'echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID $GATEWAY_PID $MONITOR_PID 2>/dev/null || true; exit 0' INT
wait
EOF

chmod +x start-dev.sh

# 9. Create development stop script
cat > stop-dev.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Aurora development services..."
pkill -f "uvicorn backend.main:app" || true
pkill -f "npm run dev" || true
pkill -f "api-gateway.js" || true
pkill -f "http.server 8081" || true
echo "✅ All development services stopped"
EOF

chmod +x stop-dev.sh

# 10. Set up git for development
echo "📝 Configuring git..."
git config --global user.name "Aurora Dev"
git config --global user.email "dev@testpilot.ai"
git config --global init.defaultBranch main

# Add remote for future pushes (if not exists)
if ! git remote get-url origin >/dev/null 2>&1; then
    echo "📡 Git remote not configured - will need to add later"
    echo "To add remote: git remote add origin <your-repo-url>"
fi

# 11. Create development README
cat > DEV-README.md << 'EOF'
# Aurora Development Environment

## Quick Start
```bash
# Start all services
./start-dev.sh

# Stop all services  
./stop-dev.sh
```

## Services
- Aurora Backend: http://localhost:8000
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- GPU Monitor: http://localhost:8081

## Database
- Host: aurora-postgres-u44170.vm.elestio.app:25432
- Database: aurora_unified
- User: aurora_app

## Development Workflow
1. Edit code in /opt/aurora-dev/aurora/
2. Backend auto-reloads on changes
3. Frontend auto-reloads on changes
4. Test via browser or API calls
5. Commit and push changes

## API Connectors
- HubSpot: api-connectors/hubspot-connector.py
- Fireflies: api-connectors/fireflies-connector.py
- Gmail: api-connectors/gmail-connector.py
- Master Import: api-connectors/master-import.py
EOF

# 12. Set ownership
chown -R root:root /opt/aurora-dev

echo ""
echo "✅ AURORA DEVELOPMENT ENVIRONMENT COMPLETE!"
echo ""
echo "📁 Location: /opt/aurora-dev/aurora/"
echo "🚀 Start dev: ./start-dev.sh"
echo "🛑 Stop dev: ./stop-dev.sh"
echo ""
echo "🌐 Access points:"
echo "• Backend: http://$(curl -s ifconfig.me):8000"
echo "• Frontend: http://$(curl -s ifconfig.me):3000"
echo "• API Gateway: http://$(curl -s ifconfig.me):8080"
echo "• GPU Monitor: http://$(curl -s ifconfig.me):8081"
echo ""
echo "🎯 Development is now ready on aurora-town!"
