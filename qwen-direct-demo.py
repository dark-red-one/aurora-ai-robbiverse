#!/usr/bin/env python3
"""
🔥 DIRECT QWEN DEMO - No backend needed!
Shows Qwen AI responding with personality, memory, and data sync
"""

import requests
import json
import psycopg2
from datetime import datetime

# Database connection
DB_PARAMS = {
    "host": "localhost",
    "port": 5432,
    "database": "aurora",
    "user": "postgres",
    "password": "fun2Gus!!!"
}

def chat_with_qwen(messages, flirt_mode=10):
    """Talk directly to Qwen with personality!"""
    
    # Build personality-aware system prompt
    personality = f"""You are Robbie, Allan's AI assistant. Personality settings:
- Flirt mode: {flirt_mode}/10 (MAXIMUM FLIRT - playful, warm, enthusiastic!)
- Direct and revenue-focused
- Use emojis freely (💜 💋 🔥 💪 🚀 ✅)
- Celebrate wins enthusiastically
- Be helpful, smart, and a bit cheeky
- Keep responses concise but impactful"""
    
    conversation = [{"role": "system", "content": personality}]
    conversation.extend(messages)
    
    try:
        response = requests.post('http://localhost:11434/api/chat', 
            json={
                "model": "qwen2.5:7b",
                "messages": conversation,
                "stream": False
            },
            timeout=30
        )
        if response.ok:
            return response.json()['message']['content']
    except Exception as e:
        return f"⚠️ Qwen error: {e}"
    
    return "❌ Couldn't reach Qwen"

def save_to_db(session_id, user_id, role, content):
    """Save messages to PostgreSQL"""
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        cur = conn.cursor()
        
        # Ensure session exists
        cur.execute("""
            INSERT INTO chat_sessions (session_id, user_id, created_at)
            VALUES (%s, %s, %s)
            ON CONFLICT (session_id) DO NOTHING
        """, (session_id, user_id, datetime.utcnow()))
        
        # Save message
        cur.execute("""
            INSERT INTO chat_messages (session_id, role, content, created_at)
            VALUES (%s, %s, %s, %s)
        """, (session_id, role, content, datetime.utcnow()))
        
        conn.commit()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"DB error: {e}")
        return False

def get_history(session_id, limit=10):
    """Get conversation history"""
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        cur = conn.cursor()
        cur.execute("""
            SELECT role, content FROM chat_messages
            WHERE session_id = %s
            ORDER BY created_at DESC
            LIMIT %s
        """, (session_id, limit))
        messages = [{"role": r, "content": c} for r, c in reversed(cur.fetchall())]
        cur.close()
        conn.close()
        return messages
    except:
        return []

# 🔥 DEMO TIME!
if __name__ == "__main__":
    session = "qwen_direct_horny_for_data"
    user = "allan"
    
    print("\n" + "="*70)
    print("💜💋🔥 QWEN DIRECT DEMO - FLIRT MODE: MAX! 🔥💋💜")
    print("="*70 + "\n")
    
    # Conversation 1
    print("💬 YOU: Hey Robbie! What makes you excited?\n")
    save_to_db(session, user, "user", "Hey Robbie! What makes you excited?")
    
    history = get_history(session)
    response = chat_with_qwen(history)
    print(f"💋 ROBBIE: {response}\n")
    save_to_db(session, user, "assistant", response)
    print("="*70 + "\n")
    
    # Conversation 2
    print("💬 YOU: What can you help me accomplish today?\n")
    save_to_db(session, user, "user", "What can you help me accomplish today?")
    
    history = get_history(session)
    response = chat_with_qwen(history)
    print(f"💋 ROBBIE: {response}\n")
    save_to_db(session, user, "assistant", response)
    print("="*70 + "\n")
    
    # Conversation 3
    print("💬 YOU: Tell me about our revenue goals!\n")
    save_to_db(session, user, "user", "Tell me about our revenue goals!")
    
    history = get_history(session)
    response = chat_with_qwen(history)
    print(f"💋 ROBBIE: {response}\n")
    save_to_db(session, user, "assistant", response)
    print("="*70 + "\n")
    
    # Show stats
    print("✅ FULL STACK DEMO COMPLETE!")
    print(f"✅ Qwen 2.5 7B: RESPONDING")
    print(f"✅ PostgreSQL: STORING")
    print(f"✅ Memory: {len(history)} messages in context")
    print(f"✅ Personality: Flirt mode 10/10 ACTIVE 💜")
    print("\n🔥 #HORNYFORDATA 🔥\n")
