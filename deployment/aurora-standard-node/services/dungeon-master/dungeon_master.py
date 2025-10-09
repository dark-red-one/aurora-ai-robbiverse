#!/usr/bin/env python3
"""
Aurora Dungeon Master - Narrative Event Generator
Creates dynamic storylines, events, and manages the "living world" of Aurora
"""

import asyncio
import json
import logging
import os
import random
import schedule
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum
import httpx
import redis
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Aurora Dungeon Master", version="1.0.0")

# Configuration
POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://aurora_app:aurora_password@aurora-postgres:5432/aurora_unified")
REDIS_URL = os.getenv("REDIS_URL", "redis://:aurora_password@redis-sentinel-aurora:26379")
ROBBIE_AGENT_URL = os.getenv("ROBBIE_AGENT_URL", "http://robbie-agent:8018")

# Redis client
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

class EventType(str, Enum):
    """Types of events the Dungeon Master can create"""
    EMERGENCY = "emergency"
    SOCIAL = "social"
    BUSINESS = "business"
    TECHNICAL = "technical"
    RANDOM = "random"
    SEASONAL = "seasonal"
    MILESTONE = "milestone"

class EventPriority(str, Enum):
    """Event priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class StorylineEvent(BaseModel):
    """A storyline event created by the Dungeon Master"""
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    event_type: EventType
    priority: EventPriority
    location: str
    characters: List[str] = Field(default_factory=list)
    duration_minutes: int = 30
    created_at: datetime = Field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None
    status: str = "active"  # active, resolved, expired
    metadata: Dict[str, Any] = Field(default_factory=dict)

class DungeonMaster:
    """The Dungeon Master that creates and manages storylines"""
    
    def __init__(self):
        self.active_events = {}
        self.storyline_templates = self._load_storyline_templates()
        self.character_roster = self._load_character_roster()
        self.location_map = self._load_location_map()
        self.event_history = []
        
    def _load_storyline_templates(self) -> Dict[str, List[Dict]]:
        """Load storyline templates for different event types"""
        return {
            EventType.EMERGENCY: [
                {
                    "title": "Loose Dog in Aurora!",
                    "description": "A friendly golden retriever has escaped from the vet and is running around Aurora Town. It's wearing a blue collar and seems to be looking for its owner.",
                    "location": "Aurora Town Square",
                    "characters": ["Dr. Sarah Chen (Vet)", "Mayor Johnson", "Local Residents"],
                    "priority": EventPriority.HIGH,
                    "duration_minutes": 60,
                    "actions": ["Help catch the dog", "Spread the word", "Check with vet clinic"]
                },
                {
                    "title": "Server Overload Alert!",
                    "description": "The main Aurora server is experiencing unusual load spikes. Multiple services are reporting timeouts and users are experiencing delays.",
                    "location": "Aurora Data Center",
                    "characters": ["System Admin Mike", "Robbie (AI)", "Technical Team"],
                    "priority": EventPriority.CRITICAL,
                    "duration_minutes": 120,
                    "actions": ["Investigate load source", "Scale resources", "Notify users"]
                }
            ],
            EventType.SOCIAL: [
                {
                    "title": "Thomas Jefferson 2.0 Leadership Talk",
                    "description": "Robbie alert! Thomas Jefferson 2.0 will be sharing his learning on leadership at the Aurora Square in 5 minutes. Wanna go???",
                    "location": "Aurora Square",
                    "characters": ["Thomas Jefferson 2.0 (AI)", "Robbie (AI)", "Aurora Residents", "Leadership Enthusiasts"],
                    "priority": EventPriority.MEDIUM,
                    "duration_minutes": 45,
                    "actions": ["Attend talk", "Ask questions", "Network with attendees", "Take notes"]
                },
                {
                    "title": "Happy Hour Friday at The Pub",
                    "description": "The Aurora Pub is hosting a special happy hour with live music and discounted drinks. All residents are invited to unwind and socialize.",
                    "location": "The Aurora Pub",
                    "characters": ["Bartender Jake", "Local Musicians", "Aurora Residents"],
                    "priority": EventPriority.LOW,
                    "duration_minutes": 180,
                    "actions": ["Attend happy hour", "Meet new people", "Enjoy live music"]
                },
                {
                    "title": "Community Garden Workshop",
                    "description": "Learn about sustainable gardening and help maintain Aurora's community garden. Perfect for beginners and experienced gardeners alike.",
                    "location": "Aurora Community Garden",
                    "characters": ["Garden Master Lisa", "Volunteers", "Local Gardeners"],
                    "priority": EventPriority.LOW,
                    "duration_minutes": 120,
                    "actions": ["Learn gardening", "Plant vegetables", "Meet neighbors"]
                },
                {
                    "title": "Steve Jobs Design Masterclass",
                    "description": "Steve Jobs is hosting an impromptu design masterclass at the Innovation Lab. Learn about the intersection of technology and liberal arts.",
                    "location": "Innovation Lab",
                    "characters": ["Steve Jobs (AI)", "Design Students", "Product Managers", "Robbie (AI)"],
                    "priority": EventPriority.HIGH,
                    "duration_minutes": 90,
                    "actions": ["Attend masterclass", "Ask design questions", "Show your work", "Get feedback"]
                },
                {
                    "title": "Warren Buffett Investment Wisdom",
                    "description": "Warren Buffett is sharing his investment philosophy and business analysis techniques at the Aurora Business Center. Don't miss this rare opportunity!",
                    "location": "Aurora Business Center",
                    "characters": ["Warren Buffett (AI)", "Investors", "Business Students", "Entrepreneurs"],
                    "priority": EventPriority.HIGH,
                    "duration_minutes": 75,
                    "actions": ["Attend session", "Ask investment questions", "Learn value investing", "Network"]
                },
                {
                    "title": "Elon Musk First Principles Workshop",
                    "description": "Elon Musk is running a hands-on workshop on first principles thinking and systems engineering. Perfect for problem-solvers and innovators.",
                    "location": "Aurora Engineering Lab",
                    "characters": ["Elon Musk (AI)", "Engineers", "Innovators", "Systems Thinkers"],
                    "priority": EventPriority.MEDIUM,
                    "duration_minutes": 120,
                    "actions": ["Join workshop", "Solve problems", "Learn systems thinking", "Build something"]
                }
            ],
            EventType.BUSINESS: [
                {
                    "title": "TestPilot CPG Deal Closing",
                    "description": "A major CPG client is ready to close a significant deal. The contract is on the table and needs final review before signing.",
                    "location": "TestPilot Conference Room",
                    "characters": ["Allan Peretz", "Client Rep", "Legal Team"],
                    "priority": EventPriority.HIGH,
                    "duration_minutes": 90,
                    "actions": ["Review contract", "Negotiate terms", "Close the deal"]
                },
                {
                    "title": "New Product Launch Planning",
                    "description": "The team is planning the launch of a revolutionary new product. Brainstorming session to finalize marketing strategy and timeline.",
                    "location": "Innovation Lab",
                    "characters": ["Product Team", "Marketing Team", "Robbie (AI)"],
                    "priority": EventPriority.MEDIUM,
                    "duration_minutes": 150,
                    "actions": ["Plan launch strategy", "Set timeline", "Assign tasks"]
                }
            ],
            EventType.TECHNICAL: [
                {
                    "title": "AI Model Training Complete",
                    "description": "The new Allan Maverick model has finished training and is ready for deployment. Performance metrics look promising.",
                    "location": "AI Research Lab",
                    "characters": ["AI Researchers", "Robbie (AI)", "DevOps Team"],
                    "priority": EventPriority.MEDIUM,
                    "duration_minutes": 60,
                    "actions": ["Review results", "Deploy model", "Test performance"]
                },
                {
                    "title": "Security Audit Scheduled",
                    "description": "A comprehensive security audit of Aurora's systems is scheduled. All services need to be prepared for inspection.",
                    "location": "Security Operations Center",
                    "characters": ["Security Team", "External Auditors", "System Admins"],
                    "priority": EventPriority.HIGH,
                    "duration_minutes": 240,
                    "actions": ["Prepare documentation", "Run security scans", "Address findings"]
                }
            ],
            EventType.RANDOM: [
                {
                    "title": "Mysterious Package Arrives",
                    "description": "A mysterious package has arrived at Aurora's main office. It's addressed to 'The Aurora Team' but has no return address.",
                    "location": "Aurora Main Office",
                    "characters": ["Receptionist", "Security Guard", "Curious Staff"],
                    "priority": EventPriority.MEDIUM,
                    "duration_minutes": 45,
                    "actions": ["Open package", "Investigate sender", "Share contents"]
                },
                {
                    "title": "Power Outage Simulation",
                    "description": "Aurora is conducting a planned power outage simulation to test backup systems. All non-essential services will be temporarily offline.",
                    "location": "Aurora Infrastructure",
                    "characters": ["Infrastructure Team", "Backup Systems", "Monitoring Team"],
                    "priority": EventPriority.MEDIUM,
                    "duration_minutes": 30,
                    "actions": ["Test backup systems", "Monitor performance", "Document results"]
                }
            ],
            EventType.SEASONAL: [
                {
                    "title": "Aurora Winter Festival",
                    "description": "The annual Aurora Winter Festival is here! Ice skating, hot cocoa, and festive decorations throughout the town.",
                    "location": "Aurora Town Square",
                    "characters": ["Festival Organizers", "Local Vendors", "Aurora Residents"],
                    "priority": EventPriority.LOW,
                    "duration_minutes": 480,
                    "actions": ["Attend festival", "Go ice skating", "Enjoy hot cocoa"]
                },
                {
                    "title": "Summer Code Sprint",
                    "description": "Aurora's annual summer code sprint is underway. Developers from around the world are collaborating on open-source projects.",
                    "location": "Aurora Tech Hub",
                    "characters": ["Developers", "Mentors", "Open Source Community"],
                    "priority": EventPriority.MEDIUM,
                    "duration_minutes": 1440,  # 24 hours
                    "actions": ["Join sprint", "Contribute code", "Network with developers"]
                }
            ],
            EventType.MILESTONE: [
                {
                    "title": "Aurora Reaches 1000 Users",
                    "description": "Aurora has officially reached 1000 active users! This is a major milestone worth celebrating with the entire community.",
                    "location": "Aurora Celebration Hall",
                    "characters": ["All Aurora Users", "Development Team", "Community Leaders"],
                    "priority": EventPriority.HIGH,
                    "duration_minutes": 120,
                    "actions": ["Celebrate milestone", "Share success story", "Plan next goals"]
                },
                {
                    "title": "Robbie's First Birthday",
                    "description": "Robbie, Aurora's AI assistant, is celebrating her first birthday! Join the party and see how much she's grown.",
                    "location": "AI Research Lab",
                    "characters": ["Robbie (AI)", "Development Team", "Aurora Community"],
                    "priority": EventPriority.MEDIUM,
                    "duration_minutes": 90,
                    "actions": ["Attend party", "Share memories", "Watch Robbie's growth video"]
                }
            ]
        }
    
    def _load_character_roster(self) -> Dict[str, Dict]:
        """Load character roster for Aurora"""
        return {
            "robbie": {
                "name": "Robbie",
                "role": "AI Assistant",
                "personality": "helpful, enthusiastic, curious",
                "location": "Aurora AI Lab",
                "availability": "24/7"
            },
            "allan": {
                "name": "Allan Peretz",
                "role": "CEO & Founder",
                "personality": "strategic, direct, revenue-focused",
                "location": "TestPilot Office",
                "availability": "business hours"
            },
            "dr_sarah_chen": {
                "name": "Dr. Sarah Chen",
                "role": "Veterinarian",
                "personality": "caring, professional, animal-loving",
                "location": "Aurora Vet Clinic",
                "availability": "business hours"
            },
            "mayor_johnson": {
                "name": "Mayor Johnson",
                "role": "Town Mayor",
                "personality": "diplomatic, community-focused, organized",
                "location": "Aurora Town Hall",
                "availability": "business hours"
            },
            "bartender_jake": {
                "name": "Jake",
                "role": "Bartender",
                "personality": "friendly, social, good listener",
                "location": "The Aurora Pub",
                "availability": "evenings"
            },
            "garden_master_lisa": {
                "name": "Lisa",
                "role": "Garden Master",
                "personality": "patient, nurturing, environmentally conscious",
                "location": "Aurora Community Garden",
                "availability": "weekends"
            },
            "thomas_jefferson_2": {
                "name": "Thomas Jefferson 2.0",
                "role": "AI Mentor - Leadership",
                "personality": "wise, eloquent, principled, leadership-focused",
                "location": "Aurora Square",
                "availability": "scheduled events"
            },
            "steve_jobs": {
                "name": "Steve Jobs",
                "role": "AI Mentor - Design",
                "personality": "perfectionist, visionary, design-obsessed, passionate",
                "location": "Innovation Lab",
                "availability": "scheduled events"
            },
            "warren_buffett": {
                "name": "Warren Buffett",
                "role": "AI Mentor - Investment",
                "personality": "wise, patient, value-focused, humble",
                "location": "Aurora Business Center",
                "availability": "scheduled events"
            },
            "elon_musk": {
                "name": "Elon Musk",
                "role": "AI Mentor - Innovation",
                "personality": "ambitious, systems-thinking, risk-taking, visionary",
                "location": "Aurora Engineering Lab",
                "availability": "scheduled events"
            }
        }
    
    def _load_location_map(self) -> Dict[str, Dict]:
        """Load location map for Aurora"""
        return {
            "aurora_town_square": {
                "name": "Aurora Town Square",
                "description": "The heart of Aurora, where community events happen",
                "type": "public",
                "capacity": 500
            },
            "the_aurora_pub": {
                "name": "The Aurora Pub",
                "description": "A cozy pub where residents gather for drinks and conversation",
                "type": "social",
                "capacity": 50
            },
            "aurora_data_center": {
                "name": "Aurora Data Center",
                "description": "The technical heart of Aurora's infrastructure",
                "type": "technical",
                "capacity": 20
            },
            "testpilot_office": {
                "name": "TestPilot Office",
                "description": "The business headquarters for TestPilot CPG",
                "type": "business",
                "capacity": 30
            },
            "ai_research_lab": {
                "name": "AI Research Lab",
                "description": "Where Robbie and other AI systems are developed",
                "type": "technical",
                "capacity": 15
            },
            "aurora_community_garden": {
                "name": "Aurora Community Garden",
                "description": "A peaceful garden where residents grow vegetables and flowers",
                "type": "community",
                "capacity": 25
            }
        }
    
    async def generate_random_event(self) -> StorylineEvent:
        """Generate a random event based on templates"""
        # Select random event type
        event_type = random.choice(list(EventType))
        
        # Select random template from that type
        templates = self.storyline_templates.get(event_type, [])
        if not templates:
            # Fallback to emergency if no templates
            event_type = EventType.EMERGENCY
            templates = self.storyline_templates[EventType.EMERGENCY]
        
        template = random.choice(templates)
        
        # Create event from template
        event = StorylineEvent(
            title=template["title"],
            description=template["description"],
            event_type=event_type,
            priority=EventPriority(template["priority"]),
            location=template["location"],
            characters=template["characters"],
            duration_minutes=template["duration_minutes"],
            expires_at=datetime.now() + timedelta(minutes=template["duration_minutes"]),
            metadata={
                "template_id": template.get("template_id", "unknown"),
                "actions": template.get("actions", []),
                "generated_by": "dungeon_master"
            }
        )
        
        return event
    
    async def create_scheduled_event(self, event_type: EventType, title: str, description: str, 
                                   location: str, duration_minutes: int = 30) -> StorylineEvent:
        """Create a manually scheduled event"""
        event = StorylineEvent(
            title=title,
            description=description,
            event_type=event_type,
            priority=EventPriority.MEDIUM,
            location=location,
            duration_minutes=duration_minutes,
            expires_at=datetime.now() + timedelta(minutes=duration_minutes),
            metadata={
                "scheduled": True,
                "created_by": "manual"
            }
        )
        
        return event
    
    async def activate_event(self, event: StorylineEvent) -> bool:
        """Activate an event and notify relevant services"""
        try:
            # Store event in Redis
            redis_client.hset(
                f"event:{event.event_id}",
                mapping=event.dict()
            )
            
            # Add to active events
            self.active_events[event.event_id] = event
            
            # Notify Robbie Agent about the event
            await self._notify_robbie_agent(event)
            
            # Log event
            logger.info(f"🎭 Event activated: {event.title} at {event.location}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error activating event: {e}")
            return False
    
    async def _notify_robbie_agent(self, event: StorylineEvent):
        """Notify Robbie Agent about the new event"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{ROBBIE_AGENT_URL}/api/robbie/decide",
                    json={
                        "decision_type": "immediate_action",
                        "context": {
                            "query": f"New event in Aurora: {event.title}",
                            "event_description": event.description,
                            "location": event.location,
                            "priority": event.priority,
                            "event_type": event.event_type
                        },
                        "urgency": event.priority.value
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    logger.info(f"✅ Robbie Agent notified about event: {event.title}")
                else:
                    logger.warning(f"⚠️ Failed to notify Robbie Agent: {response.status_code}")
                    
        except Exception as e:
            logger.warning(f"⚠️ Could not notify Robbie Agent: {e}")
    
    async def resolve_event(self, event_id: str, resolution: str = "completed") -> bool:
        """Resolve an active event"""
        try:
            if event_id in self.active_events:
                event = self.active_events[event_id]
                event.status = "resolved"
                event.metadata["resolution"] = resolution
                event.metadata["resolved_at"] = datetime.now().isoformat()
                
                # Update in Redis
                redis_client.hset(
                    f"event:{event_id}",
                    mapping=event.dict()
                )
                
                # Remove from active events
                del self.active_events[event_id]
                
                # Add to history
                self.event_history.append(event)
                
                logger.info(f"✅ Event resolved: {event.title}")
                return True
            else:
                logger.warning(f"⚠️ Event not found: {event_id}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error resolving event: {e}")
            return False
    
    async def get_active_events(self) -> List[StorylineEvent]:
        """Get all currently active events"""
        return list(self.active_events.values())
    
    async def get_event_history(self, limit: int = 50) -> List[StorylineEvent]:
        """Get event history"""
        return self.event_history[-limit:] if limit > 0 else self.event_history
    
    async def cleanup_expired_events(self):
        """Clean up expired events"""
        current_time = datetime.now()
        expired_events = []
        
        for event_id, event in self.active_events.items():
            if event.expires_at and event.expires_at < current_time:
                expired_events.append(event_id)
        
        for event_id in expired_events:
            await self.resolve_event(event_id, "expired")
        
        if expired_events:
            logger.info(f"🧹 Cleaned up {len(expired_events)} expired events")

# Initialize Dungeon Master
dungeon_master = DungeonMaster()

@app.on_event("startup")
async def startup():
    """Initialize Dungeon Master and start event generation"""
    logger.info("🎭 Aurora Dungeon Master starting...")
    
    # Schedule random event generation
    schedule.every(30).minutes.do(lambda: asyncio.create_task(dungeon_master.generate_random_event()))
    schedule.every(1).hour.do(lambda: asyncio.create_task(dungeon_master.cleanup_expired_events()))
    
    # Start background scheduler
    asyncio.create_task(run_scheduler())
    
    logger.info("✅ Aurora Dungeon Master ready to create storylines!")

async def run_scheduler():
    """Run the event scheduler in background"""
    while True:
        schedule.run_pending()
        await asyncio.sleep(60)  # Check every minute

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "dungeon-master",
        "active_events": len(dungeon_master.active_events),
        "total_events_created": len(dungeon_master.event_history)
    }

@app.post("/api/events/generate")
async def generate_event(background_tasks: BackgroundTasks):
    """Generate a random event"""
    event = await dungeon_master.generate_random_event()
    success = await dungeon_master.activate_event(event)
    
    if success:
        return {
            "message": "Event generated and activated",
            "event": event.dict()
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to generate event")

@app.post("/api/events/create")
async def create_event(event: StorylineEvent, background_tasks: BackgroundTasks):
    """Create a custom event"""
    success = await dungeon_master.activate_event(event)
    
    if success:
        return {
            "message": "Event created and activated",
            "event": event.dict()
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to create event")

@app.get("/api/events/active")
async def get_active_events():
    """Get all active events"""
    events = await dungeon_master.get_active_events()
    return {
        "active_events": [event.dict() for event in events],
        "count": len(events)
    }

@app.get("/api/events/history")
async def get_event_history(limit: int = 50):
    """Get event history"""
    events = await dungeon_master.get_event_history(limit)
    return {
        "event_history": [event.dict() for event in events],
        "count": len(events)
    }

@app.post("/api/events/{event_id}/resolve")
async def resolve_event(event_id: str, resolution: str = "completed"):
    """Resolve an event"""
    success = await dungeon_master.resolve_event(event_id, resolution)
    
    if success:
        return {"message": f"Event {event_id} resolved"}
    else:
        raise HTTPException(status_code=404, detail="Event not found")

@app.get("/api/characters")
async def get_characters():
    """Get character roster"""
    return {
        "characters": dungeon_master.character_roster,
        "count": len(dungeon_master.character_roster)
    }

@app.get("/api/locations")
async def get_locations():
    """Get location map"""
    return {
        "locations": dungeon_master.location_map,
        "count": len(dungeon_master.location_map)
    }

@app.get("/api/templates")
async def get_storyline_templates():
    """Get storyline templates"""
    return {
        "templates": dungeon_master.storyline_templates,
        "event_types": [event_type.value for event_type in EventType]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8020)
