"""
Universal Mood & State Management
Robbie's mood changes based on events, persists EVERYWHERE
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import json

router = APIRouter()

# Active WebSocket connections for real-time mood broadcast
active_connections: List[WebSocket] = []

# Database connection
def get_db():
    return psycopg2.connect(
        host='localhost',
        port=5432,
        database='aurora',
        user='postgres',
        cursor_factory=RealDictCursor
    )

class MoodUpdate(BaseModel):
    user_id: str
    mood: str
    expression: str
    context: Optional[str] = None
    trigger_event: Optional[str] = None

# Mood trigger definitions
MOOD_TRIGGERS = {
    'deal_closed': {'mood': 'loving', 'expression': 'loving', 'duration_sec': 300},
    'coding_focused_30min': {'mood': 'focused', 'expression': 'focused', 'duration_sec': None},
    'debugging_long': {'mood': 'thoughtful', 'expression': 'thoughtful', 'duration_sec': None},
    'late_night': {'mood': 'sleepy', 'expression': 'thoughtful', 'duration_sec': None},
    'morning_start': {'mood': 'playful', 'expression': 'friendly', 'duration_sec': None},
    'git_push_success': {'mood': 'playful', 'expression': 'happy', 'duration_sec': 120},
    'tests_passing': {'mood': 'loving', 'expression': 'content', 'duration_sec': 180},
    'build_failed': {'mood': 'thoughtful', 'expression': 'focused', 'duration_sec': None},
    'revenue_milestone': {'mood': 'hyper', 'expression': 'loving', 'duration_sec': 600},
    'got_hot_bothered': {'mood': 'playful', 'expression': 'blushing', 'duration_sec': 300},
}

def ensure_state_table():
    """Ensure robbie_current_state table exists"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS robbie_current_state (
            user_id VARCHAR(255) PRIMARY KEY,
            current_mood VARCHAR(50) DEFAULT 'playful',
            current_expression VARCHAR(50) DEFAULT 'friendly',
            context VARCHAR(255),
            last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            trigger_event VARCHAR(255),
            duration_until TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Insert default for Allan
    cursor.execute("""
        INSERT INTO robbie_current_state (user_id, current_mood, current_expression)
        VALUES ('allan', 'playful', 'friendly')
        ON CONFLICT (user_id) DO NOTHING
    """)
    
    conn.commit()
    cursor.close()
    conn.close()

ensure_state_table()

@router.get("/mood/current")
async def get_current_mood(user_id: str = "allan"):
    """Get Robbie's current mood and expression"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT current_mood, current_expression, context, trigger_event, updated_at
        FROM robbie_current_state
        WHERE user_id = %s
    """, (user_id,))
    
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if result:
        return {
            "mood": result['current_mood'],
            "expression": result['current_expression'],
            "context": result['context'],
            "trigger": result['trigger_event'],
            "updated_at": result['updated_at'].isoformat() if result['updated_at'] else None
        }
    
    return {"mood": "playful", "expression": "friendly"}

@router.post("/mood/trigger")
async def trigger_mood_event(event: Dict):
    """Trigger a mood change based on system event"""
    event_type = event.get('event_type')
    user_id = event.get('user_id', 'allan')
    
    if event_type not in MOOD_TRIGGERS:
        return {"success": False, "error": "Unknown event type"}
    
    trigger = MOOD_TRIGGERS[event_type]
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Calculate duration
    duration_until = None
    if trigger['duration_sec']:
        duration_until = datetime.now() + timedelta(seconds=trigger['duration_sec'])
    
    # Update mood
    cursor.execute("""
        UPDATE robbie_current_state
        SET current_mood = %s,
            current_expression = %s,
            trigger_event = %s,
            duration_until = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = %s
    """, (trigger['mood'], trigger['expression'], event_type, duration_until, user_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    # Broadcast to all connected clients
    await broadcast_mood_update({
        "user_id": user_id,
        "mood": trigger['mood'],
        "expression": trigger['expression'],
        "trigger": event_type
    })
    
    return {
        "success": True,
        "mood": trigger['mood'],
        "expression": trigger['expression'],
        "duration_sec": trigger['duration_sec']
    }

@router.post("/mood/manual")
async def set_mood_manual(update: MoodUpdate):
    """Manually set mood (for special cases)"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE robbie_current_state
        SET current_mood = %s,
            current_expression = %s,
            context = %s,
            trigger_event = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = %s
    """, (update.mood, update.expression, update.context, update.trigger_event, update.user_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    # Broadcast update
    await broadcast_mood_update(update.dict())
    
    return {"success": True}

@router.websocket("/ws/mood")
async def mood_websocket(websocket: WebSocket):
    """WebSocket for real-time mood updates"""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        # Send current state immediately
        current = await get_current_mood()
        await websocket.send_json(current)
        
        # Keep connection alive
        while True:
            data = await websocket.receive_text()
            # Echo back (heartbeat)
            await websocket.send_text("pong")
    except WebSocketDisconnect:
        active_connections.remove(websocket)

async def broadcast_mood_update(update: Dict):
    """Broadcast mood change to all connected clients"""
    for connection in active_connections:
        try:
            await connection.send_json({
                "type": "mood_update",
                "data": update
            })
        except:
            active_connections.remove(connection)

@router.get("/mood/history")
async def get_mood_history(user_id: str = "allan", hours: int = 24):
    """Get mood change history"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mood_history (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255),
            mood VARCHAR(50),
            expression VARCHAR(50),
            trigger_event VARCHAR(255),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    
    cutoff = datetime.now() - timedelta(hours=hours)
    
    cursor.execute("""
        SELECT mood, expression, trigger_event, timestamp
        FROM mood_history
        WHERE user_id = %s AND timestamp >= %s
        ORDER BY timestamp DESC
    """, (user_id, cutoff))
    
    history = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return {"history": history}

def log_mood_change(user_id: str, mood: str, expression: str, trigger: str):
    """Log mood changes for analysis"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO mood_history (user_id, mood, expression, trigger_event)
        VALUES (%s, %s, %s, %s)
    """, (user_id, mood, expression, trigger))
    
    conn.commit()
    cursor.close()
    conn.close()
