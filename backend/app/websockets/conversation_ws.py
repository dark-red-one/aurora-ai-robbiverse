"""
Aurora RobbieVerse - Conversation WebSocket Handler
Real-time updates for conversation context, rollback, and branching
"""
import json
import asyncio
from typing import Dict, Set, Any
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import structlog

from app.services.conversation_context import ConversationContextManager
from app.websockets.manager import ConnectionManager

logger = structlog.get_logger()

class ConversationWebSocketManager:
    """Manages WebSocket connections for conversation updates"""
    
    def __init__(self):
        self.connection_manager = ConnectionManager()
        self.context_manager = ConversationContextManager()
        self.conversation_connections: Dict[str, Set[WebSocket]] = {}
        self.user_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, conversation_id: str, user_id: str = None):
        """Connect a WebSocket to a conversation"""
        await self.connection_manager.connect(websocket)
        
        # Add to conversation connections
        if conversation_id not in self.conversation_connections:
            self.conversation_connections[conversation_id] = set()
        self.conversation_connections[conversation_id].add(websocket)
        
        # Add to user connections if user_id provided
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(websocket)
        
        logger.info("WebSocket connected", 
                   conversation_id=conversation_id, 
                   user_id=user_id,
                   total_connections=len(self.conversation_connections[conversation_id]))
    
    async def disconnect(self, websocket: WebSocket, conversation_id: str, user_id: str = None):
        """Disconnect a WebSocket from a conversation"""
        await self.connection_manager.disconnect(websocket)
        
        # Remove from conversation connections
        if conversation_id in self.conversation_connections:
            self.conversation_connections[conversation_id].discard(websocket)
            if not self.conversation_connections[conversation_id]:
                del self.conversation_connections[conversation_id]
        
        # Remove from user connections
        if user_id and user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        logger.info("WebSocket disconnected", 
                   conversation_id=conversation_id, 
                   user_id=user_id)
    
    async def broadcast_to_conversation(self, conversation_id: str, event: str, data: Dict[str, Any]):
        """Broadcast an event to all connected clients for a conversation"""
        if conversation_id not in self.conversation_connections:
            return
        
        message = {
            "event": event,
            "conversation_id": conversation_id,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        disconnected = set()
        for websocket in self.conversation_connections[conversation_id]:
            try:
                await websocket.send_text(json.dumps(message))
            except WebSocketDisconnect:
                disconnected.add(websocket)
            except Exception as e:
                logger.error("Error broadcasting to WebSocket", error=str(e))
                disconnected.add(websocket)
        
        # Clean up disconnected connections
        for websocket in disconnected:
            self.conversation_connections[conversation_id].discard(websocket)
    
    async def broadcast_to_user(self, user_id: str, event: str, data: Dict[str, Any]):
        """Broadcast an event to all connected clients for a user"""
        if user_id not in self.user_connections:
            return
        
        message = {
            "event": event,
            "user_id": user_id,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        disconnected = set()
        for websocket in self.user_connections[user_id]:
            try:
                await websocket.send_text(json.dumps(message))
            except WebSocketDisconnect:
                disconnected.add(websocket)
            except Exception as e:
                logger.error("Error broadcasting to user WebSocket", error=str(e))
                disconnected.add(websocket)
        
        # Clean up disconnected connections
        for websocket in disconnected:
            self.user_connections[user_id].discard(websocket)
    
    async def handle_message_added(self, conversation_id: str, message_data: Dict[str, Any]):
        """Handle message added event"""
        await self.broadcast_to_conversation(conversation_id, "message_added", {
            "message": message_data,
            "conversation_stats": await self._get_conversation_stats(conversation_id)
        })
    
    async def handle_message_rolled_back(self, conversation_id: str, message_id: str, reason: str):
        """Handle message rolled back event"""
        await self.broadcast_to_conversation(conversation_id, "message_rolled_back", {
            "message_id": message_id,
            "reason": reason,
            "conversation_stats": await self._get_conversation_stats(conversation_id)
        })
    
    async def handle_message_restored(self, conversation_id: str, message_id: str):
        """Handle message restored event"""
        await self.broadcast_to_conversation(conversation_id, "message_restored", {
            "message_id": message_id,
            "conversation_stats": await self._get_conversation_stats(conversation_id)
        })
    
    async def handle_branch_created(self, conversation_id: str, branch_data: Dict[str, Any]):
        """Handle branch created event"""
        await self.broadcast_to_conversation(conversation_id, "branch_created", {
            "branch": branch_data,
            "conversation_stats": await self._get_conversation_stats(conversation_id)
        })
    
    async def handle_branch_switched(self, conversation_id: str, branch_id: str):
        """Handle branch switched event"""
        await self.broadcast_to_conversation(conversation_id, "branch_switched", {
            "branch_id": branch_id,
            "conversation_stats": await self._get_conversation_stats(conversation_id)
        })
    
    async def handle_context_compressed(self, conversation_id: str, compression_data: Dict[str, Any]):
        """Handle context compressed event"""
        await self.broadcast_to_conversation(conversation_id, "context_compressed", {
            "compression": compression_data,
            "conversation_stats": await self._get_conversation_stats(conversation_id)
        })
    
    async def _get_conversation_stats(self, conversation_id: str) -> Dict[str, Any]:
        """Get conversation statistics for real-time updates"""
        try:
            context = await self.context_manager.get_conversation_context(conversation_id)
            return {
                "total_messages": context["total_messages"],
                "context_window": context["context_window"],
                "context_compressed": context["context_compressed"],
                "active_branch": context["active_branch"]
            }
        except Exception as e:
            logger.error("Error getting conversation stats", error=str(e))
            return {
                "total_messages": 0,
                "context_window": 10,
                "context_compressed": False,
                "active_branch": None
            }
    
    async def handle_websocket_message(self, websocket: WebSocket, message: str, conversation_id: str, user_id: str = None):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            event_type = data.get("event")
            
            if event_type == "ping":
                await websocket.send_text(json.dumps({
                    "event": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }))
            
            elif event_type == "get_context":
                context = await self.context_manager.get_conversation_context(conversation_id)
                await websocket.send_text(json.dumps({
                    "event": "context_update",
                    "conversation_id": conversation_id,
                    "data": context,
                    "timestamp": datetime.utcnow().isoformat()
                }))
            
            elif event_type == "get_branches":
                branches = await self.context_manager.get_conversation_branches(conversation_id)
                await websocket.send_text(json.dumps({
                    "event": "branches_update",
                    "conversation_id": conversation_id,
                    "data": branches,
                    "timestamp": datetime.utcnow().isoformat()
                }))
            
            elif event_type == "get_rollback_history":
                history = await self.context_manager.get_rollback_history(conversation_id)
                await websocket.send_text(json.dumps({
                    "event": "rollback_history_update",
                    "conversation_id": conversation_id,
                    "data": history,
                    "timestamp": datetime.utcnow().isoformat()
                }))
            
            else:
                await websocket.send_text(json.dumps({
                    "event": "error",
                    "message": f"Unknown event type: {event_type}",
                    "timestamp": datetime.utcnow().isoformat()
                }))
        
        except json.JSONDecodeError:
            await websocket.send_text(json.dumps({
                "event": "error",
                "message": "Invalid JSON format",
                "timestamp": datetime.utcnow().isoformat()
            }))
        except Exception as e:
            logger.error("Error handling WebSocket message", error=str(e))
            await websocket.send_text(json.dumps({
                "event": "error",
                "message": "Internal server error",
                "timestamp": datetime.utcnow().isoformat()
            }))
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get WebSocket connection statistics"""
        return {
            "total_conversations": len(self.conversation_connections),
            "total_users": len(self.user_connections),
            "conversation_connections": {
                conv_id: len(connections) 
                for conv_id, connections in self.conversation_connections.items()
            },
            "user_connections": {
                user_id: len(connections) 
                for user_id, connections in self.user_connections.items()
            }
        }

# Global instance
conversation_ws_manager = ConversationWebSocketManager()











