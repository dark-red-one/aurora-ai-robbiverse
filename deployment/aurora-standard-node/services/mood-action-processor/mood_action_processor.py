#!/usr/bin/env python3
"""
Mood & Action Processor - Core Robbie Intelligence
Runs every 20 seconds for mood evaluation and every 1 minute for action processing
"""

import os
import json
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import httpx
import numpy as np
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
fastapi_app = FastAPI(title="Mood & Action Processor")

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

PRIORITY_ENGINE_URL = os.getenv("PRIORITY_ENGINE_URL", "http://priority-surface:8002")
CHAT_BACKEND_URL = os.getenv("CHAT_BACKEND_URL", "http://chat-backend:8000")

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


class MoodState(BaseModel):
    user_id: str
    mood: str
    confidence: float
    context: Dict
    timestamp: datetime
    reasoning: str


class ActionTrigger(BaseModel):
    id: str
    type: str  # 'email', 'calendar', 'meeting', 'deadline', 'opportunity'
    priority: int
    description: str
    metadata: Dict
    created_at: datetime


@fastapi_app.on_event("startup")
async def startup_event():
    """Initialize mood action processor"""
    logger.info(f"🧠 Starting Mood & Action Processor on {NODE_NAME}...")

    # Ensure mood action tables exist
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS mood_states (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id TEXT NOT NULL,
                    mood TEXT NOT NULL,
                    confidence FLOAT NOT NULL,
                    context JSONB DEFAULT '{}'::jsonb,
                    reasoning TEXT,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS action_triggers (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    type TEXT NOT NULL,
                    priority INTEGER NOT NULL,
                    description TEXT NOT NULL,
                    metadata JSONB DEFAULT '{}'::jsonb,
                    processed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
            """)

            conn.commit()

        logger.info("✅ Mood & Action Processor ready")

    finally:
        conn.close()

    # Start schedulers
    scheduler = AsyncIOScheduler()

    # Every 20 seconds: Mood evaluation
    scheduler.add_job(evaluate_mood, 'interval', seconds=20)

    # Every 1 minute: Action processing
    scheduler.add_job(process_actions, 'interval', seconds=60)

    scheduler.start()

    logger.info("⏰ Cron jobs started: Mood (20s) + Actions (1m)")


@fastapi_app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "mood-action-processor", "node": NODE_NAME}


@fastapi_app.get("/api/mood/state")
async def get_current_mood():
    """Get current mood state"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT * FROM mood_states
                    WHERE user_id = 'allan'
                    ORDER BY created_at DESC
                    LIMIT 1
                """)

                mood_state = cur.fetchone()
                if mood_state:
                    return dict(mood_state)
                else:
                    return {"mood": "neutral", "confidence": 0.5, "context": {}}

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error getting mood state: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@fastapi_app.get("/api/actions/triggers")
async def get_action_triggers(limit: int = 50):
    """Get recent action triggers"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT * FROM action_triggers
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (limit,))

                triggers = cur.fetchall()
                return {"triggers": [dict(t) for t in triggers]}

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error getting action triggers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def evaluate_mood():
    """Evaluate current mood state (runs every 20 seconds)"""
    try:
        # Get recent conversation data
        recent_messages = await get_recent_conversation_data()

        # Analyze conversation patterns
        mood_analysis = await analyze_conversation_mood(recent_messages)

        # Store mood state
        await store_mood_state(mood_analysis)

        # Update personality state if needed
        await update_personality_from_mood(mood_analysis)

        logger.debug(f"🎭 Mood evaluated: {mood_analysis['mood']} (confidence: {mood_analysis['confidence']})")

    except Exception as e:
        logger.error(f"❌ Error in mood evaluation: {e}")


async def process_actions():
    """Process pending actions (runs every 1 minute)"""
    try:
        # Get unprocessed action triggers
        triggers = await get_unprocessed_triggers()

        for trigger in triggers:
            # Process the trigger based on its type
            await process_trigger(trigger)

            # Mark as processed
            await mark_trigger_processed(trigger["id"])

        logger.debug(f"⚡ Processed {len(triggers)} action triggers")

    except Exception as e:
        logger.error(f"❌ Error in action processing: {e}")


async def get_recent_conversation_data() -> List[Dict]:
    """Get recent conversation data for mood analysis"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT content, role, created_at, metadata
                    FROM messages
                    WHERE created_at > NOW() - INTERVAL '1 hour'
                    AND conversation_id IN (
                        SELECT id FROM conversations WHERE user_id = 'allan'
                    )
                    ORDER BY created_at DESC
                    LIMIT 100
                """)

                messages = cur.fetchall()
                return [dict(msg) for msg in messages]

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error getting conversation data: {e}")
        return []


async def analyze_conversation_mood(messages: List[Dict]) -> Dict:
    """Analyze mood from recent conversations"""
    if not messages:
        return {
            "mood": "neutral",
            "confidence": 0.5,
            "context": {},
            "reasoning": "No recent conversation data"
        }

    # Simple mood analysis based on message patterns
    positive_words = ["great", "excellent", "awesome", "good", "perfect", "love", "excited", "happy"]
    negative_words = ["terrible", "awful", "bad", "horrible", "hate", "frustrated", "angry", "sad"]
    urgent_words = ["urgent", "asap", "emergency", "crisis", "deadline", "now", "immediately"]

    positive_count = 0
    negative_count = 0
    urgent_count = 0

    for msg in messages:
        content = msg["content"].lower()
        positive_count += sum(1 for word in positive_words if word in content)
        negative_count += sum(1 for word in negative_words if word in content)
        urgent_count += sum(1 for word in urgent_words if word in content)

    total_words = len(messages)

    # Determine mood based on patterns
    if urgent_count > total_words * 0.1:
        mood = "urgent"
        confidence = min(0.9, urgent_count / total_words * 2)
    elif positive_count > negative_count * 1.5:
        mood = "positive"
        confidence = min(0.8, positive_count / total_words * 1.5)
    elif negative_count > positive_count * 1.5:
        mood = "negative"
        confidence = min(0.8, negative_count / total_words * 1.5)
    else:
        mood = "neutral"
        confidence = 0.6

    return {
        "mood": mood,
        "confidence": confidence,
        "context": {
            "positive_signals": positive_count,
            "negative_signals": negative_count,
            "urgent_signals": urgent_count,
            "message_count": total_words
        },
        "reasoning": f"Analyzed {total_words} messages: {positive_count} positive, {negative_count} negative, {urgent_count} urgent"
    }


async def store_mood_state(analysis: Dict):
    """Store current mood state"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO mood_states (user_id, mood, confidence, context, reasoning)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    "allan",
                    analysis["mood"],
                    analysis["confidence"],
                    json.dumps(analysis["context"]),
                    analysis["reasoning"]
                ))

                conn.commit()

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error storing mood state: {e}")


async def update_personality_from_mood(analysis: Dict):
    """Update personality state based on mood"""
    try:
        # Get current personality state
        current_state = await get_personality_state()

        # Adjust personality based on mood
        if analysis["mood"] == "urgent":
            current_state["turbo"] = min(10, current_state.get("turbo", 5) + 1)
        elif analysis["mood"] == "positive":
            current_state["flirty"] = min(10, current_state.get("flirty", 5) + 0.5)
        elif analysis["mood"] == "negative":
            current_state["gandhi"] = max(1, current_state.get("gandhi", 5) - 0.5)

        # Store updated personality state
        await redis_client.set("aurora:personality:state", json.dumps(current_state))

        logger.debug(f"🎭 Updated personality from mood: {current_state}")

    except Exception as e:
        logger.error(f"❌ Error updating personality from mood: {e}")


async def get_unprocessed_triggers() -> List[Dict]:
    """Get unprocessed action triggers"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT * FROM action_triggers
                    WHERE processed = FALSE
                    ORDER BY priority DESC, created_at ASC
                    LIMIT 20
                """)

                triggers = cur.fetchall()
                return [dict(t) for t in triggers]

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error getting unprocessed triggers: {e}")
        return []


async def process_trigger(trigger: Dict):
    """Process a single action trigger"""
    try:
        trigger_type = trigger["type"]
        metadata = trigger["metadata"]

        if trigger_type == "email":
            await process_email_trigger(metadata)
        elif trigger_type == "calendar":
            await process_calendar_trigger(metadata)
        elif trigger_type == "meeting":
            await process_meeting_trigger(metadata)
        elif trigger_type == "deadline":
            await process_deadline_trigger(metadata)
        elif trigger_type == "opportunity":
            await process_opportunity_trigger(metadata)

    except Exception as e:
        logger.error(f"❌ Error processing trigger {trigger['id']}: {e}")


async def process_email_trigger(metadata: Dict):
    """Process email-related trigger"""
    # Route to integration-sync for email sending
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{CHAT_BACKEND_URL}/api/chat",
                json={
                    "message": f"Email trigger: {metadata.get('subject', 'No subject')}",
                    "user_id": "system",
                    "trigger_email": metadata,
                    "source": "email_trigger"
                },
                headers={"X-API-Key": os.getenv("API_KEY", "robbie-2025")},
                timeout=10.0
            )
    except Exception as e:
        logger.error(f"❌ Error processing email trigger: {e}")


async def process_calendar_trigger(metadata: Dict):
    """Process calendar-related trigger"""
    # Route to integration-sync for calendar management
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{CHAT_BACKEND_URL}/api/chat",
                json={
                    "message": f"Calendar trigger: {metadata.get('event_title', 'Calendar event')}",
                    "user_id": "system",
                    "trigger_calendar": metadata,
                    "source": "calendar_trigger"
                },
                headers={"X-API-Key": os.getenv("API_KEY", "robbie-2025")},
                timeout=10.0
            )
    except Exception as e:
        logger.error(f"❌ Error processing calendar trigger: {e}")


async def process_meeting_trigger(metadata: Dict):
    """Process meeting-related trigger"""
    # Route to priority engine for meeting prep
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{PRIORITY_ENGINE_URL}/api/priorities/task",
                json={
                    "title": f"Meeting: {metadata.get('title', 'Upcoming meeting')}",
                    "description": f"Meeting preparation needed\n\n{metadata.get('description', '')}",
                    "category": "meeting",
                    "urgency": 80,
                    "importance": 75,
                    "effort": 30,
                    "context_relevance": 90,
                    "dependencies": [],
                    "personality_alignment": {"gandhi": 8, "flirty": 6, "turbo": 7, "auto": 7},
                    "metadata": metadata
                },
                headers={"X-API-Key": os.getenv("API_KEY", "robbie-2025")},
                timeout=10.0
            )
    except Exception as e:
        logger.error(f"❌ Error processing meeting trigger: {e}")


async def process_deadline_trigger(metadata: Dict):
    """Process deadline-related trigger"""
    # Create high-priority task
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{PRIORITY_ENGINE_URL}/api/priorities/task",
                json={
                    "title": f"⏰ Deadline: {metadata.get('title', 'Upcoming deadline')}",
                    "description": f"Deadline approaching\n\n{metadata.get('description', '')}",
                    "category": "deadline",
                    "urgency": 95,
                    "importance": 85,
                    "effort": 60,
                    "context_relevance": 100,
                    "dependencies": [],
                    "personality_alignment": {"gandhi": 9, "flirty": 4, "turbo": 9, "auto": 8},
                    "metadata": metadata
                },
                headers={"X-API-Key": os.getenv("API_KEY", "robbie-2025")},
                timeout=10.0
            )
    except Exception as e:
        logger.error(f"❌ Error processing deadline trigger: {e}")


async def process_opportunity_trigger(metadata: Dict):
    """Process opportunity-related trigger"""
    # Create opportunity task
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{PRIORITY_ENGINE_URL}/api/priorities/task",
                json={
                    "title": f"💰 Opportunity: {metadata.get('title', 'Business opportunity')}",
                    "description": f"Revenue opportunity identified\n\n{metadata.get('description', '')}",
                    "category": "opportunity",
                    "urgency": 85,
                    "importance": 90,
                    "effort": 45,
                    "context_relevance": 95,
                    "dependencies": [],
                    "personality_alignment": {"gandhi": 8, "flirty": 7, "turbo": 7, "auto": 8},
                    "metadata": metadata
                },
                headers={"X-API-Key": os.getenv("API_KEY", "robbie-2025")},
                timeout=10.0
            )
    except Exception as e:
        logger.error(f"❌ Error processing opportunity trigger: {e}")


async def mark_trigger_processed(trigger_id: str):
    """Mark trigger as processed"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE action_triggers SET processed = TRUE
                    WHERE id = %s
                """, (trigger_id,))

                conn.commit()

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error marking trigger processed: {e}")


async def get_personality_state() -> Dict:
    """Get current personality state"""
    try:
        state_json = await redis_client.get("aurora:personality:state")
        if state_json:
            return json.loads(state_json)
        return {"gandhi": 5, "flirty": 5, "turbo": 5, "auto": 5}
    except:
        return {"gandhi": 5, "flirty": 5, "turbo": 5, "auto": 5}


async def run_mood_monitoring():
    """Background task for continuous mood monitoring"""
    while True:
        try:
            await evaluate_mood()
            await asyncio.sleep(20)  # Every 20 seconds

        except Exception as e:
            logger.error(f"❌ Mood monitoring error: {e}")
            await asyncio.sleep(60)  # Wait 1 minute before retry


async def run_action_monitoring():
    """Background task for continuous action monitoring"""
    while True:
        try:
            await process_actions()
            await asyncio.sleep(60)  # Every 1 minute

        except Exception as e:
            logger.error(f"❌ Action monitoring error: {e}")
            await asyncio.sleep(120)  # Wait 2 minutes before retry


async def main():
    """Main entry point"""
    # Start monitoring tasks in background
    mood_task = asyncio.create_task(run_mood_monitoring())
    action_task = asyncio.create_task(run_action_monitoring())

    # Start FastAPI server
    import uvicorn
    config = uvicorn.Config(fastapi_app, host="0.0.0.0", port=3007)
    server = uvicorn.Server(config)

    try:
        await server.serve()
    except KeyboardInterrupt:
        logger.info("🛑 Shutting down mood action processor...")
    finally:
        mood_task.cancel()
        action_task.cancel()
        await server.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
