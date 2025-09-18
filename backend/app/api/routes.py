"""
Aurora RobbieVerse - API Routes with Dual LLM Integration
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
import asyncio

from app.db.database import database
from app.api.oauth import router as oauth_router
from app.services.ai.dual_llm_coordinator import DualLLMCoordinator

api_router = APIRouter()
api_router.include_router(oauth_router, prefix='/auth', tags=['auth'])

# Initialize dual LLM system
dual_llm = DualLLMCoordinator()

@api_router.get("/")
async def api_root():
    """API root endpoint"""
    return {"message": "Aurora RobbieVerse API v1", "status": "active", "features": ["dual_llm", "websockets", "real_time"]}

@api_router.get("/mentors")
async def get_mentors():
    """Get all available mentors"""
    query = "SELECT id, name, description, avatar_url, is_active FROM mentors WHERE is_active = true"
    mentors = await database.fetch_all(query)
    return {"mentors": [dict(mentor) for mentor in mentors]}

@api_router.get("/conversations")
async def get_conversations(user_id: str = "default"):
    """Get conversations for a user"""
    query = """
    SELECT id, title, created_at, updated_at, is_archived 
    FROM conversations 
    WHERE user_id = :user_id OR :user_id = 'default'
    ORDER BY updated_at DESC
    LIMIT 50
    """
    conversations = await database.fetch_all(query, {"user_id": user_id})
    return {"conversations": [dict(conv) for conv in conversations]}

@api_router.post("/chat")
async def chat_endpoint(message: dict):
    """Process chat message through dual LLM system"""
    user_message = message.get("message", "")
    client_id = message.get("client_id", "anonymous")
    context = message.get("context", {})
    
    if not user_message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    # Process through dual LLM system (Robbie + Gatekeeper)
    result = await dual_llm.process_user_message(user_message, client_id, context)
    
    return {
        "response": result["response"],
        "client_id": client_id,
        "source": result["source"],
        "safety_status": result["safety_status"],
        "confidence": result.get("robbie_confidence", 0.8),
        "processing_time_ms": result["processing_time_ms"],
        "timestamp": result["timestamp"]
    }

@api_router.get("/ai/status")
async def get_ai_status():
    """Get comprehensive AI system status"""
    status = await dual_llm.get_system_status()
    return status

@api_router.get("/ai/robbie/status")
async def get_robbie_status():
    """Get Robbie AI status"""
    return dual_llm.robbie.get_status()

@api_router.get("/ai/gatekeeper/status")
async def get_gatekeeper_status():
    """Get Gatekeeper AI status"""
    return dual_llm.gatekeeper.get_security_status()

@api_router.post("/ai/safety/check")
async def safety_check_endpoint(request: dict):
    """Manual safety check for content"""
    content = request.get("content", "")
    user_id = request.get("user_id", "anonymous")
    
    if not content:
        raise HTTPException(status_code=400, detail="Content is required")
    
    result = await dual_llm.gatekeeper.safety_check(content, user_id)
    return result

@api_router.get("/ai/conversations/{user_id}/audit")
async def audit_user_conversation(user_id: str):
    """Audit specific user conversation for safety compliance"""
    audit = await dual_llm.audit_user_conversation(user_id)
    return audit

@api_router.post("/ai/safety/mode")
async def set_safety_mode(request: dict):
    """Set safety mode: strict, moderate, or permissive"""
    mode = request.get("mode", "strict")
    dual_llm.set_safety_mode(mode)
    return {"message": f"Safety mode set to {mode}", "current_mode": dual_llm.safety_mode}

@api_router.get("/system/status")
async def system_status():
    """Get comprehensive system status"""
    try:
        # Test database
        db_result = await database.fetch_one("SELECT COUNT(*) as mentor_count FROM mentors")
        db_status = "connected"
        mentor_count = db_result["mentor_count"] if db_result else 0
    except Exception as e:
        db_status = f"error: {str(e)}"
        mentor_count = 0
    
    # Get AI system status
    ai_status = await dual_llm.get_system_status()
    
    return {
        "status": "operational",
        "version": "1.0.0",
        "database": {
            "status": db_status,
            "mentors": mentor_count
        },
        "ai_system": ai_status,
        "components": {
            "api": "running",
            "websockets": "running", 
            "database": db_status,
            "dual_llm": "active"
        }
    }

@api_router.post("/test/conversation")
async def test_conversation_endpoint():
    """Test endpoint for dual LLM conversation"""
    test_messages = [
        "Hello, who are you?",
        "What can you help me with?", 
        "Tell me about the Aurora system",
        "How does the safety system work?"
    ]
    
    results = []
    for msg in test_messages:
        result = await dual_llm.process_user_message(msg, "test_user")
        results.append({
            "input": msg,
            "output": result["response"],
            "source": result["source"],
            "safety_status": result["safety_status"]
        })
        await asyncio.sleep(0.1)  # Brief pause between messages
    
    return {
        "test_results": results,
        "system_status": await dual_llm.get_system_status()
    }
