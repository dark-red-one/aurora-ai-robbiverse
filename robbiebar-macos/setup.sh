#!/bin/bash
# RobbieBar macOS Setup Script

echo "🚀 RobbieBar macOS Setup"
echo "========================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first:"
    echo "   brew install node"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🎯 Setup Complete!"
echo ""
echo "To run RobbieBar:"
echo "  npm start"
echo ""
echo "To build for distribution:"
echo "  npm run build"
echo ""
echo "RobbieBar will appear as a floating window in the top-right corner"
echo "and stay above all other apps. Perfect for keeping Robbie visible! 🚀"

