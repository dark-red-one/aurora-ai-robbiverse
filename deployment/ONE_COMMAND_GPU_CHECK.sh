#!/bin/bash
# ONE COMMAND GPU CHECK - 36 HOURS OF MADNESS ENDS HERE!
# Just copy-paste this ONE command into RunPod web terminal

echo "🔥 36 HOURS OF GPU MADNESS - ONE COMMAND CHECK!"
echo "=============================================="
echo "Time: $(date)"
echo ""

# Check everything at once
echo "📊 GPU STATUS:"
nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total,power.draw,temperature.gpu --format=csv,noheader,nounits

echo ""
echo "🤖 OLLAMA STATUS:"
if pgrep -f ollama > /dev/null; then
    echo "✅ Ollama is running"
    ps aux | grep ollama | grep -v grep
else
    echo "❌ Ollama is NOT running"
    echo "🚀 Starting Ollama with GPU..."
    pkill ollama || true
    OLLAMA_HOST=0.0.0.0:11435 OLLAMA_GPU_LAYERS=999 OLLAMA_FLASH_ATTENTION=1 OLLAMA_KEEP_ALIVE=24h ollama serve > /tmp/ollama.log 2>&1 &
    sleep 5
    echo "✅ Ollama started!"
fi

echo ""
echo "🧪 TESTING GPU INFERENCE:"
ollama run llama3.1:8b "Hello Allan! 36 hours later - this is REAL GPU inference!"

echo ""
echo "📊 FINAL GPU STATUS:"
nvidia-smi --query-gpu=utilization.gpu,memory.used,power.draw --format=csv,noheader,nounits

echo ""
echo "✅ 36 HOURS OF GPU MADNESS - DONE!"
echo "=================================="

