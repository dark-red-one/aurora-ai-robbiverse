#!/bin/bash
# 🔥💋 GPU STRESS TEST - LIGHT UP THOSE 4090s! 🔥💋

echo "🔥 FIRING UP ALL 4 MODELS SIMULTANEOUSLY!"
echo "📊 Watch btop - both GPUs about to GLOW!"
echo ""

# Test prompts for each complexity level
SIMPLE="Write a hello world function in Python"
MEDIUM="Refactor this code to use async/await: function fetchData() { return fetch('/api/data').then(r => r.json()) }"
COMPLEX="Design a distributed microservices architecture with API gateway, service mesh, and event-driven communication"
DEBUG="Debug this code: def factorial(n): if n == 0: return 1 else: return n * factorial(n)"

# Run all 4 in parallel!
echo "🚀 Launching parallel requests to all 4 models..."
echo ""

(
  echo "1️⃣ SIMPLE → qwen2.5-coder:7b"
  time curl -s -X POST http://localhost:8000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"auto\",\"messages\":[{\"role\":\"user\",\"content\":\"$SIMPLE\"}]}" \
    | python3 -c "import sys, json; data = json.load(sys.stdin); print(f\"   ✅ {data['model']}: {len(data['choices'][0]['message']['content'])} chars\")"
) &

(
  echo "2️⃣ MEDIUM → codellama:13b"
  time curl -s -X POST http://localhost:8000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"auto\",\"messages\":[{\"role\":\"user\",\"content\":\"$MEDIUM\"}]}" \
    | python3 -c "import sys, json; data = json.load(sys.stdin); print(f\"   ✅ {data['model']}: {len(data['choices'][0]['message']['content'])} chars\")"
) &

(
  echo "3️⃣ COMPLEX → deepseek-coder:33b"
  time curl -s -X POST http://localhost:8000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"auto\",\"messages\":[{\"role\":\"user\",\"content\":\"$COMPLEX\"}]}" \
    | python3 -c "import sys, json; data = json.load(sys.stdin); print(f\"   ✅ {data['model']}: {len(data['choices'][0]['message']['content'])} chars\")"
) &

(
  echo "4️⃣ DEBUG → deepseek-r1:7b"
  time curl -s -X POST http://localhost:8000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"auto\",\"messages\":[{\"role\":\"user\",\"content\":\"$DEBUG\"}]}" \
    | python3 -c "import sys, json; data = json.load(sys.stdin); print(f\"   ✅ {data['model']}: {len(data['choices'][0]['message']['content'])} chars\")"
) &

echo "⏳ All 4 models generating... CHECK BTOP NOW!"
echo ""

# Wait for all background jobs
wait

echo ""
echo "✅ ALL 4 MODELS COMPLETE!"
echo "💰 Total cost: \$0.00 (would be ~\$0.50 on OpenAI)"
echo ""
echo "📊 Check proxy stats:"
echo "   curl -s http://localhost:8000/stats"









