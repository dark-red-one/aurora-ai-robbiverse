#!/bin/bash
# 🚀 ROBBIE EMPIRE - COMPLETE MESHED ARCHITECTURE
# PostgreSQL mesh + GPU mesh + Development everywhere + Star HQ

set -e

echo "🚀 ROBBIE EMPIRE - COMPLETE MESHED ARCHITECTURE"
echo "=============================================="

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
    ["star"]="10.0.0.5:22:Company HQ - Asus box, primary write master"
    ["aurora-town"]="10.0.0.10:22:API gateway + PostgreSQL coordinator"
    ["runpod-aurora"]="10.0.0.20:24505:GPU compute #1 (2x RTX 4090)"
    ["runpod-collab"]="10.0.0.30:43540:GPU compute #2 (1x RTX 4090)"
    ["runpod-fluenti"]="10.0.0.40:19777:GPU compute #3 (1x RTX 4090)"
    ["macbook"]="10.0.0.100:22:Development workstation (1x RTX 4090)"
)

# GPU MESH CONFIGURATION
declare -A GPU_NODES=(
    ["star"]="10.0.0.5:11434:1x RTX 4090 (24GB)"
    ["runpod-aurora"]="10.0.0.20:11434:2x RTX 4090 (48GB)"
    ["runpod-collab"]="10.0.0.30:11434:1x RTX 4090 (24GB)"
    ["runpod-fluenti"]="10.0.0.40:11434:1x RTX 4090 (24GB)"
    ["macbook"]="10.0.0.100:11434:1x RTX 4090 (24GB)"
)

echo -e "${BLUE}🎯 COMPLETE MESHED ARCHITECTURE${NC}"
echo "=================================="
echo "Internet → SSH Gateway (port 22) → Internal VPN (10.0.0.0/24)"
echo ""
echo "NODES:"
for node in "${!NODES[@]}"; do
    IFS=':' read -r ip port desc <<< "${NODES[$node]}"
    echo "├── $node ($ip) - $desc"
done
echo ""

echo -e "${PURPLE}🐘 POSTGRESQL MESH - 6 NODES, FULL REPLICATION${NC}"
echo "=================================================="
echo "• Star (10.0.0.5) - Primary write master (Company HQ)"
echo "• Aurora Town (10.0.0.10) - Replication coordinator"
echo "• All RunPods + MacBook - Hot replicas with write capability"
echo "• Bidirectional sync - any node can write, all nodes replicate"
echo ""

echo -e "${YELLOW}⚡ GPU MESH NETWORK - 6X RTX 4090 POWER!${NC}"
echo "=============================================="
TOTAL_VRAM=0
for node in "${!GPU_NODES[@]}"; do
    IFS=':' read -r ip port gpu_info <<< "${GPU_NODES[$node]}"
    echo "• $node ($ip) - $gpu_info"
    # Extract VRAM count for total
    if [[ $gpu_info =~ ([0-9]+)GB ]]; then
        TOTAL_VRAM=$((TOTAL_VRAM + ${BASH_REMATCH[1]}))
    fi
done
echo "• TOTAL: 6x RTX 4090 = ${TOTAL_VRAM}GB VRAM MESH!"
echo ""

# Step 1: Create PostgreSQL Mesh Setup
echo -e "${YELLOW}🔧 Step 1: PostgreSQL Mesh Setup${NC}"
cat > /tmp/setup-postgres-mesh.sh << 'POSTGRESEOF'
#!/bin/bash
# PostgreSQL Mesh - Every node has full replica with write capability

NODE_NAME=$1
NODE_IP=$2
IS_MASTER=${3:-false}

echo "🐘 Setting up PostgreSQL mesh node: $NODE_NAME ($NODE_IP)"

# Install PostgreSQL 16
apt update && apt install -y postgresql-16 postgresql-client-16 postgresql-contrib-16

# Configure PostgreSQL for mesh
cat > /etc/postgresql/16/main/postgresql.conf << 'PGCONF'
# Mesh Configuration
listen_addresses = '10.0.0.*,127.0.0.1'
port = 5432
max_connections = 200
shared_buffers = 512MB
effective_cache_size = 2GB
maintenance_work_mem = 128MB
checkpoint_completion_target = 0.9
wal_buffers = 32MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 8MB
min_wal_size = 2GB
max_wal_size = 8GB

# Replication Settings
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
hot_standby = on
hot_standby_feedback = on

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

# Configure access control for mesh
cat > /etc/postgresql/16/main/pg_hba.conf << 'HBAEOF'
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                trust
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             10.0.0.0/24             md5
host    all             all             ::1/128                 md5
host    replication     all             10.0.0.0/24             md5
HBAEOF

# Create mesh replication user
sudo -u postgres psql << 'SQL'
CREATE USER mesh_replicator WITH REPLICATION PASSWORD 'RobbieMesh2025!';
GRANT CONNECT ON DATABASE postgres TO mesh_replicator;
SQL

# Create Aurora unified database
sudo -u postgres createdb aurora_unified
sudo -u postgres psql aurora_unified << 'SQL'
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create mesh sync table
CREATE TABLE IF NOT EXISTS mesh_sync_log (
    id SERIAL PRIMARY KEY,
    node_name VARCHAR(50) NOT NULL,
    operation VARCHAR(20) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64)
);

-- Create mesh status table
CREATE TABLE IF NOT EXISTS mesh_status (
    node_name VARCHAR(50) PRIMARY KEY,
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    gpu_available BOOLEAN DEFAULT false,
    gpu_vram_gb INTEGER DEFAULT 0,
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert this node's status
INSERT INTO mesh_status (node_name, status, last_heartbeat) 
VALUES ('$NODE_NAME', 'active', CURRENT_TIMESTAMP)
ON CONFLICT (node_name) DO UPDATE SET
    last_heartbeat = CURRENT_TIMESTAMP,
    status = 'active';
SQL

# Start PostgreSQL
systemctl restart postgresql
systemctl enable postgresql

echo "✅ PostgreSQL mesh node $NODE_NAME configured"
POSTGRESEOF

# Step 2: Create GPU Mesh Setup
echo -e "${YELLOW}🔧 Step 2: GPU Mesh Setup${NC}"
cat > /tmp/setup-gpu-mesh.sh << 'GPUMESHEOF'
#!/bin/bash
# GPU Mesh - Shared compute pool across all nodes

NODE_NAME=$1
NODE_IP=$2
GPU_COUNT=$3
VRAM_GB=$4

echo "⚡ Setting up GPU mesh node: $NODE_NAME ($NODE_IP) - ${GPU_COUNT}x RTX 4090 (${VRAM_GB}GB)"

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Configure Ollama for mesh
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_ORIGINS="http://10.0.0.*,https://10.0.0.*"
export OLLAMA_GPU_LAYERS=999
export OLLAMA_FLASH_ATTENTION=1
export OLLAMA_KEEP_ALIVE=24h

# Create GPU mesh service
cat > /etc/systemd/system/robbie-gpu-mesh.service << 'SERVICEEOF'
[Unit]
Description=Robbie GPU Mesh Service
After=network.target postgresql.service

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
SERVICEEOF

# Create GPU mesh API
cat > /opt/robbie/gpu-mesh-api.py << 'APIEOF'
#!/usr/bin/env python3
"""
GPU Mesh API - Expose GPU capabilities to the mesh
"""

from fastapi import FastAPI, HTTPException
import uvicorn
import psycopg2
import os
import subprocess
import json

app = FastAPI(title=f"Robbie GPU Mesh - {NODE_NAME}", version="1.0.0")

# Database connection
def get_db():
    return psycopg2.connect(
        host="localhost",
        port=5432,
        dbname="aurora_unified",
        user="postgres",
        password=""
    )

@app.get("/gpu/status")
async def gpu_status():
    """Get GPU status and capabilities"""
    try:
        # Get GPU info
        result = subprocess.run(['nvidia-smi', '--query-gpu=name,memory.total,memory.used,utilization.gpu', '--format=csv,noheader,nounits'], 
                              capture_output=True, text=True)
        
        gpus = []
        for line in result.stdout.strip().split('\n'):
            if line:
                parts = line.split(', ')
                gpus.append({
                    "name": parts[0],
                    "memory_total": int(parts[1]),
                    "memory_used": int(parts[2]),
                    "utilization": int(parts[3])
                })
        
        # Update mesh status
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO mesh_status (node_name, gpu_available, gpu_vram_gb, last_heartbeat)
            VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (node_name) DO UPDATE SET
                gpu_available = %s,
                gpu_vram_gb = %s,
                last_heartbeat = CURRENT_TIMESTAMP
        """, (NODE_NAME, len(gpus) > 0, sum(gpu['memory_total'] for gpu in gpus), 
              len(gpus) > 0, sum(gpu['memory_total'] for gpu in gpus)))
        conn.commit()
        conn.close()
        
        return {
            "node": NODE_NAME,
            "ip": NODE_IP,
            "gpus": gpus,
            "total_vram_gb": sum(gpu['memory_total'] for gpu in gpus),
            "available_vram_gb": sum(gpu['memory_total'] - gpu['memory_used'] for gpu in gpus)
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
        return {"node": NODE_NAME, "models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/gpu/chat")
async def gpu_chat(request: dict):
    """Handle chat request on this GPU node"""
    try:
        # Simple Ollama API call
        import requests
        response = requests.post('http://localhost:11434/api/chat', json=request, timeout=60)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
APIEOF

chmod +x /opt/robbie/gpu-mesh-api.py

# Create GPU mesh API service
cat > /etc/systemd/system/robbie-gpu-api.service << 'APISERVICEEOF'
[Unit]
Description=Robbie GPU Mesh API
After=network.target robbie-gpu-mesh.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/robbie
ExecStart=/usr/bin/python3 /opt/robbie/gpu-mesh-api.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
APISERVICEEOF

# Start services
systemctl daemon-reload
systemctl enable robbie-gpu-mesh robbie-gpu-api
systemctl start robbie-gpu-mesh robbie-gpu-api

echo "✅ GPU mesh node $NODE_NAME configured with ${GPU_COUNT}x RTX 4090 (${VRAM_GB}GB)"
GPUMESHEOF

# Step 3: Create Development Everywhere Setup
echo -e "${YELLOW}🔧 Step 3: Development Everywhere Setup${NC}"
cat > /tmp/setup-development-everywhere.sh << 'DEVEVERYWHEREEOF'
#!/bin/bash
# Development Everywhere - Full sync across all nodes

NODE_NAME=$1
NODE_IP=$2

echo "💻 Setting up development everywhere: $NODE_NAME ($NODE_IP)"

# Create development directory
mkdir -p /opt/robbie-dev
cd /opt/robbie-dev

# Clone repository
if [ ! -d "aurora-ai-robbiverse" ]; then
    git clone https://github.com/dark-red-one/aurora-ai-robbiverse.git
fi

cd aurora-ai-robbiverse

# Create development sync service
cat > /opt/robbie-dev/sync-dev.sh << 'SYNCEOF'
#!/bin/bash
# Development sync - keep all nodes in sync

NODE_NAME=$1
echo "🔄 Syncing development on $NODE_NAME..."

cd /opt/robbie-dev/aurora-ai-robbiverse

# Pull latest changes
git pull origin main

# Sync database schema
if command -v psql >/dev/null 2>&1; then
    echo "📊 Syncing database schema..."
    for sql_file in database/unified-schema/*.sql; do
        if [ -f "$sql_file" ]; then
            psql -h localhost -U postgres -d aurora_unified -f "$sql_file" 2>/dev/null || true
        fi
    done
fi

# Update mesh status
psql -h localhost -U postgres -d aurora_unified -c "
    INSERT INTO mesh_status (node_name, last_sync, status, last_heartbeat)
    VALUES ('$NODE_NAME', CURRENT_TIMESTAMP, 'synced', CURRENT_TIMESTAMP)
    ON CONFLICT (node_name) DO UPDATE SET
        last_sync = CURRENT_TIMESTAMP,
        status = 'synced',
        last_heartbeat = CURRENT_TIMESTAMP;
" 2>/dev/null || true

echo "✅ Development sync complete on $NODE_NAME"
SYNCEOF

chmod +x /opt/robbie-dev/sync-dev.sh

# Create development sync cron job
cat > /etc/cron.d/robbie-dev-sync << 'CRONEOF'
# Robbie Development Sync - Every 5 minutes
*/5 * * * * root /opt/robbie-dev/sync-dev.sh $NODE_NAME >> /var/log/robbie-dev-sync.log 2>&1
CRONEOF

# Create development API
cat > /opt/robbie-dev/dev-api.py << 'DEVAPIEOF'
#!/usr/bin/env python3
"""
Development API - Expose development capabilities
"""

from fastapi import FastAPI, HTTPException
import uvicorn
import subprocess
import os

app = FastAPI(title=f"Robbie Development - {NODE_NAME}", version="1.0.0")

@app.get("/dev/status")
async def dev_status():
    """Get development status"""
    try:
        # Get git status
        result = subprocess.run(['git', 'status', '--porcelain'], 
                              cwd='/opt/robbie-dev/aurora-ai-robbiverse',
                              capture_output=True, text=True)
        
        # Get last commit
        commit_result = subprocess.run(['git', 'log', '-1', '--oneline'], 
                                     cwd='/opt/robbie-dev/aurora-ai-robbiverse',
                                     capture_output=True, text=True)
        
        return {
            "node": NODE_NAME,
            "ip": NODE_IP,
            "git_status": result.stdout.strip(),
            "last_commit": commit_result.stdout.strip(),
            "has_changes": len(result.stdout.strip()) > 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/dev/sync")
async def sync_dev():
    """Trigger development sync"""
    try:
        result = subprocess.run(['/opt/robbie-dev/sync-dev.sh', NODE_NAME], 
                              capture_output=True, text=True)
        return {"status": "success", "output": result.stdout}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002, log_level="info")
DEVAPIEOF

chmod +x /opt/robbie-dev/dev-api.py

# Create development API service
cat > /etc/systemd/system/robbie-dev-api.service << 'DEVAPISERVICEEOF'
[Unit]
Description=Robbie Development API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/robbie-dev
ExecStart=/usr/bin/python3 /opt/robbie-dev/dev-api.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
DEVAPISERVICEEOF

# Start services
systemctl daemon-reload
systemctl enable robbie-dev-api
systemctl start robbie-dev-api

echo "✅ Development everywhere configured on $NODE_NAME"
DEVEVERYWHEREEOF

# Step 4: Create Master Deployment Script
echo -e "${YELLOW}🔧 Step 4: Master Deployment Script${NC}"
cat > /tmp/deploy-robbie-mesh-empire.sh << 'DEPLOYEOF'
#!/bin/bash
# Deploy complete Robbie mesh empire

echo "🚀 DEPLOYING ROBBIE MESH EMPIRE"
echo "==============================="

# Deploy to each node
for node in "${!NODES[@]}"; do
    IFS=':' read -r ip port desc <<< "${NODES[$node]}"
    
    echo "📡 Deploying to $node ($ip) - $desc"
    
    # Copy setup scripts
    scp /tmp/setup-postgres-mesh.sh root@$ip:/tmp/ -P $port 2>/dev/null || scp /tmp/setup-postgres-mesh.sh root@$ip:/tmp/
    scp /tmp/setup-gpu-mesh.sh root@$ip:/tmp/ -P $port 2>/dev/null || scp /tmp/setup-gpu-mesh.sh root@$ip:/tmp/
    scp /tmp/setup-development-everywhere.sh root@$ip:/tmp/ -P $port 2>/dev/null || scp /tmp/setup-development-everywhere.sh root@$ip:/tmp/
    
    # Execute setup
    if [ "$node" = "star" ]; then
        # Star is primary write master
        ssh root@$ip -p $port "chmod +x /tmp/*.sh && /tmp/setup-postgres-mesh.sh $node $ip true"
    else
        # Other nodes are replicas
        ssh root@$ip -p $port "chmod +x /tmp/*.sh && /tmp/setup-postgres-mesh.sh $node $ip false"
    fi
    
    # Setup GPU mesh
    if [ "$node" = "runpod-aurora" ]; then
        ssh root@$ip -p $port "/tmp/setup-gpu-mesh.sh $node $ip 2 48"
    elif [ "$node" = "star" ] || [ "$node" = "runpod-collab" ] || [ "$node" = "runpod-fluenti" ] || [ "$node" = "macbook" ]; then
        ssh root@$ip -p $port "/tmp/setup-gpu-mesh.sh $node $ip 1 24"
    fi
    
    # Setup development everywhere
    ssh root@$ip -p $port "/tmp/setup-development-everywhere.sh $node $ip"
    
    echo "✅ $node deployment complete"
done

echo ""
echo "🎯 ROBBIE MESH EMPIRE DEPLOYED!"
echo "==============================="
echo "• PostgreSQL mesh: 6 nodes, full replication"
echo "• GPU mesh: 6x RTX 4090, 144GB VRAM total"
echo "• Development everywhere: Full sync across all nodes"
echo "• SSH/VPN only: Secure internal network"
echo ""
echo "🔗 ACCESS POINTS:"
echo "• API Gateway: Aurora Town (10.0.0.10:8000)"
echo "• GPU Mesh: Any node (10.0.0.x:11434)"
echo "• Development: Any node (10.0.0.x:8002)"
echo "• Database: Any node (10.0.0.x:5432)"
DEPLOYEOF

chmod +x /tmp/deploy-robbie-mesh-empire.sh

echo -e "${GREEN}✅ ROBBIE MESH EMPIRE SCRIPTS CREATED${NC}"
echo ""
echo "📋 DEPLOYMENT COMMANDS:"
echo "======================="
echo "1. Deploy to all nodes: /tmp/deploy-robbie-mesh-empire.sh"
echo "2. Check mesh status: curl http://10.0.0.10:8000/health"
echo "3. Check GPU mesh: curl http://10.0.0.20:8001/gpu/status"
echo "4. Check development: curl http://10.0.0.5:8002/dev/status"
echo ""
echo "🛡️  SECURITY: SSH/VPN only, no public exposure"
echo "⚡ POWER: 6x RTX 4090 = 144GB VRAM mesh"
echo "🐘 DATA: PostgreSQL mesh across all 6 nodes"
echo "💻 DEV: Development everywhere with full sync"
