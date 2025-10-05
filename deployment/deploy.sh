#!/bin/bash

# Aurora AI Empire - Unified Deployment Script
# Replaces 100+ individual deployment scripts with one streamlined approach

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_LOG="$PROJECT_ROOT/deployment.log"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$DEPLOY_LOG"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$DEPLOY_LOG"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$DEPLOY_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$DEPLOY_LOG"
}

# Check if we're in the right directory
if [[ ! -f "$PROJECT_ROOT/README.md" ]]; then
    error "Please run this script from the aurora-ai-robbiverse directory"
fi

# Main deployment function
deploy() {
    local target="${1:-aurora-town}"
    local environment="${2:-production}"

    log "🚀 Starting Aurora AI Empire deployment to $target ($environment)"

    # Pre-deployment checks
    check_requirements

    # Environment-specific deployment
    case "$target" in
        "aurora-town")
            deploy_aurora_town "$environment"
            ;;
        "runpod")
            deploy_runpod "$environment"
            ;;
        "local")
            deploy_local "$environment"
            ;;
        *)
            error "Unknown deployment target: $target"
            ;;
    esac

    success "✅ Aurora AI Empire deployment completed successfully!"
    log "📋 Deployment log saved to: $DEPLOY_LOG"
}

# Check system requirements
check_requirements() {
    log "🔍 Checking deployment requirements..."

    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        warning "Docker not found - some features may not work"
    else
        success "Docker available"
    fi

    # Check if git is available
    if ! command -v git &> /dev/null; then
        error "Git is required for deployment"
    else
        success "Git available"
    fi

    # Check if we're in a git repository
    if [[ ! -d .git ]]; then
        warning "Not in a git repository - proceeding anyway"
    fi
}

# Deploy to Aurora Town (primary production server)
deploy_aurora_town() {
    local environment="$1"

    log "🏰 Deploying to Aurora Town..."

    # Update system
    log "📦 Updating system packages..."
    ssh root@aurora-town "apt update && apt upgrade -y"

    # Deploy application
    log "🚀 Deploying Aurora application..."
    scp -r "$PROJECT_ROOT" root@aurora-town:/opt/aurora-ai-empire/

    # Restart services
    log "🔄 Restarting Aurora services..."
    ssh root@aurora-town "systemctl restart aurora-unified aurora-backend"

    # Run health checks
    log "🏥 Running health checks..."
    ssh root@aurora-town "curl -f http://localhost:8000/health || exit 1"

    success "Aurora Town deployment completed"
}

# Deploy to RunPod (GPU nodes)
deploy_runpod() {
    local environment="$1"

    log "🖥️ Deploying to RunPod GPU nodes..."

    # Connect to GPU mesh
    log "🔗 Connecting to GPU mesh..."
    "$PROJECT_ROOT/deployment/connect-gpu-nodes.sh"

    # Deploy GPU workloads
    log "⚡ Deploying GPU workloads..."
    ssh root@runpod-gpu "docker pull aurora-ai-empire:latest && docker run -d aurora-ai-empire"

    success "RunPod deployment completed"
}

# Deploy locally for development
deploy_local() {
    local environment="$1"

    log "💻 Deploying locally for development..."

    # Start local services
    log "🐳 Starting Docker containers..."
    docker-compose up -d

    # Run database migrations
    log "🗄️ Running database migrations..."
    python manage.py migrate

    # Start application
    log "🚀 Starting application..."
    python manage.py runserver 0.0.0.0:8000

    success "Local deployment completed"
}

# Show usage information
usage() {
    echo "Aurora AI Empire - Unified Deployment Script"
    echo ""
    echo "Usage: $0 [target] [environment]"
    echo ""
    echo "Targets:"
    echo "  aurora-town    Deploy to Aurora Town (primary server)"
    echo "  runpod         Deploy to RunPod GPU nodes"
    echo "  local          Deploy locally for development"
    echo ""
    echo "Environments:"
    echo "  production     Production deployment (default)"
    echo "  staging        Staging deployment"
    echo "  development    Development deployment"
    echo ""
    echo "Examples:"
    echo "  $0                    # Deploy to aurora-town production"
    echo "  $0 runpod production  # Deploy to RunPod production"
    echo "  $0 local development  # Deploy locally for development"
}

# Main script logic
main() {
    case "${1:-}" in
        "help"|"-h"|"--help")
            usage
            exit 0
            ;;
        *)
            deploy "$1" "$2"
            ;;
    esac
}

main "$@"