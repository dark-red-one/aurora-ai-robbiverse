#!/bin/bash
# Test SSH Mesh Network

echo "🧪 TESTING SSH MESH NETWORK"
echo "============================"
echo ""

echo "📍 Testing from: $(hostname)"
echo ""

# Test 1: Vengeance local Ollama
echo "1️⃣  Testing Vengeance local Ollama..."
curl -s http://localhost:11434/api/tags | jq -r '.models[0].name' && echo "   ✅ Vengeance Ollama: OK" || echo "   ❌ Vengeance Ollama: FAIL"
echo ""

# Test 2: Aurora via SSH from Vengeance
echo "2️⃣  Testing Aurora from Vengeance..."
ssh -o ConnectTimeout=5 root@aurora-town-u44170.vm.elestio.app "curl -s http://localhost:11434/api/tags | jq -r '.models[0].name'" && echo "   ✅ Aurora Ollama: OK" || echo "   ❌ Aurora Ollama: FAIL"
echo ""

# Test 3: Vengeance→Aurora reverse tunnel
echo "3️⃣  Testing Vengeance→Aurora reverse tunnel..."
ssh -o ConnectTimeout=5 root@aurora-town-u44170.vm.elestio.app "curl -s http://localhost:11434/api/tags | jq -r '.models | length'" && echo "   ✅ Aurora can reach Vengeance: OK" || echo "   ❌ Reverse tunnel: FAIL"
echo ""

# Test 4: GPU status
echo "4️⃣  Testing Vengeance GPU..."
nvidia-smi --query-gpu=name,utilization.gpu,memory.used --format=csv,noheader && echo "   ✅ GPU: OK" || echo "   ❌ GPU: FAIL"
echo ""

# Test 5: Tunnel service status
echo "5️⃣  Testing tunnel service..."
systemctl is-active aurora-reverse-tunnel && echo "   ✅ Tunnel service: ACTIVE" || echo "   ⚠️  Tunnel service: INACTIVE"
echo ""

echo "✅ MESH TEST COMPLETE!"
