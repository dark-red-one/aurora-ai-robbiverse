#!/bin/bash
# Stop RobbieBar Server

echo "🛑 Stopping RobbieBar..."

if pgrep -f "robbiebar-server.py" > /dev/null; then
    pkill -f "robbiebar-server.py"
    sleep 1
    echo "✅ RobbieBar stopped"
else
    echo "⚠️  RobbieBar is not running"
fi



