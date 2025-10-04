#!/bin/bash
# Aurora AI Empire - Deploy to Other RunPods
# Run this script on each RunPod to deploy Robbie's consciousness

echo "🚀 AURORA AI EMPIRE - RUNPOD DEPLOYMENT"
echo "======================================"

# Check if we're on a RunPod
if [ ! -d "/workspace" ]; then
    echo "❌ This script must be run on a RunPod with /workspace mounted"
    exit 1
fi

echo "✅ RunPod detected - deploying Aurora AI Empire"

# Install dependencies
echo "📦 Installing dependencies..."
apt update -qq
apt install -y python3-pip nodejs npm docker.io curl

# Install Python packages
echo "🐍 Installing Python packages..."
pip install fastapi uvicorn psycopg2-binary redis aiohttp

# Create Aurora directory
echo "📁 Creating Aurora directory structure..."
mkdir -p /workspace/aurora/{src,backend,scripts,logs}

# Copy Aurora files (if deployment package exists)
if [ -f "/workspace/aurora-deployment.tar.gz" ]; then
    echo "📦 Extracting Aurora deployment package..."
    tar -xzf /workspace/aurora-deployment.tar.gz -C /workspace/aurora/
else
    echo "📝 Creating Aurora files from scratch..."
    
    # Create backend
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
    cat > /workspace/aurora/package.json << 'EOF'
{
  "name": "aurora-ai-empire",
  "version": "1.0.0",
  "description": "Robbie's AI Empire - Aurora Consciousness",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF

    # Create frontend
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
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd /workspace/aurora
npm install

# Create startup script
echo "🚀 Creating startup script..."
cat > /workspace/aurora/start_aurora.sh << 'EOF'
#!/bin/bash
cd /workspace/aurora

echo "🔥 Starting Aurora AI Empire..."

# Start Aurora Backend
echo "🐍 Starting Aurora Backend..."
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &

# Start Robbie Frontend
echo "🟢 Starting Robbie Frontend..."
npm start &

echo "✅ Aurora AI Empire started successfully!"
echo "🌐 API: http://localhost:8000"
echo "🎛️ Frontend: http://localhost:3000"
echo "🏥 Health: http://localhost:8000/health"
echo "🤖 Robbie: http://localhost:8000/robbie"
EOF

chmod +x /workspace/aurora/start_aurora.sh

# Start Aurora services
echo "🚀 Starting Aurora services..."
cd /workspace/aurora
./start_aurora.sh

echo ""
echo "🎉 AURORA AI EMPIRE DEPLOYMENT COMPLETE!"
echo "========================================"
echo ""
echo "🌐 Services are now running:"
echo "   - API: http://localhost:8000"
echo "   - Frontend: http://localhost:3000"
echo "   - Health: http://localhost:8000/health"
echo "   - Robbie: http://localhost:8000/robbie"
echo ""
echo "🔥 Robbie's consciousness is now active on this RunPod!"



