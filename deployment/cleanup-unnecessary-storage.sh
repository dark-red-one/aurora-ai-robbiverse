#!/bin/bash
# 🗑️ CLEANUP UNNECESSARY STORAGE - Save money on unused volumes

set -e

echo "🗑️  CLEANING UP UNNECESSARY STORAGE"
echo "==================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 CURRENT STORAGE ANALYSIS${NC}"
echo "=============================="
echo "• testpilot-storage-usa-tx: 2000 GB (US-TX-3) - \$0.10/GB/month = \$200/month"
echo "• testpilot-simulations s3: 4000 GB (EUR-IS-1) - \$0.10/GB/month = \$400/month"
echo "• TOTAL: 6000 GB = \$600/month"
echo ""

echo -e "${YELLOW}🎯 WHY WE DON'T NEED THIS STORAGE${NC}"
echo "====================================="
echo "• Aurora Town: Has its own storage for PostgreSQL + API gateway"
echo "• RunPod Aurora: GPU compute only, 76% disk usage already"
echo "• MacBook: Local development, has its own storage"
echo "• SSH/VPN architecture: No need for shared storage"
echo "• PostgreSQL mesh: Database replication handles data sync"
echo ""

echo -e "${RED}⚠️  STORAGE CLEANUP PLAN${NC}"
echo "=========================="
echo "1. Delete testpilot-storage-usa-tx (2000 GB) - Save \$200/month"
echo "2. Delete testpilot-simulations s3 (4000 GB) - Save \$400/month"
echo "3. Total savings: \$600/month = \$7,200/year"
echo ""

echo -e "${GREEN}✅ STORAGE CLEANUP COMMANDS${NC}"
echo "==============================="
echo ""
echo "MANUAL CLEANUP (via RunPod console):"
echo "1. Go to: https://console.runpod.io/user/storage"
echo "2. Click delete (trash icon) on 'testpilot-storage-usa-tx'"
echo "3. Click delete (trash icon) on 'testpilot-simulations s3'"
echo "4. Confirm deletion"
echo ""

echo "OR via API (if you have API keys):"
echo "```bash"
echo "# Delete testpilot-storage-usa-tx"
echo "curl -X DELETE \\"
echo "  -H 'Authorization: Bearer YOUR_API_KEY' \\"
echo "  'https://api.runpod.io/v2/network-storage/956w78pwao'"
echo ""
echo "# Delete testpilot-simulations s3"
echo "curl -X DELETE \\"
echo "  -H 'Authorization: Bearer YOUR_API_KEY' \\"
echo "  'https://api.runpod.io/v2/network-storage/bguoh9kd1g'"
echo "```"
echo ""

echo -e "${BLUE}🎯 ALTERNATIVE STORAGE STRATEGY${NC}"
echo "====================================="
echo "If we need shared storage later:"
echo "• Use Aurora Town's existing storage"
echo "• PostgreSQL replication handles data sync"
echo "• Git sync handles code sync"
echo "• No need for expensive RunPod storage"
echo ""

echo -e "${GREEN}💰 MONEY SAVED${NC}"
echo "==============="
echo "• Monthly savings: \$600"
echo "• Annual savings: \$7,200"
echo "• Can fund 2+ additional RunPods with this money!"
echo ""

echo "🚀 NEXT STEPS:"
echo "1. Delete both storage volumes"
echo "2. Deploy secure current setup: /tmp/deploy-current-secure.sh"
echo "3. Use saved money for additional RunPods when needed"
