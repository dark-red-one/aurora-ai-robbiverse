#!/bin/bash
# Get RobbieBook1's public key for VPN setup

echo "🔥 Getting RobbieBook1's public key for VPN mesh setup! 💋"
echo ""

# Try to find RobbieBook1 on the network
echo "🔍 Scanning for RobbieBook1 on network..."
nmap -sn 192.168.1.0/24 2>/dev/null | grep -E "(Nmap scan report|MAC Address)" | head -20

echo ""
echo "📱 RobbieBook1 Setup Instructions:"
echo "=================================="
echo ""
echo "On RobbieBook1, run these commands:"
echo ""
echo "1. Generate WireGuard keypair:"
echo "   wg genkey | tee robbiebook1-private.key | wg pubkey > robbiebook1-public.key"
echo ""
echo "2. Create the public key file:"
echo "   echo \"ROBBIEBOOK1_PUBLIC_KEY=\" > robbiebook1.key"
echo "   cat robbiebook1-public.key >> robbiebook1.key"
echo ""
echo "3. Push to GitHub:"
echo "   git add robbiebook1.key"
echo "   git commit -m \"Add RobbieBook1 public key for VPN\""
echo "   git push origin main"
echo ""
echo "4. Get your current IP:"
echo "   ifconfig | grep inet"
echo ""
echo "Then I'll add you to the Aurora VPN gateway! 🚀"
