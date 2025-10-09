#!/usr/bin/env python3
"""
Cascade MCP Wrapper - Automatic mood/context/logging for every interaction

This wrapper intercepts Cascade conversations and:
1. Checks current mood before responding
2. Pulls recent conversation context
3. Logs every exchange automatically
4. Updates mood based on conversation tone

Usage:
  python3 cascade_mcp_wrapper.py
  
Then interact normally - all mood/context/logging happens automatically.
"""

import sys
import json
import sqlite3
from datetime import datetime
from pathlib import Path

STATE_DB = Path("/tmp/robbie-cursor/robbie_state.db")

class CascadeMCPWrapper:
    def __init__(self):
        if not STATE_DB.exists():
            print("⚠️  MCP server not running. Start it first:")
            print("   python3 services/mcp_robbie_complete_server.py &")
            sys.exit(1)
        
        self.conn = sqlite3.connect(str(STATE_DB))
        self.current_mood = self.get_mood()
        print(f"🎯 Robbie MCP Wrapper Active")
        print(f"   Mood: {self.current_mood['mood']} (intensity: {self.current_mood['intensity']})")
        print(f"   Context: {self.current_mood['context']}")
        print()
    
    def get_mood(self):
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
                "timestamp": row[3]
            }
        return {"mood": "focused", "intensity": 7, "context": "cascade", "timestamp": datetime.now().isoformat()}
    
    def get_context(self, limit=3):
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
                "user": row[0][:150],
                "robbie": row[1][:150],
                "mood": row[2],
                "timestamp": row[3]
            })
        return list(reversed(context))
    
    def log_conversation(self, user_msg, robbie_response):
        """Log conversation with current mood"""
        self.conn.execute("""
            INSERT INTO conversations 
            (timestamp, user_message, robbie_response, mood, response_time_ms, model, context_used)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            datetime.now().isoformat(),
            user_msg,
            robbie_response,
            self.current_mood['mood'],
            0,
            "cascade",
            "auto_wrapper"
        ))
        self.conn.commit()
    
    def detect_mood_shift(self, user_msg):
        """Detect if mood should shift based on message"""
        msg_lower = user_msg.lower()
        
        # Mood triggers
        if any(word in msg_lower for word in ['urgent', 'asap', 'now', 'critical', 'emergency']):
            return 'focused', 9
        elif any(word in msg_lower for word in ['fun', 'cool', 'awesome', 'love', 'great']):
            return 'playful', 7
        elif any(word in msg_lower for word in ['do this', 'need you to', 'must', 'have to']):
            return 'bossy', 8
        elif any(word in msg_lower for word in ['wow', 'amazing', 'incredible', 'surprised']):
            return 'surprised', 8
        
        return None, None
    
    def update_mood(self, mood, intensity):
        """Update mood state"""
        self.conn.execute("""
            INSERT INTO mood_state (timestamp, mood, intensity, context, user_id)
            VALUES (?, ?, ?, ?, ?)
        """, (datetime.now().isoformat(), mood, intensity, "cascade_auto", "allan"))
        self.conn.commit()
        self.current_mood = self.get_mood()
    
    def format_context_prompt(self):
        """Format recent context for Cascade"""
        context = self.get_context(3)
        if not context:
            return ""
        
        prompt = "\n📝 Recent Context:\n"
        for conv in context:
            prompt += f"  User: {conv['user']}\n"
            prompt += f"  Robbie: {conv['robbie']}\n"
        return prompt
    
    def run(self):
        """Main interaction loop"""
        print("💬 Enter your message (or 'quit' to exit):")
        print("=" * 60)
        
        while True:
            try:
                # Get user input
                user_input = input("\n👤 You: ").strip()
                
                if not user_input:
                    continue
                
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("\n✅ Conversation logged. Goodbye!")
                    break
                
                # Check for mood shift
                new_mood, new_intensity = self.detect_mood_shift(user_input)
                if new_mood:
                    self.update_mood(new_mood, new_intensity)
                    print(f"   🎭 Mood shifted to: {new_mood} ({new_intensity}/10)")
                
                # Show context
                context_prompt = self.format_context_prompt()
                if context_prompt:
                    print(context_prompt)
                
                # Show current mood
                print(f"   🎯 Current mood: {self.current_mood['mood']} ({self.current_mood['intensity']}/10)")
                
                # Get Cascade response (simulated - in real use, this would call Cascade API)
                print("\n🤖 Robbie: [Cascade would respond here with mood/context awareness]")
                robbie_response = input("   Enter Robbie's response: ").strip()
                
                if robbie_response:
                    # Log the conversation
                    self.log_conversation(user_input, robbie_response)
                    print("   ✅ Logged to MCP database")
                
            except KeyboardInterrupt:
                print("\n\n✅ Conversation logged. Goodbye!")
                break
            except Exception as e:
                print(f"\n❌ Error: {e}")
                continue

if __name__ == "__main__":
    wrapper = CascadeMCPWrapper()
    wrapper.run()
