#!/bin/bash
# 🧪 TEST TRACKING SYSTEM
# Verifies landing page tracking is working correctly
# Run with: bash deployment/test-tracking-system.sh

echo "🧪 Testing GroceryShop Landing Page Tracking System..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

# Test function
test_check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $1"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $1"
        ((FAILED++))
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 FILE STRUCTURE TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check landing page exists
test -f "web-deploy/landing/groceryshop/index.html"
test_check "Landing page HTML exists"

# Check tracking API exists
test -f "packages/@robbieverse/api/src/routes/tracking.py"
test_check "Tracking API exists"

# Check nginx config exists
test -f "deployment/nginx-testpilot.conf"
test_check "Nginx config exists"

# Check deployment script exists
test -f "deployment/deploy-landing-pages.sh"
test_check "Deployment script exists"

# Check documentation exists
test -f "deployment/LANDING_PAGES_GUIDE.md"
test_check "Documentation exists"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 CONTENT VALIDATION TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check HTML has tracking code
grep -q "track('pageview'" web-deploy/landing/groceryshop/index.html
test_check "HTML contains tracking initialization"

# Check HTML has session ID generation
grep -q "generateUUID" web-deploy/landing/groceryshop/index.html
test_check "HTML contains session ID generation"

# Check HTML has fault tolerance
grep -q "try {" web-deploy/landing/groceryshop/index.html
test_check "HTML contains fault tolerance (try/catch)"

# Check API has all endpoints
grep -q "def track_pageview" packages/@robbieverse/api/src/routes/tracking.py
test_check "API has pageview endpoint"

grep -q "def track_heartbeat" packages/@robbieverse/api/src/routes/tracking.py
test_check "API has heartbeat endpoint"

grep -q "def track_event" packages/@robbieverse/api/src/routes/tracking.py
test_check "API has event endpoint"

grep -q "def track_conversion" packages/@robbieverse/api/src/routes/tracking.py
test_check "API has conversion endpoint"

# Check main.py has tracking routes
grep -q "tracking" packages/@robbieverse/api/main.py
test_check "Main API includes tracking routes"

# Check CORS includes testpilot.ai
grep -q "testpilot.ai" packages/@robbieverse/api/main.py
test_check "CORS includes testpilot.ai domain"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  DATABASE TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if PostgreSQL is running
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}: PostgreSQL is running"
    ((PASSED++))
    
    # Check if database exists
    if psql -h localhost -U postgres -d aurora_unified -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}: aurora_unified database exists"
        ((PASSED++))
        
        # Check if table exists
        if psql -h localhost -U postgres -d aurora_unified -c "SELECT * FROM website_activity LIMIT 1;" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ PASS${NC}: website_activity table exists"
            ((PASSED++))
        else
            echo -e "${YELLOW}⚠️  WARN${NC}: website_activity table doesn't exist (run migrations)"
            ((FAILED++))
        fi
    else
        echo -e "${RED}❌ FAIL${NC}: aurora_unified database doesn't exist"
        ((FAILED++))
    fi
else
    echo -e "${RED}❌ FAIL${NC}: PostgreSQL not running"
    ((FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 API CONNECTIVITY TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if API is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}: FastAPI is running on port 8000"
    ((PASSED++))
    
    # Test tracking stats endpoint
    if curl -s http://localhost:8000/api/tracking/stats > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}: Tracking stats endpoint responds"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: Tracking stats endpoint not responding"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️  WARN${NC}: FastAPI not running (start with: uvicorn main:app)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo ""
    echo "✅ Your tracking system is ready!"
    echo ""
    echo "Next steps:"
    echo "1. bash deployment/setup-landing-pages-local.sh (local testing)"
    echo "2. sudo bash deployment/deploy-landing-pages.sh (production deploy)"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  SOME TESTS FAILED${NC}"
    echo ""
    echo "Common fixes:"
    echo "• Start PostgreSQL: brew services start postgresql"
    echo "• Start API: cd packages/@robbieverse/api && uvicorn main:app --reload --port 8000"
    echo "• Run migration: psql -h localhost -U postgres -d aurora_unified -f database/migrations/add-session-id-unique-constraint.sql"
    echo ""
    exit 1
fi

