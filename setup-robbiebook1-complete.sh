#!/bin/bash
# ONE-COMMAND RobbieBook1 VPN Setup - Complete Automation
# Run this on RobbieBook1 and you're done, baby! 💋

set -e

echo "💻 Setting up RobbieBook1 VPN - Fully Automated!"
echo "================================================"
echo ""

# Install WireGuard if needed
if ! command -v wg &> /dev/null; then
    echo "📦 Installing WireGuard..."
    brew install wireguard-tools
fi

# Create .wireguard directory
mkdir -p ~/.wireguard
chmod 700 ~/.wireguard

# Get private key from the file you already created
if [ -f ~/.wireguard/privatekey ]; then
    echo "✅ Using existing private key"
    PRIVATE_KEY=$(cat ~/.wireguard/privatekey)
else
    echo "🔑 Generating new keys..."
    PRIVATE_KEY=$(wg genkey | tee ~/.wireguard/privatekey)
    chmod 600 ~/.wireguard/privatekey
fi

# Create complete VPN config (no placeholders!)
cat > ~/.wireguard/robbie-empire.conf << EOF
[Interface]
PrivateKey = ${PRIVATE_KEY}
Address = 10.0.0.100/24
DNS = 8.8.8.8

[Peer]
PublicKey = xX3nFxiMYRmokn+m6tgCMIkrDv139VU0il0vWDu98kI=
Endpoint = aurora-postgres-u44170.vm.elestio.app:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
EOF

chmod 600 ~/.wireguard/robbie-empire.conf

echo "✅ VPN config created"
echo ""

# Create connect script
cat > ~/robbie-vpn-connect.sh << 'EOF'
#!/bin/bash
echo "🛡️  Connecting to Robbie Empire VPN..."
sudo wg-quick up ~/.wireguard/robbie-empire.conf
echo "🧪 Testing..."
ping -c 3 10.0.0.10 && echo "✅ Aurora Town reachable!"
ping -c 3 10.0.0.2 && echo "✅ Vengeance reachable!"
echo "🐘 Testing Elephant database..."
PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At psql -h 10.0.0.10 -p 25432 -U postgres -d aurora_unified -c "SELECT 'RobbieBook1 connected to Elephant!' as status;" 2>/dev/null && echo "✅ Database accessible!"
EOF

chmod +x ~/robbie-vpn-connect.sh

# Create disconnect script
cat > ~/robbie-vpn-disconnect.sh << 'EOF'
#!/bin/bash
sudo wg-quick down ~/.wireguard/robbie-empire.conf
echo "✅ VPN disconnected"
EOF

chmod +x ~/robbie-vpn-disconnect.sh

echo "✅ Connection scripts created"
echo ""
echo "🎯 SETUP COMPLETE!"
echo "=================="
echo ""
echo "🔑 Your Public Key (for Aurora Town):"
cat ~/.wireguard/publickey
echo ""
echo "🚀 To Connect:"
echo "   ~/robbie-vpn-connect.sh"
echo ""
echo "🛑 To Disconnect:"
echo "   ~/robbie-vpn-disconnect.sh"
echo ""
echo "🔥 Ready to join the empire!"

