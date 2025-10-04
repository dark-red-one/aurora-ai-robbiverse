#!/bin/bash
# Vengeance Linux Post-Installation Setup Script
# Run this after installing Pop!_OS on your RTX 4090 desktop

echo "🔥 VENGEANCE LINUX POST-INSTALL SETUP 🔥"
echo "========================================"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential tools
echo "🛠️ Installing essential tools..."
sudo apt install -y curl wget git vim htop neofetch tree unzip zip

# Install Node.js (for Vengeance system)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python and AI/ML tools
echo "🐍 Installing Python and AI/ML tools..."
sudo apt install -y python3-pip python3-venv python3-dev
pip3 install --upgrade pip

# Install PyTorch with CUDA support for RTX 4090
echo "🔥 Installing PyTorch with CUDA support..."
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install Docker
echo "🐳 Installing Docker..."
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER

# Install Ollama for local LLM inference
echo "🤖 Installing Ollama..."
curl -fsSL https://ollama.ai/install.sh | sh

# Install CUDA toolkit
echo "⚡ Installing CUDA toolkit..."
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.0-1_all.deb
sudo dpkg -i cuda-keyring_1.0-1_all.deb
sudo apt update
sudo apt install -y cuda-toolkit

# Create Vengeance user directory
echo "📁 Setting up Vengeance directories..."
mkdir -p ~/vengeance
mkdir -p ~/vengeance/aurora-ai-robbiverse
mkdir -p ~/vengeance/data
mkdir -p ~/vengeance/logs
mkdir -p ~/vengeance/backups

# Create GPU monitoring script
echo "📊 Creating GPU monitoring script..."
cat > ~/vengeance/gpu_monitor.sh << 'EOF'
#!/bin/bash
while true; do
    clear
    echo "=== VENGEANCE RTX 4090 STATUS ==="
    echo "Time: $(date)"
    echo ""
    nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv,noheader,nounits
    echo ""
    echo "Press Ctrl+C to exit"
    sleep 5
done
EOF

chmod +x ~/vengeance/gpu_monitor.sh

# Create system status script
echo "📈 Creating system status script..."
cat > ~/vengeance/vengeance_status.sh << 'EOF'
#!/bin/bash
echo "🔥 VENGEANCE SYSTEM STATUS 🔥"
echo "================================"
echo "Hostname: $(hostname)"
echo "User: $(whoami)"
echo "Date: $(date)"
echo ""
echo "GPU Status:"
nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader,nounits
echo ""
echo "System Resources:"
free -h
echo ""
df -h /
echo ""
echo "Running processes (top 10):"
ps aux --sort=-%cpu | head -11
EOF

chmod +x ~/vengeance/vengeance_status.sh

# Create Vengeance startup script
echo "🚀 Creating Vengeance startup script..."
cat > ~/vengeance/start_vengeance.sh << 'EOF'
#!/bin/bash
echo "🔥 Starting Vengeance AI System..."
cd ~/vengeance/aurora-ai-robbiverse

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if project exists
if [ ! -f "package.json" ]; then
    echo "❌ Aurora AI Robbiverse project not found."
    echo "Please clone the project to ~/vengeance/aurora-ai-robbiverse/"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start Vengeance system
echo "🔥 Starting Vengeance..."
./bin/vengeance
EOF

chmod +x ~/vengeance/start_vengeance.sh

# Create desktop shortcuts
echo "🖥️ Creating desktop shortcuts..."
cat > ~/Desktop/Vengeance\ GPU\ Monitor.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Vengeance GPU Monitor
Comment=Monitor RTX 4090 GPU status
Exec=gnome-terminal -- bash -c "~/vengeance/gpu_monitor.sh; exec bash"
Icon=utilities-system-monitor
Terminal=false
Categories=System;
EOF

cat > ~/Desktop/Vengeance\ Status.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Vengeance Status
Comment=Check Vengeance system status
Exec=gnome-terminal -- bash -c "~/vengeance/vengeance_status.sh; exec bash"
Icon=utilities-system-monitor
Terminal=false
Categories=System;
EOF

cat > ~/Desktop/Start\ Vengeance.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Start Vengeance
Comment=Start Vengeance AI System
Exec=gnome-terminal -- bash -c "~/vengeance/start_vengeance.sh; exec bash"
Icon=applications-development
Terminal=false
Categories=Development;
EOF

chmod +x ~/Desktop/*.desktop

# Set up SSH access
echo "🔐 Setting up SSH access..."
sudo apt install -y openssh-server
sudo systemctl enable ssh
sudo systemctl start ssh

# Create SSH key for MacBook access
echo "🔑 Creating SSH key for MacBook access..."
ssh-keygen -t ed25519 -f ~/.ssh/vengeance_key -N ""

echo ""
echo "✅ VENGEANCE LINUX SETUP COMPLETE! 🔥"
echo "====================================="
echo ""
echo "Next steps:"
echo "1. Reboot to apply all changes: sudo reboot"
echo "2. Clone your Aurora AI project: git clone <your-repo> ~/vengeance/aurora-ai-robbiverse/"
echo "3. Start Vengeance: ~/vengeance/start_vengeance.sh"
echo "4. Monitor GPU: ~/vengeance/gpu_monitor.sh"
echo ""
echo "SSH Key for MacBook access:"
echo "Add this to your MacBook's ~/.ssh/authorized_keys:"
cat ~/.ssh/vengeance_key.pub
echo ""
echo "Then connect from MacBook: ssh vengeance@<vengeance-ip>"
echo ""
echo "🔥 Vengeance is ready for AI domination! 🔥"



