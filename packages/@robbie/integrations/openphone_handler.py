"""
OpenPhone Integration - Voice + SMS
====================================
Handles both SMS and voice calls through universal input API.
Uses OpenPhone API for business phone/SMS automation.

OpenPhone API Docs: https://developer.openphone.com/
"""

import os
import aiohttp
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# OpenPhone configuration
OPENPHONE_API_KEY = os.getenv('OPENPHONE_API_KEY')
OPENPHONE_API_URL = 'https://api.openphone.com/v1'
OPENPHONE_NUMBER = os.getenv('OPENPHONE_NUMBER')  # Your OpenPhone business number
UNIVERSAL_INPUT_URL = os.getenv('UNIVERSAL_INPUT_URL', 'http://localhost:8000/api/v2/universal/request')


async def call_universal_input(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Call the universal input API
    Returns the complete response including personality state
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(UNIVERSAL_INPUT_URL, json=payload) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    logger.error(f"Universal input API error: {response.status} - {error_text}")
                    raise Exception(f"API error: {response.status}")
    except Exception as e:
        logger.error(f"Failed to call universal input: {e}")
        raise


async def handle_incoming_sms(
    phone_number: str,
    message: str,
    user_id: str = 'allan',
    metadata: Optional[Dict[str, Any]] = None
) -> str:
    """
    Process incoming SMS through universal input API
    
    Args:
        phone_number: Sender's phone number
        message: SMS message text
        user_id: User identifier (default: allan)
        metadata: Additional metadata from OpenPhone
    
    Returns:
        Robbie's response message (personality-aware)
    """
    logger.info(f"📱 Incoming SMS from {phone_number}: {message[:50]}...")
    
    # Build universal input request
    payload = {
        'source': 'sms',
        'source_metadata': {
            'sender': phone_number,
            'timestamp': metadata.get('timestamp') if metadata else None,
            'platform': 'openphone',
            'extra': metadata or {}
        },
        'ai_service': 'chat',
        'payload': {
            'input': message,
            'parameters': {
                'temperature': 0.7,
                'max_tokens': 500  # Keep SMS responses concise
            }
        },
        'user_id': user_id,
        'fetch_context': True  # Get relevant conversation history
    }
    
    try:
        # Route through universal input
        response = await call_universal_input(payload)
        
        if response['status'] != 'approved':
            logger.warning(f"SMS response blocked: {response['gatekeeper_review']['reasoning']}")
            # Return safe fallback
            return "I received your message. Let me review and get back to you shortly."
        
        robbie_message = response['robbie_response']['message']
        current_mood = response['robbie_response']['mood']
        
        logger.info(f"💜 Robbie responding (mood: {current_mood}): {robbie_message[:50]}...")
        
        # Send via OpenPhone
        await send_openphone_sms(phone_number, robbie_message)
        
        # Log any actions suggested
        if response['robbie_response']['actions']:
            logger.info(f"📋 Actions suggested: {response['robbie_response']['actions']}")
        
        return robbie_message
        
    except Exception as e:
        logger.error(f"Failed to process SMS: {e}")
        # Send error message
        error_msg = "I'm having trouble right now. Can you try again in a moment?"
        await send_openphone_sms(phone_number, error_msg)
        return error_msg


async def handle_incoming_call(
    phone_number: str,
    transcribed_text: str,
    user_id: str = 'allan',
    metadata: Optional[Dict[str, Any]] = None
) -> str:
    """
    Process voice call through universal input API
    
    Args:
        phone_number: Caller's phone number
        transcribed_text: Voice-to-text transcription
        user_id: User identifier
        metadata: Additional call metadata from OpenPhone
    
    Returns:
        Robbie's response (converted to speech by OpenPhone)
    """
    logger.info(f"📞 Incoming call from {phone_number}: {transcribed_text[:50]}...")
    
    # Build universal input request
    payload = {
        'source': 'voice',
        'source_metadata': {
            'sender': phone_number,
            'timestamp': metadata.get('timestamp') if metadata else None,
            'platform': 'openphone',
            'call_id': metadata.get('call_id') if metadata else None,
            'extra': metadata or {}
        },
        'ai_service': 'chat',
        'payload': {
            'input': transcribed_text,
            'parameters': {
                'temperature': 0.8,  # Slightly higher for natural speech
                'max_tokens': 300  # Keep voice responses brief
            }
        },
        'user_id': user_id,
        'fetch_context': True
    }
    
    try:
        # Route through universal input
        response = await call_universal_input(payload)
        
        if response['status'] != 'approved':
            logger.warning(f"Voice response blocked: {response['gatekeeper_review']['reasoning']}")
            return "I received your call. Let me review the request and call you back shortly."
        
        robbie_message = response['robbie_response']['message']
        current_mood = response['robbie_response']['mood']
        
        logger.info(f"🎤 Robbie responding (mood: {current_mood}): {robbie_message[:50]}...")
        
        # OpenPhone will convert this to speech
        return robbie_message
        
    except Exception as e:
        logger.error(f"Failed to process voice call: {e}")
        return "I'm having trouble processing your request right now. Please try again."


async def send_openphone_sms(to_number: str, message: str) -> bool:
    """
    Send SMS via OpenPhone API
    
    Args:
        to_number: Recipient phone number
        message: Message text
    
    Returns:
        True if sent successfully, False otherwise
    """
    if not OPENPHONE_API_KEY:
        logger.error("OpenPhone API key not configured")
        return False
    
    if not OPENPHONE_NUMBER:
        logger.error("OpenPhone number not configured")
        return False
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f'{OPENPHONE_API_URL}/messages',
                headers={
                    'Authorization': f'Bearer {OPENPHONE_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'to': to_number,
                    'from': OPENPHONE_NUMBER,
                    'text': message
                }
            ) as response:
                if response.status == 200:
                    logger.info(f"✅ SMS sent to {to_number}")
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ OpenPhone SMS failed: {response.status} - {error_text}")
                    return False
                    
    except Exception as e:
        logger.error(f"Failed to send OpenPhone SMS: {e}")
        return False


async def make_openphone_call(
    to_number: str,
    message: str,
    voice: str = 'female'  # OpenPhone voice options
) -> bool:
    """
    Make outbound call via OpenPhone with text-to-speech
    
    Args:
        to_number: Number to call
        message: Message to speak
        voice: Voice selection (check OpenPhone docs for options)
    
    Returns:
        True if call initiated successfully
    """
    if not OPENPHONE_API_KEY:
        logger.error("OpenPhone API key not configured")
        return False
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f'{OPENPHONE_API_URL}/calls',
                headers={
                    'Authorization': f'Bearer {OPENPHONE_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'to': to_number,
                    'from': OPENPHONE_NUMBER,
                    'message': message,
                    'voice': voice
                }
            ) as response:
                if response.status == 200:
                    logger.info(f"✅ Call initiated to {to_number}")
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ OpenPhone call failed: {response.status} - {error_text}")
                    return False
                    
    except Exception as e:
        logger.error(f"Failed to make OpenPhone call: {e}")
        return False


async def get_openphone_messages(limit: int = 50) -> list:
    """
    Fetch recent messages from OpenPhone
    
    Returns:
        List of recent message objects
    """
    if not OPENPHONE_API_KEY:
        return []
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f'{OPENPHONE_API_URL}/messages',
                headers={'Authorization': f'Bearer {OPENPHONE_API_KEY}'},
                params={'limit': limit}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('data', [])
                else:
                    logger.error(f"Failed to fetch OpenPhone messages: {response.status}")
                    return []
                    
    except Exception as e:
        logger.error(f"Error fetching OpenPhone messages: {e}")
        return []

