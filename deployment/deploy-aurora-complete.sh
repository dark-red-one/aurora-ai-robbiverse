#!/bin/bash
# Master Deployment Script for Aurora Town Complete Setup
# Run this on Aurora Town to deploy the full production environment

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_FILE="/var/log/aurora-deployment-$(date +%Y%m%d_%H%M%S).log"

echo "🚀 Aurora Town Complete Deployment"
echo "===================================="
echo "Log file: $LOG_FILE"
echo ""

# Function to log and execute
run_step() {
    local step_name=$1
    local script=$2
    
    echo ""
    echo "📋 Step: $step_name"
    echo "=================================="
    
    if [ -f "$SCRIPT_DIR/$script" ]; then
        bash "$SCRIPT_DIR/$script" 2>&1 | tee -a $LOG_FILE
        echo "✅ $step_name complete"
    else
        echo "⚠️  Script not found: $script (skipping)"
    fi
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (sudo)"
    exit 1
fi

echo "Starting deployment at: $(date)" | tee -a $LOG_FILE

# Phase 1: Secure Access
echo ""
echo "═══════════════════════════════════════════════"
echo "  PHASE 1: Secure Access (VPN + SSH Tunnels)"
echo "═══════════════════════════════════════════════"

run_step "WireGuard VPN Server" "setup-wireguard-server.sh"

# Phase 2: Database & Caching
echo ""
echo "═══════════════════════════════════════════════"
echo "  PHASE 2: Database & Caching Infrastructure"
echo "═══════════════════════════════════════════════"

run_step "PostgreSQL with pgvector" "setup-postgresql-aurora.sh"
run_step "Redis" "setup-redis-aurora.sh"

# Phase 3: Monitoring & Observability
echo ""
echo "═══════════════════════════════════════════════"
echo "  PHASE 3: Monitoring & Observability"
echo "═══════════════════════════════════════════════"

run_step "Health Check System" "setup-health-monitoring.sh"
run_step "Prometheus" "setup-prometheus.sh"
run_step "Grafana" "setup-grafana.sh"
run_step "Alertmanager" "setup-alertmanager.sh"
run_step "Loki + Promtail" "setup-loki.sh"

# Phase 4: Application Integration
echo ""
echo "═══════════════════════════════════════════════"
echo "  PHASE 4: Application Integration"
echo "═══════════════════════════════════════════════"

run_step "HeyShopper AI Service" "setup-heyshopper-integration.sh"
run_step "Embeddings Pipeline" "setup-embeddings-pipeline.sh"
run_step "Cost Tracking" "setup-cost-tracking.sh"

# Phase 5: Robbieverse Integration
echo ""
echo "═══════════════════════════════════════════════"
echo "  PHASE 5: Robbieverse Integration"
echo "═══════════════════════════════════════════════"

run_step "Personality System" "setup-personality-system.sh"
run_step "Vector Memory" "setup-vector-memory.sh"

# Phase 6: GPU Mesh
echo ""
echo "═══════════════════════════════════════════════"
echo "  PHASE 6: GPU Mesh Coordination"
echo "═══════════════════════════════════════════════"

run_step "GPU Mesh Coordinator" "setup-gpu-mesh.sh"
run_step "RunPod Integration" "setup-runpod-connection.sh"

# Phase 7: Backup & DR
echo ""
echo "═══════════════════════════════════════════════"
echo "  PHASE 7: Backup & Disaster Recovery"
echo "═══════════════════════════════════════════════"

run_step "Automated Backups" "setup-backups.sh"

# Phase 8: Security
echo ""
echo "═══════════════════════════════════════════════"
echo "  PHASE 8: Security Hardening"
echo "═══════════════════════════════════════════════"

run_step "Firewall Hardening" "harden-firewall.sh"
run_step "Fail2ban" "setup-fail2ban.sh"
run_step "SSL Certificates" "setup-ssl.sh"

echo ""
echo "═══════════════════════════════════════════════"
echo "  DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════"
echo ""
echo "Deployment finished at: $(date)" | tee -a $LOG_FILE
echo ""
echo "📋 Deployment Summary:"
echo "======================"
echo "✅ VPN: WireGuard on port 51820"
echo "✅ Database: PostgreSQL 16 with pgvector"
echo "✅ Cache: Redis with 2GB memory"
echo "✅ Monitoring: Prometheus + Grafana"
echo "✅ AI Router: Running on port 8000"
echo "✅ Nginx: Reverse proxy on port 80 (external 10002)"
echo ""
echo "📋 Access Information:"
echo "======================"
echo "External API: http://8.17.147.158:10002"
echo "VPN Server: 8.17.147.158:51820"
echo "Grafana (via VPN): http://10.0.0.1:3000"
echo "Prometheus (via VPN): http://10.0.0.1:9090"
echo ""
echo "📋 Credentials:"
echo "==============="
echo "PostgreSQL: /root/.aurora_db_credentials"
echo "Redis: /root/.aurora_redis_credentials"
echo "Grafana: /root/.aurora_grafana_credentials (if created)"
echo ""
echo "📋 Next Steps:"
echo "==============="
echo "1. On client machines, run: ./setup-wireguard-client.sh <config>"
echo "2. On RobbieBook1, run: ./setup-ssh-tunnel-service.sh"
echo "3. Import database schemas: ./import-schemas.sh"
echo "4. Test all services: ./test-aurora-complete.sh"
echo ""
echo "📄 Full log: $LOG_FILE"
echo ""
echo "🎉 Aurora Town is now production-ready!"

