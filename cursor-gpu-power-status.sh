#!/bin/bash
# GPU Power Status Dashboard

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 CURSOR GPU MESH - POWER STATUS 🔥"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Proxy
if curl -s http://localhost:11435/api/tags > /dev/null 2>&1; then
    echo "✅ Cursor Proxy: ONLINE (port 11435)"
else
    echo "❌ Cursor Proxy: OFFLINE"
fi

# Check SSH Tunnel
if curl -s http://localhost:8080/api/tags > /dev/null 2>&1; then
    echo "✅ SSH Tunnel: CONNECTED (port 8080)"
else
    echo "⚠️  SSH Tunnel: DISCONNECTED"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💪 GPU STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Local GPU
echo "🖥️  LOCAL GPU (Vengeance RTX 4090):"
nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw,power.limit --format=csv,noheader,nounits | \
    awk -F', ' '{printf "   Load: %s%%  |  VRAM: %s/%s MB  |  Temp: %s°C  |  Power: %s/%sW\n", $1, $2, $3, $4, $5, $6}'

# Remote GPU
echo ""
echo "☁️  REMOTE GPU (RunPod RTX 4090):"
ssh -p 13323 root@209.170.80.132 "nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw,power.limit --format=csv,noheader,nounits" 2>/dev/null | \
    awk -F', ' '{printf "   Load: %s%%  |  VRAM: %s/%s MB  |  Temp: %s°C  |  Power: %s/%sW\n", $1, $2, $3, $4, $5, $6}'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 AVAILABLE MODELS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get model count
MODEL_COUNT=$(curl -s http://localhost:11435/api/tags 2>/dev/null | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data['models']))" 2>/dev/null || echo "0")

if [ "$MODEL_COUNT" -gt 0 ]; then
    echo "📊 Total Models Available: $MODEL_COUNT"
    echo ""
    curl -s http://localhost:11435/api/tags | python3 -c "
import sys, json
data = json.load(sys.stdin)
for i, model in enumerate(data['models'], 1):
    size_gb = model['size'] / (1024**3)
    print(f'{i}. {model[\"name\"]:30} ({size_gb:.1f}GB)')
" 2>/dev/null
else
    echo "⚠️  No models detected - check proxy connection"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 COMBINED POWER: 48GB VRAM | $MODEL_COUNT MODELS | 2x RTX 4090"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"







