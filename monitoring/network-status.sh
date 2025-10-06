#!/bin/bash

# 🌐 AURORA AI EMPIRE NETWORK STATUS
# ==================================
# Real-time network monitoring across all nodes

echo "🌐 AURORA AI EMPIRE NETWORK STATUS"
echo "=================================="
echo "Timestamp: $(date)"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test node
test_node() {
    local name=$1
    local host=$2
    local port=${3:-22}
    local user=${4:-root}
    
    echo -n "🔍 $name ($host:$port): "
    
    # Test ping
    if ping -c 1 -W 2 $host >/dev/null 2>&1; then
        echo -n "✅ Ping "
        
        # Test SSH
        if timeout 5 ssh -o ConnectTimeout=3 -o StrictHostKeyChecking=no $user@$host "echo 'SSH OK'" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ SSH OK${NC}"
            
            # Get system info
            echo "   📊 System Info:"
            timeout 10 ssh -o ConnectTimeout=3 $user@$host "
                echo '   CPU: \$(top -bn1 | grep 'Cpu(s)' | awk '{print \$2}' | cut -d'%' -f1)%'
                echo '   MEM: \$(free | grep Mem | awk '{printf \"%.1f%%\", \$3/\$2 * 100.0}')'
                echo '   DISK: \$(df -h / | awk 'NR==2{print \$5}')'
                echo '   UPTIME: \$(uptime -p)'
                echo '   GPU: \$(nvidia-smi --query-gpu=name,memory.used,memory.total --format=csv,noheader,nounits 2>/dev/null || echo \"No GPU\")'
            " 2>/dev/null || echo "   ⚠️  Could not get system info"
        else
            echo -e "${YELLOW}⚠️  SSH Failed${NC}"
        fi
    else
        echo -e "${RED}❌ Not Reachable${NC}"
    fi
    echo ""
}

# Test all nodes
echo "🏠 LOCAL NODES:"
echo "==============="
test_node "Aurora (Current)" "localhost" "8000" "allan"
test_node "Vengeance" "vengeance" "22" "allan"

echo "💻 ROBBIEBOOK1:"
echo "==============="
test_node "RobbieBook1" "192.199.240.226" "22" "allanperetz"

echo "☁️  RUNPOD CLOUD:"
echo "================"
test_node "RunPod Aurora" "82.221.170.242" "24505" "root"
test_node "RunPod Collaboration" "213.181.111.2" "43540" "root"
test_node "RunPod Fluenti" "103.196.86.56" "19777" "root"

echo "🔧 SERVICES STATUS:"
echo "==================="

# Check local services
echo -n "Aurora Backend (8000): "
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Down${NC}"
fi

echo -n "Aurora Auth (8001): "
if curl -s http://localhost:8001/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Down${NC}"
fi

echo -n "Prometheus (9090): "
if curl -s http://localhost:9090/-/healthy >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${YELLOW}⚠️  Not Started${NC}"
fi

echo -n "Grafana (3000): "
if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${YELLOW}⚠️  Not Started${NC}"
fi

echo ""
echo "📊 QUICK ACTIONS:"
echo "================="
echo "• Start monitoring: ./monitoring/start-monitoring.sh"
echo "• View logs: docker-compose -f monitoring/docker-compose.yml logs -f"
echo "• Stop monitoring: docker-compose -f monitoring/docker-compose.yml down"
echo "• Fix connections: ./deployment/robbiebook-connection-fix.sh"
echo ""
echo "🎯 Network Status Complete!"
