"""
Robbie State API Routes
Unified state management for Robbie across Cursor, Chat, and all interfaces
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.db.database import database

router = APIRouter(prefix="/robbie", tags=["robbie-state"])

# ============================================================================
# MODELS
# ============================================================================

class MoodState(BaseModel):
    current: int
    name: str
    emoji: str
    changed_at: str
    changed_by: str

class Commitment(BaseModel):
    id: str
    commitment: str
    deadline: str
    status: str
    created_at: str

class CalendarEvent(BaseModel):
    id: str
    title: str
    start_time: str
    end_time: Optional[str]
    location: Optional[str]
    preparation: Optional[str]

class ConversationMessage(BaseModel):
    id: str
    source: str  # 'cursor', 'chat', 'web'
    role: str
    preview: str
    timestamp: str

class CursorActivity(BaseModel):
    type: str  # 'conversation_message', 'progress', 'commitment'
    data: Dict[str, Any]
    source: str
    instance_id: str
    timestamp: str

# ============================================================================
# WEBSOCKET CONNECTION MANAGER
# ============================================================================

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {
            'cursor': [],
            'chat': [],
            'web': []
        }
        self.instance_registry: Dict[str, Dict] = {}
    
    async def connect(self, websocket: WebSocket, instance_type: str, instance_id: str):
        await websocket.accept()
        self.active_connections[instance_type].append(websocket)
        self.instance_registry[instance_id] = {
            'type': instance_type,
            'websocket': websocket,
            'connected_at': datetime.utcnow().isoformat()
        }
        print(f"✅ {instance_type} instance {instance_id} connected")
    
    def disconnect(self, instance_id: str):
        if instance_id in self.instance_registry:
            instance = self.instance_registry[instance_id]
            instance_type = instance['type']
            websocket = instance['websocket']
            
            if websocket in self.active_connections[instance_type]:
                self.active_connections[instance_type].remove(websocket)
            
            del self.instance_registry[instance_id]
            print(f"❌ {instance_type} instance {instance_id} disconnected")
    
    async def broadcast(self, message: Dict, exclude_instance: Optional[str] = None):
        """Broadcast to all connected instances"""
        disconnected = []
        
        for instance_id, instance in self.instance_registry.items():
            if instance_id == exclude_instance:
                continue
            
            try:
                await instance['websocket'].send_json(message)
            except Exception as e:
                print(f"❌ Failed to send to {instance_id}: {e}")
                disconnected.append(instance_id)
        
        # Clean up disconnected instances
        for instance_id in disconnected:
            self.disconnect(instance_id)
    
    async def send_to_type(self, message: Dict, instance_type: str):
        """Send message to all instances of a specific type"""
        for websocket in self.active_connections[instance_type]:
            try:
                await websocket.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

# ============================================================================
# WEBSOCKET ENDPOINT
# ============================================================================

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    instance_id = None
    
    try:
        await websocket.accept()
        
        # Wait for registration message
        registration = await websocket.receive_json()
        
        if registration.get('type') != 'register':
            await websocket.close(code=1008, reason="Expected registration message")
            return
        
        instance_type = registration.get('instance_type', 'unknown')
        instance_id = registration.get('instance_id')
        user_id = registration.get('user_id')
        
        await manager.connect(websocket, instance_type, instance_id)
        
        # Send initial state
        initial_state = await get_initial_state()
        await websocket.send_json({
            'type': 'initial_state',
            'data': initial_state
        })
        
        # Listen for messages
        while True:
            message = await websocket.receive_json()
            await handle_websocket_message(message, instance_id)
            
    except WebSocketDisconnect:
        if instance_id:
            manager.disconnect(instance_id)
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        if instance_id:
            manager.disconnect(instance_id)

async def handle_websocket_message(message: Dict, instance_id: str):
    """Handle incoming WebSocket messages"""
    msg_type = message.get('type')
    
    if msg_type == 'cursor_activity':
        activity = message.get('activity')
        await process_cursor_activity(activity, instance_id)
    
    elif msg_type == 'ping':
        # Keep-alive ping
        pass
    
    else:
        print(f"⚠️ Unknown message type: {msg_type}")

async def process_cursor_activity(activity: Dict, source_instance: str):
    """Process activity from Cursor and broadcast to other instances"""
    activity_type = activity.get('type')
    data = activity.get('data')
    
    # Store activity
    await store_cursor_activity(activity)
    
    # Broadcast to other instances
    await manager.broadcast({
        'type': 'cursor_activity',
        'activity': activity
    }, exclude_instance=source_instance)
    
    # Handle specific activity types
    if activity_type == 'progress':
        await handle_progress_update(data)
    elif activity_type == 'commitment':
        await handle_commitment_added(data)

async def get_initial_state() -> Dict:
    """Get initial state for new connections"""
    return {
        'mood': await get_current_mood(),
        'active_commitments': await get_active_commitments(),
        'calendar_events': await get_calendar_events(),
        'recent_context': await get_recent_conversation_context()
    }

# ============================================================================
# HTTP ENDPOINTS
# ============================================================================

@router.get("/mood", response_model=MoodState)
async def get_mood():
    """Get current Robbie mood state"""
    mood = await get_current_mood()
    return mood

async def get_current_mood() -> Dict:
    """Helper to get current mood"""
    # Get latest mood from slider system
    mood_data = await database.fetch_one("""
        SELECT mood_level, changed_by, changed_at
        FROM robbie_mood_sync
        ORDER BY timestamp DESC
        LIMIT 1
    """)
    
    if not mood_data:
        # Default mood
        return {
            'current': 4,
            'name': 'Professional',
            'emoji': '🤖',
            'changed_at': datetime.utcnow().isoformat(),
            'changed_by': 'system'
        }
    
    mood_names = {
        1: 'Sleepy', 2: 'Calm', 3: 'Content', 4: 'Professional',
        5: 'Enthusiastic', 6: 'Excited', 7: 'Hyper'
    }
    mood_emojis = {
        1: '😴', 2: '😌', 3: '😊', 4: '🤖',
        5: '😄', 6: '🤩', 7: '🔥'
    }
    
    mood_level = mood_data['mood_level']
    
    return {
        'current': mood_level,
        'name': mood_names.get(mood_level, 'Professional'),
        'emoji': mood_emojis.get(mood_level, '🤖'),
        'changed_at': mood_data['changed_at'],
        'changed_by': mood_data['changed_by']
    }

@router.post("/mood/{mood_level}")
async def update_mood(mood_level: int, changed_by: str = "system"):
    """Update Robbie's mood and broadcast to all instances"""
    if mood_level < 1 or mood_level > 7:
        raise HTTPException(status_code=400, detail="Mood level must be 1-7")
    
    # Store mood update
    await database.execute("""
        INSERT INTO robbie_mood_sync (mood_level, changed_by, source)
        VALUES (:mood_level, :changed_by, 'api')
    """, {
        'mood_level': mood_level,
        'changed_by': changed_by
    })
    
    # Get updated mood
    mood = await get_current_mood()
    
    # Broadcast to all connected instances
    await manager.broadcast({
        'type': 'mood_update',
        'data': mood
    })
    
    return mood

@router.get("/personality")
async def get_personality():
    """Get current personality configuration"""
    # Would integrate with personality system
    return {
        'name': 'Robbie',
        'mode': 'cursor',
        'traits': ['direct', 'revenue-focused', 'pragmatic'],
        'communication_style': 'concise and actionable'
    }

@router.get("/commitments/active", response_model=List[Commitment])
async def get_commitments():
    """Get active commitments"""
    commitments = await get_active_commitments()
    return commitments

async def get_active_commitments() -> List[Dict]:
    """Helper to get active commitments"""
    commitments = await database.fetch_all("""
        SELECT id, commitment, deadline, status, timestamp as created_at
        FROM robbie_commitments_sync
        WHERE status = 'active'
        ORDER BY deadline ASC
    """)
    
    return [dict(c) for c in commitments]

@router.post("/commitments")
async def add_commitment(commitment: str, deadline: str):
    """Add a new commitment"""
    commitment_id = f"commit_{int(datetime.utcnow().timestamp())}_{hash(commitment) % 10000}"
    
    await database.execute("""
        INSERT INTO robbie_commitments_sync (id, commitment, deadline, status, source)
        VALUES (:id, :commitment, :deadline, 'active', 'api')
    """, {
        'id': commitment_id,
        'commitment': commitment,
        'deadline': deadline
    })
    
    # Broadcast to all instances
    await manager.broadcast({
        'type': 'commitment_added',
        'data': {
            'id': commitment_id,
            'commitment': commitment,
            'deadline': deadline
        }
    })
    
    return {'id': commitment_id, 'status': 'added'}

@router.get("/calendar/events", response_model=List[CalendarEvent])
async def get_calendar(start: str, end: str):
    """Get calendar events in time range"""
    events = await get_calendar_events(start, end)
    return events

async def get_calendar_events(start: Optional[str] = None, end: Optional[str] = None) -> List[Dict]:
    """Helper to get calendar events"""
    # Default to next 24 hours if not specified
    if not start:
        start = datetime.utcnow().isoformat()
    if not end:
        end = (datetime.utcnow() + timedelta(days=1)).isoformat()
    
    # Would integrate with actual calendar system (Google Calendar, etc.)
    # For now, return mock data
    return [
        {
            'id': 'event_1',
            'title': 'Sales call with Simply Good Foods',
            'start_time': (datetime.utcnow() + timedelta(hours=2)).isoformat(),
            'end_time': (datetime.utcnow() + timedelta(hours=2, minutes=30)).isoformat(),
            'location': 'Zoom',
            'preparation': 'Review pricing deck, check recent email thread'
        }
    ]

@router.get("/conversations/recent", response_model=List[ConversationMessage])
async def get_recent_conversations(limit: int = 20):
    """Get recent conversation context"""
    context = await get_recent_conversation_context(limit)
    return context

async def get_recent_conversation_context(limit: int = 20) -> List[Dict]:
    """Helper to get recent conversation context"""
    messages = await database.fetch_all("""
        SELECT 
            m.id,
            'chat' as source,
            m.role,
            SUBSTR(m.content, 1, 100) as preview,
            m.created_at as timestamp
        FROM messages m
        ORDER BY m.created_at DESC
        LIMIT :limit
    """, {'limit': limit})
    
    return [dict(m) for m in messages]

@router.get("/memories/recent")
async def get_recent_memories(limit: int = 10):
    """Get recent memories"""
    # Would integrate with memory system
    return []

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def store_cursor_activity(activity: Dict):
    """Store cursor activity for history"""
    await database.execute("""
        INSERT INTO robbie_activity_queue (
            activity_type, data, source, timestamp, synced
        ) VALUES (:type, :data, :source, :timestamp, true)
    """, {
        'type': activity.get('type'),
        'data': str(activity.get('data')),
        'source': activity.get('source'),
        'timestamp': activity.get('timestamp')
    })

async def handle_progress_update(data: Dict):
    """Handle progress update from any instance"""
    print(f"✅ Progress: {data.get('progress_type')} - {data.get('details')}")
    
    # Could trigger mood transition to celebrate
    pass

async def handle_commitment_added(data: Dict):
    """Handle commitment added from any instance"""
    print(f"📌 Commitment: {data.get('commitment')} by {data.get('deadline')}")
    
    # Add to tracking system
    await add_commitment(data.get('commitment'), data.get('deadline'))







































