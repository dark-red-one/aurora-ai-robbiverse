#!/bin/bash
# UNLEASH THE M3 MAX BEAST MODE
# Multi-model Ollama + MLX + Background AI Workers

set -e

echo "🔥 UNLEASHING M3 MAX BEAST MODE"
echo "================================"
echo ""
echo "💪 Hardware: Apple M3 Max"
echo "🧠 RAM: 48 GB"
echo "⚡ Cores: 16 (12 performance + 4 efficiency)"
echo ""

# 1. Install MLX Framework
echo "📦 Installing MLX Framework (Apple Silicon optimized)..."
pip3 install --user mlx mlx-lm transformers huggingface_hub

echo "✅ MLX installed"

# 2. Install ChromaDB for local vector search
echo "📦 Installing ChromaDB for vector search..."
pip3 install --user chromadb

echo "✅ ChromaDB installed"

# 3. Create multi-model Ollama launcher
echo ""
echo "🤖 Creating multi-model Ollama setup..."

cat > /Users/allanperetz/aurora-ai-robbiverse/deployment/start-multi-ollama.sh << 'MULTIEOF'
#!/bin/bash
# Start multiple specialized Ollama models

echo "🚀 Starting Multi-Model Ollama Beast Mode..."
echo ""

# Check available RAM
AVAILABLE_RAM=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024)}')
echo "💾 Available RAM: ${AVAILABLE_RAM}GB"
echo ""

# Model 1: Business AI (always-on, port 11434)
echo "1️⃣ Starting Business AI (llama3.1:8b) on port 11434..."
if ! pgrep -f "ollama.*11434" > /dev/null; then
    OLLAMA_HOST=127.0.0.1:11434 ollama serve > /tmp/ollama-business.log 2>&1 &
    sleep 3
    ollama run llama3.1:8b --keepalive 24h > /dev/null 2>&1 &
    echo "   ✅ Business AI ready (5GB RAM)"
else
    echo "   ✅ Already running"
fi

# Model 2: Code Assistant (always-on, port 11435)
echo "2️⃣ Starting Code AI (codellama:13b) on port 11435..."
if ! pgrep -f "ollama.*11435" > /dev/null; then
    OLLAMA_HOST=127.0.0.1:11435 ollama serve > /tmp/ollama-code.log 2>&1 &
    sleep 3
    OLLAMA_HOST=127.0.0.1:11435 ollama run codellama:13b --keepalive 24h > /dev/null 2>&1 &
    echo "   ✅ Code AI ready (7.4GB RAM)"
else
    echo "   ✅ Already running"
fi

# Model 3: Power Mode (on-demand, port 11436)
if [ "$AVAILABLE_RAM" -gt 40 ]; then
    echo "3️⃣ Starting Power AI (qwen2.5:14b) on port 11436..."
    if ! pgrep -f "ollama.*11436" > /dev/null; then
        OLLAMA_HOST=127.0.0.1:11436 ollama serve > /tmp/ollama-power.log 2>&1 &
        sleep 3
        OLLAMA_HOST=127.0.0.1:11436 ollama run qwen2.5:14b --keepalive 2h > /dev/null 2>&1 &
        echo "   ✅ Power AI ready (9GB RAM)"
    else
        echo "   ✅ Already running"
    fi
else
    echo "3️⃣ Skipping Power AI (need more RAM)"
fi

echo ""
echo "🎯 Multi-Model Status:"
echo "   Business AI:  http://localhost:11434 (llama3.1:8b)"
echo "   Code AI:      http://localhost:11435 (codellama:13b)"
echo "   Power AI:     http://localhost:11436 (qwen2.5:14b)"
echo ""
echo "💡 Test with:"
echo "   curl http://localhost:11434/api/tags  # Business AI"
echo "   curl http://localhost:11435/api/tags  # Code AI"
echo "   curl http://localhost:11436/api/tags  # Power AI"
MULTIEOF

chmod +x /Users/allanperetz/aurora-ai-robbiverse/deployment/start-multi-ollama.sh

# 4. Create background email worker
echo ""
echo "📧 Creating email intelligence worker..."

cat > /Users/allanperetz/aurora-ai-robbiverse/deployment/email-intelligence-worker.py << 'EMAILEOF'
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
EMAILEOF

chmod +x /Users/allanperetz/aurora-ai-robbiverse/deployment/email-intelligence-worker.py

# 5. Create deal health monitor
echo ""
echo "💰 Creating deal health monitor..."

cat > /Users/allanperetz/aurora-ai-robbiverse/deployment/deal-health-monitor.py << 'DEALEOF'
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
DEALEOF

chmod +x /Users/allanperetz/aurora-ai-robbiverse/deployment/deal-health-monitor.py

echo ""
echo "✅ BEAST MODE SCRIPTS CREATED!"
echo ""
echo "🎯 Starting multi-model Ollama..."

# Start multi-model Ollama
./deployment/start-multi-ollama.sh

echo ""
echo "📊 Installing dependencies..."
pip3 install --user aiohttp psycopg2-binary > /dev/null 2>&1

echo ""
echo "✅ M3 MAX BEAST MODE ACTIVATED!"
echo ""
echo "🤖 Running Services:"
echo "   • Business AI:  http://localhost:11434 (llama3.1:8b)"
echo "   • Code AI:      http://localhost:11435 (codellama:13b)"  
echo "   • Power AI:     http://localhost:11436 (qwen2.5:14b)"
echo ""
echo "🔄 Background Workers:"
echo "   • Email Intelligence:  deployment/email-intelligence-worker.py"
echo "   • Deal Health Monitor: deployment/deal-health-monitor.py"
echo ""
echo "💡 Test your power:"
echo "   python3 deployment/email-intelligence-worker.py"
echo "   python3 deployment/deal-health-monitor.py"
echo ""

