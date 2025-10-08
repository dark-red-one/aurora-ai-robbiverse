#!/bin/bash
# 🔥💋 ROBBIE LLM PROXY STARTUP SCRIPT 🔥💋

echo "🚀 Starting Robbie LLM Proxy..."
echo ""

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
    echo "❌ Ollama is not running!"
    echo "   Start it with: ollama serve"
    exit 1
fi

echo "✅ Ollama is running"

# Activate virtual environment
if [ ! -d "llm-proxy-venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv llm-proxy-venv
    source llm-proxy-venv/bin/activate
    pip install fastapi uvicorn requests
else
    source llm-proxy-venv/bin/activate
fi

# Check if models are available
echo ""
echo "🤖 Available models:"
curl -s http://localhost:11434/api/tags | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for m in data['models']:
        print(f\"  ✅ {m['name']}\")
except:
    print('  ❌ Error fetching models')
"

echo ""
echo "🔥 Starting proxy server..."
echo "   Endpoint: http://localhost:8000"
echo "   Stats: http://localhost:8000/stats"
echo ""

# Start the proxy
cd /home/allan/aurora-ai-robbiverse/deployment
python3 robbie-llm-proxy.py

