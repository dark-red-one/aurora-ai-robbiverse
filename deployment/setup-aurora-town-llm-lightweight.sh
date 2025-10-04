#!/bin/bash
# Setup LIGHTWEIGHT LLM Gateway on Aurora Town
# Just FastAPI proxy - no heavy ML deps

set -euo pipefail

echo "🚀 SETTING UP LIGHTWEIGHT LLM GATEWAY ON AURORA TOWN"
echo "====================================================="

# Check disk space first
echo "💾 Disk space:"
df -h / | tail -1

# Install ONLY what we need (no torch/ML libs)
echo "📥 Installing minimal dependencies..."
pip install --no-cache-dir fastapi uvicorn httpx pydantic -q || {
    echo "⚠️  Pip install failed, trying with --break-system-packages"
    pip install --no-cache-dir --break-system-packages fastapi uvicorn httpx pydantic -q
}

# Install Ollama (lightweight)
echo "📥 Installing Ollama..."
if ! command -v ollama &> /dev/null; then
    curl -fsSL https://ollama.com/install.sh | sh
    echo "✅ Ollama installed"
else
    echo "✅ Ollama already installed"
fi

# Configure Ollama
echo "⚙️  Configuring Ollama..."
mkdir -p /etc/systemd/system/ollama.service.d/
cat > /etc/systemd/system/ollama.service.d/override.conf << 'EOF'
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_ORIGINS=*"
Environment="OLLAMA_KEEP_ALIVE=24h"
Environment="RUNPOD_GPU_ENDPOINT=http://209.170.80.132:8000"
EOF

systemctl daemon-reload
systemctl enable ollama
systemctl restart ollama
sleep 3

# Don't pull models yet - save disk space
echo "⏭️  Skipping model downloads to save disk space"

# Create lightweight LLM Gateway
echo "🌐 Creating LLM Gateway..."
mkdir -p /opt/aurora-dev/aurora/llm-gateway
cat > /opt/aurora-dev/aurora/llm-gateway/main.py << 'PYEOF'
#!/usr/bin/env python3
"""
Aurora Town LLM Gateway (Lightweight)
Routes to RunPod GPU - no local ML dependencies
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from typing import Optional
import time

app = FastAPI(title="Aurora Town LLM Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_BASE = "http://localhost:11434"
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
    backend: str

@app.get("/")
async def root():
    return {
        "service": "Aurora Town LLM Gateway",
        "status": "online",
        "gpu_backend": RUNPOD_GPU_ENDPOINT,
        "purpose": "Lightweight proxy to RunPod GPU"
    }

@app.get("/health")
async def health():
    status = {"aurora_town": "healthy", "runpod_gpu": "unknown"}
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"{RUNPOD_GPU_ENDPOINT}/health")
            status["runpod_gpu"] = "healthy" if response.status_code == 200 else "error"
    except:
        status["runpod_gpu"] = "offline"
    
    return status

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    start_time = time.time()
    
    try:
        # Route to RunPod GPU
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
                    backend="runpod-gpu"
                )
            else:
                raise HTTPException(status_code=502, detail="GPU backend error")
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/backends/status")
async def backends_status():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{RUNPOD_GPU_ENDPOINT}/gpu/status")
            if response.status_code == 200:
                return {"runpod_gpu": response.json()}
    except:
        pass
    return {"runpod_gpu": {"status": "offline"}}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080, log_level="info")
PYEOF

# Create systemd service
cat > /etc/systemd/system/aurora-llm-gateway.service << 'EOF'
[Unit]
Description=Aurora Town LLM Gateway
After=network.target

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
echo "✅ AURORA TOWN LLM GATEWAY READY!"
echo ""
echo "📊 Services:"
systemctl is-active aurora-llm-gateway && echo "  ✅ LLM Gateway" || echo "  ❌ LLM Gateway"

echo ""
echo "🌐 Endpoints:"
echo "  http://aurora-town-u44170.vm.elestio.app:8080/health"
echo "  POST http://aurora-town-u44170.vm.elestio.app:8080/chat"
echo ""
echo "📝 Logs:"
echo "  journalctl -u aurora-llm-gateway -f"

