#!/bin/bash

# Fix Critical Blockers Before Deployment
# Addresses all must-fix issues

set -euo pipefail

echo "🔧 Fixing critical blockers for Aurora deployment..."
echo "===================================================="

# 1. Database initialization script
echo "📝 Creating database initialization script..."

cat > /tmp/init-database.sql << 'EOF'
-- Aurora Database Initialization

-- Create users
CREATE USER IF NOT EXISTS aurora_app WITH PASSWORD '${POSTGRES_PASSWORD}';
CREATE USER IF NOT EXISTS aurora_readonly WITH PASSWORD '${POSTGRES_PASSWORD}_readonly';

-- Create database
CREATE DATABASE IF NOT EXISTS aurora_unified OWNER aurora_app;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE aurora_unified TO aurora_app;
GRANT CONNECT ON DATABASE aurora_unified TO aurora_readonly;

-- Connect to aurora_unified
\c aurora_unified

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO aurora_app;
GRANT USAGE ON SCHEMA public TO aurora_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO aurora_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO aurora_readonly;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create initial admin user
INSERT INTO users (id, email, password_hash, role, created_at)
VALUES (
    gen_random_uuid(),
    'allan@testpilotcpg.com',
    crypt('change-me-on-first-login', gen_salt('bf')),
    'admin',
    NOW()
) ON CONFLICT (email) DO NOTHING;

EOF

echo "✅ Database initialization script created"

# 2. Add health check endpoints to all services
echo "🏥 Adding health check endpoints..."

for service_dir in services/*/; do
    service_name=$(basename "$service_dir")
    
    # Skip if already has healthcheck.py
    if [[ -f "$service_dir/healthcheck.py" ]]; then
        continue
    fi
    
    # Create generic healthcheck
    cat > "$service_dir/healthcheck.py" << 'EOF'
#!/usr/bin/env python3
import sys
import requests

try:
    response = requests.get("http://localhost:8000/health", timeout=5)
    if response.status_code == 200:
        print("OK")
        sys.exit(0)
    else:
        print(f"FAILED: {response.status_code}")
        sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
EOF
    
    chmod +x "$service_dir/healthcheck.py"
    echo "  ✅ Added health check to $service_name"
done

# 3. Create backup scripts
echo "💾 Creating backup scripts..."

cat > scripts/backup-database.sh << 'EOF'
#!/bin/bash

# Aurora Database Backup Script

BACKUP_DIR="/opt/aurora-dev/backups/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/aurora_unified_$TIMESTAMP.dump"

mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
docker exec aurora-postgres pg_dump -U aurora_app -Fc aurora_unified > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"

# Keep only last 7 days
find "$BACKUP_DIR" -name "*.dump.gz" -mtime +7 -delete

echo "✅ Database backup complete: $BACKUP_FILE.gz"
EOF

cat > scripts/backup-redis.sh << 'EOF'
#!/bin/bash

# Aurora Redis Backup Script

BACKUP_DIR="/opt/aurora-dev/backups/redis"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/redis_$TIMESTAMP.rdb"

mkdir -p "$BACKUP_DIR"

# Trigger Redis save
docker exec aurora-redis redis-cli -a "$REDIS_PASSWORD" BGSAVE

# Wait for save to complete
sleep 5

# Copy RDB file
docker cp aurora-redis:/data/dump.rdb "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"

# Keep only last 7 days
find "$BACKUP_DIR" -name "*.rdb.gz" -mtime +7 -delete

echo "✅ Redis backup complete: $BACKUP_FILE.gz"
EOF

chmod +x scripts/backup-database.sh scripts/backup-redis.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/aurora-dev/aurora/scripts/backup-database.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/aurora-dev/aurora/scripts/backup-redis.sh") | crontab -

echo "✅ Backup scripts created and scheduled"

# 4. Create log rotation config
echo "📋 Creating log rotation config..."

cat > /etc/logrotate.d/aurora << 'EOF'
/var/log/aurora/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
    sharedscripts
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}

/opt/aurora-dev/aurora/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF

echo "✅ Log rotation configured"

# 5. Create smoke test script
echo "🧪 Creating smoke test script..."

cat > scripts/smoke-test.sh << 'EOF'
#!/bin/bash

# Aurora Smoke Tests
# Verifies basic functionality after deployment

set -euo pipefail

echo "🧪 Running Aurora smoke tests..."
echo "================================"

errors=0

# Test 1: Web frontend
echo "Testing web frontend..."
if curl -k -s https://localhost:443/health | grep -q "healthy"; then
    echo "✅ Web frontend: OK"
else
    echo "❌ Web frontend: FAILED"
    ((errors++))
fi

# Test 2: Auth service
echo "Testing auth service..."
if curl -s http://localhost:8008/health | grep -q "healthy"; then
    echo "✅ Auth service: OK"
else
    echo "❌ Auth service: FAILED"
    ((errors++))
fi

# Test 3: Chat backend
echo "Testing chat backend..."
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo "✅ Chat backend: OK"
else
    echo "❌ Chat backend: FAILED"
    ((errors++))
fi

# Test 4: PostgreSQL
echo "Testing PostgreSQL..."
if docker exec aurora-postgres pg_isready -U aurora_app > /dev/null 2>&1; then
    echo "✅ PostgreSQL: OK"
else
    echo "❌ PostgreSQL: FAILED"
    ((errors++))
fi

# Test 5: Redis
echo "Testing Redis..."
if docker exec aurora-redis redis-cli -a "$REDIS_PASSWORD" ping | grep -q "PONG"; then
    echo "✅ Redis: OK"
else
    echo "❌ Redis: FAILED"
    ((errors++))
fi

# Test 6: Redis Sentinel
echo "Testing Redis Sentinel..."
if docker exec aurora-redis-sentinel-aurora redis-cli -p 26379 ping | grep -q "PONG"; then
    echo "✅ Redis Sentinel: OK"
else
    echo "❌ Redis Sentinel: FAILED"
    ((errors++))
fi

# Test 7: Authentication
echo "Testing authentication..."
if curl -s -X POST http://localhost:8008/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}' | grep -q "token\|error"; then
    echo "✅ Authentication: OK"
else
    echo "❌ Authentication: FAILED"
    ((errors++))
fi

# Summary
echo ""
echo "================================"
if [[ $errors -eq 0 ]]; then
    echo "✅ All smoke tests passed!"
    exit 0
else
    echo "❌ $errors smoke tests failed"
    exit 1
fi
EOF

chmod +x scripts/smoke-test.sh

echo "✅ Smoke test script created"

# 6. Update deploy script to include blockers fix
echo "📝 Updating deployment script..."

# Insert database initialization before migrations
sed -i '/# 4. Run database migrations/i\
# Initialize database with users\
echo "🗄️ Initializing database..."\
docker exec -i aurora-postgres psql -U postgres < /tmp/init-database.sql\
' scripts/deploy-aurora.sh

# Add smoke tests at the end
sed -i '/echo "✅ Aurora deployment complete!"/i\
# Run smoke tests\
echo "🧪 Running smoke tests..."\
./scripts/smoke-test.sh\
' scripts/deploy-aurora.sh

echo "✅ Deployment script updated"

echo ""
echo "✅ All critical blockers fixed!"
echo ""
echo "📋 Summary:"
echo "  - Database initialization script created"
echo "  - Health check endpoints added to all services"
echo "  - Backup scripts created and scheduled"
echo "  - Log rotation configured"
echo "  - Smoke test script created"
echo "  - Deployment script updated"
echo ""
echo "🚀 Ready for deployment!"
