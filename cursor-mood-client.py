#!/usr/bin/env python3
"""
Cursor Mood Client
Connects Cursor to universal Robbie mood system
Triggers mood events based on Cursor activity
"""

import asyncio
import websockets
import json
import requests
import time
from datetime import datetime

API_BASE = "http://localhost:8000/api"
WS_URL = "ws://localhost:8000/ws/mood"

class CursorMoodClient:
    def __init__(self):
        self.current_mood = None
        self.current_expression = None
        self.ws = None
        self.last_activity = datetime.now()
    
    async def connect(self):
        """Connect to mood WebSocket"""
        try:
            self.ws = await websockets.connect(WS_URL)
            print("✅ Connected to Robbie mood sync")
            
            # Listen for mood updates
            async for message in self.ws:
                data = json.loads(message)
                if data.get('type') == 'mood_update':
                    self.handle_mood_update(data['data'])
        except Exception as e:
            print(f"❌ Mood sync error: {e}")
            await asyncio.sleep(5)
            await self.connect()  # Reconnect
    
    def handle_mood_update(self, data):
        """Handle mood update from WebSocket"""
        self.current_mood = data.get('mood')
        self.current_expression = data.get('expression')
        
        print(f"🎭 Mood updated: {self.current_mood} / {self.current_expression}")
    
    def trigger_event(self, event_type: str):
        """Trigger mood event from Cursor"""
        try:
            response = requests.post(
                f"{API_BASE}/mood/trigger",
                json={"event_type": event_type, "user_id": "allan"}
            )
            if response.ok:
                print(f"✅ Triggered: {event_type}")
            return response.json()
        except Exception as e:
            print(f"❌ Failed to trigger {event_type}: {e}")
            return None
    
    def detect_cursor_activity(self):
        """Detect Cursor activity and trigger mood events"""
        # This would integrate with Cursor's API
        # For now, example triggers:
        
        # Long coding session?
        if self.coding_duration() > 1800:  # 30 min
            self.trigger_event('coding_focused_30min')
        
        # Late night?
        hour = datetime.now().hour
        if hour >= 22 or hour <= 5:
            self.trigger_event('late_night')
        
        # Git push?
        # (Would detect via Cursor API)
        
        # Build success?
        # (Would detect via terminal output)
    
    def coding_duration(self):
        """How long has Allan been coding?"""
        return (datetime.now() - self.last_activity).total_seconds()
    
    def get_current_mood(self):
        """Get current mood for Cursor UI"""
        return {
            "mood": self.current_mood or 'playful',
            "expression": self.current_expression or 'friendly'
        }

async def main():
    """Run Cursor mood client"""
    client = CursorMoodClient()
    
    print("🚀 Starting Cursor Mood Client...")
    print("   Connects to Robbie's universal mood system")
    print("   Triggers mood events based on Cursor activity")
    print("")
    
    # Connect to WebSocket
    await client.connect()

if __name__ == "__main__":
    asyncio.run(main())
