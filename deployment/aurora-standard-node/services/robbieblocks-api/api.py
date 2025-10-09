#!/usr/bin/env python3
"""
RobbieBlocks API - Widget Marketplace
25+ reusable widgets for 5 sites: AskRobbie, RobbieBlocks.com, LeadershipQuotes, TestPilot.ai, HeyShopper
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="RobbieBlocks API - Widget Marketplace")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
NODE_NAME = os.getenv("NODE_NAME", "unknown")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "aurora_unified")
POSTGRES_USER = os.getenv("POSTGRES_USER", "aurora_app")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")

# Redis client
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD if REDIS_PASSWORD else None,
    decode_responses=True
)


def get_db_connection():
    """Get PostgreSQL connection"""
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        cursor_factory=RealDictCursor
    )


class Widget(BaseModel):
    id: str
    name: str
    description: str
    category: str
    site: str
    inputs: Dict
    outputs: Dict
    demo_url: str
    code_snippet: str
    price_tier: str
    created_at: datetime
    updated_at: datetime


class WidgetCreate(BaseModel):
    name: str
    description: str
    category: str
    site: str
    inputs: Dict
    outputs: Dict
    demo_url: str
    code_snippet: str
    price_tier: str = "free"


@app.on_event("startup")
async def startup_event():
    """Initialize RobbieBlocks API"""
    logger.info(f"🎨 Starting RobbieBlocks API on {NODE_NAME}...")
    
    # Ensure widgets table exists
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS widgets (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    category VARCHAR(50),
                    site VARCHAR(50),
                    inputs JSONB DEFAULT '{}',
                    outputs JSONB DEFAULT '{}',
                    demo_url VARCHAR(255),
                    code_snippet TEXT,
                    price_tier VARCHAR(20) DEFAULT 'free',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    metadata JSONB DEFAULT '{}'
                )
            """)
            
            cur.execute("""
                CREATE TABLE IF NOT EXISTS widget_usage (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
                    site_name VARCHAR(50),
                    usage_count INTEGER DEFAULT 0,
                    last_used TIMESTAMP DEFAULT NOW(),
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)
            
            conn.commit()
            
        logger.info("✅ RobbieBlocks API ready")
    finally:
        conn.close()


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "robbieblocks", "node": NODE_NAME}


@app.get("/api/widgets", response_model=List[Widget])
async def get_widgets(
    category: Optional[str] = None,
    site: Optional[str] = None,
    price_tier: Optional[str] = None
):
    """Get all widgets with optional filtering"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                query = "SELECT * FROM widgets WHERE 1=1"
                params = []
                
                if category:
                    query += " AND category = %s"
                    params.append(category)
                
                if site:
                    query += " AND site = %s"
                    params.append(site)
                
                if price_tier:
                    query += " AND price_tier = %s"
                    params.append(price_tier)
                
                query += " ORDER BY created_at DESC"
                
                cur.execute(query, params)
                widgets = cur.fetchall()
                
                return [Widget(**dict(widget)) for widget in widgets]
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Get widgets error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/widgets/{widget_id}", response_model=Widget)
async def get_widget(widget_id: str):
    """Get specific widget by ID"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT * FROM widgets WHERE id = %s
                """, (widget_id,))
                
                widget = cur.fetchone()
                
                if not widget:
                    raise HTTPException(status_code=404, detail="Widget not found")
                
                return Widget(**dict(widget))
                
        finally:
            conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get widget error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/widgets", response_model=Widget)
async def create_widget(widget: WidgetCreate):
    """Create a new widget"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO widgets (name, description, category, site, inputs, outputs, demo_url, code_snippet, price_tier)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *
                """, (
                    widget.name,
                    widget.description,
                    widget.category,
                    widget.site,
                    json.dumps(widget.inputs),
                    json.dumps(widget.outputs),
                    widget.demo_url,
                    widget.code_snippet,
                    widget.price_tier
                ))
                
                new_widget = cur.fetchone()
                conn.commit()
                
                # Publish event
                redis_client.publish("aurora:widgets:created", json.dumps({
                    "widget_id": str(new_widget["id"]),
                    "name": widget.name,
                    "site": widget.site,
                    "node": NODE_NAME,
                    "timestamp": datetime.utcnow().isoformat()
                }))
                
                return Widget(**dict(new_widget))
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Create widget error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/widgets/categories")
async def get_categories():
    """Get all widget categories"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT DISTINCT category, COUNT(*) as count
                    FROM widgets
                    GROUP BY category
                    ORDER BY count DESC
                """)
                
                categories = cur.fetchall()
                
                return [{"category": cat["category"], "count": cat["count"]} for cat in categories]
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Get categories error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/widgets/sites")
async def get_sites():
    """Get all sites using widgets"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT DISTINCT site, COUNT(*) as count
                    FROM widgets
                    GROUP BY site
                    ORDER BY count DESC
                """)
                
                sites = cur.fetchall()
                
                return [{"site": site["site"], "count": site["count"]} for site in sites]
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Get sites error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/widgets/popular")
async def get_popular_widgets(limit: int = 10):
    """Get most popular widgets by usage"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT w.*, COALESCE(SUM(u.usage_count), 0) as total_usage
                    FROM widgets w
                    LEFT JOIN widget_usage u ON w.id = u.widget_id
                    GROUP BY w.id
                    ORDER BY total_usage DESC
                    LIMIT %s
                """, (limit,))
                
                widgets = cur.fetchall()
                
                return [Widget(**dict(widget)) for widget in widgets]
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Get popular widgets error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/widgets/{widget_id}/use")
async def track_widget_usage(widget_id: str, site_name: str):
    """Track widget usage"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Check if widget exists
                cur.execute("SELECT id FROM widgets WHERE id = %s", (widget_id,))
                if not cur.fetchone():
                    raise HTTPException(status_code=404, detail="Widget not found")
                
                # Update or insert usage
                cur.execute("""
                    INSERT INTO widget_usage (widget_id, site_name, usage_count, last_used)
                    VALUES (%s, %s, 1, NOW())
                    ON CONFLICT (widget_id, site_name)
                    DO UPDATE SET 
                        usage_count = widget_usage.usage_count + 1,
                        last_used = NOW()
                """, (widget_id, site_name))
                
                conn.commit()
                
                # Publish event
                redis_client.publish("aurora:widgets:used", json.dumps({
                    "widget_id": widget_id,
                    "site_name": site_name,
                    "node": NODE_NAME,
                    "timestamp": datetime.utcnow().isoformat()
                }))
                
                return {"message": "Usage tracked", "widget_id": widget_id, "site": site_name}
                
        finally:
            conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Track usage error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/widgets/demo/{widget_id}")
async def get_widget_demo(widget_id: str):
    """Get widget demo page"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT demo_url, code_snippet, name, description
                    FROM widgets WHERE id = %s
                """, (widget_id,))
                
                widget = cur.fetchone()
                
                if not widget:
                    raise HTTPException(status_code=404, detail="Widget not found")
                
                return {
                    "demo_url": widget["demo_url"],
                    "code_snippet": widget["code_snippet"],
                    "name": widget["name"],
                    "description": widget["description"]
                }
                
        finally:
            conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get demo error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8009)
