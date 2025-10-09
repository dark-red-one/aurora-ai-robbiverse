#!/bin/bash
echo "🔨 Building Robbie@Code Extension..."

# Clean dist directory
rm -rf dist/

# Build TypeScript extension files
echo "📝 Building TypeScript extension files..."
npx tsc -p ./

# Build webview to separate directory first
echo "🌐 Building webview..."
npx vite build --outDir dist-webview

# Build RobbieBar to separate directory first  
echo "📊 Building RobbieBar..."
npx vite build --config vite-bar.config.ts --outDir dist-robbiebar

# Copy webview files to dist
echo "📋 Copying webview files..."
cp dist-webview/webview.js dist/
rm -rf dist-webview

# Copy RobbieBar files to dist
echo "📋 Copying RobbieBar files..."
cp dist-robbiebar/robbie-bar.js dist/
rm -rf dist-robbiebar

# Verify files exist
echo "✅ Verifying build..."
if [ -f "dist/extension/extension.js" ]; then
    echo "✅ Extension file: dist/extension/extension.js"
else
    echo "❌ Missing: dist/extension/extension.js"
    exit 1
fi

if [ -f "dist/webview.js" ]; then
    echo "✅ Webview file: dist/webview.js"
else
    echo "❌ Missing: dist/webview.js"
    exit 1
fi

if [ -f "dist/robbie-bar.js" ]; then
    echo "✅ RobbieBar file: dist/robbie-bar.js"
else
    echo "❌ Missing: dist/robbie-bar.js"
    exit 1
fi

echo "🎉 Build complete! All files ready."
