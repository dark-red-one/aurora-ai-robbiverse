#!/bin/bash
# Setup Aurora Town as VPN Gateway for Robbieverse Empire
# Run this script ON Aurora Town as root
set -e

echo "🏛️  Setting up Aurora Town as VPN Gateway (10.0.0.10)"

# Install WireGuard if not present
if ! command -v wg &> /dev/null; then
    echo "Installing WireGuard..."
    apt update && apt install -y wireguard iptables-persistent
fi

# Generate keys if they don't exist
if [ ! -f /etc/wireguard/privatekey ]; then
    echo "Generating new WireGuard keys..."
    wg genkey | tee /etc/wireguard/privatekey | wg pubkey > /etc/wireguard/publickey
    chmod 600 /etc/wireguard/privatekey
fi

# Get public key
AURORA_PUBLIC_KEY=$(cat /etc/wireguard/publickey)
echo "✅ Aurora Town Public Key: $AURORA_PUBLIC_KEY"

# Vengeance public key
VENGEANCE_PUBLIC_KEY="yhElEJAdYy3IMa/j27Ui+xy3RrS6PpPYEQImz2SkODQ="

# Create WireGuard config
PRIVATE_KEY=$(cat /etc/wireguard/privatekey)
cat > /etc/wireguard/wg0.conf << EOF
[Interface]
PrivateKey = ${PRIVATE_KEY}
Address = 10.0.0.10/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Vengeance
[Peer]
PublicKey = ${VENGEANCE_PUBLIC_KEY}
AllowedIPs = 10.0.0.2/32

# RobbieBook1 (will be added later)
#[Peer]
#PublicKey = ROBBIEBOOK1_PUBLIC_KEY
#AllowedIPs = 10.0.0.100/32
EOF

chmod 600 /etc/wireguard/wg0.conf

# Enable IP forwarding
if ! grep -q "net.ipv4.ip_forward = 1" /etc/sysctl.conf; then
    echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf
fi
sysctl -p

# Open firewall for WireGuard
ufw allow 51820/udp || echo "UFW not active or already configured"

# Stop any existing WireGuard interface
systemctl stop wg-quick@wg0 2>/dev/null || true

# Start WireGuard
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

# Show status
wg show

echo ""
echo "✅ Aurora Town VPN Gateway configured!"
echo "📊 Status: $(systemctl is-active wg-quick@wg0)"
echo "🔑 Public Key for other nodes: $AURORA_PUBLIC_KEY"
echo ""
echo "📋 SAVE THIS PUBLIC KEY - You'll need it for Vengeance and RobbieBook1!"
echo ""

