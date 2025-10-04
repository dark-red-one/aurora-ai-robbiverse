#!/bin/bash
# RobbieVerse Synology NAS Deployment Script
# Deploy complete Aurora AI Empire to local Synology hardware

set -e

echo "🧠 DEPLOYING ROBBIEBRAIN TO SYNOLOGY NAS"
echo "========================================"

# Configuration
SYNOLOGY_IP="${SYNOLOGY_IP:-192.168.1.100}"
SYNOLOGY_USER="${SYNOLOGY_USER:-robbie}"
SYNOLOGY_PATH="/volume1/robbie"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check SSH key
    if [[ ! -f "$SSH_KEY" ]]; then
        error "SSH key not found at $SSH_KEY"
        echo "Generate with: ssh-keygen -t ed25519 -f ~/.ssh/id_rsa"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker not found. Please install Docker."
        exit 1
    fi
    
    # Check network connectivity
    if ! ping -c 1 "$SYNOLOGY_IP" &> /dev/null; then
        error "Cannot reach Synology NAS at $SYNOLOGY_IP"
        echo "Please check IP address and network connectivity"
        exit 1
    fi
    
    log "✅ Prerequisites check passed"
}

# Setup SSH access to Synology
setup_ssh_access() {
    log "Setting up SSH access to Synology..."
    
    # Copy SSH public key to Synology
    ssh-copy-id -i "$SSH_KEY.pub" "$SYNOLOGY_USER@$SYNOLOGY_IP" || {
        warn "SSH key copy failed. You may need to enable SSH in Synology DSM:"
        echo "  Control Panel → Terminal & SNMP → Enable SSH service"
        echo "  Then run: ssh-copy-id -i $SSH_KEY.pub $SYNOLOGY_USER@$SYNOLOGY_IP"
        read -p "Press Enter when SSH is configured..."
    }
    
    # Test SSH connection
    ssh -i "$SSH_KEY" "$SYNOLOGY_USER@$SYNOLOGY_IP" "echo 'SSH connection successful'" || {
        error "SSH connection failed"
        exit 1
    }
    
    log "✅ SSH access configured"
}

# Prepare Synology environment
prepare_synology() {
    log "Preparing Synology environment..."
    
    ssh -i "$SSH_KEY" "$SYNOLOGY_USER@$SYNOLOGY_IP" << 'REMOTE'
        # Create directory structure
        sudo mkdir -p /volume1/robbie/{data,logs,credentials,nginx,init}
        sudo mkdir -p /volume1/robbie/data/{postgres,redis,ollama,chroma,homeassistant,grafana,prometheus,aurora,business,documents,audio,transcripts}
        
        # Set permissions
        sudo chown -R robbie:users /volume1/robbie
        chmod -R 755 /volume1/robbie
        
        # Install Docker if not present
        if ! command -v docker &> /dev/null; then
            echo "Installing Docker on Synology..."
            # This would typically be done via Synology Package Center
            echo "Please install Docker via Package Center in DSM"
        fi
        
        echo "✅ Synology environment prepared"
REMOTE
    
    log "✅ Synology environment ready"
}

# Transfer Aurora codebase
transfer_codebase() {
    log "Transferring Aurora codebase..."
    
    # Create deployment archive
    tar -czf /tmp/aurora-synology.tgz \
        --exclude='node_modules' \
        --exclude='.venv' \
        --exclude='__pycache__' \
        --exclude='.git' \
        -C .. aurora/
    
    # Transfer to Synology
    scp -i "$SSH_KEY" /tmp/aurora-synology.tgz "$SYNOLOGY_USER@$SYNOLOGY_IP:/volume1/robbie/"
    
    # Extract on Synology
    ssh -i "$SSH_KEY" "$SYNOLOGY_USER@$SYNOLOGY_IP" << 'REMOTE'
        cd /volume1/robbie
        tar -xzf aurora-synology.tgz
        rm aurora-synology.tgz
        
        # Set up configuration
        cp aurora/synology-deployment/docker-compose.yml .
        cp -r aurora/synology-deployment/nginx ./
        cp -r aurora/synology-deployment/init ./
        
        echo "✅ Codebase transferred and extracted"
REMOTE
    
    # Clean up local archive
    rm /tmp/aurora-synology.tgz
    
    log "✅ Codebase transferred"
}

# Deploy Docker containers
deploy_containers() {
    log "Deploying Aurora containers on Synology..."
    
    ssh -i "$SSH_KEY" "$SYNOLOGY_USER@$SYNOLOGY_IP" << 'REMOTE'
        cd /volume1/robbie
        
        # Create environment file
        cat > .env << 'ENV'
POSTGRES_USER=robbie
POSTGRES_PASSWORD=RobbieSecure2025
POSTGRES_DB=robbie_local
REDIS_PASSWORD=RobbieCache2025
AURORA_API_KEY=aurora_synology_$(openssl rand -hex 16)
OLLAMA_MODELS_PATH=/volume1/robbie/data/ollama
TZ=America/Chicago
ENV
        
        # Pull images
        echo "📥 Pulling Docker images..."
        docker-compose pull
        
        # Start core services first
        echo "🚀 Starting core services..."
        docker-compose up -d postgres redis
        
        # Wait for database
        echo "⏳ Waiting for database..."
        sleep 30
        
        # Initialize database
        docker-compose exec -T postgres psql -U robbie -d robbie_local << 'SQL'
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Create core tables
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops);

-- Business intelligence tables
CREATE TABLE IF NOT EXISTS business_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    company VARCHAR(255),
    title VARCHAR(255),
    phone VARCHAR(50),
    last_contact TIMESTAMP,
    interaction_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    value DECIMAL(12,2),
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    stage VARCHAR(100),
    close_date DATE,
    contact_id UUID REFERENCES business_contacts(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS smart_home_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'online',
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    snapshot_url TEXT,
    person_identified VARCHAR(255),
    confidence DECIMAL(3,2),
    metadata JSONB DEFAULT '{}'
);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO robbie;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO robbie;

SQL
        
        # Start remaining services
        echo "🚀 Starting remaining services..."
        docker-compose up -d
        
        # Wait for services to be ready
        echo "⏳ Waiting for services to start..."
        sleep 60
        
        # Download initial models
        echo "📥 Downloading AI models..."
        docker-compose exec ollama ollama pull llama2:7b
        docker-compose exec ollama ollama pull mistral:7b
        
        echo "✅ Deployment complete!"
REMOTE
    
    log "✅ Containers deployed successfully"
}

# Configure Home Assistant
configure_home_assistant() {
    log "Configuring Home Assistant..."
    
    ssh -i "$SSH_KEY" "$SYNOLOGY_USER@$SYNOLOGY_IP" << 'REMOTE'
        # Create Home Assistant configuration
        cat > /volume1/robbie/data/homeassistant/configuration.yaml << 'YAML'
# RobbieVerse Home Assistant Configuration
default_config:

# Aurora AI Integration
rest_command:
  aurora_command:
    url: "http://aurora-backend:8000/api/v1/smart-home/command"
    method: POST
    headers:
      Authorization: "Bearer {{ states('input_text.aurora_api_key') }}"
      Content-Type: "application/json"
    payload: >
      {
        "command": "{{ command }}",
        "device": "{{ device }}",
        "value": "{{ value }}",
        "source": "home_assistant"
      }

# Ring Integration
ring:
  username: !secret ring_username
  password: !secret ring_password

# Amazon Alexa Integration
alexa:
  smart_home:

# Automation for Robbie
automation:
  - alias: "Robbie Motion Detection"
    trigger:
      platform: state
      entity_id: binary_sensor.front_door_motion
      to: 'on'
    action:
      service: rest_command.aurora_command
      data:
        command: "motion_detected"
        device: "front_door"
        
  - alias: "Robbie Arrival Detection"  
    trigger:
      platform: device_tracker
      entity_id: device_tracker.allan_phone
      to: 'home'
    action:
      - service: light.turn_on
        entity_id: light.office_lights
      - service: rest_command.aurora_command
        data:
          command: "user_arrived"
          device: "home"

# Input for Aurora API key
input_text:
  aurora_api_key:
    name: Aurora API Key
    mode: password

YAML

        # Create secrets file
        cat > /volume1/robbie/data/homeassistant/secrets.yaml << 'SECRETS'
# Ring credentials
ring_username: your_ring_email@example.com
ring_password: your_ring_password

# Aurora API
aurora_api_key: aurora_synology_key_here
SECRETS
        
        echo "✅ Home Assistant configured"
REMOTE
    
    log "✅ Home Assistant configured"
}

# Test deployment
test_deployment() {
    log "Testing deployment..."
    
    # Test Aurora backend
    if curl -s "http://$SYNOLOGY_IP:8000/health" | grep -q "healthy"; then
        log "✅ Aurora backend responding"
    else
        warn "Aurora backend not responding"
    fi
    
    # Test Home Assistant
    if curl -s "http://$SYNOLOGY_IP:8123" | grep -q "Home Assistant"; then
        log "✅ Home Assistant responding"
    else
        warn "Home Assistant not responding"
    fi
    
    # Test Ollama
    if curl -s "http://$SYNOLOGY_IP:11434/api/tags" | grep -q "models"; then
        log "✅ Ollama LLM service responding"
    else
        warn "Ollama not responding"
    fi
    
    # Test PostgreSQL
    if ssh -i "$SSH_KEY" "$SYNOLOGY_USER@$SYNOLOGY_IP" "docker-compose exec -T postgres pg_isready -U robbie" | grep -q "accepting"; then
        log "✅ PostgreSQL responding"
    else
        warn "PostgreSQL not responding"
    fi
    
    log "🎯 Deployment test complete"
}

# Display access information
show_access_info() {
    echo ""
    echo -e "${BLUE}🚀 ROBBIEBRAIN DEPLOYMENT COMPLETE!${NC}"
    echo "=================================="
    echo ""
    echo "🌐 Access URLs:"
    echo "  Aurora Backend:    http://$SYNOLOGY_IP:8000"
    echo "  Home Assistant:    http://$SYNOLOGY_IP:8123"
    echo "  Grafana Monitor:   http://$SYNOLOGY_IP:3000"
    echo "  Ollama LLM:        http://$SYNOLOGY_IP:11434"
    echo ""
    echo "🔑 Default Credentials:"
    echo "  Grafana:           admin / RobbieMonitor2025"
    echo "  PostgreSQL:        robbie / RobbieSecure2025"
    echo "  Redis:             password: RobbieCache2025"
    echo ""
    echo "📱 Next Steps:"
    echo "  1. Configure Ring credentials in Home Assistant"
    echo "  2. Set up Alexa Skills Kit with Aurora backend"
    echo "  3. Deploy widgets to Echo Show devices"
    echo "  4. Test voice commands: 'Alexa, ask Robbie...'"
    echo ""
    echo "🧠 Robbie's brain is now running locally on your NAS!"
    echo "   Ultra-low latency, complete privacy, unlimited usage."
    echo ""
}

# Main deployment flow
main() {
    log "Starting RobbieVerse Synology deployment..."
    
    check_prerequisites
    setup_ssh_access
    prepare_synology
    transfer_codebase
    deploy_containers
    configure_home_assistant
    
    log "⏳ Waiting for all services to stabilize..."
    sleep 120
    
    test_deployment
    show_access_info
    
    log "🎉 RobbieBrain deployment complete!"
}

# Handle script arguments
case "${1:-}" in
    "test")
        test_deployment
        ;;
    "clean")
        log "Cleaning up deployment..."
        ssh -i "$SSH_KEY" "$SYNOLOGY_USER@$SYNOLOGY_IP" "cd /volume1/robbie && docker-compose down -v"
        ;;
    "logs")
        ssh -i "$SSH_KEY" "$SYNOLOGY_USER@$SYNOLOGY_IP" "cd /volume1/robbie && docker-compose logs -f ${2:-aurora-backend}"
        ;;
    "status")
        ssh -i "$SSH_KEY" "$SYNOLOGY_USER@$SYNOLOGY_IP" "cd /volume1/robbie && docker-compose ps"
        ;;
    *)
        main
        ;;
esac
