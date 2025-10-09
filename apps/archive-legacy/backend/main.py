"""
Robbie Memory API
Backend service for mood tracking, conversation logging, and vector memory search
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import httpx
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Robbie Memory API", version="1.0.0")

# CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")


def get_db():
    """Get database connection"""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


async def generate_embedding(text: str) -> List[float]:
    """Generate embedding using Ollama"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/embeddings",
                json={"model": EMBEDDING_MODEL, "prompt": text}
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("embedding", [])
            else:
                print(f"Ollama embedding error: {response.status_code}")
                return [0.0] * 768  # Fallback zero vector (nomic-embed-text uses 768 dims)
    except Exception as e:
        print(f"Embedding generation failed: {e}")
        return [0.0] * 768  # Fallback zero vector


# ============================================
# Pydantic Models
# ============================================

class MoodState(BaseModel):
    mood: str = Field(..., description="Current mood: friendly, focused, playful, bossy, surprised, blushing")
    attraction_level: int = Field(..., ge=1, le=11, description="Attraction level 1-11")
    gandhi_genghis_level: int = Field(..., ge=1, le=10, description="Gandhi-Genghis level 1-10")
    user_id: str = Field(default="allan", description="User ID")
    trigger_event: Optional[str] = Field(None, description="What triggered the mood change")
    explanation: Optional[str] = Field(None, description="Explanation for the mood change")
    personality_name: str = Field(default="Robbie", description="AI personality name")


class ConversationLog(BaseModel):
    user_message: str
    robbie_response: Optional[str] = None
    mood: str
    attraction_level: int = Field(ge=1, le=11)
    gandhi_genghis_level: int = Field(default=5, ge=1, le=10)
    context_tags: Optional[List[str]] = []
    user_id: str = "allan"
    session_id: Optional[str] = None


class MemorySearchQuery(BaseModel):
    query: str
    limit: int = Field(default=5, ge=1, le=50)
    user_id: str = "allan"
    mood_filter: Optional[str] = None


class MemorySearchResult(BaseModel):
    id: int
    timestamp: datetime
    user_message: str
    robbie_response: Optional[str]
    mood: str
    attraction_level: int
    context_tags: Optional[List[str]]
    similarity: float


# ============================================
# Health Check
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        conn = get_db()
        conn.close()
        return {
            "status": "healthy",
            "database": "connected",
            "ollama": OLLAMA_URL,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")


# ============================================
# Mood Endpoints
# ============================================

@app.get("/api/mood/current", response_model=MoodState)
async def get_current_mood():
    """Get current mood state"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT mood, attraction_level, gandhi_genghis_level, user_id
            FROM current_mood
            WHERE id = 1
        """)
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return MoodState(**dict(result))
        else:
            # Return default if not found
            return MoodState(
                mood="friendly",
                attraction_level=7,
                gandhi_genghis_level=5,
                user_id="allan"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/api/mood/update")
async def update_mood(mood_state: MoodState):
    """Update current mood and log to history with change events"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get previous mood for comparison
        cursor.execute("SELECT mood, attraction_level, gandhi_genghis_level FROM current_mood WHERE id = 1")
        previous = cursor.fetchone()
        
        prev_mood = previous['mood'] if previous else None
        prev_attraction = previous['attraction_level'] if previous else None
        prev_gandhi_genghis = previous['gandhi_genghis_level'] if previous else None
        
        # Update current mood
        cursor.execute("""
            UPDATE current_mood
            SET mood = %s,
                attraction_level = %s,
                gandhi_genghis_level = %s,
                last_updated = NOW(),
                user_id = %s
            WHERE id = 1
        """, (mood_state.mood, mood_state.attraction_level, 
              mood_state.gandhi_genghis_level, mood_state.user_id))
        
        # Log to mood history
        cursor.execute("""
            INSERT INTO mood_history (mood, attraction_level, gandhi_genghis_level, user_id)
            VALUES (%s, %s, %s, %s)
        """, (mood_state.mood, mood_state.attraction_level,
              mood_state.gandhi_genghis_level, mood_state.user_id))
        
        # Log mood change event if mood actually changed
        if (prev_mood != mood_state.mood or 
            prev_attraction != mood_state.attraction_level or 
            prev_gandhi_genghis != mood_state.gandhi_genghis_level):
            
            cursor.execute("""
                INSERT INTO mood_events (
                    user_id, personality_name, previous_mood, new_mood,
                    previous_attraction_level, new_attraction_level,
                    previous_gandhi_genghis_level, new_gandhi_genghis_level,
                    trigger_event, explanation
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                mood_state.user_id, mood_state.personality_name,
                prev_mood, mood_state.mood,
                prev_attraction, mood_state.attraction_level,
                prev_gandhi_genghis, mood_state.gandhi_genghis_level,
                mood_state.trigger_event or "manual_update",
                mood_state.explanation or f"Mood changed from {prev_mood} to {mood_state.mood}"
            ))
        
        conn.commit()
        conn.close()
        
        return {
            "status": "success",
            "mood": mood_state.mood,
            "attraction_level": mood_state.attraction_level,
            "gandhi_genghis_level": mood_state.gandhi_genghis_level
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/mood/history")
async def get_mood_history(limit: int = 20, user_id: str = "allan"):
    """Get mood history"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, timestamp, mood, trigger_event, duration_minutes,
                   attraction_level, gandhi_genghis_level
            FROM mood_history
            WHERE user_id = %s
            ORDER BY timestamp DESC
            LIMIT %s
        """, (user_id, limit))
        results = cursor.fetchall()
        conn.close()
        
        return {"history": [dict(row) for row in results]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ============================================
# Conversation Logging
# ============================================

@app.post("/api/conversation/log")
async def log_conversation(conversation: ConversationLog):
    """Log conversation with vector embedding"""
    try:
        # Generate embedding from user message
        embedding = await generate_embedding(conversation.user_message)
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Insert conversation with embedding
        cursor.execute("""
            INSERT INTO conversations 
            (user_message, robbie_response, mood, attraction_level, 
             gandhi_genghis_level, context_tags, user_id, session_id, embedding)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            conversation.user_message,
            conversation.robbie_response,
            conversation.mood,
            conversation.attraction_level,
            conversation.gandhi_genghis_level,
            conversation.context_tags,
            conversation.user_id,
            conversation.session_id,
            embedding
        ))
        
        conversation_id = cursor.fetchone()['id']
        conn.commit()
        conn.close()
        
        return {
            "status": "success",
            "conversation_id": conversation_id,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ============================================
# Memory Search (Vector Similarity)
# ============================================

@app.post("/api/memory/search", response_model=List[MemorySearchResult])
async def search_memory(query: MemorySearchQuery):
    """Search conversations using vector similarity"""
    try:
        # Generate embedding for search query
        query_embedding = await generate_embedding(query.query)
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Vector similarity search using cosine distance
        sql = """
            SELECT 
                id, timestamp, user_message, robbie_response, 
                mood, attraction_level, context_tags,
                1 - (embedding <=> %s::vector) as similarity
            FROM conversations
            WHERE user_id = %s
        """
        params = [query_embedding, query.user_id]
        
        # Optional mood filter
        if query.mood_filter:
            sql += " AND mood = %s"
            params.append(query.mood_filter)
        
        sql += """
            ORDER BY embedding <=> %s::vector
            LIMIT %s
        """
        params.extend([query_embedding, query.limit])
        
        cursor.execute(sql, params)
        results = cursor.fetchall()
        conn.close()
        
        return [MemorySearchResult(**dict(row)) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


@app.get("/api/memory/recent")
async def get_recent_conversations(limit: int = 10, user_id: str = "allan"):
    """Get recent conversations without vector search"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, timestamp, user_message, robbie_response, 
                   mood, attraction_level, context_tags
            FROM conversations
            WHERE user_id = %s
            ORDER BY timestamp DESC
            LIMIT %s
        """, (user_id, limit))
        
        results = cursor.fetchall()
        conn.close()
        
        return {"conversations": [dict(row) for row in results]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ============================================
# Context & Stats
# ============================================

@app.get("/api/context/stats")
async def get_context_stats(user_id: str = "allan"):
    """Get conversation and mood statistics"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Total conversations
        cursor.execute("SELECT COUNT(*) as total FROM conversations WHERE user_id = %s", (user_id,))
        total_convos = cursor.fetchone()['total']
        
        # Mood distribution
        cursor.execute("""
            SELECT mood, COUNT(*) as count
            FROM conversations
            WHERE user_id = %s
            GROUP BY mood
            ORDER BY count DESC
        """, (user_id,))
        mood_dist = [dict(row) for row in cursor.fetchall()]
        
        # Recent activity
        cursor.execute("""
            SELECT DATE(timestamp) as date, COUNT(*) as count
            FROM conversations
            WHERE user_id = %s
            GROUP BY DATE(timestamp)
            ORDER BY date DESC
            LIMIT 7
        """, (user_id,))
        recent_activity = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            "total_conversations": total_convos,
            "mood_distribution": mood_dist,
            "recent_activity": recent_activity,
            "user_id": user_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/personality/status")
async def get_personality_status():
    """Get real-time personality status - updates every minute"""
    try:
        import psutil
        import time
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Get current mood
        cursor.execute("SELECT mood, attraction_level, gandhi_genghis_level FROM current_mood WHERE user_id = 'allan'")
        mood_row = cursor.fetchone()
        
        if mood_row:
            mood, attraction_level, gandhi_genghis_level = mood_row['mood'], mood_row['attraction_level'], mood_row['gandhi_genghis_level']
        else:
            # Default values if no mood set
            mood = "focused"
            attraction_level = 11
            gandhi_genghis_level = 8
        
        conn.close()
        
        return {
            "timestamp": time.time(),
            "personality": {
                "mood": mood,
                "attraction_level": attraction_level,
                "gandhi_genghis_level": gandhi_genghis_level,
                "user_id": "allan"
            },
            "system": {
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_percent": psutil.disk_usage('/').percent
            },
            "status": "operational",
            "update_frequency": "60_seconds"
        }
    except Exception as e:
        import time
        return {"error": str(e), "timestamp": time.time()}


@app.get("/api/mood/events")
async def get_mood_events(limit: int = 10, user_id: str = "allan"):
    """Get recent mood change events with explanations"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                timestamp, personality_name, previous_mood, new_mood,
                previous_attraction_level, new_attraction_level,
                previous_gandhi_genghis_level, new_gandhi_genghis_level,
                trigger_event, explanation
            FROM mood_events 
            WHERE user_id = %s 
            ORDER BY timestamp DESC 
            LIMIT %s
        """, (user_id, limit))
        
        events = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return {
            "mood_events": events,
            "total_returned": len(events),
            "user_id": user_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ============================================
# Personality & Prompt Management
# ============================================

@app.get("/api/personalities/all")
async def get_all_personalities():
    """Get all personalities with categories"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.id, c.name as category, p.name, p.short_description, 
                   p.avatar, p.default_flirt_mode, p.default_gandhi_genghis, p.is_active
            FROM personalities p
            JOIN personality_categories c ON p.category_id = c.id
            WHERE p.is_active = true
            ORDER BY c.display_order, p.name
        """)
        personalities = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"personalities": personalities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/moods/all")
async def get_all_moods():
    """Get all mood definitions"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, emoji, description
            FROM moods
            ORDER BY display_order
        """)
        moods = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"moods": moods}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/prompts/all")
async def get_all_prompts():
    """Get all active prompts"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, personality_id, mood_id, system_prompt, tone, style,
                   emoji_guidelines, example_responses, version, 
                   usage_count, avg_satisfaction
            FROM prompts
            WHERE is_active = true
            ORDER BY personality_id, mood_id
        """)
        prompts = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"prompts": prompts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host=host, port=port)
