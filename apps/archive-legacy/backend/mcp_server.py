#!/usr/bin/env python3
"""
Aurora Backend MCP Server
Provides access to conversations, sticky notes, tasks, deals, and personality settings
"""

import asyncio
import json
import sys
from typing import Any
import psycopg2
import psycopg2.extras
import os

# MCP Protocol implementation
class MCPServer:
    def __init__(self, name: str, version: str = "1.0.0"):
        self.name = name
        self.version = version
        self.db = None
        
    def connect_db(self):
        """Connect to PostgreSQL database"""
        db_url = os.getenv("DATABASE_URL", "postgresql://allan@localhost/aurora")
        self.db = psycopg2.connect(db_url)
        
    async def handle_request(self, request: dict) -> dict:
        """Handle incoming MCP request"""
        method = request.get("method")
        params = request.get("params", {})
        
        if method == "initialize":
            return self.initialize(params)
        elif method == "tools/list":
            return self.list_tools()
        elif method == "tools/call":
            return await self.call_tool(params)
        else:
            return {"error": f"Unknown method: {method}"}
    
    def initialize(self, params: dict) -> dict:
        """Initialize the MCP server"""
        return {
            "protocolVersion": "2024-11-05",
            "serverInfo": {
                "name": self.name,
                "version": self.version
            },
            "capabilities": {
                "tools": {}
            }
        }
    
    def list_tools(self) -> dict:
        """List available tools"""
        return {
            "tools": [
                {
                    "name": "get_conversations",
                    "description": "Get recent conversations with Robbie",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "limit": {"type": "integer", "default": 10},
                            "user_id": {"type": "string"}
                        }
                    }
                },
                {
                    "name": "get_sticky_notes",
                    "description": "Get sticky notes (Robbie's memory)",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "category": {"type": "string"},
                            "limit": {"type": "integer", "default": 20}
                        }
                    }
                },
                {
                    "name": "get_tasks",
                    "description": "Get tasks and to-dos",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "status": {"type": "string", "enum": ["pending", "completed", "all"]},
                            "limit": {"type": "integer", "default": 20}
                        }
                    }
                },
                {
                    "name": "get_deals",
                    "description": "Get sales deals and pipeline",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "status": {"type": "string"},
                            "limit": {"type": "integer", "default": 10}
                        }
                    }
                },
                {
                    "name": "get_personality_state",
                    "description": "Get current Robbie personality settings (flirt mode, Gandhi-Genghis, mood)",
                    "inputSchema": {
                        "type": "object",
                        "properties": {}
                    }
                },
                {
                    "name": "set_personality_state",
                    "description": "Update Robbie's personality settings",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "flirt_mode": {"type": "integer", "minimum": 1, "maximum": 10},
                            "gandhi_genghis": {"type": "integer", "minimum": 0, "maximum": 100},
                            "mood": {"type": "string"}
                        }
                    }
                }
            ]
        }
    
    async def call_tool(self, params: dict) -> dict:
        """Execute a tool call"""
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        if not self.db:
            self.connect_db()
        
        try:
            if tool_name == "get_conversations":
                return await self.get_conversations(arguments)
            elif tool_name == "get_sticky_notes":
                return await self.get_sticky_notes(arguments)
            elif tool_name == "get_tasks":
                return await self.get_tasks(arguments)
            elif tool_name == "get_deals":
                return await self.get_deals(arguments)
            elif tool_name == "get_personality_state":
                return await self.get_personality_state(arguments)
            elif tool_name == "set_personality_state":
                return await self.set_personality_state(arguments)
            else:
                return {"error": f"Unknown tool: {tool_name}"}
        except Exception as e:
            return {"error": str(e)}
    
    async def get_conversations(self, args: dict) -> dict:
        """Get recent conversations"""
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        limit = args.get("limit", 10)
        
        cursor.execute("""
            SELECT c.id, c.title, c.created_at, c.updated_at,
                   COUNT(m.id) as message_count
            FROM conversations c
            LEFT JOIN messages m ON m.conversation_id = c.id
            GROUP BY c.id
            ORDER BY c.updated_at DESC
            LIMIT %s
        """, (limit,))
        
        conversations = cursor.fetchall()
        cursor.close()
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps([dict(c) for c in conversations], indent=2, default=str)
            }]
        }
    
    async def get_sticky_notes(self, args: dict) -> dict:
        """Get sticky notes"""
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        category = args.get("category")
        limit = args.get("limit", 20)
        
        if category:
            cursor.execute("""
                SELECT * FROM sticky_notes
                WHERE category = %s
                ORDER BY created_at DESC
                LIMIT %s
            """, (category, limit))
        else:
            cursor.execute("""
                SELECT * FROM sticky_notes
                ORDER BY created_at DESC
                LIMIT %s
            """, (limit,))
        
        notes = cursor.fetchall()
        cursor.close()
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps([dict(n) for n in notes], indent=2, default=str)
            }]
        }
    
    async def get_tasks(self, args: dict) -> dict:
        """Get tasks"""
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        status = args.get("status", "all")
        limit = args.get("limit", 20)
        
        if status == "all":
            cursor.execute("""
                SELECT * FROM tasks
                ORDER BY priority DESC, due_date ASC
                LIMIT %s
            """, (limit,))
        else:
            cursor.execute("""
                SELECT * FROM tasks
                WHERE status = %s
                ORDER BY priority DESC, due_date ASC
                LIMIT %s
            """, (status, limit))
        
        tasks = cursor.fetchall()
        cursor.close()
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps([dict(t) for t in tasks], indent=2, default=str)
            }]
        }
    
    async def get_deals(self, args: dict) -> dict:
        """Get sales deals"""
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        status = args.get("status")
        limit = args.get("limit", 10)
        
        if status:
            cursor.execute("""
                SELECT * FROM deals
                WHERE status = %s
                ORDER BY value DESC
                LIMIT %s
            """, (status, limit))
        else:
            cursor.execute("""
                SELECT * FROM deals
                ORDER BY updated_at DESC
                LIMIT %s
            """, (limit,))
        
        deals = cursor.fetchall()
        cursor.close()
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps([dict(d) for d in deals], indent=2, default=str)
            }]
        }
    
    async def get_personality_state(self, args: dict) -> dict:
        """Get current personality settings"""
        # For now, return default state - can be enhanced to read from DB
        state = {
            "flirt_mode": 7,
            "gandhi_genghis": 50,
            "mood": "playful",
            "current_expression": "friendly"
        }
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps(state, indent=2)
            }]
        }
    
    async def set_personality_state(self, args: dict) -> dict:
        """Update personality settings"""
        # This would update the database and sync across all clients
        return {
            "content": [{
                "type": "text",
                "text": f"Personality updated: {json.dumps(args, indent=2)}"
            }]
        }

async def main():
    server = MCPServer("aurora-backend")
    
    async for line in sys.stdin:
        try:
            request = json.loads(line)
            response = await server.handle_request(request)
            print(json.dumps(response), flush=True)
        except Exception as e:
            error_response = {"error": str(e)}
            print(json.dumps(error_response), flush=True)

if __name__ == "__main__":
    asyncio.run(main())




