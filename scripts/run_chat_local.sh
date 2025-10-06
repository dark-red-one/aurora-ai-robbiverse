#!/bin/bash
set -euo pipefail

# Robbie localhost chat backend launcher (port 8007)
# - Kills any existing process on port 8007
# - Starts backend_gpu_mesh_senses.py (non-SSL) in background
# - Waits up to 8 seconds for readiness

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/infrastructure/chat-ultimate"
PORT=8007
LOG_FILE="/tmp/robbie_chat_backend_local.log"

echo "[robby] Ensuring port $PORT is free..."
if lsof -ti tcp:$PORT >/dev/null 2>&1; then
  lsof -ti tcp:$PORT | xargs -r kill -9 || true
  sleep 1
fi

echo "[robby] Starting backend on port $PORT..."
nohup python3 "$BACKEND_DIR/backend_gpu_mesh_senses.py" > "$LOG_FILE" 2>&1 &

echo "[robby] Waiting for backend to become ready..."
for i in {1..8}; do
  if curl -s "http://127.0.0.1:$PORT/api/system-stats" >/dev/null 2>&1; then
    echo "[robby] ✅ Backend ready on http://127.0.0.1:$PORT"
    exit 0
  fi
  sleep 1
done

echo "[robby] ⚠️ Backend not responding yet; tailing last 25 log lines:"
tail -n 25 "$LOG_FILE" || true
exit 1




