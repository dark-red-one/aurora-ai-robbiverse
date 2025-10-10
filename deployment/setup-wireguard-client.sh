#!/bin/bash
# Setup WireGuard VPN Client (for RobbieBook1, Vengeance, etc.)
# Usage: ./setup-wireguard-client.sh <client_config_file>

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <client_config_file>"
    echo "Example: $0 /tmp/robbiebook1.conf"
    exit 1
fi

CONFIG_FILE=$1

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    exit 1
fi

echo "🔐 Setting up WireGuard VPN Client"
echo "==================================="

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📱 Detected macOS"
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Please install: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    # Install WireGuard
    if ! command -v wg &> /dev/null; then
        echo "📦 Installing WireGuard..."
        brew install wireguard-tools
    else
        echo "✅ WireGuard already installed"
    fi
    
    # Copy config
    mkdir -p /usr/local/etc/wireguard
    cp $CONFIG_FILE /usr/local/etc/wireguard/aurora-vpn.conf
    chmod 600 /usr/local/etc/wireguard/aurora-vpn.conf
    
    echo "✅ Configuration installed"
    echo ""
    echo "📋 To connect:"
    echo "   wg-quick up aurora-vpn"
    echo ""
    echo "📋 To disconnect:"
    echo "   wg-quick down aurora-vpn"
    echo ""
    echo "📋 To auto-start on boot:"
    echo "   sudo brew services start wireguard-go"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "🐧 Detected Linux"
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then 
        echo "❌ Please run as root (sudo) on Linux"
        exit 1
    fi
    
    # Install WireGuard if not present
    if ! command -v wg &> /dev/null; then
        echo "📦 Installing WireGuard..."
        apt update
        apt install -y wireguard
    else
        echo "✅ WireGuard already installed"
    fi
    
    # Copy config
    mkdir -p /etc/wireguard
    cp $CONFIG_FILE /etc/wireguard/aurora-vpn.conf
    chmod 600 /etc/wireguard/aurora-vpn.conf
    
    echo "✅ Configuration installed"
    echo ""
    echo "📋 To connect:"
    echo "   sudo wg-quick up aurora-vpn"
    echo ""
    echo "📋 To disconnect:"
    echo "   sudo wg-quick down aurora-vpn"
    echo ""
    echo "📋 To auto-start on boot:"
    echo "   sudo systemctl enable wg-quick@aurora-vpn"
    echo "   sudo systemctl start wg-quick@aurora-vpn"
    
else
    echo "❌ Unsupported operating system: $OSTYPE"
    exit 1
fi

echo ""
echo "✅ WireGuard client setup complete!"
echo ""
echo "🧪 Test the connection:"
echo "   ping 10.0.0.1  # Aurora Town VPN gateway"

