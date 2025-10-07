"""
Aurora RobbieVerse - FastAPI Backend
Main application entry point with WebSocket support
"""
import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from datetime import datetime
import structlog
import uvicorn

from app.core.config import get_settings
from app.db.database import database, engine, metadata
from app.api.routes import api_router
from app.websockets.manager import ConnectionManager
from app.services.config_service import config_service

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# WebSocket connection manager
manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting Aurora RobbieVerse API")

    # Connect to database
    await database.connect()
    logger.info("Database connected")

    # Initialize configuration from environment variables
    await config_service.initialize_config()
    logger.info("Configuration initialized from environment variables")

    yield

    # Disconnect from database
    await database.disconnect()
    logger.info("Database disconnected")
    logger.info("Aurora RobbieVerse API shutdown")

# Create FastAPI app
app = FastAPI(
    title="Aurora RobbieVerse API",
    description="Production-ready AI system with dual LLM support",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Aurora RobbieVerse API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Test database connection
        await database.fetch_one("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        logger.error("Database health check failed", error=str(e))
    
    return {
        "status": "ok",
        "database": db_status,
        "timestamp": "2025-09-18T12:45:00Z"
    }

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time streaming chat"""
    await manager.connect(websocket, client_id)
    logger.info("WebSocket client connected", client_id=client_id)
    
    # Initialize Robbie AI
    from app.services.ai.robbie_ai import RobbieAI
    from app.services.ai.dual_llm_coordinator import DualLLMCoordinator
    
    robbie = RobbieAI()
    dual_llm = DualLLMCoordinator()
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            logger.info("Received WebSocket message", client_id=client_id, data=data[:100])
            
            try:
                import json
                message_data = json.loads(data)
                
                if message_data.get("type") == "message":
                    user_message = message_data.get("content", "")
                    personality = message_data.get("personality", {})
                    
                    logger.info("Processing chat message", user_id=client_id, message=user_message[:50])
                    
                    # Send acknowledgment
                    await websocket.send_json({
                        "type": "acknowledgment",
                        "message": "Message received",
                        "timestamp": datetime.now().isoformat()
                    })
                    
                    # Stream thinking process + response (Claude-style!)
                    async for chunk in robbie.stream_response(user_message, client_id, {"personality": personality}):
                        try:
                            chunk_data = json.loads(chunk)
                            await websocket.send_json(chunk_data)
                        except json.JSONDecodeError:
                            continue
                    
                    logger.info("Streaming complete", user_id=client_id)
                    
                elif message_data.get("type") == "personality_update":
                    # Handle personality slider updates
                    await websocket.send_json({
                        "type": "acknowledgment",
                        "message": "Personality updated",
                        "timestamp": datetime.now().isoformat()
                    })
                else:
                    # Echo for other message types
                    await websocket.send_json({
                        "type": "echo",
                        "content": data,
                        "timestamp": datetime.now().isoformat()
                    })
                    
            except json.JSONDecodeError:
                # Handle non-JSON messages
                await websocket.send_text(f"Echo: {data}")
            
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        logger.info("WebSocket client disconnected", client_id=client_id)
    except Exception as e:
        logger.error("WebSocket error", error=str(e), client_id=client_id)
        manager.disconnect(client_id)

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

# Add to main.py imports
# from backend.app.api.memory_chat import router as memory_chat_router

# Add to main.py app setup  
# app.include_router(memory_chat_router, prefix='/api')

