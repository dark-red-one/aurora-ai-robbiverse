#!/usr/bin/env python3
"""
Deal Health Monitor - Runs hourly
Analyzes deal momentum and flags issues
"""
import asyncio
import aiohttp
import os
import sys
sys.path.insert(0, '/Library/PostgreSQL/16/lib/python')
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta

async def monitor_deals():
    """Check health of active deals"""
    
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        user="postgres",
        database="aurora_unified"
    )
    
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Get active deals
    cur.execute("""
        SELECT d.id, d.name, d.amount, d.stage, d.close_date, d.updated_at,
               c.full_name as contact_name, comp.name as company_name
        FROM deals d
        LEFT JOIN contacts c ON d.contact_id = c.id
        LEFT JOIN companies comp ON d.company_id = comp.id
        WHERE d.stage NOT IN ('closed_won', 'closed_lost')
        ORDER BY d.close_date
        LIMIT 20
    """)
    
    deals = cur.fetchall()
    
    if not deals:
        print(f"[{datetime.now()}] No active deals to monitor")
        return
    
    print(f"[{datetime.now()}] Monitoring {len(deals)} active deals...")
    
    # Analyze each deal with Business AI
    async with aiohttp.ClientSession() as session:
        for deal in deals:
            days_since_update = (datetime.now() - deal['updated_at']).days if deal['updated_at'] else 999
            
            prompt = f"""Analyze this deal health:

Deal: {deal['name']}
Company: {deal['company_name']}
Amount: ${deal['amount']}
Stage: {deal['stage']}
Close Date: {deal['close_date']}
Days Since Update: {days_since_update}

Provide:
1. Health score (1-10)
2. Risk factors
3. Suggested next action

Be direct and actionable."""

            try:
                async with session.post(
                    'http://localhost:11434/api/generate',
                    json={'model': 'llama3.1:8b', 'prompt': prompt, 'stream': False}
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        analysis = data.get('response', '')
                        
                        # Extract health score (simplified)
                        health_score = 5  # Default
                        if 'score' in analysis.lower():
                            import re
                            scores = re.findall(r'(\d+)/10', analysis)
                            if scores:
                                health_score = int(scores[0])
                        
                        # Update deal health
                        cur.execute("""
                            UPDATE deals 
                            SET deal_health_score = %s,
                                ai_analysis = %s,
                                updated_at = NOW()
                            WHERE id = %s
                        """, (health_score, analysis, deal['id']))
                        
                        conn.commit()
                        
                        status = "🔴" if health_score < 5 else "🟡" if health_score < 7 else "🟢"
                        print(f"   {status} {deal['name'][:40]} - Health: {health_score}/10")
            except Exception as e:
                print(f"   ❌ Error analyzing deal: {e}")
    
    cur.close()
    conn.close()
    print(f"[{datetime.now()}] ✅ Deal health analysis complete")

if __name__ == "__main__":
    asyncio.run(monitor_deals())
