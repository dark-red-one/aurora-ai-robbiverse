#!/bin/bash
# Start multiple specialized Ollama models

echo "🚀 Starting Multi-Model Ollama Beast Mode..."
echo ""

# Check available RAM
AVAILABLE_RAM=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024)}')
echo "💾 Available RAM: ${AVAILABLE_RAM}GB"
echo ""

# Model 1: Business AI (always-on, port 11434)
echo "1️⃣ Starting Business AI (llama3.1:8b) on port 11434..."
if ! pgrep -f "ollama.*11434" > /dev/null; then
    OLLAMA_HOST=127.0.0.1:11434 ollama serve > /tmp/ollama-business.log 2>&1 &
    sleep 3
    ollama run llama3.1:8b --keepalive 24h > /dev/null 2>&1 &
    echo "   ✅ Business AI ready (5GB RAM)"
else
    echo "   ✅ Already running"
fi

# Model 2: Code Assistant (always-on, port 11435)
echo "2️⃣ Starting Code AI (codellama:13b) on port 11435..."
if ! pgrep -f "ollama.*11435" > /dev/null; then
    OLLAMA_HOST=127.0.0.1:11435 ollama serve > /tmp/ollama-code.log 2>&1 &
    sleep 3
    OLLAMA_HOST=127.0.0.1:11435 ollama run codellama:13b --keepalive 24h > /dev/null 2>&1 &
    echo "   ✅ Code AI ready (7.4GB RAM)"
else
    echo "   ✅ Already running"
fi

# Model 3: Power Mode (on-demand, port 11436)
if [ "$AVAILABLE_RAM" -gt 40 ]; then
    echo "3️⃣ Starting Power AI (qwen2.5:14b) on port 11436..."
    if ! pgrep -f "ollama.*11436" > /dev/null; then
        OLLAMA_HOST=127.0.0.1:11436 ollama serve > /tmp/ollama-power.log 2>&1 &
        sleep 3
        OLLAMA_HOST=127.0.0.1:11436 ollama run qwen2.5:14b --keepalive 2h > /dev/null 2>&1 &
        echo "   ✅ Power AI ready (9GB RAM)"
    else
        echo "   ✅ Already running"
    fi
else
    echo "3️⃣ Skipping Power AI (need more RAM)"
fi

echo ""
echo "🎯 Multi-Model Status:"
echo "   Business AI:  http://localhost:11434 (llama3.1:8b)"
echo "   Code AI:      http://localhost:11435 (codellama:13b)"
echo "   Power AI:     http://localhost:11436 (qwen2.5:14b)"
echo ""
echo "💡 Test with:"
echo "   curl http://localhost:11434/api/tags  # Business AI"
echo "   curl http://localhost:11435/api/tags  # Code AI"
echo "   curl http://localhost:11436/api/tags  # Power AI"
