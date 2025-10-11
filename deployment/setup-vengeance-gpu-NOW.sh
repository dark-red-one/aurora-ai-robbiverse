#!/bin/bash
# 🔥 VENGEANCE GPU SETUP - ONE SCRIPT TO RULE THEM ALL 🔥
# Run this ON Vengeance to connect it to RobbieBook1 via VPN
# Usage: sudo bash setup-vengeance-gpu-NOW.sh

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  🔥 VENGEANCE RTX 4090 → ROBBIEBOOK1 SETUP 🔥"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo "❌ Please run with sudo:"
   echo "   sudo bash setup-vengeance-gpu-NOW.sh"
   exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    OS="unknown"
fi

echo "📊 Detected OS: $OS"
echo ""

# ═════════════════════════════════════════════════════════════
# STEP 1: Install WireGuard VPN
# ═════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Installing WireGuard VPN Client..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if command -v wg &> /dev/null; then
    echo "✅ WireGuard already installed"
else
    case "$OS" in
        ubuntu|debian)
            apt-get update
            apt-get install -y wireguard resolvconf
            ;;
        fedora|centos|rhel)
            dnf install -y wireguard-tools
            ;;
        arch)
            pacman -S --noconfirm wireguard-tools
            ;;
        *)
            echo "❌ Unsupported OS: $OS"
            echo "   Please install WireGuard manually"
            exit 1
            ;;
    esac
    echo "✅ WireGuard installed"
fi

echo ""

# ═════════════════════════════════════════════════════════════
# STEP 2: Configure VPN to Aurora
# ═════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Configuring VPN Connection (10.0.0.2)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

mkdir -p /etc/wireguard

# Generate keys if not exist
if [ ! -f /etc/wireguard/privatekey ]; then
    wg genkey | tee /etc/wireguard/privatekey | wg pubkey > /etc/wireguard/publickey
    chmod 600 /etc/wireguard/privatekey
fi

PRIVATE_KEY=$(cat /etc/wireguard/privatekey)
PUBLIC_KEY=$(cat /etc/wireguard/publickey)

# Create WireGuard config
cat > /etc/wireguard/wg0.conf << 'EOF'
[Interface]
PrivateKey = REPLACE_PRIVATE_KEY
Address = 10.0.0.2/24

[Peer]
PublicKey = xX3nFxiMYRmokn+m6tgCMIkrDv139VU0il0vWDu98kI=
Endpoint = aurora-postgres-u44170.vm.elestio.app:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
EOF

sed -i "s|REPLACE_PRIVATE_KEY|$PRIVATE_KEY|g" /etc/wireguard/wg0.conf
chmod 600 /etc/wireguard/wg0.conf

echo "✅ VPN config created"
echo ""
echo "🔑 YOUR PUBLIC KEY (add this to Aurora if not already there):"
echo "   $PUBLIC_KEY"
echo ""

# Start VPN
systemctl stop wg-quick@wg0 2>/dev/null || true
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

sleep 3

echo "🧪 Testing VPN connection..."
if ping -c 2 -W 2 10.0.0.100 &> /dev/null; then
    echo "✅ VPN UP! Can reach RobbieBook1 (10.0.0.100)"
else
    echo "⚠️  VPN up but can't reach RobbieBook1 yet"
    echo "   This is OK - Aurora VPN server might need the public key above"
fi

echo ""

# ═════════════════════════════════════════════════════════════
# STEP 3: Install NVIDIA Drivers (if needed)
# ═════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Checking NVIDIA GPU..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if command -v nvidia-smi &> /dev/null; then
    echo "✅ NVIDIA drivers already installed"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
else
    echo "⚠️  NVIDIA drivers not found"
    echo "   Installing NVIDIA drivers (this takes 5-10 minutes)..."
    
    case "$OS" in
        ubuntu|debian)
            apt-get install -y nvidia-driver-535 nvidia-utils-535
            ;;
        fedora)
            dnf install -y akmod-nvidia xorg-x11-drv-nvidia-cuda
            ;;
        *)
            echo "❌ Please install NVIDIA drivers manually for $OS"
            echo "   Then re-run this script"
            exit 1
            ;;
    esac
    
    echo "✅ NVIDIA drivers installed (reboot may be required)"
fi

echo ""

# ═════════════════════════════════════════════════════════════
# STEP 4: Install Ollama with GPU Support
# ═════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Installing Ollama..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if command -v ollama &> /dev/null; then
    echo "✅ Ollama already installed"
else
    curl -fsSL https://ollama.com/install.sh | sh
    echo "✅ Ollama installed"
fi

# Configure Ollama for network access
mkdir -p /etc/systemd/system/ollama.service.d/
cat > /etc/systemd/system/ollama.service.d/override.conf << 'EOF'
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_ORIGINS=*"
Environment="OLLAMA_GPU_LAYERS=999"
Environment="OLLAMA_FLASH_ATTENTION=1"
Environment="OLLAMA_KEEP_ALIVE=24h"
EOF

systemctl daemon-reload
systemctl enable ollama
systemctl restart ollama

sleep 3

echo "✅ Ollama configured for network access"
echo ""

# Pull AI model
echo "📦 Pulling qwen2.5:7b model (this takes 5-10 minutes)..."
ollama pull qwen2.5:7b

echo "✅ Model ready!"
echo ""

# ═════════════════════════════════════════════════════════════
# STEP 5: Open Firewall
# ═════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Opening Firewall..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if command -v ufw &> /dev/null; then
    ufw allow 11434/tcp
    ufw allow 51820/udp
    echo "✅ Firewall rules added (ufw)"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=11434/tcp
    firewall-cmd --permanent --add-port=51820/udp
    firewall-cmd --reload
    echo "✅ Firewall rules added (firewalld)"
else
    echo "⚠️  No firewall detected - ports should be open"
fi

echo ""

# ═════════════════════════════════════════════════════════════
# STEP 6: Test Everything
# ═════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Testing Configuration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🧪 Testing Ollama locally..."
OLLAMA_TEST=$(curl -s localhost:11434/api/tags 2>&1)
if echo "$OLLAMA_TEST" | grep -q "models"; then
    echo "✅ Ollama working locally"
    MODEL_COUNT=$(echo "$OLLAMA_TEST" | jq -r '.models | length' 2>/dev/null || echo "1")
    echo "   Models installed: $MODEL_COUNT"
else
    echo "❌ Ollama not responding"
fi

echo ""
echo "🧪 Testing VPN connection..."
if ping -c 2 -W 2 10.0.0.100 &> /dev/null; then
    echo "✅ Can reach RobbieBook1 (10.0.0.100)"
else
    echo "⚠️  Cannot reach RobbieBook1 yet"
    echo "   Aurora needs your public key (shown above)"
fi

echo ""

# ═════════════════════════════════════════════════════════════
# SUCCESS!
# ═════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════"
echo "  ✅✅✅ VENGEANCE SETUP COMPLETE! ✅✅✅"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🎯 Vengeance Details:"
echo "   VPN IP: 10.0.0.2"
echo "   Ollama: http://10.0.0.2:11434"
echo "   GPU: $(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null || echo 'Check with nvidia-smi')"
echo ""
echo "📋 Next Steps:"
echo ""
echo "   1. ON AURORA (if VPN not working yet):"
echo "      Add this public key to Aurora's WireGuard config:"
echo "      $PUBLIC_KEY"
echo ""
echo "   2. ON ROBBIEBOOK1:"
echo "      Test connection:"
echo "      curl http://10.0.0.2:11434/api/tags"
echo "      python3 services/gpu-mesh/robbiebook-client.py --test"
echo ""
echo "   3. If GPU not detected:"
echo "      Reboot Vengeance for NVIDIA drivers to load"
echo ""
echo "🔥 Once VPN is fully connected, RobbieBook1 will have"
echo "   direct access to this RTX 4090! 🔥"
echo ""
echo "═══════════════════════════════════════════════════════════"

