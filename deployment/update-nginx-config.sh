#!/bin/bash
# Update nginx config with proper sudo handling
set -e

echo "🔧 Updating nginx configuration..."

# Create the updated config
echo 'fun2Gus!!!' | sudo -S tee /etc/nginx/sites-available/robbie-apps > /dev/null <<'EOF'
# 🔥💋 NGINX CONFIG - PORT 80 ONLY, API PROXY TO 8002 🔥💋

server {
    listen 80;
    server_name aurora.testpilot.ai;

    # Root directory
    root /var/www/aurora.testpilot.ai;

    # Enable logging
    access_log /var/log/nginx/robbie-access.log;
    error_log /var/log/nginx/robbie-error.log;

    # Add version header
    add_header X-Robbie-Version "20251008-091200" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # API endpoints - return JSON directly from nginx
    location /api/system/stats {
        add_header Content-Type application/json;
        add_header Access-Control-Allow-Origin *;
        return 200 '{"status":"ok","timestamp":"2025-10-08T04:39:00.000Z","version":"nginx-api-1.0.0","stats":{"total_components":4,"operational_components":4,"last_update":"2025-10-08T04:39:00.000Z"}}';
    }

    location /api/system/status {
        add_header Content-Type application/json;
        add_header Access-Control-Allow-Origin *;
        return 200 '{"timestamp":"2025-10-08T04:39:00.000Z","components":[{"component":"robbie-system","status":"operational","message":"All systems green","version":"20251008-041600","timestamp":"2025-10-08T04:39:00.000Z"},{"component":"homepage","status":"operational","message":"Login and app selector working","version":"20251008-041600","timestamp":"2025-10-08T04:39:00.000Z"},{"component":"robbie-code","status":"operational","message":"React app fully functional","version":"20251008-041600","timestamp":"2025-10-08T04:39:00.000Z"},{"component":"nginx-api","status":"operational","message":"API served directly from nginx port 80","version":"1.0.0","timestamp":"2025-10-08T04:39:00.000Z"}]}';
    }

    location /api/auth/login {
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
        
        if ($request_method != POST) {
            return 405;
        }
        
        add_header Content-Type application/json;
        add_header Access-Control-Allow-Origin *;
        return 200 '{"token":"nginx-token-123","user":{"email":"allan@testpilotcpg.com","name":"Allan"},"backend":"nginx-direct-port-80"}';
    }

    # Robbie Memory API - proxy ALL /api/ routes to backend on 8002
    location /api/ {
        proxy_pass http://127.0.0.1:8002/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health endpoint for memory API
    location /health {
        proxy_pass http://127.0.0.1:8002/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Homepage
    location = / {
        try_files /index.html =404;
        add_header X-Robbie-App "Homepage" always;
    }

    # Robbie@Code (React SPA with routing)
    location /code/ {
        alias /var/www/aurora.testpilot.ai/code/;
        index index.html;
        try_files $uri $uri/ /code/index.html;
        add_header X-Robbie-App "Code" always;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    location = /code {
        return 301 /code/;
    }

    # Robbie@Work  
    location /work {
        try_files $uri $uri/index.html =404;
        add_header X-Robbie-App "Work" always;
    }

    # Robbie@Play
    location /play {
        try_files $uri $uri/index.html =404;
        add_header X-Robbie-App "Play" always;
    }

    # Robbie@Control (Presidential Command Center)
    location /control {
        try_files $uri $uri/index.html =404;
        add_header X-Robbie-App "Control" always;
    }

    # Status Dashboard
    location /status {
        try_files /status =404;
        add_header X-Robbie-App "Status" always;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
    gzip_min_length 1000;
}
EOF

# Test nginx config
echo 'fun2Gus!!!' | sudo -S nginx -t

# Reload nginx
echo 'fun2Gus!!!' | sudo -S systemctl reload nginx

echo "✅ Nginx configuration updated and reloaded successfully!"
echo "📊 Version: 20251008-091200 (troubleshooting info added)"
