#!/usr/bin/env python3
"""
Simulate real-time token usage for Robbie's animated chart
"""

import sqlite3
import time
import random
from datetime import datetime

DB_PATH = '/Users/allanperetz/aurora-ai-robbiverse/data/robbiebook.db'

def simulate_token_usage():
    """Simulate realistic token usage patterns"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Base token rate with realistic variations
    base_rate = 50
    session_id = f"session_{int(time.time())}"
    
    print("🚀 Starting token usage simulation...")
    print("📊 Robbie's animated chart will update every 30 seconds")
    
    try:
        while True:
            # Simulate realistic token usage patterns
            # Peak hours (9-11am, 2-4pm) have higher usage
            current_hour = datetime.now().hour
            if 9 <= current_hour <= 11 or 14 <= current_hour <= 16:
                # Peak hours: 60-80 tokens/min
                tokens_per_min = random.randint(60, 80)
            elif 12 <= current_hour <= 13:
                # Lunch break: lower usage
                tokens_per_min = random.randint(20, 35)
            elif 18 <= current_hour <= 22:
                # Evening work: moderate usage
                tokens_per_min = random.randint(40, 60)
            else:
                # Off hours: minimal usage
                tokens_per_min = random.randint(5, 25)
            
            # Add some random spikes for excitement
            if random.random() < 0.1:  # 10% chance of spike
                tokens_per_min = min(100, tokens_per_min + random.randint(20, 40))
            
            # Insert into database
            cursor.execute("""
                INSERT INTO token_usage (tokens_per_minute, total_tokens, session_id, personality_id)
                VALUES (?, ?, ?, 'robbie')
            """, (tokens_per_min, 0, session_id))
            
            conn.commit()
            
            print(f"📈 {datetime.now().strftime('%H:%M:%S')} - {tokens_per_min} tokens/min")
            
            # Wait 30 seconds before next update
            time.sleep(30)
            
    except KeyboardInterrupt:
        print("\n🛑 Token simulation stopped")
    finally:
        conn.close()

if __name__ == "__main__":
    simulate_token_usage()















