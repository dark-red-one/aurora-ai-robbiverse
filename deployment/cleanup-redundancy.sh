#!/bin/bash
# Aurora AI Empire - Redundancy Cleanup Script
# Safely removes duplicate files after migration
# Version: 1.0.0

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
AURORA_HOME="${AURORA_HOME:-/workspace/aurora}"
BACKUP_DIR="${AURORA_HOME}/backups/pre-cleanup-$(date +%Y%m%d_%H%M%S)"
DRY_RUN=${DRY_RUN:-1}
INTERACTIVE=${INTERACTIVE:-1}

# Files to be removed (redundant deployment scripts)
REDUNDANT_SCRIPTS=(
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

# Redundant Docker files
REDUNDANT_DOCKER=(
    "docker-compose.dev.yml"
    "docker-compose.staging.yml"
    "docker-compose-complete.yml"
    "Dockerfile.dev"
)

# Old test files that are duplicates
REDUNDANT_TESTS=(
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

# Function to print banner
print_banner() {
    echo -e "${BLUE}${BOLD}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                    AURORA CLEANUP UTILITY                    ║
║                  Remove Redundant Files Safely               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Function to check file size
get_file_size() {
    local file=$1
    if [[ -f "$file" ]]; then
        du -h "$file" | cut -f1
    else
        echo "N/A"
    fi
}

# Function to backup files
backup_files() {
    echo -e "${BLUE}Creating backup at: ${BACKUP_DIR}${NC}"
    mkdir -p "$BACKUP_DIR"
    
    local backed_up=0
    local total_size=0
    
    for file in "${REDUNDANT_SCRIPTS[@]}" "${REDUNDANT_DOCKER[@]}" "${REDUNDANT_TESTS[@]}"; do
        if [[ -f "${AURORA_HOME}/${file}" ]]; then
            cp "${AURORA_HOME}/${file}" "${BACKUP_DIR}/" 2>/dev/null || true
            ((backed_up++))
        fi
    done
    
    echo -e "${GREEN}✓ Backed up ${backed_up} files${NC}"
}

# Function to analyze redundancy
analyze_redundancy() {
    echo -e "\n${YELLOW}${BOLD}REDUNDANCY ANALYSIS${NC}"
    echo "=" * 50
    
    local total_files=0
    local total_size=0
    
    echo -e "\n${YELLOW}Redundant Deployment Scripts:${NC}"
    for script in "${REDUNDANT_SCRIPTS[@]}"; do
        if [[ -f "${AURORA_HOME}/${script}" ]]; then
            local size=$(get_file_size "${AURORA_HOME}/${script}")
            echo -e "  ${RED}✗${NC} ${script} (${size})"
            ((total_files++))
        fi
    done
    
    echo -e "\n${YELLOW}Redundant Docker Configurations:${NC}"
    for docker in "${REDUNDANT_DOCKER[@]}"; do
        if [[ -f "${AURORA_HOME}/${docker}" ]]; then
            local size=$(get_file_size "${AURORA_HOME}/${docker}")
            echo -e "  ${RED}✗${NC} ${docker} (${size})"
            ((total_files++))
        fi
    done
    
    echo -e "\n${YELLOW}Redundant Test Files:${NC}"
    for test in "${REDUNDANT_TESTS[@]}"; do
        if [[ -f "${AURORA_HOME}/${test}" ]]; then
            local size=$(get_file_size "${AURORA_HOME}/${test}")
            echo -e "  ${RED}✗${NC} ${test} (${size})"
            ((total_files++))
        fi
    done
    
    echo -e "\n${BOLD}Total redundant files: ${total_files}${NC}"
    
    # Calculate total size
    local size_kb=$(find "${AURORA_HOME}" -type f \( \
        $(printf -- "-name %s -o " "${REDUNDANT_SCRIPTS[@]}" "${REDUNDANT_DOCKER[@]}" "${REDUNDANT_TESTS[@]}" | sed 's/ -o $//') \
        \) -exec du -k {} + 2>/dev/null | awk '{sum+=$1} END {print sum}')
    
    if [[ -n "$size_kb" ]]; then
        echo -e "${BOLD}Total size to free: ~${size_kb} KB${NC}"
    fi
}

# Function to remove files
remove_redundant_files() {
    local removed=0
    local failed=0
    
    echo -e "\n${YELLOW}Removing redundant files...${NC}"
    
    # Remove deployment scripts
    echo -e "\n${BLUE}Removing deployment scripts...${NC}"
    for script in "${REDUNDANT_SCRIPTS[@]}"; do
        local file="${AURORA_HOME}/${script}"
        if [[ -f "$file" ]]; then
            if [[ $DRY_RUN -eq 1 ]]; then
                echo -e "  ${YELLOW}[DRY RUN]${NC} Would remove: ${script}"
            else
                if rm "$file"; then
                    echo -e "  ${GREEN}✓${NC} Removed: ${script}"
                    ((removed++))
                else
                    echo -e "  ${RED}✗${NC} Failed to remove: ${script}"
                    ((failed++))
                fi
            fi
        fi
    done
    
    # Remove Docker files
    echo -e "\n${BLUE}Removing Docker configurations...${NC}"
    for docker in "${REDUNDANT_DOCKER[@]}"; do
        local file="${AURORA_HOME}/${docker}"
        if [[ -f "$file" ]]; then
            if [[ $DRY_RUN -eq 1 ]]; then
                echo -e "  ${YELLOW}[DRY RUN]${NC} Would remove: ${docker}"
            else
                if rm "$file"; then
                    echo -e "  ${GREEN}✓${NC} Removed: ${docker}"
                    ((removed++))
                else
                    echo -e "  ${RED}✗${NC} Failed to remove: ${docker}"
                    ((failed++))
                fi
            fi
        fi
    done
    
    # Remove test files
    echo -e "\n${BLUE}Removing redundant test files...${NC}"
    for test in "${REDUNDANT_TESTS[@]}"; do
        local file="${AURORA_HOME}/${test}"
        if [[ -f "$file" ]]; then
            if [[ $DRY_RUN -eq 1 ]]; then
                echo -e "  ${YELLOW}[DRY RUN]${NC} Would remove: ${test}"
            else
                if rm "$file"; then
                    echo -e "  ${GREEN}✓${NC} Removed: ${test}"
                    ((removed++))
                else
                    echo -e "  ${RED}✗${NC} Failed to remove: ${test}"
                    ((failed++))
                fi
            fi
        fi
    done
    
    if [[ $DRY_RUN -eq 0 ]]; then
        echo -e "\n${GREEN}${BOLD}Cleanup Summary:${NC}"
        echo -e "  Files removed: ${removed}"
        echo -e "  Failures: ${failed}"
    fi
}

# Function to create symlinks for compatibility
create_compatibility_links() {
    echo -e "\n${BLUE}Creating compatibility symlinks...${NC}"
    
    # Create symlinks to new unified scripts
    local links=(
        "deploy-direct-to-runpod.sh:deploy.sh"
        "deploy-to-nodes.sh:deploy.sh"
        "docker-compose.dev.yml:docker-compose.unified.yml"
        "docker-compose.staging.yml:docker-compose.unified.yml"
    )
    
    for link_pair in "${links[@]}"; do
        IFS=':' read -r old new <<< "$link_pair"
        
        if [[ ! -e "${AURORA_HOME}/${old}" && -e "${AURORA_HOME}/${new}" ]]; then
            if [[ $DRY_RUN -eq 1 ]]; then
                echo -e "  ${YELLOW}[DRY RUN]${NC} Would link: ${old} -> ${new}"
            else
                ln -s "${new}" "${AURORA_HOME}/${old}"
                echo -e "  ${GREEN}✓${NC} Linked: ${old} -> ${new}"
            fi
        fi
    done
}

# Main execution
main() {
    print_banner
    
    cd "$AURORA_HOME"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --execute)
                DRY_RUN=0
                shift
                ;;
            --non-interactive)
                INTERACTIVE=0
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --execute         Actually remove files (default is dry-run)"
                echo "  --non-interactive Run without prompts"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                exit 1
                ;;
        esac
    done
    
    # Analyze redundancy
    analyze_redundancy
    
    # Confirm action
    if [[ $INTERACTIVE -eq 1 ]]; then
        echo -e "\n${YELLOW}${BOLD}WARNING:${NC} This will remove redundant files from your codebase."
        echo -e "Backups will be created at: ${BACKUP_DIR}"
        
        if [[ $DRY_RUN -eq 1 ]]; then
            echo -e "\n${BLUE}This is a DRY RUN - no files will be removed.${NC}"
            echo -e "To execute removal, run: ${BOLD}$0 --execute${NC}"
        else
            echo -e "\n${RED}${BOLD}This will PERMANENTLY remove files!${NC}"
            read -p "Are you sure you want to proceed? (yes/no): " confirm
            
            if [[ "$confirm" != "yes" ]]; then
                echo -e "${YELLOW}Cleanup cancelled.${NC}"
                exit 0
            fi
        fi
    fi
    
    # Create backup if executing
    if [[ $DRY_RUN -eq 0 ]]; then
        backup_files
    fi
    
    # Remove redundant files
    remove_redundant_files
    
    # Create compatibility symlinks
    if [[ $DRY_RUN -eq 0 ]]; then
        create_compatibility_links
    fi
    
    echo -e "\n${GREEN}${BOLD}Cleanup complete!${NC}"
    
    if [[ $DRY_RUN -eq 1 ]]; then
        echo -e "${YELLOW}This was a dry run. To execute: $0 --execute${NC}"
    else
        echo -e "${GREEN}Redundant files have been removed and backed up to:${NC}"
        echo -e "${BLUE}${BACKUP_DIR}${NC}"
    fi
}

# Run main function
main "$@"



