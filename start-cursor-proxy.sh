#!/bin/bash
# Start Cursor GPU Proxy - gives Cursor access to all GPUs

cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse

# Kill any existing proxy
pkill -f cursor-gpu-proxy.py

# Start proxy
echo "🚀 Starting Cursor GPU Proxy..."
nohup python3 cursor-gpu-proxy.py > /tmp/cursor-proxy.log 2>&1 &

sleep 2

# Verify it's running
if curl -s http://localhost:11435/api/tags > /dev/null; then
    echo "✅ Cursor GPU Proxy is LIVE on port 11435"
    echo "📊 Available models:"
    curl -s http://localhost:11435/api/tags | python3 -c "import sys, json; data=json.load(sys.stdin); [print(f'  - {m[\"name\"]}') for m in data['models']]"
else
    echo "❌ Proxy failed to start. Check /tmp/cursor-proxy.log"
fi







