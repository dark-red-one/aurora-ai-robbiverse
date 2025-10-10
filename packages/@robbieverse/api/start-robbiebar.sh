#!/bin/bash
# Start RobbieBar Server
# Quick launch script for Vengeance, RobbieBook1, and Aurora Town

cd "$(dirname "$0")"

echo "🎯 Starting RobbieBar - Code Command Center"
echo "=========================================="

# Check if server is already running
if pgrep -f "robbiebar-server.py" > /dev/null; then
    echo "⚠️  RobbieBar is already running!"
    echo "   To restart, run: ./stop-robbiebar.sh && ./start-robbiebar.sh"
    exit 1
fi

# Start the server in background
nohup python3 robbiebar-server.py > /tmp/robbiebar.log 2>&1 &
PID=$!

# Wait for startup
sleep 3

# Check if it started successfully
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ RobbieBar is running!"
    echo ""
    echo "🌐 Web UI:     http://localhost:8000/code"
    echo "📊 API Docs:   http://localhost:8000/docs"
    echo "🔬 Health:     http://localhost:8000/health"
    echo "📝 Logs:       tail -f /tmp/robbiebar.log"
    echo "🛑 Stop:       ./stop-robbiebar.sh"
    echo ""
    echo "PID: $PID"
else
    echo "❌ Failed to start RobbieBar!"
    echo "Check logs: tail /tmp/robbiebar.log"
    exit 1
fi



