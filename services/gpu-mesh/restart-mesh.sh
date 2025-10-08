#!/bin/bash
# Restart GPU Mesh service

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🔄 Restarting GPU Mesh..."
echo ""

bash "$SCRIPT_DIR/stop-mesh.sh"
sleep 2
bash "$SCRIPT_DIR/start-mesh.sh"



