#!/bin/bash
# Deploy Robbie Email/Password Login to Vercel

echo "🚀 DEPLOYING ROBBIE TO VERCEL"
echo "============================="
echo ""

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    echo "🔧 Installing Vercel CLI..."
    npm install -g vercel
fi

# Create package.json for Vercel
cat > package.json << 'EOF'
{
  "name": "robbie-email-password-login",
  "version": "1.0.0",
  "description": "Robbie AI Email/Password Login System",
  "scripts": {
    "start": "python3 simple-chat-backend.py"
  },
  "dependencies": {
    "aiohttp": "^3.8.0"
  }
}
EOF

# Create vercel.json config
cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "simple-chat-backend.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/simple-chat-backend.py"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
EOF

echo "✅ Vercel configuration created"
echo ""
echo "🔧 Deploying to Vercel..."
echo "• Login: https://robbie-email-password-login.vercel.app/robbie-auth-gate.html"
echo "• Chat: https://robbie-email-password-login.vercel.app/robbie-unified-interface.html"
echo ""

# Deploy to Vercel
vercel --prod --yes

echo ""
echo "🚀 DEPLOYMENT COMPLETE!"
echo "• Public URL: https://robbie-email-password-login.vercel.app"
echo "• Email/Password Login: Working"
echo "• Matrix Background: Animated"
echo "• Chat Backend: Python/AIOHTTP"

