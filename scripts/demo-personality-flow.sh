#!/bin/bash

# Demo Script: Universal Input Personality Flow
# =============================================
# Tests the complete personality flow across all interfaces
# Shows per-user personality (Allan gets flirty, Joe gets professional)

set -e

echo "🔥 DEMO: Universal Input Personality Flow"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# API endpoint
API_URL="http://localhost:8000"

echo -e "${BLUE}Step 1: Check API Health${NC}"
echo "================================"
curl -s "$API_URL/api/v2/universal/health" | jq '.'
echo ""

echo -e "${BLUE}Step 2: Set Allan's Attraction to 11 (Full Flirt Mode)${NC}"
echo "============================================================="
curl -X PUT "$API_URL/api/personality/allan" \
  -H "Content-Type: application/json" \
  -d '{"attraction_level": 11, "current_mood": "playful"}' | jq '.'
echo ""

echo -e "${BLUE}Step 3: Set Joe's Attraction to 3 (Professional)${NC}"
echo "======================================================"
curl -X PUT "$API_URL/api/personality/joe" \
  -H "Content-Type: application/json" \
  -d '{"attraction_level": 3, "current_mood": "focused"}' | jq '.'
echo ""

echo -e "${BLUE}Step 4: Test Allan's Message (Should be Flirty!)${NC}"
echo "===================================================="
echo -e "${PURPLE}Input:${NC} 'Hey Robbie, what's the status on the deal?'"
echo ""

RESPONSE_ALLAN=$(curl -s -X POST "$API_URL/api/v2/universal/request" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "demo",
    "source_metadata": {"sender": "allan", "platform": "demo"},
    "ai_service": "chat",
    "payload": {
      "input": "Hey Robbie, what'\''s the status on the deal?",
      "parameters": {"temperature": 0.7, "max_tokens": 150}
    },
    "user_id": "allan",
    "fetch_context": false
  }')

echo -e "${GREEN}Allan's Response:${NC}"
echo "$RESPONSE_ALLAN" | jq -r '.robbie_response.message'
echo -e "${CYAN}Mood:${NC} $(echo "$RESPONSE_ALLAN" | jq -r '.robbie_response.mood')"
echo ""

echo -e "${BLUE}Step 5: Test Joe's Message (Should be Professional)${NC}"
echo "========================================================"
echo -e "${PURPLE}Input:${NC} 'Hey Robbie, what's the status on the deal?'"
echo ""

RESPONSE_JOE=$(curl -s -X POST "$API_URL/api/v2/universal/request" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "demo",
    "source_metadata": {"sender": "joe", "platform": "demo"},
    "ai_service": "chat",
    "payload": {
      "input": "Hey Robbie, what'\''s the status on the deal?",
      "parameters": {"temperature": 0.7, "max_tokens": 150}
    },
    "user_id": "joe",
    "fetch_context": false
  }')

echo -e "${GREEN}Joe's Response:${NC}"
echo "$RESPONSE_JOE" | jq -r '.robbie_response.message'
echo -e "${CYAN}Mood:${NC} $(echo "$RESPONSE_JOE" | jq -r '.robbie_response.mood')"
echo ""

echo -e "${BLUE}Step 6: Test Different Sources (Same Personality)${NC}"
echo "====================================================="

echo -e "${YELLOW}Testing Cursor MCP source...${NC}"
RESPONSE_CURSOR=$(curl -s -X POST "$API_URL/api/v2/universal/request" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "cursor-mcp",
    "source_metadata": {"platform": "cursor"},
    "ai_service": "chat",
    "payload": {
      "input": "How do I optimize this code?",
      "parameters": {"temperature": 0.7, "max_tokens": 150}
    },
    "user_id": "allan",
    "fetch_context": false
  }')

echo -e "${GREEN}Cursor Response:${NC}"
echo "$RESPONSE_CURSOR" | jq -r '.robbie_response.message'
echo -e "${CYAN}Mood:${NC} $(echo "$RESPONSE_CURSOR" | jq -r '.robbie_response.mood')"
echo ""

echo -e "${YELLOW}Testing TestPilot CPG source...${NC}"
RESPONSE_TESTPILOT=$(curl -s -X POST "$API_URL/api/v2/universal/request" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "testpilot-cpg",
    "source_metadata": {"platform": "web-app"},
    "ai_service": "chat",
    "payload": {
      "input": "Show me the revenue dashboard",
      "parameters": {"temperature": 0.7, "max_tokens": 150}
    },
    "user_id": "allan",
    "fetch_context": false
  }')

echo -e "${GREEN}TestPilot Response:${NC}"
echo "$RESPONSE_TESTPILOT" | jq -r '.robbie_response.message'
echo -e "${CYAN}Mood:${NC} $(echo "$RESPONSE_TESTPILOT" | jq -r '.robbie_response.mood')"
echo ""

echo -e "${YELLOW}Testing RobbieBar macOS source...${NC}"
RESPONSE_ROBBIEBAR=$(curl -s -X POST "$API_URL/api/v2/universal/request" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "robbiebar-macos",
    "source_metadata": {"platform": "macos-desktop"},
    "ai_service": "chat",
    "payload": {
      "input": "status_check",
      "parameters": {"temperature": 0.3, "max_tokens": 50}
    },
    "user_id": "allan",
    "fetch_context": false
  }')

echo -e "${GREEN}RobbieBar Response:${NC}"
echo "$RESPONSE_ROBBIEBAR" | jq -r '.robbie_response.message'
echo -e "${CYAN}Mood:${NC} $(echo "$RESPONSE_ROBBIEBAR" | jq -r '.robbie_response.mood')"
echo ""

echo -e "${BLUE}Step 7: Test Mood Changes${NC}"
echo "=========================="

echo -e "${YELLOW}Testing mood change trigger (deal closed)...${NC}"
RESPONSE_MOOD=$(curl -s -X POST "$API_URL/api/v2/universal/request" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "demo",
    "source_metadata": {"sender": "allan", "platform": "demo"},
    "ai_service": "chat",
    "payload": {
      "input": "Great news! We closed the deal with TestPilot!",
      "parameters": {"temperature": 0.7, "max_tokens": 150}
    },
    "user_id": "allan",
    "fetch_context": false
  }')

echo -e "${GREEN}Response:${NC}"
echo "$RESPONSE_MOOD" | jq -r '.robbie_response.message'
echo -e "${CYAN}Mood:${NC} $(echo "$RESPONSE_MOOD" | jq -r '.robbie_response.mood')"
echo -e "${CYAN}Mood Changed:${NC} $(echo "$RESPONSE_MOOD" | jq -r '.robbie_response.personality_changes')"
echo ""

echo -e "${GREEN}✅ DEMO COMPLETE!${NC}"
echo "========================"
echo ""
echo "Key Results:"
echo "- Allan (attraction 11) gets flirty responses 😏💋"
echo "- Joe (attraction 3) gets professional responses"
echo "- Same personality across all interfaces (Cursor, TestPilot, RobbieBar)"
echo "- Mood changes automatically based on interaction content"
echo "- Universal Input API routes everything through ONE system"
echo ""
echo -e "${PURPLE}🎯 SUCCESS: ONE database, ONE truth, ONE Robbie (with per-user personality)!${NC}"