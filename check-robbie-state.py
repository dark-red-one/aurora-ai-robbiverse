#!/usr/bin/env python3
"""
Quick check of Robbie's current state in the database
"""
import sqlite3
import json

DB_PATH = '/Users/allanperetz/aurora-ai-robbiverse/data/vengeance.db'

def check_robbie_state():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'ai_%';")
        tables = cursor.fetchall()
        print(f"📊 AI tables found: {[t[0] for t in tables]}")
        
        # Check Robbie's mood
        cursor.execute("SELECT current_mood FROM ai_personality_state WHERE personality_id = 'robbie';")
        mood_result = cursor.fetchone()
        if mood_result:
            print(f"😊 Robbie's current mood: {mood_result[0]}")
        else:
            print("❌ No mood data found for Robbie")
            
        # Check hot topics
        cursor.execute("SELECT content, priority FROM ai_working_memory WHERE personality_id = 'robbie' AND priority >= 7 ORDER BY priority DESC LIMIT 3;")
        topics = cursor.fetchall()
        print(f"🔥 Hot topics: {len(topics)} found")
        for topic in topics:
            print(f"  - {topic[0]} (priority: {topic[1]})")
            
        # Check commitments
        cursor.execute("SELECT commitment_text, deadline FROM ai_commitments WHERE personality_id = 'robbie' AND status = 'active' ORDER BY deadline LIMIT 3;")
        commitments = cursor.fetchall()
        print(f"📌 Active commitments: {len(commitments)} found")
        for commit in commitments:
            print(f"  - {commit[0]} (due: {commit[1]})")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    check_robbie_state()


























