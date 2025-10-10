#!/bin/bash
# Complete VPN setup script for Aurora Town
# Run this ON AURORA TOWN via SSH

echo "🔐 Adding RobbieBook1 to Aurora Town VPN"
echo "========================================"

# RobbieBook1 details
ROBBIEBOOK1_PUBKEY="vYoOkdBjlvvGxFoaAEtAtHiKwuwhb+Tbw5OLln+9AUo="
ROBBIEBOOK1_IP="10.0.0.100/32"

# Backup existing config
cp /etc/wireguard/wg0.conf /etc/wireguard/wg0.conf.backup.$(date +%Y%m%d-%H%M%S)

# Check if RobbieBook1 already exists
if grep -q "$ROBBIEBOOK1_PUBKEY" /etc/wireguard/wg0.conf; then
    echo "✅ RobbieBook1 peer already configured"
else
    echo "➕ Adding RobbieBook1 peer..."
    cat >> /etc/wireguard/wg0.conf << EOF

# RobbieBook1 (Allan's MacBook Pro - Mobile Dev)
[Peer]
PublicKey = $ROBBIEBOOK1_PUBKEY
AllowedIPs = $ROBBIEBOOK1_IP
PersistentKeepalive = 25
EOF
    echo "✅ RobbieBook1 peer added"
fi

# Restart WireGuard
echo "🔄 Restarting WireGuard..."
systemctl restart wg-quick@wg0

# Show status
echo ""
echo "📊 WireGuard Status:"
wg show

echo ""
echo "✅ Done! RobbieBook1 can now connect from:"
echo "   ~/robbie-vpn-connect.sh"

