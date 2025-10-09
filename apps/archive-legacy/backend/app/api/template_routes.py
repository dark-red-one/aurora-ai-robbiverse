"""
Aurora RobbieVerse - Conversation Templates API Routes
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.services.conversation_templates import template_manager

router = APIRouter(prefix="/templates", tags=["templates"])


class CreateTemplateRequest(BaseModel):
    user_id: str
    name: str
    description: str
    category: str
    personality: str
    initial_messages: List[Dict[str, str]]
    suggested_topics: List[str]
    context_settings: Dict[str, Any]


class UseTemplateRequest(BaseModel):
    user_id: str
    template_id: str
    custom_title: Optional[str] = None
    custom_metadata: Optional[Dict[str, Any]] = None


@router.get("/available")
async def get_available_templates(category: Optional[str] = None):
    try:
        templates = await template_manager.get_available_templates(category)
        return {"templates": templates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
async def get_template_categories():
    try:
        cats = await template_manager.get_template_categories()
        return {"categories": cats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_custom_template(payload: CreateTemplateRequest):
    try:
        result = await template_manager.create_custom_template(
            user_id=payload.user_id,
            name=payload.name,
            description=payload.description,
            category=payload.category,
            personality=payload.personality,
            initial_messages=payload.initial_messages,
            suggested_topics=payload.suggested_topics,
            context_settings=payload.context_settings
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/use")
async def create_conversation_from_template(payload: UseTemplateRequest):
    try:
        result = await template_manager.create_conversation_from_template(
            template_id=payload.template_id,
            user_id=payload.user_id,
            custom_title=payload.custom_title,
            custom_metadata=payload.custom_metadata
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{user_id}")
async def get_user_templates(user_id: str):
    try:
        templates = await template_manager.get_user_templates(user_id)
        return {"user_id": user_id, "templates": templates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/{user_id}")
async def get_template_recommendations(user_id: str):
    try:
        recs = await template_manager.get_template_recommendations(user_id)
        return {"user_id": user_id, "recommendations": recs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))






















































