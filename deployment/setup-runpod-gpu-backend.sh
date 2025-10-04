#!/bin/bash
# Setup RunPod as pure GPU inference backend
# No Ollama, just vLLM for maximum performance

set -euo pipefail

echo "🚀 SETTING UP RUNPOD GPU BACKEND"
echo "================================="

# Check GPU
echo "🔍 GPU Info:"
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader

# Install vLLM for high-performance inference
echo "📥 Installing vLLM..."
pip install vllm -q

# Create GPU inference service
echo "🌐 Creating GPU inference backend..."
mkdir -p /root/gpu-backend
cat > /root/gpu-backend/main.py << 'PYEOF'
#!/usr/bin/env python3
"""
RunPod GPU Inference Backend
Pure GPU compute for Aurora Town
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import torch
import subprocess
import time

app = FastAPI(title="RunPod GPU Backend", version="1.0.0")

# Will initialize vLLM model here
llm = None
current_model = None

class InferenceRequest(BaseModel):
    model: str = "qwen2.5:7b"
    prompt: str
    temperature: float = 0.7
    max_tokens: int = 2000

class InferenceResponse(BaseModel):
    response: str
    model: str
    tokens: int
    inference_time: float

@app.get("/")
async def root():
    return {
        "service": "RunPod GPU Backend",
        "status": "online",
        "gpu": "RTX 4090 24GB",
        "purpose": "Pure inference backend for Aurora Town"
    }

@app.get("/health")
async def health():
    gpu_available = torch.cuda.is_available()
    return {
        "status": "healthy" if gpu_available else "degraded",
        "gpu_available": gpu_available,
        "gpu_count": torch.cuda.device_count() if gpu_available else 0
    }

@app.get("/gpu/status")
async def gpu_status():
    try:
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_mem_total = torch.cuda.get_device_properties(0).total_memory / 1024**3
            gpu_mem_used = torch.cuda.memory_allocated(0) / 1024**3
            
            # Get utilization from nvidia-smi
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=utilization.gpu,temperature.gpu", 
                 "--format=csv,noheader,nounits"],
                capture_output=True, text=True, timeout=5
            )
            
            if result.returncode == 0:
                util, temp = result.stdout.strip().split(", ")
                return {
                    "gpu_name": gpu_name,
                    "memory_total_gb": round(gpu_mem_total, 2),
                    "memory_used_gb": round(gpu_mem_used, 2),
                    "utilization": f"{util}%",
                    "temperature": f"{temp}°C",
                    "status": "active"
                }
        
        return {"status": "no_gpu"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/inference", response_model=InferenceResponse)
async def inference(request: InferenceRequest):
    """
    Simple inference endpoint
    TODO: Integrate vLLM or use subprocess to Ollama
    For now, using PyTorch placeholder
    """
    start_time = time.time()
    
    try:
        # Placeholder - will integrate actual model inference
        # For now, acknowledge we received it
        response_text = f"GPU processed: {request.prompt[:100]}... (Backend integration pending)"
        
        inference_time = time.time() - start_time
        
        return InferenceResponse(
            response=response_text,
            model=request.model,
            tokens=len(response_text.split()),
            inference_time=round(inference_time, 3)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
PYEOF

# Install FastAPI
pip install fastapi uvicorn torch -q

# Create systemd service
cat > /etc/systemd/system/gpu-backend.service << 'EOF'
[Unit]
Description=RunPod GPU Inference Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/gpu-backend
ExecStart=/usr/bin/python3 /root/gpu-backend/main.py
Restart=always
RestartSec=10
Environment="CUDA_VISIBLE_DEVICES=0"

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable gpu-backend
systemctl restart gpu-backend
sleep 2

echo ""
echo "✅ RUNPOD GPU BACKEND READY!"
echo ""
echo "📊 Service:"
systemctl is-active gpu-backend && echo "  ✅ GPU Backend Running" || echo "  ❌ GPU Backend Stopped"

echo ""
echo "🌐 Endpoint:"
echo "  http://209.170.80.132:8000"
echo ""
echo "🧪 Test:"
echo "  curl http://209.170.80.132:8000/gpu/status"
echo ""
echo "📝 Logs:"
echo "  journalctl -u gpu-backend -f"
echo ""
echo "💪 Pure GPU muscle, ready for Aurora Town brain!"

