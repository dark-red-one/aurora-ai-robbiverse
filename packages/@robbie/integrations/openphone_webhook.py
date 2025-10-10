"""
OpenPhone Webhooks
==================
FastAPI webhooks for incoming OpenPhone SMS and voice calls.

Register these endpoints in your OpenPhone dashboard:
- SMS: POST /webhooks/openphone/sms
- Voice: POST /webhooks/openphone/voice
"""

import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

from .openphone_handler import openphone_handler

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/openphone", tags=["openphone"])


# ============================================
# PYDANTIC MODELS
# ============================================

class OpenPhoneSMSWebhook(BaseModel):
    """Incoming SMS webhook from OpenPhone"""
    id: str
    object: str = "message"
    createdAt: str
    direction: str = "incoming"
    from_: str = Field(..., alias="from")
    to: List[str]
    media: Optional[List[Dict[str, Any]]] = []
    body: str
    status: str


class OpenPhoneVoiceWebhook(BaseModel):
    """Incoming voice call webhook from OpenPhone"""
    id: str
    object: str = "call"
    createdAt: str
    direction: str = "incoming"
    from_: str = Field(..., alias="from")
    to: str
    status: str
    duration: Optional[int] = None
    recording: Optional[Dict[str, Any]] = None
    transcription: Optional[str] = None


# ============================================
# WEBHOOK ENDPOINTS
# ============================================

@router.post("/sms")
async def openphone_sms_webhook(webhook: OpenPhoneSMSWebhook):
    """
    Handle incoming SMS from OpenPhone
    
    OpenPhone will call this endpoint when an SMS is received.
    We route it through the universal input API and send a reply.
    """
    try:
        logger.info(f"📱 OpenPhone SMS webhook received from {webhook.from_}")
        
        # Only process incoming messages
        if webhook.direction != "incoming":
            logger.info(f"Ignoring {webhook.direction} message")
            return {"status": "ignored", "reason": "not_incoming"}
        
        # Look up user by phone number
        user_id = openphone_handler.lookup_user_by_phone(webhook.from_)
        
        # Handle the SMS
        result = await openphone_handler.handle_incoming_sms(
            from_number=webhook.from_,
            message_body=webhook.body,
            user_id=user_id
        )
        
        if result['success']:
            return {
                "status": "success",
                "message": "SMS processed and reply sent",
                "response": result['response'],
                "mood": result['mood']
            }
        else:
            logger.error(f"Failed to process SMS: {result.get('error')}")
            return {
                "status": "error",
                "message": result.get('error', 'Unknown error')
            }
    
    except Exception as e:
        logger.error(f"Error in SMS webhook: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")


@router.post("/voice")
async def openphone_voice_webhook(webhook: OpenPhoneVoiceWebhook):
    """
    Handle incoming voice call from OpenPhone
    
    OpenPhone will call this endpoint when a voice call is received.
    If transcription is available, we route it through the universal input API.
    """
    try:
        logger.info(f"📞 OpenPhone voice webhook received from {webhook.from_}")
        
        # Only process incoming calls
        if webhook.direction != "incoming":
            logger.info(f"Ignoring {webhook.direction} call")
            return {"status": "ignored", "reason": "not_incoming"}
        
        # Check if we have a transcription
        if not webhook.transcription:
            logger.info("No transcription available yet")
            return {
                "status": "pending",
                "message": "Waiting for transcription"
            }
        
        # Look up user by phone number
        user_id = openphone_handler.lookup_user_by_phone(webhook.from_)
        
        # Handle the voice call
        result = await openphone_handler.handle_incoming_call(
            from_number=webhook.from_,
            transcribed_text=webhook.transcription,
            user_id=user_id
        )
        
        if result['success']:
            return {
                "status": "success",
                "message": "Voice call processed",
                "response": result['response'],
                "mood": result['mood'],
                "speak": result.get('speak', False)
            }
        else:
            logger.error(f"Failed to process voice call: {result.get('error')}")
            return {
                "status": "error",
                "message": result.get('error', 'Unknown error')
            }
    
    except Exception as e:
        logger.error(f"Error in voice webhook: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")


@router.get("/health")
async def openphone_webhook_health():
    """Health check for OpenPhone webhooks"""
    return {
        "status": "healthy",
        "service": "openphone-webhooks",
        "endpoints": {
            "sms": "/webhooks/openphone/sms",
            "voice": "/webhooks/openphone/voice"
        }
    }
