#!/bin/bash

# Aurora Deployment Script
# One-command deployment with all missing pieces

set -euo pipefail

echo "🚀 Aurora Deployment - $(date)"
echo "=============================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   exit 1
fi

# 1. Generate environment file
echo "📝 Generating environment file..."
if [[ ! -f .env ]]; then
    cp env.example .env
    
    # Generate secure passwords
    REDIS_PASS="robbie-$(openssl rand -hex 16)"
    JWT_SECRET="jwt-$(openssl rand -hex 32)"
    
    # Update .env with generated values
    sed -i "s/your-secure-password-here/aurora-$(openssl rand -hex 8)/g" .env
    sed -i "s/robbie-\$(openssl rand -hex 16)/$REDIS_PASS/g" .env
    sed -i "s/jwt-\$(openssl rand -hex 32)/$JWT_SECRET/g" .env
    
    echo "✅ Environment file created with secure passwords"
else
    echo "✅ Environment file already exists"
fi

# 2. Generate SSL certificates
echo "🔐 Generating SSL certificates..."
./scripts/generate-ssl-certs.sh

# 3. Validate credentials
echo "🔍 Validating credentials..."
./scripts/validate-credentials.sh

# 4. Cleanup Aurora
echo "🧹 Cleaning Aurora..."
./scripts/cleanup-aurora.sh

# 5. Setup Redis Sentinel
echo "🛡️ Setting up Redis Sentinel..."
./scripts/setup-redis-sentinel.sh

# 4. Run database migrations
echo "🗄️ Running database migrations..."
docker-compose up -d postgres
sleep 10

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until docker exec aurora-postgres pg_isready -U aurora_app -d aurora_unified; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

# Run migrations
for migration in database/unified-schema/*.sql; do
    echo "Running migration: $(basename $migration)"
    docker exec -i aurora-postgres psql -U aurora_app -d aurora_unified < "$migration"
done

echo "✅ Database migrations complete"

# 5. Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# 6. Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# 7. Verify deployment
echo "🔍 Verifying deployment..."

# Check Redis Sentinel
python3 scripts/monitor-redis-sentinel.py

# Check node inventory
./bin/vengeance node-inventory check

# Check service health
echo "📊 Service Health:"
docker-compose ps

echo ""
echo "✅ Aurora deployment complete!"
echo ""
echo "🌐 Access URLs:"
echo "  - Web Interface: http://aurora-town-u44170.vm.elestio.app:3000"
echo "  - API Status: http://aurora-town-u44170.vm.elestio.app:8000/health"
echo "  - Redis Sentinel: http://aurora-town-u44170.vm.elestio.app:26379"
echo ""
echo "📋 Next steps:"
echo "1. Deploy on other nodes: docker-compose -f docker-compose-replicas.yml up -d"
echo "2. Monitor: python3 scripts/monitor-redis-sentinel.py"
echo "3. Check logs: docker-compose logs -f"
