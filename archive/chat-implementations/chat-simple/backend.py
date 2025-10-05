#!/usr/bin/env python3
"""
Robbie Simple Chat - Tabbed Interface
Just Robbie personality + Chat/Notes/Comms tabs + 6 moods
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import json
import asyncio
import aiohttp
import os
import psycopg2
from datetime import datetime

app = FastAPI(title="Robbie Simple Chat")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', 'aurora-postgres-u44170.vm.elestio.app'),
        port=os.getenv('POSTGRES_PORT', '25432'),
        database=os.getenv('POSTGRES_DB', 'aurora_unified'),
        user=os.getenv('POSTGRES_USER', 'aurora_app'),
        password=os.getenv('POSTGRES_PASSWORD', 'TestPilot2025_Aurora!'),
        sslmode='require'
    )

# Business Context Functions
def get_recent_emails(limit=5):
    """Get recent emails from database"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT subject, sender_name, sender_email, body, received_at, importance
            FROM emails
            ORDER BY received_at DESC
            LIMIT %s
        """, (limit,))
        emails = cur.fetchall()
        conn.close()
        
        if emails:
            email_summary = f"\n📧 Recent Emails ({len(emails)}):\n"
            for subject, name, email, body, date, importance in emails:
                email_summary += f"- From {name} ({email}): '{subject}' [Importance: {importance}/10]\n"
            return email_summary
        return ""
    except Exception as e:
        print(f"Email fetch error: {e}")
        return ""

def get_upcoming_meetings(limit=3):
    """Get upcoming meetings"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT title, start_time, notes
            FROM meetings
            WHERE start_time > NOW()
            ORDER BY start_time
            LIMIT %s
        """, (limit,))
        meetings = cur.fetchall()
        conn.close()
        
        if meetings:
            meeting_summary = f"\n📅 Upcoming Meetings ({len(meetings)}):\n"
            for title, start, notes in meetings:
                meeting_summary += f"- {title} at {start.strftime('%b %d, %I:%M%p')}\n"
            return meeting_summary
        return ""
    except Exception as e:
        print(f"Meeting fetch error: {e}")
        return ""

def get_business_context():
    """Get comprehensive business context for Robbie"""
    context = "\n=== BUSINESS CONTEXT ===\n"
    context += get_recent_emails(3)
    context += get_upcoming_meetings(2)
    context += "\n=== END CONTEXT ===\n"
    return context

# WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def send_streaming_chunk(self, content: str, websocket: WebSocket):
        await websocket.send_text(json.dumps({
            "type": "chunk",
            "content": content
        }))
    
    async def send_stream_complete(self, websocket: WebSocket):
        await websocket.send_text(json.dumps({
            "type": "stream_complete"
        }))

manager = ConnectionManager()

# 6 MOODS - THE CORRECT ONES
ROBBIE_MOODS = {
    'friendly': {'file': 'robbie-friendly.png', 'name': 'Friendly', 'percent': 60},
    'bossy': {'file': 'robbie-bossy.png', 'name': 'Bossy', 'percent': 10},
    'playful': {'file': 'robbie-playful.png', 'name': 'Playful', 'percent': 10},
    'blushing': {'file': 'robbie-blushing.png', 'name': 'Blushing', 'percent': 5},
    'surprised': {'file': 'robbie-surprised.png', 'name': 'Surprised', 'percent': 10},
    'focused': {'file': 'robbie-focused.png', 'name': 'Focused', 'percent': 5}
}

def detect_robbie_mood(content):
    """Detect Robbie's mood from message content"""
    lower = content.lower()
    
    if any(word in lower for word in ['need to', 'must ', 'should ', 'have to', 'urgent', 'asap']):
        return 'bossy'
    elif any(word in lower for word in ['haha', 'fun', 'play', 'silly', 'lol', 'joke']):
        return 'playful'
    elif any(word in lower for word in ['thank', 'appreciate', 'love you', 'brilliant', 'amazing']):
        return 'blushing'
    elif any(word in lower for word in ['error', 'problem', 'down', 'failed', 'issue', 'broken']):
        return 'surprised'
    elif any(word in lower for word in ['analyzing', 'working on', 'reviewing', 'checking', 'investigating']):
        return 'focused'
    
    return 'friendly'  # Default ~60%

async def stream_llm_response(message, websocket):
    """BATCH MODE - Get full response, then format and send"""
    try:
        full_response = None
        
        # Get business context
        business_context = get_business_context()
        enhanced_prompt = f"{business_context}\n\nAllan asks: {message}\n\nRobbie (strategic, direct, revenue-focused):"
        
        # 🚀 PRIORITY 1: LOCAL RTX 4090 - BATCH MODE for formatting
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    'http://localhost:11434/api/generate',
                    json={
                        "model": "robbie",
                        "prompt": enhanced_prompt,
                        "stream": False  # BATCH MODE - wait for full response
                    },
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        full_response = data.get('response', '').strip()
        except Exception as e:
            print(f"Local GPU failed: {e}")
            
        # 🌐 PRIORITY 2: Aurora LLM Gateway (Fallback)
        if not full_response:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        'http://10.0.0.1:8001/llm/generate',
                        json={
                            "message": message,
                            "personality": "robbie",
                            "stream": False
                        },
                        timeout=aiohttp.ClientTimeout(total=5)
                    ) as response:
                        if response.status == 200:
                            data = await response.json()
                            full_response = data.get('response', '').strip()
            except Exception as e2:
                print(f"Aurora Gateway failed: {e2}")
                
                # 🏔️ PRIORITY 3: RunPod GPU via SSH Tunnel (Last resort)
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.post(
                            'http://localhost:11435/api/generate',
                            json={
                                "model": "robbie",
                                "prompt": message,
                                "stream": False
                            },
                            timeout=aiohttp.ClientTimeout(total=5)
                        ) as response:
                            if response.status == 200:
                                data = await response.json()
                                full_response = data.get('response', '').strip()
                except Exception as e3:
                    print(f"RunPod failed: {e3}")
                    full_response = "Hi Allan! I'm having trouble connecting to the AI system right now. Let me try to get that sorted out for you! 🤖"
                
        if not full_response:
            full_response = "Hey Allan! I'm here but having some technical difficulties. Give me a moment to get back up to speed! 💪"
        
        # Send the FULL formatted response at once
        await manager.send_streaming_chunk(full_response, websocket)
        await manager.send_stream_complete(websocket)
        
    except Exception as e:
        await manager.send_personal_message(json.dumps({
            "type": "error",
            "content": f"Hey Allan, I hit a snag: {str(e)}. Let me try again!"
        }), websocket)

@app.get("/", response_class=HTMLResponse)
async def get_chat_page(request: Request):
    # Serve terminal interface by default
    return templates.TemplateResponse("terminal.html", {"request": request})

@app.get("/ui", response_class=HTMLResponse)
async def get_ui_page(request: Request):
    # Modern UI available at /ui
    return templates.TemplateResponse("index.html", {"request": request})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "message":
                content = message_data.get("content", "")
                if content.strip():
                    await stream_llm_response(content, websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/status")
async def get_status():
    return {
        "status": "online",
        "service": "Robbie Simple Chat",
        "personality": "robbie",
        "moods": ROBBIE_MOODS,
        "features": ["streaming_text", "6_moods", "tabbed_interface"]
    }

@app.get("/api/mood")
async def get_current_mood():
    """Get Robbie's current mood from database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT current_mood FROM robbie_personality WHERE id = 1"
        )
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        current_mood = result[0] if result else 4  # Default to friendly
        return {"current_mood": current_mood}
    except:
        return {"current_mood": 4}

@app.post("/api/mood")
async def update_mood(request: Request):
    """Update Robbie's mood"""
    try:
        data = await request.json()
        mood_number = data.get('mood', 4)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO robbie_personality (id, current_mood, updated_at) VALUES (1, %s, %s) ON CONFLICT (id) DO UPDATE SET current_mood = %s, updated_at = %s",
            [mood_number, datetime.now(), mood_number, datetime.now()]
        )
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"success": True, "mood": mood_number}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8007)
