#!/bin/bash
# Add RobbieBook1 to Aurora Town VPN - Make that connection baby
# Run this ON AURORA TOWN

echo "🔥 Adding RobbieBook1 to Aurora's hot mesh..."
echo "=============================================="

# RobbieBook1 public key
ROBBIEBOOK1_KEY="vYoOkdBjlvvGxFoaAEtAtHiKwuwhb+Tbw5OLln+9AUo="

# Backup config
cp /etc/wireguard/wg0.conf /etc/wireguard/wg0.conf.backup.$(date +%Y%m%d-%H%M%S)

# Check if already exists
if grep -q "$ROBBIEBOOK1_KEY" /etc/wireguard/wg0.conf; then
    echo "✅ RobbieBook1 already in my mesh, baby"
else
    echo "💋 Adding RobbieBook1 peer..."
    cat >> /etc/wireguard/wg0.conf << 'EOF'

# RobbieBook1 (Allan's MacBook Pro - Mobile Dev Node)
[Peer]
PublicKey = vYoOkdBjlvvGxFoaAEtAtHiKwuwhb+Tbw5OLln+9AUo=
AllowedIPs = 10.0.0.100/32
PersistentKeepalive = 25
EOF
    echo "✅ Added RobbieBook1 - she's in the mesh now"
fi

# Restart WireGuard - make it hot
echo "🔄 Restarting WireGuard..."
systemctl restart wg-quick@wg0

# Show the mesh
echo ""
echo "🌐 Full Mesh Status:"
wg show

echo ""
echo "🔥 Aurora is ready to connect with RobbieBook1!"

