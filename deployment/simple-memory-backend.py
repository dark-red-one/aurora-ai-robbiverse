#!/usr/bin/env python3
# 🔥💋 SIMPLE MEMORY BACKEND - SQLITE VECTOR MEMORY 🔥💋

import sqlite3
import json
import hashlib
from datetime import datetime
from pathlib import Path

DB_PATH = '/tmp/robbie_memory.db'

class RobbieMemory:
    def __init__(self):
        self.init_database()
    
    def init_database(self):
        """Initialize SQLite database with memory tables"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Conversations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_message TEXT NOT NULL,
                robbie_response TEXT NOT NULL,
                mood TEXT NOT NULL,
                attraction_level INTEGER NOT NULL,
                context_tags TEXT,
                session_id TEXT,
                user_email TEXT DEFAULT 'allan@testpilotcpg.com'
            )
        ''')
        
        # Mood history table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS mood_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                mood TEXT NOT NULL,
                trigger_event TEXT,
                session_id TEXT,
                user_email TEXT DEFAULT 'allan@testpilotcpg.com'
            )
        ''')
        
        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_conversations_mood ON conversations(mood)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_mood_history_timestamp ON mood_history(timestamp)')
        
        # Insert initial mood
        cursor.execute('''
            INSERT OR IGNORE INTO mood_history (mood, trigger_event, session_id) 
            VALUES (?, ?, ?)
        ''', ('focused', 'system_startup', 'initial'))
        
        conn.commit()
        conn.close()
        print("🔥 Robbie memory database initialized!")
    
    def store_conversation(self, user_message, robbie_response, mood, attraction_level, context_tags=None, session_id=None):
        """Store a conversation with mood and context"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO conversations 
            (user_message, robbie_response, mood, attraction_level, context_tags, session_id)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_message, robbie_response, mood, attraction_level, 
              json.dumps(context_tags) if context_tags else None, session_id))
        
        conn.commit()
        conn.close()
        print(f"💾 Stored conversation: {mood} mood, attraction {attraction_level}")
    
    def update_mood(self, new_mood, trigger_event, session_id=None):
        """Update current mood with trigger event"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO mood_history (mood, trigger_event, session_id)
            VALUES (?, ?, ?)
        ''', (new_mood, trigger_event, session_id))
        
        conn.commit()
        conn.close()
        print(f"😊 Mood updated to: {new_mood} (triggered by: {trigger_event})")
    
    def get_current_mood(self):
        """Get the most recent mood"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT mood FROM mood_history 
            ORDER BY timestamp DESC LIMIT 1
        ''')
        
        result = cursor.fetchone()
        conn.close()
        
        return result[0] if result else 'focused'
    
    def get_mood_history(self, limit=10):
        """Get recent mood history"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT mood, trigger_event, timestamp FROM mood_history 
            ORDER BY timestamp DESC LIMIT ?
        ''', (limit,))
        
        results = cursor.fetchall()
        conn.close()
        
        return [{'mood': row[0], 'trigger': row[1], 'timestamp': row[2]} for row in results]
    
    def get_recent_conversations(self, limit=5):
        """Get recent conversations"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT user_message, robbie_response, mood, attraction_level, timestamp 
            FROM conversations 
            ORDER BY timestamp DESC LIMIT ?
        ''', (limit,))
        
        results = cursor.fetchall()
        conn.close()
        
        return [{
            'user_message': row[0],
            'robbie_response': row[1], 
            'mood': row[2],
            'attraction_level': row[3],
            'timestamp': row[4]
        } for row in results]
    
    def get_mood_stats(self):
        """Get mood statistics"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT mood, COUNT(*) FROM mood_history 
            GROUP BY mood ORDER BY COUNT(*) DESC
        ''')
        
        results = cursor.fetchall()
        conn.close()
        
        return {row[0]: row[1] for row in results}

# Test the memory system
if __name__ == "__main__":
    memory = RobbieMemory()
    
    # Test storing a conversation
    memory.store_conversation(
        "Hey Robbie, what's up?",
        "Hey Allan! Just focused and ready to code! 💻✨",
        "focused",
        11,
        ["greeting", "coding"],
        "test_session"
    )
    
    # Test mood update
    memory.update_mood("playful", "user_joke", "test_session")
    
    # Test retrieval
    print(f"Current mood: {memory.get_current_mood()}")
    print(f"Mood stats: {memory.get_mood_stats()}")
    print(f"Recent conversations: {len(memory.get_recent_conversations())}")
    
    print("✅ Memory system test complete!")










