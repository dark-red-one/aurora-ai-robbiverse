#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT_DIR/infrastructure/chat-ultimate"
PORT=8006
VENV_DIR="$ROOT_DIR/.venv"

echo "[robby] Setting up local venv at $VENV_DIR"
python3 -m venv "$VENV_DIR" >/dev/null 2>&1 || true
source "$VENV_DIR/bin/activate"

echo "[robby] Upgrading pip and installing deps"
pip install --upgrade pip wheel >/dev/null
pip install fastapi "uvicorn[standard]" aiohttp jinja2 "psycopg2-binary==2.9.9" >/dev/null

echo "[robby] Ensuring port $PORT is free"
if lsof -ti tcp:$PORT >/dev/null 2>&1; then
  lsof -ti tcp:$PORT | xargs -r kill -9 || true
  sleep 1
fi

echo "[robby] Launching chat backend on http://127.0.0.1:$PORT"
cd "$APP_DIR"
nohup uvicorn backend:app --host 127.0.0.1 --port "$PORT" --reload > /tmp/robbie_local_chat.log 2>&1 &

echo "[robby] Waiting for readiness..."
for i in {1..10}; do
  if curl -sf "http://127.0.0.1:$PORT/api/status" >/dev/null; then
    echo "[robby] ✅ Chat ready at http://localhost:$PORT"
    if command -v open >/dev/null 2>&1; then open "http://localhost:$PORT"; fi
    exit 0
  fi
  sleep 1
done

echo "[robby] ⚠️ Backend did not respond in time. Last log lines:"
tail -n 40 /tmp/robbie_local_chat.log || true
exit 1




