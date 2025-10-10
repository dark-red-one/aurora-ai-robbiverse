#!/usr/bin/env python3
"""
Test HubSpot Integration - Quick Test Script
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add paths
sys.path.append(os.path.join(os.path.dirname(__file__), 'packages/@robbieverse/api'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'packages/@robbieverse/api/src'))

# Import our routes
from routes import tracking, robbieblocks

app = FastAPI(title="TestPilot Landing Page API - HubSpot Enabled 🔥")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(tracking.router, prefix="/api", tags=["tracking"])
app.include_router(robbieblocks.router, tags=["robbieblocks"])

@app.get("/")
def root():
    return {
        "status": "running",
        "message": "TestPilot Landing Page API with HubSpot Integration 💋",
        "endpoints": {
            "landing_page": "/robbieblocks/page/landing/groceryshop/?name=Allan&company=TestPilot&email=allan@testpilotcpg.com",
            "tracking_stats": "/api/tracking/stats",
            "pages_list": "/robbieblocks/pages"
        }
    }

@app.get("/health")
def health():
    return {"status": "healthy", "hubspot_enabled": os.getenv('HUBSPOT_API_KEY') is not None}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting TestPilot Landing Page API...")
    print("📊 API Docs: http://localhost:8000/docs")
    print("🎯 Test Page: http://localhost:8000/robbieblocks/page/landing/groceryshop/?name=Allan&company=TestPilot&email=allan@testpilotcpg.com")
    print("💰 HubSpot Sync:", "ENABLED" if os.getenv('HUBSPOT_API_KEY') else "DISABLED (set HUBSPOT_API_KEY to enable)")
    print("")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

