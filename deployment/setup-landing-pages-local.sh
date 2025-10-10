#!/bin/bash
# 🧪 LOCAL TESTING SETUP FOR LANDING PAGES
# Sets up database and starts local server for testing
# Run with: bash deployment/setup-landing-pages-local.sh

set -e

echo "🧪 Setting up landing pages for local testing..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

WORKSPACE="/Users/allanperetz/aurora-ai-robbiverse"

# ============================================================================
# STEP 1: DATABASE SETUP
# ============================================================================

echo -e "${YELLOW}📊 Step 1: Setting up database...${NC}"

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  PostgreSQL not running. Start it with: brew services start postgresql${NC}"
    exit 1
fi

# Apply migration
echo -e "${CYAN}Applying database migration...${NC}"
psql -h localhost -U postgres -d aurora_unified -f "$WORKSPACE/database/migrations/add-session-id-unique-constraint.sql"

echo -e "${GREEN}✅ Database ready${NC}"

# ============================================================================
# STEP 2: CHECK FASTAPI BACKEND
# ============================================================================

echo -e "${YELLOW}🚀 Step 2: Checking FastAPI backend...${NC}"

# Check if API is already running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ FastAPI already running on port 8000${NC}"
else
    echo -e "${YELLOW}⚠️  FastAPI not running${NC}"
    echo -e "${CYAN}Start it with:${NC}"
    echo "cd $WORKSPACE/packages/@robbieverse/api"
    echo "uvicorn main:app --reload --port 8000"
    echo ""
fi

# ============================================================================
# STEP 3: START LOCAL WEB SERVER
# ============================================================================

echo -e "${YELLOW}🌐 Step 3: Starting local web server...${NC}"

cd "$WORKSPACE/web-deploy"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉 LOCAL TESTING SETUP COMPLETE! 🎉     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📝 Testing Instructions:${NC}"
echo ""
echo -e "${YELLOW}1. Make sure FastAPI is running:${NC}"
echo "   cd $WORKSPACE/packages/@robbieverse/api"
echo "   uvicorn main:app --reload --port 8000"
echo ""
echo -e "${YELLOW}2. Start this web server (in new terminal):${NC}"
echo "   cd $WORKSPACE/web-deploy"
echo "   python3 -m http.server 8080"
echo ""
echo -e "${YELLOW}3. Open landing page:${NC}"
echo "   http://localhost:8080/landing/groceryshop/"
echo ""
echo -e "${YELLOW}4. Test with personalization:${NC}"
echo "   http://localhost:8080/landing/groceryshop/?name=Allan&company=TestPilot"
echo ""
echo -e "${YELLOW}5. Check tracking stats:${NC}"
echo "   curl http://localhost:8000/api/tracking/stats?page_filter=groceryshop"
echo "   curl http://localhost:8000/api/tracking/recent"
echo ""
echo -e "${YELLOW}6. Query database directly:${NC}"
echo "   psql -h localhost -U postgres -d aurora_unified"
echo "   SELECT * FROM website_activity ORDER BY visited_at DESC LIMIT 5;"
echo ""
echo -e "${CYAN}💡 What to test:${NC}"
echo "  ✅ Page loads correctly"
echo "  ✅ Personalization works (name in header)"
echo "  ✅ Console shows: ✅ Tracking initialized"
echo "  ✅ Tab switches are tracked"
echo "  ✅ Scroll tracking works"
echo "  ✅ Button clicks trigger conversions"
echo "  ✅ Data appears in database"
echo "  ✅ Page still works if API is stopped (fault tolerance)"
echo ""

# Start the web server
echo -e "${GREEN}Starting web server on http://localhost:8080${NC}"
echo -e "${CYAN}Press Ctrl+C to stop${NC}"
echo ""
python3 -m http.server 8080

