#!/bin/bash
# Stop GPU Mesh Keepalive Service

echo "🛑 Stopping GPU Mesh Keepalive..."

if pgrep -f "gpu_keepalive.py" > /dev/null; then
    pkill -f "gpu_keepalive.py"
    sleep 2
    
    if pgrep -f "gpu_keepalive.py" > /dev/null; then
        echo "⚠️  Force killing..."
        pkill -9 -f "gpu_keepalive.py"
    fi
    
    echo "✅ GPU Mesh stopped"
else
    echo "ℹ️  GPU Mesh not running"
fi
