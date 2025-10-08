#!/bin/bash
# 🔥💋 ADD VERSIONING TO ALL APPS 🔥💋

VERSION=$(date +"%Y%m%d-%H%M%S")
BASE_DIR="/home/allan/aurora-ai-robbiverse"
WEB_ROOT="/var/www/aurora.testpilot.ai"

echo "🔥 Adding version $VERSION to all apps..."

# Add version to homepage
echo "📝 Adding version to homepage..."
cp "$BASE_DIR/robbie-home/index.html" "$BASE_DIR/robbie-home/index.html.backup"
sed -i "s|<title>Robbie - Your AI Partner 💜</title>|<title>Robbie - Your AI Partner 💜 (v$VERSION)</title>|" "$BASE_DIR/robbie-home/index.html"
sed -i "s|Welcome to the Robbie Ecosystem|Welcome to the Robbie Ecosystem (v$VERSION)|" "$BASE_DIR/robbie-home/index.html"

# Add version to Robbie@Code HTML
echo "📝 Adding version to Robbie@Code..."
cd "$BASE_DIR/robbie-app"
cp index.html index.html.backup
sed -i "s|<title>Robbie@Code - Let's Write Sexy Code Together 💻💋</title>|<title>Robbie@Code - Let's Write Sexy Code Together 💻💋 (v$VERSION)</title>|" index.html

# Rebuild and deploy
echo "🔨 Rebuilding Robbie@Code..."
npm run build

echo "🚀 Deploying versioned apps..."
sudo cp "$BASE_DIR/robbie-home/index.html" "$WEB_ROOT/index.html"
sudo rm -rf "$WEB_ROOT/code"
sudo cp -r "$BASE_DIR/robbie-app/dist" "$WEB_ROOT/code"
sudo chown -R www-data:www-data "$WEB_ROOT"

echo "✅ Version $VERSION deployed!"
echo "🌐 Test at: http://155.138.194.222/ and http://155.138.194.222/code"










