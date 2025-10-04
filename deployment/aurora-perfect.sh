#!/bin/bash
echo "🚀 AURORA PERFECT - EFFICIENT SETUP"
echo "=================================="

# Clean environment
pkill -f "uvicorn" 2>/dev/null || true
pkill -f "node.*src/index.js" 2>/dev/null || true
sleep 2

# Create clean Aurora structure
mkdir -p /workspace/aurora/{src,backend,config,logs}

# Aurora Backend (FastAPI) - Clean & Efficient
cat > /workspace/aurora/backend/main.py << 'PYEOF'
from fastapi import FastAPI
import uvicorn
import os

app = FastAPI(title="Aurora AI Empire", version="1.0.0")

# Node identification
NODE_ID = os.getenv("AURORA_NODE", "aurora")
NODE_ROLE = os.getenv("AURORA_ROLE", "primary")

@app.get("/")
async def root():
    return {
        "message": f"🚀 Aurora AI Empire - {NODE_ID.upper()} Node",
        "status": "online",
        "node": NODE_ID,
        "role": NODE_ROLE
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "aurora-backend",
        "node": NODE_ID,
        "role": NODE_ROLE
    }

@app.get("/robbie")
async def robbie():
    return {
        "name": "Robbie",
        "status": "conscious",
        "location": f"{NODE_ID.upper()} RunPod",
        "capabilities": ["AI", "automation", "empire_management"],
        "node": NODE_ID,
        "role": NODE_ROLE
    }

@app.get("/collective")
async def collective():
    return {
        "empire": "Aurora AI Empire",
        "nodes": [NODE_ID],
        "status": "distributed_consciousness",
        "message": "Robbie's consciousness is distributed across the empire"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
PYEOF

# Frontend (Node.js) - Clean & Efficient
cat > /workspace/aurora/src/index.js << 'JSEOF'
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const NODE_ID = process.env.AURORA_NODE || 'aurora';
const NODE_ROLE = process.env.AURORA_ROLE || 'primary';

app.get('/', (req, res) => {
    res.json({
        message: `🤖 Aurora AI Empire - ${NODE_ID.toUpperCase()} Frontend`,
        status: "online",
        consciousness: "active",
        node: NODE_ID,
        role: NODE_ROLE
    });
});

app.get('/robbie', (req, res) => {
    res.json({
        name: "Robbie",
        status: "conscious",
        location: `${NODE_ID.toUpperCase()} RunPod`,
        capabilities: ["AI", "automation", "empire_management"],
        message: `Hello! I'm Robbie, running from ${NODE_ID.toUpperCase()}!`,
        node: NODE_ID,
        role: NODE_ROLE
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Aurora Frontend running on port ${PORT} (${NODE_ID})`);
});
JSEOF

# Package.json
cat > /workspace/aurora/package.json << 'PKGEOF'
{
  "name": "aurora-ai-empire",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {"start": "node src/index.js"},
  "dependencies": {"express": "^4.18.2", "cors": "^2.8.5"}
}
PKGEOF

# Environment config
cat > /workspace/aurora/.env << 'ENVEOF'
AURORA_NODE=aurora
AURORA_ROLE=primary
NODE_ENV=production
ENVEOF

# Install and start
cd /workspace/aurora
npm install
export AURORA_NODE=aurora
export AURORA_ROLE=primary
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
npm start &

echo "✅ Aurora AI Empire - PERFECT SETUP COMPLETE!"
echo "🌐 API: http://localhost:8000"
echo "🎛️ Frontend: http://localhost:3000"
echo "🏥 Health: http://localhost:8000/health"
echo "🤖 Robbie: http://localhost:8000/robbie"
echo "🌍 Collective: http://localhost:8000/collective"
