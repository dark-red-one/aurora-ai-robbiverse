#!/bin/bash

echo "🔒 Aurora VPN Connection Script"
echo "================================"

# Check if openvpn is available
if command -v openvpn &> /dev/null; then
    echo "✅ OpenVPN found, connecting to Aurora..."
    sudo openvpn --config aurora-client.ovpn
elif command -v tunnelblick &> /dev/null; then
    echo "✅ Tunnelblick found, opening Aurora config..."
    open aurora-client.ovpn
else
    echo "❌ No OpenVPN client found!"
    echo ""
    echo "Please install one of these:"
    echo "1. Tunnelblick: https://tunnelblick.net/"
    echo "2. OpenVPN Connect: https://openvpn.net/downloads/"
    echo ""
    echo "Then run this script again or manually import aurora-client.ovpn"
    echo ""
    echo "Once connected, you can access:"
    echo "• Aurora API: http://10.8.0.1:8000/health"
    echo "• Aurora Web: http://10.8.0.1:8001"
    echo "• SSH: ssh root@10.8.0.1"
fi
