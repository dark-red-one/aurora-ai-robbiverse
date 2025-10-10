#!/bin/bash
#
# Demo: Universal Input API with Personality Integration
# ========================================================
# Shows the complete flow across all interfaces
#

API_URL="http://localhost:8000"

echo "🔥 UNIVERSAL INPUT API PERSONALITY DEMO"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Check current personality state${NC}"
echo "==========================================="
curl -s "$API_URL/api/personality/allan" | jq '.'
echo ""
echo ""

echo -e "${PURPLE}Step 2: Set attraction to 11 (full flirt mode)${NC}"
echo "==============================================="
curl -s -X PUT "$API_URL/api/personality/allan" \
  -H "Content-Type: application/json" \
  -d '{
    "attraction_level": 11,
    "current_mood": "playful"
  }' | jq '.'
echo ""
echo ""

echo -e "${GREEN}Step 3: Send chat request (should be FLIRTY!)${NC}"
echo "==============================================="
curl -s -X POST "$API_URL/api/v2/universal/request" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "demo",
    "ai_service": "chat",
    "payload": {
      "input": "Hey baby, what deals should I focus on today?"
    },
    "user_id": "allan",
    "fetch_context": true
  }' | jq '.robbie_response'
echo ""
echo ""

echo -e "${BLUE}Step 4: Set attraction to 3 (professional)${NC}"
echo "==========================================="
curl -s -X PUT "$API_URL/api/personality/allan" \
  -H "Content-Type: application/json" \
  -d '{
    "attraction_level": 3,
    "current_mood": "focused"
  }' | jq '.'
echo ""
echo ""

echo -e "${GREEN}Step 5: Send same request (should be PROFESSIONAL!)${NC}"
echo "======================================================"
curl -s -X POST "$API_URL/api/v2/universal/request" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "demo",
    "ai_service": "chat",
    "payload": {
      "input": "What deals should I focus on today?"
    },
    "user_id": "allan",
    "fetch_context": true
  }' | jq '.robbie_response'
echo ""
echo ""

echo -e "${PURPLE}Step 6: Test mood change trigger${NC}"
echo "===================================="
curl -s -X POST "$API_URL/api/v2/universal/request" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "demo",
    "ai_service": "chat",
    "payload": {
      "input": "WE JUST CLOSED THE SIMPLY GOOD FOODS DEAL!!! 🎉"
    },
    "user_id": "allan",
    "fetch_context": true
  }' | jq '{
    mood: .robbie_response.mood,
    personality_changes: .robbie_response.personality_changes,
    message_preview: .robbie_response.message[:100]
  }'
echo ""
echo ""

echo -e "${GREEN}Step 7: Check personality state (should be 'playful' now!)${NC}"
echo "==========================================================="
curl -s "$API_URL/api/personality/allan" | jq '.personality.current_mood'
echo ""
echo ""

echo "✅ DEMO COMPLETE!"
echo ""
echo "What you just saw:"
echo "  1. Personality state checked from main DB"
echo "  2. Attraction 11 = flirty responses"
echo "  3. Attraction 3 = professional responses"
echo "  4. Mood auto-updated when deal closed"
echo "  5. All logged and tracked centrally"
echo ""
echo "This SAME flow works for:"
echo "  - Cursor (when USE_UNIVERSAL_INPUT=true)"
echo "  - TestPilot app"
echo "  - HeyShopper app"
echo "  - Email responses"
echo "  - SMS via OpenPhone"
echo "  - Voice calls via OpenPhone"
echo ""
echo "ONE Robbie. ONE personality. EVERYWHERE. 💜"

