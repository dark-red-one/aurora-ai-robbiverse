#!/bin/bash
# Simple deployment of unified chat

set -e

echo "🚀 SIMPLE UNIFIED CHAT DEPLOYMENT"
echo "================================="

# Check if we can reach Aurora Town
echo "🔍 Testing Aurora Town connection..."
if ping -c 3 45.32.194.172 > /dev/null 2>&1; then
    echo "✅ Aurora Town is reachable"
    
    # Deploy files
    echo "📤 Deploying unified chat files..."
    scp robbie-unified-chat.html root@45.32.194.172:/var/www/html/chat/index.html
    scp robbie-unified-interface.html root@45.32.194.172:/var/www/html/chat/interface.html
    
    echo "✅ Files deployed successfully!"
    echo "🔗 Chat available at: http://aurora.testpilot.ai/chat"
    
else
    echo "❌ Aurora Town not reachable"
    echo "🔧 Creating local deployment..."
    
    # Create local web server
    mkdir -p /tmp/aurora-chat
    cp robbie-unified-chat.html /tmp/aurora-chat/index.html
    cp robbie-unified-interface.html /tmp/aurora-chat/interface.html
    
    echo "🌐 Starting local web server..."
    cd /tmp/aurora-chat
    python3 -m http.server 8080 &
    SERVER_PID=$!
    
    echo "✅ Local chat server started!"
    echo "🔗 Chat available at: http://localhost:8080"
    echo "🛑 Press Ctrl+C to stop server"
    
    # Wait for user to stop
    trap "kill $SERVER_PID" EXIT
    wait
fi
