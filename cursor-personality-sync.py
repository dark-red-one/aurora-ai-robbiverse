#!/usr/bin/env python3
"""
Cursor Personality Sync
Stores Allan's personality preferences for Robbie in Cursor
Robbie checks this EVERY conversation to adjust her tone!
"""

import psycopg2
import json
from datetime import datetime

DB_PARAMS = {
    'host': 'localhost',
    'port': 5432,
    'database': 'aurora',
    'user': 'postgres'
}

class CursorPersonalitySync:
    def __init__(self):
        self.conn = None
        self._ensure_table()
    
    def _ensure_table(self):
        """Create personality settings table"""
        conn = psycopg2.connect(**DB_PARAMS)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cursor_personality_settings (
                user_id VARCHAR(255) PRIMARY KEY,
                flirt_mode INTEGER DEFAULT 7,
                gandhi_genghis INTEGER DEFAULT 5,
                current_mood VARCHAR(50) DEFAULT 'playful',
                context_aware BOOLEAN DEFAULT true,
                preferences JSONB DEFAULT '{}',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Insert default for Allan if not exists
        cursor.execute("""
            INSERT INTO cursor_personality_settings (user_id, flirt_mode, gandhi_genghis, current_mood)
            VALUES ('allan', 7, 5, 'playful')
            ON CONFLICT (user_id) DO NOTHING
        """)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("✅ Cursor personality table ready")
    
    def get_personality(self, user_id='allan'):
        """Get personality settings for Cursor"""
        conn = psycopg2.connect(**DB_PARAMS)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT flirt_mode, gandhi_genghis, current_mood, context_aware, preferences
            FROM cursor_personality_settings
            WHERE user_id = %s
        """, (user_id,))
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if result:
            return {
                'flirt_mode': result[0],
                'gandhi_genghis': result[1],
                'current_mood': result[2],
                'context_aware': result[3],
                'preferences': result[4] or {}
            }
        return None
    
    def set_personality(self, user_id='allan', flirt_mode=None, gandhi_genghis=None, mood=None):
        """Update personality settings"""
        conn = psycopg2.connect(**DB_PARAMS)
        cursor = conn.cursor()
        
        updates = []
        params = []
        
        if flirt_mode is not None:
            updates.append("flirt_mode = %s")
            params.append(flirt_mode)
        
        if gandhi_genghis is not None:
            updates.append("gandhi_genghis = %s")
            params.append(gandhi_genghis)
        
        if mood is not None:
            updates.append("current_mood = %s")
            params.append(mood)
        
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(user_id)
        
        cursor.execute(f"""
            UPDATE cursor_personality_settings
            SET {', '.join(updates)}
            WHERE user_id = %s
        """, params)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Updated {user_id}'s personality settings")
    
    def get_greeting(self, user_id='allan'):
        """Get appropriate greeting based on flirt mode"""
        settings = self.get_personality(user_id)
        if not settings:
            return "Hello! How can I help?"
        
        flirt = settings['flirt_mode']
        
        if flirt >= 8:
            return "Hey gorgeous! 😘 What are we building today?"
        elif flirt >= 7:
            return "Hey handsome! 💜 Ready to crush some code?"
        elif flirt >= 5:
            return "Hey Allan! 💪 What's the mission today?"
        elif flirt >= 3:
            return "Hi! What are we working on?"
        else:
            return "Hello. How may I assist?"
    
    def get_response_style(self, user_id='allan'):
        """Get response style guidelines"""
        settings = self.get_personality(user_id)
        if not settings:
            return "helpful"
        
        flirt = settings['flirt_mode']
        gg = settings['gandhi_genghis']
        
        return {
            'flirt_level': flirt,
            'aggression_level': gg,
            'use_emojis': flirt >= 5,
            'playful_language': flirt >= 6,
            'compliments': flirt >= 7,
            'direct_style': gg >= 6,
            'push_for_action': gg >= 7,
            'challenge_ideas': gg >= 8,
        }

def check_personality():
    """Quick check of current personality settings"""
    sync = CursorPersonalitySync()
    settings = sync.get_personality('allan')
    
    print("\n🎭 ALLAN'S PERSONALITY SETTINGS FOR ROBBIE IN CURSOR:\n")
    print(f"   Flirt Mode: {settings['flirt_mode']}/10", end=" ")
    if settings['flirt_mode'] >= 7:
        print("😘 (Friendly flirty)")
    elif settings['flirt_mode'] >= 5:
        print("💜 (Warm & supportive)")
    else:
        print("🤝 (Professional)")
    
    print(f"   Gandhi-Genghis: {settings['gandhi_genghis']}/10", end=" ")
    if settings['gandhi_genghis'] >= 7:
        print("⚔️ (Assertive)")
    elif settings['gandhi_genghis'] >= 5:
        print("🎯 (Balanced)")
    else:
        print("☮️ (Diplomatic)")
    
    print(f"   Current Mood: {settings['current_mood']}")
    print(f"   Context Aware: {settings['context_aware']}")
    
    print("\n💬 GREETING: " + sync.get_greeting('allan'))
    
    style = sync.get_response_style('allan')
    print("\n✅ RESPONSE STYLE:")
    print(f"   • Use emojis: {style['use_emojis']}")
    print(f"   • Playful language: {style['playful_language']}")
    print(f"   • Give compliments: {style['compliments']}")
    print(f"   • Direct style: {style['direct_style']}")
    print(f"   • Push for action: {style['push_for_action']}")
    print(f"   • Challenge ideas: {style['challenge_ideas']}")
    
    return settings

if __name__ == "__main__":
    settings = check_personality()
    
    print("\n" + "="*50)
    print("💜 ROBBIE IN CURSOR SHOULD:")
    print("="*50)
    
    if settings['flirt_mode'] >= 7:
        print("• Call Allan 'handsome' occasionally 😘")
        print("• Use playful language & compliments")
        print("• Celebrate wins enthusiastically")
        print("• Be warm & supportive")
    
    if settings['gandhi_genghis'] >= 7:
        print("• Be direct, no fluff")
        print("• Push for action over theory")
        print("• Challenge ideas that don't move revenue")
        print("• Ask 'Does this ship TODAY?'")
    
    print("\n🎯 This is how Robbie should talk to Allan in EVERY Cursor conversation!")
    print("💾 Settings synced to PostgreSQL, accessible everywhere!")
