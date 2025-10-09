#!/bin/bash
# Setup Vengeance VPN Client for Robbieverse Empire
# Usage: sudo ./setup-vengeance-vpn-client.sh <AURORA_PUBLIC_KEY>

set -e

if [ "$EUID" -ne 0 ]; then 
   echo "❌ Please run as root (use sudo)"
   exit 1
fi

if [ -z "$1" ]; then
    echo "❌ Usage: sudo $0 <AURORA_PUBLIC_KEY>"
    echo "   Get the Aurora public key by running the setup script on Aurora Town first"
    exit 1
fi

AURORA_PUBLIC_KEY="$1"

echo "🎮 Setting up Vengeance VPN Client (10.0.0.2)"
echo "=============================================="
echo ""

# Use existing Vengeance private key
if [ ! -f /etc/wireguard/aurora.conf ]; then
    echo "❌ No existing WireGuard config found at /etc/wireguard/aurora.conf"
    echo "   Generating new keys..."
    wg genkey | tee /etc/wireguard/privatekey | wg pubkey > /etc/wireguard/publickey
    chmod 600 /etc/wireguard/privatekey
    PRIVATE_KEY=$(cat /etc/wireguard/privatekey)
else
    echo "✅ Found existing config - extracting private key"
    PRIVATE_KEY=$(grep "^PrivateKey" /etc/wireguard/aurora.conf | awk '{print $3}')
fi

# Get public key
VENGEANCE_PUBLIC_KEY=$(echo "$PRIVATE_KEY" | wg pubkey)
echo "✅ Vengeance Public Key: $VENGEANCE_PUBLIC_KEY"
echo ""

# Create new WireGuard config for Robbieverse Empire
cat > /etc/wireguard/wg0.conf << EOF
[Interface]
PrivateKey = ${PRIVATE_KEY}
Address = 10.0.0.2/24

[Peer]
PublicKey = ${AURORA_PUBLIC_KEY}
Endpoint = aurora-postgres-u44170.vm.elestio.app:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
EOF

chmod 600 /etc/wireguard/wg0.conf

echo "✅ Config created at /etc/wireguard/wg0.conf"
echo ""

# Stop old interface if running
systemctl stop wg-quick@aurora 2>/dev/null || true

# Stop existing wg0 if running
systemctl stop wg-quick@wg0 2>/dev/null || true

# Start new interface
echo "🚀 Starting WireGuard..."
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

# Wait a moment for interface to come up
sleep 2

# Test connectivity
echo ""
echo "🧪 Testing VPN connectivity..."
if ping -c 3 10.0.0.10 &> /dev/null; then
    echo "✅ VPN connected! Aurora Town is reachable at 10.0.0.10"
else
    echo "⚠️  Cannot reach Aurora Town yet - check firewall on Aurora Town"
    echo "   Make sure port 51820/udp is open and WireGuard is running"
fi

# Show status
echo ""
echo "📊 WireGuard Status:"
wg show

echo ""
echo "✅ Vengeance VPN Client configured!"
echo "=============================================="
echo "🔑 Your Public Key (add this to Aurora Town):"
echo "   $VENGEANCE_PUBLIC_KEY"
echo ""
echo "📋 Quick Commands:"
echo "   Status:      sudo systemctl status wg-quick@wg0"
echo "   Restart:     sudo systemctl restart wg-quick@wg0"
echo "   Stop:        sudo systemctl stop wg-quick@wg0"
echo "   Show peers:  sudo wg show"
echo ""
echo "🧪 Test Database Connection:"
echo "   PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At psql -h 10.0.0.10 -p 25432 -U postgres -d robbieverse -c \"SELECT NOW();\""
echo ""

