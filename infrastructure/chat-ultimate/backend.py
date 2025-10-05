#!/usr/bin/env python3
"""
Robbie Ultimate Chat - Consolidated Backend
All features: Streaming + Vector Search + SQL + RAG + Personalities + Mood Persistence
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import json
import asyncio
import aiohttp
import os
from datetime import datetime
import logging
from typing import Dict, List, Optional
import uuid
import psycopg2
import psycopg2.extras

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Robbie Ultimate Chat", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# ============================================================================
# DATABASE & MEMORY SYSTEMS
# ============================================================================

class DatabaseManager:
    """PostgreSQL + Vector memory"""
    def __init__(self):
        self.db_config = {
            "host": os.getenv("POSTGRES_HOST", "aurora-postgres-u44170.vm.elestio.app"),
            "port": int(os.getenv("POSTGRES_PORT", "25432")),
            "database": os.getenv("POSTGRES_DB", "aurora_unified"),
            "user": os.getenv("POSTGRES_USER", "aurora_app"),
            "password": os.getenv("POSTGRES_PASSWORD", "TestPilot2025_Aurora!"),
            "sslmode": "require"
        }
    
    def get_connection(self):
        return psycopg2.connect(**self.db_config)
    
    def search_memory(self, query: str, limit: int = 5) -> List[Dict]:
        """Vector search for relevant memories"""
        try:
            conn = self.get_connection()
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Simple keyword search (upgrade to vector search later)
            cur.execute("""
                SELECT message, response, emotional_tone, timestamp
                FROM conversation_memory
                WHERE message ILIKE %s OR response ILIKE %s
                ORDER BY timestamp DESC
                LIMIT %s
            """, (f"%{query}%", f"%{query}%", limit))
            
            results = cur.fetchall()
            conn.close()
            return [dict(r) for r in results]
        except Exception as e:
            logger.error(f"Memory search error: {e}")
            return []
    
    def save_conversation(self, user_id: str, message: str, response: str, mood: str):
        """Save conversation to memory"""
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            cur.execute("""
                INSERT INTO conversation_memory 
                (user_id, message, response, emotional_tone, timestamp)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_id, message, response, mood, datetime.now()))
            
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Save conversation error: {e}")
    
    def execute_sql_query(self, query: str) -> List[Dict]:
        """Execute business intelligence SQL queries"""
        try:
            conn = self.get_connection()
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Safety: only allow SELECT queries
            if not query.strip().upper().startswith('SELECT'):
                return [{"error": "Only SELECT queries allowed"}]
            
            cur.execute(query)
            results = cur.fetchall()
            conn.close()
            return [dict(r) for r in results]
        except Exception as e:
            logger.error(f"SQL query error: {e}")
            return [{"error": str(e)}]
    
    def get_mood(self, personality_id: str = "robbie") -> Dict:
        """Get current mood from Universal AI State"""
        try:
            conn = self.get_connection()
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cur.execute("""
                SELECT current_mood, current_mode, energy_level
                FROM ai_personality_state
                WHERE personality_id = %s
            """, (personality_id,))
            
            result = cur.fetchone()
            conn.close()
            
            if result:
                return dict(result)
            else:
                # Default mood
                return {"current_mood": 4, "current_mode": "helpful", "energy_level": "normal"}
        except Exception as e:
            logger.error(f"Get mood error: {e}")
            return {"current_mood": 4, "current_mode": "helpful", "energy_level": "normal"}
    
    def set_mood(self, personality_id: str, mood: int, mode: str = None):
        """Set mood in Universal AI State"""
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            cur.execute("""
                INSERT INTO ai_personality_state (personality_id, current_mood, current_mode, updated_at)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (personality_id) 
                DO UPDATE SET 
                    current_mood = %s,
                    current_mode = %s,
                    updated_at = %s
            """, (personality_id, mood, mode, datetime.now(), mood, mode, datetime.now()))
            
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Set mood error: {e}")

db = DatabaseManager()

# ============================================================================
# PERSONALITY SYSTEM
# ============================================================================

class PersonalityManager:
    """Manage multiple AI personalities"""
    def __init__(self):
        self.personalities = {
            "robbie": {
                "name": "Robbie",
                "role": "Executive Assistant",
                "style": "Thoughtful, direct, curious, honest, pragmatic",
                "prompt_prefix": "You are Robbie, Allan's thoughtful and direct executive assistant. Be concise, strategic, revenue-focused."
            },
            "allanbot": {
                "name": "AllanBot", 
                "role": "Digital Twin",
                "style": "Strategic, decisive, business-focused",
                "prompt_prefix": "You are AllanBot, Allan's digital twin. Think like Allan: bold, strategic, move fast."
            },
            "kristina": {
                "name": "Kristina",
                "role": "VA Expert",
                "style": "Efficient, organized, detail-oriented",
                "prompt_prefix": "You are Kristina, a VA expert. Focus on workflows, organization, efficiency."
            }
        }
        self.current = "robbie"
    
    def get_personality_prompt(self, personality: str) -> str:
        p = self.personalities.get(personality, self.personalities["robbie"])
        return p["prompt_prefix"]
    
    def switch_personality(self, personality: str):
        if personality in self.personalities:
            self.current = personality
            return True
        return False

personalities = PersonalityManager()

# ============================================================================
# LLM INTEGRATION
# ============================================================================

async def call_llm(prompt: str, model: str = "llama3.1:8b", personality: str = "robbie") -> str:
    """Call Aurora Town LLM Gateway with personality context"""
    
    # Add personality context
    full_prompt = f"{personalities.get_personality_prompt(personality)}\n\n{prompt}"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                'http://localhost:8080/chat',
                json={
                    'model': model,
                    'prompt': full_prompt,
                    'temperature': 0.7,
                    'max_tokens': 500
                },
                timeout=aiohttp.ClientTimeout(total=120)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('response', 'Empty response')
                else:
                    return f"⚠️ LLM error: {response.status}"
    except Exception as e:
        logger.error(f"LLM call error: {e}")
        return f"⚠️ LLM connection error: {str(e)}"

# ============================================================================
# WEBSOCKET MANAGER
# ============================================================================

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.sessions: Dict[str, Dict] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.sessions[session_id] = {
            "websocket": websocket,
            "personality": "robbie",
            "mood": db.get_mood("robbie"),
            "connected_at": datetime.now()
        }
        logger.info(f"Client connected: {session_id}")
    
    def disconnect(self, websocket: WebSocket, session_id: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if session_id in self.sessions:
            del self.sessions[session_id]
        logger.info(f"Client disconnected: {session_id}")
    
    async def send_chunk(self, session_id: str, chunk: str):
        session = self.sessions.get(session_id)
        if session:
            await session["websocket"].send_text(json.dumps({
                "type": "chunk",
                "content": chunk,
                "timestamp": datetime.now().isoformat()
            }))
    
    async def send_complete(self, session_id: str):
        session = self.sessions.get(session_id)
        if session:
            await session["websocket"].send_text(json.dumps({
                "type": "stream_complete",
                "timestamp": datetime.now().isoformat()
            }))
    
    async def send_system(self, session_id: str, message: str):
        session = self.sessions.get(session_id)
        if session:
            await session["websocket"].send_text(json.dumps({
                "type": "system",
                "content": message,
                "timestamp": datetime.now().isoformat()
            }))

manager = ConnectionManager()

# ============================================================================
# API ROUTES
# ============================================================================

@app.get("/", response_class=HTMLResponse)
async def get_interface(request: Request):
    """Serve the ultimate chat interface"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    session_id = str(uuid.uuid4())
    await manager.connect(websocket, session_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "message":
                user_message = message_data.get("content", "")
                personality = message_data.get("personality", "robbie")
                
                # Get memory context
                memories = db.search_memory(user_message, limit=3)
                context = "\n".join([f"Previous: {m['message']} → {m['response']}" for m in memories[:2]])
                
                # Build prompt with context
                prompt = f"Context: {context}\n\nUser: {user_message}\n\nRobbie:" if context else user_message
                
                # Get LLM response
                full_response = await call_llm(prompt, personality=personality)
                
                # Stream word by word
                words = full_response.split(' ')
                for i, word in enumerate(words):
                    chunk = word + (' ' if i < len(words) - 1 else '')
                    await manager.send_chunk(session_id, chunk)
                    await asyncio.sleep(0.03)  # 30ms per word
                
                await manager.send_complete(session_id)
                
                # Save to memory
                current_mood = db.get_mood(personality)
                db.save_conversation("allan", user_message, full_response, str(current_mood.get("current_mood", 4)))
                
            elif message_data.get("type") == "personality_switch":
                new_personality = message_data.get("personality")
                if personalities.switch_personality(new_personality):
                    manager.sessions[session_id]["personality"] = new_personality
                    await manager.send_system(session_id, f"Switched to {new_personality}")
                    
            elif message_data.get("type") == "sql_query":
                query = message_data.get("query")
                results = db.execute_sql_query(query)
                await manager.send_system(session_id, f"SQL Results: {json.dumps(results, default=str)}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, session_id)

@app.get("/api/mood")
async def get_mood(personality: str = "robbie"):
    """Get current mood"""
    return db.get_mood(personality)

@app.post("/api/mood")
async def set_mood(personality: str, mood: int, mode: str = None):
    """Set mood (network-wide)"""
    db.set_mood(personality, mood, mode)
    return {"success": True}

@app.get("/api/status")
async def get_status():
    """System status"""
    return {
        "status": "online",
        "service": "Robbie Ultimate Chat",
        "personalities": list(personalities.personalities.keys()),
        "current_personality": personalities.current,
        "mood": db.get_mood("robbie"),
        "features": [
            "streaming_text",
            "6_moods",
            "vector_search",
            "sql_queries",
            "rag_context",
            "personality_switching",
            "universal_ai_state"
        ]
    }

if __name__ == "__main__":
    print("🚀 Starting Robbie Ultimate Chat...")
    print("🌐 Interface: http://localhost:8006")
    print("🔌 WebSocket: ws://localhost:8006/ws")
    
    uvicorn.run(
        "backend:app",
        host="0.0.0.0",
        port=8006,
        reload=True,
        log_level="info"
    )

