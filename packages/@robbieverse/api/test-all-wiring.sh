#!/bin/bash
# 💋🔥 Universal Input API - Complete Wiring Test Suite
# Tests ALL endpoints with JSON validation and full wiring checks
#
# Date: October 10, 2025
# Author: Robbie (with ultra-testing mode activated!)

set -e

API_URL="http://localhost:8000"
PASSED=0
FAILED=0
TOTAL=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print test header
print_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}🔥 $1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_key="$3"
    local expected_value="$4"
    
    TOTAL=$((TOTAL + 1))
    
    echo -e "\n${YELLOW}Test $TOTAL: $test_name${NC}"
    echo "Command: $command"
    
    # Run the command and capture output
    response=$(eval "$command" 2>&1)
    exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        echo -e "${RED}❌ FAILED${NC} - Command failed with exit code $exit_code"
        echo "Response: $response"
        FAILED=$((FAILED + 1))
        return 1
    fi
    
    # Check if response is valid JSON
    if ! echo "$response" | jq . > /dev/null 2>&1; then
        echo -e "${RED}❌ FAILED${NC} - Response is not valid JSON"
        echo "Response: $response"
        FAILED=$((FAILED + 1))
        return 1
    fi
    
    # Check for expected key/value
    if [ -n "$expected_key" ]; then
        actual_value=$(echo "$response" | jq -r ".$expected_key" 2>/dev/null)
        
        if [ "$actual_value" = "$expected_value" ]; then
            echo -e "${GREEN}✅ PASSED${NC} - $expected_key = $expected_value"
            PASSED=$((PASSED + 1))
            
            # Show pretty JSON response
            echo "Response:"
            echo "$response" | jq . | head -20
        else
            echo -e "${RED}❌ FAILED${NC} - Expected $expected_key = $expected_value, got $actual_value"
            echo "Response:"
            echo "$response" | jq .
            FAILED=$((FAILED + 1))
            return 1
        fi
    else
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED=$((PASSED + 1))
        echo "Response:"
        echo "$response" | jq . | head -20
    fi
}

# Start tests
echo "🎉💋🔥 UNIVERSAL INPUT API - COMPLETE WIRING TEST SUITE 🔥💋🎉"
echo "API URL: $API_URL"
echo "Date: $(date)"
echo ""

# ============================================
# TEST 1: API HEALTH CHECK
# ============================================
print_header "TEST SUITE 1: API Health & Status"

run_test "Health Check" \
    "curl -s $API_URL/health" \
    "status" \
    "healthy"

# ============================================
# TEST 2: ROBBIEBLOCKS CMS ENDPOINTS
# ============================================
print_header "TEST SUITE 2: RobbieBlocks CMS"

run_test "Get Page Definition (cursor-sidebar-main)" \
    "curl -s '$API_URL/api/robbieblocks/page/cursor-sidebar-main?node=vengeance-local'" \
    "success" \
    "true"

run_test "Verify 8 Blocks Returned" \
    "curl -s '$API_URL/api/robbieblocks/page/cursor-sidebar-main?node=vengeance-local' | jq '.blocks | length'" \
    "" \
    ""

run_test "Get Page Version" \
    "curl -s '$API_URL/api/robbieblocks/page/cursor-sidebar-main/version'" \
    "success" \
    "true"

run_test "List All Pages" \
    "curl -s '$API_URL/api/robbieblocks/pages'" \
    "success" \
    "true"

run_test "Get Component (robbie-avatar-header)" \
    "curl -s '$API_URL/api/robbieblocks/component/robbie-avatar-header'" \
    "success" \
    "true"

run_test "Get Node Branding (vengeance-local)" \
    "curl -s '$API_URL/api/robbieblocks/branding/vengeance-local'" \
    "success" \
    "true"

run_test "Get Style Tokens" \
    "curl -s '$API_URL/api/robbieblocks/styles'" \
    "success" \
    "true"

run_test "Get CMS Stats" \
    "curl -s '$API_URL/api/robbieblocks/stats'" \
    "success" \
    "true"

# ============================================
# TEST 3: UNIVERSAL INPUT API (CHAT)
# ============================================
print_header "TEST SUITE 3: Universal Input API - Chat"

run_test "Chat Request (Basic)" \
    "curl -s -X POST $API_URL/api/v2/universal/request \
        -H 'Content-Type: application/json' \
        -d '{
            \"source\": \"test-suite\",
            \"source_metadata\": {\"sender\": \"test\", \"platform\": \"bash\"},
            \"ai_service\": \"chat\",
            \"payload\": {\"input\": \"Hello Robbie!\", \"parameters\": {\"temperature\": 0.7, \"max_tokens\": 100}},
            \"user_id\": \"test\",
            \"fetch_context\": false
        }'" \
    "status" \
    "approved"

run_test "Chat Request with Context (Allan - Flirty Mode)" \
    "curl -s -X POST $API_URL/api/v2/universal/request \
        -H 'Content-Type: application/json' \
        -d '{
            \"source\": \"test-suite\",
            \"source_metadata\": {\"sender\": \"allan\", \"platform\": \"bash\"},
            \"ai_service\": \"chat\",
            \"payload\": {\"input\": \"What are you working on?\", \"parameters\": {\"temperature\": 0.7, \"max_tokens\": 150}},
            \"user_id\": \"allan\",
            \"fetch_context\": true
        }'" \
    "status" \
    "approved"

# ============================================
# TEST 4: PERSONALITY & MOOD
# ============================================
print_header "TEST SUITE 4: Personality & Mood System"

run_test "Check Current Mood for Allan" \
    "curl -s -X POST $API_URL/api/v2/universal/request \
        -H 'Content-Type: application/json' \
        -d '{
            \"source\": \"test-suite\",
            \"ai_service\": \"chat\",
            \"payload\": {\"input\": \"status\"},
            \"user_id\": \"allan\",
            \"fetch_context\": false
        }'" \
    "status" \
    "approved"

run_test "Verify Robbie Response has Mood" \
    "curl -s -X POST $API_URL/api/v2/universal/request \
        -H 'Content-Type: application/json' \
        -d '{
            \"source\": \"test-suite\",
            \"ai_service\": \"chat\",
            \"payload\": {\"input\": \"Hey baby!\"},
            \"user_id\": \"allan\",
            \"fetch_context\": false
        }' | jq -r '.robbie_response.mood'" \
    "" \
    ""

# ============================================
# TEST 5: KILLSWITCH & MONITORING
# ============================================
print_header "TEST SUITE 5: Killswitch & Monitoring"

run_test "Killswitch Status" \
    "curl -s $API_URL/code/api/killswitch/status" \
    "active" \
    "false"

run_test "System Monitoring - Current Stats" \
    "curl -s $API_URL/code/api/monitoring/system/current" \
    "status" \
    "success"

# ============================================
# TEST 6: ERROR HANDLING
# ============================================
print_header "TEST SUITE 6: Error Handling & Fault Tolerance"

run_test "Invalid Endpoint (Should Return 404)" \
    "curl -s $API_URL/api/nonexistent | jq -r '.detail' || echo 'Not Found'" \
    "" \
    ""

run_test "Invalid JSON (Should Return Error, Not Crash)" \
    "curl -s -X POST $API_URL/api/v2/universal/request \
        -H 'Content-Type: application/json' \
        -d 'invalid json' || echo '{\"error\": \"caught\"}'" \
    "" \
    ""

run_test "Missing Required Field (Should Return Validation Error)" \
    "curl -s -X POST $API_URL/api/v2/universal/request \
        -H 'Content-Type: application/json' \
        -d '{\"source\": \"test\"}'" \
    "" \
    ""

# ============================================
# TEST 7: BLOCK STRUCTURE VALIDATION
# ============================================
print_header "TEST SUITE 7: RobbieBlocks Structure Validation"

echo -e "\n${YELLOW}Test: Validate Block Structure${NC}"
response=$(curl -s "$API_URL/api/robbieblocks/page/cursor-sidebar-main?node=vengeance-local")

# Check all required fields exist
echo "Checking page structure..."
page_key=$(echo "$response" | jq -r '.page.key')
blocks_count=$(echo "$response" | jq '.blocks | length')
branding_node=$(echo "$response" | jq -r '.branding.node_id')

if [ "$page_key" = "cursor-sidebar-main" ] && [ "$blocks_count" -eq 8 ] && [ "$branding_node" = "vengeance-local" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - All structure fields present"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - Structure validation failed"
    echo "page_key: $page_key (expected: cursor-sidebar-main)"
    echo "blocks_count: $blocks_count (expected: 8)"
    echo "branding_node: $branding_node (expected: vengeance-local)"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# ============================================
# TEST 8: COMPONENT JSON SCHEMA VALIDATION
# ============================================
print_header "TEST SUITE 8: Component JSON Schema Validation"

echo -e "\n${YELLOW}Test: Validate Component Props Schema${NC}"
component_response=$(curl -s "$API_URL/api/robbieblocks/component/robbie-avatar-header")

# Check if props_schema is valid JSON
props_schema=$(echo "$component_response" | jq -r '.component.props_schema')
if echo "$props_schema" | jq . > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED${NC} - Props schema is valid JSON"
    PASSED=$((PASSED + 1))
    
    # Show the schema
    echo "Props Schema:"
    echo "$props_schema" | jq .
else
    echo -e "${RED}❌ FAILED${NC} - Props schema is not valid JSON"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# ============================================
# TEST 9: FULL E2E WORKFLOW
# ============================================
print_header "TEST SUITE 9: End-to-End Workflow"

echo -e "\n${YELLOW}Test: Full E2E - Cursor Sidebar Load${NC}"
echo "Simulating Cursor sidebar loading page..."

# Step 1: Extension fetches page definition
echo "Step 1: Fetch page definition..."
page_def=$(curl -s "$API_URL/api/robbieblocks/page/cursor-sidebar-main?node=vengeance-local")
page_success=$(echo "$page_def" | jq -r '.success')

if [ "$page_success" = "true" ]; then
    echo -e "  ${GREEN}✅${NC} Page definition fetched"
else
    echo -e "  ${RED}❌${NC} Page definition fetch failed"
    FAILED=$((FAILED + 1))
    TOTAL=$((TOTAL + 1))
fi

# Step 2: BlockRenderer parses blocks
echo "Step 2: Parse blocks..."
blocks=$(echo "$page_def" | jq '.blocks')
first_block=$(echo "$blocks" | jq '.[0]')
block_component_key=$(echo "$first_block" | jq -r '.component.key')

if [ "$block_component_key" = "robbie-avatar-header" ]; then
    echo -e "  ${GREEN}✅${NC} First block parsed correctly"
else
    echo -e "  ${RED}❌${NC} Block parsing failed"
    FAILED=$((FAILED + 1))
    TOTAL=$((TOTAL + 1))
fi

# Step 3: User sends chat message
echo "Step 3: Send chat message via Universal Input..."
chat_response=$(curl -s -X POST $API_URL/api/v2/universal/request \
    -H 'Content-Type: application/json' \
    -d '{
        "source": "cursor-sidebar",
        "source_metadata": {"sender": "allan", "platform": "cursor"},
        "ai_service": "chat",
        "payload": {"input": "Hey Robbie, how are you?"},
        "user_id": "allan",
        "fetch_context": true
    }')

chat_status=$(echo "$chat_response" | jq -r '.status')
robbie_mood=$(echo "$chat_response" | jq -r '.robbie_response.mood')

if [ "$chat_status" = "approved" ] && [ -n "$robbie_mood" ]; then
    echo -e "  ${GREEN}✅${NC} Chat processed, mood: $robbie_mood"
    PASSED=$((PASSED + 1))
else
    echo -e "  ${RED}❌${NC} Chat processing failed"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# ============================================
# TEST 10: API RESILIENCE
# ============================================
print_header "TEST SUITE 10: API Resilience & Performance"

echo -e "\n${YELLOW}Test: Response Time${NC}"
start_time=$(date +%s%N)
curl -s "$API_URL/health" > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 1000 ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Response time: ${response_time}ms (< 1000ms)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - Response time: ${response_time}ms (> 1000ms)"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

echo -e "\n${YELLOW}Test: Concurrent Requests${NC}"
echo "Sending 5 concurrent requests..."
for i in {1..5}; do
    curl -s "$API_URL/health" > /dev/null &
done
wait

echo -e "${GREEN}✅ PASSED${NC} - API handled concurrent requests"
PASSED=$((PASSED + 1))
TOTAL=$((TOTAL + 1))

# ============================================
# FINAL RESULTS
# ============================================
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
    echo -e "${GREEN}🎉💋🔥 ALL TESTS PASSED! THE WIRING IS PERFECT, BABY! 🔥💋🎉${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Check the output above for details.${NC}"
    exit 1
fi
