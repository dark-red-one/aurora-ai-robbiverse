#!/bin/bash
set -euo pipefail

# Simple static host for local HTML (port 9000)
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOC_ROOT="$ROOT_DIR"
PORT=9000

cd "$DOC_ROOT"
echo "[robby] Serving $DOC_ROOT on http://127.0.0.1:$PORT"
python3 -m http.server "$PORT"




