#!/bin/bash

# 🌐 OPEN AURORA AI EMPIRE LIVE NETWORK MAP
# =========================================

echo "🌐 AURORA AI EMPIRE LIVE NETWORK MAP"
echo "===================================="
echo ""

# Check if server is running
if curl -s http://localhost:8080/api/status >/dev/null 2>&1; then
    echo "✅ Live map server is running!"
    echo ""
    echo "📊 Access URLs:"
    echo "• Live Dashboard: http://localhost:8080"
    echo "• API Status: http://localhost:8080/api/status"
    echo ""
    echo "🔍 Current Network Status:"
    curl -s http://localhost:8080/api/status | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f\"• Total Nodes: {data['summary']['total']}\")
print(f\"• Online: {data['summary']['online']}\")
print(f\"• Needs Setup: {data['summary']['warning']}\")
print(f\"• Offline: {data['summary']['offline']}\")
print(f\"• Last Updated: {data['timestamp']}\")
"
    echo ""
    echo "🚀 Opening live map in browser..."
    
    # Try to open in browser
    if command -v xdg-open >/dev/null; then
        xdg-open http://localhost:8080
    elif command -v open >/dev/null; then
        open http://localhost:8080
    else
        echo "Please open http://localhost:8080 in your browser"
    fi
else
    echo "❌ Live map server is not running!"
    echo ""
    echo "🚀 Starting live map server..."
    cd monitoring
    python3 live-server.py &
    echo "⏳ Waiting for server to start..."
    sleep 5
    
    if curl -s http://localhost:8080/api/status >/dev/null 2>&1; then
        echo "✅ Server started! Opening live map..."
        if command -v xdg-open >/dev/null; then
            xdg-open http://localhost:8080
        else
            echo "Please open http://localhost:8080 in your browser"
        fi
    else
        echo "❌ Failed to start server. Check logs: tail -f /tmp/live-map.log"
    fi
fi









