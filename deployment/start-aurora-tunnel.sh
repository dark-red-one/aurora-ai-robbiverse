#!/bin/bash
# Manual SSH tunnel to Aurora Town
# Run this when you need Aurora access

echo "🔗 Starting SSH tunnel to Aurora Town..."
echo "Port Forwards:"
echo "  11435 → Aurora Ollama (11434)"
echo "  8006  → Aurora Chat MVP (8005)"
echo "  5433  → Aurora Postgres (25432)"
echo ""
echo "Press Ctrl+C to stop the tunnel"
echo "================================"

ssh -N \
  -L 11435:localhost:11434 \
  -L 8006:localhost:8005 \
  -L 5433:aurora-postgres-u44170.vm.elestio.app:25432 \
  -o ServerAliveInterval=60 \
  -o ServerAliveCountMax=3 \
  root@aurora-town-u44170.vm.elestio.app

