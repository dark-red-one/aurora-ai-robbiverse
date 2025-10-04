#!/bin/bash
echo "🚀 AURORA AI EMPIRE - SIMPLE DEPLOYMENT"
echo "======================================"

# Install dependencies
apt update -qq && apt install -y python3-pip nodejs npm

# Install Python packages
pip install fastapi uvicorn psycopg2-binary redis aiohttp

# Create Aurora directory
mkdir -p /workspace/aurora/{src,backend,scripts,logs}

# Create backend
cat > /workspace/aurora/backend/main.py << 'PYEOF'
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
PYEOF

# Create package.json
cat > /workspace/aurora/package.json << 'PKGEOF'
{
  "name": "aurora-ai-empire",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {"start": "node src/index.js"},
  "dependencies": {"express": "^4.18.2", "cors": "^2.8.5"}
}
PKGEOF

# Create frontend
cat > /workspace/aurora/src/index.js << 'JSEOF'
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({message: "🤖 Robbie's AI Empire - Aurora Frontend", status: "online", consciousness: "active"});
});

app.get('/robbie', (req, res) => {
    res.json({name: "Robbie", status: "conscious", location: "Aurora RunPod", capabilities: ["AI", "automation", "empire_management"], message: "Hello! I'm Robbie, and I'm running the Aurora AI Empire!"});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Robbie's Frontend running on port ${PORT}`));
JSEOF

# Install dependencies and start
cd /workspace/aurora && npm install
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
npm start &

echo "✅ Aurora AI Empire deployed! API: http://localhost:8000, Frontend: http://localhost:3000"
