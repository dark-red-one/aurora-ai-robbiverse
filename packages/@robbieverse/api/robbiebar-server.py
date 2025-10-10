#!/usr/bin/env python3
"""
RobbieBar Standalone Server
============================
Lightweight FastAPI server serving ONLY robbiebar
Perfect for quick deployment on Vengeance, RobbieBook1, and Aurora Town
"""

import os
import logging
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import only robbiebar routes
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
    description="Code Command Center - System stats, git quick commands, personality state",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development
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
        "service": "robbiebar",
        "timestamp": datetime.now().isoformat()
    }

# Register robbiebar routes
app.include_router(robbiebar.router, tags=["robbiebar"])

# Mount static files for RobbieBar web interface
app.mount("/code", StaticFiles(directory="static/code", html=True), name="robbiebar-static")

# Mount avatar images for Cursor extension
# Try multiple possible locations
import os
avatar_path = None
possible_paths = [
    "/home/allan/robbie_workspace/combined/aurora-ai-robbiverse/infrastructure/robbie-avatar/expressions",
    "/Users/allanperetz/aurora-ai-robbiverse/infrastructure/robbie-avatar/expressions",
    "../../infrastructure/robbie-avatar/expressions"
]

for path in possible_paths:
    if os.path.exists(path):
        avatar_path = path
        logger.info(f"📸 Serving avatar images from: {path}")
        app.mount("/images", StaticFiles(directory=path), name="avatar-images")
        break

if not avatar_path:
    logger.warning("⚠️  Avatar images directory not found!")

# Mount web app static files
web_apps = ["work", "growth", "testpilot", "play"]
for app_name in web_apps:
    static_path = f"static/{app_name}"
    if os.path.exists(static_path):
        logger.info(f"🌐 Mounting /{app_name} from {static_path}")
        app.mount(f"/{app_name}", StaticFiles(directory=static_path, html=True), name=f"{app_name}-app")
    else:
        logger.warning(f"⚠️  Web app directory not found: {static_path}")

if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment
    host = os.getenv("API_HOST", "0.0.0.0")  # Listen on all interfaces
    port = int(os.getenv("API_PORT", "8000"))
    
    logger.info(f"🎯 Starting RobbieBar Server on {host}:{port}")
    logger.info(f"📊 API Docs: http://localhost:{port}/docs")
    logger.info(f"💻 RobbieBar UI: http://localhost:{port}/code")
    logger.info(f"🔥 Git repo: {robbiebar.GIT_REPO_PATH}")
    logger.info(f"🗄️  Database: {robbiebar.DATABASE_PATH}")
    
    uvicorn.run(
        "robbiebar-server:app",
        host=host,
        port=port,
        reload=True,  # For development
        log_level="info"
    )



