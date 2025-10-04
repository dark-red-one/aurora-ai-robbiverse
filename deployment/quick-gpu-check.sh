#!/bin/bash
# Quick GPU Check - Copy-paste this into RunPod web terminal

echo "🔥 QUICK GPU CHECK - RUNPOD B200"
echo "================================"

# Check GPU status
echo "📊 GPU Status:"
nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total,power.draw,temperature.gpu --format=csv,noheader,nounits

echo ""
echo "🤖 Ollama Status:"
if pgrep -f ollama > /dev/null; then
    echo "✅ Ollama is running"
    ps aux | grep ollama | grep -v grep
else
    echo "❌ Ollama is NOT running"
fi

echo ""
echo "🔍 GPU Processes:"
nvidia-smi pmon -c 1

echo ""
echo "📈 Real-time monitoring (Ctrl+C to stop):"
while true; do
    echo "$(date): $(nvidia-smi --query-gpu=utilization.gpu,memory.used,power.draw --format=csv,noheader,nounits)"
    sleep 2
done

