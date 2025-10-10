"""
OpenPhone Webhook Endpoints
============================
FastAPI routes for OpenPhone webhook callbacks.

Configure in OpenPhone dashboard:
- SMS webhook: https://your-domain.com/webhooks/openphone/sms
- Voice webhook: https://your-domain.com/webhooks/openphone/voice

All requests route through universal input API for:
- Personality-aware responses
- Vector search context
- Consistent mood across channels
- Comprehensive logging
"""

import logging
from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any
from datetime import datetime

from .openphone_handler import (
    handle_incoming_sms,
    handle_incoming_call
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/openphone", tags=["openphone"])


@router.post("/sms")
async def openphone_sms_webhook(request: Request) -> Dict[str, Any]:
    """
    Webhook for incoming SMS from OpenPhone
    
    OpenPhone will POST here when SMS arrives:
    {
      "id": "msg_xxx",
      "from": "+1234567890",
      "to": "+1987654321",
      "text": "Hey Robbie, what's my pipeline worth?",
      "createdAt": "2025-10-10T12:00:00Z",
      "direction": "incoming"
    }
    """
    try:
        data = await request.json()
        
        # Extract SMS details
        phone_number = data.get('from')
        message_text = data.get('text', '')
        message_id = data.get('id')
        timestamp = data.get('createdAt')
        
        if not phone_number or not message_text:
            raise HTTPException(status_code=400, detail="Missing required fields: 'from' or 'text'")
        
        logger.info(f"📱 SMS webhook triggered - from {phone_number}")
        
        # Identify user (for now, assume Allan)
        # TODO: Add phone number to user mapping
        user_id = 'allan'
        
        # Build metadata
        metadata = {
            'message_id': message_id,
            'timestamp': timestamp,
            'direction': data.get('direction'),
            'openphone_data': data
        }
        
        # Process through universal input
        response_message = await handle_incoming_sms(
            phone_number=phone_number,
            message=message_text,
            user_id=user_id,
            metadata=metadata
        )
        
        return {
            "status": "processed",
            "message_id": message_id,
            "response_sent": True,
            "response_preview": response_message[:100],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"SMS webhook error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"SMS processing failed: {str(e)}")


@router.post("/voice")
async def openphone_voice_webhook(request: Request) -> Dict[str, Any]:
    """
    Webhook for voice calls from OpenPhone
    
    OpenPhone will POST here during/after voice call:
    {
      "id": "call_xxx",
      "from": "+1234567890",
      "to": "+1987654321",
      "transcription": "Hey Robbie, can you tell me about my top deals?",
      "duration": 45,
      "createdAt": "2025-10-10T12:00:00Z",
      "status": "completed"
    }
    """
    try:
        data = await request.json()
        
        # Extract call details
        phone_number = data.get('from')
        transcription = data.get('transcription', '')
        call_id = data.get('id')
        duration = data.get('duration')
        timestamp = data.get('createdAt')
        
        if not phone_number:
            raise HTTPException(status_code=400, detail="Missing required field: 'from'")
        
        if not transcription:
            # No transcription yet - might be real-time call
            return {
                "status": "waiting",
                "message": "Waiting for transcription"
            }
        
        logger.info(f"📞 Voice webhook triggered - from {phone_number}, duration {duration}s")
        
        # Identify user
        user_id = 'allan'
        
        # Build metadata
        metadata = {
            'call_id': call_id,
            'timestamp': timestamp,
            'duration': duration,
            'status': data.get('status'),
            'openphone_data': data
        }
        
        # Process through universal input
        response_message = await handle_incoming_call(
            phone_number=phone_number,
            transcribed_text=transcription,
            user_id=user_id,
            metadata=metadata
        )
        
        return {
            "status": "processed",
            "call_id": call_id,
            "speech_response": response_message,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Voice webhook error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Voice processing failed: {str(e)}")


@router.post("/status")
async def openphone_status_webhook(request: Request) -> Dict[str, Any]:
    """
    Webhook for OpenPhone status updates (delivery receipts, etc.)
    
    OpenPhone sends status updates for messages/calls:
    {
      "id": "msg_xxx",
      "status": "delivered|failed|read",
      "updatedAt": "2025-10-10T12:00:01Z"
    }
    """
    try:
        data = await request.json()
        
        message_id = data.get('id')
        status = data.get('status')
        
        logger.info(f"📊 OpenPhone status update - {message_id}: {status}")
        
        # Log status update (could store in DB for analytics)
        # For now, just acknowledge
        
        return {
            "status": "acknowledged",
            "message_id": message_id,
            "received_status": status
        }
        
    except Exception as e:
        logger.error(f"Status webhook error: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/health")
async def openphone_health():
    """Health check for OpenPhone integration"""
    
    has_api_key = bool(OPENPHONE_API_KEY)
    has_phone_number = bool(OPENPHONE_NUMBER)
    
    return {
        "status": "healthy" if (has_api_key and has_phone_number) else "misconfigured",
        "api_key_configured": has_api_key,
        "phone_number_configured": has_phone_number,
        "universal_input_url": UNIVERSAL_INPUT_URL
    }


# ============================================
# HELPER: Identify User by Phone Number
# ============================================

async def identify_user_by_phone(phone_number: str) -> str:
    """
    Identify user by phone number
    
    For now, returns 'allan' for Allan's number, 'guest' for others.
    TODO: Add phone number mapping in database.
    
    Args:
        phone_number: Phone number to identify
    
    Returns:
        user_id string
    """
    # Allan's numbers (add to .env)
    allan_numbers = os.getenv('ALLAN_PHONE_NUMBERS', '').split(',')
    
    if phone_number in allan_numbers:
        return 'allan'
    else:
        # For other numbers, could check contacts table
        # For now, return guest
        logger.info(f"Unknown phone number: {phone_number} - treating as guest")
        return 'guest'

