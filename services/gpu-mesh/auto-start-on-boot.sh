#!/bin/bash
# Add GPU Mesh to auto-start on boot

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
START_SCRIPT="$SCRIPT_DIR/start-mesh.sh"

# Add to ~/.bashrc if not already there
if ! grep -q "aurora-gpu-mesh" ~/.bashrc 2>/dev/null; then
    echo "" >> ~/.bashrc
    echo "# Auto-start Aurora GPU Mesh" >> ~/.bashrc
    echo "if [ -f \"$START_SCRIPT\" ]; then" >> ~/.bashrc
    echo "    bash \"$START_SCRIPT\" 2>/dev/null &" >> ~/.bashrc
    echo "fi" >> ~/.bashrc
    
    echo "✅ Added GPU Mesh auto-start to ~/.bashrc"
    echo ""
    echo "The mesh will automatically start on next login."
    echo "To start now: bash $START_SCRIPT"
else
    echo "⚠️  Auto-start already configured in ~/.bashrc"
fi

echo ""
echo "To remove auto-start, edit ~/.bashrc and remove the 'aurora-gpu-mesh' section"



