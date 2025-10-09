"""
Active Users WebSocket - Real-time user presence for RobbieBar
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
from typing import Set, Dict
from datetime import datetime

router = APIRouter()

# Active connections
active_connections: Set[WebSocket] = set()

# Active users (in a real app, this would come from database/Redis)
active_users: Dict[str, datetime] = {
    "Allan": datetime.now()
}


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        print(f"✅ WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        print(f"❌ WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error sending to client: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


@router.websocket("/ws/users")
async def users_websocket(websocket: WebSocket):
    """WebSocket endpoint for active users"""
    await manager.connect(websocket)
    
    try:
        # Send initial user list
        await websocket.send_json(list(active_users.keys()))
        
        # Keep connection alive and send updates
        while True:
            try:
                # Wait for ping from client (or timeout)
                data = await asyncio.wait_for(websocket.receive_text(), timeout=5.0)
                
                # Echo back (heartbeat)
                await websocket.send_json(list(active_users.keys()))
                
            except asyncio.TimeoutError:
                # No message received, send update anyway
                await websocket.send_json(list(active_users.keys()))
            
            # Small delay between updates
            await asyncio.sleep(5)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@router.post("/api/users/heartbeat")
async def user_heartbeat(username: str):
    """Update user's last seen timestamp"""
    active_users[username] = datetime.now()
    
    # Broadcast updated user list to all connected clients
    await manager.broadcast(list(active_users.keys()))
    
    return {"status": "ok", "active_users": list(active_users.keys())}


@router.get("/api/users/active")
def get_active_users():
    """Get list of currently active users"""
    # In a real app, filter out users who haven't sent heartbeat in last 5 minutes
    return list(active_users.keys())
