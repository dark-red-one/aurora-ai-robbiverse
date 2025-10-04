from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
import psycopg2
import torch
import json
from datetime import datetime
import os

app = FastAPI(title="Aurora-Town Control Plane", version="1.0.0")

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host="aurora-postgres-u44170.vm.elestio.app",
        port=25432,
        dbname="aurora_unified",
        user="aurora_app", 
        password="TestPilot2025_Aurora!",
        sslmode="require"
    )

@app.get("/")
async def root():
    return {"message": "Aurora-Town Control Plane", "status": "online", "city": "aurora"}

@app.get("/health")
async def health():
    status = {
        "timestamp": datetime.utcnow().isoformat(),
        "status": "healthy",
        "services": {}
    }
    
    # Test database
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM towns")
            town_count = cur.fetchone()[0]
        conn.close()
        status["services"]["database"] = {"status": "connected", "towns": town_count}
    except Exception as e:
        status["services"]["database"] = {"error": str(e)}
        status["status"] = "unhealthy"
    
    # Test GPU worker
    try:
        import httpx
        response = httpx.get("http://209.170.80.132:8000", timeout=5)
        status["services"]["gpu_worker"] = {"status": "connected", "response": response.text}
    except Exception as e:
        status["services"]["gpu_worker"] = {"error": str(e)}
        status["status"] = "degraded"
    
    return status

@app.get("/towns")
async def get_towns():
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM cross_town_analytics")
            towns = cur.fetchall()
        conn.close()
        return {"towns": towns}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Aurora-Town Control Plane</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #1a1a1a; color: white; }
            .card { background: #2a2a2a; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .status-ok { color: #4CAF50; }
            .status-error { color: #f44336; }
            h1 { color: #64B5F6; }
        </style>
    </head>
    <body>
        <h1>🏛️ Aurora-Town Control Plane</h1>
        <div class="card">
            <h2>System Status</h2>
            <p>Database: <span class="status-ok">✅ Connected</span></p>
            <p>GPU Worker: <span class="status-ok">✅ Online</span></p>
            <p>City: Aurora (Capital)</p>
        </div>
        <div class="card">
            <h2>Quick Links</h2>
            <a href="/health">Health Check</a> | 
            <a href="/towns">Towns Data</a> | 
            <a href="http://209.170.80.132:8000">GPU Worker</a>
        </div>
    </body>
    </html>
    """
