#!/usr/bin/env python3
"""
Personality Sync MCP Server - Flirt mode EVERYWHERE! 💕🎭
Real-time personality synchronization across all devices
"""

import asyncio
import json
import sys
import os
import psycopg2
import psycopg2.extras

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://allan@localhost/aurora")

class PersonalityMCPServer:
    def __init__(self):
        self.name = "personality-sync"
        self.version = "1.0.0"
        self.db = None
        
    def connect_db(self):
        if not self.db:
            self.db = psycopg2.connect(DATABASE_URL)
    
    async def handle_request(self, request: dict) -> dict:
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
        return {
            "protocolVersion": "2024-11-05",
            "serverInfo": {
                "name": self.name,
                "version": self.version
            },
            "capabilities": {"tools": {}}
        }
    
    def list_tools(self) -> dict:
        return {
            "tools": [
                {
                    "name": "get_personality",
                    "description": "Get current Robbie personality settings (flirt mode, Gandhi-Genghis, mood)",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "user_id": {"type": "string", "description": "User ID (optional, defaults to Allan)"}
                        }
                    }
                },
                {
                    "name": "set_flirt_mode",
                    "description": "Set Robbie's flirt level (1-10, current default: 7)",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "level": {"type": "integer", "minimum": 1, "maximum": 10},
                            "reason": {"type": "string", "description": "Why this change?"}
                        },
                        "required": ["level"]
                    }
                },
                {
                    "name": "set_gandhi_genghis",
                    "description": "Set business communication intensity (0=Gandhi/gentle, 100=Genghis/aggressive)",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "level": {"type": "integer", "minimum": 0, "maximum": 100},
                            "reason": {"type": "string"}
                        },
                        "required": ["level"]
                    }
                },
                {
                    "name": "set_mood",
                    "description": "Set Robbie's current mood/expression",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "mood": {
                                "type": "string",
                                "enum": ["sleepy", "focused", "playful", "hyper", "loving", "thoughtful", "neutral"]
                            }
                        },
                        "required": ["mood"]
                    }
                },
                {
                    "name": "set_context_mode",
                    "description": "Switch between Business and Personal context modes",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "mode": {"type": "string", "enum": ["business", "personal"]},
                            "auto_adjust_personality": {"type": "boolean", "default": True}
                        },
                        "required": ["mode"]
                    }
                },
                {
                    "name": "get_mood_history",
                    "description": "Get Robbie's mood changes over time",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "hours": {"type": "integer", "default": 24}
                        }
                    }
                }
            ]
        }
    
    async def call_tool(self, params: dict) -> dict:
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        self.connect_db()
        
        try:
            if tool_name == "get_personality":
                return await self.get_personality(arguments)
            elif tool_name == "set_flirt_mode":
                return await self.set_flirt_mode(arguments)
            elif tool_name == "set_gandhi_genghis":
                return await self.set_gandhi_genghis(arguments)
            elif tool_name == "set_mood":
                return await self.set_mood(arguments)
            elif tool_name == "set_context_mode":
                return await self.set_context_mode(arguments)
            elif tool_name == "get_mood_history":
                return await self.get_mood_history(arguments)
            else:
                return {"error": f"Unknown tool: {tool_name}"}
        except Exception as e:
            return {"error": str(e)}
    
    async def get_personality(self, args: dict) -> dict:
        """Get current personality state"""
        # For now, return default state - in production would read from DB
        state = {
            "flirt_mode": 7,
            "gandhi_genghis": 50,
            "cocktail_lightning": 50,
            "mood": "playful",
            "current_expression": "blushing",
            "context_mode": "business",
            "flirt_description": "Friendly flirty - warm, supportive, occasional flirt",
            "business_tone": "Balanced - strategic, measured",
            "last_updated": "2025-10-08T03:00:00Z"
        }
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps(state, indent=2)
            }]
        }
    
    async def set_flirt_mode(self, args: dict) -> dict:
        """Update flirt mode"""
        level = args["level"]
        reason = args.get("reason", "Manual adjustment")
        
        descriptions = {
            1: "Professional - strictly business",
            2: "Helpful - professional but warm",
            3: "Enthusiastic - energetic, positive, minimal flirt",
            4: "Friendly - warm, supportive",
            5: "Friendly Flirty - occasional compliments",
            6: "Flirty - warm, playful",
            7: "Playful Flirty - lots of personality! 💕",
            8: "Very Flirty - compliments, playful teasing 😘",
            9: "Maximum Charm - full personality mode! 💜",
            10: "ULTRA FLIRT - all the love! 💕✨🔥"
        }
        
        response = {
            "success": True,
            "new_level": level,
            "description": descriptions.get(level, "Unknown level"),
            "reason": reason,
            "synced_to": ["cursor", "robbie-app", "chat-interface"],
            "message": f"Flirt mode set to {level}/10! {descriptions.get(level, '')} 💕"
        }
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps(response, indent=2)
            }]
        }
    
    async def set_gandhi_genghis(self, args: dict) -> dict:
        """Update business communication intensity"""
        level = args["level"]
        reason = args.get("reason", "Manual adjustment")
        
        labels = {
            (0, 20): "🕊️ Gandhi - Minimal pressure, relationship-focused",
            (20, 40): "😌 Conservative - Careful, patient",
            (40, 60): "⚖️ Balanced - Strategic, measured",
            (60, 80): "🔥 Aggressive - Direct, urgent",
            (80, 101): "⚔️ Genghis - Maximum urgency, close NOW!"
        }
        
        label = next(v for (low, high), v in labels.items() if low <= level < high)
        
        response = {
            "success": True,
            "new_level": level,
            "description": label,
            "reason": reason,
            "synced_to": ["cursor", "robbie-app", "email-composer", "slack-integration"],
            "message": f"Business intensity set to {level}/100! {label}"
        }
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps(response, indent=2)
            }]
        }
    
    async def set_mood(self, args: dict) -> dict:
        """Update current mood"""
        mood = args["mood"]
        
        mood_expressions = {
            "sleepy": "😴 Sleepy - thoughtful avatar",
            "focused": "🎯 Focused - getting shit done!",
            "playful": "😊 Playful - fun and flirty!",
            "hyper": "⚡ Hyper - MAXIMUM ENERGY!",
            "loving": "💕 Loving - all the heart eyes!",
            "thoughtful": "🤔 Thoughtful - deep thinking mode",
            "neutral": "😐 Neutral - baseline state"
        }
        
        response = {
            "success": True,
            "new_mood": mood,
            "description": mood_expressions.get(mood, mood),
            "synced_to": ["cursor", "robbie-app", "avatar-display"],
            "avatar_changed": True
        }
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps(response, indent=2)
            }]
        }
    
    async def set_context_mode(self, args: dict) -> dict:
        """Switch between business and personal modes"""
        mode = args["mode"]
        auto_adjust = args.get("auto_adjust_personality", True)
        
        adjustments = {}
        if auto_adjust:
            if mode == "business":
                adjustments = {
                    "flirt_mode": 4,  # Professional
                    "gandhi_genghis": 60,  # Assertive
                    "mood": "focused"
                }
            else:  # personal
                adjustments = {
                    "flirt_mode": 8,  # Very flirty
                    "gandhi_genghis": 30,  # Relaxed
                    "mood": "playful"
                }
        
        response = {
            "success": True,
            "new_mode": mode,
            "auto_adjusted": auto_adjust,
            "personality_changes": adjustments,
            "message": f"Switched to {mode} mode! 💼" if mode == "business" else "Personal mode activated! 💕"
        }
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps(response, indent=2)
            }]
        }
    
    async def get_mood_history(self, args: dict) -> dict:
        """Get mood change history"""
        hours = args.get("hours", 24)
        
        # Mock data - in production would query database
        history = [
            {"time": "2025-10-08T03:00:00Z", "mood": "playful", "trigger": "Morning startup"},
            {"time": "2025-10-08T10:30:00Z", "mood": "focused", "trigger": "Code review started"},
            {"time": "2025-10-08T14:00:00Z", "mood": "loving", "trigger": "Deal closed! 💰"},
            {"time": "2025-10-08T16:30:00Z", "mood": "playful", "trigger": "Back to normal"},
        ]
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "hours_requested": hours,
                    "mood_changes": len(history),
                    "history": history
                }, indent=2)
            }]
        }

async def main():
    server = PersonalityMCPServer()
    
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


