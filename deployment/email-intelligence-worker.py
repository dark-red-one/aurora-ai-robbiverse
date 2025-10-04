#!/usr/bin/env python3
"""
Email Intelligence Worker - Runs every 15 mins
Uses local Ollama to summarize and analyze emails
"""
import asyncio
import aiohttp
import os
import sys
sys.path.insert(0, '/Library/PostgreSQL/16/lib/python')
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta

async def analyze_recent_emails():
    """Analyze emails from last 15 minutes"""
    
    # Connect to local PostgreSQL
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        user="postgres",
        database="aurora_unified"
    )
    
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Get unanalyzed emails from last 15 mins
    cur.execute("""
        SELECT id, sender_name, sender_email, subject, snippet, date_sent
        FROM emails
        WHERE date_sent > NOW() - INTERVAL '15 minutes'
        AND ai_summary IS NULL
        ORDER BY date_sent DESC
        LIMIT 10
    """)
    
    emails = cur.fetchall()
    
    if not emails:
        print(f"[{datetime.now()}] No new emails to analyze")
        return
    
    print(f"[{datetime.now()}] Analyzing {len(emails)} emails...")
    
    # Use Business AI (port 11434) for analysis
    async with aiohttp.ClientSession() as session:
        for email in emails:
            prompt = f"""Analyze this email and provide:
1. Priority (high/medium/low)
2. Action needed (yes/no)
3. One-line summary

Email: From {email['sender_name']} <{email['sender_email']}>
Subject: {email['subject']}
Content: {email['snippet']}

Be concise."""

            try:
                async with session.post(
                    'http://localhost:11434/api/generate',
                    json={'model': 'llama3.1:8b', 'prompt': prompt, 'stream': False}
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        summary = data.get('response', '')
                        
                        # Update email with AI analysis
                        cur.execute("""
                            UPDATE emails 
                            SET ai_summary = %s,
                                ai_priority = CASE 
                                    WHEN %s ILIKE '%%high%%' THEN 'high'
                                    WHEN %s ILIKE '%%low%%' THEN 'low'
                                    ELSE 'medium'
                                END,
                                updated_at = NOW()
                            WHERE id = %s
                        """, (summary, summary, summary, email['id']))
                        
                        conn.commit()
                        print(f"   ✅ Analyzed: {email['subject'][:50]}")
            except Exception as e:
                print(f"   ❌ Error analyzing email: {e}")
    
    cur.close()
    conn.close()
    print(f"[{datetime.now()}] ✅ Email analysis complete")

if __name__ == "__main__":
    asyncio.run(analyze_recent_emails())
