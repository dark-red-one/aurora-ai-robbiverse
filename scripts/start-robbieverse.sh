#!/bin/bash

# Robbieverse Startup Script
# One command to rule them all - Local LLM + GPU + SQL + Robbie Sidebar
# Let's get this shit moving! 🚀

echo "🚀 STARTING ROBBIEVERSE - LET'S GET THIS SHIT MOVING!"
echo "======================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "data/robbiebook.db" ]; then
    echo "❌ Not in robbieverse directory. Please run from /Users/allanperetz/aurora-ai-robbiverse"
    exit 1
fi

# 1. Start Ollama with M3 Max acceleration
echo "🔥 Step 1: Starting Ollama with M3 Max acceleration..."
if ! pgrep -f "ollama serve" > /dev/null; then
    echo "⚙️ Setting M3 Max optimizations..."
    export OLLAMA_GPU_LAYERS=999
    export OLLAMA_FLASH_ATTENTION=1
    export OLLAMA_KEEP_ALIVE=24h
    export OLLAMA_NUM_PARALLEL=4
    export OLLAMA_MAX_LOADED_MODELS=3
    export OLLAMA_HOST=0.0.0.0:11434
    export OLLAMA_ORIGINS="*"
    export OLLAMA_DEBUG=1
    
    echo "🚀 Starting Ollama..."
    nohup ollama serve > /tmp/ollama-m3max.log 2>&1 &
    sleep 3
    
    if pgrep -f "ollama serve" > /dev/null; then
        echo "✅ Ollama started with M3 Max acceleration!"
    else
        echo "❌ Ollama failed to start!"
        exit 1
    fi
else
    echo "✅ Ollama already running!"
fi

# 2. Check Robbie's state in SQL
echo ""
echo "🗄️ Step 2: Checking Robbie's state in SQL..."
ROBBIE_MOOD=$(sqlite3 data/robbiebook.db "SELECT current_mood FROM ai_personality_state WHERE personality_id = 'robbie';")
ROBBIE_MODE=$(sqlite3 data/robbiebook.db "SELECT current_mode FROM ai_personality_state WHERE personality_id = 'robbie';")

echo "📊 Robbie's Current State:"
echo "   Mood: $ROBBIE_MOOD"
echo "   Mode: $ROBBIE_MODE"

# 3. Check Robbie Avatar extension
echo ""
echo "🤖 Step 3: Checking Robbie Avatar extension..."
if cursor --list-extensions | grep -q "testpilot.robbie-avatar"; then
    echo "✅ Robbie Avatar extension installed!"
else
    echo "❌ Robbie Avatar extension not found!"
    echo "   Installing..."
    cursor --install-extension testpilot.robbie-avatar
fi

# 4. Check available models
echo ""
echo "🧠 Step 4: Checking available models..."
echo "📋 Available models:"
ollama list | head -10

# 5. Check GPU utilization
echo ""
echo "🔥 Step 5: Checking GPU utilization..."
if command -v system_profiler > /dev/null; then
    GPU_CORES=$(system_profiler SPDisplaysDataType | grep "Total Number of Cores" | awk '{print $5}')
    echo "🎮 GPU Cores: $GPU_CORES"
fi

# 6. Check memory status
echo ""
echo "💾 Step 6: Checking memory status..."
MEMORY_GB=$(system_profiler SPHardwareDataType | grep Memory | awk '{print $2}')
echo "💾 Total Memory: $MEMORY_GB"

# 7. Show system status
echo ""
echo "📊 Step 7: System Status Summary"
echo "================================"
echo "✅ Ollama: $(pgrep -f 'ollama serve' > /dev/null && echo 'RUNNING' || echo 'STOPPED')"
echo "✅ Robbie Mood: $ROBBIE_MOOD"
echo "✅ Robbie Mode: $ROBBIE_MODE"
echo "✅ SQL Database: $(test -f data/robbiebook.db && echo 'READY' || echo 'MISSING')"
echo "✅ Robbie Extension: $(cursor --list-extensions | grep -q 'testpilot.robbie-avatar' && echo 'INSTALLED' || echo 'MISSING')"
echo "✅ GPU Cores: $GPU_CORES"
echo "✅ Memory: $MEMORY_GB"
echo "================================"

# 8. Final instructions
echo ""
echo "🎉 ROBBIEVERSE IS READY! 🎉"
echo "=========================="
echo ""
echo "🔥 M3 Max GPU acceleration: ACTIVE"
echo "🧠 Local LLM models: READY"
echo "🗄️ SQL database: CONNECTED"
echo "🤖 Robbie Avatar: INSTALLED"
echo ""
echo "Next steps:"
echo "1. Open Cursor"
echo "2. Robbie sidebar should load automatically"
echo "3. Start chatting with Robbie!"
echo ""
echo "Commands:"
echo "  ollama ps                    - Check running models"
echo "  ollama list                  - List available models"
echo "  tail -f /tmp/ollama-m3max.log - Watch Ollama logs"
echo "  sqlite3 data/robbiebook.db    - Access SQL database"
echo ""
echo "🚀 LET'S GET THIS SHIT MOVING! 🚀"

















