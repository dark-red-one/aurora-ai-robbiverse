#!/bin/bash
echo "⚖️ FIXING HAPROXY CONFIGURATION..."

# Create SSL certificate for HAProxy
mkdir -p /etc/ssl/certs
openssl req -x509 -newkey rsa:4096 -keyout /etc/ssl/certs/aurora.key -out /etc/ssl/certs/aurora.pem -days 365 -nodes -subj "/C=US/ST=CA/L=San Francisco/O=Aurora AI Empire/CN=aurora.local"

# Create proper HAProxy configuration
cat > /etc/haproxy/haproxy.cfg << 'HAPROXYEOF'
# Aurora AI Empire - HAProxy Configuration
# Fixed configuration for model home

global
    daemon
    user haproxy
    group haproxy
    log 127.0.0.1:514 local0
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s

defaults
    mode http
    log global
    option httplog
    option dontlognull
    option log-health-checks
    option forwardfor
    option httpchk GET /health
    timeout connect 5000
    timeout client 50000
    timeout server 50000

# Aurora AI Backend
frontend aurora_frontend
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/aurora.pem
    redirect scheme https if !{ ssl_fc }
    default_backend aurora_backend

backend aurora_backend
    balance roundrobin
    option httpchk GET /health
    server aurora1 127.0.0.1:8000 check
    server aurora2 127.0.0.1:8001 check backup

# Stats page
frontend stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 30s
HAPROXYEOF

# Start HAProxy
haproxy -f /etc/haproxy/haproxy.cfg &

echo "✅ HAProxy configuration fixed and started!"
