#!/bin/bash

# 🔄 RESTART CURSOR TO LOAD UPDATED EXTENSION
# This will restart Cursor to pick up the RobbieBar extension changes

echo "🔄 RESTARTING CURSOR FOR EXTENSION UPDATE"
echo "========================================="

echo "📋 Current Cursor processes:"
ps aux | grep -i cursor | grep -v grep | wc -l | xargs echo "  - Running processes:"

echo ""
echo "🛑 Stopping Cursor processes..."

# Kill Cursor processes gracefully
pkill -f "cursor-server" 2>/dev/null || true
pkill -f "cursor" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

echo "✅ Cursor processes stopped"
echo ""
echo "🚀 To restart Cursor:"
echo "  1. Open a new terminal"
echo "  2. Run: cursor ."
echo "  3. Or open Cursor from your applications"
echo ""
echo "💜 After restart, look for the 🔄 reload button in the status bar!"
echo ""
echo "📋 What you should see:"
echo "  - 🔄 reload button in bottom status bar"
echo "  - Click it to reload the page"
echo "  - RobbieBar with updated functionality"












