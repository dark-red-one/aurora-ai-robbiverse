#!/usr/bin/env python3
"""
Demo: Universal AI State System
Shows how Robbie (or any personality) has ONE state across ALL interfaces
"""
import sqlite3
from datetime import datetime

def query_robbie_state():
    """Query Robbie's current state from network database"""
    conn = sqlite3.connect('data/vengeance.db')
    cursor = conn.cursor()
    
    print("=" * 80)
    print("🤖 ROBBIE'S UNIVERSAL STATE (Network-Wide)")
    print("=" * 80)
    print()
    
    # 1. Current mood/state
    cursor.execute("""
        SELECT name, current_mood, current_mode, energy_level, focus_state
        FROM ai_personalities_current_state
        WHERE id = 'robbie'
    """)
    state = cursor.fetchone()
    
    mood_names = {1: 'Sleepy', 2: 'Calm', 3: 'Content', 4: 'Professional', 
                  5: 'Enthusiastic', 6: 'Excited', 7: 'Hyper'}
    mood_emojis = {1: '😴', 2: '😌', 3: '😊', 4: '🤖', 5: '😄', 6: '🤩', 7: '🔥'}
    
    print(f"📊 CURRENT STATE:")
    print(f"   Name: {state[0]}")
    print(f"   Mood: {mood_emojis[state[1]]} {mood_names[state[1]]} (Level {state[1]})")
    print(f"   Mode: {state[2]}")
    print(f"   Energy: {state[3]}")
    print(f"   Focus: {state[4]}")
    print()
    
    # 2. Hot Topics (High Priority Memory)
    cursor.execute("""
        SELECT content, priority
        FROM ai_working_memory
        WHERE personality_id = 'robbie' AND priority >= 7
        ORDER BY priority DESC
        LIMIT 5
    """)
    hot_topics = cursor.fetchall()
    
    print("🔥 HOT TOPICS (Priority ≥ 7):")
    for i, (content, priority) in enumerate(hot_topics, 1):
        priority_emoji = '🚨' if priority >= 9 else '⚠️' if priority >= 8 else '📌'
        print(f"   {i}. {priority_emoji} [{priority}] {content}")
    print()
    
    # 3. Active Commitments
    cursor.execute("""
        SELECT commitment_text, deadline, priority
        FROM ai_commitments
        WHERE personality_id = 'robbie' AND status = 'active'
        ORDER BY deadline
    """)
    commitments = cursor.fetchall()
    
    print("📌 ACTIVE COMMITMENTS:")
    for i, (commitment, deadline, priority) in enumerate(commitments, 1):
        deadline_dt = datetime.fromisoformat(deadline)
        hours_until = (deadline_dt - datetime.now()).total_seconds() / 3600
        
        if hours_until < 0:
            status = "🚨 OVERDUE"
        elif hours_until < 24:
            status = f"⏰ {int(hours_until)}h away"
        else:
            status = f"📅 {int(hours_until/24)}d away"
        
        print(f"   {i}. [{priority}] {commitment}")
        print(f"       {status} - {deadline_dt.strftime('%Y-%m-%d %H:%M')}")
    print()
    
    # 4. Upcoming Calendar Events
    cursor.execute("""
        SELECT event_title, start_time, location, preparation_notes
        FROM ai_calendar_events
        WHERE start_time > datetime('now')
          AND start_time < datetime('now', '+24 hours')
        ORDER BY start_time
    """)
    events = cursor.fetchall()
    
    print("📅 UPCOMING EVENTS (Next 24h):")
    if events:
        for i, (title, start_time, location, prep) in enumerate(events, 1):
            start_dt = datetime.fromisoformat(start_time)
            minutes_until = (start_dt - datetime.now()).total_seconds() / 60
            
            if minutes_until < 60:
                time_str = f"⏰ {int(minutes_until)}min away"
            else:
                time_str = f"⏰ {int(minutes_until/60)}h away"
            
            print(f"   {i}. {title}")
            print(f"       {time_str} - {start_dt.strftime('%Y-%m-%d %H:%M')} - {location}")
            if prep:
                print(f"       📋 Prep: {prep}")
    else:
        print("   No events in next 24 hours")
    print()
    
    # 5. Interface Instances
    cursor.execute("""
        SELECT interface_type, COUNT(*) as count
        FROM ai_personality_instances
        WHERE personality_id = 'robbie' AND status = 'active'
        GROUP BY interface_type
    """)
    instances = cursor.fetchall()
    
    print("🌐 ACTIVE INSTANCES:")
    total_instances = 0
    for interface_type, count in instances:
        icon = {'cursor': '💻', 'chat': '💬', 'mobile': '📱', 'aurora-town': '🏠'}.get(interface_type, '🖥️')
        print(f"   {icon} {interface_type}: {count}")
        total_instances += count
    print(f"   Total: {total_instances} instances connected")
    print()
    
    print("=" * 80)
    print("✅ This state is IDENTICAL across ALL interfaces:")
    print("   - Cursor (coding)")
    print("   - Chat (web)")
    print("   - Mobile (phone)")
    print("   - Aurora-town (production)")
    print()
    print("🔄 Auto-syncs every 5 seconds via WebSocket + SQL")
    print("=" * 80)
    
    conn.close()

if __name__ == '__main__':
    query_robbie_state()







































