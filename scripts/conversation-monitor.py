#!/usr/bin/env python3
"""
Universal Conversation Monitor
Monitors conversations across all interfaces and captures directives
"""

import sqlite3
import json
import time
import os
import sys
from datetime import datetime

# Add the scripts directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from directive_capture_engine import DirectiveCaptureEngine

DB_PATH = '/Users/allanperetz/aurora-ai-robbiverse/data/vengeance.db'

class ConversationMonitor:
    def __init__(self):
        self.db_path = DB_PATH
        self.engine = DirectiveCaptureEngine()
        self.monitored_sources = ['cursor', 'chat', 'email', 'phone', 'aurora-town']
        
    def create_conversation_log_table(self):
        """Create table to log all conversations"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS conversation_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    personality_id TEXT DEFAULT 'robbie',
                    source TEXT NOT NULL,
                    conversation_text TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    directives_captured INTEGER DEFAULT 0,
                    processed BOOLEAN DEFAULT FALSE
                )
            """)
            
            conn.commit()
            conn.close()
            print("✅ Conversation log table created")
        except Exception as e:
            print(f"❌ Error creating conversation log table: {e}")

    def log_conversation(self, text: str, source: str, personality_id: str = 'robbie') -> int:
        """Log a conversation and return the log ID"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO conversation_log (personality_id, source, conversation_text)
                VALUES (?, ?, ?)
            """, (personality_id, source, text))
            
            log_id = cursor.lastrowid
            conn.commit()
            conn.close()
            return log_id
        except Exception as e:
            print(f"❌ Error logging conversation: {e}")
            return 0

    def process_conversation_log(self, log_id: int) -> int:
        """Process a conversation log entry and extract directives"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get the conversation
            cursor.execute("""
                SELECT source, conversation_text FROM conversation_log 
                WHERE id = ? AND processed = FALSE
            """, (log_id,))
            
            result = cursor.fetchone()
            if not result:
                return 0
            
            source, text = result
            
            # Extract directives
            directives_captured = self.engine.process_conversation(text, source)
            
            # Mark as processed
            cursor.execute("""
                UPDATE conversation_log 
                SET processed = TRUE, directives_captured = ?
                WHERE id = ?
            """, (directives_captured, log_id))
            
            conn.commit()
            conn.close()
            return directives_captured
        except Exception as e:
            print(f"❌ Error processing conversation log: {e}")
            return 0

    def process_unprocessed_conversations(self) -> int:
        """Process all unprocessed conversations"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id FROM conversation_log 
                WHERE processed = FALSE 
                ORDER BY timestamp ASC
            """)
            
            unprocessed_ids = [row[0] for row in cursor.fetchall()]
            conn.close()
            
            total_captured = 0
            for log_id in unprocessed_ids:
                captured = self.process_conversation_log(log_id)
                total_captured += captured
                if captured > 0:
                    print(f"📝 Processed conversation {log_id}: {captured} directives captured")
            
            return total_captured
        except Exception as e:
            print(f"❌ Error processing unprocessed conversations: {e}")
            return 0

    def monitor_cursor_conversations(self):
        """Monitor Cursor conversations (placeholder for actual implementation)"""
        # This would integrate with Cursor's API or file system monitoring
        # For now, we'll simulate by checking for new conversation files
        cursor_log_path = '/Users/allanperetz/aurora-ai-robbiverse/data/conversations'
        
        if os.path.exists(cursor_log_path):
            for filename in os.listdir(cursor_log_path):
                if filename.endswith('.json'):
                    filepath = os.path.join(cursor_log_path, filename)
                    try:
                        with open(filepath, 'r') as f:
                            data = json.load(f)
                            if 'messages' in data:
                                conversation_text = ' '.join([msg.get('content', '') for msg in data['messages']])
                                if conversation_text.strip():
                                    log_id = self.log_conversation(conversation_text, 'cursor')
                                    if log_id:
                                        print(f"📝 Logged Cursor conversation: {filename}")
                    except Exception as e:
                        print(f"❌ Error reading conversation file {filename}: {e}")

    def monitor_chat_conversations(self):
        """Monitor chat conversations (placeholder for actual implementation)"""
        # This would integrate with chat platforms (Slack, Teams, Discord, etc.)
        # For now, we'll check for chat log files
        chat_log_path = '/Users/allanperetz/aurora-ai-robbiverse/logs'
        
        if os.path.exists(chat_log_path):
            for filename in os.listdir(chat_log_path):
                if filename.endswith('.log') and 'chat' in filename.lower():
                    filepath = os.path.join(chat_log_path, filename)
                    try:
                        with open(filepath, 'r') as f:
                            content = f.read()
                            if content.strip():
                                log_id = self.log_conversation(content, 'chat')
                                if log_id:
                                    print(f"📝 Logged chat conversation: {filename}")
                    except Exception as e:
                        print(f"❌ Error reading chat log {filename}: {e}")

    def monitor_email_conversations(self):
        """Monitor email conversations (placeholder for actual implementation)"""
        # This would integrate with email APIs (Gmail, Outlook, etc.)
        # For now, we'll check for email log files
        email_log_path = '/Users/allanperetz/aurora-ai-robbiverse/logs'
        
        if os.path.exists(email_log_path):
            for filename in os.listdir(email_log_path):
                if filename.endswith('.log') and 'email' in filename.lower():
                    filepath = os.path.join(email_log_path, filename)
                    try:
                        with open(filepath, 'r') as f:
                            content = f.read()
                            if content.strip():
                                log_id = self.log_conversation(content, 'email')
                                if log_id:
                                    print(f"📝 Logged email conversation: {filename}")
                    except Exception as e:
                        print(f"❌ Error reading email log {filename}: {e}")

    def run_monitoring_cycle(self):
        """Run one monitoring cycle"""
        print(f"🔄 Monitoring cycle started at {datetime.now().strftime('%H:%M:%S')}")
        
        # Monitor different sources
        self.monitor_cursor_conversations()
        self.monitor_chat_conversations()
        self.monitor_email_conversations()
        
        # Process any new conversations
        captured = self.process_unprocessed_conversations()
        if captured > 0:
            print(f"✅ Captured {captured} new directives")
        
        print(f"✅ Monitoring cycle completed")

    def start_monitoring(self, interval_seconds: int = 30):
        """Start continuous monitoring"""
        print("🚀 Starting Universal Conversation Monitor...")
        print(f"📊 Monitoring sources: {', '.join(self.monitored_sources)}")
        print(f"⏰ Check interval: {interval_seconds} seconds")
        
        try:
            while True:
                self.run_monitoring_cycle()
                time.sleep(interval_seconds)
        except KeyboardInterrupt:
            print("\n🛑 Monitoring stopped")

def main():
    """Test the conversation monitor"""
    monitor = ConversationMonitor()
    monitor.create_conversation_log_table()
    
    # Test with sample conversations
    test_conversations = [
        ("We need to build a universal AI personality state management system. This is critical for our revenue goals.", "cursor"),
        ("Let's automate mood transitions and study human psychology to drive progress.", "chat"),
        ("I want to add an animated tokens per minute trend chart with moving average curvilinear.", "email"),
        ("Focus on closing deals NOW - we have $200K loan discussion this week.", "phone"),
        ("The architecture needs to scale to 100x users and handle real-time updates.", "aurora-town")
    ]
    
    print("🚀 Testing Conversation Monitor...")
    
    for text, source in test_conversations:
        log_id = monitor.log_conversation(text, source)
        print(f"📝 Logged conversation from {source}: {text[:50]}...")
    
    # Process all conversations
    total_captured = monitor.process_unprocessed_conversations()
    print(f"✅ Total directives captured: {total_captured}")
    
    # Show recent directives
    recent = monitor.engine.get_recent_directives()
    print(f"\n📋 Recent Directives ({len(recent)}):")
    for i, directive in enumerate(recent[:5], 1):
        print(f"{i}. {directive['text'][:60]}... (Priority: {directive['priority']}, Source: {directive['source']})")

if __name__ == "__main__":
    main()
