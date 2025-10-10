"""
Universal Input Adapter for Cursor MCP
=======================================
Routes Cursor MCP requests through the universal input API instead of local SQLite.

This gives Cursor:
- Real personality state from main DB
- Vector search across ALL conversations (not just Cursor)
- Consistent mood with chat apps, email, SMS, voice
- Centralized logging
"""

import aiohttp
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

UNIVERSAL_INPUT_URL = "http://localhost:8000/api/v2/universal/request"

class UniversalInputAdapter:
    """Adapter for routing Cursor requests through universal input API"""
    
    def __init__(self, api_url: str = UNIVERSAL_INPUT_URL):
        self.api_url = api_url
    
    async def chat(
        self,
        user_message: str,
        user_id: str = 'allan',
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send chat message through universal input API
        
        Args:
            user_message: What the user said in Cursor
            user_id: User identifier
            context: Optional additional context
        
        Returns:
        {
            'message': "Robbie's response",
            'mood': 'focused',
            'attraction': 11,
            'gandhi_genghis': 7,
            'personality_changes': {},
            'actions': [],
            'processing_time_ms': 1500
        }
        """
        try:
            # Build request
            payload = {
                'source': 'cursor',
                'source_metadata': {
                    'sender': user_id,
                    'timestamp': datetime.now().isoformat(),
                    'platform': 'cursor-mcp',
                    'extra': context or {}
                },
                'ai_service': 'chat',
                'payload': {
                    'input': user_message,
                    'parameters': {
                        'temperature': 0.7,
                        'max_tokens': 2000  # Cursor can handle longer responses
                    }
                },
                'user_id': user_id,
                'fetch_context': True  # Get vector search results
            }
            
            # Call universal input API
            async with aiohttp.ClientSession() as session:
                async with session.post(self.api_url, json=payload, timeout=30) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Universal input API error: {response.status} - {error_text}")
                        raise Exception(f"API returned {response.status}")
                    
                    data = await response.json()
            
            # Check if request was approved
            if data['status'] != 'approved':
                logger.warning(f"Request blocked: {data['gatekeeper_review']['reasoning']}")
                return {
                    'message': f"Request blocked by gatekeeper: {data['gatekeeper_review']['reasoning']}",
                    'mood': 'focused',
                    'attraction': 7,
                    'gandhi_genghis': 7,
                    'personality_changes': {},
                    'actions': [],
                    'processing_time_ms': data['processing_time_ms']
                }
            
            # Extract response
            robbie_response = data['robbie_response']
            
            return {
                'message': robbie_response['message'],
                'mood': robbie_response['mood'],
                'attraction': 11,  # Will come from personality state
                'gandhi_genghis': 7,  # Will come from personality state
                'personality_changes': robbie_response.get('personality_changes', {}),
                'actions': robbie_response.get('actions', []),
                'sticky_notes': robbie_response.get('sticky_notes', []),
                'processing_time_ms': data['processing_time_ms']
            }
            
        except Exception as e:
            logger.error(f"Failed to call universal input: {e}")
            # Return error response
            return {
                'message': f"Sorry, I'm having trouble right now: {str(e)}",
                'mood': 'focused',
                'attraction': 7,
                'gandhi_genghis': 7,
                'personality_changes': {},
                'actions': [],
                'processing_time_ms': 0
            }
    
    async def get_personality_state(self, user_id: str = 'allan') -> Dict[str, Any]:
        """
        Get current personality state from main DB (via API)
        
        Returns:
        {
            'mood': 'focused',
            'attraction': 11,
            'gandhi_genghis': 7,
            'updated_at': '2025-10-10T12:00:00Z'
        }
        """
        try:
            # Call personality endpoint (assuming it exists)
            personality_url = self.api_url.replace('/universal/request', f'/personality/{user_id}')
            
            async with aiohttp.ClientSession() as session:
                async with session.get(personality_url, timeout=5) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get('personality', {})
                    else:
                        # Return defaults
                        return {
                            'mood': 'focused',
                            'attraction': 11,
                            'gandhi_genghis': 7,
                            'updated_at': datetime.now().isoformat()
                        }
        except Exception as e:
            logger.error(f"Failed to get personality state: {e}")
            return {
                'mood': 'focused',
                'attraction': 11,
                'gandhi_genghis': 7,
                'updated_at': datetime.now().isoformat()
            }
    
    async def update_personality(
        self,
        user_id: str = 'allan',
        mood: Optional[str] = None,
        attraction: Optional[int] = None,
        gandhi_genghis: Optional[int] = None
    ) -> bool:
        """
        Update personality state in main DB
        
        Returns:
            True if successful
        """
        try:
            personality_url = self.api_url.replace('/universal/request', f'/personality/{user_id}')
            
            update_data = {}
            if mood:
                update_data['current_mood'] = mood
            if attraction is not None:
                update_data['attraction_level'] = attraction
            if gandhi_genghis is not None:
                update_data['gandhi_genghis_level'] = gandhi_genghis
            
            if not update_data:
                return True
            
            async with aiohttp.ClientSession() as session:
                async with session.put(
                    personality_url,
                    json=update_data,
                    timeout=5
                ) as response:
                    return response.status == 200
                    
        except Exception as e:
            logger.error(f"Failed to update personality: {e}")
            return False


# Global instance
universal_input_adapter = UniversalInputAdapter()

