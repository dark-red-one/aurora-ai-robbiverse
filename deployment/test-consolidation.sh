#!/bin/bash
# Aurora AI Empire - Consolidation Test Suite
# Version: 1.0.0

set -uo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║           AURORA CONSOLIDATION - SYSTEM TEST SUITE           ║${NC}"
echo -e "${BLUE}${BOLD}╚═══════════════════════════════════════════════════════════════╝${NC}"

PASSED=0
FAILED=0

# Function to test a component
test_component() {
    local name=$1
    local test_cmd=$2
    
    echo -ne "${YELLOW}Testing ${name}...${NC} "
    
    if eval "$test_cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
    fi
}

# Test 1: Unified deployment script
test_component "Unified Deployment Script" "[[ -x /workspace/aurora/deploy.sh ]]"

# Test 2: Docker Compose configuration
test_component "Docker Compose Config" "[[ -f /workspace/aurora/docker-compose.unified.yml ]]"

# Test 3: Centralized configuration
test_component "Centralized Config System" "python3 -c 'from config.settings import Settings; Settings()' 2>/dev/null"

# Test 4: Unified JavaScript core
test_component "JavaScript Core System" "[[ -f /workspace/aurora/src/unified-systems/aurora-core.js ]]"

# Test 5: API Gateway
test_component "API Gateway Module" "[[ -f /workspace/aurora/src/unified-systems/api-gateway.js ]]"

# Test 6: Unified Dashboard
test_component "Unified Dashboard" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8081/ | grep -q '200'"

# Test 7: GPU Monitor
test_component "GPU Monitor Page" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/ | grep -q '200'"

# Test 8: Compatibility symlinks
test_component "Compatibility Links" "[[ -L /workspace/aurora/deploy-direct-to-runpod.sh ]]"

# Test 9: Backup directory
test_component "Backup Created" "[[ -d /workspace/aurora/backups/pre-cleanup-* ]] 2>/dev/null"

# Test 10: Unified database schema
test_component "Database Schema Files" "[[ -f /workspace/aurora/database/unified-schema/01-core.sql ]]"

echo -e "\n${BLUE}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}TEST RESULTS:${NC}"
echo -e "${GREEN}  Passed: ${PASSED}/10${NC}"
echo -e "${RED}  Failed: ${FAILED}/10${NC}"

if [[ $FAILED -eq 0 ]]; then
    echo -e "\n${GREEN}${BOLD}✅ ALL TESTS PASSED! Consolidation successful!${NC}"
    echo -e "${GREEN}Your Aurora AI Empire is now unified and optimized.${NC}"
else
    echo -e "\n${YELLOW}${BOLD}⚠️  Some tests failed. Review the results above.${NC}"
fi

echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════════════${NC}"

# Show running services
echo -e "\n${BLUE}${BOLD}RUNNING SERVICES:${NC}"
ps aux | grep -E "(http.server|node|python)" | grep -v grep | awk '{print "  • " $11 " " $12 " (PID: " $2 ")"}' | head -10

echo -e "\n${BLUE}${BOLD}ACCESS POINTS:${NC}"
echo -e "  ${GREEN}• GPU Monitor:${NC} http://82.221.170.242:8080/"
echo -e "  ${GREEN}• Unified Dashboard:${NC} http://localhost:8081/"
echo -e "  ${GREEN}• API Gateway:${NC} http://localhost:3000/"

exit $FAILED
