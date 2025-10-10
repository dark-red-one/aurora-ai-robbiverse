#!/bin/bash
# RobbieBook1.testpilot.ai - Aurora AI Empire Startup
# Complete system startup for RobbieBook1

echo "🤖 RobbieBook1.testpilot.ai - Aurora AI Empire"
echo "   Starting Complete System Infrastructure"
echo "=========================================================="

# Check if we're in the right directory
if [ ! -f "robbiebook-proxy.py" ]; then
    echo "❌ Error: Please run this script from the aurora-ai-robbiverse directory"
    exit 1
fi

# Install required packages if not present
echo "📦 Checking dependencies..."
if ! python3 -c "import aiohttp, aiofiles, psutil" 2>/dev/null; then
    echo "   Installing required packages..."
    pip3 install aiohttp aiofiles psutil
fi

# Create log directory
mkdir -p logs

# Function to start a service in background
start_service() {
    local name=$1
    local command=$2
    local log_file=$3
    
    echo "🚀 Starting $name..."
    nohup $command > "logs/$log_file" 2>&1 &
    local pid=$!
    echo "   $name started with PID: $pid"
    echo $pid > "logs/${name,,}.pid"
    sleep 2
}

# Start Aurora AI Backend (if not already running)
if ! pgrep -f "uvicorn app.main:app" > /dev/null; then
    echo "🧠 Starting Aurora AI Backend..."
    cd backend
    nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../logs/aurora-backend.log 2>&1 &
    echo $! > ../logs/aurora-backend.pid
    cd ..
    echo "   Aurora AI Backend started on port 8000"
    sleep 3
else
    echo "✅ Aurora AI Backend already running"
fi

# Start RobbieBook1 Proxy
if ! pgrep -f "robbiebook-proxy.py" > /dev/null; then
    start_service "RobbieBook1-Proxy" "python3 robbiebook-proxy.py" "robbiebook-proxy.log"
    echo "   RobbieBook1 Proxy started on port 8080"
else
    echo "✅ RobbieBook1 Proxy already running"
fi

# Start RobbieBook1 Dashboard
if ! pgrep -f "robbiebook-dashboard.py" > /dev/null; then
    start_service "RobbieBook1-Dashboard" "python3 robbiebook-dashboard.py" "robbiebook-dashboard.log"
    echo "   RobbieBook1 Dashboard started on port 8081"
else
    echo "✅ RobbieBook1 Dashboard already running"
fi

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 5

# Check service status
echo ""
echo "📊 RobbieBook1.testpilot.ai System Status"
echo "=========================================="

# Aurora AI Backend
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Aurora AI Backend: Online (http://localhost:8000)"
else
    echo "❌ Aurora AI Backend: Offline"
fi

# RobbieBook1 Proxy
if curl -s -x http://127.0.0.1:8080 http://httpbin.org/status/200 > /dev/null; then
    echo "✅ RobbieBook1 Proxy: Online (http://127.0.0.1:8080)"
else
    echo "❌ RobbieBook1 Proxy: Offline"
fi

# RobbieBook1 Dashboard
if curl -s http://localhost:8081 > /dev/null; then
    echo "✅ RobbieBook1 Dashboard: Online (http://localhost:8081)"
else
    echo "❌ RobbieBook1 Dashboard: Offline"
fi

echo ""
echo "🎉 RobbieBook1.testpilot.ai Empire is LIVE!"
echo "============================================"
echo ""
echo "🌐 Access Points:"
echo "   Aurora AI API:     http://localhost:8000"
echo "   Aurora API Docs:   http://localhost:8000/docs"
echo "   RobbieBook1 Proxy: http://127.0.0.1:8080"
echo "   RobbieBook1 Dashboard: http://localhost:8081"
echo ""
echo "🔧 Management Commands:"
echo "   Check status:      ./robbiebook-cache-stats.sh"
echo "   View logs:         tail -f logs/*.log"
echo "   Stop all:          ./stop-robbiebook-empire.sh"
echo "   Restart all:       ./restart-robbiebook-empire.sh"
echo ""
echo "💡 Next Steps:"
echo "   1. Open http://localhost:8081 for the dashboard"
echo "   2. Configure your browser to use proxy 127.0.0.1:8080"
echo "   3. Start browsing with accelerated caching!"
echo ""
echo "🤖 RobbieBook1.testpilot.ai is ready to serve the Aurora AI Empire!"









