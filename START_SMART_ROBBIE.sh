#!/bin/bash
# Start Smart Robbie@Code - Full Memory System

echo "🚀 Starting Smart Robbie@Code..."
echo ""

# 1. Check if Postgres is running
echo "📊 Checking Postgres..."
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse/robbieverse-api
if ! docker ps | grep -q robbieverse-postgres; then
    echo "   Starting Postgres..."
    docker-compose up -d
    sleep 3
fi
echo "   ✅ Postgres running"

# 2. Check if Ollama is accessible
echo "🤖 Checking Ollama..."
if ! curl -s http://localhost:11435/api/tags > /dev/null 2>&1; then
    echo "   ❌ Ollama not accessible at localhost:11435"
    echo "   Make sure your GPU proxy is running!"
    exit 1
fi
echo "   ✅ Ollama accessible"

# 3. Check for embedding model
echo "🧠 Checking embedding model..."
if curl -s http://localhost:11435/api/tags | jq -r '.models[].name' | grep -q "nomic-embed-text"; then
    echo "   ✅ nomic-embed-text installed"
else
    echo "   ⚠️  nomic-embed-text not found - pulling now..."
    curl -X POST http://localhost:11435/api/pull -d '{"name":"nomic-embed-text"}' &
    echo "   Running in background..."
fi

# 4. Start API
echo "📡 Starting Robbieverse API..."
pkill -f "node dist/server.js" 2>/dev/null
sleep 1

cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse/robbieverse-api
USE_LOCAL_EMBEDDINGS=true \
POSTGRES_HOST=localhost \
POSTGRES_PORT=5432 \
POSTGRES_DB=robbieverse \
POSTGRES_USER=robbie \
POSTGRES_PASSWORD=robbie_dev_2025 \
OLLAMA_BASE_URL=http://localhost:11435 \
PORT=3001 \
node dist/server.js > /tmp/robbie-api.log 2>&1 &

API_PID=$!
echo "   API started (PID: $API_PID)"

# 5. Wait for API to be ready
echo "⏳ Waiting for API..."
for i in {1..10}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "   ✅ API ready!"
        break
    fi
    sleep 1
done

# 6. Show status
echo ""
echo "════════════════════════════════════════"
echo "✅ SMART ROBBIE@CODE IS READY"
echo "════════════════════════════════════════"
echo ""
curl -s http://localhost:3001/health | jq .
echo ""
echo "📝 VS Code Extension installed at:"
echo "   /home/allan/robbie_workspace/combined/aurora-ai-robbiverse/robbie-code/robbie-code-0.1.0.vsix"
echo ""
echo "🎯 To use:"
echo "   1. Open VS Code"
echo "   2. Press Cmd+L to chat"
echo "   3. Press Cmd+I to edit code"
echo ""
echo "📊 Monitor:"
echo "   API logs: tail -f /tmp/robbie-api.log"
echo "   API health: curl http://localhost:3001/health"
echo "   Postgres: docker logs robbieverse-postgres"
echo ""


