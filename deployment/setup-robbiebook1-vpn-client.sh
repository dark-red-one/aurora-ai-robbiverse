#!/bin/bash
# Setup RobbieBook1 (MacBook) VPN Client for Robbieverse Empire
# Usage: ./setup-robbiebook1-vpn-client.sh <AURORA_PUBLIC_KEY>

set -e

if [ -z "$1" ]; then
    echo "❌ Usage: $0 <AURORA_PUBLIC_KEY>"
    echo ""
    echo "First, get Aurora Town's public key by running on Aurora Town:"
    echo "  ssh root@aurora-postgres-u44170.vm.elestio.app"
    echo "  cat /etc/wireguard/publickey"
    echo ""
    exit 1
fi

AURORA_PUBLIC_KEY="$1"

echo "💻 Setting up RobbieBook1 VPN Client (10.0.0.100)"
echo "=================================================="
echo ""

# Check if WireGuard is installed
if ! command -v wg &> /dev/null; then
    echo "📦 Installing WireGuard..."
    brew install wireguard-tools
else
    echo "✅ WireGuard already installed"
fi

# Create .wireguard directory
mkdir -p ~/.wireguard
chmod 700 ~/.wireguard

# Generate keys if they don't exist
if [ ! -f ~/.wireguard/privatekey ]; then
    echo "🔑 Generating new WireGuard keys..."
    wg genkey | tee ~/.wireguard/privatekey | wg pubkey > ~/.wireguard/publickey
    chmod 600 ~/.wireguard/privatekey
    chmod 644 ~/.wireguard/publickey
else
    echo "✅ Using existing keys"
fi

# Get public key
ROBBIEBOOK_PUBLIC_KEY=$(cat ~/.wireguard/publickey)
PRIVATE_KEY=$(cat ~/.wireguard/privatekey)

echo ""
echo "✅ RobbieBook1 Public Key: $ROBBIEBOOK_PUBLIC_KEY"
echo ""
echo "⚠️  IMPORTANT: Add this to Aurora Town's /etc/wireguard/wg0.conf:"
echo ""
echo "[Peer]"
echo "PublicKey = $ROBBIEBOOK_PUBLIC_KEY"
echo "AllowedIPs = 10.0.0.100/32"
echo ""
echo "Press Enter when you've added it to Aurora Town and restarted WireGuard there..."
read

# Create WireGuard config
cat > ~/.wireguard/robbie-empire.conf << EOF
[Interface]
PrivateKey = ${PRIVATE_KEY}
Address = 10.0.0.100/24
DNS = 8.8.8.8

[Peer]
PublicKey = ${AURORA_PUBLIC_KEY}
Endpoint = aurora-postgres-u44170.vm.elestio.app:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
EOF

chmod 600 ~/.wireguard/robbie-empire.conf

echo "✅ Config created at ~/.wireguard/robbie-empire.conf"
echo ""

# Create connection scripts
cat > ~/robbie-vpn-connect.sh << 'EOF'
#!/bin/bash
echo "🛡️  Connecting to Robbie Empire VPN..."
sudo wg-quick up ~/.wireguard/robbie-empire.conf

echo ""
echo "🧪 Testing connectivity..."
if ping -c 3 10.0.0.10 &> /dev/null; then
    echo "✅ Aurora Town reachable at 10.0.0.10"
else
    echo "⚠️  Cannot reach Aurora Town - check firewall"
fi

if ping -c 3 10.0.0.2 &> /dev/null; then
    echo "✅ Vengeance reachable at 10.0.0.2"
else
    echo "⚠️  Cannot reach Vengeance - may need VPN on Vengeance first"
fi

echo ""
echo "🐘 Testing Elephant database..."
if PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At psql -h 10.0.0.10 -p 25432 -U postgres -d aurora_unified -c "SELECT 'RobbieBook1 connected!' as status;" 2>/dev/null; then
    echo "✅ Elephant database accessible!"
else
    echo "⚠️  Cannot connect to Elephant - check credentials"
fi

echo ""
echo "✅ VPN connected!"
sudo wg show
EOF

cat > ~/robbie-vpn-disconnect.sh << 'EOF'
#!/bin/bash
echo "🛡️  Disconnecting from Robbie Empire VPN..."
sudo wg-quick down ~/.wireguard/robbie-empire.conf
echo "✅ VPN disconnected!"
EOF

chmod +x ~/robbie-vpn-connect.sh ~/robbie-vpn-disconnect.sh

echo "✅ RobbieBook1 VPN Client configured!"
echo "=============================================="
echo ""
echo "📋 Your Public Key (already added to Aurora Town):"
echo "   $ROBBIEBOOK_PUBLIC_KEY"
echo ""
echo "🚀 Quick Commands:"
echo "   Connect:     ~/robbie-vpn-connect.sh"
echo "   Disconnect:  ~/robbie-vpn-disconnect.sh"
echo "   Status:      sudo wg show"
echo ""
echo "🧪 Test Database:"
echo "   PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At psql -h 10.0.0.10 -p 25432 -U postgres -d aurora_unified -c \"SELECT NOW();\""
echo ""
echo "🔥 Ready to connect to the empire!"

