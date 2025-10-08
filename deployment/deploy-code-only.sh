#!/bin/bash
# 🔥💋 DEPLOY ROBBIE@CODE ONLY (Working App) 🔥💋

set -e

echo "🔥 Deploying Robbie@Code..."

BASE_DIR="/home/allan/aurora-ai-robbiverse"
WEB_ROOT="/var/www/aurora.testpilot.ai"

echo "📦 Building Robbie@Code..."
cd "$BASE_DIR/robbie-app"
npm run build
echo "✅ Built!"

echo "📁 Creating directories..."
mkdir -p "$WEB_ROOT"

echo "🏠 Deploying homepage..."
cp "$BASE_DIR/robbie-home/index.html" "$WEB_ROOT/index.html"
echo "✅ Homepage deployed!"

echo "💻 Deploying Robbie@Code..."
rm -rf "$WEB_ROOT/code"
cp -r "$BASE_DIR/robbie-app/dist" "$WEB_ROOT/code"
echo "✅ Robbie@Code deployed!"

echo "⚙️  Installing nginx config (HTTP only)..."
cp "$BASE_DIR/deployment/nginx-robbie-apps-http-only.conf" /etc/nginx/sites-available/robbie-apps
ln -sf /etc/nginx/sites-available/robbie-apps /etc/nginx/sites-enabled/robbie-apps
echo "✅ Nginx config installed!"

echo "🔧 Testing nginx..."
nginx -t
echo "✅ Valid!"

echo "🔄 Reloading nginx..."
systemctl reload nginx
echo "✅ Reloaded!"

echo "🔐 Setting permissions..."
chown -R www-data:www-data "$WEB_ROOT"
chmod -R 755 "$WEB_ROOT"
echo "✅ Done!"

echo ""
echo "🎉💋 ROBBIE@CODE DEPLOYED! 🎉💋"
echo ""
echo "Access at:"
echo "🏠 https://aurora.testpilot.ai/"
echo "💻 https://aurora.testpilot.ai/code/"
echo ""
echo "(Work and Play apps need fixing first)"
