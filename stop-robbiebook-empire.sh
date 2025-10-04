#!/bin/bash
# RobbieBook1.testpilot.ai - Aurora AI Empire Shutdown
# Graceful shutdown of all RobbieBook1 services

echo "🛑 RobbieBook1.testpilot.ai - Aurora AI Empire Shutdown"
echo "   Stopping All Services Gracefully"
echo "=========================================================="

# Function to stop a service
stop_service() {
    local name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🛑 Stopping $name (PID: $pid)..."
            kill -TERM "$pid"
            sleep 2
            if kill -0 "$pid" 2>/dev/null; then
                echo "   Force stopping $name..."
                kill -KILL "$pid"
            fi
            echo "✅ $name stopped"
        else
            echo "ℹ️  $name was not running"
        fi
        rm -f "$pid_file"
    else
        echo "ℹ️  No PID file found for $name"
    fi
}

# Stop RobbieBook1 Dashboard
stop_service "RobbieBook1-Dashboard" "logs/robbiebook-dashboard.pid"

# Stop RobbieBook1 Proxy
stop_service "RobbieBook1-Proxy" "logs/robbiebook-proxy.pid"

# Stop Aurora AI Backend
stop_service "Aurora-Backend" "logs/aurora-backend.pid"

# Kill any remaining processes
echo "🧹 Cleaning up remaining processes..."
pkill -f "robbiebook-dashboard.py" 2>/dev/null || true
pkill -f "robbiebook-proxy.py" 2>/dev/null || true
pkill -f "uvicorn app.main:app" 2>/dev/null || true

echo ""
echo "✅ RobbieBook1.testpilot.ai Empire Shutdown Complete"
echo "===================================================="
echo ""
echo "📊 Final Status:"
echo "   Aurora AI Backend: Stopped"
echo "   RobbieBook1 Proxy: Stopped"
echo "   RobbieBook1 Dashboard: Stopped"
echo ""
echo "💾 Cache preserved in: ./robbiebook_cache/"
echo "📝 Logs available in: ./logs/"
echo ""
echo "🚀 To restart: ./start-robbiebook-empire.sh"
echo "👋 RobbieBook1.testpilot.ai Empire offline!"









