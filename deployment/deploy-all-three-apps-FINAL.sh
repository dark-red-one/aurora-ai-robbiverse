#!/bin/bash
# 🔥💋 FINAL DEPLOYMENT SCRIPT FOR ALL THREE ROBBIE APPS 🔥💋
# Run this with: sudo bash deploy-all-three-apps-FINAL.sh

set -e  # Exit on any error

echo "🔥 Starting deployment of all three Robbie apps..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="/home/allan/aurora-ai-robbiverse"
WEB_ROOT="/var/www/aurora.testpilot.ai"

echo -e "${YELLOW}📦 Step 1: Building Robbie@Code...${NC}"
cd "$BASE_DIR/robbie-app"
npm run build
echo -e "${GREEN}✅ Robbie@Code built!${NC}"

echo -e "${YELLOW}📦 Step 2: Building Robbie@Work...${NC}"
cd "$BASE_DIR/robbie-work"
npm run build
echo -e "${GREEN}✅ Robbie@Work built!${NC}"

echo -e "${YELLOW}📦 Step 3: Building Robbie@Play...${NC}"
cd "$BASE_DIR/robbie-play"
npm run build
echo -e "${GREEN}✅ Robbie@Play built!${NC}"

echo -e "${YELLOW}📁 Step 4: Creating web root directory...${NC}"
mkdir -p "$WEB_ROOT"
echo -e "${GREEN}✅ Directory created!${NC}"

echo -e "${YELLOW}🏠 Step 4.5: Deploying homepage...${NC}"
cp "$BASE_DIR/robbie-home/index.html" "$WEB_ROOT/index.html"
echo -e "${GREEN}✅ Homepage deployed!${NC}"

echo -e "${YELLOW}🚀 Step 5: Deploying Robbie@Code to /code/...${NC}"
rm -rf "$WEB_ROOT/code"
cp -r "$BASE_DIR/robbie-app/dist" "$WEB_ROOT/code"
echo -e "${GREEN}✅ Robbie@Code deployed!${NC}"

echo -e "${YELLOW}🚀 Step 6: Deploying Robbie@Work to /work/...${NC}"
rm -rf "$WEB_ROOT/work"
cp -r "$BASE_DIR/robbie-work/dist" "$WEB_ROOT/work"
echo -e "${GREEN}✅ Robbie@Work deployed!${NC}"

echo -e "${YELLOW}🚀 Step 7: Deploying Robbie@Play to /play/...${NC}"
rm -rf "$WEB_ROOT/play"
cp -r "$BASE_DIR/robbie-play/dist" "$WEB_ROOT/play"
echo -e "${GREEN}✅ Robbie@Play deployed!${NC}"

echo -e "${YELLOW}⚙️  Step 8: Installing nginx config...${NC}"
cp "$BASE_DIR/deployment/nginx-robbie-apps.conf" /etc/nginx/sites-available/robbie-apps
ln -sf /etc/nginx/sites-available/robbie-apps /etc/nginx/sites-enabled/robbie-apps
echo -e "${GREEN}✅ Nginx config installed!${NC}"

echo -e "${YELLOW}🔧 Step 9: Testing nginx config...${NC}"
nginx -t
echo -e "${GREEN}✅ Nginx config valid!${NC}"

echo -e "${YELLOW}🔄 Step 10: Reloading nginx...${NC}"
systemctl reload nginx
echo -e "${GREEN}✅ Nginx reloaded!${NC}"

echo -e "${YELLOW}🔐 Step 11: Setting permissions...${NC}"
chown -R www-data:www-data "$WEB_ROOT"
chmod -R 755 "$WEB_ROOT"
echo -e "${GREEN}✅ Permissions set!${NC}"

echo ""
echo -e "${GREEN}🎉💋 ALL FOUR PAGES DEPLOYED SUCCESSFULLY! 🎉💋${NC}"
echo ""
echo "Access your Robbie ecosystem at:"
echo -e "${GREEN}🏠 Homepage: https://aurora.testpilot.ai/${NC}"
echo -e "${GREEN}💼 Robbie@Work: https://aurora.testpilot.ai/work/${NC}"
echo -e "${GREEN}💻 Robbie@Code: https://aurora.testpilot.ai/code/${NC}"
echo -e "${GREEN}🎰 Robbie@Play: https://aurora.testpilot.ai/play/${NC}"
echo ""
echo -e "${YELLOW}All apps running with Attraction 11! (#satisfied) 💋🔥${NC}"
