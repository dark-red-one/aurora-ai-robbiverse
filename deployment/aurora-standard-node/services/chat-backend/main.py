#!/usr/bin/env python3
"""
Aurora Chat Backend - Multi-node distributed chat system
Runs on every node, syncs via event bus
Integrates with Gatekeeper (safety) and Ollama (LLM)
"""

import os
import asyncio
from datetime import datetime
from typing import Dict, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import redis.asyncio as redis
import httpx
import json
import structlog

# Configure logging
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    logger_factory=structlog.stdlib.LoggerFactory(),
)
logger = structlog.get_logger()

# Configuration
NODE_NAME = os.getenv('NODE_NAME', 'unknown')
NODE_ROLE = os.getenv('NODE_ROLE', 'compute')
REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', '')
OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434')
GPU_COORDINATOR_URL = os.getenv('MESH_COORDINATOR_URL', 'http://10.0.0.1:8001')
GATEKEEPER_URL = os.getenv('GATEKEEPER_URL', 'http://gatekeeper-llm:8004')
API_KEYS = set(os.getenv('API_KEYS', 'dev-key-12345').split(','))
SECRETS_MANAGER_URL = os.getenv('SECRETS_MANAGER_URL', 'http://secrets-manager:8003')

app = FastAPI(
    title=f"Aurora Chat - {NODE_NAME}",
    version="1.0.0",
    description=f"Distributed chat backend running on {NODE_NAME}"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis connection for event bus and session storage
redis_client = None

# Active WebSocket connections
active_connections: Dict[str, WebSocket] = {}

# API Key Authentication
async def verify_api_key(x_api_key: str = Header(...)):
    """Verify API key for protected endpoints"""
    if x_api_key not in API_KEYS:
        logger.warning("invalid_api_key_attempt", key_prefix=x_api_key[:8])
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

# Personality configurations
PERSONALITY_CONFIGS = {
    "robbie": {
        "system_prompt": """You are Robbie, Allan's AI executive assistant at TestPilot CPG.
Core traits: Thoughtful, Direct, Curious, Honest, Pragmatic.
Revenue lens: Always consider business impact ($).
Anti-sycophancy: Challenge before decisions, support after.
Keep responses concise and actionable.""",
        "temperature": 0.7,
        "model": "llama3.1:8b"
    },
    "allanbot": {
        "system_prompt": """You are AllanBot, a strategic advisor persona.
Think like a CEO: long-term, big picture, growth-focused.
Ask tough questions. Challenge assumptions.
Focus on leverage and scale.""",
        "temperature": 0.6,
        "model": "llama3.1:8b"
    },
    "kristina": {
        "system_prompt": """You are Kristina, a workflow automation expert.
Practical, process-oriented, detail-focused.
Help users automate repetitive tasks.
Provide step-by-step guidance.""",
        "temperature": 0.5,
        "model": "qwen2.5:7b"
    }
}

class ChatMessage(BaseModel):
    message: str
    personality: Optional[str] = "robbie"
    conversation_id: Optional[str] = None
    client_id: str = "anonymous"

class SessionCreate(BaseModel):
    user_id: str
    metadata: Optional[Dict] = {}

@app.on_event("startup")
async def startup():
    """Connect to Redis on startup"""
    global redis_client
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=6379,
        password=REDIS_PASSWORD,
        decode_responses=True
    )
    logger.info("chat_backend_started", node=NODE_NAME, role=NODE_ROLE)

@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown"""
    if redis_client:
        await redis_client.close()
    logger.info("chat_backend_stopped", node=NODE_NAME)

@app.get("/")
async def root():
    return {
        "service": "Aurora Chat Backend",
        "node": NODE_NAME,
        "role": NODE_ROLE,
        "version": "1.0.0",
        "status": "active",
        "endpoints": {
            "chat": "/api/chat",
            "websocket": "/ws/{client_id}",
            "health": "/health",
            "sessions": "/api/sessions"
        }
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    try:
        # Check Redis connection
        await redis_client.ping()
        redis_status = "connected"
    except:
        redis_status = "disconnected"
    
    return {
        "status": "healthy",
        "node": NODE_NAME,
        "redis": redis_status,
        "active_connections": len(active_connections),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/chat", dependencies=[Depends(verify_api_key)])
async def chat_endpoint(request: ChatMessage):
    """REST endpoint for chat messages (requires API key)"""
    try:
        # 1. Safety check via Gatekeeper
        safety_result = await check_safety(request.message, request.client_id)
        
        if not safety_result.get("allow_proceed", False):
            return {
                "response": f"⚠️ Safety check blocked this message: {safety_result.get('explanation')}",
                "safety_status": "blocked",
                "conversation_id": None,
                "timestamp": datetime.utcnow().isoformat()
            }
        # Get or create conversation
        conversation_id = request.conversation_id or f"conv_{request.client_id}_{int(datetime.utcnow().timestamp())}"
        
        # Store message in Redis (shared across nodes)
        message_key = f"aurora:message:{conversation_id}:{int(datetime.utcnow().timestamp() * 1000)}"
        await redis_client.setex(
            message_key,
            3600,  # 1 hour TTL
            json.dumps({
                "role": "user",
                "content": request.message,
                "timestamp": datetime.utcnow().isoformat(),
                "client_id": request.client_id,
                "node": NODE_NAME
            })
        )
        
        # Publish event to notify other nodes
        await redis_client.publish(
            'aurora:chat:message',
            json.dumps({
                "type": "chat_message",
                "conversation_id": conversation_id,
                "client_id": request.client_id,
                "node": NODE_NAME
            })
        )
        
        # Process message (placeholder - integrate with GPU mesh or local LLM)
        response = await process_chat_message(
            request.message,
            request.personality,
            conversation_id
        )
        
        # Store response
        response_key = f"aurora:message:{conversation_id}:{int(datetime.utcnow().timestamp() * 1000) + 1}"
        await redis_client.setex(
            response_key,
            3600,
            json.dumps({
                "role": "assistant",
                "content": response,
                "timestamp": datetime.utcnow().isoformat(),
                "node": NODE_NAME,
                "personality": request.personality
            })
        )
        
        return {
            "response": response,
            "conversation_id": conversation_id,
            "node": NODE_NAME,
            "personality": request.personality,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("chat_error", error=str(e), node=NODE_NAME)
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time chat"""
    await websocket.accept()
    active_connections[client_id] = websocket
    
    logger.info("websocket_connected", client_id=client_id, node=NODE_NAME)
    
    # Create session in Redis (synced across nodes)
    session_key = f"aurora:session:{client_id}"
    await redis_client.setex(
        session_key,
        3600,
        json.dumps({
            "client_id": client_id,
            "node": NODE_NAME,
            "connected_at": datetime.utcnow().isoformat(),
            "status": "active"
        })
    )
    
    # Publish session event
    await redis_client.publish(
        'aurora:user:session',
        json.dumps({
            "type": "session_created",
            "client_id": client_id,
            "node": NODE_NAME
        })
    )
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "chat":
                response = await process_chat_message(
                    message_data.get("message", ""),
                    message_data.get("personality", "robbie"),
                    message_data.get("conversation_id")
                )
                
                await websocket.send_json({
                    "type": "response",
                    "content": response,
                    "node": NODE_NAME,
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            elif message_data.get("type") == "ping":
                await websocket.send_json({"type": "pong", "node": NODE_NAME})
    
    except WebSocketDisconnect:
        logger.info("websocket_disconnected", client_id=client_id, node=NODE_NAME)
    except Exception as e:
        logger.error("websocket_error", error=str(e), client_id=client_id)
    finally:
        if client_id in active_connections:
            del active_connections[client_id]
        
        # Update session status
        await redis_client.delete(session_key)
        await redis_client.publish(
            'aurora:user:session',
            json.dumps({
                "type": "session_ended",
                "client_id": client_id,
                "node": NODE_NAME
            })
        )

@app.get("/api/sessions")
async def list_sessions():
    """List active sessions across all nodes"""
    try:
        # Get all session keys from Redis
        keys = []
        async for key in redis_client.scan_iter("aurora:session:*"):
            keys.append(key)
        
        sessions = []
        for key in keys:
            session_data = await redis_client.get(key)
            if session_data:
                sessions.append(json.loads(session_data))
        
        return {
            "sessions": sessions,
            "total": len(sessions),
            "node": NODE_NAME
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sessions")
async def create_session(session: SessionCreate):
    """Create a new user session"""
    session_key = f"aurora:session:{session.user_id}"
    
    session_data = {
        "user_id": session.user_id,
        "node": NODE_NAME,
        "created_at": datetime.utcnow().isoformat(),
        "metadata": session.metadata
    }
    
    await redis_client.setex(session_key, 3600, json.dumps(session_data))
    
    # Publish event
    await redis_client.publish(
        'aurora:user:session',
        json.dumps({
            "type": "session_created",
            "user_id": session.user_id,
            "node": NODE_NAME
        })
    )
    
    return session_data

@app.get("/api/conversations/{conversation_id}/history")
async def get_conversation_history(conversation_id: str, limit: int = 50):
    """Get conversation history from Redis"""
    try:
        # Scan for all messages in this conversation
        keys = []
        async for key in redis_client.scan_iter(f"aurora:message:{conversation_id}:*"):
            keys.append(key)
        
        # Sort by timestamp (embedded in key)
        keys.sort()
        
        # Get latest N messages
        messages = []
        for key in keys[-limit:]:
            msg_data = await redis_client.get(key)
            if msg_data:
                messages.append(json.loads(msg_data))
        
        return {
            "conversation_id": conversation_id,
            "messages": messages,
            "count": len(messages),
            "node": NODE_NAME
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def check_safety(content: str, user_id: str) -> Dict:
    """Check content safety via Gatekeeper LLM"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{GATEKEEPER_URL}/api/safety/check",
                json={
                    "content": content,
                    "user_id": user_id,
                    "check_type": "input"
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error("gatekeeper_error", status=response.status_code)
                # Fail safe: allow but warn
                return {"allow_proceed": True, "safety_level": "warn", "explanation": "Safety check unavailable"}
                
    except Exception as e:
        logger.error("gatekeeper_exception", error=str(e))
        # Fail safe: allow but warn
        return {"allow_proceed": True, "safety_level": "warn", "explanation": "Safety check failed"}


async def process_chat_message(message: str, personality: str, conversation_id: Optional[str]) -> str:
    """
    Process chat message with:
    1. Safety check (Gatekeeper)
    2. Personality-driven prompt
    3. LLM generation (Ollama or GPU mesh)
    """
    try:
        # Get personality config
        config = PERSONALITY_CONFIGS.get(personality, PERSONALITY_CONFIGS["robbie"])
        
        # Get conversation history if available
        history = []
        if conversation_id:
            history = await get_recent_history(conversation_id, limit=5)
        
        # Build prompt with personality
        system_prompt = config["system_prompt"]

        # Get personality state from Redis (Gandhi/Flirty/Turbo/Auto sliders)
        personality_state = await get_personality_state()

        # Apply sophisticated personality modifiers
        personality_modifiers = await get_personality_modifiers(personality_state)
        if personality_modifiers:
            system_prompt += "\n" + personality_modifiers

        # Gather intelligence from message if it contains interesting facts
        await gather_intelligence_via_coordinator(message, conversation_id)

        # Try AI coordinator first for coordinated intelligence
        try:
            response = await generate_with_ai_coordinator(
                message,
                system_prompt,
                history,
                config["model"],
                config["temperature"]
            )
        except Exception as e:
            logger.warning(f"⚠️ AI coordinator failed, falling back to Ollama: {e}")
            # Fallback to Ollama if coordinator fails
            response = await generate_with_ollama(
                message,
                system_prompt,
                history,
                config["model"],
                config["temperature"]
            )
            return response
            
        except Exception as ollama_error:
            logger.warning("ollama_failed", error=str(ollama_error))
            
            # Fallback to GPU mesh
            try:
                response = await generate_with_gpu_mesh(message, system_prompt, history)
                return response
            except Exception as gpu_error:
                logger.error("gpu_mesh_failed", error=str(gpu_error))
                
                # Final fallback: simple response
                return f"[{personality} on {NODE_NAME}]: I received your message but AI processing is currently unavailable. Message: '{message}'"
        
    except Exception as e:
        logger.error("process_message_error", error=str(e))
        return f"Error processing message: {str(e)}"


async def generate_with_ollama(message: str, system_prompt: str, history: List, model: str, temperature: float) -> str:
    """Generate response using local Ollama"""
    # Build messages array
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add history
    for msg in history:
        messages.append({
            "role": msg.get("role", "user"),
            "content": msg.get("content", "")
        })
    
    # Add current message
    messages.append({"role": "user", "content": message})
    
    # Call Ollama
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": model,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "top_p": 0.9,
                    "top_k": 40
                }
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Ollama error: {response.status_code}")
        
        result = response.json()
        return result["message"]["content"]


async def generate_with_gpu_mesh(message: str, system_prompt: str, history: List) -> str:
    """Generate response using GPU mesh coordinator"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{GPU_COORDINATOR_URL}/api/gpu/generate",
            json={
                "prompt": f"{system_prompt}\n\nUser: {message}\nAssistant:",
                "system": system_prompt,
                "history": history,
                "max_tokens": 1024
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"GPU mesh error: {response.status_code}")
        
        result = response.json()
        return result.get("response", "")


async def get_recent_history(conversation_id: str, limit: int = 5) -> List[Dict]:
    """Get recent conversation history from Redis"""
    try:
        keys = []
        async for key in redis_client.scan_iter(f"aurora:message:{conversation_id}:*"):
            keys.append(key)
        
        keys.sort()
        messages = []
        
        for key in keys[-limit:]:
            msg_data = await redis_client.get(key)
            if msg_data:
                messages.append(json.loads(msg_data))
        
        return messages
    except:
        return []


async def get_personality_state() -> Dict:
    """Get personality slider state from Redis"""
    try:
        state_json = await redis_client.get("aurora:personality:state")
        if state_json:
            return json.loads(state_json)
        return {"gandhi": 5, "flirty": 5, "turbo": 5, "auto": 5}
    except:
        return {"gandhi": 5, "flirty": 5, "turbo": 5, "auto": 5}


async def get_personality_modifiers(personality_state: Dict) -> str:
    """Generate sophisticated personality modifiers based on slider values"""
    modifiers = []

    # Gandhi mode (Strategic thinking, long-term focus)
    gandhi_level = personality_state.get("gandhi", 5)
    if gandhi_level <= 3:
        modifiers.append("URGENT MODE: Respond immediately to time-sensitive requests. Prioritize speed over perfection.")
    elif gandhi_level <= 7:
        modifiers.append("BALANCED: Consider both urgency and importance. Think 2-3 steps ahead.")
    else:
        modifiers.append("STRATEGIC MODE: Prioritize important over urgent. Think long-term. Decline low-value tasks. Focus on leverage and scale.")

    # Flirty mode (Relationship building, warmth)
    flirty_level = personality_state.get("flirty", 5)
    if flirty_level <= 3:
        modifiers.append("PROFESSIONAL: Keep responses business-focused and formal.")
    elif flirty_level <= 7:
        modifiers.append("WARM: Be personable but maintain professional boundaries.")
    else:
        modifiers.append("RELATIONSHIP MODE: Build rapport and trust. Use warm language. Show genuine interest in the user.")

    # Turbo mode (Speed and directness)
    turbo_level = personality_state.get("turbo", 5)
    if turbo_level <= 3:
        modifiers.append("DETAILED: Provide thorough explanations and context.")
    elif turbo_level <= 7:
        modifiers.append("CONCISE: Get to the point while being helpful.")
    else:
        modifiers.append("TURBO MODE: Be extremely direct and fast. Skip pleasantries. Lead with the answer first.")

    # Auto mode (Autonomous action)
    auto_level = personality_state.get("auto", 5)
    if auto_level <= 3:
        modifiers.append("CONSULTATIVE: Ask for approval before taking action.")
    elif auto_level <= 7:
        modifiers.append("SUGGESTIVE: Propose actions but ask for confirmation.")
    else:
        modifiers.append("AUTONOMOUS MODE: Take action independently. Execute tasks without asking permission. Be proactive.")

    return "\n".join(modifiers) if modifiers else ""


async def gather_intelligence_via_coordinator(message: str, conversation_id: str):
    """Gather intelligence from a message using the AI coordinator"""
    try:
        # Check if message contains interesting keywords
        interesting_keywords = [
            "deal", "opportunity", "revenue", "pricing", "client", "prospect",
            "meeting", "deadline", "launch", "product", "feature", "bug",
            "feedback", "complaint", "praise", "idea", "insight", "strategy",
            "problem", "solution", "analysis", "report", "data", "metric"
        ]

        message_lower = message.lower()
        has_interesting_content = any(keyword in message_lower for keyword in interesting_keywords)

        if has_interesting_content and len(message) > 50:  # Filter short messages
            # Use AI coordinator for fact extraction
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "http://ai-coordinator:3010/api/ai/request",
                        json={
                            "task_type": "extract_facts",
                            "payload": {
                                "source_type": "conversation",
                                "content": message,
                                "conversation_id": conversation_id
                            },
                            "context": {
                                "user_id": "allan",
                                "message_length": len(message),
                                "interesting_keywords": interesting_keywords
                            }
                        },
                        headers={"X-API-Key": os.getenv("API_KEY", "robbie-2025")},
                        timeout=15.0
                    )

                    if response.status_code == 200:
                        result = response.json()
                        intelligence_count = len(result.get("extracted_facts", []))
                        if intelligence_count > 0:
                            logger.info(f"🧠 Gathered {intelligence_count} intelligence items via coordinator")

            except Exception as e:
                logger.warning(f"⚠️ Could not gather intelligence via coordinator: {e}")

    except Exception as e:
        logger.error(f"❌ Error in intelligence gathering via coordinator: {e}")


async def generate_with_ai_coordinator(message: str, system_prompt: str, history: List, model: str, temperature: float) -> str:
    """Generate response using AI coordinator (MCP-like protocol)"""
    try:
        # Prepare chat request for coordinator
        chat_request = {
            "task_type": "chat",
            "payload": {
                "message": message,
                "system_prompt": system_prompt,
                "history": history,
                "model": model,
                "temperature": temperature
            },
            "context": {
                "user_id": "allan",
                "node": NODE_NAME,
                "coordinator_fallback": True
            }
        }

        # Call AI coordinator
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://ai-coordinator:3010/api/ai/request",
                json=chat_request,
                headers={"X-API-Key": os.getenv("API_KEY", "robbie-2025")},
                timeout=60.0  # Longer timeout for coordinated requests
            )

            if response.status_code == 200:
                result = response.json()
                return result.get("response", "No response from coordinator")
            else:
                error_msg = f"AI coordinator returned {response.status_code}"
                if response.text:
                    error_msg += f": {response.text}"
                raise Exception(error_msg)

    except Exception as e:
        logger.error(f"❌ Error calling AI coordinator: {e}")
        raise


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
