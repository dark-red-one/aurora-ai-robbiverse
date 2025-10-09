#!/bin/bash

# Aurora Server Cleanup Script
# Removes accumulated cruft and optimizes for production

set -euo pipefail

echo "🧹 Aurora Server Cleanup - $(date)"
echo "=================================="

# Check current disk usage
echo "📊 Current disk usage:"
df -h
echo ""

# 1. Docker cleanup
echo "🐳 Cleaning Docker..."
docker system prune -f
docker volume prune -f
docker network prune -f
echo "✅ Docker cleanup complete"
echo ""

# 2. Log cleanup
echo "📝 Cleaning logs..."
find /var/log -name "*.log" -mtime +7 -delete 2>/dev/null || true
find /opt/aurora-dev -name "*.log" -mtime +3 -delete 2>/dev/null || true
echo "✅ Log cleanup complete"
echo ""

# 3. Temporary files
echo "🗑️ Cleaning temp files..."
rm -rf /tmp/aurora-* 2>/dev/null || true
rm -rf /opt/aurora-dev/aurora/tmp/* 2>/dev/null || true
echo "✅ Temp cleanup complete"
echo ""

# 4. Old backups
echo "💾 Cleaning old backups..."
find /opt/aurora-dev -name "*.sql" -mtime +30 -delete 2>/dev/null || true
find /opt/aurora-dev -name "*.dump" -mtime +30 -delete 2>/dev/null || true
echo "✅ Backup cleanup complete"
echo ""

# 5. Node modules cleanup
echo "📦 Cleaning node_modules..."
find /opt/aurora-dev -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
echo "✅ Node modules cleanup complete"
echo ""

# 6. Git cleanup
echo "🔧 Cleaning git repository..."
cd /opt/aurora-dev/aurora
git gc --prune=now
git remote prune origin
echo "✅ Git cleanup complete"
echo ""

# 7. Database cleanup
echo "🗄️ Optimizing database..."
docker exec aurora-postgres psql -U aurora_app -d aurora_unified -c "VACUUM ANALYZE;" 2>/dev/null || true
echo "✅ Database optimization complete"
echo ""

# Final disk usage
echo "📊 Final disk usage:"
df -h
echo ""

echo "✅ Aurora cleanup complete!"
echo "🚀 Ready for Redis Sentinel deployment"
