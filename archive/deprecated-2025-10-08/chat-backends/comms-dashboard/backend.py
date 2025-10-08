#!/usr/bin/env python3
"""
Robbie Comms Dashboard - Beautiful unified communication interface
Based on the gorgeous Universal Inbox design
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import json
import asyncio
import os
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Robbie Comms Dashboard")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

class CommsDashboardManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.messages = {
            "email": [
                {
                    "id": "1",
                    "type": "email",
                    "subject": "PepsiCo Clean Label Initiative - URGENT",
                    "from": "sarah.johnson@pepsico.com",
                    "body": "Allan, we need to discuss the Clean Label Initiative proposal. The pricing is 40% higher than our budget and the timeline needs to be accelerated by 3 months. Can we schedule a call today?",
                    "timestamp": "2 hours ago",
                    "priority": "critical",
                    "read": False,
                    "tags": ["deal", "urgent", "pricing"]
                },
                {
                    "id": "2",
                    "type": "email",
                    "subject": "TestPilot CPG - Monthly Revenue Report",
                    "from": "finance@testpilotcpg.com",
                    "body": "Monthly revenue report is ready. We're at $847K for the month, up 23% from last month. Clean Label deal would push us over $1M monthly.",
                    "timestamp": "4 hours ago",
                    "priority": "high",
                    "read": True,
                    "tags": ["finance", "revenue"]
                },
                {
                    "id": "3",
                    "type": "email",
                    "subject": "Wondercide Presentation - Tomorrow",
                    "from": "mike.chen@wondercide.com",
                    "body": "Looking forward to our presentation tomorrow at 2 PM. We're excited about the partnership opportunity.",
                    "timestamp": "1 day ago",
                    "priority": "medium",
                    "read": True,
                    "tags": ["presentation", "partnership"]
                }
            ],
            "sms": [
                {
                    "id": "4",
                    "type": "sms",
                    "from": "+1-555-0123",
                    "body": "Hey Allan, just sent you the updated proposal. Let me know your thoughts! - Sarah",
                    "timestamp": "30 min ago",
                    "priority": "high",
                    "read": False,
                    "tags": ["pepsico", "proposal"]
                },
                {
                    "id": "5",
                    "type": "sms",
                    "from": "+1-555-0456",
                    "body": "Team meeting moved to 3 PM today. Conference room B.",
                    "timestamp": "1 hour ago",
                    "priority": "medium",
                    "read": True,
                    "tags": ["meeting", "team"]
                }
            ],
            "slack": [
                {
                    "id": "6",
                    "type": "slack",
                    "channel": "#sales-team",
                    "from": "Kristina",
                    "body": "Allan, the PepsiCo deal is getting heated. Sarah called me directly asking about pricing flexibility. Should we offer a phased rollout?",
                    "timestamp": "45 min ago",
                    "priority": "critical",
                    "read": False,
                    "tags": ["sales", "pepsico", "pricing"]
                },
                {
                    "id": "7",
                    "type": "slack",
                    "channel": "#product",
                    "from": "Dev Team",
                    "body": "New feature deployed to staging. Ready for QA testing.",
                    "timestamp": "2 hours ago",
                    "priority": "low",
                    "read": True,
                    "tags": ["development", "staging"]
                }
            ],
            "notes": [
                {
                    "id": "8",
                    "type": "note",
                    "subject": "PepsiCo Strategy Meeting",
                    "body": "Key points: 1) Pricing flexibility - offer 20% discount for 2-year contract 2) Timeline acceleration - reduce scope for MVP 3) Value proposition - emphasize ROI and market differentiation",
                    "timestamp": "1 hour ago",
                    "priority": "high",
                    "read": True,
                    "tags": ["strategy", "pepsico", "meeting"]
                },
                {
                    "id": "9",
                    "type": "note",
                    "subject": "Wondercide Partnership",
                    "body": "They're interested in our AI-powered inventory management. Potential $500K annual deal. Focus on automation benefits and cost savings.",
                    "timestamp": "3 hours ago",
                    "priority": "medium",
                    "read": True,
                    "tags": ["partnership", "wondercide", "ai"]
                }
            ]
        }
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            
    async def send_messages_update(self, websocket: WebSocket = None):
        update_data = {
            "type": "messages_update",
            "messages": self.messages
        }
        
        target_websockets = [websocket] if websocket else self.active_connections
        for ws in target_websockets:
            try:
                await ws.send_text(json.dumps(update_data))
            except:
                pass
                
    def mark_as_read(self, message_id: str):
        for category in self.messages.values():
            for message in category:
                if message["id"] == message_id:
                    message["read"] = True
                    break
                    
    def delete_message(self, message_id: str):
        for category in self.messages.values():
            self.messages[category] = [msg for msg in self.messages[category] if msg["id"] != message_id]

manager = CommsDashboardManager()

@app.get("/", response_class=HTMLResponse)
async def get_comms_dashboard(request: Request):
    return templates.TemplateResponse("comms_dashboard.html", {"request": request})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "get_messages":
                await manager.send_messages_update(websocket)
                
            elif message["type"] == "mark_read":
                message_id = message.get("message_id")
                if message_id:
                    manager.mark_as_read(message_id)
                    await manager.send_messages_update()
                    
            elif message["type"] == "delete_message":
                message_id = message.get("message_id")
                if message_id:
                    manager.delete_message(message_id)
                    await manager.send_messages_update()
                    
            elif message["type"] == "filter_messages":
                filter_type = message.get("filter")
                await manager.send_filtered_messages(filter_type, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def send_filtered_messages(self, filter_type: str, websocket: WebSocket):
    """Send filtered messages based on type"""
    filtered_data = {
        "type": "messages_update",
        "messages": self.messages,
        "filter": filter_type
    }
    
    try:
        await websocket.send_text(json.dumps(filtered_data))
    except:
        pass

@app.get("/api/status")
async def get_status():
    total_messages = sum(len(messages) for messages in manager.messages.values())
    unread_count = sum(1 for messages in manager.messages.values() 
                      for msg in messages if not msg.get("read", False))
    
    return {
        "status": "online",
        "service": "Robbie Comms Dashboard",
        "version": "1.0",
        "connections": len(manager.active_connections),
        "total_messages": total_messages,
        "unread_messages": unread_count
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8010)
