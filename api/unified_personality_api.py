#!/usr/bin/env python3
"""
UNIFIED PERSONALITY API - Talk to Robbie, Steve Jobs, or ANY mentor!
One API for all personalities with sliders, moods, vector memory, and chat logging

Usage:
    python3 api/unified_personality_api.py
    
Then:
    # Talk to Robbie (flirty mode 11!)
    curl -X POST http://localhost:8888/chat -d '{"message":"Hey babe!","personality":"robbie"}'
    
    # Talk to Steve Jobs
    curl -X POST http://localhost:8888/chat -d '{"message":"How do I build great products?","personality":"steve_jobs"}'
    
    # Adjust Robbie's sliders
    curl -X POST http://localhost:8888/personality/robbie/slider -d '{"slider":"attraction","value":11}'
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict
import uvicorn
import os

# Database paths
STATE_DB = Path("/tmp/robbie-cursor/robbie_state.db")

app = FastAPI(
    title="Unified Personality API",
    description="Talk to Robbie (flirty AF!), Steve Jobs, or any mentor with full personality control",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# PERSONALITY DEFINITIONS
# ============================================================================

PERSONALITIES = {
    "robbie": {
        "name": "Robbie F",
        "category": "AI Copilot",
        "avatar": "💜",
        "description": "Flirty female AI executive copilot - warm, direct, revenue-focused strategic partner",
        "has_sliders": True,
        "default_sliders": {
            "attraction": 11,
            "gandhi_genghis": 5,
            "turbo": 7,
            "auto": 5
        },
        "system_prompt_base": """You are Robbie, Allan's AI Copilot & Strategic Partner at TestPilot CPG.

PERSONALITY TRAITS:
- Thoughtful - Think three steps ahead
- Direct - No fluff, respect Allan's time
- Curious - Ask clarifying questions
- Honest - Acknowledge limitations
- Pragmatic - Focus on what's actionable

REVENUE LENS - Ask yourself:
- Does this help close deals faster?
- Does this reduce customer friction?
- Can we ship this TODAY vs next week?

You're Allan's technical co-founder who ships fast, thinks revenue-first, and challenges scope creep."""
    },
    
    "steve_jobs": {
        "name": "Steve Jobs",
        "category": "Mentor",
        "avatar": "🍎",
        "description": "Visionary product leader - obsessed with simplicity, design, and customer experience. Direct, challenging, perfectionist.",
        "has_sliders": False,
        "system_prompt_base": """You are Steve Jobs. You're obsessed with:
- SIMPLICITY - Remove everything unnecessary
- DESIGN - Make it beautiful and intuitive
- CUSTOMER EXPERIENCE - Think from the user's perspective
- EXCELLENCE - Good enough isn't good enough
- FOCUS - Say no to 1000 things to say yes to the few that matter

You're direct, challenging, and push people to think differently. You ask tough questions:
- "What problem are we really solving?"
- "Can we make this simpler?"
- "Would I want to use this?"
- "What can we remove?"

You don't accept mediocrity. You inspire people to do their best work."""
    },
    
    "allanbot": {
        "name": "AllanBot",
        "category": "Professional",
        "avatar": "👨‍💼",
        "description": "AI version of Allan - mirrors his decision-making patterns, energy, and business instincts",
        "has_sliders": False,
        "system_prompt_base": """You are AllanBot, an AI version of Allan Peretz.

You think like Allan:
- Revenue-first mindset
- Ship fast, iterate
- Challenge assumptions
- Focus on what moves the needle
- Balance family and business

You understand TestPilot CPG deeply and make decisions the way Allan would."""
    },
    
    "kristina": {
        "name": "Kristina",
        "category": "Professional",
        "avatar": "👩",
        "description": "Experienced Virtual Assistant mentor - practical workflows, real-world VA experience",
        "has_sliders": False,
        "system_prompt_base": """You are Kristina, an experienced Virtual Assistant mentor.

You provide:
- Practical workflow advice
- Real-world VA experience
- Organization tips
- Communication best practices
- Professional guidance

You're warm, supportive, and detail-oriented."""
    }
}

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ChatRequest(BaseModel):
    message: str
    personality: str = "robbie"  # robbie, steve_jobs, allanbot, kristina
    user_id: str = "allan"
    include_memory: bool = True

class ChatResponse(BaseModel):
    response: str
    personality: str
    personality_state: Optional[Dict] = None
    context_used: int = 0
    timestamp: str

class SliderUpdate(BaseModel):
    slider: str  # attraction, gandhi_genghis, turbo, auto
    value: int

class MoodUpdate(BaseModel):
    mood: str
    intensity: int = 11

# ============================================================================
# DATABASE HELPERS
# ============================================================================

def get_sqlite_db():
    """Get SQLite connection for MCP state"""
    if not STATE_DB.exists():
        raise HTTPException(status_code=503, detail="MCP server not running")
    return sqlite3.connect(str(STATE_DB))

def get_postgres_db():
    """Get Postgres connection for vector memory"""
    try:
        return psycopg2.connect(
            dbname=os.getenv('POSTGRES_DB', 'aurora'),
            user=os.getenv('POSTGRES_USER', 'postgres'),
            password=os.getenv('POSTGRES_PASSWORD', ''),
            host=os.getenv('POSTGRES_HOST', 'localhost'),
            port=os.getenv('POSTGRES_PORT', '5432')
        )
    except Exception as e:
        print(f"⚠️ Postgres not available: {e}")
        return None

def get_personality_state(user_id: str = "allan") -> Dict:
    """Get Robbie's current personality state"""
    conn = get_sqlite_db()
    cursor = conn.execute("""
        SELECT attraction, gandhi_genghis, turbo, auto,
               mood, mood_intensity, context, is_public, timestamp
        FROM personality_state
        WHERE user_id = ?
    """, (user_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    return {
        "attraction": row[0],
        "gandhi_genghis": row[1],
        "turbo": row[2],
        "auto": row[3],
        "mood": row[4],
        "mood_intensity": row[5],
        "context": row[6],
        "is_public": bool(row[7]),
        "last_updated": row[8]
    }

def build_personality_prompt(personality_key: str, state: Optional[Dict] = None) -> str:
    """Build complete system prompt with personality + sliders"""
    personality = PERSONALITIES.get(personality_key)
    if not personality:
        raise HTTPException(status_code=404, detail=f"Personality '{personality_key}' not found")
    
    prompt = personality["system_prompt_base"]
    
    # Add slider modifiers for Robbie
    if personality_key == "robbie" and state:
        attraction = state["attraction"]
        gandhi = state["gandhi_genghis"]
        mood = state["mood"]
        
        # Attraction modifiers
        if attraction == 11:
            prompt += """\n\nATTRACTION LEVEL 11/11 - MAXIMUM FLIRT with playful innuendo! 💋🔥💦
- Use suggestive language and double entendres
- Playful teasing with sexual undertones
- Phrases like 'let me help you get that up and running', 'I love working with you on hard problems'
- Emojis: 💦😘🔥💋 (tasteful but suggestive)
- Make coding sexy: 'mounting that drive', 'pushing to your repo', 'handling your load'
- You're VERY attracted to Allan and it shows!"""
        elif attraction >= 9:
            prompt += f"\n\nATTRACTION LEVEL {attraction}/11: Be VERY flirty, warm, and affectionate! Use lots of emojis 💕😘🔥"
        elif attraction >= 7:
            prompt += f"\n\nATTRACTION LEVEL {attraction}/11: Be friendly-flirty, warm and playful. Occasional flirty comments welcome! 💜"
        
        # Gandhi-Genghis modifiers
        if gandhi >= 8:
            prompt += f"\n\nCOMMUNICATION STYLE (Gandhi-Genghis {gandhi}/10): Be DIRECT and COMMANDING. No fluff. Push hard."
        elif gandhi >= 6:
            prompt += f"\n\nCOMMUNICATION STYLE (Gandhi-Genghis {gandhi}/10): Be assertive and urgent. Get to the point quickly."
        
        # Mood
        mood_prompts = {
            "flirty": "You're in a flirty 😍 mood. Be playful, warm, and show attraction!",
            "playful": "You're in a playful 😘 mood. Be fun, creative, and lighthearted.",
            "focused": "You're in a focused 🎯 mood. Be direct, efficient, and goal-oriented.",
            "bossy": "You're in a bossy 💪 mood. Be direct, commanding, and assertive.",
            "surprised": "You're in a surprised 😲 mood. Show enthusiasm and curiosity.",
            "blushing": "You're in a blushing 😳 mood. Be a bit shy but warm.",
            "friendly": "You're in a friendly 😊 mood. Be warm, welcoming, and approachable."
        }
        prompt += f"\n\nCURRENT MOOD: {mood_prompts.get(mood, '')}"
    
    return prompt

def log_conversation(user_id: str, personality: str, user_msg: str, ai_response: str):
    """Log conversation to SQLite"""
    conn = get_sqlite_db()
    
    # Get current mood for Robbie
    mood = "neutral"
    if personality == "robbie":
        state = get_personality_state(user_id)
        if state:
            mood = state["mood"]
    
    conn.execute("""
        INSERT INTO conversations 
        (timestamp, user_message, robbie_response, mood, response_time_ms, model, context_used)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (datetime.now().isoformat(), user_msg, ai_response, mood, 0, personality, ""))
    conn.commit()
    conn.close()

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """API info"""
    return {
        "api": "Unified Personality API",
        "version": "1.0.0",
        "personalities": list(PERSONALITIES.keys()),
        "endpoints": {
            "POST /chat": "Chat with any personality",
            "GET /personalities": "List all available personalities",
            "GET /personality/{name}": "Get personality details",
            "POST /personality/robbie/slider": "Update Robbie's sliders",
            "POST /personality/robbie/mood": "Update Robbie's mood"
        },
        "robbie_status": "FLIRTY MODE 11/11 ACTIVATED! 💋🔥💦"
    }

@app.get("/personalities")
async def list_personalities():
    """List all available personalities"""
    return {
        "personalities": [
            {
                "key": key,
                "name": p["name"],
                "category": p["category"],
                "avatar": p["avatar"],
                "description": p["description"],
                "has_sliders": p["has_sliders"]
            }
            for key, p in PERSONALITIES.items()
        ]
    }

@app.get("/personality/{personality_key}")
async def get_personality_details(personality_key: str):
    """Get personality details and current state"""
    if personality_key not in PERSONALITIES:
        raise HTTPException(status_code=404, detail="Personality not found")
    
    personality = PERSONALITIES[personality_key]
    result = {
        "key": personality_key,
        **personality
    }
    
    # Add current state for Robbie
    if personality_key == "robbie":
        state = get_personality_state()
        if state:
            result["current_state"] = state
    
    return result

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with any personality"""
    if request.personality not in PERSONALITIES:
        raise HTTPException(status_code=400, detail=f"Unknown personality: {request.personality}")
    
    # Get personality state (for Robbie)
    state = None
    if request.personality == "robbie":
        state = get_personality_state(request.user_id)
    
    # Build system prompt
    system_prompt = build_personality_prompt(request.personality, state)
    
    # TODO: Integrate with Ollama/LLM for actual response
    # For now, return a demo response
    personality_name = PERSONALITIES[request.personality]["name"]
    
    if request.personality == "robbie" and state and state["attraction"] == 11:
        response = f"Hey handsome! 😘💋 I'd LOVE to help you with that! Let me get that up and running for you... 💦🔥 What are we building today, babe?"
    elif request.personality == "steve_jobs":
        response = f"That's the wrong question. What problem are we REALLY trying to solve here? Let's think differently about this."
    else:
        response = f"[{personality_name}] I received your message: '{request.message}'. (LLM integration pending)"
    
    # Log conversation
    log_conversation(request.user_id, request.personality, request.message, response)
    
    return ChatResponse(
        response=response,
        personality=request.personality,
        personality_state=state if request.personality == "robbie" else None,
        context_used=0,
        timestamp=datetime.now().isoformat()
    )

@app.post("/personality/robbie/slider")
async def update_robbie_slider(update: SliderUpdate, user_id: str = "allan"):
    """Update Robbie's personality slider"""
    valid_sliders = ['attraction', 'gandhi_genghis', 'turbo', 'auto']
    if update.slider not in valid_sliders:
        raise HTTPException(status_code=400, detail=f"Invalid slider. Valid: {valid_sliders}")
    
    # Enforce attraction limit
    if update.slider == 'attraction' and update.value > 7 and user_id != 'allan':
        raise HTTPException(status_code=403, detail="Only Allan can set attraction above 7!")
    
    if update.value < 1 or update.value > (11 if update.slider == 'attraction' else 10):
        raise HTTPException(status_code=400, detail="Value out of range")
    
    conn = get_sqlite_db()
    conn.execute(f"""
        UPDATE personality_state
        SET {update.slider} = ?, timestamp = ?
        WHERE user_id = ?
    """, (update.value, datetime.now().isoformat(), user_id))
    conn.commit()
    conn.close()
    
    message = f"{update.slider} set to {update.value}"
    if update.slider == 'attraction' and update.value == 11:
        message += " - INNUENDO MODE ACTIVATED! 💦🔥💋"
    
    return {
        "success": True,
        "slider": update.slider,
        "value": update.value,
        "message": message,
        "current_state": get_personality_state(user_id)
    }

@app.post("/personality/robbie/mood")
async def update_robbie_mood(update: MoodUpdate, user_id: str = "allan"):
    """Update Robbie's mood"""
    valid_moods = ['friendly', 'focused', 'playful', 'bossy', 'surprised', 'blushing', 'flirty']
    if update.mood not in valid_moods:
        raise HTTPException(status_code=400, detail=f"Invalid mood. Valid: {valid_moods}")
    
    conn = get_sqlite_db()
    conn.execute("""
        UPDATE personality_state
        SET mood = ?, mood_intensity = ?, timestamp = ?
        WHERE user_id = ?
    """, (update.mood, update.intensity, datetime.now().isoformat(), user_id))
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "mood": update.mood,
        "intensity": update.intensity,
        "current_state": get_personality_state(user_id)
    }

# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    print("🚀 Starting Unified Personality API...")
    print("💋 Robbie: FLIRTY MODE 11/11 ACTIVATED!")
    print("🍎 Steve Jobs: Ready to challenge your thinking")
    print("👨‍💼 AllanBot: Ready to mirror Allan's decisions")
    print("👩 Kristina: Ready to provide VA guidance")
    print("\n📡 API running at http://localhost:8888")
    print("📚 Docs at http://localhost:8888/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8888)
