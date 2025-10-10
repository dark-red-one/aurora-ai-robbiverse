#!/bin/bash
# RunPod B200 GPU Real-Time Monitoring Script
# Copy-paste this into the RunPod web terminal for REAL GPU monitoring

echo "🔥 RUNPOD B200 GPU REAL-TIME MONITORING SCRIPT"
echo "=============================================="
echo ""

# Function to display GPU status
show_gpu_status() {
    echo "📊 GPU Status at $(date):"
    echo "------------------------"
    
    # Basic nvidia-smi
    echo "🔍 Basic GPU Info:"
    nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader,nounits
    
    # Detailed utilization
    echo "⚡ GPU Utilization:"
    nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total,power.draw,temperature.gpu --format=csv,noheader,nounits
    
    # GPU processes
    echo "🔍 GPU Processes:"
    nvidia-smi pmon -c 1
    
    echo ""
}

# Function to check Ollama status
check_ollama() {
    echo "🤖 Ollama Status:"
    echo "----------------"
    
    if pgrep -f ollama > /dev/null; then
        echo "✅ Ollama is running"
        echo "📋 Ollama processes:"
        ps aux | grep ollama | grep -v grep
    else
        echo "❌ Ollama is NOT running"
    fi
    echo ""
}

# Function to start Ollama with GPU
start_ollama_gpu() {
    echo "🚀 Starting Ollama with GPU acceleration..."
    echo "------------------------------------------"
    
    # Kill existing Ollama
    echo "🛑 Stopping existing Ollama..."
    pkill ollama || true
    sleep 2
    
    # Start Ollama with GPU
    echo "🚀 Starting Ollama with GPU..."
    OLLAMA_HOST=0.0.0.0:11435 OLLAMA_GPU_LAYERS=999 OLLAMA_FLASH_ATTENTION=1 OLLAMA_KEEP_ALIVE=24h ollama serve > /tmp/ollama.log 2>&1 &
    
    # Wait for Ollama to start
    echo "⏳ Waiting for Ollama to start..."
    sleep 5
    
    # Check if it's running
    if pgrep -f ollama > /dev/null; then
        echo "✅ Ollama started successfully!"
    else
        echo "❌ Ollama failed to start. Check logs:"
        tail -20 /tmp/ollama.log
    fi
    echo ""
}

# Function to test GPU inference
test_gpu_inference() {
    echo "🧪 Testing GPU Inference..."
    echo "--------------------------"
    
    # Test inference
    echo "🤖 Running Ollama inference test..."
    ollama run llama3.1:8b "Hello Allan! This is REAL GPU inference on B200! Testing GPU acceleration!"
    
    echo ""
}

# Function to monitor GPU in real-time
monitor_gpu_realtime() {
    echo "📊 Starting Real-Time GPU Monitoring..."
    echo "====================================="
    echo "Press Ctrl+C to stop monitoring"
    echo ""
    
    while true; do
        clear
        echo "🔥 RUNPOD B200 REAL-TIME GPU MONITOR"
        echo "===================================="
        echo "Time: $(date)"
        echo ""
        
        # Show GPU status
        show_gpu_status
        
        # Check Ollama
        check_ollama
        
        # Wait 5 seconds
        sleep 5
    done
}

# Function to run comprehensive test
run_comprehensive_test() {
    echo "🧪 RUNNING COMPREHENSIVE GPU TEST"
    echo "================================="
    echo ""
    
    # Initial status
    echo "1️⃣ Initial GPU Status:"
    show_gpu_status
    
    # Start Ollama
    echo "2️⃣ Starting Ollama with GPU:"
    start_ollama_gpu
    
    # Check status after start
    echo "3️⃣ GPU Status After Ollama Start:"
    show_gpu_status
    
    # Test inference
    echo "4️⃣ Testing GPU Inference:"
    test_gpu_inference
    
    # Final status
    echo "5️⃣ Final GPU Status:"
    show_gpu_status
    
    echo "✅ Comprehensive test completed!"
}

# Main menu
echo "Choose an option:"
echo "1. Show current GPU status"
echo "2. Start Ollama with GPU"
echo "3. Test GPU inference"
echo "4. Monitor GPU in real-time"
echo "5. Run comprehensive test"
echo "6. Exit"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        show_gpu_status
        check_ollama
        ;;
    2)
        start_ollama_gpu
        ;;
    3)
        test_gpu_inference
        ;;
    4)
        monitor_gpu_realtime
        ;;
    5)
        run_comprehensive_test
        ;;
    6)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

