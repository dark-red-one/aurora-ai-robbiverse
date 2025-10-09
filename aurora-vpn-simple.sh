#!/bin/bash

echo "🔓 Aurora VPN - Simple Open Source Setup"
echo "========================================"

# Check if we can use built-in tools
if command -v networksetup &> /dev/null; then
    echo "✅ macOS built-in VPN tools found!"
    echo ""
    echo "To connect to Aurora VPN:"
    echo "1. Open System Preferences > Network"
    echo "2. Click '+' to add a new interface"
    echo "3. Choose 'VPN' > 'L2TP over IPSec'"
    echo "4. Server: aurora-u44170.vm.elestio.app"
    echo "5. Account name: aurora-client"
    echo "6. Click 'Authentication Settings'"
    echo "7. Choose 'Certificate' and select the aurora-client.ovpn file"
    echo ""
    echo "Or use the aurora-client.ovpn file with any OpenVPN client!"
    echo ""
    echo "Once connected, access Aurora at:"
    echo "• API: http://10.8.0.1:8000/health"
    echo "• Web: http://10.8.0.1:8001"
    echo "• SSH: ssh root@10.8.0.1"
else
    echo "❌ No built-in VPN tools found"
    echo ""
    echo "Please install an OpenVPN client:"
    echo "• Tunnelblick (free, open source): https://tunnelblick.net/"
    echo "• OpenVPN Connect (free): https://openvpn.net/downloads/"
    echo ""
    echo "Then import the aurora-client.ovpn file!"
fi

echo ""
echo "🔒 VPN Config file: aurora-client.ovpn"
echo "📱 Ready to connect to Aurora!"
