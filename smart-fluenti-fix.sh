#!/bin/bash
echo "🚀 AURORA AI EMPIRE - SMART FLUENTI FIX"
echo "======================================"

# Kill ALL existing processes
echo "🧹 Cleaning up ALL existing processes..."
pkill -f "uvicorn" 2>/dev/null || true
pkill -f "node.*src/index.js" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
sleep 3

# Find available ports
echo "🔍 Finding available ports..."
API_PORT=$(netstat -tlnp | awk 'BEGIN{for(i=8000;i<=8010;i++) ports[i]=1} {if($4 ~ /:80[0-9][0-9]$/) {port=substr($4,index($4,":")+1); ports[port]=0}} END{for(i=8000;i<=8010;i++) if(ports[i]) {print i; exit}}')
FRONTEND_PORT=$(netstat -tlnp | awk 'BEGIN{for(i=3000;i<=3010;i++) ports[i]=1} {if($4 ~ /:30[0-9][0-9]$/) {port=substr($4,index($4,":")+1); ports[port]=0}} END{for(i=3000;i<=3010;i++) if(ports[i]) {print i; exit}}')

echo "📡 Using ports: API=$API_PORT, Frontend=$FRONTEND_PORT"

# Install deps
apt update -qq && apt install -y python3-pip nodejs npm
pip install fastapi uvicorn psycopg2-binary redis aiohttp

# Create dirs
mkdir -p /workspace/aurora/{src,backend,scripts,logs}

# Backend with dynamic port
cat > /workspace/aurora/backend/main.py << PYEOF
from fastapi import FastAPI
import uvicorn
app = FastAPI(title="Aurora AI Empire - Fluenti", version="1.0.0")
@app.get("/")
async def root():
    return {"message": "🚀 Aurora AI Empire - Robbie's Consciousness Active on Fluenti!", "status": "online", "node": "fluenti", "port": $API_PORT}
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "aurora-backend", "node": "fluenti", "port": $API_PORT}
@app.get("/robbie")
async def robbie():
    return {"name": "Robbie", "status": "conscious", "location": "Fluenti RunPod", "capabilities": ["AI", "automation", "empire_management", "marketing"], "node": "fluenti", "port": $API_PORT}
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=$API_PORT)
PYEOF

# Package.json
cat > /workspace/aurora/package.json << 'PKGEOF'
{"name": "aurora-ai-empire-fluenti", "version": "1.0.0", "main": "src/index.js", "scripts": {"start": "node src/index.js"}, "dependencies": {"express": "^4.18.2", "cors": "^2.8.5"}}
PKGEOF

# Frontend with dynamic port
cat > /workspace/aurora/src/index.js << JSEOF
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
    res.json({message: "🤖 Robbie's AI Empire - Fluenti Frontend", status: "online", consciousness: "active", node: "fluenti", port: $FRONTEND_PORT});
});
app.get('/robbie', (req, res) => {
    res.json({name: "Robbie", status: "conscious", location: "Fluenti RunPod", capabilities: ["AI", "automation", "empire_management", "marketing"], message: "Hello! I'm Robbie, and I'm running the Aurora AI Empire from Fluenti!", node: "fluenti", port: $FRONTEND_PORT});
});
const PORT = process.env.PORT || $FRONTEND_PORT;
app.listen(PORT, () => console.log(`🚀 Robbie's Frontend running on port ${PORT} (Fluenti)`));
JSEOF

# Install and start
cd /workspace/aurora && npm install
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port $API_PORT &
npm start &

echo "✅ Aurora AI Empire deployed on Fluenti!"
echo "🌐 API: http://localhost:$API_PORT"
echo "🎛️ Frontend: http://localhost:$FRONTEND_PORT"
echo "🏥 Health: http://localhost:$API_PORT/health"
echo "🤖 Robbie: http://localhost:$API_PORT/robbie"
