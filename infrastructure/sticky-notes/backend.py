#!/usr/bin/env python3
"""
Robbie Sticky Notes - Beautiful PIN-protected notes interface
Based on the gorgeous design from pinCodeSurfacer.js
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import json
import asyncio
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Robbie Sticky Notes")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

class StickyNotesManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.notes = {
            "allan_notes": [
                {
                    "id": "1",
                    "type": "allan",
                    "content": "Make sure we have the web browser tab and notes tab too even if UI is basic",
                    "timestamp": "2 min ago",
                    "source": "Email",
                    "priority": "high"
                },
                {
                    "id": "2", 
                    "type": "allan",
                    "content": "All of the 'Make sure' things should become robbie notes",
                    "timestamp": "5 min ago",
                    "source": "Email",
                    "priority": "high"
                },
                {
                    "id": "3",
                    "type": "allan", 
                    "content": "And anything I say (please note) should be an Allan note",
                    "timestamp": "8 min ago",
                    "source": "Email",
                    "priority": "medium"
                },
                {
                    "id": "4",
                    "type": "allan",
                    "content": "I can also edit notes add notes and delete notes in the web interface",
                    "timestamp": "12 min ago",
                    "source": "Email",
                    "priority": "medium"
                },
                {
                    "id": "5",
                    "type": "allan",
                    "content": "Also start the inbox (Universal inbox) even if it's only email for now",
                    "timestamp": "15 min ago",
                    "source": "Email",
                    "priority": "high"
                }
            ],
            "robbie_notes": [
                {
                    "id": "6",
                    "type": "robbie",
                    "content": "Implement web browser and notes tabs in the interface",
                    "timestamp": "2 min ago",
                    "source": "System",
                    "priority": "high"
                },
                {
                    "id": "7",
                    "type": "robbie",
                    "content": "Automatically convert 'Make sure' statements into Robbie notes",
                    "timestamp": "5 min ago",
                    "source": "System",
                    "priority": "high"
                },
                {
                    "id": "8",
                    "type": "robbie",
                    "content": "PepsiCo deal crisis - pricing 40% higher, timeline 3 months slow. Need strategic response.",
                    "timestamp": "1 hour ago",
                    "source": "Business",
                    "priority": "critical"
                },
                {
                    "id": "9",
                    "type": "robbie",
                    "content": "RunPod GPU integration via SSH tunnel working perfectly",
                    "timestamp": "2 hours ago",
                    "source": "Technical",
                    "priority": "medium"
                }
            ],
            "pin_codes": [
                {
                    "id": "10",
                    "type": "pin",
                    "content": "2106",
                    "context": "Robbie F System Access",
                    "timestamp": "2 min ago",
                    "source": "Email"
                },
                {
                    "id": "11",
                    "type": "2fa",
                    "content": "123456",
                    "context": "Gmail Verification",
                    "timestamp": "5 min ago",
                    "source": "SMS"
                },
                {
                    "id": "12",
                    "type": "2fa",
                    "content": "789012",
                    "context": "Slack Verification",
                    "timestamp": "8 min ago",
                    "source": "Slack"
                }
            ]
        }
        self.valid_pins = ["2106", "5555", "robbie"]
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            
    async def send_notes_update(self, websocket: WebSocket = None):
        update_data = {
            "type": "notes_update",
            "notes": self.notes
        }
        
        target_websockets = [websocket] if websocket else self.active_connections
        for ws in target_websockets:
            try:
                await ws.send_text(json.dumps(update_data))
            except:
                pass
                
    def add_note(self, note_type: str, content: str, source: str = "Manual"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        note_id = str(len(self.notes["allan_notes"]) + len(self.notes["robbie_notes"]) + len(self.notes["pin_codes"]) + 1)
        
        note = {
            "id": note_id,
            "type": note_type,
            "content": content,
            "timestamp": f"{timestamp}",
            "source": source,
            "priority": "medium"
        }
        
        if note_type in ["allan", "robbie"]:
            self.notes[f"{note_type}_notes"].insert(0, note)
        else:
            self.notes["pin_codes"].insert(0, note)
            
    def delete_note(self, note_id: str):
        for category in ["allan_notes", "robbie_notes", "pin_codes"]:
            self.notes[category] = [note for note in self.notes[category] if note["id"] != note_id]

manager = StickyNotesManager()

@app.get("/", response_class=HTMLResponse)
async def get_sticky_notes(request: Request):
    return templates.TemplateResponse("sticky_notes.html", {"request": request})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "verify_pin":
                pin = message["pin"]
                is_valid = pin in manager.valid_pins
                
                await websocket.send_text(json.dumps({
                    "type": "pin_verified",
                    "valid": is_valid
                }))
                
                if is_valid:
                    await manager.send_notes_update(websocket)
                    
            elif message["type"] == "add_note":
                note_type = message.get("note_type", "robbie")
                content = message.get("content", "")
                source = message.get("source", "Manual")
                
                if content:
                    manager.add_note(note_type, content, source)
                    await manager.send_notes_update()
                    
            elif message["type"] == "delete_note":
                note_id = message.get("note_id")
                if note_id:
                    manager.delete_note(note_id)
                    await manager.send_notes_update()
                    
            elif message["type"] == "get_notes":
                await manager.send_notes_update(websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/status")
async def get_status():
    return {
        "status": "online",
        "service": "Robbie Sticky Notes",
        "version": "1.0",
        "connections": len(manager.active_connections),
        "total_notes": sum(len(notes) for notes in manager.notes.values())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8009)
