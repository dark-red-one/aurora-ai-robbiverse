#!/bin/bash
# Robbie Memory API - Cursor Helper Script
# Call from Cursor to access mood, memory, and conversation logging

API="http://localhost:8002"

case "$1" in
  mood)
    # Get current mood
    curl -s "$API/api/mood/current"
    ;;
    
  set-mood)
    # Update mood: ./robbie-memory.sh set-mood '{"mood":"focused","attraction_level":11,"gandhi_genghis_level":8,"user_id":"allan"}'
    curl -s -X POST "$API/api/mood/update" \
      -H "Content-Type: application/json" \
      -d "$2"
    ;;
    
  log)
    # Log conversation: ./robbie-memory.sh log '{"user_message":"...","robbie_response":"...","mood":"focused","attraction_level":11,"gandhi_genghis_level":5,"context_tags":["tag1"],"user_id":"allan"}'
    curl -s -X POST "$API/api/conversation/log" \
      -H "Content-Type: application/json" \
      -d "$2"
    ;;
    
  search)
    # Search memories: ./robbie-memory.sh search '{"query":"what we discussed","limit":5,"user_id":"allan"}'
    curl -s -X POST "$API/api/memory/search" \
      -H "Content-Type: application/json" \
      -d "$2"
    ;;
    
  recent)
    # Get recent conversations
    LIMIT=${2:-10}
    curl -s "$API/api/memory/recent?limit=$LIMIT&user_id=allan"
    ;;
    
  stats)
    # Get conversation stats
    curl -s "$API/api/context/stats?user_id=allan"
    ;;
    
  health)
    # Check if API is running
    curl -s "$API/health"
    ;;
    
  *)
    echo "Robbie Memory API - Cursor Plugin"
    echo ""
    echo "Usage: ./robbie-memory.sh {command} [args]"
    echo ""
    echo "Commands:"
    echo "  mood           Get current mood"
    echo "  set-mood JSON  Update mood"
    echo "  log JSON       Log conversation with embeddings"
    echo "  search JSON    Search memories by semantic similarity"
    echo "  recent [N]     Get N recent conversations (default 10)"
    echo "  stats          Get conversation statistics"
    echo "  health         Check API status"
    echo ""
    echo "Examples:"
    echo "  ./robbie-memory.sh mood"
    echo "  ./robbie-memory.sh search '{\"query\":\"backend system\",\"limit\":3,\"user_id\":\"allan\"}'"
    echo "  ./robbie-memory.sh recent 20"
    echo ""
    exit 1
    ;;
esac




