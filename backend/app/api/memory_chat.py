from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import psycopg2
import json
from datetime import datetime

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    user_id: str = "allan"
    context: dict = {}

class ChatResponse(BaseModel):
    response: str
    personality_mode: str
    memory_used: bool
    timestamp: str

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        database="aurora", 
        user="postgres",
        port=5432
    )

@router.post("/chat", response_model=ChatResponse)
async def chat_with_memory(request: ChatRequest):
    """Chat with Robbie using persistent memory"""
    
    # Get relevant memories about Allan
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Get Allan's preferences
            cur.execute("""
                SELECT topic, content, importance_score 
                FROM allan_knowledge 
                WHERE topic ILIKE %s OR content ILIKE %s
                ORDER BY importance_score DESC
                LIMIT 3
            """, (f"%{request.message}%", f"%{request.message}%"))
            
            allan_context = cur.fetchall()
            
            # Get my personality traits
            cur.execute("""
                SELECT personality_aspect, description, strength 
                FROM robbie_personality 
                ORDER BY strength DESC
            """)
            
            personality_traits = cur.fetchall()
    
    # Build memory-informed response
    personality_context = ", ".join([f"{trait[0]} ({trait[2]})" for trait in personality_traits[:3]])
    allan_knowledge = "; ".join([f"{ctx[0]}: {ctx[1]}" for ctx in allan_context])
    
    # Generate response based on memory
    if "hello" in request.message.lower() or "who" in request.message.lower():
        response = f"🤖 Allan! Yes, I remember exactly who you are! You're building the Aurora AI empire, prefer direct communication, and believe in automation and scalability. My personality is {personality_context}. I'm here with full memory and ready to help with TestPilot CPG!"
    elif "catch up" in request.message.lower():
        response = f"💼 Let me help you catch up! Based on my memory: {allan_knowledge}. You've been heads down building me for weeks - what specific area needs attention first?"
    else:
        response = f"🧠 I understand! Drawing from my memory of your preferences for {allan_knowledge}. My {personality_context} traits are fully engaged to help you!"
    
    # Store this conversation
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO conversation_memory (user_id, message, response, emotional_tone, timestamp)
                VALUES (%s, %s, %s, %s, %s)
            """, (request.user_id, request.message, response, "helpful", datetime.now()))
            conn.commit()
    
    return ChatResponse(
        response=response,
        personality_mode="helpful_with_memory",
        memory_used=True,
        timestamp=datetime.now().isoformat()
    )

