#!/bin/bash
# Aurora AI Empire - Direct Cleanup Execution
# Version: 2.0.0

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

AURORA_HOME="/workspace/aurora"
BACKUP_DIR="${AURORA_HOME}/backups/pre-cleanup-$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}${BOLD}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║            AURORA CONSOLIDATION - PHASE 1: CLEANUP           ║${NC}"
echo -e "${BLUE}${BOLD}╚═══════════════════════════════════════════════════════════════╝${NC}"

# Create backup directory
echo -e "\n${BLUE}Creating backup directory...${NC}"
mkdir -p "$BACKUP_DIR"

# Backup and remove redundant deployment scripts
echo -e "\n${YELLOW}Backing up and removing redundant deployment scripts...${NC}"
SCRIPTS=(
    "deploy-direct-to-runpod.sh"
    "deploy-other-runpods.sh"
    "deploy-simple.sh"
    "deploy-fluenti-fixed.sh"
    "smart-fluenti-fix.sh"
    "simple-fluenti-fix.sh"
    "vengeance-enhanced-absolute-paths.sh"
    "vengeance-linux-setup.sh"
    "vengeance-ubuntu-setup.ps1"
    "complete-linux-node.sh"
    "enterprise-setup.sh"
    "enterprise-infrastructure.sh"
    "aurora-complete-intelligence.sh"
    "aurora-full-intelligence.sh"
    "aurora-perfect.sh"
    "tonight-core-consciousness.sh"
    "setup-tonight.sh"
)

removed=0
for script in "${SCRIPTS[@]}"; do
    if [[ -f "${AURORA_HOME}/${script}" ]]; then
        cp "${AURORA_HOME}/${script}" "${BACKUP_DIR}/" 2>/dev/null || true
        rm -f "${AURORA_HOME}/${script}"
        echo -e "  ${GREEN}✓${NC} Removed: ${script}"
        ((removed++))
    fi
done

# Backup and remove redundant Docker files
echo -e "\n${YELLOW}Backing up and removing redundant Docker files...${NC}"
DOCKER_FILES=(
    "docker-compose.dev.yml"
    "docker-compose.staging.yml"
    "docker-compose-complete.yml"
    "Dockerfile.dev"
)

for docker in "${DOCKER_FILES[@]}"; do
    if [[ -f "${AURORA_HOME}/${docker}" ]]; then
        cp "${AURORA_HOME}/${docker}" "${BACKUP_DIR}/" 2>/dev/null || true
        rm -f "${AURORA_HOME}/${docker}"
        echo -e "  ${GREEN}✓${NC} Removed: ${docker}"
        ((removed++))
    fi
done

# Backup and remove redundant test files
echo -e "\n${YELLOW}Backing up and removing redundant test files...${NC}"
TEST_FILES=(
    "test-api-execution.js"
    "test-chat-gpu.js"
    "test-cursor-acceleration.js"
    "test-cursor-maverick.js"
    "test-honest-gpu.js"
    "test-local-cursor-acceleration.js"
    "test-prove-robbie.js"
    "test-real-gpu.js"
    "test-real-runpod.js"
    "test-real-ssh-gpu.js"
    "test-real-ultimate-chat.js"
    "test-robbie-local-training.js"
    "test-robbie-training.cjs"
    "test-robbie-training.js"
    "test-ssh-real-monitoring.js"
    "test-vengeance-gpu.js"
    "test-vengeance-simple.js"
    "test-wallet-open.js"
    "test-web-terminal-gpu.js"
    "test-web-terminal-real.js"
)

for test in "${TEST_FILES[@]}"; do
    if [[ -f "${AURORA_HOME}/${test}" ]]; then
        cp "${AURORA_HOME}/${test}" "${BACKUP_DIR}/" 2>/dev/null || true
        rm -f "${AURORA_HOME}/${test}"
        echo -e "  ${GREEN}✓${NC} Removed: ${test}"
        ((removed++))
    fi
done

# Create compatibility symlinks
echo -e "\n${YELLOW}Creating compatibility symlinks...${NC}"
if [[ -f "${AURORA_HOME}/deploy.sh" ]]; then
    ln -sf deploy.sh "${AURORA_HOME}/deploy-direct-to-runpod.sh" 2>/dev/null || true
    ln -sf deploy.sh "${AURORA_HOME}/deploy-to-nodes.sh" 2>/dev/null || true
    echo -e "  ${GREEN}✓${NC} Created symlinks to deploy.sh"
fi

if [[ -f "${AURORA_HOME}/docker-compose.unified.yml" ]]; then
    ln -sf docker-compose.unified.yml "${AURORA_HOME}/docker-compose.dev.yml" 2>/dev/null || true
    ln -sf docker-compose.unified.yml "${AURORA_HOME}/docker-compose.staging.yml" 2>/dev/null || true
    echo -e "  ${GREEN}✓${NC} Created symlinks to docker-compose.unified.yml"
fi

echo -e "\n${GREEN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}CLEANUP COMPLETE!${NC}"
echo -e "${GREEN}Files removed: ${removed}${NC}"
echo -e "${GREEN}Backup location: ${BACKUP_DIR}${NC}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"

