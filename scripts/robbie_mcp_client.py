#!/usr/bin/env python3
"""
Simple client to interact with Robbie MCP server
Allows Cascade to check mood, context, and log conversations
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path

STATE_DB = Path("/tmp/robbie-cursor/robbie_state.db")

class RobbieMCPClient:
    def __init__(self):
        if not STATE_DB.exists():
            raise Exception("MCP server not running - database doesn't exist")
        self.conn = sqlite3.connect(str(STATE_DB))
    
    def get_current_mood(self):
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
        return {"mood": "focused", "intensity": 7, "context": "cascade", "last_updated": datetime.now().isoformat()}
    
    def set_mood(self, mood, intensity=7, context="cascade"):
        """Update mood state"""
        self.conn.execute("""
            INSERT INTO mood_state (timestamp, mood, intensity, context, user_id)
            VALUES (?, ?, ?, ?, ?)
        """, (datetime.now().isoformat(), mood, intensity, context, "allan"))
        self.conn.commit()
        return {"success": True, "mood": mood, "intensity": intensity}
    
    def get_recent_conversations(self, limit=5):
        """Get recent conversation context"""
        cursor = self.conn.execute("""
            SELECT user_message, robbie_response, mood, timestamp, model
            FROM conversations
            ORDER BY id DESC
            LIMIT ?
        """, (limit,))
        
        conversations = []
        for row in cursor.fetchall():
            conversations.append({
                "user": row[0][:200],
                "robbie": row[1][:200],
                "mood": row[2],
                "timestamp": row[3],
                "model": row[4]
            })
        return list(reversed(conversations))
    
    def log_conversation(self, user_msg, robbie_response, mood="focused", model="cascade"):
        """Log a conversation"""
        self.conn.execute("""
            INSERT INTO conversations 
            (timestamp, user_message, robbie_response, mood, response_time_ms, model, context_used)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (datetime.now().isoformat(), user_msg, robbie_response, mood, 0, model, "cascade"))
        self.conn.commit()
        return {"success": True}
    
    def get_stats(self):
        """Get conversation stats"""
        cursor = self.conn.execute("SELECT COUNT(*) FROM conversations")
        total_convos = cursor.fetchone()[0]
        
        cursor = self.conn.execute("SELECT COUNT(*) FROM memory_context")
        total_memories = cursor.fetchone()[0]
        
        return {
            "total_conversations": total_convos,
            "total_memories": total_memories,
            "current_mood": self.get_current_mood()
        }

if __name__ == "__main__":
    import sys
    
    client = RobbieMCPClient()
    
    if len(sys.argv) < 2:
        print(json.dumps(client.get_stats(), indent=2))
        sys.exit(0)
    
    command = sys.argv[1]
    
    if command == "mood":
        if len(sys.argv) > 2:
            mood = sys.argv[2]
            intensity = int(sys.argv[3]) if len(sys.argv) > 3 else 7
            result = client.set_mood(mood, intensity)
        else:
            result = client.get_current_mood()
        print(json.dumps(result, indent=2))
    
    elif command == "history":
        limit = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        result = client.get_recent_conversations(limit)
        print(json.dumps(result, indent=2))
    
    elif command == "log":
        if len(sys.argv) < 4:
            print("Usage: robbie_mcp_client.py log <user_msg> <robbie_response>")
            sys.exit(1)
        user_msg = sys.argv[2]
        robbie_response = sys.argv[3]
        mood = sys.argv[4] if len(sys.argv) > 4 else "focused"
        result = client.log_conversation(user_msg, robbie_response, mood)
        print(json.dumps(result, indent=2))
    
    elif command == "stats":
        result = client.get_stats()
        print(json.dumps(result, indent=2))
    
    else:
        print(f"Unknown command: {command}")
        print("Available commands: mood, history, log, stats")
        sys.exit(1)
