#!/usr/bin/env python3
"""
Simple Integration Demo - Shows live data connections without full database
"""
import asyncio
import json
import time
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Aurora Integration Demo", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data for demonstration
MOCK_GOOGLE_CALENDAR = [
    {
        "id": "cal_1",
        "summary": "Team Standup",
        "start": "2025-10-06T10:00:00Z",
        "end": "2025-10-06T10:30:00Z",
        "attendees": ["allan@testpilotcpg.com", "team@testpilotcpg.com"]
    },
    {
        "id": "cal_2", 
        "summary": "Client Call - Simply Good Foods",
        "start": "2025-10-06T14:00:00Z",
        "end": "2025-10-06T15:00:00Z",
        "attendees": ["allan@testpilotcpg.com", "client@simplygoodfoods.com"]
    }
]

MOCK_GOOGLE_TASKS = [
    {
        "id": "task_1",
        "title": "Follow up on Simply Good Foods deal",
        "status": "needsAction",
        "due": "2025-10-07T17:00:00Z",
        "notes": "Send pricing proposal"
    },
    {
        "id": "task_2",
        "title": "Prepare RobbieBlocks demo",
        "status": "completed",
        "due": "2025-10-06T12:00:00Z",
        "notes": "Show widget marketplace"
    }
]

MOCK_HUBSPOT_CONTACTS = [
    {
        "id": "contact_1",
        "firstname": "Sarah",
        "lastname": "Johnson",
        "email": "sarah@simplygoodfoods.com",
        "company": "Simply Good Foods",
        "deal_stage": "proposal",
        "deal_value": 12740
    },
    {
        "id": "contact_2",
        "firstname": "Mike",
        "lastname": "Chen",
        "email": "mike@techstartup.com", 
        "company": "TechStartup Inc",
        "deal_stage": "discovery",
        "deal_value": 25000
    }
]

MOCK_SLACK_MESSAGES = [
    {
        "id": "msg_1",
        "channel": "general",
        "user": "allan",
        "text": "Just closed the Simply Good Foods deal! 🎉",
        "timestamp": "2025-10-06T13:45:00Z"
    },
    {
        "id": "msg_2", 
        "channel": "deals",
        "user": "robbie",
        "text": "New lead: TechStartup Inc - $25K potential deal",
        "timestamp": "2025-10-06T14:20:00Z"
    }
]

@app.get("/")
async def root():
    return {
        "service": "Aurora Integration Demo",
        "status": "running",
        "integrations": ["google", "hubspot", "slack", "fireflies"],
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "integration-demo"}

@app.get("/api/google/calendar")
async def get_google_calendar():
    """Get Google Calendar events"""
    return {
        "status": "success",
        "source": "google_calendar",
        "data": MOCK_GOOGLE_CALENDAR,
        "count": len(MOCK_GOOGLE_CALENDAR)
    }

@app.get("/api/google/tasks")
async def get_google_tasks():
    """Get Google Tasks"""
    return {
        "status": "success", 
        "source": "google_tasks",
        "data": MOCK_GOOGLE_TASKS,
        "count": len(MOCK_GOOGLE_TASKS)
    }

@app.get("/api/hubspot/contacts")
async def get_hubspot_contacts():
    """Get HubSpot contacts"""
    return {
        "status": "success",
        "source": "hubspot_contacts", 
        "data": MOCK_HUBSPOT_CONTACTS,
        "count": len(MOCK_HUBSPOT_CONTACTS)
    }

@app.get("/api/slack/messages")
async def get_slack_messages():
    """Get Slack messages"""
    return {
        "status": "success",
        "source": "slack_messages",
        "data": MOCK_SLACK_MESSAGES,
        "count": len(MOCK_SLACK_MESSAGES)
    }

@app.get("/api/integrations/status")
async def get_integrations_status():
    """Get status of all integrations"""
    return {
        "google_workspace": {
            "status": "connected",
            "calendar_events": len(MOCK_GOOGLE_CALENDAR),
            "tasks": len(MOCK_GOOGLE_TASKS)
        },
        "hubspot": {
            "status": "connected", 
            "contacts": len(MOCK_HUBSPOT_CONTACTS),
            "deals": 2
        },
        "slack": {
            "status": "connected",
            "messages": len(MOCK_SLACK_MESSAGES),
            "channels": 2
        },
        "fireflies": {
            "status": "pending_credentials",
            "meetings": 0
        }
    }

@app.get("/api/dashboard/summary")
async def get_dashboard_summary():
    """Get integrated dashboard summary"""
    total_deal_value = sum(contact.get("deal_value", 0) for contact in MOCK_HUBSPOT_CONTACTS)
    
    return {
        "summary": {
            "total_contacts": len(MOCK_HUBSPOT_CONTACTS),
            "total_deal_value": total_deal_value,
            "upcoming_meetings": len([e for e in MOCK_GOOGLE_CALENDAR if e["start"] > datetime.now().isoformat()]),
            "pending_tasks": len([t for t in MOCK_GOOGLE_TASKS if t["status"] == "needsAction"]),
            "recent_messages": len(MOCK_SLACK_MESSAGES)
        },
        "integrations": {
            "google": "✅ Connected",
            "hubspot": "✅ Connected", 
            "slack": "✅ Connected",
            "fireflies": "⏳ Pending"
        },
        "last_updated": datetime.now().isoformat()
    }

if __name__ == "__main__":
    print("🚀 Starting Aurora Integration Demo...")
    print("📊 Mock data loaded for Google, HubSpot, Slack")
    print("🌐 API available at http://localhost:8015")
    print("📱 Dashboard: http://localhost:8015/api/dashboard/summary")
    
    uvicorn.run(app, host="0.0.0.0", port=8015)
