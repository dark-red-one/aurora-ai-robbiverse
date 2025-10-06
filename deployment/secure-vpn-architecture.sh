#!/bin/bash
# 🛡️ ROBBIE EMPIRE - SECURE VPN-FIRST ARCHITECTURE
# Single entry point, internal network, consolidated services

set -e

echo "🛡️  SECURING ROBBIE EMPIRE - VPN-FIRST ARCHITECTURE"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Network Configuration
VPN_NETWORK="10.0.0.0/24"
GATEWAY_IP="10.0.0.1"
AURORA_TOWN_IP="10.0.0.10"
RUNPOD_AURORA_IP="10.0.0.20"
RUNPOD_COLLAB_IP="10.0.0.30"
RUNPOD_FLUENTI_IP="10.0.0.40"
MACBOOK_IP="10.0.0.100"

# Service Ports (INTERNAL ONLY)
POSTGRES_PORT="5432"
API_GATEWAY_PORT="8000"
OLLAMA_PORT="11434"
SSH_PORT="22"

echo -e "${BLUE}🎯 SECURE ARCHITECTURE OVERVIEW${NC}"
echo "=================================="
echo "Internet → SSH Gateway (port 22) → Internal VPN (10.0.0.0/24)"
echo ""
echo "Services:"
echo "├── Aurora Town (10.0.0.10) - PostgreSQL master, API gateway"
echo "├── RunPod Aurora (10.0.0.20) - GPU compute, Ollama"
echo "├── RunPod Collab (10.0.0.30) - Backup compute"
echo "├── RunPod Fluenti (10.0.0.40) - Marketing AI"
echo "└── MacBook (10.0.0.100) - Development, local replica"
echo ""

# Step 1: Create VPN Gateway on Aurora Town
echo -e "${YELLOW}🔧 Step 1: Setting up VPN Gateway on Aurora Town${NC}"
cat > /tmp/setup-vpn-gateway.sh << 'EOF'
#!/bin/bash
# VPN Gateway setup on Aurora Town

# Install WireGuard
apt update && apt install -y wireguard iptables-persistent

# Generate keys
wg genkey | tee /etc/wireguard/privatekey | wg pubkey > /etc/wireguard/publickey

# Create WireGuard config
cat > /etc/wireguard/wg0.conf << 'WGEOF'
[Interface]
PrivateKey = $(cat /etc/wireguard/privatekey)
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# RunPod Aurora
[Peer]
PublicKey = RUNPOD_AURORA_PUBLIC_KEY
AllowedIPs = 10.0.0.20/32

# RunPod Collaboration  
[Peer]
PublicKey = RUNPOD_COLLAB_PUBLIC_KEY
AllowedIPs = 10.0.0.30/32

# RunPod Fluenti
[Peer]
PublicKey = RUNPOD_FLUENTI_PUBLIC_KEY
AllowedIPs = 10.0.0.40/32

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

echo "✅ VPN Gateway configured on Aurora Town"
EOF

# Step 2: Secure Aurora Town Services
echo -e "${YELLOW}🔧 Step 2: Securing Aurora Town Services${NC}"
cat > /tmp/secure-aurora-town.sh << 'EOF'
#!/bin/bash
# Secure Aurora Town - PostgreSQL master, API gateway only

# Stop all unnecessary services
systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true

# Configure PostgreSQL for internal network only
cat > /etc/postgresql/16/main/postgresql.conf << 'PGEOF'
listen_addresses = '10.0.0.10,127.0.0.1'
port = 5432
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
PGEOF

# Configure PostgreSQL access control
cat > /etc/postgresql/16/main/pg_hba.conf << 'HBAEOF'
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                trust
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             10.0.0.0/24             md5
host    all             all             ::1/128                 md5
HBAEOF

# Restart PostgreSQL
systemctl restart postgresql

# Create secure API gateway
cat > /opt/aurora/secure-gateway.py << 'GATEWAYEOF'
#!/usr/bin/env python3
"""
Secure API Gateway - Single entry point for all services
Only accessible via VPN (10.0.0.0/24 network)
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import psycopg2
import requests
import os

app = FastAPI(title="Robbie Empire Secure Gateway", version="1.0.0")

# CORS only for internal network
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://10.0.0.*", "https://10.0.0.*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
def get_db():
    return psycopg2.connect(
        host="10.0.0.10",
        port=5432,
        dbname="aurora_unified",
        user="aurora_app",
        password=os.getenv("AURORA_DB_PASSWORD", "TestPilot2025_Aurora!")
    )

@app.get("/health")
async def health_check():
    """Health check for all services"""
    status = {
        "gateway": "healthy",
        "database": "unknown",
        "gpu_services": {}
    }
    
    # Check database
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        status["database"] = "healthy"
        conn.close()
    except Exception as e:
        status["database"] = f"error: {str(e)}"
    
    # Check GPU services
    gpu_services = {
        "aurora": "10.0.0.20:11434",
        "collaboration": "10.0.0.30:11434", 
        "fluenti": "10.0.0.40:11434"
    }
    
    for name, endpoint in gpu_services.items():
        try:
            response = requests.get(f"http://{endpoint}/api/tags", timeout=5)
            status["gpu_services"][name] = "healthy" if response.status_code == 200 else "unhealthy"
        except:
            status["gpu_services"][name] = "unreachable"
    
    return status

@app.post("/chat")
async def chat_endpoint(request: dict):
    """Route chat requests to available GPU service"""
    # Simple round-robin load balancing
    gpu_services = ["10.0.0.20:11434", "10.0.0.30:11434", "10.0.0.40:11434"]
    
    for service in gpu_services:
        try:
            response = requests.post(f"http://{service}/api/chat", json=request, timeout=30)
            if response.status_code == 200:
                return response.json()
        except:
            continue
    
    raise HTTPException(status_code=503, detail="No GPU services available")

if __name__ == "__main__":
    uvicorn.run(app, host="10.0.0.10", port=8000, log_level="info")
GATEWAYEOF

chmod +x /opt/aurora/secure-gateway.py

# Create systemd service for secure gateway
cat > /etc/systemd/system/robbie-secure-gateway.service << 'SERVICEEOF'
[Unit]
Description=Robbie Empire Secure Gateway
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/aurora
ExecStart=/usr/bin/python3 /opt/aurora/secure-gateway.py
Restart=always
RestartSec=5
Environment=AURORA_DB_PASSWORD=TestPilot2025_Aurora!

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable robbie-secure-gateway
systemctl start robbie-secure-gateway

echo "✅ Aurora Town secured - PostgreSQL master + API gateway only"
EOF

# Step 3: Secure RunPod Services
echo -e "${YELLOW}🔧 Step 3: Securing RunPod Services${NC}"
cat > /tmp/secure-runpod.sh << 'EOF'
#!/bin/bash
# Secure RunPod - GPU compute only, internal network

RUNPOD_IP=$1
RUNPOD_PORT=$2
SERVICE_NAME=$3

# Install WireGuard
apt update && apt install -y wireguard

# Generate keys
wg genkey | tee /etc/wireguard/privatekey | wg pubkey > /etc/wireguard/publickey

# Create WireGuard config (will be updated with gateway public key)
cat > /etc/wireguard/wg0.conf << 'WGEOF'
[Interface]
PrivateKey = $(cat /etc/wireguard/privatekey)
Address = 10.0.0.20/24  # Will be updated per pod
ListenPort = 51820

[Peer]
PublicKey = AURORA_TOWN_PUBLIC_KEY  # Will be updated
Endpoint = aurora-town-u44170.vm.elestio.app:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
WGEOF

# Stop all public services
systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true
pkill -f "uvicorn.*0.0.0.0" 2>/dev/null || true

# Configure Ollama for internal network only
export OLLAMA_HOST=10.0.0.20:11434  # Will be updated per pod
export OLLAMA_ORIGINS="http://10.0.0.*"

# Create secure Ollama service
cat > /etc/systemd/system/robbie-ollama.service << 'OLLAMAEOF'
[Unit]
Description=Robbie Ollama GPU Service
After=network.target

[Service]
Type=simple
User=root
Environment=OLLAMA_HOST=10.0.0.20:11434
Environment=OLLAMA_ORIGINS=http://10.0.0.*
Environment=OLLAMA_GPU_LAYERS=999
Environment=OLLAMA_FLASH_ATTENTION=1
Environment=OLLAMA_KEEP_ALIVE=24h
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
OLLAMAEOF

systemctl daemon-reload
systemctl enable robbie-ollama
systemctl start robbie-ollama

# Start WireGuard
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

echo "✅ RunPod $SERVICE_NAME secured - GPU compute only"
EOF

# Step 4: Create deployment script
echo -e "${YELLOW}🔧 Step 4: Creating Secure Deployment Script${NC}"
cat > /tmp/deploy-secure-empire.sh << 'EOF'
#!/bin/bash
# Deploy secure Robbie Empire

echo "🛡️  DEPLOYING SECURE ROBBIE EMPIRE"
echo "=================================="

# Deploy to Aurora Town
echo "📡 Deploying to Aurora Town..."
scp /tmp/setup-vpn-gateway.sh root@aurora-town-u44170.vm.elestio.app:/tmp/
scp /tmp/secure-aurora-town.sh root@aurora-town-u44170.vm.elestio.app:/tmp/
ssh root@aurora-town-u44170.vm.elestio.app "chmod +x /tmp/*.sh && /tmp/setup-vpn-gateway.sh"

# Get Aurora Town public key
AURORA_PUBLIC_KEY=$(ssh root@aurora-town-u44170.vm.elestio.app "cat /etc/wireguard/publickey")
echo "Aurora Town Public Key: $AURORA_PUBLIC_KEY"

# Deploy to RunPod Aurora
echo "🚀 Deploying to RunPod Aurora..."
scp /tmp/secure-runpod.sh root@82.221.170.242:/tmp/ -P 24505
ssh root@82.221.170.242 -p 24505 "chmod +x /tmp/secure-runpod.sh && /tmp/secure-runpod.sh 10.0.0.20 24505 aurora"

# Get RunPod Aurora public key
AURORA_RUNPOD_PUBLIC_KEY=$(ssh root@82.221.170.242 -p 24505 "cat /etc/wireguard/publickey")
echo "RunPod Aurora Public Key: $AURORA_RUNPOD_PUBLIC_KEY"

# Deploy to RunPod Collaboration
echo "🤝 Deploying to RunPod Collaboration..."
scp /tmp/secure-runpod.sh root@213.181.111.2:/tmp/ -P 43540
ssh root@213.181.111.2 -p 43540 "chmod +x /tmp/secure-runpod.sh && /tmp/secure-runpod.sh 10.0.0.30 43540 collaboration"

# Get RunPod Collab public key
COLLAB_PUBLIC_KEY=$(ssh root@213.181.111.2 -p 43540 "cat /etc/wireguard/publickey")
echo "RunPod Collab Public Key: $COLLAB_PUBLIC_KEY"

# Deploy to RunPod Fluenti
echo "📈 Deploying to RunPod Fluenti..."
scp /tmp/secure-runpod.sh root@103.196.86.56:/tmp/ -P 19777
ssh root@103.196.86.56 -p 19777 "chmod +x /tmp/secure-runpod.sh && /tmp/secure-runpod.sh 10.0.0.40 19777 fluenti"

# Get RunPod Fluenti public key
FLUENTI_PUBLIC_KEY=$(ssh root@103.196.86.56 -p 19777 "cat /etc/wireguard/publickey")
echo "RunPod Fluenti Public Key: $FLUENTI_PUBLIC_KEY"

echo ""
echo "🔑 EXCHANGE PUBLIC KEYS:"
echo "========================"
echo "Aurora Town: $AURORA_PUBLIC_KEY"
echo "RunPod Aurora: $AURORA_RUNPOD_PUBLIC_KEY"
echo "RunPod Collab: $COLLAB_PUBLIC_KEY"
echo "RunPod Fluenti: $FLUENTI_PUBLIC_KEY"
echo ""
echo "⚠️  Next: Update WireGuard configs with these keys, then restart services"
EOF

chmod +x /tmp/deploy-secure-empire.sh

echo -e "${GREEN}✅ SECURE ARCHITECTURE SCRIPTS CREATED${NC}"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Run: /tmp/deploy-secure-empire.sh"
echo "2. Exchange WireGuard public keys"
echo "3. Update all WireGuard configs with peer keys"
echo "4. Restart all WireGuard services"
echo "5. Test internal connectivity"
echo ""
echo "🛡️  RESULT: Single SSH entry point, internal VPN network, consolidated services"
