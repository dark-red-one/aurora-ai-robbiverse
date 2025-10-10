#!/bin/bash
#
# Manual Deployment Guide for Aurora Town AI Router
# Run these commands DIRECTLY on Aurora Town server
#

echo "🚀 Aurora Town AI Router - Manual Deployment"
echo "============================================="
echo ""
echo "Copy/paste these commands on Aurora Town:"
echo ""

cat << 'COMMANDS'

# 1. Create directory structure
sudo mkdir -p /home/allan/robbie-ai/ai-router
cd /home/allan/robbie-ai

# 2. Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install --upgrade pip
pip install fastapi uvicorn httpx aiohttp pydantic

# 4. Create the AI Router API file
cat > /home/allan/robbie-ai/ai-router/aurora_router_api.py << 'EOF'
#!/usr/bin/env python3
"""
Aurora Town AI Router API - Simplified Version
Provides REST API for Ollama models running locally
"""

import subprocess
import json
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import uvicorn
import httpx

app = FastAPI(title="Aurora Town AI Router", version="1.0.0")

class GenerateRequest(BaseModel):
    prompt: str
    model: str = "llama3"
    system_prompt: Optional[str] = None
    max_tokens: int = 1024

class EmbedRequest(BaseModel):
    text: str
    model: str = "nomic-embed-text"

@app.get("/health")
async def health():
    """Health check with GPU and Ollama status"""
    # Check GPU
    gpu_name = "unknown"
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
            capture_output=True, text=True, timeout=2
        )
        if result.returncode == 0:
            gpu_name = result.stdout.strip()
    except:
        pass
    
    # Check Ollama
    models_loaded = 0
    ollama_status = "unknown"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:11434/api/tags", timeout=2)
            if response.status_code == 200:
                data = response.json()
                models_loaded = len(data.get('models', []))
                ollama_status = "running"
    except:
        ollama_status = "not_running"
    
    return {
        "status": "healthy",
        "gpu": gpu_name,
        "ollama": ollama_status,
        "models_loaded": models_loaded
    }

@app.post("/generate")
async def generate(req: GenerateRequest):
    """Generate text using Ollama"""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            payload = {
                "model": req.model,
                "prompt": req.prompt,
                "stream": False
            }
            if req.system_prompt:
                payload["system"] = req.system_prompt
            
            response = await client.post(
                "http://localhost:11434/api/generate",
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            
            return {
                "content": result.get('response', ''),
                "model": req.model,
                "success": True
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/embed")
async def embed(req: EmbedRequest):
    """Generate embeddings using Ollama"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "http://localhost:11434/api/embeddings",
                json={"model": req.model, "prompt": req.text}
            )
            response.raise_for_status()
            result = response.json()
            
            return {
                "embedding": result.get('embedding', []),
                "model": req.model,
                "dimension": len(result.get('embedding', []))
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
async def models():
    """List available Ollama models"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:11434/api/tags", timeout=2)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {
        "service": "Aurora Town AI Router",
        "gpu": "RTX 4090",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
EOF

# 5. Create systemd service
sudo tee /etc/systemd/system/ai-router.service > /dev/null << 'EOF'
[Unit]
Description=Aurora AI Router Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/allan/robbie-ai
Environment="PATH=/home/allan/robbie-ai/venv/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/home/allan/robbie-ai/venv/bin/python /home/allan/robbie-ai/ai-router/aurora_router_api.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 6. Start the service
sudo systemctl daemon-reload
sudo systemctl enable ai-router
sudo systemctl restart ai-router

# 7. Check status
echo "Waiting 3 seconds for service to start..."
sleep 3
sudo systemctl status ai-router --no-pager

# 8. Test the API
echo ""
echo "Testing API..."
curl http://localhost:8000/health

echo ""
echo "✅ Deployment complete!"
echo "Test with: curl -X POST http://localhost:8000/generate -H 'Content-Type: application/json' -d '{\"prompt\":\"Hello!\",\"model\":\"llama3\"}'"

COMMANDS

