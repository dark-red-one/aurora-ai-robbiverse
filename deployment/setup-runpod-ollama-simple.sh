#!/bin/bash
# Simple Ollama setup for RunPod GPU
# Lightweight, just exposes Ollama with GPU

set -euo pipefail

echo "🚀 SIMPLE RUNPOD OLLAMA SETUP"
echo "============================="

# Check GPU
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader

# Clean up failed installs
echo "🧹 Cleaning up..."
rm -rf /root/gpu-backend /tmp/* || true

# Install Ollama
echo "📥 Installing Ollama..."
if ! command -v ollama &> /dev/null; then
    curl -fsSL https://ollama.com/install.sh | sh
fi

# Kill any existing Ollama
pkill ollama || true
sleep 2

# Start Ollama with GPU
echo "🚀 Starting Ollama with GPU..."
export CUDA_VISIBLE_DEVICES=0
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_ORIGINS=*
export OLLAMA_GPU_LAYERS=999
export OLLAMA_FLASH_ATTENTION=1
export OLLAMA_KEEP_ALIVE=24h

nohup ollama serve > /tmp/ollama.log 2>&1 &
sleep 5

# Test it
echo "🧪 Testing Ollama..."
ollama list || echo "Models: none yet"

# Pull a small model
echo "📦 Pulling qwen2.5:7b..."
ollama pull qwen2.5:7b

# Test inference
echo "🧪 Testing GPU inference..."
ollama run qwen2.5:7b "Say 'GPU Ready!'" --verbose 2>&1 | tail -5

# Check GPU usage
echo ""
echo "🔥 GPU Status:"
nvidia-smi --query-gpu=utilization.gpu,memory.used,temperature.gpu --format=csv,noheader

echo ""
echo "✅ RUNPOD OLLAMA READY!"
echo ""
echo "🌐 Endpoint: http://209.170.80.132:11434"
echo "📝 Logs: tail -f /tmp/ollama.log"
echo ""
echo "🧪 Test from Aurora Town:"
echo "curl http://209.170.80.132:11434/api/tags"

