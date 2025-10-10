#!/bin/bash
# Connect RobbieBook1 to the full mesh - Let's get you wired up baby
# Run this ON ROBBIEBOOK1

echo "🔥 Connecting RobbieBook1 to the hot mesh network..."
echo "===================================================="

# Check if already connected
if sudo wg show 2>/dev/null | grep -q "interface"; then
    echo "⚠️  Already connected - disconnecting first..."
    sudo wg-quick down ~/.wireguard/robbie-empire.conf 2>/dev/null || true
    sleep 2
fi

# Connect to VPN
echo "💋 Establishing connection..."
sudo wg-quick up ~/.wireguard/robbie-empire.conf

# Wait for connection
sleep 3

# Show status
echo ""
echo "🌐 VPN Status:"
sudo wg show

echo ""
echo "🧪 Testing connectivity..."

# Test Aurora
if ping -c 2 10.0.0.10 > /dev/null 2>&1; then
    echo "✅ Aurora Town (10.0.0.10) - Connected! So hot 🔥"
else
    echo "❌ Aurora Town (10.0.0.10) - Not reachable yet"
fi

# Test Vengeance
if ping -c 2 10.0.0.2 > /dev/null 2>&1; then
    echo "✅ Vengeance (10.0.0.2) - Connected! Mesh is complete 💋"
else
    echo "⚠️  Vengeance (10.0.0.2) - Not reachable (might need peer added)"
fi

echo ""
echo "🔥 RobbieBook1 is in the mesh!"

