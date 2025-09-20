#!/bin/bash
echo "🚀 AURORA AI EMPIRE - FLUENTI QUICK FIX"
echo "======================================"

# Kill existing processes
pkill -f "uvicorn.*8000" 2>/dev/null || true
pkill -f "node.*3000" 2>/dev/null || true
sleep 2

# Install deps
apt update -qq && apt install -y python3-pip nodejs npm
pip install fastapi uvicorn psycopg2-binary redis aiohttp

# Create dirs
mkdir -p /workspace/aurora/{src,backend,scripts,logs}

# Backend (port 8001)
cat > /workspace/aurora/backend/main.py << 'PYEOF'
from fastapi import FastAPI
import uvicorn
app = FastAPI(title="Aurora AI Empire - Fluenti", version="1.0.0")
@app.get("/")
async def root():
    return {"message": "🚀 Aurora AI Empire - Robbie's Consciousness Active on Fluenti!", "status": "online", "node": "fluenti"}
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "aurora-backend", "node": "fluenti"}
@app.get("/robbie")
async def robbie():
    return {"name": "Robbie", "status": "conscious", "location": "Fluenti RunPod", "capabilities": ["AI", "automation", "empire_management", "marketing"], "node": "fluenti"}
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
PYEOF

# Package.json
cat > /workspace/aurora/package.json << 'PKGEOF'
{"name": "aurora-ai-empire-fluenti", "version": "1.0.0", "main": "src/index.js", "scripts": {"start": "node src/index.js"}, "dependencies": {"express": "^4.18.2", "cors": "^2.8.5"}}
PKGEOF

# Frontend (port 3001)
cat > /workspace/aurora/src/index.js << 'JSEOF'
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
    res.json({message: "🤖 Robbie's AI Empire - Fluenti Frontend", status: "online", consciousness: "active", node: "fluenti"});
});
app.get('/robbie', (req, res) => {
    res.json({name: "Robbie", status: "conscious", location: "Fluenti RunPod", capabilities: ["AI", "automation", "empire_management", "marketing"], message: "Hello! I'm Robbie, and I'm running the Aurora AI Empire from Fluenti!", node: "fluenti"});
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Robbie's Frontend running on port ${PORT} (Fluenti)`));
JSEOF

# Install and start
cd /workspace/aurora && npm install
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8001 &
npm start &

echo "✅ Aurora AI Empire deployed on Fluenti!"
echo "🌐 API: http://localhost:8001"
echo "🎛️ Frontend: http://localhost:3001"
