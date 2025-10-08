#!/bin/bash
echo "💬 TESTING BASIC CHAT SPEED"
echo "These are the prompts you'd actually use while coding..."
echo ""

# Test 1: Quick question
echo "1️⃣ Quick question (1 sentence):"
time curl -s -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"auto","messages":[{"role":"user","content":"What does async/await do in JavaScript?"}]}' \
  | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'   Response: {data[\"choices\"][0][\"message\"][\"content\"][:150]}...')" 2>&1 | grep -E "(real|Response)"
echo ""

# Test 2: Code explanation
echo "2️⃣ Explain this code:"
time curl -s -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"auto","messages":[{"role":"user","content":"Explain this: const result = await fetch(url).then(r => r.json())"}]}' \
  | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'   Response: {data[\"choices\"][0][\"message\"][\"content\"][:150]}...')" 2>&1 | grep -E "(real|Response)"
echo ""

# Test 3: Quick fix
echo "3️⃣ Fix syntax error:"
time curl -s -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"auto","messages":[{"role":"user","content":"Fix: def add(a b): return a + b"}]}' \
  | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'   Response: {data[\"choices\"][0][\"message\"][\"content\"][:150]}...')" 2>&1 | grep -E "(real|Response)"
echo ""

# Test 4: Variable name suggestion
echo "4️⃣ Suggest variable name:"
time curl -s -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"auto","messages":[{"role":"user","content":"Better name for: var d = new Date()"}]}' \
  | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'   Response: {data[\"choices\"][0][\"message\"][\"content\"][:150]}...')" 2>&1 | grep -E "(real|Response)"
echo ""

# Test 5: One-liner
echo "5️⃣ One-liner request:"
time curl -s -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"auto","messages":[{"role":"user","content":"Python one-liner to reverse a string"}]}' \
  | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'   Response: {data[\"choices\"][0][\"message\"][\"content\"][:150]}...')" 2>&1 | grep -E "(real|Response)"
echo ""

echo "✅ BASIC CHAT SPEED TEST COMPLETE!"
echo "Compare to Claude/GPT-4: 2-5 seconds typical"
