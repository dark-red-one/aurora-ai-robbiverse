#!/bin/bash
# VENGEANCE LINUX SETUP - RTX 4090 Development Machine
# Fresh Linux install optimized for Cursor + Cloud Development

echo "🔥 VENGEANCE LINUX SETUP - RTX 4090 DEV MACHINE"
echo "==============================================="

# Update system first
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 1. Install essential development tools
echo "🛠️ Installing development essentials..."
sudo apt install -y curl wget git vim build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# 2. Install NVIDIA drivers for RTX 4090
echo "🔥 Installing NVIDIA RTX 4090 drivers..."
sudo apt install -y ubuntu-drivers-common
sudo ubuntu-drivers autoinstall
# Alternative: sudo apt install -y nvidia-driver-535 nvidia-cuda-toolkit

# 3. Install Docker for containerized development
echo "🐳 Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER

# 4. Install Node.js (latest LTS)
echo "🟢 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# 5. Install Python development environment
echo "🐍 Installing Python development tools..."
sudo apt install -y python3 python3-pip python3-venv python-is-python3
pip3 install --user --upgrade pip setuptools wheel

# 6. Install VS Code / Cursor dependencies
echo "💻 Installing Cursor dependencies..."
sudo apt install -y software-properties-common apt-transport-https wget
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" | sudo tee /etc/apt/sources.list.d/vscode.list

# 7. Install browsers for restored bookmarks
echo "🌐 Installing browsers..."
# Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt update
sudo apt install -y google-chrome-stable firefox

# 8. Install useful development tools
echo "⚙️ Installing additional dev tools..."
sudo apt install -y htop btop neofetch tree jq unzip zip p7zip-full

# 9. Install Ollama for local AI development
echo "🤖 Installing Ollama for local AI..."
curl -fsSL https://ollama.ai/install.sh | sh

# 10. Configure shell (bash with useful aliases)
echo "🐚 Configuring shell environment..."
cat >> ~/.bashrc << 'EOF'

# Vengeance Linux Development Aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias gpu='nvidia-smi'
alias dps='docker ps'
alias dlog='docker logs'
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'

# RTX 4090 GPU monitoring
alias gpumon='watch -n 1 nvidia-smi'
alias temp='nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader'

# Quick system info
alias vengeance='echo "🔥 VENGEANCE LINUX - RTX 4090 DEV MACHINE" && neofetch'

# Development shortcuts
alias aurora='echo "🤖 Aurora AI Empire - Cloud Development Ready!"'

EOF

# 11. Set up automatic NVIDIA persistence
echo "🔧 Configuring NVIDIA settings..."
sudo nvidia-persistenced --user $USER

# 12. Create desktop shortcuts and final setup
echo "🖥️ Setting up desktop environment..."
mkdir -p ~/Desktop ~/Documents/Development

# Success message
echo ""
echo "🎉 VENGEANCE LINUX SETUP COMPLETE!"
echo "=================================="
echo "✅ RTX 4090 drivers installed"
echo "✅ Docker ready for containers"
echo "✅ Node.js and Python environments"
echo "✅ Browsers ready for bookmark restoration"
echo "✅ Ollama for local AI development"
echo "✅ Development tools configured"
echo ""
echo "🔄 NEXT STEPS:"
echo "1. Reboot to activate NVIDIA drivers"
echo "2. Install Cursor from cursor.sh"
echo "3. Run bookmark restoration script"
echo "4. Connect to Aurora cloud workspace"
echo "5. Test RTX 4090 with: nvidia-smi"
echo ""
echo "🚀 VENGEANCE IS NOW A LINUX AI DEVELOPMENT BEAST!"
