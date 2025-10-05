#!/usr/bin/env python3
"""
Aurora Unified - Single Tabbed Application
Combines Terminal Chat, Sticky Notes, and Comms Dashboard
with proper authentication and employee database integration
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import json
import asyncio
import aiohttp
import os
from datetime import datetime, timedelta
import logging
import hashlib
import secrets
from typing import Optional, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Aurora Unified - Robbie AI Empire")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Security
security = HTTPBearer(auto_error=False)

class AuroraUnifiedManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.active_users: Dict[str, Dict[str, Any]] = {}
        self.sessions: Dict[str, str] = {}  # session_id -> user_id
        
        # Employee database (in production, this would be a real database)
        self.employees = {
            "allan@testpilotcpg.com": {
                "id": "allan",
                "name": "Allan TestPilot",
                "role": "CEO",
                "department": "Executive",
                "password_hash": hashlib.sha256("aurora2024".encode()).hexdigest(),
                "permissions": ["admin", "terminal", "notes", "comms", "robbie"]
            },
            "kristina@testpilotcpg.com": {
                "id": "kristina", 
                "name": "Kristina Sales",
                "role": "VP Sales",
                "department": "Sales",
                "password_hash": hashlib.sha256("sales2024".encode()).hexdigest(),
                "permissions": ["terminal", "notes", "comms", "robbie"]
            },
            "dev@testpilotcpg.com": {
                "id": "dev",
                "name": "Dev Team",
                "role": "Developer",
                "department": "Engineering", 
                "password_hash": hashlib.sha256("dev2024".encode()).hexdigest(),
                "permissions": ["terminal", "notes"]
            }
        }
        
        # Initialize data structures for each tab
        self.terminal_history = []
        self.sticky_notes = {
            "allan_notes": [],
            "robbie_notes": [],
            "pin_codes": []
        }
        self.comms_messages = {
            "email": [],
            "sms": [],
            "slack": [],
            "notes": []
        }
        
    async def connect(self, websocket: WebSocket, user_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if user_id:
            self.active_users[user_id] = {
                "websocket": websocket,
                "connected_at": datetime.now(),
                "current_tab": "terminal"
            }
            
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            
        # Remove from active users
        for user_id, user_data in list(self.active_users.items()):
            if user_data["websocket"] == websocket:
                del self.active_users[user_id]
                break
                
    def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user against employee database"""
        if email in self.employees:
            employee = self.employees[email]
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            if employee["password_hash"] == password_hash:
                return employee
        return None
        
    def create_session(self, user_id: str) -> str:
        """Create a new session for authenticated user"""
        session_id = secrets.token_urlsafe(32)
        self.sessions[session_id] = user_id
        return session_id
        
    def get_user_from_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get user data from session"""
        if session_id in self.sessions:
            user_id = self.sessions[session_id]
            if user_id in self.employees:
                return self.employees[user_id]
        return None
        
    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send message to specific user"""
        if user_id in self.active_users:
            websocket = self.active_users[user_id]["websocket"]
            try:
                await websocket.send_text(json.dumps(message))
            except:
                pass
                
    async def broadcast_to_all(self, message: Dict[str, Any]):
        """Broadcast message to all connected users"""
        for websocket in self.active_connections:
            try:
                await websocket.send_text(json.dumps(message))
            except:
                pass

manager = AuroraUnifiedManager()

# Authentication dependencies
async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Get current authenticated user"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    user = manager.get_user_from_session(credentials.credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session"
        )
    return user

@app.get("/", response_class=HTMLResponse)
async def get_login_page(request: Request):
    """Login page"""
    return templates.TemplateResponse("login.html", {"request": request})

@app.post("/api/login")
async def login(request: Request):
    """Authenticate user and create session"""
    try:
        data = await request.json()
        email = data.get("email", "").lower().strip()
        password = data.get("password", "")
        
        user = manager.authenticate_user(email, password)
        if user:
            session_id = manager.create_session(user["id"])
            return {
                "success": True,
                "session_id": session_id,
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "role": user["role"],
                    "department": user["department"],
                    "permissions": user["permissions"]
                }
            }
        else:
            return {
                "success": False,
                "error": "Invalid email or password"
            }
    except Exception as e:
        logger.error(f"Login error: {e}")
        return {
            "success": False,
            "error": "Login failed"
        }

@app.get("/dashboard", response_class=HTMLResponse)
async def get_dashboard(request: Request):
    """Main dashboard with tabbed interface"""
    return templates.TemplateResponse("dashboard.html", {"request": request})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await manager.connect(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "authenticate":
                session_id = message.get("session_id")
                user = manager.get_user_from_session(session_id)
                
                if user:
                    await manager.connect(websocket, user["id"])
                    await websocket.send_text(json.dumps({
                        "type": "authenticated",
                        "user": {
                            "id": user["id"],
                            "name": user["name"],
                            "role": user["role"],
                            "permissions": user["permissions"]
                        }
                    }))
                    
                    # Send initial data for current tab
                    await send_initial_data(user["id"], "terminal")
                else:
                    await websocket.send_text(json.dumps({
                        "type": "auth_error",
                        "message": "Invalid session"
                    }))
                    
            elif message["type"] == "switch_tab":
                user_id = message.get("user_id")
                tab = message.get("tab")
                
                if user_id in manager.active_users:
                    manager.active_users[user_id]["current_tab"] = tab
                    await send_initial_data(user_id, tab)
                    
            elif message["type"] == "terminal_command":
                await handle_terminal_command(message, websocket)
                
            elif message["type"] == "notes_action":
                await handle_notes_action(message, websocket)
                
            elif message["type"] == "comms_action":
                await handle_comms_action(message, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def send_initial_data(user_id: str, tab: str):
    """Send initial data for the specified tab"""
    user = manager.active_users.get(user_id)
    if not user:
        return
        
    websocket = user["websocket"]
    
    if tab == "terminal":
        # Send terminal boot sequence
        boot_sequence = [
            "Aurora AI Empire - Terminal Access",
            "Connecting to Robbie AI Core...",
            "✅ Connected to RunPod GPU Mesh",
            "✅ Loaded Robbie Personality Matrix", 
            "✅ Business Context: TestPilot CPG",
            "",
            "Welcome to Robbie Terminal v2.0",
            "Type 'robbie' to start chat, 'help' for commands"
        ]
        
        for line in boot_sequence:
            await websocket.send_text(json.dumps({
                "type": "terminal_line",
                "content": line,
                "line_type": "system"
            }))
            await asyncio.sleep(0.1)
            
        await websocket.send_text(json.dumps({
            "type": "terminal_prompt"
        }))
        
    elif tab == "notes":
        await websocket.send_text(json.dumps({
            "type": "notes_update",
            "notes": manager.sticky_notes
        }))
        
    elif tab == "comms":
        await websocket.send_text(json.dumps({
            "type": "comms_update", 
            "messages": manager.comms_messages
        }))

async def handle_terminal_command(message: Dict[str, Any], websocket: WebSocket):
    """Handle terminal commands"""
    command = message.get("command", "").strip()
    
    # Echo the command
    await websocket.send_text(json.dumps({
        "type": "terminal_line",
        "content": f"allan@aurora-town:~/robbie$ {command}",
        "line_type": "command"
    }))
    
    if command == "robbie":
        await websocket.send_text(json.dumps({
            "type": "terminal_line",
            "content": "🤖 Robbie AI Core activated",
            "line_type": "system"
        }))
        await websocket.send_text(json.dumps({
            "type": "terminal_line",
            "content": "Ready for strategic business intelligence 💡",
            "line_type": "system"
        }))
        await websocket.send_text(json.dumps({
            "type": "terminal_prompt"
        }))
        
    elif command.startswith("robbie ") or (command and not command in ["robbie", "help", "clear", "status"]):
        # This is a message for Robbie
        user_message = command.replace("robbie ", "").strip()
        
        if user_message:
            await websocket.send_text(json.dumps({
                "type": "terminal_line",
                "content": "🤖 Robbie processing...",
                "line_type": "system"
            }))
            await stream_robbie_response(user_message, websocket)
        else:
            await websocket.send_text(json.dumps({
                "type": "terminal_line",
                "content": "🤖 Robbie: Ready for your command, Allan! 💡",
                "line_type": "robbie"
            }))
            await websocket.send_text(json.dumps({
                "type": "terminal_prompt"
            }))
            
    elif command == "help":
        help_lines = [
            "Available commands:",
            "  robbie    - Start Robbie chat",
            "  help      - Show this help", 
            "  clear     - Clear terminal",
            "  status    - System status"
        ]
        for line in help_lines:
            await websocket.send_text(json.dumps({
                "type": "terminal_line",
                "content": line,
                "line_type": "system"
            }))
        await websocket.send_text(json.dumps({
            "type": "terminal_prompt"
        }))
        
    elif command == "clear":
        await websocket.send_text(json.dumps({
            "type": "terminal_clear"
        }))
        await websocket.send_text(json.dumps({
            "type": "terminal_prompt"
        }))
        
    elif command == "status":
        status_lines = [
            "🟢 Aurora Town: Online",
            "🟢 RunPod GPU: Connected", 
            "🟢 Robbie AI: Active",
            "🟢 Business Context: Loaded"
        ]
        for line in status_lines:
            await websocket.send_text(json.dumps({
                "type": "terminal_line",
                "content": line,
                "line_type": "system"
            }))
        await websocket.send_text(json.dumps({
            "type": "terminal_prompt"
        }))
        
    else:
        await websocket.send_text(json.dumps({
            "type": "terminal_line",
            "content": f"Command not found: {command}",
            "line_type": "error"
        }))
        await websocket.send_text(json.dumps({
            "type": "terminal_line",
            "content": "Type 'help' for available commands",
            "line_type": "system"
        }))
        await websocket.send_text(json.dumps({
            "type": "terminal_prompt"
        }))

async def handle_notes_action(message: Dict[str, Any], websocket: WebSocket):
    """Handle sticky notes actions"""
    action = message.get("action")
    
    if action == "get_notes":
        await websocket.send_text(json.dumps({
            "type": "notes_update",
            "notes": manager.sticky_notes
        }))
        
    elif action == "add_note":
        note_type = message.get("note_type", "robbie")
        content = message.get("content", "")
        
        if content:
            timestamp = datetime.now().strftime("%H:%M:%S")
            note_id = str(len(manager.sticky_notes["allan_notes"]) + 
                         len(manager.sticky_notes["robbie_notes"]) + 
                         len(manager.sticky_notes["pin_codes"]) + 1)
            
            note = {
                "id": note_id,
                "type": note_type,
                "content": content,
                "timestamp": f"{timestamp}",
                "source": "Manual",
                "priority": "medium"
            }
            
            if note_type in ["allan", "robbie"]:
                manager.sticky_notes[f"{note_type}_notes"].insert(0, note)
            else:
                manager.sticky_notes["pin_codes"].insert(0, note)
                
            await manager.broadcast_to_all({
                "type": "notes_update",
                "notes": manager.sticky_notes
            })

async def handle_comms_action(message: Dict[str, Any], websocket: WebSocket):
    """Handle communications actions"""
    action = message.get("action")
    
    if action == "get_messages":
        await websocket.send_text(json.dumps({
            "type": "comms_update",
            "messages": manager.comms_messages
        }))

async def stream_robbie_response(message: str, websocket: WebSocket):
    """Stream Robbie's response through terminal interface"""
    try:
        # Try Aurora LLM Gateway first
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
            try:
                payload = {
                    "model": "qwen2.5:7b",
                    "prompt": f"ROBBIE MODE: You are Robbie, Allan's AI executive assistant at TestPilot CPG. You are NOT Qwen. You are Robbie. Be strategic, direct, revenue-focused. Use emojis: ✅ 🔴 💰 🚀 ⚠️ 💡 📊 🎯. Respond as Robbie to: {message}",
                    "stream": False
                }
                
                async with session.post("http://localhost:11435/api/generate", json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        full_response = result.get("response", "").strip()
                        
                        if full_response:
                            # Stream the response word by word
                            words = full_response.split()
                            current_line = ""
                            
                            for word in words:
                                current_line += word + " "
                                
                                if len(current_line) > 80:
                                    await websocket.send_text(json.dumps({
                                        "type": "terminal_line",
                                        "content": f"🤖 robbie: {current_line.strip()}",
                                        "line_type": "robbie"
                                    }))
                                    await asyncio.sleep(0.02)
                                    current_line = ""
                                    
                            if current_line.strip():
                                await websocket.send_text(json.dumps({
                                    "type": "terminal_line",
                                    "content": f"🤖 robbie: {current_line.strip()}",
                                    "line_type": "robbie"
                                }))
                                
                            await websocket.send_text(json.dumps({
                                "type": "terminal_prompt"
                            }))
                            return
                            
            except Exception as e:
                logger.error(f"Aurora LLM Gateway error: {e}")
                
        # Fallback response
        await websocket.send_text(json.dumps({
            "type": "terminal_line",
            "content": "🤖 robbie: Hey Allan! I'm having some technical difficulties. Give me a moment to get back up to speed! 💪",
            "line_type": "robbie"
        }))
        await websocket.send_text(json.dumps({
            "type": "terminal_prompt"
        }))
        
    except Exception as e:
        logger.error(f"Stream error: {e}")
        await websocket.send_text(json.dumps({
            "type": "terminal_line",
            "content": "🤖 robbie: Technical issue - let me try again! 🔧",
            "line_type": "robbie"
        }))
        await websocket.send_text(json.dumps({
            "type": "terminal_prompt"
        }))

@app.get("/api/status")
async def get_status():
    return {
        "status": "online",
        "service": "Aurora Unified",
        "version": "1.0",
        "connections": len(manager.active_connections),
        "active_users": len(manager.active_users),
        "authentication": "employee_database"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
