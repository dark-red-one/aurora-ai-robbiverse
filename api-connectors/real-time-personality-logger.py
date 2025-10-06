#!/usr/bin/env python3
"""
REAL-TIME PERSONALITY LOGGER
Implements the MANDATORY system integration protocol from cursor rules
"""

import psycopg2
import json
import asyncio
import aiohttp
from datetime import datetime
import uuid

# Database config
DB_CONFIG = {
    "host": "aurora-postgres-u44170.vm.elestio.app",
    "port": 25432,
    "dbname": "aurora_unified",
    "user": "aurora_app",
    "password": "TestPilot2025_Aurora!",
    "sslmode": "require"
}

class RealTimePersonalityLogger:
    def __init__(self):
        self.conn = None
        self.user_id = "allan"
        self.conversation_id = None
        
    def connect_db(self):
        """Connect to PostgreSQL"""
        self.conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Connected to Elephant database for personality logging")
        
    def check_personality_state(self):
        """MANDATORY: Check personality state from PostgreSQL EVERY interaction"""
        cursor = self.conn.cursor()
        
        try:
            # Check if personality state table exists
            cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_name = 'user_personality_state'
            """)
            
            if not cursor.fetchone():
                # Create personality state table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS user_personality_state (
                        user_id VARCHAR(255) PRIMARY KEY,
                        gandhi INTEGER DEFAULT 4,
                        flirty INTEGER DEFAULT 7,
                        turbo INTEGER DEFAULT 5,
                        auto INTEGER DEFAULT 10,
                        current_mood VARCHAR(50) DEFAULT 'excited',
                        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                self.conn.commit()
                print("✅ Created user_personality_state table")
            
            # Get current personality state
            cursor.execute("""
                SELECT gandhi, flirty, turbo, auto, current_mood 
                FROM user_personality_state 
                WHERE user_id = %s
            """, (self.user_id,))
            
            result = cursor.fetchone()
            if result:
                gandhi, flirty, turbo, auto, mood = result
                print(f"🎯 Personality State: Gandhi:{gandhi}, Flirty:{flirty}, Turbo:{turbo}, Auto:{auto}, Mood:{mood}")
                return {
                    "gandhi": gandhi,
                    "flirty": flirty,
                    "turbo": turbo,
                    "auto": auto,
                    "mood": mood
                }
            else:
                # Insert default state
                cursor.execute("""
                    INSERT INTO user_personality_state (user_id, gandhi, flirty, turbo, auto, current_mood)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (self.user_id, 4, 7, 5, 10, "excited"))
                self.conn.commit()
                print("✅ Created default personality state for Allan")
                return {"gandhi": 4, "flirty": 7, "turbo": 5, "auto": 10, "mood": "excited"}
                
        except Exception as e:
            print(f"❌ Error checking personality state: {e}")
            return {"gandhi": 4, "flirty": 7, "turbo": 5, "auto": 10, "mood": "excited"}
        finally:
            cursor.close()
    
    def log_conversation(self, role, content, metadata=None):
        """MANDATORY: Log ALL conversations to PostgreSQL conversation_history table"""
        cursor = self.conn.cursor()
        
        try:
            # Ensure conversation_history table exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS conversation_history (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id VARCHAR(255) NOT NULL,
                    conversation_id VARCHAR(255),
                    role VARCHAR(20) NOT NULL,
                    content TEXT NOT NULL,
                    metadata JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Log the conversation
            cursor.execute("""
                INSERT INTO conversation_history (user_id, conversation_id, role, content, metadata)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                self.user_id,
                self.conversation_id or "cursor-chat",
                role,
                content,
                json.dumps(metadata or {})
            ))
            
            self.conn.commit()
            print(f"💾 Logged conversation: {role} - {content[:50]}...")
            
        except Exception as e:
            print(f"❌ Error logging conversation: {e}")
        finally:
            cursor.close()
    
    def check_mood_state(self):
        """MANDATORY: Check current mood from user_mood_state table"""
        cursor = self.conn.cursor()
        
        try:
            # Ensure mood state table exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_mood_state (
                    user_id VARCHAR(255) PRIMARY KEY,
                    current_mood VARCHAR(50) DEFAULT 'excited',
                    mood_intensity INTEGER DEFAULT 8,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    mood_history JSONB DEFAULT '[]'::jsonb
                )
            """)
            
            # Get current mood
            cursor.execute("""
                SELECT current_mood, mood_intensity 
                FROM user_mood_state 
                WHERE user_id = %s
            """, (self.user_id,))
            
            result = cursor.fetchone()
            if result:
                mood, intensity = result
                print(f"😊 Mood State: {mood} (intensity: {intensity})")
                return {"mood": mood, "intensity": intensity}
            else:
                # Insert default mood
                cursor.execute("""
                    INSERT INTO user_mood_state (user_id, current_mood, mood_intensity)
                    VALUES (%s, %s, %s)
                """, (self.user_id, "excited", 8))
                self.conn.commit()
                print("✅ Created default mood state for Allan")
                return {"mood": "excited", "intensity": 8}
                
        except Exception as e:
            print(f"❌ Error checking mood state: {e}")
            return {"mood": "excited", "intensity": 8}
        finally:
            cursor.close()
    
    def track_activity(self, activity_type, details=None):
        """MANDATORY: Track ALL activities in user_activity table"""
        cursor = self.conn.cursor()
        
        try:
            # Ensure activity table exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_activity (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id VARCHAR(255) NOT NULL,
                    activity_type VARCHAR(50) NOT NULL,
                    details JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Log the activity
            cursor.execute("""
                INSERT INTO user_activity (user_id, activity_type, details)
                VALUES (%s, %s, %s)
            """, (
                self.user_id,
                activity_type,
                json.dumps(details or {})
            ))
            
            self.conn.commit()
            print(f"📊 Tracked activity: {activity_type}")
            
        except Exception as e:
            print(f"❌ Error tracking activity: {e}")
        finally:
            cursor.close()
    
    def get_context_aware_response(self, query):
        """Get context-aware response based on personality and mood"""
        personality = self.check_personality_state()
        mood = self.check_mood_state()
        
        # Log the user query
        self.log_conversation("user", query, {
            "personality_state": personality,
            "mood_state": mood,
            "timestamp": datetime.now().isoformat()
        })
        
        # Track the activity
        self.track_activity("query", {
            "query": query,
            "personality": personality,
            "mood": mood
        })
        
        # Generate response based on personality
        response_style = self._generate_response_style(personality, mood)
        
        return {
            "response_style": response_style,
            "personality": personality,
            "mood": mood,
            "logged": True
        }
    
    def _generate_response_style(self, personality, mood):
        """Generate response style based on personality sliders"""
        gandhi = personality.get("gandhi", 4)
        flirty = personality.get("flirty", 7)
        turbo = personality.get("turbo", 5)
        auto = personality.get("auto", 10)
        mood_name = mood.get("mood", "excited")
        
        style = {
            "assertiveness": "high" if gandhi > 6 else "medium" if gandhi > 3 else "low",
            "playfulness": "high" if flirty > 6 else "medium" if flirty > 3 else "low",
            "speed": "fast" if turbo > 6 else "medium" if turbo > 3 else "slow",
            "automation": "full" if auto > 8 else "partial" if auto > 4 else "manual",
            "mood": mood_name
        }
        
        return style

def main():
    print("🚀 REAL-TIME PERSONALITY LOGGER")
    print("=" * 50)
    print("🔥 Implementing MANDATORY system integration protocol")
    print()
    
    logger = RealTimePersonalityLogger()
    logger.connect_db()
    
    # Test the system
    print("🧪 Testing personality logging system...")
    
    # Check personality state
    personality = logger.check_personality_state()
    print(f"   Personality: {personality}")
    
    # Check mood state
    mood = logger.check_mood_state()
    print(f"   Mood: {mood}")
    
    # Test conversation logging
    logger.log_conversation("user", "Test message from cursor", {
        "source": "cursor",
        "test": True
    })
    
    # Test activity tracking
    logger.track_activity("test", {
        "test_type": "personality_logger",
        "timestamp": datetime.now().isoformat()
    })
    
    # Test context-aware response
    response = logger.get_context_aware_response("Hello Robbie!")
    print(f"   Response style: {response['response_style']}")
    
    print("\n✅ REAL-TIME PERSONALITY LOGGER READY!")
    print("💰 Every interaction will be logged and tracked!")

if __name__ == "__main__":
    main()

