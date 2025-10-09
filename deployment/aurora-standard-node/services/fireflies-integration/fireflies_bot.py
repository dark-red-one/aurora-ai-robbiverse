#!/usr/bin/env python3
"""
Fireflies Integration Service
Syncs meeting transcripts and action items from Fireflies.ai
"""

import os
import json
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
fastapi_app = FastAPI(title="Fireflies Integration Service")

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

FIREFLIES_API_KEY = os.getenv("FIREFLIES_API_KEY", "")
PRIORITY_ENGINE_URL = os.getenv("PRIORITY_ENGINE_URL", "http://priority-surface:8002")

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


@fastapi_app.on_event("startup")
async def startup_event():
    """Initialize Fireflies integration"""
    logger.info(f"🔥 Starting Fireflies Integration on {NODE_NAME}...")

    # Ensure Fireflies tables exist
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS fireflies_meetings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    fireflies_id TEXT UNIQUE NOT NULL,
                    title TEXT NOT NULL,
                    transcript TEXT,
                    duration INTEGER,
                    participants JSONB DEFAULT '[]'::jsonb,
                    action_items JSONB DEFAULT '[]'::jsonb,
                    summary TEXT,
                    sentiment TEXT,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    synced_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS fireflies_action_items (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    meeting_id UUID REFERENCES fireflies_meetings(id) ON DELETE CASCADE,
                    fireflies_action_id TEXT,
                    description TEXT NOT NULL,
                    assignee TEXT,
                    due_date TIMESTAMPTZ,
                    status TEXT DEFAULT 'pending',
                    priority TEXT DEFAULT 'medium',
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    synced_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
            """)

            conn.commit()

        logger.info("✅ Fireflies integration ready")

    finally:
        conn.close()


@fastapi_app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "fireflies-integration", "node": NODE_NAME}


@fastapi_app.post("/api/fireflies/sync")
async def sync_fireflies_data(background_tasks: BackgroundTasks):
    """Trigger Fireflies data sync"""
    if not FIREFLIES_API_KEY:
        raise HTTPException(status_code=400, detail="Fireflies API key not configured")

    background_tasks.add_task(sync_all_fireflies_data)
    return {"status": "sync_started"}


@fastapi_app.get("/api/fireflies/meetings")
async def get_fireflies_meetings(limit: int = 50):
    """Get synced Fireflies meetings"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT * FROM fireflies_meetings
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (limit,))

                meetings = cur.fetchall()
                return {"meetings": [dict(m) for m in meetings]}

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"Error getting meetings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@fastapi_app.get("/api/fireflies/action-items")
async def get_fireflies_action_items(meeting_id: Optional[str] = None, status: Optional[str] = None):
    """Get Fireflies action items"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                query = "SELECT * FROM fireflies_action_items WHERE 1=1"
                params = []

                if meeting_id:
                    query += " AND meeting_id = %s"
                    params.append(meeting_id)

                if status:
                    query += " AND status = %s"
                    params.append(status)

                query += " ORDER BY created_at DESC"

                cur.execute(query, params)
                action_items = cur.fetchall()
                return {"action_items": [dict(a) for a in action_items]}

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"Error getting action items: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def sync_all_fireflies_data():
    """Sync all Fireflies data"""
    if not FIREFLIES_API_KEY:
        logger.error("❌ Fireflies API key not configured")
        return

    try:
        # Get recent transcripts from Fireflies
        transcripts = await get_fireflies_transcripts()

        for transcript in transcripts:
            await process_fireflies_transcript(transcript)

        logger.info(f"✅ Synced {len(transcripts)} Fireflies transcripts")

    except Exception as e:
        logger.error(f"❌ Error syncing Fireflies data: {e}")


async def get_fireflies_transcripts(limit: int = 100):
    """Get transcripts from Fireflies API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.fireflies.ai/graphql",
                headers={
                    "Authorization": f"Bearer {FIREFLIES_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "query": """
                        query {
                            transcripts(limit: 10, sort: "date_desc") {
                                id
                                title
                                transcript_text
                                duration
                                participants {
                                    name
                                    email
                                }
                                action_items {
                                    id
                                    description
                                    assignee
                                    due_date
                                }
                                summary {
                                    overview
                                    action_items
                                    sentiment
                                }
                                date
                            }
                        }
                    """
                },
                timeout=30.0
            )

            if response.status_code == 200:
                data = response.json()
                return data.get("data", {}).get("transcripts", [])
            else:
                logger.error(f"❌ Fireflies API error: {response.status_code}")
                return []

    except Exception as e:
        logger.error(f"❌ Error getting Fireflies transcripts: {e}")
        return []


async def process_fireflies_transcript(transcript: Dict):
    """Process a single Fireflies transcript"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Insert or update meeting
                cur.execute("""
                    INSERT INTO fireflies_meetings (
                        fireflies_id, title, transcript, duration, participants,
                        action_items, summary, sentiment, synced_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (fireflies_id) DO UPDATE SET
                        title = EXCLUDED.title,
                        transcript = EXCLUDED.transcript,
                        duration = EXCLUDED.duration,
                        participants = EXCLUDED.participants,
                        action_items = EXCLUDED.action_items,
                        summary = EXCLUDED.summary,
                        sentiment = EXCLUDED.sentiment,
                        synced_at = NOW()
                """, (
                    transcript["id"],
                    transcript["title"],
                    transcript.get("transcript_text", ""),
                    transcript.get("duration"),
                    json.dumps(transcript.get("participants", [])),
                    json.dumps(transcript.get("action_items", [])),
                    transcript.get("summary", {}).get("overview", ""),
                    transcript.get("summary", {}).get("sentiment", "")
                ))

                meeting_id = None
                cur.execute("SELECT id FROM fireflies_meetings WHERE fireflies_id = %s", (transcript["id"],))
                meeting_row = cur.fetchone()
                if meeting_row:
                    meeting_id = meeting_row["id"]

                conn.commit()

                # Process action items
                if meeting_id and transcript.get("action_items"):
                    await process_action_items(meeting_id, transcript["action_items"])

                # Create priority tasks for action items
                await create_priority_tasks_for_action_items(transcript["action_items"])

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error processing Fireflies transcript: {e}")


async def process_action_items(meeting_id: str, action_items: List[Dict]):
    """Process action items from a meeting"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                for item in action_items:
                    # Parse due date if present
                    due_date = None
                    if item.get("due_date"):
                        try:
                            due_date = datetime.fromisoformat(item["due_date"].replace('Z', '+00:00'))
                        except:
                            pass

                    # Insert action item
                    cur.execute("""
                        INSERT INTO fireflies_action_items (
                            meeting_id, fireflies_action_id, description, assignee,
                            due_date, status, priority, synced_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                        ON CONFLICT (meeting_id, fireflies_action_id) DO UPDATE SET
                            description = EXCLUDED.description,
                            assignee = EXCLUDED.assignee,
                            due_date = EXCLUDED.due_date,
                            status = EXCLUDED.status,
                            priority = EXCLUDED.priority,
                            synced_at = NOW()
                    """, (
                        meeting_id,
                        item.get("id"),
                        item["description"],
                        item.get("assignee"),
                        due_date,
                        "pending",
                        "medium"
                    ))

                conn.commit()

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error processing action items: {e}")


async def create_priority_tasks_for_action_items(action_items: List[Dict]):
    """Create priority tasks for action items"""
    for item in action_items:
        try:
            async with httpx.AsyncClient() as client:
                urgency = 75
                if item.get("due_date"):
                    try:
                        due_date = datetime.fromisoformat(item["due_date"].replace('Z', '+00:00'))
                        days_until_due = (due_date - datetime.now()).days
                        if days_until_due <= 1:
                            urgency = 90
                        elif days_until_due <= 3:
                            urgency = 80
                    except:
                        pass

                await client.post(
                    f"{PRIORITY_ENGINE_URL}/api/priorities/task",
                    json={
                        "title": f"Action Item: {item['description'][:50]}...",
                        "description": f"Meeting action item\n\n{item['description']}\nAssignee: {item.get('assignee', 'Unassigned')}",
                        "category": "meeting",
                        "urgency": urgency,
                        "importance": 70,
                        "effort": 45,
                        "context_relevance": 85,
                        "dependencies": [],
                        "personality_alignment": {"gandhi": 8, "flirty": 5, "turbo": 6, "auto": 7},
                        "metadata": {
                            "source": "fireflies",
                            "action_item_id": item.get("id")
                        }
                    },
                    headers={"X-API-Key": os.getenv("API_KEY", "robbie-2025")},
                    timeout=10.0
                )

            logger.info(f"✅ Created priority task for action item: {item['description'][:50]}...")

        except Exception as e:
            logger.error(f"❌ Error creating priority task for action item: {e}")


async def run_fireflies_monitoring():
    """Background task to monitor Fireflies for new meetings"""
    while True:
        try:
            if FIREFLIES_API_KEY:
                await sync_all_fireflies_data()

            await asyncio.sleep(3600)  # Check every hour

        except Exception as e:
            logger.error(f"❌ Fireflies monitoring error: {e}")
            await asyncio.sleep(300)  # Wait 5 minutes before retry


async def main():
    """Main entry point"""
    # Start Fireflies monitoring in background
    monitoring_task = asyncio.create_task(run_fireflies_monitoring())

    # Start FastAPI server
    import uvicorn
    config = uvicorn.Config(fastapi_app, host="0.0.0.0", port=3005)
    server = uvicorn.Server(config)

    try:
        await server.serve()
    except KeyboardInterrupt:
        logger.info("🛑 Shutting down Fireflies integration...")
    finally:
        monitoring_task.cancel()
        await server.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
