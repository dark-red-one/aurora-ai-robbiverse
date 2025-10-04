#!/bin/bash
echo "🛑 Stopping RobbieBook1.testpilot.ai Proxy..."
pkill -f "robbiebook-proxy.py" || true
echo "✅ Proxy stopped"
