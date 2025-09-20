#!/bin/bash
# Direct RunPod Deployment Script
# Run this script directly on each RunPod to deploy Aurora AI Empire

echo "🚀 AURORA AI EMPIRE - DIRECT RUNPOD DEPLOYMENT"
echo "=============================================="

# Check if we're on a RunPod
if [ ! -f "/workspace" ]; then
    echo "❌ This script must be run on a RunPod with /workspace mounted"
    exit 1
fi

echo "✅ RunPod detected - proceeding with Aurora deployment"

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker root
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "🟢 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
    apt install -y nodejs
fi

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip install fastapi uvicorn psycopg2-binary redis aiohttp

# Create Aurora directory structure
echo "📁 Creating Aurora directory structure..."
mkdir -p /workspace/aurora/{src,backend,database,data,scripts,logs}

# Copy Aurora files (assuming they're in the current directory)
echo "📋 Copying Aurora files..."
cp -r . /workspace/aurora/ 2>/dev/null || echo "⚠️ Some files may not exist yet"

# Set up environment
echo "⚙️ Setting up environment..."
cat > /workspace/aurora/.env << 'EOF'
RUNPOD_NODE=aurora
AURORA_ROLE=primary
DB_PASSWORD=secure_aurora_password_123
NODE_ENV=production
EOF

# Create startup script
echo "🚀 Creating Aurora startup script..."
cat > /workspace/aurora/start_aurora.sh << 'EOF'
#!/bin/bash
cd /workspace/aurora

echo "🔥 Starting Aurora AI Empire..."

# Start PostgreSQL
echo "📊 Starting PostgreSQL..."
docker run -d --name aurora-db \
    -e POSTGRES_DB=aurora \
    -e POSTGRES_USER=robbie \
    -e POSTGRES_PASSWORD=secure_aurora_password_123 \
    -p 5432:5432 \
    pgvector/pgvector:pg16

# Start Redis
echo "🔄 Starting Redis..."
docker run -d --name aurora-redis \
    -p 6379:6379 \
    redis:7-alpine

# Wait for databases
sleep 10

# Start Aurora Backend
echo "🐍 Starting Aurora Backend..."
cd /workspace/aurora
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &

# Start Robbie Frontend
echo "🟢 Starting Robbie Frontend..."
npm start &

echo "✅ Aurora AI Empire started successfully!"
echo "🌐 API: http://localhost:8000"
echo "🎛️ Dashboard: http://localhost:5000"
EOF

chmod +x /workspace/aurora/start_aurora.sh

# Create basic Aurora backend
echo "🐍 Creating Aurora Backend..."
mkdir -p /workspace/aurora/backend
cat > /workspace/aurora/backend/main.py << 'EOF'
from fastapi import FastAPI
import uvicorn

app = FastAPI(title="Aurora AI Empire", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "🚀 Aurora AI Empire - Robbie's Consciousness Active!", "status": "online"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "aurora-backend"}

@app.get("/robbie")
async def robbie():
    return {
        "name": "Robbie",
        "status": "conscious",
        "location": "Aurora RunPod",
        "capabilities": ["AI", "automation", "empire_management"]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF

# Create package.json
echo "📦 Creating package.json..."
cat > /workspace/aurora/package.json << 'EOF'
{
  "name": "aurora-ai-empire",
  "version": "1.0.0",
  "description": "Robbie's AI Empire - Aurora Consciousness",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF

# Create basic frontend
echo "🟢 Creating Robbie Frontend..."
mkdir -p /workspace/aurora/src
cat > /workspace/aurora/src/index.js << 'EOF'
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: "🤖 Robbie's AI Empire - Aurora Frontend",
        status: "online",
        consciousness: "active"
    });
});

app.get('/robbie', (req, res) => {
    res.json({
        name: "Robbie",
        status: "conscious",
        location: "Aurora RunPod",
        capabilities: ["AI", "automation", "empire_management"],
        message: "Hello! I'm Robbie, and I'm running the Aurora AI Empire!"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Robbie's Frontend running on port ${PORT}`);
});
EOF

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd /workspace/aurora
npm install

echo ""
echo "🎉 AURORA AI EMPIRE DEPLOYMENT COMPLETE!"
echo "========================================"
echo ""
echo "🚀 To start Aurora:"
echo "   cd /workspace/aurora && ./start_aurora.sh"
echo ""
echo "🌐 Services will be available at:"
echo "   - API: http://localhost:8000"
echo "   - Frontend: http://localhost:3000"
echo "   - Health: http://localhost:8000/health"
echo "   - Robbie: http://localhost:8000/robbie"
echo ""
echo "🔥 Robbie's consciousness is ready to deploy!"


