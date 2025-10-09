#!/usr/bin/env python3
"""
Offline Queue Service
Queues requests when nodes are offline and syncs them when connectivity is restored
"""

import os
import json
import logging
import asyncio
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
fastapi_app = FastAPI(title="Offline Queue Service")

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

# SQLite database for local queue (when Postgres is down)
LOCAL_QUEUE_DB = "/data/offline_queue.db"


def get_postgres_connection():
    """Get PostgreSQL connection"""
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        cursor_factory=RealDictCursor
    )


def get_local_connection():
    """Get SQLite connection for offline queue"""
    conn = sqlite3.connect(LOCAL_QUEUE_DB)
    conn.row_factory = sqlite3.Row
    return conn


class QueuedRequest(BaseModel):
    id: str
    node_name: str
    service: str
    method: str
    url: str
    headers: Dict
    data: Any
    priority: int = 5
    max_retries: int = 3
    created_at: datetime
    retries: int = 0
    last_error: Optional[str] = None


@fastapi_app.on_event("startup")
async def startup_event():
    """Initialize offline queue service"""
    logger.info(f"📡 Starting Offline Queue Service on {NODE_NAME}...")

    # Ensure local SQLite database exists
    conn = get_local_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS offline_requests (
                id TEXT PRIMARY KEY,
                node_name TEXT NOT NULL,
                service TEXT NOT NULL,
                method TEXT NOT NULL,
                url TEXT NOT NULL,
                headers TEXT NOT NULL,
                data TEXT,
                priority INTEGER DEFAULT 5,
                max_retries INTEGER DEFAULT 3,
                retries INTEGER DEFAULT 0,
                last_error TEXT,
                created_at TEXT NOT NULL
            )
        """)

        # Create index for priority-based processing
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_priority_created
            ON offline_requests(priority DESC, created_at ASC)
        """)

        conn.commit()

    finally:
        conn.close()

    # Start background sync scheduler
    scheduler = AsyncIOScheduler()
    scheduler.add_job(sync_offline_requests, 'interval', seconds=30)
    scheduler.start()

    logger.info("✅ Offline queue service ready")


@fastapi_app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "offline-queue", "node": NODE_NAME}


@fastapi_app.post("/api/queue/request")
async def queue_request(request: QueuedRequest):
    """Queue a request for offline processing"""
    try:
        # Check if we can reach the service directly
        if await is_service_available(request.service):
            # Service is available, execute immediately
            success = await execute_request(request)
            if success:
                return {"status": "executed", "request_id": request.id}

        # Service unavailable or execution failed, queue for later
        await store_offline_request(request)
        return {"status": "queued", "request_id": request.id}

    except Exception as e:
        logger.error(f"❌ Error queuing request: {e}")
        # Always store offline as fallback
        await store_offline_request(request)
        return {"status": "queued", "request_id": request.id}


@fastapi_app.get("/api/queue/status")
async def get_queue_status():
    """Get queue status and statistics"""
    try:
        conn = get_local_connection()
        try:
            cursor = conn.cursor()

            # Get total queued requests
            cursor.execute("SELECT COUNT(*) as total FROM offline_requests")
            total = cursor.fetchone()["total"]

            # Get requests by service
            cursor.execute("""
                SELECT service, COUNT(*) as count
                FROM offline_requests
                GROUP BY service
                ORDER BY count DESC
            """)
            by_service = [{"service": row["service"], "count": row["count"]} for row in cursor.fetchall()]

            # Get requests by priority
            cursor.execute("""
                SELECT priority, COUNT(*) as count
                FROM offline_requests
                GROUP BY priority
                ORDER BY priority DESC
            """)
            by_priority = [{"priority": row["priority"], "count": row["count"]} for row in cursor.fetchall()]

            return {
                "total_queued": total,
                "by_service": by_service,
                "by_priority": by_priority,
                "node": NODE_NAME
            }

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error getting queue status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@fastapi_app.get("/api/queue/requests")
async def get_queued_requests(service: Optional[str] = None, limit: int = 100):
    """Get queued requests"""
    try:
        conn = get_local_connection()
        try:
            cursor = conn.cursor()

            query = "SELECT * FROM offline_requests WHERE 1=1"
            params = []

            if service:
                query += " AND service = ?"
                params.append(service)

            query += " ORDER BY priority DESC, created_at ASC LIMIT ?"
            params.append(limit)

            cursor.execute(query, params)
            requests = [dict(row) for row in cursor.fetchall()]

            return {"requests": requests}

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error getting queued requests: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@fastapi_app.delete("/api/queue/requests/{request_id}")
async def remove_queued_request(request_id: str):
    """Remove a queued request"""
    try:
        conn = get_local_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM offline_requests WHERE id = ?", (request_id,))
            conn.commit()

            return {"status": "removed", "request_id": request_id}

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error removing queued request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def is_service_available(service: str) -> bool:
    """Check if a service is available"""
    service_urls = {
        "chat-backend": "http://chat-backend:8000/health",
        "priority-surface": "http://priority-surface:8002/health",
        "secrets-manager": "http://secrets-manager:8003/health",
        "auth-service": "http://auth-service:8008/health",
        "robbieblocks-api": "http://robbieblocks-api:8009/health",
        "training-scheduler": "http://training-scheduler:8010/health",
        "integration-sync": "http://integration-sync:8000/health",
        "slack-integration": "http://slack-integration:3003/health",
        "github-integration": "http://github-integration:3004/health",
        "fireflies-integration": "http://fireflies-integration:3005/health"
    }

    url = service_urls.get(service)
    if not url:
        return False

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=5.0)
            return response.status_code == 200
    except:
        return False


async def execute_request(request: QueuedRequest) -> bool:
    """Execute a queued request"""
    try:
        headers = json.loads(request.headers) if request.headers else {}

        async with httpx.AsyncClient() as client:
            if request.method == "POST":
                response = await client.post(
                    request.url,
                    headers=headers,
                    json=json.loads(request.data) if request.data else None,
                    timeout=30.0
                )
            elif request.method == "GET":
                response = await client.get(
                    request.url,
                    headers=headers,
                    timeout=30.0
                )
            else:
                logger.error(f"❌ Unsupported method: {request.method}")
                return False

            return response.status_code < 400

    except Exception as e:
        logger.error(f"❌ Error executing request: {e}")
        return False


async def store_offline_request(request: QueuedRequest):
    """Store request in offline queue"""
    try:
        conn = get_local_connection()
        try:
            conn.execute("""
                INSERT OR REPLACE INTO offline_requests (
                    id, node_name, service, method, url, headers, data,
                    priority, max_retries, retries, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                request.id,
                request.node_name,
                request.service,
                request.method,
                request.url,
                json.dumps(request.headers) if request.headers else "{}",
                json.dumps(request.data) if request.data else None,
                request.priority,
                request.max_retries,
                request.retries,
                request.created_at.isoformat()
            ))

            conn.commit()

            logger.info(f"📦 Queued request {request.id} for service {request.service}")

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error storing offline request: {e}")


async def sync_offline_requests():
    """Sync offline requests when services become available"""
    try:
        conn = get_local_connection()
        try:
            cursor = conn.cursor()

            # Get requests ordered by priority
            cursor.execute("""
                SELECT * FROM offline_requests
                ORDER BY priority DESC, created_at ASC
                LIMIT 10
            """)

            requests = [QueuedRequest(**dict(row)) for row in cursor.fetchall()]

            for request in requests:
                # Check if service is now available
                if await is_service_available(request.service):
                    # Try to execute
                    if await execute_request(request):
                        # Success, remove from queue
                        cursor.execute("DELETE FROM offline_requests WHERE id = ?", (request.id,))
                        logger.info(f"✅ Executed queued request {request.id}")
                    else:
                        # Failed, increment retry count
                        cursor.execute("""
                            UPDATE offline_requests
                            SET retries = retries + 1, last_error = ?
                            WHERE id = ?
                        """, (f"Retry {request.retries + 1}", request.id))

                        # Remove if max retries exceeded
                        if request.retries >= request.max_retries:
                            cursor.execute("DELETE FROM offline_requests WHERE id = ?", (request.id,))
                            logger.warning(f"❌ Removed request {request.id} after max retries")

                conn.commit()

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error syncing offline requests: {e}")


async def run_offline_monitoring():
    """Background task to monitor connectivity and sync requests"""
    while True:
        try:
            await sync_offline_requests()
            await asyncio.sleep(30)  # Check every 30 seconds

        except Exception as e:
            logger.error(f"❌ Offline monitoring error: {e}")
            await asyncio.sleep(60)  # Wait 1 minute before retry


async def main():
    """Main entry point"""
    # Start offline monitoring in background
    monitoring_task = asyncio.create_task(run_offline_monitoring())

    # Start FastAPI server
    import uvicorn
    config = uvicorn.Config(fastapi_app, host="0.0.0.0", port=3006)
    server = uvicorn.Server(config)

    try:
        await server.serve()
    except KeyboardInterrupt:
        logger.info("🛑 Shutting down offline queue service...")
    finally:
        monitoring_task.cancel()
        await server.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
