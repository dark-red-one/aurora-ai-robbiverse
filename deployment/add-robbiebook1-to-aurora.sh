#!/bin/bash
# Add RobbieBook1 to Aurora Town VPN Gateway
# Run this ON Aurora Town

ROBBIEBOOK1_PUBLIC_KEY="vYoOkdBjlvvGxFoaAEtAtHiKwuwhb+Tbw5OLln+9AUo="

echo "💻 Adding RobbieBook1 to Aurora Town VPN..."

# Backup existing config
cp /etc/wireguard/wg0.conf /etc/wireguard/wg0.conf.backup

# Add RobbieBook1 peer
cat >> /etc/wireguard/wg0.conf << EOF

# RobbieBook1 (MacBook Pro)
[Peer]
PublicKey = ${ROBBIEBOOK1_PUBLIC_KEY}
AllowedIPs = 10.0.0.100/32
EOF

echo "✅ RobbieBook1 added to config"

# Restart WireGuard
systemctl restart wg-quick@wg0

# Show status
wg show

echo ""
echo "✅ RobbieBook1 added to empire VPN!"
echo "🔑 Public Key: $ROBBIEBOOK1_PUBLIC_KEY"

