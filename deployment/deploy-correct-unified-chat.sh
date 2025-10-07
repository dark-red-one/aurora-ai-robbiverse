#!/bin/bash
# Deploy the CORRECT unified chat with Matrix, avatars, login, multitab

set -e

echo "🚀 DEPLOYING CORRECT UNIFIED CHAT"
echo "================================="

# Configuration
AURORA_TOWN_IP="45.32.194.172"
CHAT_PATH="/var/www/html/chat"

echo "🏛️ Aurora Town: ${AURORA_TOWN_IP}"
echo "📁 Chat Path: ${CHAT_PATH}"
echo ""

# Deploy the correct unified interface
echo "📤 Deploying unified interface with Matrix, avatars, login, multitab..."
scp robbie-unified-interface.html root@${AURORA_TOWN_IP}:${CHAT_PATH}/index.html

# Also deploy avatar chat as alternative
scp robbie-avatar-chat.html root@${AURORA_TOWN_IP}:${CHAT_PATH}/avatar.html

# Deploy auth gate
scp robbie-auth-gate.html root@${AURORA_TOWN_IP}:${CHAT_PATH}/login.html

echo "✅ CORRECT unified chat deployed!"
echo "🔗 Main interface: http://aurora.testpilot.ai/chat"
echo "🔗 Avatar chat: http://aurora.testpilot.ai/chat/avatar.html"
echo "🔗 Login: http://aurora.testpilot.ai/chat/login.html"
echo ""
echo "🎯 Features deployed:"
echo "• Matrix background animations"
echo "• Avatar chat interface"
echo "• Login/authentication system"
echo "• Multitabbed interface"
echo "• Real-time chat capabilities"
echo ""
echo "🚀 UNIFIED CHAT IS LIVE WITH ALL FEATURES!"
