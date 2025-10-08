#!/bin/bash
# Start GPU Mesh Keepalive Service

echo "🚀 Starting GPU Mesh Keepalive..."

# Check if already running
if pgrep -f "gpu_keepalive.py" > /dev/null; then
    echo "⚠️  GPU Mesh already running (PID: $(pgrep -f gpu_keepalive.py))"
    exit 0
fi

# Start in background
cd /home/allan/aurora-ai-robbiverse/services/gpu-mesh
nohup python3 gpu_keepalive.py > /tmp/gpu-mesh.log 2>&1 &
PID=$!

sleep 2

if ps -p $PID > /dev/null; then
    echo "✅ GPU Mesh started (PID: $PID)"
    echo "📊 Logs: tail -f /tmp/gpu-mesh.log"
else
    echo "❌ Failed to start GPU Mesh"
    exit 1
fi
