"""
Aurora RobbieVerse - WebSocket Connection Manager
"""
from typing import List, Dict
from fastapi import WebSocket
import json
import asyncio

class ConnectionManager:
    """WebSocket connection manager for real-time communication"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept WebSocket connection and add to active connections"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
    
    def disconnect(self, client_id: str):
        """Remove connection from active connections"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
    
    async def send_personal_message(self, message: str, client_id: str):
        """Send message to specific client"""
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(message)
            except Exception as e:
                # Connection might be closed, remove it
                self.disconnect(client_id)
    
    async def broadcast(self, message: str):
        """Broadcast message to all connected clients"""
        disconnected_clients = []
        
        for client_id, connection in self.active_connections.items():
            try:
                await connection.send_text(message)
            except Exception as e:
                # Connection closed, mark for removal
                disconnected_clients.append(client_id)
        
        # Remove disconnected clients
        for client_id in disconnected_clients:
            self.disconnect(client_id)
    
    async def send_json(self, data: dict, client_id: str):
        """Send JSON data to specific client"""
        message = json.dumps(data)
        await self.send_personal_message(message, client_id)
    
    async def broadcast_json(self, data: dict):
        """Broadcast JSON data to all connected clients"""
        message = json.dumps(data)
        await self.broadcast(message)
    
    def get_connection_count(self) -> int:
        """Get number of active connections"""
        return len(self.active_connections)
    
    def get_connected_clients(self) -> List[str]:
        """Get list of connected client IDs"""
        return list(self.active_connections.keys())
