#!/usr/bin/env python3
"""
Slack Integration Service
Handles Slack webhooks, message routing, and responses via Slack Bolt
"""

import os
import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import httpx
from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Slack Bolt app
app = App(
    token=os.getenv("SLACK_BOT_TOKEN"),
    signing_secret=os.getenv("SLACK_SIGNING_SECRET")
)

# FastAPI app for health checks
fastapi_app = FastAPI(title="Slack Integration Service")

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


@app.event("app_mention")
async def handle_app_mention_events(body, logger):
    """Handle mentions of the bot"""
    logger.info(f"🤖 Bot mentioned: {body}")

    # Get the message text (remove bot mention)
    text = body["event"]["text"]
    user_id = body["event"]["user"]
    channel_id = body["event"]["channel"]
    team_id = body["authorizations"][0]["team_id"] if body.get("authorizations") else None

    # Route to chat backend for processing
    await route_to_chat_backend(text, user_id, channel_id, team_id)


@app.event("message")
async def handle_message_events(body, logger):
    """Handle direct messages and channel messages"""
    logger.info(f"💬 Message received: {body}")

    # Only process direct messages for now (not channel messages to avoid spam)
    if body["event"].get("channel_type") == "im":
        text = body["event"]["text"]
        user_id = body["event"]["user"]
        channel_id = body["event"]["channel"]
        team_id = body["authorizations"][0]["team_id"] if body.get("authorizations") else None

        # Route to chat backend for processing
        await route_to_chat_backend(text, user_id, channel_id, team_id)


async def route_to_chat_backend(message: str, user_id: str, channel_id: str, team_id: str):
    """Route message to chat backend for AI processing"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{CHAT_BACKEND_URL}/api/chat",
                json={
                    "message": message,
                    "user_id": f"slack_{user_id}",
                    "channel": channel_id,
                    "source": "slack",
                    "team_id": team_id
                },
                headers={
                    "X-API-Key": os.getenv("API_KEY", "robbie-2025"),
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )

            if response.status_code == 200:
                result = response.json()

                # Send response back to Slack
                await send_slack_message(channel_id, result.get("response", "I'm processing your request..."))

            else:
                logger.error(f"❌ Chat backend error: {response.status_code}")
                await send_slack_message(channel_id, "Sorry, I'm having trouble processing your request right now.")

    except Exception as e:
        logger.error(f"❌ Error routing to chat backend: {e}")
        await send_slack_message(channel_id, "Sorry, I'm having connectivity issues. Please try again later.")


async def send_slack_message(channel_id: str, text: str):
    """Send message to Slack channel"""
    try:
        # Use Slack Web API to send message
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://slack.com/api/chat.postMessage",
                headers={
                    "Authorization": f"Bearer {os.getenv('SLACK_BOT_TOKEN')}",
                    "Content-Type": "application/json"
                },
                json={
                    "channel": channel_id,
                    "text": text
                },
                timeout=10.0
            )

            if response.status_code == 200:
                result = response.json()
                if not result.get("ok"):
                    logger.error(f"❌ Slack API error: {result.get('error')}")
            else:
                logger.error(f"❌ HTTP error sending to Slack: {response.status_code}")

    except Exception as e:
        logger.error(f"❌ Error sending Slack message: {e}")


@fastapi_app.on_event("startup")
async def startup_event():
    """Initialize Slack integration"""
    logger.info(f"🤖 Starting Slack Integration on {NODE_NAME}...")

    # Ensure Slack tables exist
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS slack_workspaces (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
                    team_id TEXT UNIQUE NOT NULL,
                    name TEXT,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS slack_users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
                    team_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    email TEXT,
                    aurora_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(team_id, user_id)
                )
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS slack_channels (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
                    team_id TEXT NOT NULL,
                    channel_id TEXT NOT NULL,
                    name TEXT,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(team_id, channel_id)
                )
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS slack_messages (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
                    team_id TEXT NOT NULL,
                    channel_id TEXT NOT NULL,
                    ts TEXT NOT NULL,
                    user_id TEXT,
                    text TEXT,
                    metadata JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(team_id, channel_id, ts)
                )
            """)

            conn.commit()

        logger.info("✅ Slack integration ready")

    finally:
        conn.close()


@fastapi_app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "slack-integration", "node": NODE_NAME}


@fastapi_app.post("/api/slack/webhook")
async def slack_webhook(body: Dict):
    """Handle Slack webhook events"""
    logger.info(f"🔗 Slack webhook received: {body}")

    # Process webhook and route to appropriate handlers
    event_type = body.get("type")
    event = body.get("event", {})

    if event_type == "event_callback":
        # Handle different event types
        if event.get("type") == "app_mention":
            await handle_app_mention_events(body, logger)
        elif event.get("type") == "message":
            await handle_message_events(body, logger)

    return {"status": "ok"}


@fastapi_app.post("/api/slack/send")
async def send_slack_message_api(channel: str, message: str):
    """API endpoint to send Slack message"""
    await send_slack_message(channel, message)
    return {"status": "sent"}


@fastapi_app.get("/api/slack/workspaces")
async def get_slack_workspaces():
    """Get all configured Slack workspaces"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT * FROM slack_workspaces ORDER BY created_at DESC
                """)

                workspaces = cur.fetchall()
                return {"workspaces": [dict(w) for w in workspaces]}

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"Error getting workspaces: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def run_slack_bot():
    """Run the Slack bot"""
    try:
        # Start Socket Mode handler for real-time events
        handler = SocketModeHandler(app, os.getenv("SLACK_APP_TOKEN"))
        await handler.start_async()

    except Exception as e:
        logger.error(f"❌ Slack bot error: {e}")


async def main():
    """Main entry point"""
    # Start Slack bot in background
    bot_task = asyncio.create_task(run_slack_bot())

    # Start FastAPI server
    import uvicorn
    config = uvicorn.Config(fastapi_app, host="0.0.0.0", port=3003)
    server = uvicorn.Server(config)

    try:
        await server.serve()
    except KeyboardInterrupt:
        logger.info("🛑 Shutting down Slack integration...")
    finally:
        bot_task.cancel()
        await server.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
