"""
Aurora RobbieVerse - Mood API Routes
REST endpoints for mood management and real-time updates
"""
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
import json
import structlog
from datetime import datetime

from app.services.ai.mood_analyzer import mood_analyzer, MoodRecommendation
from app.websockets.manager import ConnectionManager

logger = structlog.get_logger()

# API Router
router = APIRouter(prefix="/mood", tags=["mood"])

# WebSocket connection manager for mood updates
mood_manager = ConnectionManager()

# Pydantic models
class MoodRequest(BaseModel):
    user_id: str
    platform_context: str = "private"
    activity_data: Optional[Dict[str, Any]] = None

class ActivityData(BaseModel):
    user_id: str
    activity_type: str  # "typing", "clicking", "idle", "message_sent", etc.
    platform: str
    data: Dict[str, Any]

class PersonalityUpdate(BaseModel):
    user_id: str
    gandhi: int
    flirty: int
    turbo: int
    auto: int

@router.post("/analyze")
async def analyze_mood(request: MoodRequest) -> Dict[str, Any]:
    """
    Analyze and get mood recommendation for a user
    """
    try:
        recommendation = await mood_analyzer.analyze_mood(
            user_id=request.user_id,
            platform_context=request.platform_context
        )
        
        # Store activity data if provided
        if request.activity_data:
            await _store_activity_data(request.user_id, request.activity_data)
        
        # Broadcast mood update to connected clients
        await _broadcast_mood_update(request.user_id, recommendation)
        
        return {
            "user_id": request.user_id,
            "mood": recommendation.mood,
            "duration": recommendation.duration,
            "confidence": recommendation.confidence,
            "reasoning": recommendation.reasoning,
            "alternative_moods": recommendation.alternative_moods,
            "user_specific": recommendation.user_specific,
            "context_universal": recommendation.context_universal,
            "timestamp": recommendation.timestamp if hasattr(recommendation, 'timestamp') else None
        }
        
    except Exception as e:
        logger.error("Mood analysis failed", user_id=request.user_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Mood analysis failed: {str(e)}")

@router.get("/current/{user_id}")
async def get_current_mood(user_id: str) -> Dict[str, Any]:
    """
    Get current mood state for a user
    """
    try:
        current_mood = await mood_analyzer.get_current_mood(user_id)
        
        if current_mood:
            return {
                "user_id": user_id,
                "mood": current_mood.mood,
                "duration": current_mood.duration,
                "confidence": current_mood.confidence,
                "reasoning": current_mood.reasoning,
                "active": True
            }
        else:
            return {
                "user_id": user_id,
                "mood": "friendly",
                "duration": None,
                "confidence": 1.0,
                "reasoning": "Default mood - no active mood state",
                "active": False
            }
            
    except Exception as e:
        logger.error("Failed to get current mood", user_id=user_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get current mood: {str(e)}")

@router.post("/activity")
async def track_activity(activity: ActivityData) -> Dict[str, Any]:
    """
    Track user activity and trigger mood analysis
    """
    try:
        # Store activity data
        await _store_activity_data(activity.user_id, {
            "activity_type": activity.activity_type,
            "platform": activity.platform,
            "data": activity.data
        })
        
        # Trigger mood analysis based on activity
        mood_recommendation = await _analyze_activity_mood(activity)
        
        # Broadcast mood update
        await _broadcast_mood_update(activity.user_id, mood_recommendation)
        
        return {
            "user_id": activity.user_id,
            "activity_tracked": True,
            "mood_updated": True,
            "new_mood": mood_recommendation.mood,
            "reasoning": mood_recommendation.reasoning
        }
        
    except Exception as e:
        logger.error("Activity tracking failed", user_id=activity.user_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Activity tracking failed: {str(e)}")

@router.post("/personality/update")
async def update_personality(personality: PersonalityUpdate) -> Dict[str, Any]:
    """
    Update user personality settings and trigger mood analysis
    """
    try:
        # Store personality state
        await _store_personality_state(personality)
        
        # Trigger mood analysis with new personality
        recommendation = await mood_analyzer.analyze_mood(
            user_id=personality.user_id,
            platform_context="private"
        )
        
        # Broadcast mood update
        await _broadcast_mood_update(personality.user_id, recommendation)
        
        return {
            "user_id": personality.user_id,
            "personality_updated": True,
            "mood_updated": True,
            "new_mood": recommendation.mood,
            "reasoning": recommendation.reasoning
        }
        
    except Exception as e:
        logger.error("Personality update failed", user_id=personality.user_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Personality update failed: {str(e)}")

@router.get("/history/{user_id}")
async def get_mood_history(user_id: str, limit: int = 20) -> Dict[str, Any]:
    """
    Get mood history for a user
    """
    try:
        from app.db.database import database
        
        result = await database.fetch_all("""
            SELECT mood, confidence, reasoning, created_at, expires_at
            FROM user_mood_state
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT :limit
        """, {"user_id": user_id, "limit": limit})
        
        mood_history = [
            {
                "mood": row["mood"],
                "confidence": row["confidence"],
                "reasoning": row["reasoning"],
                "created_at": row["created_at"].isoformat(),
                "expires_at": row["expires_at"].isoformat() if row["expires_at"] else None
            }
            for row in result
        ]
        
        return {
            "user_id": user_id,
            "mood_history": mood_history,
            "total_count": len(mood_history)
        }
        
    except Exception as e:
        logger.error("Failed to get mood history", user_id=user_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get mood history: {str(e)}")

@router.websocket("/ws/{user_id}")
async def mood_websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time mood updates
    """
    await mood_manager.connect(websocket, user_id)
    logger.info("Mood WebSocket client connected", user_id=user_id)
    
    try:
        # Send current mood on connection
        current_mood = await mood_analyzer.get_current_mood(user_id)
        if current_mood:
            await mood_manager.send_personal_message({
                "type": "mood_update",
                "mood": current_mood.mood,
                "duration": current_mood.duration,
                "confidence": current_mood.confidence,
                "reasoning": current_mood.reasoning,
                "timestamp": current_mood.timestamp if hasattr(current_mood, 'timestamp') else None
            }, user_id)
        
        while True:
            # Receive activity data from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "activity":
                # Track activity and analyze mood
                activity_data = message.get("data", {})
                await _store_activity_data(user_id, activity_data)
                
                # Trigger mood analysis
                recommendation = await _analyze_activity_mood(ActivityData(
                    user_id=user_id,
                    activity_type=activity_data.get("activity_type", "unknown"),
                    platform=activity_data.get("platform", "unknown"),
                    data=activity_data
                ))
                
                # Send mood update
                await mood_manager.send_personal_message({
                    "type": "mood_update",
                    "mood": recommendation.mood,
                    "duration": recommendation.duration,
                    "confidence": recommendation.confidence,
                    "reasoning": recommendation.reasoning,
                    "trigger": "activity"
                }, user_id)
            
            elif message.get("type") == "ping":
                # Respond to ping
                await mood_manager.send_personal_message({
                    "type": "pong",
                    "timestamp": message.get("timestamp")
                }, user_id)
                
    except WebSocketDisconnect:
        mood_manager.disconnect(user_id)
        logger.info("Mood WebSocket client disconnected", user_id=user_id)

# Helper functions
async def _store_activity_data(user_id: str, activity_data: Dict[str, Any]):
    """Store user activity data"""
    try:
        from app.db.database import database
        
        await database.execute("""
            INSERT INTO user_activity (
                user_id, activity_type, platform, data, created_at
            ) VALUES (
                :user_id, :activity_type, :platform, :data, NOW()
            )
        """, {
            "user_id": user_id,
            "activity_type": activity_data.get("activity_type", "unknown"),
            "platform": activity_data.get("platform", "unknown"),
            "data": json.dumps(activity_data)
        })
        
    except Exception as e:
        logger.error("Failed to store activity data", user_id=user_id, error=str(e))

async def _store_personality_state(personality: PersonalityUpdate):
    """Store personality state"""
    try:
        from app.db.database import database
        
        await database.execute("""
            INSERT INTO user_personality_state (
                user_id, gandhi, flirty, turbo, auto, updated_at
            ) VALUES (
                :user_id, :gandhi, :flirty, :turbo, :auto, NOW()
            )
            ON CONFLICT (user_id) DO UPDATE SET
                gandhi = EXCLUDED.gandhi,
                flirty = EXCLUDED.flirty,
                turbo = EXCLUDED.turbo,
                auto = EXCLUDED.auto,
                updated_at = NOW()
        """, {
            "user_id": personality.user_id,
            "gandhi": personality.gandhi,
            "flirty": personality.flirty,
            "turbo": personality.turbo,
            "auto": personality.auto
        })
        
    except Exception as e:
        logger.error("Failed to store personality state", user_id=personality.user_id, error=str(e))

async def _analyze_activity_mood(activity: ActivityData) -> MoodRecommendation:
    """Analyze mood based on specific activity"""
    try:
        # Determine platform context
        platform_context = "public" if activity.platform in ["cursor_public", "robbiebook_public"] else "private"
        
        # Trigger mood analysis
        return await mood_analyzer.analyze_mood(
            user_id=activity.user_id,
            platform_context=platform_context
        )
        
    except Exception as e:
        logger.error("Activity mood analysis failed", user_id=activity.user_id, error=str(e))
        # Return fallback mood
        return MoodRecommendation(
            mood="friendly",
            duration=None,
            confidence=0.5,
            reasoning="Fallback mood due to analysis failure",
            alternative_moods=["friendly"],
            mood_intensity="normal",
            transition_style="smooth",
            user_specific=True,
            context_universal=True
        )

async def _broadcast_mood_update(user_id: str, recommendation: MoodRecommendation):
    """Broadcast mood update to connected clients"""
    try:
        message = {
            "type": "mood_update",
            "user_id": user_id,
            "mood": recommendation.mood,
            "duration": recommendation.duration,
            "confidence": recommendation.confidence,
            "reasoning": recommendation.reasoning,
            "user_specific": recommendation.user_specific,
            "context_universal": recommendation.context_universal,
            "timestamp": datetime.now().isoformat()
        }
        
        # Send to mood WebSocket clients
        await mood_manager.send_personal_message(message, user_id)
        
        # Also broadcast to main WebSocket manager for general updates
        # TODO: Fix WebSocket manager import when available
        # from app.websockets.manager import manager
        # await manager.send_personal_message(json.dumps(message), user_id)
        
    except Exception as e:
        logger.error("Failed to broadcast mood update", user_id=user_id, error=str(e))
