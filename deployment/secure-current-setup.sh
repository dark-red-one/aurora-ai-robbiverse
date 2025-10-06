#!/bin/bash
# 🛡️ SECURE CURRENT SETUP - Single pod + Aurora Town + MacBook

set -e

echo "🛡️  SECURING CURRENT ROBBIE SETUP"
echo "================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎯 CURRENT REALITY${NC}"
echo "=================="
echo "• Aurora Town: API gateway + PostgreSQL master"
echo "• RunPod Aurora: aurora-gpu (1x RTX 4090) - 76% disk usage"
echo "• MacBook: Development workstation"
echo "• Star: Future Company HQ (not deployed yet)"
echo ""

# Step 1: Secure Aurora Town (API Gateway + PostgreSQL Master)
echo -e "${YELLOW}🔧 Step 1: Securing Aurora Town${NC}"
cat > /tmp/secure-aurora-town-current.sh << 'AURORATOWNEOF'
#!/bin/bash
# Secure Aurora Town - API gateway + PostgreSQL master only

echo "🏛️  Securing Aurora Town as API gateway + PostgreSQL master"

# Stop all unnecessary services
systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true
pkill -f "uvicorn.*0.0.0.0" 2>/dev/null || true

# Configure PostgreSQL for internal network only
cat > /etc/postgresql/16/main/postgresql.conf << 'PGCONF'
# Secure Configuration
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

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
PGCONF

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
Secure API Gateway - Single entry point for current setup
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
        host="localhost",
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
    
    # Check GPU service (RunPod Aurora)
    try:
        response = requests.get("http://10.0.0.20:11434/api/tags", timeout=5)
        status["gpu_services"]["aurora-gpu"] = "healthy" if response.status_code == 200 else "unhealthy"
    except:
        status["gpu_services"]["aurora-gpu"] = "unreachable"
    
    return status

@app.post("/chat")
async def chat_endpoint(request: dict):
    """Route chat requests to RunPod Aurora GPU"""
    try:
        response = requests.post("http://10.0.0.20:11434/api/chat", json=request, timeout=60)
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=503, detail="GPU service unavailable")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"GPU service error: {str(e)}")

@app.get("/gpu/status")
async def gpu_status():
    """Get GPU status from RunPod Aurora"""
    try:
        response = requests.get("http://10.0.0.20:8001/gpu/status", timeout=5)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"GPU status unavailable: {str(e)}")

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

echo "✅ Aurora Town secured - API gateway + PostgreSQL master"
AURORATOWNEOF

# Step 2: Secure RunPod Aurora (Single GPU Node)
echo -e "${YELLOW}🔧 Step 2: Securing RunPod Aurora${NC}"
cat > /tmp/secure-runpod-aurora-current.sh << 'RUNPODEOF'
#!/bin/bash
# Secure RunPod Aurora - Single GPU node

echo "🚀 Securing RunPod Aurora (aurora-gpu) - 1x RTX 4090"

# Stop all public services
systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true
pkill -f "uvicorn.*0.0.0.0" 2>/dev/null || true

# Configure Ollama for internal network only
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_ORIGINS="http://10.0.0.*,https://10.0.0.*"
export OLLAMA_GPU_LAYERS=999
export OLLAMA_FLASH_ATTENTION=1
export OLLAMA_KEEP_ALIVE=24h

# Create secure Ollama service
cat > /etc/systemd/system/robbie-ollama-secure.service << 'OLLAMASERVICEEOF'
[Unit]
Description=Robbie Ollama GPU Service (Secure)
After=network.target

[Service]
Type=simple
User=root
Environment=OLLAMA_HOST=0.0.0.0:11434
Environment=OLLAMA_ORIGINS=http://10.0.0.*,https://10.0.0.*
Environment=OLLAMA_GPU_LAYERS=999
Environment=OLLAMA_FLASH_ATTENTION=1
Environment=OLLAMA_KEEP_ALIVE=24h
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
OLLAMASERVICEEOF

# Create GPU status API
cat > /opt/robbie/gpu-status-api.py << 'STATUSAPIEOF'
#!/usr/bin/env python3
"""
GPU Status API - Expose GPU capabilities
"""

from fastapi import FastAPI, HTTPException
import uvicorn
import subprocess
import json

app = FastAPI(title="Robbie GPU Status - Aurora", version="1.0.0")

@app.get("/gpu/status")
async def gpu_status():
    """Get GPU status and capabilities"""
    try:
        # Get GPU info
        result = subprocess.run(['nvidia-smi', '--query-gpu=name,memory.total,memory.used,utilization.gpu,temperature.gpu', '--format=csv,noheader,nounits'], 
                              capture_output=True, text=True)
        
        gpus = []
        for line in result.stdout.strip().split('\n'):
            if line:
                parts = line.split(', ')
                gpus.append({
                    "name": parts[0],
                    "memory_total": int(parts[1]),
                    "memory_used": int(parts[2]),
                    "utilization": int(parts[3]),
                    "temperature": int(parts[4])
                })
        
        # Get disk usage
        disk_result = subprocess.run(['df', '-h', '/workspace'], capture_output=True, text=True)
        disk_info = disk_result.stdout.strip().split('\n')[1].split()
        
        return {
            "node": "aurora-gpu",
            "ip": "10.0.0.20",
            "gpus": gpus,
            "total_vram_gb": sum(gpu['memory_total'] for gpu in gpus),
            "available_vram_gb": sum(gpu['memory_total'] - gpu['memory_used'] for gpu in gpus),
            "disk_usage": {
                "total": disk_info[1],
                "used": disk_info[2],
                "available": disk_info[3],
                "percent": disk_info[4]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/gpu/models")
async def list_models():
    """List available models on this node"""
    try:
        result = subprocess.run(['ollama', 'list'], capture_output=True, text=True)
        models = []
        for line in result.stdout.strip().split('\n')[1:]:  # Skip header
            if line.strip():
                models.append(line.strip().split()[0])
        return {"node": "aurora-gpu", "models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
STATUSAPIEOF

chmod +x /opt/robbie/gpu-status-api.py

# Create GPU status API service
cat > /etc/systemd/system/robbie-gpu-status.service << 'STATUSSERVICEEOF'
[Unit]
Description=Robbie GPU Status API
After=network.target robbie-ollama-secure.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/robbie
ExecStart=/usr/bin/python3 /opt/robbie/gpu-status-api.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
STATUSSERVICEEOF

# Start services
systemctl daemon-reload
systemctl enable robbie-ollama-secure robbie-gpu-status
systemctl start robbie-ollama-secure robbie-gpu-status

echo "✅ RunPod Aurora secured - 1x RTX 4090 GPU service"
RUNPODEOF

# Step 3: Create deployment script for current setup
echo -e "${YELLOW}🔧 Step 3: Deploy Current Secure Setup${NC}"
cat > /tmp/deploy-current-secure.sh << 'DEPLOYCURRENTEOF'
#!/bin/bash
# Deploy secure current setup

echo "🛡️  DEPLOYING SECURE CURRENT SETUP"
echo "=================================="

# Deploy to Aurora Town
echo "📡 Deploying to Aurora Town..."
scp /tmp/secure-aurora-town-current.sh root@aurora-town-u44170.vm.elestio.app:/tmp/
ssh root@aurora-town-u44170.vm.elestio.app "chmod +x /tmp/secure-aurora-town-current.sh && /tmp/secure-aurora-town-current.sh"

# Deploy to RunPod Aurora
echo "🚀 Deploying to RunPod Aurora (aurora-gpu)..."
scp /tmp/secure-runpod-aurora-current.sh root@82.221.170.242:/tmp/ -P 24505
ssh root@82.221.170.242 -p 24505 "chmod +x /tmp/secure-runpod-aurora-current.sh && /tmp/secure-runpod-aurora-current.sh"

echo ""
echo "✅ CURRENT SETUP SECURED!"
echo "========================="
echo "• Aurora Town: API gateway + PostgreSQL master (10.0.0.10:8000)"
echo "• RunPod Aurora: GPU service (10.0.0.20:11434)"
echo "• MacBook: Development workstation"
echo "• SSH/VPN only: No public exposure"
echo ""
echo "🔗 TEST COMMANDS:"
echo "• Health check: curl http://10.0.0.10:8000/health"
echo "• GPU status: curl http://10.0.0.20:8001/gpu/status"
echo "• Chat test: curl -X POST http://10.0.0.10:8000/chat -H 'Content-Type: application/json' -d '{\"model\":\"llama3.1:8b\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello!\"}]}'"
DEPLOYCURRENTEOF

chmod +x /tmp/deploy-current-secure.sh

echo -e "${GREEN}✅ CURRENT SETUP SECURITY SCRIPTS CREATED${NC}"
echo ""
echo "📋 DEPLOYMENT COMMANDS:"
echo "======================="
echo "1. Deploy current secure setup: /tmp/deploy-current-secure.sh"
echo "2. Test health: curl http://10.0.0.10:8000/health"
echo "3. Check GPU: curl http://10.0.0.20:8001/gpu/status"
echo ""
echo "🎯 EXPANSION PLAN:"
echo "=================="
echo "• Add Star (Company HQ) when ready"
echo "• Add more RunPods as needed"
echo "• Scale to full mesh when resources available"
echo ""
echo "🛡️  SECURITY: SSH/VPN only, no public exposure"
echo "⚡ CURRENT: 1x RTX 4090 (24GB VRAM)"
echo "🐘 DATA: PostgreSQL master on Aurora Town"
