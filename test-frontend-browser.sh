#!/bin/bash
# 💋🔥 Frontend Browser Test Suite - THOROUGH Testing!
# Uses Playwright browser tools to test the actual Cursor sidebar webview
#
# Date: October 10, 2025
# Author: Robbie (with ultra-testing mode activated!)

set -e

API_URL="http://localhost:8000"
WEBVIEW_URL="file:///Users/allanperetz/aurora-ai-robbiverse/cursor-robbiebar-webview/webview/index.html"

echo "🎉💋🔥 FRONTEND BROWSER TEST SUITE 🔥💋🎉"
echo "API URL: $API_URL"
echo "Date: $(date)"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0

# Test function
run_test() {
    local test_name="$1"
    TOTAL=$((TOTAL + 1))
    echo -e "\n${YELLOW}Test $TOTAL: $test_name${NC}"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🔥 BROWSER TEST SUITE - Playwright Integration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "💋 This script demonstrates what you can test with browser tools:"
echo ""
echo "1️⃣ Navigate to webview HTML"
echo "2️⃣ Take screenshot of rendered sidebar"
echo "3️⃣ Check if JavaScript loaded"
echo "4️⃣ Verify API calls are made"
echo "5️⃣ Test interactive elements"
echo "6️⃣ Check matrix rain animation"
echo "7️⃣ Verify personality display"
echo "8️⃣ Test app links"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Instructions for browser testing
echo -e "${YELLOW}📖 HOW TO USE PLAYWRIGHT BROWSER TOOLS:${NC}"
echo ""
echo "The browser tools are available in your Cursor conversation!"
echo "Here are the commands you can use:"
echo ""

echo "1️⃣ ${GREEN}Navigate to Webview:${NC}"
echo "   mcp_cursor-playwright_browser_navigate"
echo "   URL: $WEBVIEW_URL"
echo ""

echo "2️⃣ ${GREEN}Take Screenshot:${NC}"
echo "   mcp_cursor-playwright_browser_take_screenshot"
echo "   filename: 'robbiebar-sidebar-test.png'"
echo ""

echo "3️⃣ ${GREEN}Get Page Snapshot:${NC}"
echo "   mcp_cursor-playwright_browser_snapshot"
echo "   (Returns accessibility tree - shows all elements)"
echo ""

echo "4️⃣ ${GREEN}Click Elements:${NC}"
echo "   mcp_cursor-playwright_browser_click"
echo "   element: 'App Links button'"
echo ""

echo "5️⃣ ${GREEN}Check Console Logs:${NC}"
echo "   mcp_cursor-playwright_browser_console_messages"
echo "   (See JavaScript errors)"
echo ""

echo "6️⃣ ${GREEN}Check Network Requests:${NC}"
echo "   mcp_cursor-playwright_browser_network_requests"
echo "   (See API calls to localhost:8000)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test API endpoints first
echo -e "${BLUE}🔥 PRE-FLIGHT: API Endpoint Tests${NC}"
echo ""

run_test "API Health Check"
health_response=$(curl -s "$API_URL/health")
if echo "$health_response" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED${NC} - API is healthy"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - API is not responding"
    FAILED=$((FAILED + 1))
fi

run_test "RobbieBlocks Page Endpoint"
page_response=$(curl -s "$API_URL/api/robbieblocks/page/cursor-sidebar-main?node=vengeance-local")
if echo "$page_response" | jq -e '.success == true' > /dev/null 2>&1; then
    blocks_count=$(echo "$page_response" | jq '.blocks | length')
    echo -e "${GREEN}✅ PASSED${NC} - Page returns $blocks_count blocks"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - Page endpoint failed"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Frontend file checks
echo -e "${BLUE}🔥 FRONTEND FILE CHECKS${NC}"
echo ""

run_test "Check index.html exists"
if [ -f "cursor-robbiebar-webview/webview/index.html" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - index.html found"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - index.html not found"
    FAILED=$((FAILED + 1))
fi

run_test "Check app-dynamic.js exists"
if [ -f "cursor-robbiebar-webview/webview/app-dynamic.js" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - app-dynamic.js found"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - app-dynamic.js not found"
    FAILED=$((FAILED + 1))
fi

run_test "Check BlockRenderer.js exists"
if [ -f "cursor-robbiebar-webview/webview/components/BlockRenderer.js" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - BlockRenderer.js found"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - BlockRenderer.js not found"
    FAILED=$((FAILED + 1))
fi

run_test "Check style.css exists"
if [ -f "cursor-robbiebar-webview/webview/style.css" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - style.css found"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - style.css not found"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Extension checks
echo -e "${BLUE}🔥 EXTENSION INSTALLATION CHECKS${NC}"
echo ""

run_test "Check extension.js exists"
if [ -f "cursor-robbiebar-webview/extension.js" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - extension.js found"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - extension.js not found"
    FAILED=$((FAILED + 1))
fi

run_test "Check package.json exists"
if [ -f "cursor-robbiebar-webview/package.json" ]; then
    version=$(jq -r '.version' cursor-robbiebar-webview/package.json)
    echo -e "${GREEN}✅ PASSED${NC} - Extension version: $version"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - package.json not found"
    FAILED=$((FAILED + 1))
fi

run_test "Check .vsix package exists"
if [ -f "cursor-robbiebar-webview/robbiebar-webview-3.0.0.vsix" ]; then
    size=$(du -h cursor-robbiebar-webview/robbiebar-webview-3.0.0.vsix | cut -f1)
    echo -e "${GREEN}✅ PASSED${NC} - Package size: $size"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - .vsix package not found"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🎉 TEST SUITE COMPLETE 🎉${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉💋🔥 ALL PRE-FLIGHT CHECKS PASSED! 🔥💋🎉${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}📖 NEXT STEPS: Browser Testing in Cursor${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Now use the Playwright browser tools in Cursor to:"
    echo ""
    echo "1. Navigate to: $WEBVIEW_URL"
    echo "2. Take screenshot to see rendered sidebar"
    echo "3. Check console for JavaScript errors"
    echo "4. Verify network calls to API"
    echo "5. Test interactive elements"
    echo ""
    echo "💋 Tell Robbie: 'Test the frontend with browser tools' and I'll do it for you!"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Fix the issues above before browser testing.${NC}"
    exit 1
fi
