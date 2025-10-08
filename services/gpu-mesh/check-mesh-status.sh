#!/bin/bash
# Quick GPU Mesh Status Check Script

echo "🎯 AURORA GPU MESH - QUICK STATUS CHECK"
echo "========================================"
echo ""

# Check if service is running
if systemctl --user is-active --quiet aurora-gpu-mesh 2>/dev/null; then
    echo "✅ GPU Mesh Service: RUNNING"
elif pgrep -f unified_gpu_mesh.py > /dev/null; then
    echo "✅ GPU Mesh Service: RUNNING (manual)"
else
    echo "❌ GPU Mesh Service: STOPPED"
fi
echo ""

# Check individual GPU nodes
echo "📊 GPU Node Status:"
echo ""

# Local Ollama
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    MODEL_COUNT=$(curl -s http://localhost:11434/api/tags 2>/dev/null | jq '.models | length' 2>/dev/null || echo "?")
    echo "🟢 Local Ollama (11434): HEALTHY - $MODEL_COUNT models"
else
    echo "🔴 Local Ollama (11434): OFFLINE"
fi

# Tunnel (port 8080)
if curl -s --max-time 3 http://localhost:8080/api/tags > /dev/null 2>&1; then
    MODEL_COUNT=$(curl -s http://localhost:8080/api/tags 2>/dev/null | jq '.models | length' 2>/dev/null || echo "?")
    echo "🟢 Iceland/RunPod (8080): HEALTHY - $MODEL_COUNT models"
else
    echo "🔴 Iceland/RunPod (8080): OFFLINE"
fi

echo ""

# Check logs
LOG_FILE="/tmp/aurora-gpu-mesh/gpu-mesh.log"
if [ -f "$LOG_FILE" ]; then
    echo "📝 Recent Log Activity:"
    echo ""
    tail -10 "$LOG_FILE" | grep -E "(HEALTHY|UNHEALTHY|OFFLINE|CRITICAL|ERROR)" | tail -5
    echo ""
    echo "📊 Full logs: $LOG_FILE"
else
    echo "⚠️  No log file found at $LOG_FILE"
fi

echo ""
echo "========================================"

# Exit with appropriate code
if pgrep -f unified_gpu_mesh.py > /dev/null; then
    exit 0
else
    exit 1
fi



