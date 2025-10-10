#!/bin/bash
# Add new WireGuard VPN client
# Usage: ./wireguard-add-client.sh <client_name>

set -e

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (sudo)"
    exit 1
fi

if [ -z "$1" ]; then
    echo "Usage: $0 <client_name>"
    echo "Example: $0 robbiebook1"
    exit 1
fi

CLIENT_NAME=$1
CLIENT_DIR="/etc/wireguard/clients"
mkdir -p $CLIENT_DIR

# Assign IP based on client name
case $CLIENT_NAME in
    robbiebook1)
        CLIENT_IP="10.0.0.2"
        ;;
    vengeance)
        CLIENT_IP="10.0.0.3"
        ;;
    mobile)
        CLIENT_IP="10.0.0.4"
        ;;
    *)
        # Auto-assign next available IP
        LAST_IP=$(grep "AllowedIPs" /etc/wireguard/wg0.conf | grep -oP '10\.0\.0\.\d+' | sort -t. -k4 -n | tail -1 | cut -d. -f4)
        NEXT_IP=$((LAST_IP + 1))
        CLIENT_IP="10.0.0.$NEXT_IP"
        ;;
esac

echo "🔐 Adding WireGuard client: $CLIENT_NAME"
echo "📍 Assigned IP: $CLIENT_IP"

# Generate client keys
CLIENT_PRIVATE_KEY=$(wg genkey)
CLIENT_PUBLIC_KEY=$(echo $CLIENT_PRIVATE_KEY | wg pubkey)

# Save keys
echo $CLIENT_PRIVATE_KEY > $CLIENT_DIR/${CLIENT_NAME}_private.key
echo $CLIENT_PUBLIC_KEY > $CLIENT_DIR/${CLIENT_NAME}_public.key
chmod 600 $CLIENT_DIR/${CLIENT_NAME}_private.key

# Get server public key
SERVER_PUBLIC_KEY=$(cat /etc/wireguard/server_public.key)

# Create client configuration
cat > $CLIENT_DIR/${CLIENT_NAME}.conf << EOF
[Interface]
PrivateKey = $CLIENT_PRIVATE_KEY
Address = $CLIENT_IP/24
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = $SERVER_PUBLIC_KEY
Endpoint = 8.17.147.158:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
EOF

echo "✅ Client configuration created: $CLIENT_DIR/${CLIENT_NAME}.conf"

# Add peer to server configuration
echo "📝 Adding peer to server configuration..."

# Create backup
cp /etc/wireguard/wg0.conf /etc/wireguard/wg0.conf.backup

# Check if client already exists
if grep -q "# Client: $CLIENT_NAME" /etc/wireguard/wg0.conf; then
    echo "⚠️  Client $CLIENT_NAME already exists in server config"
    echo "   Updating public key..."
    sed -i "/# Client: $CLIENT_NAME/,/AllowedIPs/c\\
# Client: $CLIENT_NAME\\
[Peer]\\
PublicKey = $CLIENT_PUBLIC_KEY\\
AllowedIPs = $CLIENT_IP/32\\
PersistentKeepalive = 25" /etc/wireguard/wg0.conf
else
    cat >> /etc/wireguard/wg0.conf << EOF

# Client: $CLIENT_NAME
[Peer]
PublicKey = $CLIENT_PUBLIC_KEY
AllowedIPs = $CLIENT_IP/32
PersistentKeepalive = 25
EOF
fi

# Reload WireGuard
echo "🔄 Reloading WireGuard..."
wg syncconf wg0 <(wg-quick strip wg0)

echo ""
echo "✅ Client added successfully!"
echo ""
echo "📋 Client Configuration:"
echo "========================"
cat $CLIENT_DIR/${CLIENT_NAME}.conf
echo ""
echo "📍 Client config saved to: $CLIENT_DIR/${CLIENT_NAME}.conf"
echo ""
echo "🔑 To install on client:"
echo "   1. Copy the configuration to the client machine"
echo "   2. Save as /etc/wireguard/aurora-vpn.conf (or wg0.conf)"
echo "   3. Run: sudo wg-quick up aurora-vpn"
echo "   4. Test: ping 10.0.0.1"

