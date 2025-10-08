#!/bin/bash
# Check GPU Mesh Status

echo "📊 GPU MESH STATUS"
echo "=" | tr '=' '='  | head -c 50; echo

if pgrep -f "gpu_keepalive.py" > /dev/null; then
    PID=$(pgrep -f "gpu_keepalive.py")
    echo "🟢 Status: RUNNING (PID: $PID)"
    echo ""
    echo "Recent logs:"
    tail -n 20 /tmp/gpu-mesh.log 2>/dev/null || echo "No logs yet"
else
    echo "🔴 Status: STOPPED"
    echo ""
    echo "Start with: ./start-gpu-mesh.sh"
fi
