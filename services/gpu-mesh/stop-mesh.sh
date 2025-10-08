#!/bin/bash
# Stop GPU Mesh service

PID_FILE="/tmp/aurora-gpu-mesh.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "⚠️  GPU Mesh doesn't appear to be running (no PID file)"
    
    # Check for running process anyway
    if pgrep -f unified_gpu_mesh.py > /dev/null; then
        echo "🔍 Found running process, stopping..."
        pkill -f unified_gpu_mesh.py
        echo "✅ Stopped"
    fi
    exit 0
fi

PID=$(cat "$PID_FILE")

if ps -p "$PID" > /dev/null 2>&1; then
    echo "🛑 Stopping GPU Mesh (PID: $PID)..."
    kill "$PID"
    
    # Wait for it to stop
    sleep 2
    
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "⚠️  Process didn't stop gracefully, forcing..."
        kill -9 "$PID"
        sleep 1
    fi
    
    rm "$PID_FILE"
    echo "✅ GPU Mesh stopped"
else
    echo "⚠️  Process $PID not running"
    rm "$PID_FILE"
fi



