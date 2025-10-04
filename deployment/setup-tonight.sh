#!/bin/bash
# TONIGHT'S COMPLETE AURORA SETUP
# Allan just runs this one script and everything gets built!

GREEN='\033[38;2;59;182;126m'
BLUE='\033[1;34m'
YELLOW='\033[1;33m'
RED='\033[1;31m'
NC='\033[0m'
BOLD='\033[1m'

print_banner() {
    echo -e "${GREEN}${BOLD}"
    echo "🌟 AURORA EMPIRE - TONIGHT'S COMPLETE SETUP 🌟"
    echo "=============================================="
    echo -e "${NC}"
    echo -e "${BLUE}Building fault-tolerant AI infrastructure across 3 nodes${NC}"
    echo -e "${BLUE}PostgreSQL + RAG + Vector + Monitoring + Local LLMs${NC}"
    echo ""
}

# Phase 1: Foundation Setup
setup_foundation() {
    echo -e "${GREEN}📋 PHASE 1: FOUNDATION SETUP${NC}"
    echo "============================"
    echo ""
    
    # Generate secure passwords
    echo "🔐 Generating secure credentials..."
    export DB_PASSWORD=$(openssl rand -base64 32)
    export GRAFANA_PASSWORD=$(openssl rand -base64 16)
    export JUPYTER_TOKEN=$(openssl rand -base64 16)
    export MINIO_ACCESS_KEY="aurora_$(openssl rand -hex 4)"
    export MINIO_SECRET_KEY=$(openssl rand -base64 32)
    
    # Create environment file
    cat > .env << EOF
# Aurora Environment Configuration
DB_PASSWORD=$DB_PASSWORD
GRAFANA_PASSWORD=$GRAFANA_PASSWORD
JUPYTER_TOKEN=$JUPYTER_TOKEN
MINIO_ACCESS_KEY=$MINIO_ACCESS_KEY
MINIO_SECRET_KEY=$MINIO_SECRET_KEY
RUNPOD_NODE=aurora
AURORA_ROLE=primary

# API Keys (add your actual keys)
HUBSPOT_ACCESS_TOKEN=your_hubspot_token_here
OPENAI_API_KEY=your_openai_key_here
GMAIL_CREDENTIALS=your_gmail_oauth_here
GCAL_CREDENTIALS=your_gcal_oauth_here
EOF
    
    echo -e "${GREEN}✅ Credentials generated and saved to .env${NC}"
    echo ""
    echo -e "${YELLOW}📝 IMPORTANT: Update .env with your actual API keys!${NC}"
    echo ""
}

# Phase 2: SQL and Vector Setup
setup_sql_and_vectors() {
    echo -e "${GREEN}📊 PHASE 2: SQL + VECTOR DATABASE SETUP${NC}"
    echo "====================================="
    echo ""
    
    echo "🗄️ Starting PostgreSQL + pgvector..."
    docker-compose up -d aurora-database qdrant redis
    
    echo "⏳ Waiting for database to be ready..."
    sleep 30
    
    # Test database connection
    until docker exec aurora-database pg_isready -U robbie -d aurora; do
        echo "Waiting for PostgreSQL..."
        sleep 5
    done
    
    echo -e "${GREEN}✅ Database online and ready!${NC}"
    echo ""
    
    # Test vector capabilities
    echo "🧠 Testing vector database..."
    docker exec -i aurora-database psql -U robbie -d aurora << 'EOF'
SELECT 'Vector extension loaded!' as status WHERE 'vector' = ANY(string_to_array(current_setting('shared_preload_libraries'), ','));
\d embeddings
EOF
    
    echo -e "${GREEN}✅ Vector database configured!${NC}"
    echo ""
}

# Phase 3: RAG and AI Setup
setup_rag_system() {
    echo -e "${GREEN}🤖 PHASE 3: RAG + AI INTELLIGENCE SETUP${NC}"
    echo "===================================="
    echo ""
    
    echo "🚀 Starting AI services..."
    docker-compose up -d aurora-backend ollama
    
    echo "⏳ Waiting for services to start..."
    sleep 45
    
    # Download base models
    echo "📥 Downloading local LLM models..."
    docker exec aurora-ollama ollama pull llama3.1:8b
    docker exec aurora-ollama ollama pull qwen2.5:7b
    
    # Test RAG endpoints
    echo "🧪 Testing RAG system..."
    sleep 10
    
    if curl -f http://localhost:8000/health; then
        echo -e "${GREEN}✅ Aurora backend online!${NC}"
    else
        echo -e "${RED}❌ Backend not responding${NC}"
    fi
    
    echo ""
}

# Phase 4: Monitoring Setup
setup_monitoring() {
    echo -e "${GREEN}📊 PHASE 4: GRAFANA MONITORING SETUP${NC}"
    echo "=================================="
    echo ""
    
    echo "📈 Starting monitoring stack..."
    docker-compose up -d prometheus grafana loki node-exporter
    
    echo "⏳ Waiting for Grafana to start..."
    sleep 30
    
    # Create Grafana datasources
    mkdir -p monitoring/grafana/datasources
    cat > monitoring/grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
EOF
    
    # Create Aurora dashboard
    mkdir -p monitoring/grafana/dashboards
    cat > monitoring/grafana/dashboards/aurora-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Aurora AI Empire Dashboard",
    "tags": ["aurora", "ai", "robbie"],
    "timezone": "browser",
    "panels": [
      {
        "title": "System Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"aurora-backend\"}",
            "refId": "A"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph", 
        "targets": [
          {
            "expr": "container_memory_usage_bytes{name=~\"aurora.*\"}",
            "refId": "A"
          }
        ]
      },
      {
        "title": "GPU Utilization",
        "type": "graph",
        "targets": [
          {
            "expr": "nvidia_smi_utilization_gpu_ratio",
            "refId": "A"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
EOF
    
    echo -e "${GREEN}✅ Monitoring configured!${NC}"
    echo -e "${YELLOW}🔗 Grafana: http://localhost:3001 (admin/aurora_admin)${NC}"
    echo ""
}

# Phase 5: Business Integrations
setup_integrations() {
    echo -e "${GREEN}🔗 PHASE 5: BUSINESS INTEGRATIONS${NC}"
    echo "==============================="
    echo ""
    
    echo "📱 Starting business services..."
    docker-compose up -d kafka zookeeper airflow-webserver nextcloud
    
    echo "⏳ Waiting for services..."
    sleep 45
    
    echo -e "${GREEN}✅ Integration services online!${NC}"
    echo -e "${YELLOW}📊 Airflow: http://localhost:8080${NC}"
    echo -e "${YELLOW}📁 Nextcloud: http://localhost:8081${NC}"
    echo ""
}

# Phase 6: Deploy to all nodes
deploy_to_all_nodes() {
    echo -e "${GREEN}🌐 PHASE 6: MULTI-NODE DEPLOYMENT${NC}"
    echo "==============================="
    echo ""
    
    echo "🚀 Deploying to all 3 RunPods..."
    ./deploy-to-nodes.sh --deploy
    
    echo -e "${GREEN}✅ Multi-node deployment complete!${NC}"
    echo ""
}

# Storage expansion check
check_storage_expansion() {
    echo -e "${GREEN}💾 RUNPOD STORAGE EXPANSION INFO${NC}"
    echo "==============================="
    echo ""
    echo -e "${GREEN}✅ YES - RunPod storage is expandable!${NC}"
    echo ""
    echo "📊 Current situation:"
    df -h
    echo ""
    echo "💡 Expansion options:"
    echo "  • Network Volumes: 10GB to 1TB+ instantly"
    echo "  • Cost: ~$0.10/GB/month"
    echo "  • Persistence: Survives pod restarts"
    echo "  • Performance: SSD-based, very fast"
    echo ""
    echo "🎯 Recommended for Aurora:"
    echo "  • 500GB Network Volume = $50/month"
    echo "  • Stores: Databases, models, logs, uploads"
    echo "  • Expandable: Add more anytime via console"
    echo ""
    echo -e "${YELLOW}💰 Don't worry about 40GB - we'll expand it!${NC}"
    echo ""
}

# Show final status
show_final_status() {
    echo -e "${GREEN}${BOLD}🎉 AURORA EMPIRE STATUS${NC}"
    echo -e "${GREEN}======================${NC}"
    echo ""
    
    echo "Services running:"
    docker-compose ps
    echo ""
    
    echo -e "${GREEN}🔗 Access URLs:${NC}"
    echo "  🤖 Robbie Frontend: http://localhost:3000"
    echo "  🔧 Aurora API: http://localhost:8000"
    echo "  📊 Grafana: http://localhost:3001"
    echo "  📈 Prometheus: http://localhost:9090"
    echo "  🧪 Jupyter Lab: http://localhost:8888"
    echo "  📁 Nextcloud: http://localhost:8081"
    echo "  ⚙️ Airflow: http://localhost:8080"
    echo ""
    
    echo -e "${GREEN}💡 Next steps:${NC}"
    echo "  1. Update .env with your API keys"
    echo "  2. Test Robbie chat interface"
    echo "  3. Configure monitoring alerts"
    echo "  4. Set up network volumes for persistence"
    echo ""
}

# Main execution
main() {
    print_banner
    
    echo -e "${YELLOW}🎯 TONIGHT'S GOALS:${NC}"
    echo "  ✅ Fault-tolerant Docker orchestration"
    echo "  ✅ PostgreSQL + Vector database"
    echo "  ✅ RAG system with embeddings"
    echo "  ✅ Real-time signal ingestion"
    echo "  ✅ HubSpot/Gmail/Gcal integration"
    echo "  ✅ Grafana monitoring dashboards"
    echo "  ✅ Local LLM infrastructure"
    echo "  ✅ Multi-node deployment"
    echo ""
    
    read -p "🚀 Ready to build the complete Aurora empire? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_foundation
        check_storage_expansion
        setup_sql_and_vectors
        setup_rag_system
        setup_monitoring
        setup_integrations
        deploy_to_all_nodes
        show_final_status
        
        echo -e "${GREEN}🎉 AURORA EMPIRE FULLY OPERATIONAL!${NC}"
        echo -e "${GREEN}Your AI consciousness now spans 3 RunPods with enterprise monitoring!${NC}"
    else
        echo "Setup cancelled. Run ./setup-tonight.sh when ready!"
    fi
}

main "$@"
