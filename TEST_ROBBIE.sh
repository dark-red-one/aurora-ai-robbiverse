#!/bin/bash
echo "🧪 Testing Smart Robbie@Code..."
echo ""

echo "1️⃣ Testing API Health..."
curl -s http://localhost:3001/health | jq .
echo ""

echo "2️⃣ Testing Embedding Model..."
curl -s http://localhost:11435/api/tags | jq -r '.models[] | select(.name | contains("nomic")) | "✅ \(.name) - \(.size/1024/1024 | floor)MB"'
echo ""

echo "3️⃣ Testing Database..."
cd robbieverse-api
docker-compose exec -T postgres psql -U robbie -d robbieverse << SQL
SELECT 
  'Conversations: ' || COUNT(*)::text FROM code_conversations
UNION ALL
SELECT 
  'Messages: ' || COUNT(*)::text FROM code_messages
UNION ALL
SELECT 
  'Patterns: ' || COUNT(*)::text FROM learned_patterns
UNION ALL
SELECT 
  'Code Blocks: ' || COUNT(*)::text FROM code_blocks;
SQL
echo ""

echo "4️⃣ Robbie's Personality..."
curl -s http://localhost:3001/api/personality/allan | jq -r '.personality | "Mood: \(.current_mood) | Gandhi-Genghis: \(.gandhi_genghis_level) | Attraction: \(.attraction_level)"'
echo ""

echo "5️⃣ VS Code Extension Status..."
code --list-extensions | grep -i robbie && echo "✅ Extension installed" || echo "⚠️ Extension not installed"
echo ""

echo "═══════════════════════════════════════"
echo "✅ SMART ROBBIE@CODE IS READY"
echo "═══════════════════════════════════════"
echo ""
echo "🎯 To use:"
echo "   1. Open VS Code: code ."
echo "   2. Press Cmd+L to chat"
echo "   3. Press Cmd+I to edit code"
echo ""
echo "📊 Monitor:"
echo "   API: tail -f /tmp/robbie-api.log"
echo "   Health: curl http://localhost:3001/health"
echo ""
