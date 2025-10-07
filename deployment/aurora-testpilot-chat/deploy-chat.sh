#!/bin/bash
# Deploy Aurora Chat to aurora.testpilot.ai/chat

echo "🔧 Deploying Aurora Chat to aurora.testpilot.ai/chat..."

# Start chat server on port 80
cd /home/allan/aurora-ai-robbiverse
python3 -m http.server 80 --bind 0.0.0.0 &

# Start chat backend
python3 scripts/aurora-chat-real.py &

echo "✅ Aurora Chat deployed!"
echo "🌐 Access: http://aurora.testpilot.ai/chat/"
echo "🔧 Chat interface: robbie-unified-interface.html"
echo "🔧 Chat backend: scripts/aurora-chat-real.py"
echo "🔧 Port: 80 (HTTP)"
echo "🔧 Features: Matrix animation, auth, multitabbed"
