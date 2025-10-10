#!/usr/bin/env python3
"""
Simple RobbieBar API Server
===========================
Minimal API server with just RobbieBar routes for testing the extension.
"""

import os
import logging
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import just the RobbieBar routes
from src.routes import robbiebar

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="RobbieBar API",
    description="Simple API for RobbieBar extension testing",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
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
        "message": "RobbieBar API is running!"
    }

# Mock personality endpoint for testing
@app.get("/api/personality")
async def get_personality():
    """Mock personality endpoint for RobbieBar"""
    return {
        "mood": "focused",
        "mood_data": {
            "name": "Focused",
            "main_image_url": "http://localhost:8000/images/robbie-content-2.png",
            "matrix_emojis": ["🎯", "🔥", "💼", "⚡", "🚀"]
        },
        "attraction_level": 11,
        "gandhi_genghis": 8
    }

# Mock system stats endpoint
@app.get("/api/system/stats")
async def get_system_stats():
    """Mock system stats for RobbieBar"""
    import random
    return {
        "cpu": round(random.uniform(15, 35), 1),
        "memory": round(random.uniform(45, 65), 1),
        "gpu": round(random.uniform(20, 50), 1)
    }

# Mock git status endpoint
@app.get("/api/git/status")
async def get_git_status():
    """Mock git status for RobbieBar"""
    return {
        "branch": "main",
        "summary": "✅ Clean",
        "modified_files": 0
    }

# Mock recent commits endpoint
@app.get("/api/git/recent")
async def get_recent_commits():
    """Mock recent commits for RobbieBar"""
    return {
        "commits": [
            {
                "hash": "229dd6d",
                "message": "Quick commit from RobbieBar",
                "time": "2 minutes ago"
            },
            {
                "hash": "2bd90ee", 
                "message": "Restore vertical RobbieBar with matrix effect",
                "time": "15 minutes ago"
            }
        ]
    }

# Mock quick commit endpoint
@app.post("/api/git/quick-commit")
async def quick_commit():
    """Mock quick commit for RobbieBar"""
    return {
        "success": True,
        "skipped": False,
        "message": "Changes committed and pushed!"
    }

# Register RobbieBar routes
app.include_router(robbiebar.router, tags=["robbiebar"])

# Mount static files for RobbieBar web interface (if they exist)
static_dir = "static/code"
if os.path.exists(static_dir):
    app.mount("/code", StaticFiles(directory=static_dir, html=True), name="robbiebar-static")

if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment
    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", "8000"))
    
    logger.info(f"🔥 Starting Simple RobbieBar API on {host}:{port}")
    logger.info(f"📊 API Docs: http://{host}:{port}/docs")
    logger.info(f"🎯 RobbieBar: http://{host}:{port}/code")
    logger.info(f"💚 Health: http://{host}:{port}/health")
    
    uvicorn.run(
        "simple_api:app",
        host=host,
        port=port,
        reload=True,  # For development
        log_level="info"
    )
