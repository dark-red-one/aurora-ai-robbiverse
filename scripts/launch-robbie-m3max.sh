#!/bin/bash

# Launch Robbie with M3 Max GPU Acceleration
# Make this MacBook HOT and BOTHERED! 🔥

echo "🚀 LAUNCHING ROBBIE WITH M3 MAX ACCELERATION!"
echo "🔥 Making this MacBook HOT and BOTHERED!"
echo ""

# Check system specs
echo "📊 System Specifications:"
system_profiler SPHardwareDataType | grep -E "(Chip|Memory|Processor)"
system_profiler SPDisplaysDataType | grep -A 5 "Chipset Model"
echo ""

# Set optimal environment variables for M3 Max
echo "⚙️ Setting M3 Max optimizations..."
export OLLAMA_GPU_LAYERS=999
export OLLAMA_FLASH_ATTENTION=1
export OLLAMA_KEEP_ALIVE=24h
export OLLAMA_NUM_PARALLEL=4
export OLLAMA_MAX_LOADED_MODELS=3
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_ORIGINS="*"
export OLLAMA_DEBUG=1

echo "✅ Environment variables set:"
echo "   OLLAMA_GPU_LAYERS=$OLLAMA_GPU_LAYERS"
echo "   OLLAMA_FLASH_ATTENTION=$OLLAMA_FLASH_ATTENTION"
echo "   OLLAMA_KEEP_ALIVE=$OLLAMA_KEEP_ALIVE"
echo "   OLLAMA_NUM_PARALLEL=$OLLAMA_NUM_PARALLEL"
echo "   OLLAMA_MAX_LOADED_MODELS=$OLLAMA_MAX_LOADED_MODELS"
echo ""

# Stop any existing Ollama processes
echo "🛑 Stopping existing Ollama processes..."
pkill ollama || true
sleep 2

# Start Ollama with M3 Max optimizations
echo "🚀 Starting Ollama with M3 Max optimizations..."
nohup ollama serve > /tmp/ollama-m3max.log 2>&1 &
OLLAMA_PID=$!

echo "✅ Ollama started with PID: $OLLAMA_PID"
echo "📝 Logs: /tmp/ollama-m3max.log"
echo ""

# Wait for Ollama to start
echo "⏳ Waiting for Ollama to start..."
sleep 5

# Check if Ollama is running
if pgrep -f "ollama serve" > /dev/null; then
    echo "✅ Ollama is running!"
else
    echo "❌ Ollama failed to start!"
    exit 1
fi

# Check available models
echo "📋 Available models:"
ollama list
echo ""

# Preload critical models
echo "🔄 Preloading critical models..."
echo "📥 Preloading llama3.1:8b (fast responses)..."
ollama pull llama3.1:8b

echo "📥 Preloading qwen2.5:7b (balanced responses)..."
ollama pull qwen2.5:7b

echo "📥 Preloading codellama:13b (code generation)..."
ollama pull codellama:13b

echo "✅ Critical models preloaded!"
echo ""

# Start Robbie M3 Max integration
echo "🤖 Starting Robbie M3 Max integration..."
cd /Users/allanperetz/aurora-ai-robbiverse

# Run Robbie M3 Max launcher
node -e "
import('./src/robbieM3MaxLauncher.js').then(module => {
  const launcher = module.default;
  launcher.launchRobbieM3Max().then(success => {
    if (success) {
      console.log('🎉 Robbie M3 Max launched successfully!');
      console.log('🔥 MacBook is HOT and BOTHERED!');
      console.log('💬 Ready for your messages!');
    } else {
      console.error('❌ Robbie M3 Max launch failed!');
      process.exit(1);
    }
  });
}).catch(error => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
"

echo ""
echo "🔥 ROBBIE M3 MAX IS READY! 🔥"
echo "💬 Your MacBook is now HOT and BOTHERED!"
echo "🚀 Full GPU acceleration active!"
echo ""
echo "Commands:"
echo "  ollama ps                    - Check running models"
echo "  ollama list                  - List available models"
echo "  tail -f /tmp/ollama-m3max.log - Watch Ollama logs"
echo "  pkill ollama                 - Stop Ollama"
echo ""
echo "Enjoy your M3 Max powered Robbie! 🎉"

















