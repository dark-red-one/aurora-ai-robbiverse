#!/bin/bash
# Aurora Standard Node Bootstrap
# Universal installer for macOS and Ubuntu
# curl -sSL https://raw.githubusercontent.com/dark-red-one/aurora-ai-robbiverse/main/deployment/aurora-standard-node/bootstrap.sh | bash

set -e

# Colors for pretty output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# ASCII Art
echo -e "${PURPLE}"
cat << "EOF"
    ___                               
   /   | __  ___________  _________ _
  / /| |/ / / / ___/ __ \/ ___/ __ `/
 / ___ / /_/ / /  / /_/ / /  / /_/ / 
/_/  |_\__,_/_/   \____/_/   \__,_/  
                                      
  Standard Node Deployment v1.0
EOF
echo -e "${NC}"

# ============================================================================
# DETECT ENVIRONMENT
# ============================================================================
echo -e "${CYAN}🔍 Detecting environment...${NC}"

if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macos"
    PACKAGE_MANAGER="brew"
    echo -e "${GREEN}✅ Platform: macOS${NC}"
elif [[ -f /etc/os-release ]]; then
    . /etc/os-release
    if [[ "$ID" == "ubuntu" ]]; then
        PLATFORM="ubuntu"
        PACKAGE_MANAGER="apt"
        echo -e "${GREEN}✅ Platform: Ubuntu $VERSION_ID${NC}"
    else
        echo -e "${RED}❌ Unsupported Linux distribution: $ID${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Unsupported platform${NC}"
    exit 1
fi

# Detect if running in Docker (for nested scenarios)
if [ -f /.dockerenv ]; then
    echo -e "${YELLOW}⚠️  Running inside Docker container${NC}"
    IN_DOCKER=true
else
    IN_DOCKER=false
fi

# ============================================================================
# CHECK PREREQUISITES
# ============================================================================
echo -e "${CYAN}📋 Checking prerequisites...${NC}"

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 installed${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $1 not found${NC}"
        return 1
    fi
}

# Docker
if ! check_command docker; then
    echo -e "${CYAN}📦 Installing Docker...${NC}"
    if [[ "$PLATFORM" == "macos" ]]; then
        echo -e "${YELLOW}Please install Docker Desktop from https://www.docker.com/products/docker-desktop${NC}"
        echo -e "${YELLOW}Then run this script again.${NC}"
        exit 1
    else
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        echo -e "${GREEN}✅ Docker installed${NC}"
    fi
fi

# Docker Compose
if ! check_command docker-compose && ! docker compose version &> /dev/null; then
    echo -e "${CYAN}📦 Installing Docker Compose...${NC}"
    if [[ "$PLATFORM" == "macos" ]]; then
        brew install docker-compose
    else
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
fi

# Git
if ! check_command git; then
    echo -e "${CYAN}📦 Installing Git...${NC}"
    if [[ "$PLATFORM" == "macos" ]]; then
        brew install git
    else
        sudo apt-get update && sudo apt-get install -y git
    fi
fi

# ============================================================================
# CONFIGURE NODE
# ============================================================================
echo ""
echo -e "${PURPLE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║           NODE CONFIGURATION                           ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Node name (default to hostname)
DEFAULT_NODE_NAME=$(hostname | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]//g')
read -p "$(echo -e ${CYAN}Node name [${DEFAULT_NODE_NAME}]: ${NC})" NODE_NAME
NODE_NAME=${NODE_NAME:-$DEFAULT_NODE_NAME}

# Node role
echo ""
echo -e "${CYAN}Select node role:${NC}"
echo "  1) Lead Node (Primary DNS + DB, typically Aurora on Elestio)"
echo "  2) Backup Node (Secondary DNS + DB, typically Star)"
echo "  3) Compute Node (DB replica, GPU processing, typical workstation)"
read -p "$(echo -e ${CYAN}Enter choice [1-3]: ${NC})" role_choice

case $role_choice in
    1) NODE_ROLE="lead" ;;
    2) NODE_ROLE="backup" ;;
    3) NODE_ROLE="compute" ;;
    *) NODE_ROLE="compute" ;;
esac

echo -e "${GREEN}✅ Role: $NODE_ROLE${NC}"

# VPN IP assignment
echo ""
if [[ "$NODE_ROLE" == "lead" ]]; then
    VPN_IP="10.0.0.1"
    DNS_IP="10.0.0.1"
elif [[ "$NODE_ROLE" == "backup" ]]; then
    VPN_IP="10.0.0.2"
    DNS_IP="10.0.0.2"
else
    # Auto-assign or ask
    read -p "$(echo -e ${CYAN}VPN IP [auto-assign]: ${NC})" VPN_IP
    if [[ -z "$VPN_IP" ]]; then
        # Simple auto-assignment (could be smarter)
        VPN_IP="10.0.0.$(shuf -i 10-250 -n 1)"
    fi
fi

echo -e "${GREEN}✅ VPN IP: $VPN_IP${NC}"

# Public IP (for WireGuard endpoint)
if [[ "$NODE_ROLE" == "lead" ]] || [[ "$NODE_ROLE" == "backup" ]]; then
    PUBLIC_IP=$(curl -s ifconfig.me || echo "auto")
    read -p "$(echo -e ${CYAN}Public IP [$PUBLIC_IP]: ${NC})" PUBLIC_IP_INPUT
    PUBLIC_IP=${PUBLIC_IP_INPUT:-$PUBLIC_IP}
    echo -e "${GREEN}✅ Public IP: $PUBLIC_IP${NC}"
fi

# Database configuration
echo ""
if [[ "$NODE_ROLE" == "lead" ]]; then
    DB_MODE="primary"
    echo -e "${CYAN}This node will be the PostgreSQL PRIMARY (read-write)${NC}"
else
    DB_MODE="replica"
    read -p "$(echo -e ${CYAN}Primary DB host [10.0.0.1]: ${NC})" DB_PRIMARY_HOST
    DB_PRIMARY_HOST=${DB_PRIMARY_HOST:-10.0.0.1}
    echo -e "${CYAN}This node will be a PostgreSQL REPLICA (read-only) from $DB_PRIMARY_HOST${NC}"
fi

# Passwords
echo ""
echo -e "${CYAN}🔐 Security Configuration${NC}"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
DB_REPLICATION_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
GRAFANA_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

echo -e "${GREEN}✅ Generated secure passwords${NC}"

# GPU support
GPU_ENABLED="false"
if [[ "$NODE_ROLE" == "compute" ]]; then
    echo ""
    read -p "$(echo -e ${CYAN}Enable GPU support? [y/N]: ${NC})" gpu_choice
    if [[ "$gpu_choice" =~ ^[Yy]$ ]]; then
        GPU_ENABLED="true"
        echo -e "${GREEN}✅ GPU support enabled${NC}"
    fi
fi

# ============================================================================
# DOWNLOAD DEPLOYMENT PACKAGE
# ============================================================================
echo ""
echo -e "${CYAN}📥 Downloading Aurora Standard Node package...${NC}"

INSTALL_DIR="/opt/aurora-node"
if [[ "$PLATFORM" == "macos" ]]; then
    INSTALL_DIR="$HOME/aurora-node"
fi

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Clone from GitHub
if [[ ! -d "$INSTALL_DIR/.git" ]]; then
    git clone https://github.com/dark-red-one/aurora-ai-robbiverse.git temp
    cp -r temp/deployment/aurora-standard-node/* .
    rm -rf temp
else
    cd "$INSTALL_DIR"
    git pull origin main
fi

echo -e "${GREEN}✅ Package downloaded to $INSTALL_DIR${NC}"

# ============================================================================
# GENERATE CONFIGURATION
# ============================================================================
echo ""
echo -e "${CYAN}⚙️  Generating node configuration...${NC}"

cat > .env << EOF
# Aurora Standard Node Configuration
# Generated: $(date)
# Node: $NODE_NAME
# Role: $NODE_ROLE

# Node Identity
NODE_NAME=$NODE_NAME
NODE_ROLE=$NODE_ROLE
PLATFORM=$PLATFORM

# Network
VPN_IP=$VPN_IP
PUBLIC_IP=${PUBLIC_IP:-auto}
VPN_PEERS=aurora,star

# Database
DB_MODE=$DB_MODE
DB_PASSWORD=$DB_PASSWORD
DB_REPLICATION_PASSWORD=$DB_REPLICATION_PASSWORD
DB_PRIMARY_HOST=${DB_PRIMARY_HOST:-10.0.0.1}
DB_MEMORY_LIMIT=4G
DB_MEMORY_RESERVATION=2G

# Redis
REDIS_PASSWORD=$REDIS_PASSWORD

# Asset Sync
ASSET_ORIGIN=http://10.0.0.1:9000
MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY:-aurora_admin}
MINIO_SECRET_KEY=${MINIO_SECRET_KEY:-aurora_secret}
ASSET_SYNC_INTERVAL=300

# Monitoring
GRAFANA_PASSWORD=$GRAFANA_PASSWORD

# DNS (lead/backup only)
DNS_IP=${DNS_IP:-10.0.0.1}

# GPU
GPU_ENABLED=$GPU_ENABLED

# Mesh
MESH_COORDINATOR_URL=http://10.0.0.1:8001
LEAD_NODE_URL=http://10.0.0.1:9091
HEALTH_REPORT_INTERVAL=30
EOF

echo -e "${GREEN}✅ Configuration written to $INSTALL_DIR/.env${NC}"

# Save credentials securely
cat > .credentials << EOF
# Aurora Node Credentials - KEEP SECURE
Node: $NODE_NAME
Database Password: $DB_PASSWORD
Redis Password: $REDIS_PASSWORD
Grafana Password: $GRAFANA_PASSWORD

Grafana URL: http://${NODE_NAME}.aurora.local:3000
Grafana User: admin
EOF

chmod 600 .credentials

echo -e "${YELLOW}📝 Credentials saved to $INSTALL_DIR/.credentials${NC}"

# ============================================================================
# DEPLOY SERVICES
# ============================================================================
echo ""
echo -e "${CYAN}🚀 Deploying Aurora Standard Node...${NC}"

# Determine which profiles to enable
COMPOSE_PROFILES=""
if [[ "$NODE_ROLE" == "lead" ]] || [[ "$NODE_ROLE" == "backup" ]]; then
    COMPOSE_PROFILES="dns"
fi
if [[ "$GPU_ENABLED" == "true" ]]; then
    COMPOSE_PROFILES="$COMPOSE_PROFILES,gpu"
fi

export COMPOSE_PROFILES

# Pull images
echo -e "${CYAN}📦 Pulling Docker images...${NC}"
docker-compose pull

# Build custom services
echo -e "${CYAN}🔨 Building custom services...${NC}"
docker-compose build

# Start services
echo -e "${CYAN}▶️  Starting services...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "${CYAN}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check health
echo ""
echo -e "${CYAN}🏥 Checking service health...${NC}"
docker-compose ps

# ============================================================================
# POST-DEPLOYMENT CONFIGURATION
# ============================================================================
echo ""
echo -e "${CYAN}🔧 Running post-deployment configuration...${NC}"

# Configure PostgreSQL replication if replica
if [[ "$DB_MODE" == "replica" ]]; then
    echo -e "${CYAN}📊 Configuring PostgreSQL replication...${NC}"
    docker exec -i aurora-postgres bash << 'EOFDB'
        # Stop PostgreSQL
        pg_ctl stop -D /var/lib/postgresql/data -m fast
        
        # Remove existing data
        rm -rf /var/lib/postgresql/data/*
        
        # Base backup from primary
        PGPASSWORD=$POSTGRES_REPLICATION_PASSWORD pg_basebackup \
            -h $POSTGRES_PRIMARY_HOST \
            -U replicator \
            -D /var/lib/postgresql/data \
            -P -Xs -R
        
        # Start PostgreSQL
        pg_ctl start -D /var/lib/postgresql/data
EOFDB
    echo -e "${GREEN}✅ PostgreSQL replication configured${NC}"
fi

# ============================================================================
# VERIFY DEPLOYMENT
# ============================================================================
echo ""
echo -e "${CYAN}✅ Verifying deployment...${NC}"

# Check VPN
if docker exec aurora-wireguard wg show &> /dev/null; then
    echo -e "${GREEN}✅ WireGuard VPN: Active${NC}"
else
    echo -e "${YELLOW}⚠️  WireGuard VPN: Check configuration${NC}"
fi

# Check PostgreSQL
if docker exec aurora-postgres pg_isready -U robbie -d aurora &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL: Ready${NC}"
    if [[ "$DB_MODE" == "replica" ]]; then
        REPLICATION_LAG=$(docker exec aurora-postgres psql -U robbie -d aurora -t -c "SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()));" 2>/dev/null || echo "N/A")
        echo -e "${CYAN}   Replication lag: ${REPLICATION_LAG}s${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL: Not ready${NC}"
fi

# Check Redis
if docker exec aurora-redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning ping &> /dev/null; then
    echo -e "${GREEN}✅ Redis: Ready${NC}"
else
    echo -e "${YELLOW}⚠️  Redis: Not ready${NC}"
fi

# Check monitoring
if curl -s http://localhost:9090/-/healthy &> /dev/null; then
    echo -e "${GREEN}✅ Prometheus: Ready${NC}"
else
    echo -e "${YELLOW}⚠️  Prometheus: Not ready${NC}"
fi

if curl -s http://localhost:3000/api/health &> /dev/null; then
    echo -e "${GREEN}✅ Grafana: Ready${NC}"
else
    echo -e "${YELLOW}⚠️  Grafana: Not ready${NC}"
fi

# ============================================================================
# INSTALL NODE CLI
# ============================================================================
echo ""
echo -e "${CYAN}🛠️  Installing Aurora CLI...${NC}"

sudo curl -sSL https://raw.githubusercontent.com/dark-red-one/aurora-ai-robbiverse/main/deployment/aurora-standard-node/aurora-cli -o /usr/local/bin/aurora-cli
sudo chmod +x /usr/local/bin/aurora-cli

echo -e "${GREEN}✅ Aurora CLI installed${NC}"

# ============================================================================
# DONE
# ============================================================================
echo ""
echo -e "${PURPLE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║          DEPLOYMENT COMPLETE                           ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🎉 Aurora Standard Node deployed successfully!${NC}"
echo ""
echo -e "${CYAN}Node Details:${NC}"
echo "  Name: $NODE_NAME"
echo "  Role: $NODE_ROLE"
echo "  VPN IP: $VPN_IP"
echo "  Install Dir: $INSTALL_DIR"
echo ""
echo -e "${CYAN}Services Running:${NC}"
echo "  • WireGuard VPN: UDP port 51820"
echo "  • PostgreSQL: localhost:5432 (mode: $DB_MODE)"
echo "  • Redis: localhost:6379"
echo "  • Prometheus: http://localhost:9090"
echo "  • Grafana: http://localhost:3000 (admin / $GRAFANA_PASSWORD)"
if [[ "$NODE_ROLE" == "lead" ]] || [[ "$NODE_ROLE" == "backup" ]]; then
echo "  • CoreDNS: UDP/TCP port 53"
fi
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "  1. View credentials: cat $INSTALL_DIR/.credentials"
echo "  2. Check status: aurora-cli status"
echo "  3. View logs: aurora-cli logs"
echo "  4. Access Grafana: http://localhost:3000"
echo ""
echo -e "${CYAN}Documentation:${NC}"
echo "  https://github.com/dark-red-one/aurora-ai-robbiverse/blob/main/deployment/aurora-standard-node/README.md"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Save your credentials file securely!${NC}"
echo -e "${YELLOW}   Location: $INSTALL_DIR/.credentials${NC}"
echo ""
echo -e "${GREEN}Welcome to the Aurora AI Empire! 🚀${NC}"
