"""
Universal Input API - Standalone Server
========================================
Run this for JUST the Universal Input API without old dependencies.
"""

import os
import logging
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import ONLY the new Universal Input routes
from src.routes import universal_input, killswitch, monitoring

# Import context switcher
try:
    from src.routers import context_switcher
    context_switcher_available = True
except ImportError:
    context_switcher_available = False
    logger.warning("Context switcher not available")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Universal Input API",
    description="Single endpoint for ALL AI requests - Chat, Embeddings, Images, Code, Analysis",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for testing
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
        "service": "Universal Input API",
        "version": "1.0.0"
    }

# Register Universal Input routes
app.include_router(universal_input.router, tags=["universal"])
app.include_router(killswitch.router, tags=["killswitch"])
app.include_router(monitoring.router, tags=["monitoring"])

# Register context switcher if available
if context_switcher_available:
    app.include_router(context_switcher.router, tags=["contexts"])
    logger.info("🎯 Context switcher registered")

if __name__ == "__main__":
    import uvicorn
    
    # Configuration
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    
    logger.info("🔥 Starting Universal Input API (Standalone)")
    logger.info(f"📊 API Docs: http://{host}:{port}/docs")
    logger.info(f"🤖 Universal Input: http://{host}:{port}/api/v2/universal/request")
    logger.info(f"🔴 Killswitch: http://{host}:{port}/code/api/killswitch/status")
    logger.info(f"📈 Monitoring: http://{host}:{port}/code/api/monitoring/system/current")
    
    uvicorn.run(
        "main_universal:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )

