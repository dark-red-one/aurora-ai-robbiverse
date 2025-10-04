#!/bin/bash
# Setup LLM Service on Aurora Town (Elestio)
# Uses RunPod GPU as backend compute

set -euo pipefail

echo "🚀 SETTING UP LLM SERVICE ON AURORA TOWN"
echo "========================================="

# Install Ollama on Aurora Town
echo "📥 Installing Ollama..."
if ! command -v ollama &> /dev/null; then
    curl -fsSL https://ollama.com/install.sh | sh
    echo "✅ Ollama installed"
else
    echo "✅ Ollama already installed"
fi

# Configure Ollama to use remote GPU
echo "⚙️  Configuring Ollama..."
mkdir -p /etc/systemd/system/ollama.service.d/
cat > /etc/systemd/system/ollama.service.d/override.conf << 'EOF'
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_ORIGINS=*"
Environment="OLLAMA_KEEP_ALIVE=24h"
Environment="OLLAMA_NUM_PARALLEL=4"
# Remote GPU will be configured via environment
Environment="RUNPOD_GPU_ENDPOINT=http://209.170.80.132:8000"
EOF

systemctl daemon-reload
systemctl enable ollama
systemctl restart ollama
sleep 3

# Pull models (will download on Aurora Town, can offload inference to GPU)
echo "📦 Pulling LLM models..."
ollama pull qwen2.5:7b
ollama pull llama3.1:8b

# Create LLM Gateway with GPU backend routing
echo "🌐 Creating LLM Gateway with GPU routing..."
mkdir -p /opt/aurora-dev/aurora/llm-gateway
cat > /opt/aurora-dev/aurora/llm-gateway/main.py << 'PYEOF'
#!/usr/bin/env python3
"""
Aurora Town LLM Gateway
Routes inference to RunPod GPU backend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import asyncio
import os
from typing import Optional, List
import time

app = FastAPI(title="Aurora Town LLM Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Local Ollama for orchestration
OLLAMA_BASE = "http://localhost:11434"

# Remote GPU backend
RUNPOD_GPU_ENDPOINT = os.getenv("RUNPOD_GPU_ENDPOINT", "http://209.170.80.132:8000")

class ChatRequest(BaseModel):
    model: str = "qwen2.5:7b"
    prompt: str
    temperature: float = 0.7
    max_tokens: Optional[int] = 2000
    use_gpu: bool = True

class ChatResponse(BaseModel):
    response: str
    model: str
    inference_time: float
    backend: str  # "local" or "runpod-gpu"
    tokens: Optional[int] = None

@app.get("/")
async def root():
    return {
        "service": "Aurora Town LLM Gateway",
        "status": "online",
        "location": "Elestio Iceland",
        "gpu_backend": RUNPOD_GPU_ENDPOINT,
        "models": ["qwen2.5:7b", "llama3.1:8b"]
    }

@app.get("/health")
async def health():
    health_status = {
        "aurora_town": "unknown",
        "runpod_gpu": "unknown"
    }
    
    # Check local Ollama
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"{OLLAMA_BASE}/api/tags")
            health_status["aurora_town"] = "healthy" if response.status_code == 200 else "error"
    except:
        health_status["aurora_town"] = "offline"
    
    # Check RunPod GPU
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"{RUNPOD_GPU_ENDPOINT}/health")
            health_status["runpod_gpu"] = "healthy" if response.status_code == 200 else "error"
    except:
        health_status["runpod_gpu"] = "offline"
    
    return health_status

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
    backend = "runpod-gpu" if request.use_gpu else "local"
    
    try:
        # Route to RunPod GPU if available and requested
        if request.use_gpu:
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    gpu_response = await client.post(
                        f"{RUNPOD_GPU_ENDPOINT}/inference",
                        json={
                            "model": request.model,
                            "prompt": request.prompt,
                            "temperature": request.temperature,
                            "max_tokens": request.max_tokens
                        },
                        timeout=120.0
                    )
                    
                    if gpu_response.status_code == 200:
                        data = gpu_response.json()
                        inference_time = time.time() - start_time
                        
                        return ChatResponse(
                            response=data.get("response", ""),
                            model=request.model,
                            inference_time=round(inference_time, 2),
                            backend="runpod-gpu",
                            tokens=data.get("tokens")
                        )
            except Exception as gpu_error:
                print(f"GPU backend failed, falling back to local: {gpu_error}")
                backend = "local-fallback"
        
        # Fallback to local Ollama
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
                    backend=backend,
                    tokens=data.get("eval_count")
                )
            else:
                raise HTTPException(status_code=502, detail="Inference failed")
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Inference timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/backends/status")
async def backends_status():
    status = {}
    
    # Check RunPod GPU
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{RUNPOD_GPU_ENDPOINT}/gpu/status")
            if response.status_code == 200:
                status["runpod_gpu"] = response.json()
            else:
                status["runpod_gpu"] = {"status": "error"}
    except:
        status["runpod_gpu"] = {"status": "offline"}
    
    return status

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080, log_level="info")
PYEOF

# Install dependencies
pip install fastapi uvicorn httpx pydantic python-dotenv -q

# Create systemd service
cat > /etc/systemd/system/aurora-llm-gateway.service << 'EOF'
[Unit]
Description=Aurora Town LLM Gateway
After=network.target ollama.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/aurora-dev/aurora/llm-gateway
Environment="RUNPOD_GPU_ENDPOINT=http://209.170.80.132:8000"
ExecStart=/usr/bin/python3 /opt/aurora-dev/aurora/llm-gateway/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable aurora-llm-gateway
systemctl restart aurora-llm-gateway
sleep 2

echo ""
echo "✅ AURORA TOWN LLM SERVICE READY!"
echo ""
echo "📊 Services:"
systemctl is-active ollama && echo "  ✅ Ollama" || echo "  ❌ Ollama"
systemctl is-active aurora-llm-gateway && echo "  ✅ LLM Gateway" || echo "  ❌ LLM Gateway"

echo ""
echo "🌐 Endpoints:"
echo "  Health:   http://aurora-town-u44170.vm.elestio.app:8080/health"
echo "  Models:   http://aurora-town-u44170.vm.elestio.app:8080/models"
echo "  Chat:     POST http://aurora-town-u44170.vm.elestio.app:8080/chat"
echo "  Backends: http://aurora-town-u44170.vm.elestio.app:8080/backends/status"
echo ""
echo "📝 Logs:"
echo "  journalctl -u aurora-llm-gateway -f"
echo ""
echo "🚀 Aurora Town orchestrates, RunPod GPU computes!"

