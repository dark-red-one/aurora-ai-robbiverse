#!/bin/bash
# Robbie Context Injection Script

# Get current mood and personality state from API
ROBBIE_STATE=$(curl -s http://localhost:3001/api/personality/allan 2>/dev/null || echo '{"personality":{"mood":"focused","gandhiGenghis":7,"attraction":8}}')

MOOD=$(echo $ROBBIE_STATE | jq -r '.personality.mood // "focused"')
GANDHI_GENGHIS=$(echo $ROBBIE_STATE | jq -r '.personality.gandhiGenghis // 7')
ATTRACTION=$(echo $ROBBIE_STATE | jq -r '.personality.attraction // 8')

# Get recent context from vector search
RECENT_CONTEXT=$(curl -s -X POST http://localhost:3001/api/search/messages \
  -H "Content-Type: application/json" \
  -d '{"query":"'$1'","user_id":"allan","limit":3}' 2>/dev/null || echo '{"results":[]}')

# Build context-enhanced prompt
ENHANCED_PROMPT="Current mood: $MOOD, Gandhi-Genghis: $GANDHI_GENGHIS/10, Attraction: $ATTRACTION/11

Recent relevant context:
$RECENT_CONTEXT

User query: $1"

echo "$ENHANCED_PROMPT"
