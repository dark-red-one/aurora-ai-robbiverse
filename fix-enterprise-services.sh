#!/bin/bash
echo "🔧 FIXING ENTERPRISE SERVICES - MODEL HOME PERFECTION"
echo "==================================================="

# Fix Squid Proxy
echo "🦑 Starting Squid Proxy..."
squid -f /etc/squid/squid.conf -D &
sleep 2
if ps aux | grep squid | grep -v grep > /dev/null; then
    echo "✅ Squid Proxy: RUNNING"
else
    echo "❌ Squid Proxy: FAILED"
fi

# Fix HAProxy
echo "⚖️ Starting HAProxy..."
haproxy -f /etc/haproxy/haproxy.cfg -D &
sleep 2
if ps aux | grep haproxy | grep -v grep > /dev/null; then
    echo "✅ HAProxy: RUNNING"
else
    echo "❌ HAProxy: FAILED"
fi

# Fix Redis (ensure it's running)
echo "🔴 Ensuring Redis is running..."
redis-server /etc/redis/redis.conf &
sleep 2
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: RUNNING"
else
    echo "❌ Redis: FAILED"
fi

# Fix PostgreSQL (ensure it's running)
echo "🗄️ Ensuring PostgreSQL is running..."
systemctl start postgresql 2>/dev/null || service postgresql start 2>/dev/null || true
sleep 2
if psql -h localhost -U postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ PostgreSQL: RUNNING"
else
    echo "❌ PostgreSQL: FAILED"
fi

# Fix Nginx (ensure it's running)
echo "🌐 Ensuring Nginx is running..."
nginx -s reload 2>/dev/null || nginx 2>/dev/null || true
sleep 2
if ps aux | grep nginx | grep -v grep > /dev/null; then
    echo "✅ Nginx: RUNNING"
else
    echo "❌ Nginx: FAILED"
fi

# Start Consul
echo "🏛️ Starting Consul..."
consul agent -dev -bind=127.0.0.1 -client=0.0.0.0 -ui &
sleep 3
if ps aux | grep consul | grep -v grep > /dev/null; then
    echo "✅ Consul: RUNNING"
else
    echo "❌ Consul: FAILED"
fi

echo ""
echo "🏠 MODEL HOME STATUS CHECK:"
echo "=========================="
