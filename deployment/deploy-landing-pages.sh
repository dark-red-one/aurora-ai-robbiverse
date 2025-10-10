#!/bin/bash
# 🚀 DEPLOY TESTPILOT LANDING PAGES
# Deploys promotional landing pages to testpilot.ai
# Run with: sudo bash deployment/deploy-landing-pages.sh

set -e  # Exit on any error

echo "🚀 Starting TestPilot landing page deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Directories
WORKSPACE="/Users/allanperetz/aurora-ai-robbiverse"
WEB_DEPLOY_SRC="$WORKSPACE/web-deploy/landing"
WEB_ROOT="/var/www/testpilot.ai"
NGINX_CONFIG_SRC="$WORKSPACE/deployment/nginx-testpilot.conf"
NGINX_CONFIG_DEST="/etc/nginx/sites-available/testpilot"

# ============================================================================
# STEP 1: CREATE DIRECTORY STRUCTURE
# ============================================================================

echo -e "${YELLOW}📁 Step 1: Creating directory structure...${NC}"

# Create web root if it doesn't exist
if [ ! -d "$WEB_ROOT" ]; then
    mkdir -p "$WEB_ROOT"
    echo -e "${GREEN}✅ Created $WEB_ROOT${NC}"
fi

# Create landing pages directory
mkdir -p "$WEB_ROOT/landing/groceryshop"
echo -e "${GREEN}✅ Directory structure created${NC}"

# ============================================================================
# STEP 2: COPY LANDING PAGES
# ============================================================================

echo -e "${YELLOW}📦 Step 2: Copying landing page files...${NC}"

# Copy GroceryShop landing page
if [ -d "$WEB_DEPLOY_SRC/groceryshop" ]; then
    cp -r "$WEB_DEPLOY_SRC/groceryshop/"* "$WEB_ROOT/landing/groceryshop/"
    echo -e "${GREEN}✅ GroceryShop landing page copied${NC}"
else
    echo -e "${RED}❌ Source directory not found: $WEB_DEPLOY_SRC/groceryshop${NC}"
    exit 1
fi

# ============================================================================
# STEP 3: SET PERMISSIONS
# ============================================================================

echo -e "${YELLOW}🔐 Step 3: Setting permissions...${NC}"

# Set ownership to www-data
chown -R www-data:www-data "$WEB_ROOT"
echo -e "${GREEN}✅ Ownership set to www-data:www-data${NC}"

# Set directory permissions (755)
find "$WEB_ROOT" -type d -exec chmod 755 {} \;
echo -e "${GREEN}✅ Directory permissions set to 755${NC}"

# Set file permissions (644)
find "$WEB_ROOT" -type f -exec chmod 644 {} \;
echo -e "${GREEN}✅ File permissions set to 644${NC}"

# ============================================================================
# STEP 4: INSTALL NGINX CONFIGURATION
# ============================================================================

echo -e "${YELLOW}⚙️  Step 4: Installing nginx configuration...${NC}"

# Copy nginx config
if [ -f "$NGINX_CONFIG_SRC" ]; then
    cp "$NGINX_CONFIG_SRC" "$NGINX_CONFIG_DEST"
    echo -e "${GREEN}✅ Nginx config copied to sites-available${NC}"
else
    echo -e "${RED}❌ Nginx config not found: $NGINX_CONFIG_SRC${NC}"
    exit 1
fi

# Create symlink in sites-enabled
if [ ! -L "/etc/nginx/sites-enabled/testpilot" ]; then
    ln -sf "$NGINX_CONFIG_DEST" "/etc/nginx/sites-enabled/testpilot"
    echo -e "${GREEN}✅ Nginx config enabled${NC}"
else
    echo -e "${CYAN}ℹ️  Nginx config already enabled${NC}"
fi

# ============================================================================
# STEP 5: TEST NGINX CONFIGURATION
# ============================================================================

echo -e "${YELLOW}🔧 Step 5: Testing nginx configuration...${NC}"

if nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration test failed!${NC}"
    echo -e "${YELLOW}Rolling back nginx config...${NC}"
    rm -f "/etc/nginx/sites-enabled/testpilot"
    exit 1
fi

# ============================================================================
# STEP 6: RELOAD NGINX
# ============================================================================

echo -e "${YELLOW}🔄 Step 6: Reloading nginx...${NC}"

if systemctl reload nginx; then
    echo -e "${GREEN}✅ Nginx reloaded successfully${NC}"
else
    echo -e "${RED}❌ Nginx reload failed!${NC}"
    echo -e "${YELLOW}Check logs: sudo tail -f /var/log/nginx/error.log${NC}"
    exit 1
fi

# ============================================================================
# DEPLOYMENT COMPLETE
# ============================================================================

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉 LANDING PAGES DEPLOYED SUCCESSFULLY! 🎉  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📊 Deployment Summary:${NC}"
echo -e "  Web Root: ${YELLOW}$WEB_ROOT${NC}"
echo -e "  Nginx Config: ${YELLOW}$NGINX_CONFIG_DEST${NC}"
echo ""
echo -e "${CYAN}🌐 Access your landing page:${NC}"
echo -e "  ${GREEN}https://testpilot.ai/landing/groceryshop/${NC}"
echo ""
echo -e "${CYAN}📈 Test with personalization:${NC}"
echo -e "  ${YELLOW}https://testpilot.ai/landing/groceryshop/?name=Allan&company=TestPilot${NC}"
echo ""
echo -e "${CYAN}📊 View tracking stats:${NC}"
echo -e "  ${YELLOW}https://testpilot.ai/api/tracking/stats?page_filter=groceryshop${NC}"
echo -e "  ${YELLOW}https://testpilot.ai/api/tracking/recent?limit=20${NC}"
echo ""
echo -e "${CYAN}💡 Next Steps:${NC}"
echo "  1. Test the landing page in browser"
echo "  2. Verify tracking is working (check browser console)"
echo "  3. Query database: SELECT * FROM website_activity;"
echo "  4. Setup SSL if not already done: sudo certbot --nginx -d testpilot.ai"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo "  Access: sudo tail -f /var/log/nginx/testpilot-access.log"
echo "  Error:  sudo tail -f /var/log/nginx/testpilot-error.log"
echo ""

