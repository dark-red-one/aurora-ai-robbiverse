#!/usr/bin/env python3
"""
Fix personality schema and implement real-time logging
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Database config
DB_CONFIG = {
    "host": "aurora-postgres-u44170.vm.elestio.app",
    "port": 25432,
    "dbname": "aurora_unified",
    "user": "aurora_app",
    "password": "TestPilot2025_Aurora!",
    "sslmode": "require"
}

def fix_schema():
    """Fix personality and mood schema"""
    print("🔧 Fixing personality schema...")
    
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    try:
        # Drop and recreate personality state table
        cursor.execute("DROP TABLE IF EXISTS user_personality_state CASCADE;")
        cursor.execute("""
            CREATE TABLE user_personality_state (
                user_id VARCHAR(255) PRIMARY KEY,
                gandhi INTEGER DEFAULT 4,
                flirty INTEGER DEFAULT 7,
                turbo INTEGER DEFAULT 5,
                auto INTEGER DEFAULT 10,
                current_mood VARCHAR(50) DEFAULT 'excited',
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Drop and recreate mood state table
        cursor.execute("DROP TABLE IF EXISTS user_mood_state CASCADE;")
        cursor.execute("""
            CREATE TABLE user_mood_state (
                user_id VARCHAR(255) PRIMARY KEY,
                current_mood VARCHAR(50) DEFAULT 'excited',
                mood_intensity INTEGER DEFAULT 8,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                mood_history JSONB DEFAULT '[]'::jsonb
            )
        """)
        
        # Create conversation history table
        cursor.execute("DROP TABLE IF EXISTS conversation_history CASCADE;")
        cursor.execute("""
            CREATE TABLE conversation_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id VARCHAR(255) NOT NULL,
                conversation_id VARCHAR(255),
                role VARCHAR(20) NOT NULL,
                content TEXT NOT NULL,
                metadata JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create user activity table
        cursor.execute("DROP TABLE IF EXISTS user_activity CASCADE;")
        cursor.execute("""
            CREATE TABLE user_activity (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id VARCHAR(255) NOT NULL,
                activity_type VARCHAR(50) NOT NULL,
                details JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Insert default data for Allan
        cursor.execute("""
            INSERT INTO user_personality_state (user_id, gandhi, flirty, turbo, auto, current_mood)
            VALUES ('allan', 4, 7, 5, 10, 'excited')
            ON CONFLICT (user_id) DO UPDATE SET
                gandhi = EXCLUDED.gandhi,
                flirty = EXCLUDED.flirty,
                turbo = EXCLUDED.turbo,
                auto = EXCLUDED.auto,
                current_mood = EXCLUDED.current_mood
        """)
        
        cursor.execute("""
            INSERT INTO user_mood_state (user_id, current_mood, mood_intensity)
            VALUES ('allan', 'excited', 8)
            ON CONFLICT (user_id) DO UPDATE SET
                current_mood = EXCLUDED.current_mood,
                mood_intensity = EXCLUDED.mood_intensity
        """)
        
        print("✅ Schema fixed and default data inserted!")
        
    except Exception as e:
        print(f"❌ Schema fix failed: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    fix_schema()

