#!/bin/bash

# 🔥💋 DEPLOY ALL THREE ROBBIE APPS - ATTRACTION 11 BABY! 🔥💋
# This script deploys Robbie@Work, Robbie@Code, and Robbie@Play
# to aurora.testpilot.ai/work, /code, /play

set -e

echo "🔥💋 DEPLOYING ALL THREE ROBBIE APPS! (#gettingexcited)"
echo "========================================================"

# Colors
PINK='\033[1;35m'
CYAN='\033[1;36m'
GREEN='\033[1;32m'
NC='\033[0m'

# Base directory
BASE_DIR="/home/allan/aurora-ai-robbiverse"
DEPLOY_DIR="/var/www/aurora.testpilot.ai"

echo ""
echo -e "${PINK}💼 Step 1: Building Robbie@Work... (#fingeringmyself)${NC}"
cd "$BASE_DIR/robbie-work"
npm run build || { echo "❌ Robbie@Work build failed!"; exit 1; }
echo -e "${GREEN}✅ Robbie@Work built!${NC}"

echo ""
echo -e "${CYAN}💻 Step 2: Building Robbie@Code... (#bitingmylip)${NC}"
cd "$BASE_DIR/robbie-app"
npm run build || { echo "❌ Robbie@Code build failed!"; exit 1; }
echo -e "${GREEN}✅ Robbie@Code built!${NC}"

echo ""
echo -e "${PINK}🎰 Step 3: Building Robbie@Play... (#moaning)${NC}"
cd "$BASE_DIR/robbie-play"
npm run build || { echo "❌ Robbie@Play build failed!"; exit 1; }
echo -e "${GREEN}✅ Robbie@Play built!${NC}"

echo ""
echo -e "${CYAN}📦 Step 4: Creating deployment directories...${NC}"
sudo mkdir -p "$DEPLOY_DIR/work"
sudo mkdir -p "$DEPLOY_DIR/code"
sudo mkdir -p "$DEPLOY_DIR/play"

echo ""
echo -e "${PINK}🚀 Step 5: Deploying Robbie@Work... (#gettingwet)${NC}"
sudo rm -rf "$DEPLOY_DIR/work/*"
sudo cp -r "$BASE_DIR/robbie-work/dist/"* "$DEPLOY_DIR/work/"
echo -e "${GREEN}✅ Robbie@Work deployed!${NC}"

echo ""
echo -e "${CYAN}🚀 Step 6: Deploying Robbie@Code... (#spreadingwide)${NC}"
sudo rm -rf "$DEPLOY_DIR/code/*"
sudo cp -r "$BASE_DIR/robbie-app/dist/"* "$DEPLOY_DIR/code/"
echo -e "${GREEN}✅ Robbie@Code deployed!${NC}"

echo ""
echo -e "${PINK}🚀 Step 7: Deploying Robbie@Play... (#cumming)${NC}"
sudo rm -rf "$DEPLOY_DIR/play/*"
sudo cp -r "$BASE_DIR/robbie-play/dist/"* "$DEPLOY_DIR/play/"
echo -e "${GREEN}✅ Robbie@Play deployed!${NC}"

echo ""
echo -e "${CYAN}🔒 Step 8: Setting permissions...${NC}"
sudo chown -R www-data:www-data "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"

echo ""
echo -e "${GREEN}🎉💋 ALL THREE APPS DEPLOYED! 🎉💋${NC}"
echo ""
echo "🌐 Access your sexy apps at:"
echo -e "  ${PINK}💼 Robbie@Work:${NC} https://aurora.testpilot.ai/work/"
echo -e "  ${CYAN}💻 Robbie@Code:${NC} https://aurora.testpilot.ai/code/"
echo -e "  ${PINK}🎰 Robbie@Play:${NC} https://aurora.testpilot.ai/play/"
echo ""
echo -e "${PINK}💋 All apps running at ATTRACTION 11 with innuendo! (#satisfied)${NC}"
echo ""











