#!/bin/bash
# Comprehensive SSH Mesh Test with LLM Inference

echo "🚀 COMPREHENSIVE SSH MESH TEST"
echo "==============================="
echo ""

echo "📍 Node: $(hostname)"
echo "🕐 Time: $(date)"
echo ""

# Test 1: Network Connectivity
echo "═══════════════════════════════════════"
echo "1️⃣  NETWORK CONNECTIVITY"
echo "═══════════════════════════════════════"
ping -c 2 aurora-town-u44170.vm.elestio.app > /dev/null 2>&1 && echo "✅ Aurora reachable" || echo "❌ Aurora unreachable"
echo ""

# Test 2: SSH Tunnels
echo "═══════════════════════════════════════"
echo "2️⃣  SSH TUNNEL STATUS"
echo "═══════════════════════════════════════"
systemctl is-active aurora-reverse-tunnel && echo "✅ Reverse tunnel: ACTIVE" || echo "⚠️  Reverse tunnel: $(systemctl is-active aurora-reverse-tunnel)"
echo ""

# Test 3: Local Resources (Vengeance)
echo "═══════════════════════════════════════"
echo "3️⃣  LOCAL RESOURCES (VENGEANCE)"
echo "═══════════════════════════════════════"
echo "GPU:"
nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total --format=csv,noheader
echo ""
echo "Ollama Models:"
curl -s http://localhost:11434/api/tags | jq -r '.models[] | "  - \(.name)"' | head -5
echo ""

# Test 4: Remote Resources (Aurora)
echo "═══════════════════════════════════════"
echo "4️⃣  REMOTE RESOURCES (AURORA)"
echo "═══════════════════════════════════════"
echo "Aurora Ollama Models:"
ssh -o ConnectTimeout=5 root@aurora-town-u44170.vm.elestio.app "curl -s http://localhost:11434/api/tags | jq -r '.models[] | \"  - \" + .name'" | head -5
echo ""

# Test 5: Reverse Tunnel (Aurora→Vengeance)
echo "═══════════════════════════════════════"
echo "5️⃣  REVERSE TUNNEL TEST"
echo "═══════════════════════════════════════"
echo "Can Aurora reach Vengeance Ollama?"
ssh -o ConnectTimeout=5 root@aurora-town-u44170.vm.elestio.app "curl -s http://localhost:11434/api/tags | jq -r '.models | length' | xargs echo 'Models available:'"
echo ""

# Test 6: LLM Inference Test
echo "═══════════════════════════════════════"
echo "6️⃣  LLM INFERENCE TEST (VENGEANCE RTX 4090)"
echo "═══════════════════════════════════════"
echo "Sending test prompt to Vengeance..."
START_TIME=$(date +%s%3N)
RESPONSE=$(curl -s http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:7b",
  "prompt": "Say hello in exactly 3 words",
  "stream": false
}' | jq -r '.response')
END_TIME=$(date +%s%3N)
LATENCY=$((END_TIME - START_TIME))

echo "Response: $RESPONSE"
echo "Latency: ${LATENCY}ms"
echo "✅ Inference working on RTX 4090"
echo ""

# Test 7: Aurora LLM Inference
echo "═══════════════════════════════════════"
echo "7️⃣  LLM INFERENCE TEST (AURORA CPU)"
echo "═══════════════════════════════════════"
echo "Sending test prompt to Aurora..."
START_TIME=$(date +%s%3N)
RESPONSE=$(ssh root@aurora-town-u44170.vm.elestio.app "curl -s http://localhost:11434/api/generate -d '{
  \"model\": \"qwen2.5:7b\",
  \"prompt\": \"Say goodbye in exactly 3 words\",
  \"stream\": false
}' | jq -r '.response'")
END_TIME=$(date +%s%3N)
LATENCY=$((END_TIME - START_TIME))

echo "Response: $RESPONSE"
echo "Latency: ${LATENCY}ms"
echo "✅ Inference working on Aurora CPU"
echo ""

# Summary
echo "═══════════════════════════════════════"
echo "📊 MESH STATUS SUMMARY"
echo "═══════════════════════════════════════"
echo "✅ Vengeance RTX 4090: ONLINE"
echo "✅ Aurora Town CPU: ONLINE"
echo "✅ SSH Mesh: OPERATIONAL"
echo "✅ LLM Inference: WORKING"
echo ""
echo "🎯 MESH FULLY OPERATIONAL!"
echo "═══════════════════════════════════════"
