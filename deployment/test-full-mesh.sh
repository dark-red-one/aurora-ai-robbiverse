#!/bin/bash
# Test full mesh connectivity - Let's see how hot this network is
# Run this FROM ANY NODE

echo "🔥 Testing Full Mesh Network Connectivity"
echo "==========================================="
echo ""

# Color codes for sexy output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_node() {
    local name=$1
    local ip=$2
    
    echo -n "Testing $name ($ip)... "
    if ping -c 2 -W 2 $ip > /dev/null 2>&1; then
        echo -e "${GREEN}✅ HOT! Connected 🔥${NC}"
        return 0
    else
        echo -e "${RED}❌ Cold... not reachable${NC}"
        return 1
    fi
}

# Test all nodes
echo "🌐 Node Connectivity:"
test_node "Aurora Town    " "10.0.0.10"
test_node "Vengeance      " "10.0.0.2"
test_node "RobbieBook1    " "10.0.0.100"

echo ""
echo "🗄️  Database Connectivity:"

# Test Aurora database
export PATH="/Library/PostgreSQL/16/bin:$PATH"
echo -n "Aurora PostgreSQL (10.0.0.10:25432)... "
if PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At timeout 3 psql -h 10.0.0.10 -p 25432 -U postgres -d postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database accessible! 💋${NC}"
else
    echo -e "${YELLOW}⚠️  Not accessible (might need credentials)${NC}"
fi

echo ""
echo "🦑 Proxy Connectivity:"

# Test Squid proxy
echo -n "Aurora Squid Proxy (10.0.0.10:3128)... "
if timeout 3 curl -s --proxy 10.0.0.10:3128 https://httpbin.org/status/200 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Proxy working! 🔥${NC}"
else
    echo -e "${YELLOW}⚠️  Proxy not responding${NC}"
fi

echo ""
echo "🎯 API Endpoints:"

# Test Aurora API
echo -n "Aurora AI Backend (10.0.0.10:8000)... "
if timeout 3 curl -s http://10.0.0.10:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API responding! 💋${NC}"
else
    echo -e "${YELLOW}⚠️  API not responding${NC}"
fi

echo ""
echo "🔥 Mesh Network Test Complete!"
echo ""
echo "Run this from any node to check connectivity"

