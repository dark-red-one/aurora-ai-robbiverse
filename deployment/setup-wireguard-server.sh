#!/bin/bash
# Setup WireGuard VPN Server on Aurora Town
# Creates secure 10.0.0.0/24 network for internal access

set -e

echo "🔐 Setting up WireGuard VPN Server on Aurora Town"
echo "=================================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (sudo)"
    exit 1
fi

# Install WireGuard (already installed based on earlier session)
echo "✅ WireGuard already installed"

# Generate server keys if they don't exist
if [ ! -f /etc/wireguard/server_private.key ]; then
    echo "🔑 Generating server keys..."
    wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
    chmod 600 /etc/wireguard/server_private.key
    chmod 644 /etc/wireguard/server_public.key
    echo "✅ Server keys generated"
else
    echo "✅ Server keys already exist"
fi

SERVER_PRIVATE_KEY=$(cat /etc/wireguard/server_private.key)
SERVER_PUBLIC_KEY=$(cat /etc/wireguard/server_public.key)

echo ""
echo "📋 Server Public Key (share with clients):"
echo "$SERVER_PUBLIC_KEY"
echo ""

# Create WireGuard server configuration
echo "📝 Creating WireGuard server configuration..."
cat > /etc/wireguard/wg0.conf << EOF
[Interface]
PrivateKey = $SERVER_PRIVATE_KEY
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Client: RobbieBook1 (Allan's MacBook)
[Peer]
PublicKey = PLACEHOLDER_ROBBIEBOOK1_PUBLIC_KEY
AllowedIPs = 10.0.0.2/32
PersistentKeepalive = 25

# Client: Vengeance (Gaming/Dev Machine)
[Peer]
PublicKey = PLACEHOLDER_VENGEANCE_PUBLIC_KEY
AllowedIPs = 10.0.0.3/32
PersistentKeepalive = 25

# Client: Mobile Devices
[Peer]
PublicKey = PLACEHOLDER_MOBILE_PUBLIC_KEY
AllowedIPs = 10.0.0.4/32
PersistentKeepalive = 25
EOF

chmod 600 /etc/wireguard/wg0.conf
echo "✅ Server configuration created"

# Enable IP forwarding
echo "🔄 Enabling IP forwarding..."
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
sysctl -p
echo "✅ IP forwarding enabled"

# Configure UFW for WireGuard
echo "🔥 Configuring firewall for WireGuard..."
ufw allow 51820/udp comment 'WireGuard VPN'
echo "✅ Firewall configured"

# Enable and start WireGuard
echo "🚀 Starting WireGuard service..."
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0
echo "✅ WireGuard service started"

# Check status
echo ""
echo "📊 WireGuard Status:"
wg show

echo ""
echo "✅ WireGuard VPN Server Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Run './wireguard-add-client.sh robbiebook1' to generate RobbieBook1 config"
echo "2. Run './wireguard-add-client.sh vengeance' to generate Vengeance config"
echo "3. Run './wireguard-add-client.sh mobile' to generate mobile config"
echo ""
echo "🌐 Server endpoint: 8.17.147.158:51820"
echo "🔑 Server public key: $SERVER_PUBLIC_KEY"

