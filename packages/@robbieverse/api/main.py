"""
Robbieverse API - Main Entry Point
===================================
The unified backend powering all Robbie apps (TestPilot CPG, LeadershipQuotes, etc.)

Integrates:
- Priorities Engine (self-managing AI)
- Daily Brief System (3x daily summaries)
- AI Router (5-level fallback chain)
- Personality Manager (mood system)
- Touch Ready (outreach suggestions)
- Sticky Notes Learning (insight extraction)
- Google Workspace (Gmail, Calendar)
- WebSocket Chat (real-time)
"""

import os
import logging
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import routes
from src.routes import (
    conversation_routes,
    daily_brief,
    mood_routes,
    sticky_notes,
    touch_ready,
    sync_routes
)

# Import services for initialization
from src.services import (
    priorities_engine,
    ai_router,
    daily_brief as daily_brief_service
)

from src.ai import personality_manager
from src.websockets import manager as ws_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global service instances
services = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("🚀 Starting Robbieverse API...")
    
    try:
        # Initialize AI Router
        logger.info("🤖 Initializing AI Router (5-level fallback)...")
        services['ai_router'] = ai_router.AIRouterService()
        
        # Initialize Personality Manager
        logger.info("🎭 Initializing Personality Manager...")
        services['personality_manager'] = personality_manager.PersonalityManager()
        
        # Initialize Priorities Engine
        logger.info("🧠 Initializing Priorities Engine...")
        # Will be initialized when first needed (connects to DB)
        
        logger.info("✅ All services initialized!")
        
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Robbieverse API...")
    # Cleanup if needed

# Create FastAPI app
app = FastAPI(
    title="Robbieverse API",
    description="Unified backend for Allan's AI Empire - TestPilot CPG First!",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "https://app.testpilotcpg.com",  # Production
        "https://leadershipquotes.com",  # Future
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "ai_router": services.get('ai_router') is not None,
            "personality_manager": services.get('personality_manager') is not None,
        }
    }

# Register all routes
app.include_router(conversation_routes.router, prefix="/api", tags=["chat"])
app.include_router(daily_brief.router, prefix="/api", tags=["briefs"])
app.include_router(mood_routes.router, prefix="/api", tags=["personality"])
app.include_router(sticky_notes.router, prefix="/api", tags=["memory"])
app.include_router(touch_ready.router, prefix="/api", tags=["outreach"])
app.include_router(sync_routes, prefix="/api/sync", tags=["sync"])

# WebSocket endpoint for real-time chat
@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """Real-time chat via WebSocket"""
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Handle chat messages
            response = await handle_chat_message(data)
            await websocket.send_json(response)
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)

async def handle_chat_message(data: dict) -> dict:
    """Handle incoming chat message"""
    # Will use AI router and personality manager
    message = data.get("message", "")
    
    # Get response from AI
    ai_router_service = services.get('ai_router')
    if ai_router_service:
        response = await ai_router_service.get_response(message)
        return {"response": response, "status": "success"}
    
    return {"response": "Service not initialized", "status": "error"}

if __name__ == "__main__":
    import uvicorn
    from datetime import datetime
    
    # Get configuration from environment
    host = os.getenv("API_HOST", "127.0.0.1")  # localhost by default!
    port = int(os.getenv("API_PORT", "8000"))
    
    logger.info(f"🔥 Starting Robbieverse API on {host}:{port}")
    logger.info(f"📊 API Docs: http://{host}:{port}/docs")
    logger.info(f"💬 WebSocket: ws://{host}:{port}/ws/chat")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,  # For development
        log_level="info"
    )

