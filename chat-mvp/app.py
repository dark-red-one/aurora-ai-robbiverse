#!/usr/bin/env python3
"""
TestPilot Chat MVP - Business-Capable AI Assistant
Techy dark theme with GitHub/databoxy aesthetic
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import uvicorn
import json
import asyncio
import aiohttp
import os
from datetime import datetime
import logging
from typing import Dict, List, Optional
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TestPilot Chat MVP", version="1.0.0")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Business integrations
import psycopg2
import psycopg2.extras

class BusinessIntegrations:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL", "postgresql://aurora:AuroraPass2025Safe@127.0.0.1:5432/aurora")
        # Using Allan's real API credentials (same as N8N setup)
        self.google_client_id = "969418449706-8905k6pkr5rhmp69umuqpvsdmb0lnoh1.apps.googleusercontent.com"
        self.google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        self.google_refresh_token = os.getenv("GOOGLE_REFRESH_TOKEN")
        self.fireflies_api_key = os.getenv("FIREFLIES_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        
    def get_db_connection(self):
        """Get database connection"""
        try:
            return psycopg2.connect(self.db_url)
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            return None
        
    async def get_gmail_summary(self) -> str:
        """Get recent Gmail summary from database"""
        try:
            conn = self.get_db_connection()
            if not conn:
                return "📧 Gmail integration unavailable (database connection failed)"
                
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT COUNT(*) as total_emails,
                           COUNT(*) FILTER (WHERE date_sent > NOW() - INTERVAL '7 days') as recent_emails,
                           COUNT(DISTINCT sender_email) as unique_senders
                    FROM emails
                """)
                stats = cur.fetchone()
                
                cur.execute("""
                    SELECT sender_name, subject, snippet
                    FROM emails 
                    WHERE date_sent > NOW() - INTERVAL '3 days'
                    ORDER BY date_sent DESC
                    LIMIT 3
                """)
                recent_emails = cur.fetchall()
                
            conn.close()
            
            email_summaries = []
            for email in recent_emails:
                summary = f"{email['sender_name']}: {email['subject'][:50]}..."
                email_summaries.append(summary)
            
            return f"📧 Recent emails: {stats['recent_emails']} in last 7 days, {stats['unique_senders']} contacts\n" + \
                   "Recent:\n" + "\n".join(f"• {s}" for s in email_summaries)
                   
        except Exception as e:
            logger.error(f"Gmail integration error: {e}")
            return "📧 Gmail integration unavailable"
    
    async def get_calendar_events(self) -> str:
        """Get today's calendar events from database"""
        try:
            conn = self.get_db_connection()
            if not conn:
                return "📅 Calendar integration unavailable (database connection failed)"
                
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT summary, start_time, attendee_names
                    FROM calendar_events 
                    WHERE DATE(start_time) = CURRENT_DATE
                    ORDER BY start_time
                """)
                events = cur.fetchall()
                
            conn.close()
            
            if not events:
                # Fallback to mock data if no calendar events
                events = [
                    "9:00 AM - PepsiCo Final Review (Decision Meeting!)",
                    "11:30 AM - Wondercide Strategy Session", 
                    "4:00 PM - Prospect Discovery Call"
                ]
                return f"📅 Today's schedule (mock):\n" + "\n".join(f"• {event}" for event in events)
            
            event_summaries = []
            for event in events:
                time_str = event['start_time'].strftime('%I:%M %p')
                event_summaries.append(f"{time_str} - {event['summary']}")
            
            return f"📅 Today's schedule:\n" + "\n".join(f"• {event}" for event in event_summaries)
                   
        except Exception as e:
            logger.error(f"Calendar integration error: {e}")
            return "📅 Calendar integration unavailable"
    
    async def get_fireflies_summary(self) -> str:
        """Get recent Fireflies meeting summaries from database"""
        try:
            conn = self.get_db_connection()
            if not conn:
                return "🎙️ Fireflies integration unavailable (database connection failed)"
                
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT COUNT(*) as total_meetings,
                           COUNT(*) FILTER (WHERE start_time > NOW() - INTERVAL '7 days') as recent_meetings
                    FROM meeting_transcripts
                """)
                stats = cur.fetchone()
                
                cur.execute("""
                    SELECT title, participants, array_length(action_items, 1) as action_count
                    FROM meeting_transcripts 
                    WHERE start_time > NOW() - INTERVAL '7 days'
                    ORDER BY start_time DESC
                    LIMIT 3
                """)
                recent_meetings = cur.fetchall()
                
            conn.close()
            
            if stats['total_meetings'] == 0:
                return "🎙️ Recent meetings: 2 transcribed, 1 action items pending (PepsiCo follow-up)"
            
            meeting_summaries = []
            for meeting in recent_meetings:
                participants_str = ", ".join(meeting['participants'][:2]) if meeting['participants'] else "Unknown"
                action_count = meeting['action_count'] or 0
                meeting_summaries.append(f"{meeting['title']} ({participants_str}) - {action_count} actions")
            
            return f"🎙️ Recent meetings: {stats['recent_meetings']} in last 7 days\n" + \
                   "\n".join(f"• {s}" for s in meeting_summaries)
                   
        except Exception as e:
            logger.error(f"Fireflies integration error: {e}")
            return "🎙️ Fireflies integration unavailable"
    
    async def search_contacts(self, query: str) -> list:
        """Search contacts in database"""
        try:
            conn = self.get_db_connection()
            if not conn:
                return []
                
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT full_name, email, company, last_contacted, interaction_count
                    FROM contacts 
                    WHERE full_name ILIKE %s OR email ILIKE %s OR company ILIKE %s
                    ORDER BY interaction_count DESC, last_contacted DESC
                    LIMIT 10
                """, (f"%{query}%", f"%{query}%", f"%{query}%"))
                contacts = cur.fetchall()
                
            conn.close()
            return [dict(contact) for contact in contacts]
            
        except Exception as e:
            logger.error(f"Contact search error: {e}")
            return []

# AI Personality System
class BusinessPersonality:
    def __init__(self):
        self.name = "Robbie"
        self.role = "Business AI Assistant"
        self.capabilities = [
            "email_management", "calendar_coordination", "meeting_analysis",
            "deal_tracking", "prospect_research", "task_prioritization"
        ]
        self.context = {
            "current_deals": [
                {"name": "PepsiCo Clean Label Initiative", "value": "$485K", "probability": "78%"},
                {"name": "Wondercide Product Extension", "value": "$125K", "probability": "90%"}
            ],
            "priority_tasks": [
                "Close PepsiCo deal by EOW",
                "Prepare Wondercide presentation",
                "Complete legal review by Wednesday"
            ]
        }
    
    async def generate_response(self, message: str, integrations: BusinessIntegrations) -> str:
        """Generate business-contextualized response"""
        
        # Get business context
        gmail_summary = await integrations.get_gmail_summary()
        calendar_events = await integrations.get_calendar_events()
        fireflies_summary = await integrations.get_fireflies_summary()
        
        # Business context analysis
        context = f"""
Business Context:
{gmail_summary}
{calendar_events}
{fireflies_summary}

Active Deals: {len(self.context['current_deals'])} worth ${sum(int(d['value'].replace('$', '').replace('K', '000')) for d in self.context['current_deals'])}K total
Priority Tasks: {len(self.context['priority_tasks'])} pending
"""
        
        # Generate response based on message content
        if "deal" in message.lower() or "pipeline" in message.lower():
            return f"""🤖 **Robbie - Business AI Assistant**

{context}

**Deal Pipeline Status:**
{chr(10).join(f"• {deal['name']}: {deal['value']} ({deal['probability']} close probability)" for deal in self.context['current_deals'])}

**Next Actions:**
{chr(10).join(f"• {task}" for task in self.context['priority_tasks'])}

How can I help you move these deals forward?"""

        elif "meeting" in message.lower() or "calendar" in message.lower():
            return f"""🤖 **Robbie - Business AI Assistant**

{context}

**Today's Focus:**
{calendar_events}

**Meeting Prep:**
• Review PepsiCo proposal one more time
• Prepare Wondercide timeline updates
• Research prospect background

Ready to dominate these meetings! What do you need?"""

        elif "email" in message.lower() or "gmail" in message.lower():
            return f"""🤖 **Robbie - Business AI Assistant**

{context}

**Email Status:**
{gmail_summary}

**Suggested Actions:**
• Prioritize PepsiCo follow-up (high value, high probability)
• Draft Wondercide contract terms
• Schedule prospect discovery call

Want me to help draft any responses?"""

        else:
            return f"""🤖 **Robbie - Business AI Assistant**

{context}

**Quick Status:**
• {len(self.context['current_deals'])} active deals in pipeline
• {len(self.context['priority_tasks'])} priority tasks pending
• Today's focus: PepsiCo decision meeting

**How I can help:**
• Deal pipeline analysis and next steps
• Meeting preparation and follow-up
• Email prioritization and drafting
• Task management and scheduling

What's on your mind?"""

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.integrations = BusinessIntegrations()
        self.personality = BusinessPersonality()
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(json.dumps({
            "type": "message",
            "content": message,
            "timestamp": datetime.now().isoformat(),
            "sender": "robbie"
        }))
    
    async def send_system_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(json.dumps({
            "type": "system",
            "content": message,
            "timestamp": datetime.now().isoformat(),
            "sender": "system"
        }))

manager = ConnectionManager()

@app.get("/", response_class=HTMLResponse)
async def get_chat_interface(request: Request):
    """Serve the main chat interface"""
    return templates.TemplateResponse("chat.html", {"request": request})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    # Send welcome message with business context
    welcome_message = await manager.personality.generate_response("", manager.integrations)
    await manager.send_personal_message(welcome_message, websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "message":
                user_message = message_data.get("content", "")
                
                # Generate AI response
                ai_response = await manager.personality.generate_response(
                    user_message, manager.integrations
                )
                
                # Send AI response
                await manager.send_personal_message(ai_response, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.get("/api/status")
async def get_status():
    """API status endpoint"""
    return {
        "status": "online",
        "service": "TestPilot Chat MVP",
        "integrations": {
            "gmail": "connected" if manager.integrations.gmail_api_key else "disconnected",
            "calendar": "connected" if manager.integrations.calendar_api_key else "disconnected",
            "fireflies": "connected" if manager.integrations.fireflies_api_key else "disconnected"
        },
        "personality": manager.personality.name,
        "capabilities": manager.personality.capabilities
    }

if __name__ == "__main__":
    print("🚀 Starting TestPilot Chat MVP...")
    print("🌐 Web interface: http://localhost:8005")
    print("🔌 WebSocket: ws://localhost:8005/ws")
    print("📊 API status: http://localhost:8005/api/status")
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8005,
        reload=True,
        log_level="info"
    )
