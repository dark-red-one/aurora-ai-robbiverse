#!/bin/bash
# Connect Aurora Town to RunPod GPU Mesh
# This script configures Aurora Town to use the GPU mesh for AI workloads

set -e

echo "🚀 CONNECTING AURORA TOWN TO GPU MESH"
echo "====================================="

# GPU Mesh Configuration
GPU_MESH_ENDPOINT="http://209.170.80.132:8002"
AURORA_TOWN_IP="45.32.194.172"  # Update with correct IP

echo "🔗 GPU Mesh Endpoint: $GPU_MESH_ENDPOINT"
echo "🏛️ Aurora Town IP: $AURORA_TOWN_IP"

# Test GPU mesh connectivity
echo "🧪 Testing GPU mesh connectivity..."
if curl -s --connect-timeout 10 "$GPU_MESH_ENDPOINT/mesh/health" >/dev/null; then
    echo "✅ GPU mesh is accessible"
else
    echo "❌ GPU mesh not accessible - check RunPod status"
    exit 1
fi

# Create GPU mesh integration service
echo "🌐 Creating GPU mesh integration service..."
cat > /tmp/aurora-gpu-mesh-integration.py << 'PYEOF'
#!/usr/bin/env python3
"""
Aurora Town GPU Mesh Integration
Routes AI workloads to RunPod GPU mesh
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import json
import time
from typing import Dict, List, Optional

app = FastAPI(title="Aurora Town GPU Mesh Integration", version="1.0.0")

# GPU Mesh Configuration
GPU_MESH_BASE = "http://209.170.80.132:8002"
MESH_TIMEOUT = 30

class ChatRequest(BaseModel):
    model: str = "qwen2.5:7b"
    messages: List[Dict[str, str]]
    temperature: float = 0.7
    max_tokens: int = 2000

class ChatResponse(BaseModel):
    response: str
    model: str
    gpu_node: str
    inference_time: float
    tokens_used: int

def get_mesh_status() -> Dict:
    """Get current GPU mesh status"""
    try:
        response = requests.get(f"{GPU_MESH_BASE}/mesh/status", timeout=10)
        return response.json()
    except Exception as e:
        return {"error": str(e), "status": "offline"}

def get_available_gpus() -> List[Dict]:
    """Get available GPUs from mesh"""
    try:
        response = requests.get(f"{GPU_MESH_BASE}/mesh/gpus", timeout=10)
        return response.json().get("available_gpus", [])
    except Exception as e:
        return []

def distribute_task_to_mesh(task: Dict) -> Dict:
    """Distribute task to GPU mesh"""
    try:
        response = requests.post(
            f"{GPU_MESH_BASE}/mesh/distribute",
            json=task,
            timeout=MESH_TIMEOUT
        )
        return response.json()
    except Exception as e:
        return {"error": str(e), "status": "failed"}

@app.get("/")
async def root():
    return {
        "service": "Aurora Town GPU Mesh Integration",
        "status": "active",
        "gpu_mesh_endpoint": GPU_MESH_BASE,
        "purpose": "Route AI workloads to RunPod GPU mesh"
    }

@app.get("/health")
async def health():
    """Health check including GPU mesh status"""
    mesh_status = get_mesh_status()
    
    return {
        "status": "healthy" if "error" not in mesh_status else "degraded",
        "aurora_town": "online",
        "gpu_mesh": mesh_status,
        "timestamp": time.time()
    }

@app.get("/gpu/status")
async def gpu_status():
    """Get GPU status from mesh"""
    return get_mesh_status()

@app.get("/gpu/available")
async def available_gpus():
    """Get available GPUs from mesh"""
    gpus = get_available_gpus()
    return {
        "available_gpus": gpus,
        "total_gpus": len(gpus),
        "total_vram_gb": sum(gpu.get("memory_total", 0) for gpu in gpus) / 1024
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Route chat request to GPU mesh"""
    start_time = time.time()
    
    # Prepare task for GPU mesh
    task = {
        "id": f"chat_{int(time.time())}",
        "type": "chat",
        "model": request.model,
        "messages": request.messages,
        "temperature": request.temperature,
        "max_tokens": request.max_tokens,
        "priority": "normal"
    }
    
    # Distribute to GPU mesh
    result = distribute_task_to_mesh(task)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=f"GPU mesh error: {result['error']}")
    
    # Simulate response (replace with actual GPU inference)
    response_text = f"GPU mesh processed: {request.messages[0]['content'][:100]}... (Integration pending)"
    
    inference_time = time.time() - start_time
    
    return ChatResponse(
        response=response_text,
        model=request.model,
        gpu_node=result.get("assigned_node", "unknown"),
        inference_time=inference_time,
        tokens_used=len(response_text.split())
    )

@app.post("/gpu/task")
async def submit_gpu_task(task: Dict):
    """Submit custom task to GPU mesh"""
    result = distribute_task_to_mesh(task)
    return result

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Aurora Town GPU Mesh Integration...")
    print(f"🔗 GPU Mesh Endpoint: {GPU_MESH_BASE}")
    uvicorn.run(app, host="0.0.0.0", port=8003, log_level="info")
PYEOF

echo "✅ GPU mesh integration service created"

# Create systemd service
echo "⚙️ Creating systemd service..."
cat > /tmp/aurora-gpu-mesh.service << 'SERVICEEOF'
[Unit]
Description=Aurora Town GPU Mesh Integration
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/aurora-dev/aurora
ExecStart=/usr/bin/python3 /opt/aurora-dev/aurora/gpu-mesh-integration.py
Restart=always
RestartSec=5
Environment="GPU_MESH_ENDPOINT=http://209.170.80.132:8002"

[Install]
WantedBy=multi-user.target
SERVICEEOF

echo "✅ Systemd service created"

echo ""
echo "🎯 AURORA TOWN GPU MESH INTEGRATION READY!"
echo "=========================================="
echo "📋 Next steps:"
echo "1. Copy files to Aurora Town:"
echo "   scp /tmp/aurora-gpu-mesh-integration.py root@$AURORA_TOWN_IP:/opt/aurora-dev/aurora/"
echo "   scp /tmp/aurora-gpu-mesh.service root@$AURORA_TOWN_IP:/etc/systemd/system/"
echo ""
echo "2. Start the service on Aurora Town:"
echo "   systemctl daemon-reload"
echo "   systemctl enable aurora-gpu-mesh"
echo "   systemctl start aurora-gpu-mesh"
echo ""
echo "3. Test the integration:"
echo "   curl http://$AURORA_TOWN_IP:8003/health"
echo "   curl http://$AURORA_TOWN_IP:8003/gpu/status"
echo ""
echo "🔗 Integration endpoints:"
echo "• Health: http://$AURORA_TOWN_IP:8003/health"
echo "• GPU Status: http://$AURORA_TOWN_IP:8003/gpu/status"
echo "• Chat: POST http://$AURORA_TOWN_IP:8003/chat"
echo "• GPU Tasks: POST http://$AURORA_TOWN_IP:8003/gpu/task"


