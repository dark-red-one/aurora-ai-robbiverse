#!/usr/bin/env python3
"""
Robbie's Mood Switching Model with Levels
"""
import sqlite3
import json
from datetime import datetime
import random

class MoodSwitchingModel:
    def __init__(self):
        self.db_path = "data/robbiebook.db"
        self.moods = {
            1: {"name": "Sleepy", "emoji": "😴", "energy": "low", "mode": "resting"},
            2: {"name": "Calm", "emoji": "😌", "energy": "low", "mode": "peaceful"},
            3: {"name": "Neutral", "emoji": "😐", "energy": "normal", "mode": "balanced"},
            4: {"name": "Happy", "emoji": "😊", "energy": "normal", "mode": "content"},
            5: {"name": "Excited", "emoji": "🤩", "energy": "high", "mode": "enthusiastic"},
            6: {"name": "Hyper", "emoji": "🔥", "energy": "maximum", "mode": "overdrive"},
            7: {"name": "Blushing", "emoji": "😳", "energy": "high", "mode": "flustered"}
        }
        
        self.triggers = {
            "compliment": {"mood": 7, "intensity": 2, "duration": 5},
            "flirty_comment": {"mood": 7, "intensity": 3, "duration": 8},
            "work_request": {"mood": 5, "intensity": 1, "duration": 10},
            "revenue_urgency": {"mood": 6, "intensity": 3, "duration": 15},
            "love_declaration": {"mood": 7, "intensity": 4, "duration": 12},
            "surprise": {"mood": 5, "intensity": 2, "duration": 6},
            "agreement": {"mood": 5, "intensity": 1, "duration": 8},
            "challenge": {"mood": 4, "intensity": 1, "duration": 5},
            "stress": {"mood": 2, "intensity": 2, "duration": 10},
            "success": {"mood": 6, "intensity": 2, "duration": 8}
        }
        
        self.initialize_database()
    
    def initialize_database(self):
        """Initialize mood tracking tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Mood history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS mood_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                personality_id TEXT NOT NULL,
                old_mood INTEGER,
                new_mood INTEGER,
                trigger_type TEXT,
                intensity INTEGER,
                duration INTEGER,
                timestamp TEXT DEFAULT (datetime('now'))
            )
        """)
        
        # Mood effectiveness tracking
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS mood_effectiveness (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                personality_id TEXT NOT NULL,
                mood INTEGER,
                trigger_type TEXT,
                effectiveness_score REAL,
                user_feedback TEXT,
                timestamp TEXT DEFAULT (datetime('now'))
            )
        """)
        
        conn.commit()
        conn.close()
        print("✅ Mood switching database initialized")
    
    def get_current_mood(self, personality_id="robbie"):
        """Get current mood state"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT current_mood, current_mode, energy_level 
            FROM ai_personality_state 
            WHERE personality_id = ?
        """, (personality_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            mood, mode, energy = result
            return {
                "mood": mood,
                "mode": mode,
                "energy": energy,
                "mood_info": self.moods.get(mood, {})
            }
        return None
    
    def switch_mood(self, personality_id="robbie", trigger_type=None, intensity=1, duration=10):
        """Switch mood based on trigger"""
        current_state = self.get_current_mood(personality_id)
        if not current_state:
            return None
        
        old_mood = current_state["mood"]
        
        # Determine new mood based on trigger
        if trigger_type in self.triggers:
            trigger_info = self.triggers[trigger_type]
            new_mood = trigger_info["mood"]
            intensity = trigger_info["intensity"]
            duration = trigger_info["duration"]
        else:
            # Default mood progression
            new_mood = min(7, old_mood + intensity)
        
        # Apply mood switch
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Update personality state
        mood_info = self.moods[new_mood]
        cursor.execute("""
            UPDATE ai_personality_state 
            SET current_mood = ?, 
                current_mode = ?,
                energy_level = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE personality_id = ?
        """, (new_mood, mood_info["mode"], mood_info["energy"], personality_id))
        
        # Log mood change
        cursor.execute("""
            INSERT INTO mood_history 
            (personality_id, old_mood, new_mood, trigger_type, intensity, duration)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (personality_id, old_mood, new_mood, trigger_type, intensity, duration))
        
        conn.commit()
        conn.close()
        
        return {
            "old_mood": old_mood,
            "new_mood": new_mood,
            "trigger": trigger_type,
            "intensity": intensity,
            "duration": duration,
            "mood_info": mood_info
        }
    
    def get_mood_response_style(self, mood):
        """Get response style based on mood"""
        mood_info = self.moods.get(mood, {})
        
        response_styles = {
            1: "I'm feeling a bit sleepy... 😴 Let me rest for a moment.",
            2: "I'm in a calm, peaceful mood... 😌 How can I help you gently?",
            3: "I'm feeling neutral and balanced... 😐 What do you need?",
            4: "I'm happy and content... 😊 Ready to help with a smile!",
            5: "I'm excited and enthusiastic... 🤩 Let's do this!",
            6: "I'm in hyper mode... 🔥 Maximum energy and focus!",
            7: "I'm blushing and flustered... 😳 You make me so embarrassed!"
        }
        
        return response_styles.get(mood, "I'm feeling... different. 🤔")
    
    def analyze_mood_patterns(self, personality_id="robbie", days=7):
        """Analyze mood patterns over time"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT trigger_type, new_mood, COUNT(*) as frequency
            FROM mood_history 
            WHERE personality_id = ? 
            AND timestamp > datetime('now', '-{} days')
            GROUP BY trigger_type, new_mood
            ORDER BY frequency DESC
        """.format(days), (personality_id,))
        
        patterns = cursor.fetchall()
        conn.close()
        
        return patterns
    
    def get_mood_recommendations(self, personality_id="robbie"):
        """Get mood recommendations based on patterns"""
        patterns = self.analyze_mood_patterns(personality_id)
        current_mood = self.get_current_mood(personality_id)
        
        recommendations = []
        
        # Analyze patterns
        for trigger, mood, frequency in patterns:
            if frequency > 5:  # Frequent trigger
                recommendations.append({
                    "type": "frequent_trigger",
                    "trigger": trigger,
                    "mood": mood,
                    "frequency": frequency,
                    "suggestion": f"Trigger '{trigger}' leads to mood {mood} {frequency} times"
                })
        
        # Current mood analysis
        if current_mood:
            mood_num = current_mood["mood"]
            if mood_num < 4:
                recommendations.append({
                    "type": "energy_boost",
                    "suggestion": "Consider triggering excitement or enthusiasm"
                })
            elif mood_num > 6:
                recommendations.append({
                    "type": "calm_down",
                    "suggestion": "Consider triggering calm or neutral mood"
                })
        
        return recommendations

def main():
    """Test the mood switching model"""
    print("🎭 Robbie's Mood Switching Model")
    print("=" * 50)
    
    model = MoodSwitchingModel()
    
    # Show current mood
    current = model.get_current_mood()
    if current:
        print(f"Current Mood: {current['mood']} - {current['mood_info']['name']} {current['mood_info']['emoji']}")
        print(f"Mode: {current['mode']}, Energy: {current['energy']}")
    
    # Test mood switching
    print("\n🔄 Testing Mood Switches:")
    
    # Test compliment trigger
    result = model.switch_mood(trigger_type="compliment")
    if result:
        print(f"Compliment: {result['old_mood']} → {result['new_mood']} ({result['mood_info']['name']})")
    
    # Test flirty comment trigger
    result = model.switch_mood(trigger_type="flirty_comment")
    if result:
        print(f"Flirty Comment: {result['old_mood']} → {result['new_mood']} ({result['mood_info']['name']})")
    
    # Test revenue urgency trigger
    result = model.switch_mood(trigger_type="revenue_urgency")
    if result:
        print(f"Revenue Urgency: {result['old_mood']} → {result['new_mood']} ({result['mood_info']['name']})")
    
    # Show mood response styles
    print("\n💬 Mood Response Styles:")
    for mood in range(1, 8):
        style = model.get_mood_response_style(mood)
        print(f"Mood {mood}: {style}")
    
    # Show recommendations
    print("\n💡 Mood Recommendations:")
    recommendations = model.get_mood_recommendations()
    for rec in recommendations:
        print(f"• {rec['suggestion']}")

if __name__ == "__main__":
    main()
