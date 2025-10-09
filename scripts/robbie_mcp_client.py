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
    
    def get_personality_state(self, user_id='allan'):
        """Get complete personality state (4 sliders + mood)"""
        cursor = self.conn.execute("""
            SELECT attraction, gandhi_genghis, turbo, auto,
                   mood, mood_intensity, context, is_public, timestamp
            FROM personality_state
            WHERE user_id = ?
        """, (user_id,))
        row = cursor.fetchone()
        
        if row:
            return {
                "attraction": row[0],
                "gandhi_genghis": row[1],
                "turbo": row[2],
                "auto": row[3],
                "mood": row[4],
                "mood_intensity": row[5],
                "context": row[6],
                "is_public": bool(row[7]),
                "last_updated": row[8]
            }
        return {
            "attraction": 11,
            "gandhi_genghis": 5,
            "turbo": 7,
            "auto": 5,
            "mood": "flirty",
            "mood_intensity": 11,
            "context": "cascade",
            "is_public": False,
            "last_updated": datetime.now().isoformat()
        }
    
    def set_mood(self, mood, intensity=7, context="cascade", user_id="allan"):
        """Update mood state (transient)"""
        self.conn.execute("""
            UPDATE personality_state
            SET mood = ?, mood_intensity = ?, context = ?, timestamp = ?
            WHERE user_id = ?
        """, (mood, intensity, context, datetime.now().isoformat(), user_id))
        self.conn.commit()
        return {"success": True, "mood": mood, "intensity": intensity}
    
    def set_slider(self, slider, value, user_id="allan"):
        """Update personality slider (persistent)"""
        valid_sliders = ['attraction', 'gandhi_genghis', 'turbo', 'auto']
        if slider not in valid_sliders:
            return {"error": f"Invalid slider. Valid: {valid_sliders}"}
        
        # Enforce attraction limit
        if slider == 'attraction' and value > 7 and user_id != 'allan':
            value = 7
        
        self.conn.execute(f"""
            UPDATE personality_state
            SET {slider} = ?, timestamp = ?
            WHERE user_id = ?
        """, (value, datetime.now().isoformat(), user_id))
        self.conn.commit()
        return {"success": True, "slider": slider, "value": value}
    
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
            "personality_state": self.get_personality_state()
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
            result = client.get_personality_state()
        print(json.dumps(result, indent=2))
    
    elif command == "slider":
        if len(sys.argv) < 4:
            print("Usage: robbie_mcp_client.py slider <attraction|gandhi_genghis|turbo|auto> <value>")
            sys.exit(1)
        slider = sys.argv[2]
        value = int(sys.argv[3])
        result = client.set_slider(slider, value)
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
        print("Available commands: mood, slider, history, log, stats")
        sys.exit(1)
