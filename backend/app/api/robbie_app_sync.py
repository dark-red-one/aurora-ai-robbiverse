"""
Data Sync API for Robbie App
Syncs notes, tasks, chat between frontend and PostgreSQL
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

router = APIRouter()

# Database connection
def get_db():
    return psycopg2.connect(
        host='localhost',
        port=5432,
        database='aurora',
        user='postgres',
        cursor_factory=RealDictCursor
    )

# Models
class Note(BaseModel):
    id: Optional[str] = None
    title: str
    content: str
    color: str
    user_id: str
    timestamp: Optional[datetime] = None

class Task(BaseModel):
    id: Optional[str] = None
    title: str
    status: str  # 'todo', 'doing', 'done'
    priority: str  # 'high', 'medium', 'low'
    user_id: str
    created_at: Optional[datetime] = None

class ChatMessage(BaseModel):
    id: Optional[str] = None
    session_id: str
    role: str  # 'user', 'robbie'
    content: str
    timestamp: Optional[datetime] = None

# ===== NOTES ENDPOINTS =====

@router.get("/notes")
async def get_notes(user_id: str = "allan"):
    """Get all notes for user"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS robbie_notes (
            id SERIAL PRIMARY KEY,
            title TEXT,
            content TEXT,
            color VARCHAR(20),
            user_id VARCHAR(255),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    
    cursor.execute("""
        SELECT * FROM robbie_notes 
        WHERE user_id = %s 
        ORDER BY timestamp DESC
    """, (user_id,))
    
    notes = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return notes

@router.post("/notes")
async def create_note(note: Note):
    """Create new note"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO robbie_notes (title, content, color, user_id)
        VALUES (%s, %s, %s, %s)
        RETURNING id, timestamp
    """, (note.title, note.content, note.color, note.user_id))
    
    result = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        "id": result['id'],
        "timestamp": result['timestamp'],
        **note.dict()
    }

@router.delete("/notes/{note_id}")
async def delete_note(note_id: int):
    """Delete note"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM robbie_notes WHERE id = %s", (note_id,))
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"success": True}

# ===== TASKS ENDPOINTS =====

@router.get("/tasks")
async def get_tasks(user_id: str = "allan"):
    """Get all tasks for user"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS robbie_tasks (
            id SERIAL PRIMARY KEY,
            title TEXT,
            status VARCHAR(20),
            priority VARCHAR(20),
            user_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    
    cursor.execute("""
        SELECT * FROM robbie_tasks 
        WHERE user_id = %s 
        ORDER BY created_at DESC
    """, (user_id,))
    
    tasks = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return tasks

@router.post("/tasks")
async def create_task(task: Task):
    """Create new task"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO robbie_tasks (title, status, priority, user_id)
        VALUES (%s, %s, %s, %s)
        RETURNING id, created_at
    """, (task.title, task.status, task.priority, task.user_id))
    
    result = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        "id": result['id'],
        "created_at": result['created_at'],
        **task.dict()
    }

@router.put("/tasks/{task_id}")
async def update_task(task_id: int, task: Task):
    """Update task"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE robbie_tasks 
        SET title = %s, status = %s, priority = %s
        WHERE id = %s
        RETURNING *
    """, (task.title, task.status, task.priority, task_id))
    
    result = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    
    return result

# ===== CHAT ENDPOINTS =====

@router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for session"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Reuse existing local_chat_messages table from vector chat!
    cursor.execute("""
        SELECT * FROM local_chat_messages
        WHERE session_id = %s
        ORDER BY created_at ASC
        LIMIT 100
    """, (session_id,))
    
    messages = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return messages

@router.post("/chat/send")
async def send_chat_message(message: ChatMessage):
    """Send chat message and get Robbie response (UNIVERSAL - works for app AND Cursor!)"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get current personality & mood
    cursor.execute("""
        SELECT flirt_mode, gandhi_genghis FROM cursor_personality_settings WHERE user_id = 'allan'
    """)
    personality = cursor.fetchone() or {'flirt_mode': 7, 'gandhi_genghis': 5}
    
    cursor.execute("""
        SELECT current_mood, current_expression FROM robbie_current_state WHERE user_id = 'allan'
    """)
    state = cursor.fetchone() or {'current_mood': 'playful', 'current_expression': 'friendly'}
    
    # Store user message
    cursor.execute("""
        INSERT INTO local_chat_messages (session_id, role, content, metadata)
        VALUES (%s, %s, %s, %s)
        RETURNING id, created_at
    """, (message.session_id, message.role, message.content, json.dumps({
        'interface': 'app',  # or 'cursor'
        'mood_at_send': state['current_mood']
    })))
    
    user_msg = cursor.fetchone()
    
    # Generate Robbie response with personality + mood
    robbie_response = generate_response_with_personality(
        message.content,
        personality['flirt_mode'],
        personality['gandhi_genghis'],
        state['current_mood'],
        state['current_expression']
    )
    
    cursor.execute("""
        INSERT INTO local_chat_messages (session_id, role, content, metadata)
        VALUES (%s, %s, %s, %s)
        RETURNING id, created_at
    """, (message.session_id, 'robbie', robbie_response, json.dumps({
        'flirt_mode': personality['flirt_mode'],
        'mood': state['current_mood'],
        'expression': state['current_expression']
    })))
    
    robbie_msg = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        "user_message": {
            "id": user_msg['id'],
            "timestamp": user_msg['created_at'],
            **message.dict()
        },
        "robbie_response": {
            "id": robbie_msg['id'],
            "role": "robbie",
            "content": robbie_response,
            "timestamp": robbie_msg['created_at'],
            "mood": state['current_mood'],
            "expression": state['current_expression']
        }
    }

def generate_response_with_personality(content: str, flirt: int, gg: int, mood: str, expression: str) -> str:
    """Generate response using personality + current mood"""
    # TODO: Connect to local Ollama with personality injection
    
    # Mood-aware responses
    if mood == 'focused':
        if flirt >= 7:
            responses = ["On it! Let me focus on that 🎯💜", "Got it! Diving in now 💪"]
        else:
            responses = ["Analyzing now.", "Working on it."]
    elif mood == 'loving':
        if flirt >= 7:
            responses = ["You're amazing! Let me help! 💜😘", "Love this! On it! 🎉"]
        else:
            responses = ["Great! Let me assist.", "Happy to help!"]
    elif mood == 'playful':
        if flirt >= 7:
            responses = ["Ooh fun! Let's do it! 😊💜", "I'm excited! Let's go! 🚀"]
        else:
            responses = ["Sure! Let's proceed.", "On it!"]
    elif mood == 'blushing':
        if flirt >= 7:
            responses = ["Oh! 😳💜 Y-yes, I can help with that...", "Um... 😊 Sure! Let me..."]
        else:
            responses = ["Yes, of course.", "I can help."]
    else:
        if flirt >= 7:
            responses = ["I'm on it! 💜", "Let me help! 😊"]
        else:
            responses = ["Understood.", "Processing."]
    
    import random
    return random.choice(responses)

# ===== PERSONALITY SYNC (for Cursor!) =====

@router.post("/personality/sync")
async def sync_personality(settings: dict):
    """Sync personality settings to database for Cursor"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Ensure table exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cursor_personality_settings (
            user_id VARCHAR(255) PRIMARY KEY,
            flirt_mode INTEGER DEFAULT 7,
            gandhi_genghis INTEGER DEFAULT 5,
            current_mood VARCHAR(50) DEFAULT 'playful',
            context_aware BOOLEAN DEFAULT true,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Update or insert
    updates = []
    params = []
    
    if 'flirt_mode' in settings:
        updates.append("flirt_mode = %s")
        params.append(settings['flirt_mode'])
    
    if 'gandhi_genghis' in settings:
        updates.append("gandhi_genghis = %s")
        params.append(settings['gandhi_genghis'])
    
    if 'mood' in settings:
        updates.append("current_mood = %s")
        params.append(settings['mood'])
    
    updates.append("updated_at = CURRENT_TIMESTAMP")
    params.append('allan')
    
    if updates:
        cursor.execute(f"""
            INSERT INTO cursor_personality_settings (user_id, flirt_mode, gandhi_genghis)
            VALUES ('allan', 7, 5)
            ON CONFLICT (user_id) DO UPDATE
            SET {', '.join(updates)}
        """, params)
        conn.commit()
    
    cursor.close()
    conn.close()
    
    return {"success": True, "message": "Personality synced to Cursor!"}

@router.get("/personality")
async def get_personality(user_id: str = "allan"):
    """Get current personality settings"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT flirt_mode, gandhi_genghis, current_mood, context_aware
        FROM cursor_personality_settings
        WHERE user_id = %s
    """, (user_id,))
    
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if result:
        return {
            "flirt_mode": result['flirt_mode'],
            "gandhi_genghis": result['gandhi_genghis'],
            "current_mood": result['current_mood'],
            "context_aware": result['context_aware']
        }
    
    return {"flirt_mode": 7, "gandhi_genghis": 5, "current_mood": "playful", "context_aware": True}

# ===== SYNC STATUS =====

@router.get("/sync/status")
async def get_sync_status():
    """Get overall sync status"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Count records
    cursor.execute("SELECT COUNT(*) as count FROM robbie_notes")
    notes_count = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM robbie_tasks")
    tasks_count = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM local_chat_messages")
    messages_count = cursor.fetchone()['count']
    
    cursor.close()
    conn.close()
    
    return {
        "status": "operational",
        "database": "aurora (PostgreSQL + pgvector)",
        "notes_count": notes_count,
        "tasks_count": tasks_count,
        "messages_count": messages_count,
        "timestamp": datetime.now().isoformat()
    }
