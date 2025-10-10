"""
OpenPhone Handler
=================
Handles incoming SMS and voice calls via OpenPhone API.

Routes everything through Universal Input API for consistent personality.
"""

import os
import aiohttp
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class OpenPhoneHandler:
    """Handle OpenPhone SMS and voice interactions"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENPHONE_API_KEY")
        self.phone_number = os.getenv("OPENPHONE_NUMBER")
        self.openphone_api = "https://api.openphone.com/v1"
        self.universal_input_url = "http://localhost:8000/api/v2/universal/request"
        
        if not self.api_key:
            logger.warning("⚠️ OPENPHONE_API_KEY not set - OpenPhone integration disabled")
    
    async def handle_incoming_sms(
        self,
        from_number: str,
        message_body: str,
        user_id: str = "guest"
    ) -> Dict[str, Any]:
        """
        Handle incoming SMS message
        
        Args:
            from_number: Sender's phone number
            message_body: SMS message content
            user_id: User ID (based on phone number lookup)
            
        Returns:
            Response data with AI-generated reply
        """
        try:
            logger.info(f"📱 Incoming SMS from {from_number}: {message_body[:50]}...")
            
            # Route through universal input API
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.universal_input_url,
                    json={
                        "source": "openphone-sms",
                        "source_metadata": {
                            "sender": from_number,
                            "platform": "sms"
                        },
                        "ai_service": "chat",
                        "payload": {
                            "input": message_body,
                            "parameters": {
                                "temperature": 0.7,
                                "max_tokens": 160  # SMS length limit
                            }
                        },
                        "user_id": user_id,
                        "fetch_context": True
                    },
                    timeout=aiohttp.ClientTimeout(total=20)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if data.get('status') == 'approved':
                            robbie_response = data['robbie_response']['message']
                            
                            # Send SMS reply
                            await self.send_sms(from_number, robbie_response)
                            
                            logger.info(f"✅ SMS reply sent to {from_number}")
                            
                            return {
                                'success': True,
                                'response': robbie_response,
                                'mood': data['robbie_response']['mood']
                            }
                        else:
                            logger.warning(f"Request rejected: {data.get('gatekeeper_review', {}).get('reasoning')}")
                            return {
                                'success': False,
                                'error': 'Message blocked by gatekeeper'
                            }
                    else:
                        error_text = await response.text()
                        logger.error(f"Universal input API error: {response.status} - {error_text}")
                        return {
                            'success': False,
                            'error': f"API error: {response.status}"
                        }
        
        except Exception as e:
            logger.error(f"Error handling incoming SMS: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def handle_incoming_call(
        self,
        from_number: str,
        transcribed_text: str,
        user_id: str = "guest"
    ) -> Dict[str, Any]:
        """
        Handle incoming voice call (transcribed)
        
        Args:
            from_number: Caller's phone number
            transcribed_text: Transcribed voice content
            user_id: User ID (based on phone number lookup)
            
        Returns:
            Response data with AI-generated reply (can be spoken back)
        """
        try:
            logger.info(f"📞 Incoming call from {from_number}: {transcribed_text[:50]}...")
            
            # Route through universal input API
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.universal_input_url,
                    json={
                        "source": "openphone-voice",
                        "source_metadata": {
                            "sender": from_number,
                            "platform": "voice"
                        },
                        "ai_service": "chat",
                        "payload": {
                            "input": transcribed_text,
                            "parameters": {
                                "temperature": 0.7,
                                "max_tokens": 500
                            }
                        },
                        "user_id": user_id,
                        "fetch_context": True
                    },
                    timeout=aiohttp.ClientTimeout(total=20)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if data.get('status') == 'approved':
                            robbie_response = data['robbie_response']['message']
                            
                            logger.info(f"✅ Voice response generated for {from_number}")
                            
                            # TODO: Integrate with TTS/voice response system
                            
                            return {
                                'success': True,
                                'response': robbie_response,
                                'mood': data['robbie_response']['mood'],
                                'speak': True  # Flag that this should be spoken
                            }
                        else:
                            logger.warning(f"Request rejected: {data.get('gatekeeper_review', {}).get('reasoning')}")
                            return {
                                'success': False,
                                'error': 'Call blocked by gatekeeper'
                            }
                    else:
                        error_text = await response.text()
                        logger.error(f"Universal input API error: {response.status} - {error_text}")
                        return {
                            'success': False,
                            'error': f"API error: {response.status}"
                        }
        
        except Exception as e:
            logger.error(f"Error handling incoming call: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def send_sms(self, to_number: str, message: str) -> bool:
        """
        Send SMS via OpenPhone API
        
        Args:
            to_number: Recipient's phone number
            message: Message to send
            
        Returns:
            True if successful, False otherwise
        """
        if not self.api_key:
            logger.error("Cannot send SMS: OPENPHONE_API_KEY not set")
            return False
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.openphone_api}/messages",
                    headers={
                        "Authorization": self.api_key,
                        "Content-Type": "application/json"
                    },
                    json={
                        "from": self.phone_number,
                        "to": [to_number],
                        "content": message
                    },
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        logger.info(f"✅ SMS sent to {to_number}")
                        return True
                    else:
                        error_text = await response.text()
                        logger.error(f"Failed to send SMS: {response.status} - {error_text}")
                        return False
        
        except Exception as e:
            logger.error(f"Error sending SMS: {e}")
            return False
    
    def lookup_user_by_phone(self, phone_number: str) -> str:
        """
        Look up user ID by phone number
        
        Args:
            phone_number: Phone number to look up
            
        Returns:
            User ID (allan, joe, or guest)
        """
        # Normalize phone number
        normalized = phone_number.replace("+1", "").replace("-", "").replace(" ", "")
        
        # Known phone numbers (TODO: move to database)
        known_numbers = {
            # Add Allan's number when known
            # "5551234567": "allan",
        }
        
        return known_numbers.get(normalized, "guest")


# Global instance
openphone_handler = OpenPhoneHandler()
