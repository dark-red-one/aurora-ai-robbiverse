#!/usr/bin/env python3
"""
Get Robbie's current mood from vengeance.db for terminal prompt
Returns emoji + mood name
"""
import sqlite3
import os
from pathlib import Path

MOOD_EMOJIS = {
    'friendly': '😊',
    'focused': '🎯',
    'playful': '😏',
    'bossy': '💪',
    'surprised': '😮',
    'blushing': '😘',
    'hyper': '🔥',
}

def get_robbie_mood():
    """Fetch Robbie's current mood from database"""
    try:
        # Try multiple possible database locations
        db_paths = [
            Path.home() / 'aurora-ai-robbiverse' / 'data' / 'vengeance.db',
            Path('/tmp/vengeance.db'),
            Path(os.environ.get('ROBBIE_DB', '')),
        ]
        
        db_path = None
        for path in db_paths:
            if path.exists():
                db_path = path
                break
        
        if not db_path:
            return "💭"  # Thinking emoji if DB not found
        
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT mood, attraction_level 
            FROM ai_personality_state 
            WHERE ai_name = 'Robbie' 
            LIMIT 1
        """)
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            mood, attraction = result
            emoji = MOOD_EMOJIS.get(mood.lower(), '🤖')
            return f"{emoji}"
        else:
            return "🤖"
            
    except Exception:
        return "🤖"  # Default robot emoji if anything fails

if __name__ == '__main__':
    print(get_robbie_mood(), end='')

