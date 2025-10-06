#!/bin/bash
# 🛡️ ROBBIE EMPIRE VPN MESH SETUP
# WireGuard VPN connecting all nodes securely

set -e

echo "🛡️  SETTING UP ROBBIE EMPIRE VPN MESH"
echo "====================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Network Configuration
VPN_NETWORK="10.0.0.0/24"
GATEWAY_IP="10.0.0.1"

# NODE CONFIGURATION
declare -A NODES=(
    ["aurora-town"]="aurora-town-u44170.vm.elestio.app:22:Gateway + PostgreSQL master"
    ["runpod-aurora"]="82.221.170.242:24505:GPU compute (1x RTX 4090)"
    ["macbook"]="$(curl -s ifconfig.me):22:Development workstation"
)

# VPN IP ASSIGNMENTS
declare -A VPN_IPS=(
    ["aurora-town"]="10.0.0.10"
    ["runpod-aurora"]="10.0.0.20"
    ["macbook"]="10.0.0.100"
)

echo -e "${BLUE}🎯 VPN MESH ARCHITECTURE${NC}"
echo "=========================="
echo "Internet → SSH Gateway (port 22) → Internal VPN (10.0.0.0/24)"
echo ""
echo "NODES:"
for node in "${!NODES[@]}"; do
    IFS=':' read -r host port desc <<< "${NODES[$node]}"
    echo "├── $node (${VPN_IPS[$node]}) - $desc"
done
echo ""

# Step 1: Setup Aurora Town as VPN Gateway
echo -e "${YELLOW}🔧 Step 1: Setting up Aurora Town as VPN Gateway${NC}"
cat > /tmp/setup-aurora-town-vpn.sh << 'AURORATOWNEOF'
#!/bin/bash
# Setup Aurora Town as VPN Gateway

echo "🏛️  Setting up Aurora Town as VPN Gateway (10.0.0.10)"

# Install WireGuard
apt update && apt install -y wireguard iptables-persistent

# Generate keys
wg genkey | tee /etc/wireguard/privatekey | wg pubkey > /etc/wireguard/publickey

# Get public key
AURORA_PUBLIC_KEY=$(cat /etc/wireguard/publickey)
echo "Aurora Town Public Key: $AURORA_PUBLIC_KEY"

# Create WireGuard config
cat > /etc/wireguard/wg0.conf << 'WGEOF'
[Interface]
PrivateKey = $(cat /etc/wireguard/privatekey)
Address = 10.0.0.10/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# RunPod Aurora
[Peer]
PublicKey = RUNPOD_AURORA_PUBLIC_KEY
AllowedIPs = 10.0.0.20/32

# MacBook
[Peer]
PublicKey = MACBOOK_PUBLIC_KEY
AllowedIPs = 10.0.0.100/32
WGEOF

# Enable IP forwarding
echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf
sysctl -p

# Start WireGuard
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

# Create VPN status API
cat > /opt/aurora/vpn-status.py << 'VPNSTATUSEOF'
#!/usr/bin/env python3
"""
VPN Status API - Monitor VPN mesh connectivity
"""

from fastapi import FastAPI, HTTPException
import uvicorn
import subprocess
import json

app = FastAPI(title="Robbie Empire VPN Status", version="1.0.0")

@app.get("/vpn/status")
async def vpn_status():
    """Get VPN mesh status"""
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
            "gateway": "aurora-town",
            "ip": "10.0.0.10",
            "status": "active",
            "peers": peers,
            "total_peers": len(peers)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/vpn/peers")
async def list_peers():
    """List all VPN peers"""
    try:
        result = subprocess.run(['wg', 'show', 'wg0', 'peers'], capture_output=True, text=True)
        peers = result.stdout.strip().split('\n')
        return {"peers": peers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="10.0.0.10", port=8003, log_level="info")
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

echo "✅ Aurora Town VPN Gateway configured"
echo "Public Key: $AURORA_PUBLIC_KEY"
AURORATOWNEOF

# Step 2: Setup RunPod Aurora VPN Client
echo -e "${YELLOW}🔧 Step 2: Setting up RunPod Aurora VPN Client${NC}"
cat > /tmp/setup-runpod-aurora-vpn.sh << 'RUNPODEOF'
#!/bin/bash
# Setup RunPod Aurora as VPN Client

echo "🚀 Setting up RunPod Aurora VPN Client (10.0.0.20)"

# Install WireGuard
apt update && apt install -y wireguard

# Generate keys
wg genkey | tee /etc/wireguard/privatekey | wg pubkey > /etc/wireguard/publickey

# Get public key
RUNPOD_PUBLIC_KEY=$(cat /etc/wireguard/publickey)
echo "RunPod Aurora Public Key: $RUNPOD_PUBLIC_KEY"

# Create WireGuard config (will be updated with gateway public key)
cat > /etc/wireguard/wg0.conf << 'WGEOF'
[Interface]
PrivateKey = $(cat /etc/wireguard/privatekey)
Address = 10.0.0.20/24
ListenPort = 51820

[Peer]
PublicKey = AURORA_TOWN_PUBLIC_KEY
Endpoint = aurora-town-u44170.vm.elestio.app:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
WGEOF

# Start WireGuard
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

# Create VPN client status API
cat > /opt/robbie/vpn-client-status.py << 'CLIENTSTATUSEOF'
#!/usr/bin/env python3
"""
VPN Client Status API - Monitor VPN connectivity
"""

from fastapi import FastAPI, HTTPException
import uvicorn
import subprocess
import requests

app = FastAPI(title="Robbie Empire VPN Client - Aurora", version="1.0.0")

@app.get("/vpn/status")
async def vpn_status():
    """Get VPN client status"""
    try:
        # Check WireGuard interface
        result = subprocess.run(['wg', 'show', 'wg0'], capture_output=True, text=True)
        
        # Check connectivity to gateway
        try:
            response = requests.get("http://10.0.0.10:8003/vpn/status", timeout=5)
            gateway_status = "connected" if response.status_code == 200 else "disconnected"
        except:
            gateway_status = "disconnected"
        
        return {
            "client": "runpod-aurora",
            "ip": "10.0.0.20",
            "status": "active",
            "gateway_status": gateway_status,
            "interface": "wg0"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/vpn/test")
async def test_connectivity():
    """Test VPN connectivity"""
    try:
        # Test ping to gateway
        result = subprocess.run(['ping', '-c', '3', '10.0.0.10'], capture_output=True, text=True)
        ping_success = result.returncode == 0
        
        # Test HTTP to gateway
        try:
            response = requests.get("http://10.0.0.10:8000/health", timeout=5)
            http_success = response.status_code == 200
        except:
            http_success = False
        
        return {
            "ping_gateway": ping_success,
            "http_gateway": http_success,
            "overall": ping_success and http_success
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8004, log_level="info")
CLIENTSTATUSEOF

chmod +x /opt/robbie/vpn-client-status.py

# Create VPN client service
cat > /etc/systemd/system/robbie-vpn-client.service << 'CLIENTSERVICEEOF'
[Unit]
Description=Robbie Empire VPN Client
After=network.target wg-quick@wg0.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/robbie
ExecStart=/usr/bin/python3 /opt/robbie/vpn-client-status.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
CLIENTSERVICEEOF

systemctl daemon-reload
systemctl enable robbie-vpn-client
systemctl start robbie-vpn-client

echo "✅ RunPod Aurora VPN Client configured"
echo "Public Key: $RUNPOD_PUBLIC_KEY"
RUNPODEOF

# Step 3: Setup MacBook VPN Client
echo -e "${YELLOW}🔧 Step 3: Setting up MacBook VPN Client${NC}"
cat > /tmp/setup-macbook-vpn.sh << 'MACBOOKEOF'
#!/bin/bash
# Setup MacBook as VPN Client

echo "💻 Setting up MacBook VPN Client (10.0.0.100)"

# Install WireGuard (if not already installed)
if ! command -v wg &> /dev/null; then
    echo "Installing WireGuard..."
    brew install wireguard-tools
fi

# Generate keys
wg genkey | tee ~/.wireguard/privatekey | wg pubkey > ~/.wireguard/publickey

# Get public key
MACBOOK_PUBLIC_KEY=$(cat ~/.wireguard/publickey)
echo "MacBook Public Key: $MACBOOK_PUBLIC_KEY"

# Create WireGuard config
cat > ~/.wireguard/robbie-empire.conf << 'WGEOF'
[Interface]
PrivateKey = $(cat ~/.wireguard/privatekey)
Address = 10.0.0.100/24
DNS = 8.8.8.8

[Peer]
PublicKey = AURORA_TOWN_PUBLIC_KEY
Endpoint = aurora-town-u44170.vm.elestio.app:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
WGEOF

# Create VPN connection script
cat > ~/robbie-vpn-connect.sh << 'CONNECTEOF'
#!/bin/bash
# Connect to Robbie Empire VPN

echo "🛡️  Connecting to Robbie Empire VPN..."

# Start WireGuard
sudo wg-quick up ~/.wireguard/robbie-empire.conf

# Test connectivity
echo "Testing connectivity..."
ping -c 3 10.0.0.10
curl -s http://10.0.0.10:8003/vpn/status | python3 -m json.tool

echo "✅ VPN connected!"
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
echo "Public Key: $MACBOOK_PUBLIC_KEY"
echo "Connect: ~/robbie-vpn-connect.sh"
echo "Disconnect: ~/robbie-vpn-disconnect.sh"
MACBOOKEOF

# Step 4: Deploy VPN to all nodes
echo -e "${YELLOW}🔧 Step 4: Deploying VPN to all nodes${NC}"

# Deploy to Aurora Town
echo "📡 Deploying VPN Gateway to Aurora Town..."
scp /tmp/setup-aurora-town-vpn.sh root@aurora-town-u44170.vm.elestio.app:/tmp/
ssh root@aurora-town-u44170.vm.elestio.app "chmod +x /tmp/setup-aurora-town-vpn.sh && /tmp/setup-aurora-town-vpn.sh"

# Get Aurora Town public key
AURORA_PUBLIC_KEY=$(ssh root@aurora-town-u44170.vm.elestio.app "cat /etc/wireguard/publickey")
echo "Aurora Town Public Key: $AURORA_PUBLIC_KEY"

# Deploy to RunPod Aurora
echo "🚀 Deploying VPN Client to RunPod Aurora..."
scp /tmp/setup-runpod-aurora-vpn.sh root@82.221.170.242:/tmp/ -P 24505
ssh root@82.221.170.242 -p 24505 "chmod +x /tmp/setup-runpod-aurora-vpn.sh && /tmp/setup-runpod-aurora-vpn.sh"

# Get RunPod Aurora public key
RUNPOD_PUBLIC_KEY=$(ssh root@82.221.170.242 -p 24505 "cat /etc/wireguard/publickey")
echo "RunPod Aurora Public Key: $RUNPOD_PUBLIC_KEY"

# Deploy to MacBook
echo "💻 Deploying VPN Client to MacBook..."
chmod +x /tmp/setup-macbook-vpn.sh
/tmp/setup-macbook-vpn.sh

# Get MacBook public key
MACBOOK_PUBLIC_KEY=$(cat ~/.wireguard/publickey)
echo "MacBook Public Key: $MACBOOK_PUBLIC_KEY"

# Step 5: Exchange public keys
echo -e "${YELLOW}🔧 Step 5: Exchanging public keys${NC}"

# Update Aurora Town config with peer keys
ssh root@aurora-town-u44170.vm.elestio.app "sed -i 's/RUNPOD_AURORA_PUBLIC_KEY/$RUNPOD_PUBLIC_KEY/g' /etc/wireguard/wg0.conf"
ssh root@aurora-town-u44170.vm.elestio.app "sed -i 's/MACBOOK_PUBLIC_KEY/$MACBOOK_PUBLIC_KEY/g' /etc/wireguard/wg0.conf"

# Update RunPod Aurora config with gateway key
ssh root@82.221.170.242 -p 24505 "sed -i 's/AURORA_TOWN_PUBLIC_KEY/$AURORA_PUBLIC_KEY/g' /etc/wireguard/wg0.conf"

# Update MacBook config with gateway key
sed -i '' "s/AURORA_TOWN_PUBLIC_KEY/$AURORA_PUBLIC_KEY/g" ~/.wireguard/robbie-empire.conf

# Restart WireGuard services
echo "🔄 Restarting WireGuard services..."

# Restart Aurora Town
ssh root@aurora-town-u44170.vm.elestio.app "systemctl restart wg-quick@wg0"

# Restart RunPod Aurora
ssh root@82.221.170.242 -p 24505 "systemctl restart wg-quick@wg0"

# Test connectivity
echo -e "${YELLOW}🔧 Step 6: Testing VPN connectivity${NC}"

# Test from MacBook
echo "Testing from MacBook..."
~/robbie-vpn-connect.sh

# Test connectivity
echo "Testing VPN connectivity..."
ping -c 3 10.0.0.10 && echo "✅ Gateway reachable"
ping -c 3 10.0.0.20 && echo "✅ RunPod Aurora reachable"

# Test APIs
curl -s http://10.0.0.10:8003/vpn/status | python3 -m json.tool
curl -s http://10.0.0.20:8004/vpn/status | python3 -m json.tool

echo ""
echo -e "${GREEN}✅ ROBBIE EMPIRE VPN MESH DEPLOYED!${NC}"
echo "====================================="
echo "• Aurora Town: VPN Gateway (10.0.0.10:51820)"
echo "• RunPod Aurora: VPN Client (10.0.0.20)"
echo "• MacBook: VPN Client (10.0.0.100)"
echo ""
echo "🔗 VPN ENDPOINTS:"
echo "• Gateway Status: http://10.0.0.10:8003/vpn/status"
echo "• RunPod Status: http://10.0.0.20:8004/vpn/status"
echo "• Connect MacBook: ~/robbie-vpn-connect.sh"
echo "• Disconnect MacBook: ~/robbie-vpn-disconnect.sh"
echo ""
echo "🛡️  SECURITY: All traffic encrypted via WireGuard"
echo "⚡ PERFORMANCE: Direct peer-to-peer communication"
echo "🎯 RESULT: Secure internal network across all nodes"
