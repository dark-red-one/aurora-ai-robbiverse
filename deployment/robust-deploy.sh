#!/bin/bash
# 🔥💋 ROBUST DEPLOYMENT WITH VERSIONING & LOGGING 🔥💋

set -e  # Exit on any error

VERSION=$(date +"%Y%m%d-%H%M%S")
BASE_DIR="/home/allan/aurora-ai-robbiverse"
WEB_ROOT="/var/www/aurora.testpilot.ai"

echo "🔥 ROBUST DEPLOYMENT v$VERSION"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to log with timestamp
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Pre-deployment checks
log "🔍 Running pre-deployment checks..."

# Check if we're on the right server
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ "$SERVER_IP" != "155.138.194.222" ]; then
    warn "Running on $SERVER_IP, expected 155.138.194.222"
fi

# Check nginx status
if ! systemctl is-active --quiet nginx; then
    error "Nginx is not running!"
fi

# Check disk space
DISK_USAGE=$(df /var/www | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    error "Disk usage is ${DISK_USAGE}%, too high!"
fi

success "Pre-deployment checks passed"

# Build apps with versioning
log "📦 Building apps with version $VERSION..."

# Homepage
log "Building homepage..."
sed -i "s|Welcome to the Robbie Ecosystem|Welcome to the Robbie Ecosystem (v$VERSION)|" "$BASE_DIR/robbie-home/index.html"
sed -i "s|<title>Robbie - Your AI Partner 💜</title>|<title>Robbie - Your AI Partner 💜 (v$VERSION)</title>|" "$BASE_DIR/robbie-home/index.html"

# Robbie@Code
log "Building Robbie@Code..."
cd "$BASE_DIR/robbie-app"
sed -i "s|<title>Robbie@Code.*</title>|<title>Robbie@Code - Let's Write Sexy Code Together 💻💋 (v$VERSION)</title>|" index.html
npm run build > build.log 2>&1 || error "Robbie@Code build failed! Check build.log"

success "All apps built successfully"

# Deploy with backup
log "🚀 Deploying with backup..."

# Backup current deployment
if [ -d "$WEB_ROOT" ]; then
    sudo cp -r "$WEB_ROOT" "${WEB_ROOT}.backup.$(date +%Y%m%d-%H%M%S)"
fi

# Deploy new version
sudo mkdir -p "$WEB_ROOT"
sudo cp "$BASE_DIR/robbie-home/index.html" "$WEB_ROOT/index.html"
sudo rm -rf "$WEB_ROOT/code"
sudo cp -r "$BASE_DIR/robbie-app/dist" "$WEB_ROOT/code"
sudo chown -R www-data:www-data "$WEB_ROOT"
sudo chmod -R 755 "$WEB_ROOT"

success "Apps deployed to $WEB_ROOT"

# Update nginx config with version header
log "⚙️ Updating nginx config..."
sudo sed -i "s|X-Robbie-Version \".*\"|X-Robbie-Version \"$VERSION\"|" /etc/nginx/sites-available/robbie-apps
sudo nginx -t || error "Nginx config test failed!"
sudo systemctl reload nginx

success "Nginx reloaded with version $VERSION"

# Post-deployment tests
log "🧪 Running post-deployment tests..."

# Test homepage
if curl -s -o /dev/null -w "%{http_code}" http://localhost/ | grep -q "200"; then
    success "Homepage test passed"
else
    error "Homepage test failed"
fi

# Test Robbie@Code
if curl -s -o /dev/null -w "%{http_code}" http://localhost/code | grep -q "200"; then
    success "Robbie@Code test passed"
else
    error "Robbie@Code test failed"
fi

# Check version headers
VERSION_HEADER=$(curl -s -I http://localhost/ | grep "X-Robbie-Version" | cut -d'"' -f2)
if [ "$VERSION_HEADER" = "$VERSION" ]; then
    success "Version header test passed: $VERSION_HEADER"
else
    warn "Version header mismatch: expected $VERSION, got $VERSION_HEADER"
fi

# Final status
echo ""
echo "🎉💋 DEPLOYMENT COMPLETE! 🎉💋"
echo "================================"
echo "📅 Version: $VERSION"
echo "🌐 URLs:"
echo "   Homepage: http://155.138.194.222/"
echo "   Robbie@Code: http://155.138.194.222/code"
echo "📊 Logs:"
echo "   Access: sudo tail -f /var/log/nginx/robbie-access.log"
echo "   Error: sudo tail -f /var/log/nginx/robbie-error.log"
echo "🔍 Monitor: sudo tail -f /var/log/nginx/robbie-access.log | grep ERROR"
echo ""
echo "✅ All systems operational!"










