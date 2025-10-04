#!/bin/bash
# Aurora AI Empire - Unified Deployment Script
# Replaces 20+ redundant deployment scripts with one intelligent system
# Version: 2.0.0
# Date: September 19, 2025

set -euo pipefail

# ============================================
# CONFIGURATION
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Deployment configuration
DEPLOYMENT_ID=$(date +%Y%m%d_%H%M%S)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AURORA_HOME="${AURORA_HOME:-/workspace/aurora}"
LOG_FILE="${AURORA_HOME}/logs/deployment_${DEPLOYMENT_ID}.log"

# Node configurations
declare -A NODES=(
  ["aurora"]="82.221.170.242:24505:primary:2xRTX4090"
  ["collaboration"]="213.181.111.2:43540:secondary:1xRTX4090"
  ["fluenti"]="103.196.86.56:19777:marketing:1xRTX4090"
  ["vengeance"]="localhost:22:development:CPU"
  ["b200"]="TBD:TBD:training:B200"
)

# ============================================
# FUNCTIONS
# ============================================

# Logging function
log() {
  local level=$1
  shift
  local message="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  case $level in
    ERROR)   echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE" ;;
    SUCCESS) echo -e "${GREEN}[SUCCESS]${NC} $message" | tee -a "$LOG_FILE" ;;
    WARNING) echo -e "${YELLOW}[WARNING]${NC} $message" | tee -a "$LOG_FILE" ;;
    INFO)    echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$LOG_FILE" ;;
    DEBUG)   [[ "${DEBUG:-0}" == "1" ]] && echo -e "${PURPLE}[DEBUG]${NC} $message" | tee -a "$LOG_FILE" ;;
  esac
  
  echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Print banner
print_banner() {
  echo -e "${CYAN}${BOLD}"
  cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                    AURORA AI EMPIRE                          ║
║                 Unified Deployment System                    ║
║                      Version 2.0.0                          ║
╚═══════════════════════════════════════════════════════════════╝
EOF
  echo -e "${NC}"
}

# Show usage
usage() {
  cat << EOF
Usage: $0 [OPTIONS] COMMAND

COMMANDS:
  deploy [node]     Deploy to specified node(s) or all
  status [node]     Check status of node(s)
  rollback [node]   Rollback to previous deployment
  clean [node]      Clean up old deployments
  setup [node]      Initial setup for new node
  test [node]       Run health checks
  
OPTIONS:
  -e, --environment ENV    Environment (dev|staging|production) [default: production]
  -n, --node NODE         Target node(s), comma-separated
  -f, --force             Force deployment without confirmations
  -d, --debug             Enable debug output
  -b, --backup            Create backup before deployment
  -h, --help              Show this help message
  
EXAMPLES:
  $0 deploy aurora              # Deploy to aurora node
  $0 deploy --environment=dev   # Deploy to all nodes in dev mode
  $0 status                     # Check all nodes status
  $0 rollback fluenti          # Rollback fluenti to previous version
  
NODES:
  aurora         Primary node (2x RTX 4090)
  collaboration  Secondary node (1x RTX 4090)
  fluenti       Marketing node (1x RTX 4090)
  vengeance     Development node (CPU only)
  all           All configured nodes
EOF
}

# Detect environment
detect_environment() {
  if [[ -f "/workspace/.runpod" ]]; then
    echo "runpod"
  elif [[ -f "/.dockerenv" ]]; then
    echo "docker"
  elif [[ "$(uname)" == "Darwin" ]]; then
    echo "macos"
  else
    echo "linux"
  fi
}

# Check prerequisites
check_prerequisites() {
  local node=$1
  log INFO "Checking prerequisites for $node..."
  
  local required_tools=("docker" "docker-compose" "git" "curl")
  local missing_tools=()
  
  for tool in "${required_tools[@]}"; do
    if ! command -v $tool &> /dev/null; then
      missing_tools+=($tool)
    fi
  done
  
  if [[ ${#missing_tools[@]} -gt 0 ]]; then
    log ERROR "Missing required tools: ${missing_tools[*]}"
    log INFO "Installing missing tools..."
    install_prerequisites "${missing_tools[@]}"
  fi
  
  # Check disk space
  local available_space=$(df -BG "$AURORA_HOME" | awk 'NR==2 {print $4}' | sed 's/G//')
  if [[ $available_space -lt 5 ]]; then
    log WARNING "Low disk space: ${available_space}GB available"
  fi
  
  log SUCCESS "Prerequisites check completed"
}

# Install missing prerequisites
install_prerequisites() {
  local tools=("$@")
  
  for tool in "${tools[@]}"; do
    case $tool in
      docker)
        log INFO "Installing Docker..."
        curl -fsSL https://get.docker.com | sh
        ;;
      docker-compose)
        log INFO "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
          -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        ;;
      git)
        log INFO "Installing Git..."
        apt-get update && apt-get install -y git
        ;;
      curl)
        log INFO "Installing Curl..."
        apt-get update && apt-get install -y curl
        ;;
    esac
  done
}

# Get node configuration
get_node_config() {
  local node=$1
  local config="${NODES[$node]}"
  
  if [[ -z "$config" ]]; then
    log ERROR "Unknown node: $node"
    return 1
  fi
  
  IFS=':' read -r host port role gpu_config <<< "$config"
  
  echo "$host:$port:$role:$gpu_config"
}

# Create environment file
create_env_file() {
  local node=$1
  local environment=$2
  local role=$3
  local gpu_config=$4
  
  log INFO "Creating environment configuration for $node..."
  
  cat > "${AURORA_HOME}/.env.${node}" << EOF
# Aurora AI Empire - Environment Configuration
# Node: $node
# Generated: $(date)

# Node Configuration
RUNPOD_NODE=$node
AURORA_ROLE=$role
GPU_CONFIG=$gpu_config
NODE_ENV=$environment
DEPLOYMENT_ID=$DEPLOYMENT_ID

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aurora
DB_USER=aurora_app
DB_PASSWORD=$(openssl rand -base64 32)

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=$(openssl rand -base64 16)

# API Configuration
API_PORT=8000
API_HOST=0.0.0.0
API_WORKERS=4

# Security
SECRET_KEY=$(openssl rand -base64 64)
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# AI Configuration
OPENAI_API_KEY=${OPENAI_API_KEY:-your_key_here}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-your_key_here}

# Monitoring
GRAFANA_PASSWORD=$(openssl rand -base64 16)
PROMETHEUS_ENABLED=true

# Features
GPU_MESH_ENABLED=true
NATURAL_SQL_ENABLED=true
RISK_ASSESSMENT_ENABLED=true
CHARACTER_CARDS_ENABLED=true
EOF
  
  log SUCCESS "Environment file created: .env.${node}"
}

# Build application
build_application() {
  local node=$1
  local environment=$2
  
  log INFO "Building application for $node..."
  
  cd "$AURORA_HOME"
  
  # Build Docker images
  log INFO "Building Docker images..."
  docker-compose -f docker-compose.yml \
    -f docker-compose.${environment}.yml \
    --env-file .env.${node} \
    build --parallel
  
  # Build frontend assets if needed
  if [[ -d "frontend" ]]; then
    log INFO "Building frontend assets..."
    cd frontend
    npm ci --production
    npm run build
    cd ..
  fi
  
  # Build Python packages
  if [[ -f "requirements.txt" ]]; then
    log INFO "Installing Python dependencies..."
    pip install -r requirements.txt --upgrade
  fi
  
  log SUCCESS "Application built successfully"
}

# Deploy to node
deploy_to_node() {
  local node=$1
  local environment=$2
  local force=$3
  
  log INFO "Deploying to $node..."
  
  # Get node configuration
  local config=$(get_node_config "$node")
  IFS=':' read -r host port role gpu_config <<< "$config"
  
  # Check if node is reachable
  if [[ "$host" != "localhost" ]]; then
    if ! timeout 5 ssh -p "$port" -o ConnectTimeout=5 "root@$host" echo "Connected" &>/dev/null; then
      log ERROR "Cannot reach $node at $host:$port"
      return 1
    fi
  fi
  
  # Create environment file
  create_env_file "$node" "$environment" "$role" "$gpu_config"
  
  # Build application
  build_application "$node" "$environment"
  
  # Stop existing services
  log INFO "Stopping existing services..."
  docker-compose -f docker-compose.yml \
    --env-file .env.${node} \
    down --remove-orphans || true
  
  # Start new services
  log INFO "Starting services..."
  docker-compose -f docker-compose.yml \
    -f docker-compose.${environment}.yml \
    --env-file .env.${node} \
    up -d
  
  # Wait for services to be healthy
  log INFO "Waiting for services to be healthy..."
  local max_attempts=30
  local attempt=0
  
  while [[ $attempt -lt $max_attempts ]]; do
    if curl -f "http://localhost:8000/health" &>/dev/null; then
      log SUCCESS "Services are healthy!"
      break
    fi
    
    attempt=$((attempt + 1))
    log DEBUG "Health check attempt $attempt/$max_attempts"
    sleep 10
  done
  
  if [[ $attempt -eq $max_attempts ]]; then
    log ERROR "Services failed to become healthy"
    return 1
  fi
  
  # Run post-deployment tasks
  run_post_deployment "$node"
  
  log SUCCESS "Deployment to $node completed successfully!"
}

# Run post-deployment tasks
run_post_deployment() {
  local node=$1
  
  log INFO "Running post-deployment tasks for $node..."
  
  # Run database migrations
  if [[ -d "database/migrations" ]]; then
    log INFO "Running database migrations..."
    docker-compose exec -T aurora-database \
      psql -U aurora_app -d aurora -f /migrations/latest.sql
  fi
  
  # Clear caches
  log INFO "Clearing caches..."
  docker-compose exec -T aurora-redis redis-cli FLUSHDB
  
  # Warm up services
  log INFO "Warming up services..."
  curl -s "http://localhost:8000/api/v1/warmup" || true
  
  # Send notification
  if [[ -n "${SLACK_WEBHOOK:-}" ]]; then
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"✅ Aurora deployed to $node successfully!\"}" \
      "$SLACK_WEBHOOK"
  fi
  
  log SUCCESS "Post-deployment tasks completed"
}

# Check node status
check_node_status() {
  local node=$1
  
  log INFO "Checking status of $node..."
  
  local config=$(get_node_config "$node")
  IFS=':' read -r host port role gpu_config <<< "$config"
  
  echo -e "\n${BOLD}Node: $node${NC}"
  echo "  Host: $host:$port"
  echo "  Role: $role"
  echo "  GPU: $gpu_config"
  
  # Check connectivity
  if [[ "$host" != "localhost" ]]; then
    if timeout 5 ssh -p "$port" -o ConnectTimeout=5 "root@$host" echo "Connected" &>/dev/null; then
      echo -e "  Connectivity: ${GREEN}✓ Connected${NC}"
    else
      echo -e "  Connectivity: ${RED}✗ Unreachable${NC}"
      return 1
    fi
  fi
  
  # Check services
  local services=("aurora-database" "aurora-backend" "aurora-redis")
  for service in "${services[@]}"; do
    if docker ps --format "table {{.Names}}" | grep -q "$service"; then
      echo -e "  $service: ${GREEN}✓ Running${NC}"
    else
      echo -e "  $service: ${RED}✗ Not running${NC}"
    fi
  done
  
  # Check health endpoint
  if curl -f "http://localhost:8000/health" &>/dev/null; then
    echo -e "  API Health: ${GREEN}✓ Healthy${NC}"
  else
    echo -e "  API Health: ${RED}✗ Unhealthy${NC}"
  fi
}

# Rollback deployment
rollback_deployment() {
  local node=$1
  
  log INFO "Rolling back deployment on $node..."
  
  # Find previous deployment
  local backups=($(ls -t "${AURORA_HOME}/backups/aurora-backup-*.tar.gz" 2>/dev/null | head -2))
  
  if [[ ${#backups[@]} -lt 2 ]]; then
    log ERROR "No previous deployment found to rollback to"
    return 1
  fi
  
  local previous_backup="${backups[1]}"
  log INFO "Rolling back to: $previous_backup"
  
  # Stop current services
  docker-compose down --remove-orphans
  
  # Restore previous deployment
  tar -xzf "$previous_backup" -C "${AURORA_HOME}/.."
  
  # Start services
  docker-compose up -d
  
  log SUCCESS "Rollback completed successfully"
}

# Clean old deployments
clean_deployments() {
  local node=$1
  local keep_count=${2:-3}
  
  log INFO "Cleaning old deployments on $node (keeping last $keep_count)..."
  
  # Clean old backups
  local backups=($(ls -t "${AURORA_HOME}/backups/aurora-backup-*.tar.gz" 2>/dev/null))
  local to_delete=$((${#backups[@]} - keep_count))
  
  if [[ $to_delete -gt 0 ]]; then
    for ((i=keep_count; i<${#backups[@]}; i++)); do
      log INFO "Removing old backup: ${backups[$i]}"
      rm -f "${backups[$i]}"
    done
  fi
  
  # Clean Docker resources
  log INFO "Cleaning Docker resources..."
  docker system prune -af --volumes
  
  # Clean logs older than 7 days
  find "${AURORA_HOME}/logs" -type f -mtime +7 -delete
  
  log SUCCESS "Cleanup completed"
}

# ============================================
# MAIN EXECUTION
# ============================================

main() {
  # Create necessary directories
  mkdir -p "${AURORA_HOME}/logs" "${AURORA_HOME}/backups"
  
  # Parse arguments
  local environment="production"
  local target_nodes=()
  local force=0
  local backup=1
  local command=""
  
  while [[ $# -gt 0 ]]; do
    case $1 in
      -e|--environment)
        environment="$2"
        shift 2
        ;;
      -n|--node)
        IFS=',' read -ra target_nodes <<< "$2"
        shift 2
        ;;
      -f|--force)
        force=1
        shift
        ;;
      -d|--debug)
        DEBUG=1
        shift
        ;;
      -b|--no-backup)
        backup=0
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      deploy|status|rollback|clean|setup|test)
        command=$1
        shift
        if [[ $# -gt 0 && ! "$1" =~ ^- ]]; then
          target_nodes=("$1")
          shift
        fi
        ;;
      *)
        log ERROR "Unknown option: $1"
        usage
        exit 1
        ;;
    esac
  done
  
  # Default to all nodes if none specified
  if [[ ${#target_nodes[@]} -eq 0 ]]; then
    target_nodes=("aurora" "collaboration" "fluenti")
  elif [[ "${target_nodes[0]}" == "all" ]]; then
    target_nodes=("aurora" "collaboration" "fluenti")
  fi
  
  # Print banner
  print_banner
  
  # Execute command
  case $command in
    deploy)
      log INFO "Starting deployment to nodes: ${target_nodes[*]}"
      log INFO "Environment: $environment"
      
      for node in "${target_nodes[@]}"; do
        check_prerequisites "$node"
        
        if [[ $backup -eq 1 ]]; then
          log INFO "Creating backup..."
          tar -czf "${AURORA_HOME}/backups/aurora-backup-${DEPLOYMENT_ID}.tar.gz" \
            -C "${AURORA_HOME}/.." aurora/
        fi
        
        deploy_to_node "$node" "$environment" "$force"
      done
      ;;
      
    status)
      for node in "${target_nodes[@]}"; do
        check_node_status "$node"
      done
      ;;
      
    rollback)
      for node in "${target_nodes[@]}"; do
        rollback_deployment "$node"
      done
      ;;
      
    clean)
      for node in "${target_nodes[@]}"; do
        clean_deployments "$node"
      done
      ;;
      
    test)
      for node in "${target_nodes[@]}"; do
        log INFO "Running health checks for $node..."
        check_node_status "$node"
      done
      ;;
      
    *)
      log ERROR "No command specified"
      usage
      exit 1
      ;;
  esac
  
  log SUCCESS "Operation completed successfully!"
}

# Run main function
main "$@"




