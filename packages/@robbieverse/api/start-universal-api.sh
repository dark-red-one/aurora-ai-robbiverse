#!/bin/bash

# Start Universal Input API
# This script starts the Robbieverse API with all Universal Input features

echo "🚀 Starting Universal Input API..."

# Change to API directory
cd "$(dirname "$0")"

# Check if database is running
echo "🔍 Checking PostgreSQL..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running!"
    echo "Start it with: brew services start postgresql@16"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Check if database schema is loaded
echo "🔍 Checking database schema..."
psql -h localhost -U allan -d aurora -c "SELECT 1 FROM ai_request_logs LIMIT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  Universal Input schema not loaded"
    echo "Loading schema..."
    psql -h localhost -U allan -d aurora -f ../../database/unified-schema/24-universal-input-logs.sql
    if [ $? -eq 0 ]; then
        echo "✅ Schema loaded successfully"
    else
        echo "❌ Failed to load schema"
        exit 1
    fi
fi

echo "✅ Database schema ready"

# Check if Ollama is running
echo "🔍 Checking Ollama..."
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama is not running!"
    echo "Start it with: ollama serve"
    echo "Or continue without local AI (will use OpenAI API if configured)"
else
    echo "✅ Ollama is running"
    
    # Check for required models
    echo "🔍 Checking AI models..."
    
    if ollama list | grep -q "llama3.2:1b"; then
        echo "✅ Gatekeeper model (llama3.2:1b) found"
    else
        echo "⚠️  Gatekeeper model not found"
        echo "Pull it with: ollama pull llama3.2:1b"
    fi
    
    if ollama list | grep -q "llama3.1:8b"; then
        echo "✅ Chat model (llama3.1:8b) found"
    else
        echo "⚠️  Chat model not found"
        echo "Pull it with: ollama pull llama3.1:8b"
    fi
fi

# Create log directory
echo "📁 Setting up log directory..."
sudo mkdir -p /var/log/robbie
sudo chown -R $(whoami) /var/log/robbie
echo "✅ Log directory ready: /var/log/robbie"

# Set environment variables
export DATABASE_URL="postgresql://allan:fun2Gus!!!@localhost:5432/aurora"
export OLLAMA_URL="http://localhost:11434"
export API_HOST="0.0.0.0"
export API_PORT="8000"

# Check if OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY not set (embeddings will not work)"
    echo "Set it with: export OPENAI_API_KEY='your-key-here'"
else
    echo "✅ OpenAI API key configured"
fi

echo ""
echo "🔥 Starting Robbieverse API with Universal Input..."
echo ""
echo "📊 Endpoints:"
echo "  - API Docs: http://localhost:8000/docs"
echo "  - Universal Input: http://localhost:8000/api/v2/universal/request"
echo "  - Killswitch Status: http://localhost:8000/code/api/killswitch/status"
echo "  - Monitoring: http://localhost:8000/code/api/monitoring/system/current"
echo "  - Logs: tail -f /var/log/robbie/universal-input.log"
echo ""

# Start the API
python3 main.py

