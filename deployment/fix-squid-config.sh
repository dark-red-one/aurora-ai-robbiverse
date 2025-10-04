#!/bin/bash
echo "🦑 FIXING SQUID CONFIGURATION..."

# Create proper Squid configuration
cat > /etc/squid/squid.conf << 'SQUIDEOF'
# Aurora AI Empire - Squid Proxy Configuration
# Fixed configuration for model home

http_port 3128
cache_dir ufs /var/spool/squid 10000 16 256
access_log /var/log/squid/access.log squid
cache_log /var/log/squid/cache.log

# ACLs for Aurora AI Empire
acl aurora_networks src 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16
acl aurora_ports port 80 443 8000 8001 8002 3000 5432 6379
acl aurora_methods method GET POST PUT DELETE HEAD OPTIONS

# Allow Aurora AI Empire traffic
http_access allow aurora_networks aurora_ports aurora_methods
http_access deny all

# Cache configuration for AI workloads
cache_mem 2048 MB
maximum_object_size 100 MB
maximum_object_size_in_memory 10 MB

# Performance tuning
refresh_pattern ^ftp: 1440 20% 10080
refresh_pattern ^gopher: 1440 0% 1440
refresh_pattern -i (/cgi-bin/|\?) 0 0% 0
refresh_pattern . 0 20% 4320

# Logging
access_log daemon:/var/log/squid/access.log squid
cache_log /var/log/squid/cache.log
SQUIDEOF

# Create cache directory
mkdir -p /var/spool/squid
chown proxy:proxy /var/spool/squid

# Initialize cache
squid -z

# Start Squid
squid -f /etc/squid/squid.conf &

echo "✅ Squid configuration fixed and started!"
