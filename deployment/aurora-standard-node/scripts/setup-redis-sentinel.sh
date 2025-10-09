#!/bin/bash

# Redis Sentinel Setup Script
# Configures Redis Sentinel cluster for Aurora mesh

set -euo pipefail

echo "🚀 Setting up Redis Sentinel cluster for Aurora mesh..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   exit 1
fi

# Create necessary directories
mkdir -p config logs

# Set permissions
chmod +x scripts/*.py
chmod +x scripts/*.sh

# Generate Redis password if not set
if [[ -z "${REDIS_PASSWORD:-}" ]]; then
    export REDIS_PASSWORD="robbie-$(openssl rand -hex 16)"
    echo "🔐 Generated Redis password: $REDIS_PASSWORD"
    echo "export REDIS_PASSWORD=\"$REDIS_PASSWORD\"" >> .env
fi

# Generate JWT secret if not set
if [[ -z "${JWT_SECRET:-}" ]]; then
    export JWT_SECRET="jwt-$(openssl rand -hex 32)"
    echo "🔐 Generated JWT secret: $JWT_SECRET"
    echo "export JWT_SECRET=\"$JWT_SECRET\"" >> .env
fi

# Update Sentinel configurations with passwords
echo "📝 Updating Sentinel configurations..."

# Aurora Sentinel
sed -i "s/\${REDIS_PASSWORD}/$REDIS_PASSWORD/g" config/sentinel-aurora.conf

# Star Sentinel  
sed -i "s/\${REDIS_PASSWORD}/$REDIS_PASSWORD/g" config/sentinel-star.conf

# Vengeance Sentinel
sed -i "s/\${REDIS_PASSWORD}/$REDIS_PASSWORD/g" config/sentinel-vengeance.conf

echo "✅ Sentinel configurations updated"

# Start Redis and Sentinel services
echo "🚀 Starting Redis and Sentinel services..."

# Start Redis master (Aurora only)
if [[ "${NODE_NAME:-}" == "aurora" ]]; then
    echo "Starting Redis master on Aurora..."
    docker-compose up -d redis redis-sentinel-aurora redis-sentinel-star redis-sentinel-vengeance
else
    echo "Starting Redis replica on ${NODE_NAME:-unknown}..."
    docker-compose -f docker-compose-replicas.yml up -d
fi

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Test Sentinel connection
echo "🔍 Testing Sentinel connection..."
python3 scripts/monitor-redis-sentinel.py

# Create monitoring cron job
echo "📅 Setting up monitoring cron job..."
(crontab -l 2>/dev/null; echo "*/5 * * * * cd $(pwd) && python3 scripts/monitor-redis-sentinel.py >> logs/sentinel-monitor.log 2>&1") | crontab -

echo "✅ Redis Sentinel setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy on Aurora: docker-compose up -d"
echo "2. Deploy on other nodes: docker-compose -f docker-compose-replicas.yml up -d"
echo "3. Monitor: python3 scripts/monitor-redis-sentinel.py"
echo "4. Check logs: tail -f logs/sentinel-monitor.log"
echo ""
echo "🔐 Credentials saved to .env file"
echo "📊 Monitor with: ./bin/vengeance node-inventory check"
