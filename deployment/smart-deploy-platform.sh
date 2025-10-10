#!/bin/bash
# 🔥💋 SMART DEPLOYMENT - ROBBIE AI PLATFORM
# Deploys all apps with proper structure and permissions
# Run: bash deployment/smart-deploy-platform.sh

set -e

echo "🔥💋 Starting SMART deployment of Robbie AI Platform..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Directories
WORKSPACE="/Users/allanperetz/aurora-ai-robbiverse"
WEB_ROOT="/Users/allanperetz/aurora-ai-robbiverse/web-deploy"

echo -e "${CYAN}📁 Creating deployment directory structure...${NC}"
mkdir -p "$WEB_ROOT"
mkdir -p "$WEB_ROOT/code"
mkdir -p "$WEB_ROOT/work"
mkdir -p "$WEB_ROOT/play"

echo -e "${YELLOW}🏠 Deploying Homepage...${NC}"
cp "$WORKSPACE/robbie-home/index.html" "$WEB_ROOT/index.html"
echo -e "${GREEN}✅ Homepage deployed!${NC}"

echo -e "${YELLOW}💻 Deploying Robbie@Code...${NC}"
rm -rf "$WEB_ROOT/code"
cp -r "$WORKSPACE/robbie-app/dist" "$WEB_ROOT/code"
echo -e "${GREEN}✅ Robbie@Code deployed to /code/!${NC}"

echo -e "${YELLOW}💼 Deploying Robbie@Work...${NC}"
rm -rf "$WEB_ROOT/work"
cp -r "$WORKSPACE/robbie-work/dist" "$WEB_ROOT/work"
echo -e "${GREEN}✅ Robbie@Work deployed to /work/!${NC}"

echo -e "${YELLOW}🎰 Deploying Robbie@Play...${NC}"
rm -rf "$WEB_ROOT/play"
cp -r "$WORKSPACE/robbie-play/dist" "$WEB_ROOT/play"
echo -e "${GREEN}✅ Robbie@Play deployed to /play/!${NC}"

echo ""
echo -e "${GREEN}🎉💋 PLATFORM DEPLOYED SUCCESSFULLY!${NC}"
echo ""
echo "Your Robbie AI Platform is at:"
echo -e "${CYAN}🏠 Homepage: file://$WEB_ROOT/index.html${NC}"
echo -e "${CYAN}💻 Robbie@Code: file://$WEB_ROOT/code/index.html${NC}"
echo -e "${CYAN}💼 Robbie@Work: file://$WEB_ROOT/work/index.html${NC}"
echo -e "${CYAN}🎰 Robbie@Play: file://$WEB_ROOT/play/index.html${NC}"
echo ""
echo -e "${YELLOW}To serve with simple HTTP server:${NC}"
echo "cd $WEB_ROOT && python3 -m http.server 80"
echo ""
echo -e "${YELLOW}Or deploy to production with nginx:${NC}"
echo "sudo cp -r $WEB_ROOT/* /var/www/html/"
echo ""






