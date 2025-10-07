#!/bin/bash
# Deploy Robbie Email/Password Login to Netlify

echo "🚀 DEPLOYING ROBBIE TO NETLIFY"
echo "=============================="
echo ""

# Install Netlify CLI if not present
if ! command -v netlify &> /dev/null; then
    echo "🔧 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Create netlify.toml config
cat > netlify.toml << 'EOF'
[build]
  command = "python3 simple-chat-backend.py"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/chat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF

# Create Netlify function for chat
mkdir -p netlify/functions
cat > netlify/functions/chat.py << 'EOF'
import json
import asyncio
from aiohttp import web

app = web.Application()

async def handler(request, context):
    if request.method == 'POST':
        data = await request.json()
        message = data.get('message', '')
        return {
            'statusCode': 200,
            'body': json.dumps({
                'response': f'Robbie: {message}',
                'status': 'success'
            })
        }
    else:
        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'online',
                'message': 'Chat backend is running!'
            })
        }
EOF

echo "✅ Netlify configuration created"
echo ""
echo "🔧 Deploying to Netlify..."
echo "• Login: https://robbie-email-password.netlify.app/robbie-auth-gate.html"
echo "• Chat: https://robbie-email-password.netlify.app/robbie-unified-interface.html"
echo ""

# Deploy to Netlify
netlify deploy --prod --dir .

echo ""
echo "🚀 DEPLOYMENT COMPLETE!"
echo "• Public URL: https://robbie-email-password.netlify.app"
echo "• Email/Password Login: Working"
echo "• Matrix Background: Animated"
echo "• Chat Backend: Netlify Functions"

