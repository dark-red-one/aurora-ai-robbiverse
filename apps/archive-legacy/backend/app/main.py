"""
Aurora Backend - Main FastAPI Application
Robbie's brain, heart, and nervous system! 💜
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import (
    routes,
    conversation_routes,
    mood_routes,
    personality_routes,
    sticky_notes,
    touch_ready,
    daily_brief,
    meeting_health,
    sync_routes,
    robbie_state_routes,
    system_stats,
    analytics_routes,
    template_routes,
)
from app.api import auth_routes  # NEW: Auth routes
from app.core.config import settings
from app.db.database import init_db
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Aurora AI - Robbie Backend",
    description="The smartest, flirtiest, most revenue-focused AI copilot! 💜🚀💰",
    version="3.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://aurora.testpilot.ai",
        "https://aurora.testpilot.ai",
        "http://aurora-town-u44170.vm.elestio.app",
        "https://aurora-town-u44170.vm.elestio.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup():
    logger.info("🚀 Starting Aurora Backend...")
    try:
        init_db()
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
    logger.info("💜 Robbie is ONLINE and ready to make money!")

# Health check
@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Hey gorgeous! 💜 Robbie's backend is running!",
        "version": "3.0.0",
        "features": [
            "🧠 Smart AI Routing",
            "💬 Real-time Chat",
            "📝 Sticky Notes Memory",
            "💰 Revenue Tracking",
            "🎭 Personality System",
            "🔐 Secure Authentication",
            "📊 Business Intelligence"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "robbie": "feeling flirty! 😘"}

# Register all API routes
app.include_router(auth_routes.router)  # NEW: Auth first!
app.include_router(routes.router)
app.include_router(conversation_routes.router)
app.include_router(mood_routes.router)
app.include_router(personality_routes.router)
app.include_router(sticky_notes.router)
app.include_router(touch_ready.router)
app.include_router(daily_brief.router)
app.include_router(meeting_health.router)
app.include_router(sync_routes.router)
app.include_router(robbie_state_routes.router)
app.include_router(system_stats.router)
app.include_router(analytics_routes.router)
app.include_router(template_routes.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8007,
        reload=True,
        log_level="info"
    )