#!/bin/bash
# Start Aurora Data Sync and Chat System

set -e

echo "🚀 STARTING AURORA DATA SYNC & CHAT"
echo "==================================="

# Check if Python dependencies are installed
echo "🔍 Checking dependencies..."
if ! python3 -c "import psycopg2, asyncio, aiohttp" 2>/dev/null; then
    echo "❌ Missing dependencies. Installing..."
    pip install psycopg2-binary aiohttp --break-system-packages
fi

echo "✅ Dependencies ready"

# Start data sync in background
echo "🔄 Starting data sync..."
python3 scripts/aurora-data-sync.py &
SYNC_PID=$!

# Wait a moment for sync to initialize
sleep 2

# Start chat system
echo "💬 Starting chat system..."
python3 scripts/aurora-chat-system.py

# Cleanup on exit
trap "kill $SYNC_PID 2>/dev/null || true" EXIT
