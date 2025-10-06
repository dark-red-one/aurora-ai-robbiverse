#!/bin/bash

# 🚀 AURORA AI EMPIRE MONITORING SETUP
# ====================================
# Sets up comprehensive monitoring across all nodes

echo "🚀 AURORA AI EMPIRE MONITORING SETUP"
echo "===================================="
echo ""

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed"
    echo "⚠️  Please log out and back in for Docker group permissions"
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
fi

# Create monitoring directory structure
mkdir -p monitoring/grafana/provisioning/{datasources,dashboards}
mkdir -p monitoring/alerts

# Start monitoring stack
echo "🚀 Starting monitoring stack..."
cd monitoring
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "🎉 MONITORING STACK DEPLOYED!"
echo "============================="
echo ""
echo "📊 Access URLs:"
echo "• Grafana: http://localhost:3000 (admin/robbie2025!)"
echo "• Prometheus: http://localhost:9090"
echo "• Uptime Kuma: http://localhost:3001"
echo "• cAdvisor: http://localhost:8080"
echo ""
echo "🔧 Next steps:"
echo "1. Open Grafana and import dashboards"
echo "2. Configure uptime monitoring in Uptime Kuma"
echo "3. Set up alerts for critical services"
echo ""
echo "📋 To stop monitoring: docker-compose down"
echo "📋 To view logs: docker-compose logs -f"
