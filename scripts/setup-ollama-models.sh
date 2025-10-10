#!/bin/bash
# Setup Ollama Models for Robbie
# Pulls all required models and creates custom Robbie personalities

set -e

echo "🤖 Setting up Ollama models for Robbie..."
echo ""

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "❌ Ollama is not running on localhost:11434"
    echo "   Start Ollama first: ollama serve"
    exit 1
fi

echo "✅ Ollama is running"
echo ""

# Pull base models
echo "📥 Pulling base models..."
echo ""

echo "1/3 Fast model (qwen2.5-coder:7b)..."
ollama pull qwen2.5-coder:7b

echo ""
echo "2/3 Smart model (qwen2.5-coder:32k)..."
ollama pull qwen2.5-coder:32k

echo ""
echo "3/3 Vision model (llama3.2-vision:11b)..."
ollama pull llama3.2-vision:11b

echo ""
echo "✅ Base models pulled successfully!"
echo ""

# Create custom Robbie models
echo "🎨 Creating custom Robbie personalities..."
echo ""

cd "$(dirname "$0")/.."

echo "1/3 Creating robbie:fast..."
ollama create robbie:fast -f Modelfile.robbie-v2

echo ""
echo "2/3 Creating robbie:smart..."
ollama create robbie:smart -f Modelfile.robbie-smart

echo ""
echo "3/3 Creating robbie:vision..."
ollama create robbie:vision -f Modelfile.robbie-vision

echo ""
echo "✅ Custom Robbie models created!"
echo ""

# Test models
echo "🧪 Testing models..."
echo ""

echo "Testing robbie:fast..."
RESPONSE=$(ollama run robbie:fast "Quick test: What's 2+2?" 2>&1 | head -n 1)
echo "   Response: ${RESPONSE:0:50}..."

echo ""
echo "Testing robbie:smart..."
RESPONSE=$(ollama run robbie:smart "Quick test: What's 2+2?" 2>&1 | head -n 1)
echo "   Response: ${RESPONSE:0:50}..."

echo ""
echo "✅ All tests passed!"
echo ""

# Display model info
echo "📊 Installed Robbie Models:"
echo ""
ollama list | grep -E "robbie:|qwen2.5-coder|llama3.2-vision" || echo "   (models still loading)"

echo ""
echo "🚀 Setup Complete!"
echo ""
echo "Available models:"
echo "  • robbie:fast (qwen2.5-coder:7b) - Quick responses"
echo "  • robbie:smart (qwen2.5-coder:32k) - Deep analysis"
echo "  • robbie:vision (llama3.2-vision:11b) - Image analysis"
echo ""
echo "Usage:"
echo "  ollama run robbie:fast 'Your question'"
echo "  ollama run robbie:smart 'Complex analysis'"
echo "  ollama run robbie:vision 'Analyze this image' --image screenshot.png"
echo ""
echo "💡 Smart routing will automatically select the best model!"


