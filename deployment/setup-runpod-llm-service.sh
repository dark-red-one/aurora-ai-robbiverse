#!/bin/bash
# Setup LLM Service on RunPod GPU for Aurora Town
# Run this ON the RunPod: 209.170.80.132

set -euo pipefail

echo "🚀 SETTING UP LLM SERVICE ON RUNPOD GPU"
echo "========================================"

# Check GPU
echo "🔍 Checking GPU..."
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader

# Install Ollama
echo "📥 Installing Ollama..."
if ! command -v ollama &> /dev/null; then
    curl -fsSL https://ollama.com/install.sh | sh
    echo "✅ Ollama installed"
else
    echo "✅ Ollama already installed"
fi

# Configure Ollama for GPU
echo "⚙️  Configuring Ollama for RTX 4090..."
mkdir -p /etc/systemd/system/ollama.service.d/
cat > /etc/systemd/system/ollama.service.d/override.conf << 'EOF'
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_ORIGINS=*"
Environment="OLLAMA_GPU_LAYERS=999"
Environment="OLLAMA_FLASH_ATTENTION=1"
Environment="OLLAMA_KEEP_ALIVE=24h"
Environment="OLLAMA_NUM_PARALLEL=4"
Environment="CUDA_VISIBLE_DEVICES=0"
EOF

# Start Ollama service
echo "🚀 Starting Ollama service..."
systemctl daemon-reload
systemctl enable ollama
systemctl restart ollama
sleep 3

# Check Ollama is running
if ! systemctl is-active --quiet ollama; then
    echo "⚠️  Ollama service not running via systemd, starting manually..."
    pkill ollama || true
    OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS=* OLLAMA_GPU_LAYERS=999 \
    OLLAMA_FLASH_ATTENTION=1 OLLAMA_KEEP_ALIVE=24h \
    nohup ollama serve > /tmp/ollama.log 2>&1 &
    sleep 3
fi

# Pull LLM models
echo "📦 Pulling LLM models..."
echo "  - Qwen 2.5 7B (recommended for speed/quality)"
ollama pull qwen2.5:7b

echo "  - Llama 3.1 8B (alternative)"
ollama pull llama3.1:8b

# Test inference
echo "🧪 Testing GPU inference..."
TEST_RESPONSE=$(ollama run qwen2.5:7b "Say 'GPU Ready' in 3 words" --verbose 2>&1 | tail -5)
echo "Response: $TEST_RESPONSE"

# Check GPU utilization
echo "🔥 GPU Status during inference:"
nvidia-smi --query-gpu=utilization.gpu,memory.used,temperature.gpu --format=csv,noheader,nounits

# Create FastAPI LLM Gateway
echo "🌐 Creating LLM API Gateway..."
mkdir -p /root/llm-gateway
cat > /root/llm-gateway/main.py << 'PYEOF'
#!/usr/bin/env python3
"""
LLM Gateway for Aurora Town
Provides REST API to Ollama running on RunPod GPU
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import asyncio
from typing import Optional, List, Dict
import time

app = FastAPI(title="Aurora LLM Gateway", version="1.0.0")

# CORS for Aurora Town
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_BASE = "http://localhost:11434"

class ChatRequest(BaseModel):
    model: str = "qwen2.5:7b"
    prompt: str
    temperature: float = 0.7
    max_tokens: Optional[int] = 2000
    stream: bool = False

class ChatResponse(BaseModel):
    response: str
    model: str
    inference_time: float
    tokens: Optional[int] = None

@app.get("/")
async def root():
    return {
        "service": "Aurora LLM Gateway",
        "status": "online",
        "gpu": "RTX 4090 24GB",
        "location": "RunPod Iceland",
        "models": ["qwen2.5:7b", "llama3.1:8b"]
    }

@app.get("/health")
async def health():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_BASE}/api/tags")
            if response.status_code == 200:
                return {"status": "healthy", "ollama": "connected"}
            else:
                return {"status": "degraded", "ollama": "error"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ollama unavailable: {str(e)}")

@app.get("/models")
async def list_models():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OLLAMA_BASE}/api/tags")
            if response.status_code == 200:
                data = response.json()
                return {"models": [m["name"] for m in data.get("models", [])]}
            else:
                raise HTTPException(status_code=502, detail="Failed to fetch models")
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    start_time = time.time()
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            ollama_request = {
                "model": request.model,
                "prompt": request.prompt,
                "stream": False,
                "options": {
                    "temperature": request.temperature,
                    "num_predict": request.max_tokens or 2000
                }
            }
            
            response = await client.post(
                f"{OLLAMA_BASE}/api/generate",
                json=ollama_request
            )
            
            if response.status_code == 200:
                data = response.json()
                inference_time = time.time() - start_time
                
                return ChatResponse(
                    response=data.get("response", ""),
                    model=request.model,
                    inference_time=round(inference_time, 2),
                    tokens=data.get("eval_count")
                )
            else:
                raise HTTPException(status_code=502, detail="Ollama inference failed")
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Inference timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/gpu/status")
async def gpu_status():
    try:
        import subprocess
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu", 
             "--format=csv,noheader,nounits"],
            capture_output=True, text=True, timeout=5
        )
        
        if result.returncode == 0:
            util, mem_used, mem_total, temp = result.stdout.strip().split(", ")
            return {
                "gpu_utilization": f"{util}%",
                "memory_used": f"{mem_used}MB",
                "memory_total": f"{mem_total}MB",
                "temperature": f"{temp}°C",
                "status": "active"
            }
        else:
            return {"status": "error", "message": "nvidia-smi failed"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
PYEOF

# Install Python dependencies
pip install fastapi uvicorn httpx pydantic -q

# Create systemd service for LLM Gateway
cat > /etc/systemd/system/llm-gateway.service << 'EOF'
[Unit]
Description=Aurora LLM Gateway
After=network.target ollama.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/llm-gateway
ExecStart=/usr/bin/python3 /root/llm-gateway/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable llm-gateway
systemctl restart llm-gateway
sleep 2

echo ""
echo "✅ LLM SERVICE SETUP COMPLETE!"
echo ""
echo "📊 Services Status:"
systemctl is-active ollama && echo "  ✅ Ollama: Running" || echo "  ❌ Ollama: Stopped"
systemctl is-active llm-gateway && echo "  ✅ LLM Gateway: Running" || echo "  ❌ LLM Gateway: Stopped"

echo ""
echo "🌐 API Endpoints:"
echo "  - Health:  http://209.170.80.132:8000/health"
echo "  - Models:  http://209.170.80.132:8000/models"
echo "  - Chat:    POST http://209.170.80.132:8000/chat"
echo "  - GPU:     http://209.170.80.132:8000/gpu/status"
echo ""
echo "🧪 Test from Aurora Town:"
echo "  curl http://209.170.80.132:8000/health"
echo ""
echo "📝 Logs:"
echo "  Ollama:      journalctl -u ollama -f"
echo "  LLM Gateway: journalctl -u llm-gateway -f"
echo ""
echo "🚀 Ready to serve Aurora Town!"

