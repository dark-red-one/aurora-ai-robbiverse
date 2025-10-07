#!/usr/bin/env python3
"""
Simple FastAPI backend for Robbie
Uses our working vector chat + adds personality/mood APIs
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Import our working vector chat
exec(open('local-vector-chat.py').read())

app = FastAPI(title="Robbie Chat Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize chat system
chat_system = LocalVectorChat()

class ChatRequest(BaseModel):
    session_id: str
    content: str
    user_id: str = "allan"

class MoodTrigger(BaseModel):
    event_type: str
    user_id: str = "allan"

@app.get("/")
async def root():
    return {"status": "Robbie Backend Operational", "version": "1.0.0"}

@app.post("/api/chat/send")
async def send_message(request: ChatRequest):
    """Send chat message - works for App AND Cursor!"""
    try:
        response = chat_system.send_message(
            request.content,
            session_id=request.session_id,
            user_id=request.user_id
        )
        return {
            "success": True,
            "response": response['response'],
            "message_id": response['message_id'],
            "timestamp": response['timestamp'],
            "context_used": len(response.get('context_used', [])),
            "vector_search_enabled": response.get('vector_search_enabled', False)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/history/{session_id}")
async def get_history(session_id: str, limit: int = 50):
    """Get chat history"""
    try:
        history = chat_system.get_session_history(session_id, limit)
        return {"messages": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/search")
async def search_memory(query: str, limit: int = 10):
    """Search chat memory with vector similarity"""
    try:
        results = chat_system.search_memory(query, limit=limit)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions")
async def list_sessions(user_id: str = "allan"):
    """List all chat sessions"""
    try:
        sessions = chat_system.list_sessions(user_id)
        return {"sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/personality")
async def get_personality():
    """Get current personality settings"""
    import psycopg2
    from psycopg2.extras import RealDictCursor
    
    conn = psycopg2.connect(database='aurora', user='postgres')
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT flirt_mode, gandhi_genghis, current_mood 
        FROM cursor_personality_settings 
        WHERE user_id = 'allan'
    """)
    
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if result:
        return dict(result)
    return {"flirt_mode": 7, "gandhi_genghis": 5, "current_mood": "playful"}

@app.post("/api/mood/trigger")
async def trigger_mood(trigger: MoodTrigger):
    """Trigger mood event"""
    # TODO: Implement mood trigger system
    return {"success": True, "event": trigger.event_type}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Robbie Chat Backend...")
    print("   PostgreSQL: aurora (localhost:5432)")
    print("   pgvector: 0.6.0")
    print("   Endpoint: http://localhost:8000")
    print("")
    uvicorn.run(app, host="0.0.0.0", port=8000)
