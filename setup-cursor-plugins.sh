#!/bin/bash
# RobbieBook1.testpilot.ai - Cursor Plugin Setup
# Install essential plugins for Aurora AI development

echo "🚀 RobbieBook1.testpilot.ai - Cursor Plugin Setup"
echo "   Installing Essential Development Plugins"
echo "=========================================================="

# Check if Cursor is installed
if ! command -v cursor &> /dev/null; then
    echo "❌ Cursor not found. Please install Cursor first."
    echo "   Download from: https://cursor.sh/"
    exit 1
fi

echo "✅ Cursor found. Installing plugins..."
echo ""

# Essential plugins for Aurora AI development
PLUGINS=(
    "gruntfuggly.todo-tree"           # Todo Tree - Track TODOs and FIXMEs
    "ms-toolsai.jupyter"              # Jupyter - Notebook support for AI
    "mtxr.sqltools"                   # SQLTools - Database management
    "eamodio.gitlens"                 # GitLens - Git superpowers
    "ms-azuretools.vscode-docker"     # Docker - Container management
    "redhat.vscode-yaml"              # YAML - Configuration file support
    "humao.rest-client"               # REST Client - API testing
    "mhutchie.git-graph"              # Git Graph - Visualize Git history
    "hediet.vscode-drawio"            # Draw.io Integration - Create diagrams
    "alefragnani.bookmarks"           # Bookmarks - Code navigation
)

echo "📦 Installing ${#PLUGINS[@]} essential plugins..."
echo ""

# Install each plugin
for plugin in "${PLUGINS[@]}"; do
    echo "Installing: $plugin"
    cursor --install-extension "$plugin" --force
    if [ $? -eq 0 ]; then
        echo "   ✅ Success"
    else
        echo "   ❌ Failed"
    fi
    echo ""
done

echo "🎉 Cursor Plugin Setup Complete!"
echo "================================="
echo ""
echo "📋 Installed Plugins:"
echo "====================="
echo "✅ Todo Tree - Track TODOs and FIXMEs across files"
echo "✅ Jupyter - Notebook support for AI development"
echo "✅ SQLTools - Database management and queries"
echo "✅ GitLens - Enhanced Git capabilities"
echo "✅ Docker - Container management"
echo "✅ YAML - Configuration file support"
echo "✅ REST Client - Test APIs directly in editor"
echo "✅ Git Graph - Visualize Git history"
echo "✅ Draw.io Integration - Create system diagrams"
echo "✅ Bookmarks - Save important code locations"
echo ""
echo "🚀 Quick Start Guide:"
echo "===================="
echo ""
echo "1. Todo Tree:"
echo "   - View: Ctrl+Shift+P → 'Todo Tree: View'"
echo "   - Add TODO: // TODO: Your task here"
echo ""
echo "2. Jupyter:"
echo "   - Create .ipynb files for AI model development"
echo "   - Use for testing Aurora AI features"
echo ""
echo "3. SQLTools:"
echo "   - Connect to PostgreSQL database"
echo "   - Run queries on Aurora AI database"
echo ""
echo "4. GitLens:"
echo "   - See who changed what and when"
echo "   - Inline blame annotations"
echo ""
echo "5. REST Client:"
echo "   - Test Aurora AI APIs with .http files"
echo "   - Create requests like: GET http://localhost:8000/health"
echo ""
echo "6. Bookmarks:"
echo "   - Ctrl+Alt+K: Toggle bookmark"
echo "   - Ctrl+Alt+J: Jump to next bookmark"
echo ""
echo "7. Draw.io:"
echo "   - Create .drawio files for system architecture"
echo "   - Perfect for Aurora AI empire diagrams"
echo ""
echo "🤖 Your Cursor is now optimized for Aurora AI development!"
echo "   Start coding your empire! 🚀"









