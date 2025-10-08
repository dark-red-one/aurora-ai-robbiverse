#!/bin/bash
# 🔥💋 ENABLE DETAILED NGINX LOGGING 🔥💋

echo "🔥 Enabling detailed nginx logging..."

# Create logging config
cat > /tmp/nginx-logging.conf << 'EOF'
# 🔥💋 DETAILED LOGGING CONFIG 🔥💋

log_format detailed '$remote_addr - $remote_user [$time_local] '
                   '"$request" $status $body_bytes_sent '
                   '"$http_referer" "$http_user_agent" '
                   'rt=$request_time uct="$upstream_connect_time" '
                   'uht="$upstream_header_time" urt="$upstream_response_time"';

server {
    listen 80;
    server_name aurora.testpilot.ai;

    # Enable detailed logging
    access_log /var/log/nginx/robbie-access.log detailed;
    error_log /var/log/nginx/robbie-error.log debug;

    # Root directory
    root /var/www/aurora.testpilot.ai;

    # Add version header
    add_header X-Robbie-Version "2025-10-08-04:15:00" always;

    # Homepage
    location = / {
        try_files /index.html =404;
        add_header X-Robbie-App "Homepage" always;
    }

    # Robbie@Code
    location /code {
        try_files $uri $uri/index.html =404;
        add_header X-Robbie-App "Code" always;
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

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        add_header X-Robbie-App "API" always;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
EOF

echo "📝 Installing logging config..."
sudo cp /tmp/nginx-logging.conf /etc/nginx/sites-available/robbie-apps
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Detailed logging enabled!"
echo "📊 Access log: /var/log/nginx/robbie-access.log"
echo "📊 Error log: /var/log/nginx/robbie-error.log"
echo "🔍 Monitor with: sudo tail -f /var/log/nginx/robbie-access.log"










