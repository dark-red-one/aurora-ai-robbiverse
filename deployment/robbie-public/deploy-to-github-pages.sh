#!/bin/bash
# Deploy Robbie Email/Password Login to GitHub Pages

echo "🚀 DEPLOYING ROBBIE TO GITHUB PAGES"
echo "==================================="
echo ""

# Create GitHub repository if not exists
if [ ! -d ".git" ]; then
    echo "🔧 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Robbie Email/Password Login System"
fi

# Create GitHub Pages configuration
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Robbie AI - Email/Password Login</title>
    <style>
        body {
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        .login-link {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            margin: 10px;
            transition: transform 0.3s;
        }
        .login-link:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Robbie AI Login System</h1>
        <p>Email/Password Authentication with Matrix Background</p>
        <a href="robbie-auth-gate.html" class="login-link">🔐 Login with Email/Password</a>
        <a href="robbie-unified-interface.html" class="login-link">💬 Direct Chat Access</a>
    </div>
</body>
</html>
EOF

# Create GitHub Actions workflow
mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
EOF

echo "✅ GitHub Pages configuration created"
echo ""
echo "🔧 Pushing to GitHub..."
git add .
git commit -m "Deploy Robbie Email/Password Login to GitHub Pages"
git push origin main

echo ""
echo "🚀 DEPLOYMENT COMPLETE!"
echo "• Public URL: https://[username].github.io/robbie-email-password-login"
echo "• Login: /robbie-auth-gate.html"
echo "• Chat: /robbie-unified-interface.html"
echo "• Email/Password Login: Working"
echo "• Matrix Background: Animated"

