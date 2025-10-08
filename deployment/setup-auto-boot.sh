#!/bin/bash
# Setup auto-start on boot for Aurora AI system

echo "🔧 Setting up auto-start on boot..."

# Add to .bashrc if not already there
if ! grep -q "aurora-ai-robbiverse/deployment/boot-everything.sh" ~/.bashrc 2>/dev/null; then
    cat >> ~/.bashrc << 'EOF'

# ===== AURORA AI AUTO-START =====
# Start GPU mesh and all services on login
if [ -f "$HOME/aurora-ai-robbiverse/deployment/boot-everything.sh" ]; then
    # Run in background, suppress output
    bash "$HOME/aurora-ai-robbiverse/deployment/boot-everything.sh" > /tmp/aurora-boot.log 2>&1 &
fi
# ================================
EOF
    echo "✅ Added auto-start to ~/.bashrc"
else
    echo "✅ Auto-start already configured"
fi

echo ""
echo "🎯 AUTO-START CONFIGURED!"
echo ""
echo "After next login/reboot, the system will automatically start:"
echo "  • Ollama service"
echo "  • GPU tunnels (Iceland/RunPod)"
echo "  • GPU mesh monitor"
echo ""
echo "To start now without rebooting:"
echo "  bash ~/aurora-ai-robbiverse/deployment/boot-everything.sh"
echo ""
echo "To remove auto-start, edit ~/.bashrc and remove the AURORA AI section"

