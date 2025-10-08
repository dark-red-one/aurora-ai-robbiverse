#!/bin/bash
# Start GPU Mesh in background with auto-restart

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PID_FILE="/tmp/aurora-gpu-mesh.pid"
LOG_FILE="/tmp/aurora-gpu-mesh/gpu-mesh.log"

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "✅ GPU Mesh already running (PID: $OLD_PID)"
        echo ""
        echo "To stop: bash stop-mesh.sh"
        echo "To check status: bash check-mesh-status.sh"
        echo "To view logs: tail -f $LOG_FILE"
        exit 0
    else
        echo "🔄 Cleaning up stale PID file"
        rm "$PID_FILE"
    fi
fi

# Ensure log directory exists
mkdir -p /tmp/aurora-gpu-mesh

echo "🚀 Starting Aurora GPU Mesh System..."

# Start in background
cd "$SCRIPT_DIR"
nohup python3 -u unified_gpu_mesh.py >> "$LOG_FILE" 2>&1 &
NEW_PID=$!

# Save PID
echo "$NEW_PID" > "$PID_FILE"

# Wait a moment to verify it started
sleep 2

if ps -p "$NEW_PID" > /dev/null 2>&1; then
    echo "✅ GPU Mesh started successfully (PID: $NEW_PID)"
    echo ""
    echo "📊 Check status: bash check-mesh-status.sh"
    echo "📝 View logs:    tail -f $LOG_FILE"
    echo "⏹️  Stop mesh:    bash stop-mesh.sh"
    echo ""
    
    # Show initial status after a few seconds
    sleep 3
    bash check-mesh-status.sh
else
    echo "❌ Failed to start GPU Mesh"
    rm "$PID_FILE"
    exit 1
fi

