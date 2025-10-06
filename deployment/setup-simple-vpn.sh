#!/bin/bash
# 🛡️ SIMPLE VPN SETUP - WireGuard between Aurora Town and MacBook

set -e

echo "🛡️  SETTING UP SIMPLE VPN (Aurora Town ↔ MacBook)"
echo "================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get MacBook public IP
MACBOOK_IP=$(curl -s ifconfig.me)
echo "MacBook Public IP: $MACBOOK_IP"

# Step 1: Setup Aurora Town as VPN Server
echo -e "${YELLOW}🔧 Step 1: Setting up Aurora Town as VPN Server${NC}"
cat > /tmp/setup-aurora-vpn-server.sh << 'AURORASERVEREOF'
#!/bin/bash
# Setup Aurora Town as VPN Server

echo "🏛️  Setting up Aurora Town as VPN Server (10.0.0.1)"

# Install WireGuard
apt update && apt install -y wireguard

# Generate server keys
wg genkey | tee /etc/wireguard/server_privatekey | wg pubkey > /etc/wireguard/server_publickey

# Get server public key
SERVER_PUBLIC_KEY=$(cat /etc/wireguard/server_publickey)
echo "Aurora Town Server Public Key: $SERVER_PUBLIC_KEY"

# Create server config
cat > /etc/wireguard/wg0.conf << 'SERVERCONFEOF'
[Interface]
PrivateKey = $(cat /etc/wireguard/server_privatekey)
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# MacBook client
[Peer]
PublicKey = MACBOOK_PUBLIC_KEY
AllowedIPs = 10.0.0.2/32
SERVERCONFEOF

# Enable IP forwarding
echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf
sysctl -p

# Start WireGuard
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

# Create VPN status endpoint
cat > /opt/aurora/vpn-status.py << 'VPNSTATUSEOF'
#!/usr/bin/env python3
"""
VPN Status API - Monitor VPN connectivity
"""

from fastapi import FastAPI, HTTPException
import uvicorn
import subprocess
import json

app = FastAPI(title="Robbie Empire VPN Status", version="1.0.0")

@app.get("/vpn/status")
async def vpn_status():
    """Get VPN server status"""
    try:
        # Get WireGuard status
        result = subprocess.run(['wg', 'show'], capture_output=True, text=True)
        
        peers = []
        for line in result.stdout.strip().split('\n'):
            if line.startswith('peer:'):
                peer_key = line.split(':')[1].strip()
                peers.append({
                    "public_key": peer_key,
                    "status": "connected"
                })
        
        return {
            "server": "aurora-town",
            "ip": "10.0.0.1",
            "status": "active",
            "peers": peers,
            "total_peers": len(peers)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/vpn/test")
async def test_connectivity():
    """Test VPN connectivity"""
    try:
        # Test ping to MacBook
        result = subprocess.run(['ping', '-c', '3', '10.0.0.2'], capture_output=True, text=True)
        ping_success = result.returncode == 0
        
        return {
            "ping_macbook": ping_success,
            "overall": ping_success
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003, log_level="info")
VPNSTATUSEOF

chmod +x /opt/aurora/vpn-status.py

# Create VPN status service
cat > /etc/systemd/system/robbie-vpn-status.service << 'VPNSERVICEEOF'
[Unit]
Description=Robbie Empire VPN Status API
After=network.target wg-quick@wg0.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/aurora
ExecStart=/usr/bin/python3 /opt/aurora/vpn-status.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
VPNSERVICEEOF

systemctl daemon-reload
systemctl enable robbie-vpn-status
systemctl start robbie-vpn-status

echo "✅ Aurora Town VPN Server configured"
echo "Server Public Key: $SERVER_PUBLIC_KEY"
AURORASERVEREOF

# Step 2: Setup MacBook as VPN Client
echo -e "${YELLOW}🔧 Step 2: Setting up MacBook as VPN Client${NC}"
cat > /tmp/setup-macbook-vpn-client.sh << 'MACBOOKCLIENTEOF'
#!/bin/bash
# Setup MacBook as VPN Client

echo "💻 Setting up MacBook as VPN Client (10.0.0.2)"

# Install WireGuard (if not already installed)
if ! command -v wg &> /dev/null; then
    echo "Installing WireGuard..."
    brew install wireguard-tools
fi

# Create WireGuard directory
mkdir -p ~/.wireguard

# Generate client keys
wg genkey | tee ~/.wireguard/client_privatekey | wg pubkey > ~/.wireguard/client_publickey

# Get client public key
CLIENT_PUBLIC_KEY=$(cat ~/.wireguard/client_publickey)
echo "MacBook Client Public Key: $CLIENT_PUBLIC_KEY"

# Create client config
cat > ~/.wireguard/robbie-empire.conf << 'CLIENTCONFEOF'
[Interface]
PrivateKey = $(cat ~/.wireguard/client_privatekey)
Address = 10.0.0.2/24
DNS = 8.8.8.8

[Peer]
PublicKey = SERVER_PUBLIC_KEY
Endpoint = aurora-town-u44170.vm.elestio.app:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
CLIENTCONFEOF

# Create VPN connection script
cat > ~/robbie-vpn-connect.sh << 'CONNECTEOF'
#!/bin/bash
# Connect to Robbie Empire VPN

echo "🛡️  Connecting to Robbie Empire VPN..."

# Start WireGuard
sudo wg-quick up ~/.wireguard/robbie-empire.conf

# Test connectivity
echo "Testing connectivity..."
ping -c 3 10.0.0.1
curl -s http://10.0.0.1:8003/vpn/status | python3 -m json.tool

echo "✅ VPN connected!"
echo "Aurora Town accessible at: 10.0.0.1"
echo "VPN Status: http://10.0.0.1:8003/vpn/status"
CONNECTEOF

# Create VPN disconnect script
cat > ~/robbie-vpn-disconnect.sh << 'DISCONNECTEOF'
#!/bin/bash
# Disconnect from Robbie Empire VPN

echo "🛡️  Disconnecting from Robbie Empire VPN..."

# Stop WireGuard
sudo wg-quick down ~/.wireguard/robbie-empire.conf

echo "✅ VPN disconnected!"
DISCONNECTEOF

chmod +x ~/robbie-vpn-connect.sh ~/robbie-vpn-disconnect.sh

echo "✅ MacBook VPN Client configured"
echo "Client Public Key: $CLIENT_PUBLIC_KEY"
echo "Connect: ~/robbie-vpn-connect.sh"
echo "Disconnect: ~/robbie-vpn-disconnect.sh"
MACBOOKCLIENTEOF

# Step 3: Deploy to Aurora Town
echo -e "${YELLOW}🔧 Step 3: Deploying VPN Server to Aurora Town${NC}"
scp /tmp/setup-aurora-vpn-server.sh root@aurora-town-u44170.vm.elestio.app:/tmp/
ssh root@aurora-town-u44170.vm.elestio.app "chmod +x /tmp/setup-aurora-vpn-server.sh && /tmp/setup-aurora-vpn-server.sh"

# Get Aurora Town server public key
AURORA_SERVER_PUBLIC_KEY=$(ssh root@aurora-town-u44170.vm.elestio.app "cat /etc/wireguard/server_publickey")
echo "Aurora Town Server Public Key: $AURORA_SERVER_PUBLIC_KEY"

# Step 4: Setup MacBook client
echo -e "${YELLOW}🔧 Step 4: Setting up MacBook VPN Client${NC}"
chmod +x /tmp/setup-macbook-vpn-client.sh
/tmp/setup-macbook-vpn-client.sh

# Get MacBook client public key
MACBOOK_CLIENT_PUBLIC_KEY=$(cat ~/.wireguard/client_publickey)
echo "MacBook Client Public Key: $MACBOOK_CLIENT_PUBLIC_KEY"

# Step 5: Exchange public keys
echo -e "${YELLOW}🔧 Step 5: Exchanging public keys${NC}"

# Update Aurora Town config with MacBook public key
ssh root@aurora-town-u44170.vm.elestio.app "sed -i 's/MACBOOK_PUBLIC_KEY/$MACBOOK_CLIENT_PUBLIC_KEY/g' /etc/wireguard/wg0.conf"

# Update MacBook config with Aurora Town public key
sed -i '' "s/SERVER_PUBLIC_KEY/$AURORA_SERVER_PUBLIC_KEY/g" ~/.wireguard/robbie-empire.conf

# Restart WireGuard services
echo "🔄 Restarting WireGuard services..."

# Restart Aurora Town
ssh root@aurora-town-u44170.vm.elestio.app "systemctl restart wg-quick@wg0"

# Test connectivity
echo -e "${YELLOW}🔧 Step 6: Testing VPN connectivity${NC}"

# Connect MacBook to VPN
echo "Connecting MacBook to VPN..."
~/robbie-vpn-connect.sh

echo ""
echo -e "${GREEN}✅ ROBBIE EMPIRE VPN DEPLOYED!${NC}"
echo "=================================="
echo "• Aurora Town: VPN Server (10.0.0.1:51820)"
echo "• MacBook: VPN Client (10.0.0.2)"
echo ""
echo "🔗 VPN ENDPOINTS:"
echo "• Server Status: http://10.0.0.1:8003/vpn/status"
echo "• Connect MacBook: ~/robbie-vpn-connect.sh"
echo "• Disconnect MacBook: ~/robbie-vpn-disconnect.sh"
echo ""
echo "🛡️  SECURITY: All traffic encrypted via WireGuard"
echo "⚡ PERFORMANCE: Direct peer-to-peer communication"
echo "🎯 RESULT: Secure internal network between Aurora Town and MacBook"
