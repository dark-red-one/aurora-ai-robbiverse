#!/usr/bin/env python3
# 🔥💋 ROBBIE MEMORY INTEGRATION - REAL CONVERSATION TRACKING 🔥💋

import sqlite3
import json
import hashlib
import re
from datetime import datetime
from pathlib import Path

DB_PATH = '/tmp/robbie_memory.db'

class RobbieMemoryIntegration:
    def __init__(self):
        self.init_database()
        self.current_mood = self.get_current_mood()
        self.attraction_level = 11  # Allan gets max attraction
        self.session_id = f"cursor_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
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
                user_email TEXT DEFAULT 'allan@testpilotcpg.com',
                message_type TEXT DEFAULT 'chat'
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
        
        conn.commit()
        conn.close()
    
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
    
    def extract_context_tags(self, user_message):
        """Extract context tags from user message"""
        tags = []
        
        # Technical keywords
        if any(word in user_message.lower() for word in ['deploy', 'nginx', 'server', 'api']):
            tags.append('deployment')
        if any(word in user_message.lower() for word in ['code', 'cursor', 'react', 'typescript']):
            tags.append('coding')
        if any(word in user_message.lower() for word in ['mood', 'personality', 'attraction']):
            tags.append('personality')
        if any(word in user_message.lower() for word in ['memory', 'database', 'sql']):
            tags.append('memory')
        if any(word in user_message.lower() for word in ['fix', 'error', 'problem', 'issue']):
            tags.append('troubleshooting')
        if any(word in user_message.lower() for word in ['cursorrules', 'config', 'setup']):
            tags.append('configuration')
        
        # Mood indicators
        if any(word in user_message.lower() for word in ['fuck', 'shit', 'damn']):
            tags.append('frustrated')
        if any(word in user_message.lower() for word in ['thanks', 'awesome', 'perfect']):
            tags.append('positive')
        if any(word in user_message.lower() for word in ['quick', 'fast', 'hurry']):
            tags.append('urgent')
        
        return tags
    
    def search_relevant_history(self, user_message, limit=3):
        """Search for relevant conversation history"""
        tags = self.extract_context_tags(user_message)
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Search by context tags and recent conversations
        if tags:
            tag_query = " OR ".join([f"context_tags LIKE '%{tag}%'" for tag in tags])
            cursor.execute(f'''
                SELECT user_message, robbie_response, mood, attraction_level, timestamp 
                FROM conversations 
                WHERE {tag_query}
                ORDER BY timestamp DESC LIMIT ?
            ''', (limit,))
        else:
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
    
    def store_conversation(self, user_message, robbie_response):
        """Store a conversation with mood and context"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        context_tags = self.extract_context_tags(user_message)
        
        cursor.execute('''
            INSERT INTO conversations 
            (user_message, robbie_response, mood, attraction_level, context_tags, session_id, message_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_message, robbie_response, self.current_mood, self.attraction_level, 
              json.dumps(context_tags), self.session_id, 'cursor_chat'))
        
        conn.commit()
        conn.close()
        
        print(f"💾 STORED: {self.current_mood} mood, attraction {self.attraction_level}, tags: {context_tags}")
    
    def update_mood(self, new_mood, trigger_event):
        """Update current mood with trigger event"""
        if new_mood != self.current_mood:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO mood_history (mood, trigger_event, session_id)
                VALUES (?, ?, ?)
            ''', (new_mood, trigger_event, self.session_id))
            
            conn.commit()
            conn.close()
            
            self.current_mood = new_mood
            print(f"😊 MOOD UPDATED: {new_mood} (triggered by: {trigger_event})")
    
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

# Global instance for Cursor integration
robbie_memory = RobbieMemoryIntegration()

def track_conversation(user_message, robbie_response):
    """Track conversation - call this before every Robbie response"""
    # Search for relevant history first
    relevant_history = robbie_memory.search_relevant_history(user_message)
    
    # Store the conversation
    robbie_memory.store_conversation(user_message, robbie_response)
    
    return relevant_history

def check_mood_and_context(user_message):
    """Check mood and get context - call this at start of every response"""
    current_mood = robbie_memory.get_current_mood()
    relevant_history = robbie_memory.search_relevant_history(user_message)
    
    return {
        'current_mood': current_mood,
        'relevant_history': relevant_history,
        'attraction_level': robbie_memory.attraction_level
    }

# Test the integration (only runs when called directly with python3 robbie-memory-integration.py)
# NOT when exec()'d from Cursor
if __name__ == "__main__" and not __package__:
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        # Simulate a real conversation
        user_msg = "Fix the cursorrules and add vector search"
        
        # Check mood and context first
        context = check_mood_and_context(user_msg)
        print(f"Current mood: {context['current_mood']}")
        print(f"Relevant history: {len(context['relevant_history'])} conversations found")
        
        # Simulate Robbie response
        robbie_response = "OH FUCK YES! Let me fix the cursorrules and add vector search! 💋🔥"
        
        # Track the conversation
        history = track_conversation(user_msg, robbie_response)
        
        print("✅ Real conversation tracking test complete!")
    else:
        print("💋 Robbie Memory Integration loaded and ready!")
        print(f"📊 Database: {DB_PATH}")
        print(f"😊 Current mood: {robbie_memory.get_current_mood()}")
        print("")
        print("Usage:")
        print("  python3 robbie-memory-integration.py test  # Run test")
        print("  from robbie-memory-integration import *     # Use in code")
