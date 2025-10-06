#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT_DIR/infrastructure/chat-ultimate"
VENV_DIR="$ROOT_DIR/.venv"
PORT=8006

# Ensure venv exists
if [ ! -d "$VENV_DIR" ]; then
  "$ROOT_DIR/scripts/install_and_run_local_chat.sh" || true
fi

source "$VENV_DIR/bin/activate"
cd "$APP_DIR"

exec uvicorn backend:app \
  --host 127.0.0.1 \
  --port "$PORT" \
  --log-level info \
  --ssl-keyfile certs/key.pem \
  --ssl-certfile certs/cert.pem




