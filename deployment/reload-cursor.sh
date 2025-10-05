#!/bin/bash

echo "🔄 Reloading Cursor with Robbie Local LLM Integration..."

# Kill existing Cursor processes
echo "Stopping Cursor..."
pkill -f "Cursor.app" || true
sleep 2

# Ensure Ollama proxy is running
echo "Starting Ollama proxy..."
pkill -f ollama-proxy.py || true
sleep 1
python3 ~/.cursor/ollama-proxy.py &
sleep 2

# Verify proxy is working
echo "Testing proxy..."
curl -s -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Robbie, are you ready?"}]}' \
  | jq -r '.choices[0].message.content' | head -1

echo ""
echo "✅ Robbie Local LLM Integration Ready!"
echo "🚀 Starting Cursor..."
open -a Cursor /Users/allanperetz/aurora-ai-robbiverse

echo ""
echo "🎯 Robbie is now running on local Ollama models:"
echo "   • qwen2.5:7b (default, business analysis)"
echo "   • codellama:7b (code tasks)"
echo "   • llama3.1:8b (creative tasks)"
echo ""
echo "💰 Revenue-focused, direct, strategic partner mode ACTIVE"