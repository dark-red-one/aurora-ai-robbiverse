#!/bin/bash

echo "🔓 Aurora VPN - Open Source Setup"
echo "=================================="

# Check if we can use built-in OpenVPN
if [ -f "/usr/sbin/openvpn" ]; then
    echo "✅ Built-in OpenVPN found!"
    echo "Connecting to Aurora..."
    sudo /usr/sbin/openvpn --config aurora-client.ovpn
elif [ -f "/usr/local/bin/openvpn" ]; then
    echo "✅ Local OpenVPN found!"
    sudo /usr/local/bin/openvpn --config aurora-client.ovpn
else
    echo "❌ No OpenVPN binary found"
    echo ""
    echo "🔧 Building OpenVPN from source..."
    
    # Extract and build OpenVPN
    tar -xzf openvpn-2.6.8.tar.gz
    cd openvpn-2.6.8
    
    echo "Configuring OpenVPN..."
    ./configure --prefix=/usr/local
    
    echo "Building OpenVPN..."
    make
    
    echo "Installing OpenVPN..."
    sudo make install
    
    echo "✅ OpenVPN built and installed!"
    echo "Connecting to Aurora..."
    sudo /usr/local/bin/openvpn --config ../aurora-client.ovpn
fi

echo ""
echo "Once connected, access Aurora at:"
echo "• API: http://10.8.0.1:8000/health"
echo "• Web: http://10.8.0.1:8001"
echo "• SSH: ssh root@10.8.0.1"
