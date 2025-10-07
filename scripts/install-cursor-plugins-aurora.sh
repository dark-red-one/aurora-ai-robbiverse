#!/bin/bash
# Install Cursor plugins for Aurora AI development

echo "🚀 INSTALLING CURSOR PLUGINS FOR AURORA AI"
echo "=========================================="

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
    "ms-python.python"                # Python - Python development
    "ms-python.pylint"                # Pylint - Python linting
    "ms-python.black-formatter"       # Black - Python formatting
    "ms-vscode.vscode-json"           # JSON - JSON support
    "bradlc.vscode-tailwindcss"       # Tailwind CSS - CSS framework
    "esbenp.prettier-vscode"          # Prettier - Code formatting
    "ms-vscode.vscode-typescript-next" # TypeScript - TypeScript support
    "ms-vscode.vscode-javascript"     # JavaScript - JS support
    "ms-vscode.vscode-html-css-support" # HTML CSS Support
    "ms-vscode.vscode-css-peek"       # CSS Peek - CSS navigation
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

echo "🎉 CURSOR PLUGIN INSTALLATION COMPLETE!"
echo "======================================="
echo ""
echo "📋 INSTALLED PLUGINS:"
echo "====================="
echo "✅ Todo Tree - Track TODOs and FIXMEs across files"
echo "✅ Jupyter - Notebook support for AI development"
echo "✅ SQLTools - Database management and queries"
echo "✅ GitLens - Enhanced Git capabilities"
echo "✅ Docker - Container management"
echo "✅ YAML - Configuration file support"
echo "✅ REST Client - API testing"
echo "✅ Git Graph - Visualize Git history"
echo "✅ Draw.io - Create diagrams"
echo "✅ Bookmarks - Code navigation"
echo "✅ Python - Python development"
echo "✅ Pylint - Python linting"
echo "✅ Black - Python formatting"
echo "✅ JSON - JSON support"
echo "✅ Tailwind CSS - CSS framework"
echo "✅ Prettier - Code formatting"
echo "✅ TypeScript - TypeScript support"
echo "✅ JavaScript - JS support"
echo "✅ HTML CSS Support - HTML/CSS"
echo "✅ CSS Peek - CSS navigation"
echo ""
echo "🤖 ROBBIE-SPECIFIC EXTENSIONS:"
echo "=============================="
echo "• Robbie Avatar - Beautiful avatar with mood changes"
echo "• Cursor Ollama - Connect to local Ollama LLM"
echo "• Cursor GPU Mesh - Connect to Aurora GPU mesh"
echo "• Memory System - Conversation memory and search"
echo ""
echo "🚀 CURSOR IS NOW TURBOCHARGED FOR AURORA AI DEVELOPMENT!"
