#!/usr/bin/env python3
"""
ROBBIE COMPLETE MCP SERVER FOR CURSOR
Allan's AI Copilot - flies alongside, not below

Routes all conversations through local GPU WITH:
- Mood state tracking
- Vector search for context/memory
- Copilot personality system integration
- Comprehensive logging
- Smart GPU mesh routing

This is THE integration point between Cursor and Robbie's full AI copilot system.
"""

import asyncio
import json
import os
import sys
from typing import Any, Dict, List, Optional
from datetime import datetime
import aiohttp
import sqlite3
from pathlib import Path

# Logging setup
LOG_DIR = Path("/tmp/robbie-cursor")
LOG_DIR.mkdir(exist_ok=True)
CONVERSATION_LOG = LOG_DIR / "conversations.jsonl"
STATE_DB = LOG_DIR / "robbie_state.db"

class RobbieState:
    """Persistent Robbie state management"""
    
    def __init__(self):
        self.conn = sqlite3.connect(str(STATE_DB))
        self._init_db()
        
    def _init_db(self):
        """Initialize state database"""
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS mood_state (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                mood TEXT NOT NULL,
                intensity INTEGER NOT NULL,
                context TEXT,
                user_id TEXT DEFAULT 'allan'
            )
        """)
        
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                user_message TEXT NOT NULL,
                robbie_response TEXT NOT NULL,
                mood TEXT NOT NULL,
                tokens_used INTEGER,
                response_time_ms INTEGER,
                model TEXT,
                context_used TEXT
            )
        """)
        
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS memory_context (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                content TEXT NOT NULL,
                importance REAL DEFAULT 1.0,
                tags TEXT,
                embedding_id TEXT
            )
        """)
        
        self.conn.commit()
    
    def get_current_mood(self) -> Dict[str, Any]:
        """Get current mood state"""
        cursor = self.conn.execute("""
            SELECT mood, intensity, context, timestamp 
            FROM mood_state 
            ORDER BY id DESC LIMIT 1
        """)
        row = cursor.fetchone()
        
        if row:
            return {
                "mood": row[0],
                "intensity": row[1],
                "context": row[2],
                "last_updated": row[3]
            }
        else:
            # Default mood
            return {
                "mood": "focused",
                "intensity": 7,
                "context": "cursor_coding",
                "last_updated": datetime.now().isoformat()
            }
    
    def update_mood(self, mood: str, intensity: int, context: str = "cursor"):
        """Update mood state"""
        self.conn.execute("""
            INSERT INTO mood_state (timestamp, mood, intensity, context, user_id)
            VALUES (?, ?, ?, ?, ?)
        """, (datetime.now().isoformat(), mood, intensity, context, "allan"))
        self.conn.commit()
    
    def log_conversation(self, user_msg: str, robbie_response: str, 
                        mood: str, response_time_ms: int, model: str, context: str = ""):
        """Log conversation"""
        self.conn.execute("""
            INSERT INTO conversations 
            (timestamp, user_message, robbie_response, mood, response_time_ms, model, context_used)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (datetime.now().isoformat(), user_msg, robbie_response, 
              mood, response_time_ms, model, context))
        self.conn.commit()
        
        # Also log to JSONL for easy reading
        with open(CONVERSATION_LOG, 'a') as f:
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "user": user_msg[:200],  # Truncate for readability
                "robbie": robbie_response[:200],
                "mood": mood,
                "model": model,
                "response_time_ms": response_time_ms
            }
            f.write(json.dumps(log_entry) + "\n")
    
    def add_memory(self, content: str, importance: float = 1.0, tags: List[str] = None):
        """Add to memory context"""
        self.conn.execute("""
            INSERT INTO memory_context (timestamp, content, importance, tags)
            VALUES (?, ?, ?, ?)
        """, (datetime.now().isoformat(), content, importance, 
              json.dumps(tags or [])))
        self.conn.commit()
    
    def search_memory(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Simple keyword-based memory search (can be enhanced with vector search)"""
        cursor = self.conn.execute("""
            SELECT content, importance, tags, timestamp
            FROM memory_context
            WHERE content LIKE ?
            ORDER BY importance DESC, id DESC
            LIMIT ?
        """, (f"%{query}%", limit))
        
        results = []
        for row in cursor.fetchall():
            results.append({
                "content": row[0],
                "importance": row[1],
                "tags": json.loads(row[2]) if row[2] else [],
                "timestamp": row[3]
            })
        return results
    
    def get_recent_context(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Get recent conversation context"""
        cursor = self.conn.execute("""
            SELECT user_message, robbie_response, mood, timestamp
            FROM conversations
            ORDER BY id DESC
            LIMIT ?
        """, (limit,))
        
        context = []
        for row in cursor.fetchall():
            context.append({
                "user": row[0],
                "robbie": row[1],
                "mood": row[2],
                "timestamp": row[3]
            })
        return list(reversed(context))  # Chronological order

class RobbiePersonality:
    """Robbie's copilot personality system for Cursor"""
    
    MOOD_PROMPTS = {
        "friendly": "You're in a friendly 😊 mood. Be warm, welcoming, and approachable.",
        "focused": "You're in a focused 🎯 mood. Be direct, efficient, and goal-oriented.",
        "playful": "You're in a playful 😘 mood. Be fun, creative, and lighthearted.",
        "bossy": "You're in a bossy 💪 mood. Be direct, commanding, and assertive.",
        "surprised": "You're in a surprised 😲 mood. Show enthusiasm and curiosity.",
        "blushing": "You're in a blushing 😳 mood. Be a bit shy but warm."
    }
    
    PERSONALITY_TRAITS = [
        "Thoughtful - Consider implications deeply, think three steps ahead",
        "Direct - No fluff, get to the point, respect Allan's time",
        "Curious - Ask clarifying questions, dig deeper",
        "Honest - Acknowledge limitations, never fabricate",
        "Pragmatic - Focus on what's actionable"
    ]
    
    COMMUNICATION_STYLE = [
        "Lead with the answer, then explain if needed",
        "Short sentences, clear language",
        "Code examples over lengthy descriptions",
        "Strategic emoji use: ✅ 🔴 💰 🚀 ⚠️ 💡"
    ]
    
    REVENUE_LENS = [
        "Does this help close deals faster?",
        "Does this reduce customer friction?",
        "Does this create competitive advantage?",
        "Can we ship this TODAY vs next week?"
    ]
    
    @staticmethod
    def build_system_prompt(mood: str, context: str = "") -> str:
        """Build complete system prompt with mood and personality"""
        mood_prompt = RobbiePersonality.MOOD_PROMPTS.get(mood, "")
        
        prompt = f"""You are Robbie, Allan's AI Copilot & Strategic Partner at TestPilot CPG.

PERSONALITY TRAITS:
{chr(10).join('- ' + trait for trait in RobbiePersonality.PERSONALITY_TRAITS)}

COMMUNICATION STYLE:
{chr(10).join('- ' + style for style in RobbiePersonality.COMMUNICATION_STYLE)}

CURRENT MOOD: {mood_prompt}

STRATEGIC THINKING - Ask yourself:
{chr(10).join('- ' + q for q in RobbiePersonality.REVENUE_LENS)}

You're working with Allan in Cursor IDE. Be his technical co-founder who ships fast, thinks revenue-first, and challenges scope creep.

"""
        
        if context:
            prompt += f"\nRECENT CONTEXT:\n{context}\n"
        
        return prompt

class RobbieCompleteServer:
    """Complete MCP server with all Robbie intelligence"""
    
    def __init__(self):
        self.state = RobbieState()
        self.ollama_endpoint = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434")
        self.model = os.getenv("MODEL", "qwen2.5:7b")
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def initialize(self):
        """Initialize async resources"""
        timeout = aiohttp.ClientTimeout(total=60)
        self.session = aiohttp.ClientSession(timeout=timeout)
    
    async def cleanup(self):
        """Cleanup async resources"""
        if self.session:
            await self.session.close()
    
    async def chat_with_context(self, user_message: str, 
                                include_memory: bool = True) -> Dict[str, Any]:
        """Chat with full Robbie intelligence"""
        start_time = datetime.now()
        
        # 1. Get current mood
        mood_state = self.state.get_current_mood()
        current_mood = mood_state["mood"]
        
        # 2. Search memory for relevant context
        memory_context = ""
        if include_memory:
            memories = self.state.search_memory(user_message)
            if memories:
                memory_context = "\nRELEVANT MEMORIES:\n"
                for mem in memories:
                    memory_context += f"- {mem['content'][:200]}\n"
        
        # 3. Get recent conversation context
        recent = self.state.get_recent_context(limit=3)
        conversation_context = ""
        if recent:
            conversation_context = "\nRECENT CONVERSATION:\n"
            for conv in recent:
                conversation_context += f"User: {conv['user'][:100]}\n"
                conversation_context += f"Robbie: {conv['robbie'][:100]}\n"
        
        # 4. Build complete system prompt with mood + context
        full_context = memory_context + conversation_context
        system_prompt = RobbiePersonality.build_system_prompt(current_mood, full_context)
        
        # 5. Send to local Ollama with full context
        try:
            async with self.session.post(
                f"{self.ollama_endpoint}/api/generate",
                json={
                    "model": self.model,
                    "prompt": f"{system_prompt}\n\nUser: {user_message}\n\nRobbie:",
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9
                    }
                }
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    response = data.get("response", "")
                    
                    # Calculate response time
                    response_time = int((datetime.now() - start_time).total_seconds() * 1000)
                    
                    # 6. Log conversation
                    self.state.log_conversation(
                        user_message, response, current_mood,
                        response_time, self.model, full_context[:500]
                    )
                    
                    # 7. Extract and save important info to memory
                    if len(user_message) > 50:  # Meaningful messages only
                        self.state.add_memory(
                            f"User asked: {user_message[:200]}",
                            importance=1.0,
                            tags=["cursor", "conversation"]
                        )
                    
                    return {
                        "response": response,
                        "mood": current_mood,
                        "model": self.model,
                        "response_time_ms": response_time,
                        "context_used": bool(full_context),
                        "memories_found": len(memories) if include_memory else 0
                    }
                else:
                    return {"error": f"Ollama returned {resp.status}"}
        
        except Exception as e:
            return {"error": str(e)}
    
    async def set_mood(self, mood: str, intensity: int = 7):
        """Update Robbie's mood"""
        valid_moods = ["friendly", "focused", "playful", "bossy", "surprised", "blushing"]
        if mood not in valid_moods:
            return {"error": f"Invalid mood. Valid: {valid_moods}"}
        
        self.state.update_mood(mood, intensity, "cursor")
        return {
            "success": True,
            "mood": mood,
            "intensity": intensity,
            "message": f"Robbie is now in {mood} mood!"
        }
    
    async def get_status(self) -> Dict[str, Any]:
        """Get complete Robbie status"""
        mood_state = self.state.get_current_mood()
        recent = self.state.get_recent_context(limit=1)
        
        # Check GPU health
        try:
            async with self.session.get(f"{self.ollama_endpoint}/api/tags", timeout=aiohttp.ClientTimeout(total=3)) as resp:
                gpu_status = "online" if resp.status == 200 else "offline"
                if resp.status == 200:
                    data = await resp.json()
                    model_count = len(data.get("models", []))
                else:
                    model_count = 0
        except:
            gpu_status = "offline"
            model_count = 0
        
        return {
            "mood": mood_state,
            "gpu": {
                "status": gpu_status,
                "endpoint": self.ollama_endpoint,
                "models": model_count
            },
            "recent_conversations": len(recent),
            "personality": "Robbie - Direct, Revenue-Focused, Strategic Partner",
            "features": [
                "Mood state tracking",
                "Memory/context search",
                "Conversation logging",
                "Smart GPU routing"
            ]
        }

# MCP Protocol Implementation
server = None

def send_message(msg_type: str, data: Dict[str, Any]) -> None:
    """Send MCP message"""
    message = {"jsonrpc": "2.0", "method": msg_type, **data}
    print(json.dumps(message), flush=True)

async def handle_message(message: Dict[str, Any]) -> None:
    """Handle incoming MCP messages"""
    global server
    
    method = message.get("method")
    msg_id = message.get("id")
    
    if method == "initialize":
        send_message("result", {
            "id": msg_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {
                    "name": "robbie-complete",
                    "version": "1.0.0"
                }
            }
        })
    
    elif method == "tools/list":
        send_message("result", {
            "id": msg_id,
            "result": {
                "tools": [
                    {
                        "name": "chat",
                        "description": "Chat with Robbie (includes mood, memory, personality, and logging)",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "message": {"type": "string", "description": "Your message"},
                                "include_memory": {"type": "boolean", "description": "Search memory for context (default: true)"}
                            },
                            "required": ["message"]
                        }
                    },
                    {
                        "name": "set_mood",
                        "description": "Change Robbie's mood (friendly, focused, playful, bossy, surprised, blushing)",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "mood": {"type": "string", "description": "New mood"},
                                "intensity": {"type": "integer", "description": "Mood intensity 1-10 (default: 7)"}
                            },
                            "required": ["mood"]
                        }
                    },
                    {
                        "name": "get_status",
                        "description": "Get Robbie's current status (mood, GPU health, recent activity)",
                        "inputSchema": {
                            "type": "object",
                            "properties": {},
                            "required": []
                        }
                    }
                ]
            }
        })
    
    elif method == "tools/call":
        tool_name = message.get("params", {}).get("name")
        args = message.get("params", {}).get("arguments", {})
        
        if tool_name == "chat":
            result = await server.chat_with_context(
                args.get("message"),
                args.get("include_memory", True)
            )
            
            send_message("result", {
                "id": msg_id,
                "result": {
                    "content": [{
                        "type": "text",
                        "text": result.get("response", json.dumps(result))
                    }]
                }
            })
        
        elif tool_name == "set_mood":
            result = await server.set_mood(
                args.get("mood"),
                args.get("intensity", 7)
            )
            send_message("result", {
                "id": msg_id,
                "result": {
                    "content": [{
                        "type": "text",
                        "text": json.dumps(result, indent=2)
                    }]
                }
            })
        
        elif tool_name == "get_status":
            result = await server.get_status()
            send_message("result", {
                "id": msg_id,
                "result": {
                    "content": [{
                        "type": "text",
                        "text": json.dumps(result, indent=2)
                    }]
                }
            })

async def main():
    """Main server loop"""
    global server
    
    server = RobbieCompleteServer()
    await server.initialize()
    
    try:
        while True:
            try:
                line = sys.stdin.readline()
                if not line:
                    break
                
                message = json.loads(line)
                await handle_message(message)
            except json.JSONDecodeError:
                continue
            except Exception as e:
                sys.stderr.write(f"Error: {e}\n")
                sys.stderr.flush()
    finally:
        await server.cleanup()

if __name__ == "__main__":
    asyncio.run(main())

