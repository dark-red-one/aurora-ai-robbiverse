"""
Aurora RobbieVerse - Personality API Routes
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.services.ai.personality_manager import personality_manager

router = APIRouter(prefix="/personalities", tags=["personalities"])


class SwitchPersonalityRequest(BaseModel):
    conversation_id: str
    personality_id: str
    user_id: Optional[str] = None


class CreateCustomPersonalityRequest(BaseModel):
    user_id: str
    name: str
    description: str
    traits: List[str]
    communication_style: str
    expertise: List[str]
    personality_prompt: str
    response_style: Optional[str] = "balanced"
    emoji_usage: Optional[str] = "moderate"
    formality_level: Optional[str] = "casual"


@router.get("/available")
async def get_available_personalities():
    try:
        personalities = await personality_manager.get_available_personalities()
        return {"personalities": personalities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}")
async def get_conversation_personality(conversation_id: str):
    try:
        result = await personality_manager.get_conversation_personality(conversation_id)
        return {"conversation_id": conversation_id, "personality": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/switch")
async def switch_personality(payload: SwitchPersonalityRequest):
    try:
        result = await personality_manager.switch_conversation_personality(
            conversation_id=payload.conversation_id,
            personality_id=payload.personality_id,
            user_id=payload.user_id
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/custom")
async def create_custom_personality(payload: CreateCustomPersonalityRequest):
    try:
        result = await personality_manager.create_custom_personality(
            user_id=payload.user_id,
            name=payload.name,
            description=payload.description,
            traits=payload.traits,
            communication_style=payload.communication_style,
            expertise=payload.expertise,
            personality_prompt=payload.personality_prompt,
            response_style=payload.response_style,
            emoji_usage=payload.emoji_usage,
            formality_level=payload.formality_level,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}/recommendations")
async def get_personality_recommendations(conversation_id: str, context_window: int = Query(10, ge=1, le=100)):
    try:
        recs = await personality_manager.get_personality_recommendations(conversation_id, context_window)
        return {"conversation_id": conversation_id, "recommendations": recs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



















































