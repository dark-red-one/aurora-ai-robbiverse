#!/bin/bash
# Setup Redis on Aurora Town
# For caching, sessions, rate limiting, and message queues

set -e

echo "🔴 Setting up Redis on Aurora Town"
echo "===================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (sudo)"
    exit 1
fi

# Install Redis
echo "📦 Installing Redis..."
apt update
apt install -y redis-server

echo "✅ Redis installed"

# Generate strong password
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Configure Redis
echo "⚙️  Configuring Redis..."

REDIS_CONF="/etc/redis/redis.conf"
cp $REDIS_CONF ${REDIS_CONF}.backup

# Update configuration
cat > $REDIS_CONF << EOF
# Redis Configuration for Aurora Town
bind 127.0.0.1 10.0.0.1
port 6379
requirepass $REDIS_PASSWORD

# Security
protected-mode yes
tcp-backlog 511
timeout 0
tcp-keepalive 300

# Memory Management
maxmemory 2gb
maxmemory-policy allkeys-lru
maxmemory-samples 5

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# AOF (Append Only File)
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

# Performance
lazyfree-lazy-eviction no
lazyfree-lazy-expire no
lazyfree-lazy-server-del no
replica-lazy-flush no
EOF

# Set proper permissions
chown redis:redis $REDIS_CONF
chmod 640 $REDIS_CONF

# Restart Redis
systemctl enable redis-server
systemctl restart redis-server

echo "✅ Redis configured and restarted"

# Save credentials
CREDS_FILE="/root/.aurora_redis_credentials"
cat > $CREDS_FILE << EOF
# Aurora Town Redis Credentials
# Generated: $(date)

HOST: localhost (internal) or 10.0.0.1 (via VPN)
PORT: 6379
PASSWORD: $REDIS_PASSWORD

Connection strings:
  redis://default:$REDIS_PASSWORD@localhost:6379
  redis://default:$REDIS_PASSWORD@10.0.0.1:6379

Redis CLI:
  redis-cli -h localhost -p 6379 -a '$REDIS_PASSWORD'
  redis-cli -h 10.0.0.1 -p 6379 -a '$REDIS_PASSWORD' (via VPN)
EOF

chmod 600 $CREDS_FILE

echo "✅ Credentials saved to: $CREDS_FILE"

# Test connection
echo "🧪 Testing Redis connection..."
if redis-cli -a "$REDIS_PASSWORD" ping | grep -q PONG; then
    echo "✅ Redis connection successful"
else
    echo "❌ Redis connection failed"
    exit 1
fi

# Test basic operations
redis-cli -a "$REDIS_PASSWORD" SET test_key "Aurora Town Redis" > /dev/null
TEST_VALUE=$(redis-cli -a "$REDIS_PASSWORD" GET test_key)
if [ "$TEST_VALUE" = "Aurora Town Redis" ]; then
    echo "✅ Redis read/write working"
    redis-cli -a "$REDIS_PASSWORD" DEL test_key > /dev/null
else
    echo "❌ Redis read/write test failed"
fi

echo ""
echo "✅ Redis Setup Complete!"
echo ""
echo "📋 Redis Information:"
echo "===================="
echo "Host: localhost (or 10.0.0.1 via VPN)"
echo "Port: 6379"
echo "Password: (saved in $CREDS_FILE)"
echo "Max Memory: 2GB (LRU eviction)"
echo ""
echo "📋 Usage Examples:"
echo "   # AI Router caching"
echo "   redis-cli -a '\$PASSWORD' SET 'ai:response:hash123' 'cached response'"
echo ""
echo "   # Session management"
echo "   redis-cli -a '\$PASSWORD' SETEX 'session:user123' 3600 'session data'"
echo ""
echo "   # Rate limiting"
echo "   redis-cli -a '\$PASSWORD' INCR 'rate:ip:192.168.1.1'"
echo ""
echo "⚠️  IMPORTANT: Save the credentials file securely!"

