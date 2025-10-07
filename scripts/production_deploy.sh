#!/bin/bash
# Production Deployment Script for Aurora Chat App
# Deploys to aurora.testpilot.ai

set -e

echo "🚀 Starting Production Deployment to aurora.testpilot.ai..."

# Configuration
DOMAIN="aurora.testpilot.ai"
WEB_ROOT="/var/www/aurora-chat-app"
SERVICE_NAME="aurora-chat"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Update system
print_status "Updating system packages..."
apt update -y

# Install required packages
print_status "Installing required packages..."
apt install -y nginx python3 python3-pip ufw

# Create web directory
print_status "Creating web directory..."
mkdir -p $WEB_ROOT
chown -R www-data:www-data $WEB_ROOT

# Copy application files
print_status "Copying application files..."
cp -r deployment/aurora-chat-app/* $WEB_ROOT/
chown -R www-data:www-data $WEB_ROOT
chmod +x $WEB_ROOT/server.py

# Configure nginx
print_status "Configuring nginx..."
cat > /etc/nginx/sites-available/aurora-chat << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    root $WEB_ROOT;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Enable CORS
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type";
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/aurora-chat /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
print_status "Testing nginx configuration..."
nginx -t

# Configure firewall
print_status "Configuring firewall..."
ufw allow 'Nginx Full'
ufw allow ssh
ufw --force enable

# Create systemd service
print_status "Creating systemd service..."
cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=Aurora Chat App Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$WEB_ROOT
ExecStart=/usr/bin/python3 $WEB_ROOT/server.py 8000
Restart=always
RestartSec=10
Environment=PYTHONPATH=$WEB_ROOT

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start services
print_status "Starting services..."
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME
systemctl enable nginx
systemctl restart nginx

# Configure nginx reverse proxy
print_status "Configuring nginx reverse proxy..."
cat > /etc/nginx/sites-available/aurora-chat << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Enable CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Restart nginx
systemctl restart nginx

# Check service status
print_status "Checking service status..."
systemctl is-active --quiet $SERVICE_NAME && print_success "Aurora Chat service is running" || print_error "Aurora Chat service failed to start"
systemctl is-active --quiet nginx && print_success "Nginx is running" || print_error "Nginx failed to start"

# Show status
print_status "Service Status:"
systemctl status $SERVICE_NAME --no-pager -l
echo ""
systemctl status nginx --no-pager -l

print_success "Deployment completed!"
print_status "Next steps:"
echo "1. Configure DNS: Point $DOMAIN to this server's IP address"
echo "2. Set up SSL certificate (recommended): certbot --nginx -d $DOMAIN"
echo "3. Test the application: curl http://$DOMAIN"
echo ""
print_success "Aurora Chat App is now live at: http://$DOMAIN"
