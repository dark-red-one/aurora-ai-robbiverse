#!/bin/bash
# 🔥💋 Test Robbie LLM Proxy 🔥💋

echo "🧪 Testing Robbie LLM Proxy..."
echo ""

# Test 1: Health check
echo "1️⃣ Health check:"
curl -s http://localhost:8000/health | python3 -c "import sys, json; print('  ', json.load(sys.stdin))"
echo ""

# Test 2: List models
echo "2️⃣ Available models:"
curl -s http://localhost:8000/v1/models | python3 -c "import sys, json; data = json.load(sys.stdin); [print(f\"   - {m['id']}\") for m in data['data']]"
echo ""

# Test 3: Simple prompt (should use qwen2.5-coder:7b)
echo "3️⃣ Simple task (expect: qwen2.5-coder:7b):"
curl -s -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"auto","messages":[{"role":"user","content":"Complete: def add(a, b):"}]}' \
  | python3 -c "import sys, json; data = json.load(sys.stdin); print(f\"   Model: {data['model']}\"); print(f\"   Response: {data['choices'][0]['message']['content'][:80]}...\")"
echo ""

# Test 4: Complex prompt (should use deepseek-coder:33b)
echo "4️⃣ Complex task (expect: deepseek-coder:33b-instruct):"
curl -s -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"auto","messages":[{"role":"user","content":"Design a microservices architecture for an e-commerce platform with authentication, payment processing, and inventory management"}]}' \
  | python3 -c "import sys, json; data = json.load(sys.stdin); print(f\"   Model: {data['model']}\"); print(f\"   Response: {data['choices'][0]['message']['content'][:80]}...\")"
echo ""

# Test 5: Debugging (should use deepseek-r1:7b)
echo "5️⃣ Debug task (expect: deepseek-r1:7b):"
curl -s -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"auto","messages":[{"role":"user","content":"Why does this code fail: print(x) when x is not defined?"}]}' \
  | python3 -c "import sys, json; data = json.load(sys.stdin); print(f\"   Model: {data['model']}\"); print(f\"   Response: {data['choices'][0]['message']['content'][:80]}...\")"
echo ""

# Test 6: Stats
echo "6️⃣ Proxy statistics:"
curl -s http://localhost:8000/stats | python3 -c "import sys, json; data = json.load(sys.stdin); print(f\"   Total requests: {data['total_requests']}\"); print(f\"   By complexity: {data['by_complexity']}\"); print(f\"   By model: {list(data['by_model'].keys())}\")"
echo ""

echo "✅ All tests complete!"









