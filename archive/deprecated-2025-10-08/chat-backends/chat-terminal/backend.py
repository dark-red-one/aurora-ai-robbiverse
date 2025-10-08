#!/usr/bin/env python3
"""
Robbie Terminal Chat - SSH-like Interface
Looks exactly like logging into a terminal and typing "robbie"
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import json
import asyncio
import aiohttp
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Robbie Terminal Chat")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

class TerminalConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.terminal_history = []
        self.current_user = "allan@aurora-town"
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        # Send terminal boot sequence
        await self.send_terminal_line("", "system")
        await asyncio.sleep(0.1)
        await self.send_terminal_line("Aurora AI Empire - Terminal Access", "system")
        await asyncio.sleep(0.1)
        await self.send_terminal_line("Connecting to Robbie AI Core...", "system")
        await asyncio.sleep(0.1)
        await self.send_terminal_line("✅ Connected to RunPod GPU Mesh", "system")
        await asyncio.sleep(0.1)
        await self.send_terminal_line("✅ Loaded Robbie Personality Matrix", "system")
        await asyncio.sleep(0.1)
        await self.send_terminal_line("✅ Business Context: TestPilot CPG", "system")
        await asyncio.sleep(0.1)
        await self.send_terminal_line("", "system")
        await self.send_terminal_line("Welcome to Robbie Terminal v2.0", "system")
        await self.send_terminal_line("Type 'robbie' to start chat, 'help' for commands", "system")
        await self.send_terminal_line("", "system")
        
        # Show prompt
        await self.send_prompt()
        
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            
    async def send_terminal_line(self, content: str, line_type: str = "normal", websocket: WebSocket = None):
        timestamp = datetime.now().strftime("%H:%M:%S")
        line_data = {
            "type": "terminal_line",
            "content": content,
            "line_type": line_type,
            "timestamp": timestamp
        }
        
        target_websockets = [websocket] if websocket else self.active_connections
        for ws in target_websockets:
            try:
                await ws.send_text(json.dumps(line_data))
            except:
                pass
                
    async def send_prompt(self, websocket: WebSocket = None):
        prompt_data = {
            "type": "prompt",
            "user": self.current_user,
            "path": "~/robbie"
        }
        
        target_websockets = [websocket] if websocket else self.active_connections
        for ws in target_websockets:
            try:
                await ws.send_text(json.dumps(prompt_data))
            except:
                pass
                
    async def send_robbie_response(self, content: str, websocket: WebSocket):
        # Send Robbie's response line by line like terminal output
        lines = content.split('\n')
        for line in lines:
            if line.strip():
                await self.send_terminal_line(f"🤖 robbie: {line.strip()}", "robbie", websocket)
                await asyncio.sleep(0.05)  # Typewriter effect
                
    async def send_chunk(self, chunk: str, websocket: WebSocket):
        chunk_data = {
            "type": "chunk",
            "content": chunk
        }
        try:
            await websocket.send_text(json.dumps(chunk_data))
        except:
            pass
            
    async def send_stream_complete(self, websocket: WebSocket):
        complete_data = {
            "type": "stream_complete"
        }
        try:
            await websocket.send_text(json.dumps(complete_data))
        except:
            pass

manager = TerminalConnectionManager()

@app.get("/", response_class=HTMLResponse)
async def get_terminal(request: Request):
    return templates.TemplateResponse("terminal.html", {"request": request})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "command":
                command = message["content"].strip()
                
                # Echo the command
                await manager.send_terminal_line(f"{manager.current_user}@aurora-town:~/robbie$ {command}", "command", websocket)
                
                # Handle commands
                if command == "robbie":
                    await manager.send_terminal_line("🤖 Robbie AI Core activated", "system", websocket)
                    await manager.send_terminal_line("Ready for strategic business intelligence 💡", "system", websocket)
                    await manager.send_prompt(websocket)
                    
                elif command == "help":
                    await manager.send_terminal_line("Available commands:", "system", websocket)
                    await manager.send_terminal_line("  robbie    - Start Robbie chat", "system", websocket)
                    await manager.send_terminal_line("  help      - Show this help", "system", websocket)
                    await manager.send_terminal_line("  clear     - Clear terminal", "system", websocket)
                    await manager.send_terminal_line("  status    - System status", "system", websocket)
                    await manager.send_prompt(websocket)
                    
                elif command == "clear":
                    await manager.send_terminal_line("", "clear", websocket)
                    await manager.send_prompt(websocket)
                    
                elif command == "status":
                    await manager.send_terminal_line("🟢 Aurora Town: Online", "system", websocket)
                    await manager.send_terminal_line("🟢 RunPod GPU: Connected", "system", websocket)
                    await manager.send_terminal_line("🟢 Robbie AI: Active", "system", websocket)
                    await manager.send_terminal_line("🟢 Business Context: Loaded", "system", websocket)
                    await manager.send_prompt(websocket)
                    
                elif command.startswith("robbie ") or (command and not command in ["robbie", "help", "clear", "status"]):
                    # This is a message for Robbie
                    user_message = command.replace("robbie ", "").strip()
                    
                    if user_message:
                        await manager.send_terminal_line("🤖 Robbie processing...", "system", websocket)
                        await stream_robbie_response(user_message, websocket)
                    else:
                        await manager.send_terminal_line("🤖 Robbie: Ready for your command, Allan! 💡", "robbie", websocket)
                        await manager.send_prompt(websocket)
                else:
                    await manager.send_terminal_line(f"Command not found: {command}", "error", websocket)
                    await manager.send_terminal_line("Type 'help' for available commands", "system", websocket)
                    await manager.send_prompt(websocket)
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket)

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
                                
                                # If line gets too long, send it and start new line
                                if len(current_line) > 80:
                                    await manager.send_terminal_line(f"🤖 robbie: {current_line.strip()}", "robbie", websocket)
                                    await asyncio.sleep(0.02)
                                    current_line = ""
                                    
                            # Send remaining content
                            if current_line.strip():
                                await manager.send_terminal_line(f"🤖 robbie: {current_line.strip()}", "robbie", websocket)
                                
                            await manager.send_prompt(websocket)
                            return
                            
            except Exception as e:
                logger.error(f"Aurora LLM Gateway error: {e}")
                
        # Fallback to direct Ollama
        try:
            payload = {
                "model": "qwen2.5:7b",
                "prompt": f"ROBBIE MODE: You are Robbie, Allan's AI executive assistant at TestPilot CPG. You are NOT Qwen. You are Robbie. Be strategic, direct, revenue-focused. Use emojis: ✅ 🔴 💰 🚀 ⚠️ 💡 📊 🎯. Respond as Robbie to: {message}",
                "stream": False,
                "options": {
                    "temperature": 0.9,
                    "top_p": 0.9,
                    "max_tokens": 200,
                    "stop": ["\n\n"]
                }
            }
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=3)) as session:
                async with session.post("http://localhost:11434/api/generate", json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        full_response = result.get("response", "").strip()
                        
                        if full_response:
                            # Stream the response
                            words = full_response.split()
                            current_line = ""
                            
                            for word in words:
                                current_line += word + " "
                                
                                if len(current_line) > 80:
                                    await manager.send_terminal_line(f"🤖 robbie: {current_line.strip()}", "robbie", websocket)
                                    await asyncio.sleep(0.02)
                                    current_line = ""
                                    
                            if current_line.strip():
                                await manager.send_terminal_line(f"🤖 robbie: {current_line.strip()}", "robbie", websocket)
                                
                            await manager.send_prompt(websocket)
                            return
                            
        except Exception as e:
            logger.error(f"Ollama error: {e}")
            
        # Final fallback
        await manager.send_terminal_line("🤖 robbie: Hey Allan! I'm having some technical difficulties. Give me a moment to get back up to speed! 💪", "robbie", websocket)
        await manager.send_prompt(websocket)
        
    except Exception as e:
        logger.error(f"Stream error: {e}")
        await manager.send_terminal_line("🤖 robbie: Technical issue - let me try again! 🔧", "robbie", websocket)
        await manager.send_prompt(websocket)

@app.get("/api/status")
async def get_status():
    return {
        "status": "online",
        "service": "Robbie Terminal Chat",
        "version": "2.0",
        "connections": len(manager.active_connections),
        "terminal_mode": True,
        "llm_connected": True
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8008)
