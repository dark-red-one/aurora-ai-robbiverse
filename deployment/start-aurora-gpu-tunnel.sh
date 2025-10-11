#!/bin/bash
# SSH Tunnel to Aurora RTX 4090 GPU
# Maps Aurora's Ollama (11434) to local port 11435

set -e

AURORA_HOST="aurora"  # Uses ~/.ssh/config alias
LOCAL_PORT=11435
REMOTE_PORT=11434

echo "🚀 Starting Aurora GPU Tunnel..."
echo "   Aurora Ollama (11434) → localhost:11435"
echo ""

# Kill existing tunnel if running
pkill -f "ssh.*${LOCAL_PORT}:localhost:${REMOTE_PORT}" || true
sleep 1

# Start tunnel in background with auto-reconnect
while true; do
    echo "[$(date)] Connecting to Aurora GPU..."
    
    ssh -N \
        -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        -o ExitOnForwardFailure=yes \
        -o StrictHostKeyChecking=no \
        ${AURORA_HOST}
    
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo "[$(date)] Tunnel closed gracefully"
        break
    else
        echo "[$(date)] Tunnel failed (exit code: $EXIT_CODE), reconnecting in 5s..."
        sleep 5
    fi
done

