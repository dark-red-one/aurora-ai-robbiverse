"""
Universal Input Adapter for Cursor MCP
======================================
Routes Cursor MCP requests through the Universal Input API.

This decouples Cursor from local SQLite/Ollama and uses the centralized
personality management, vector search, and logging system.
"""

import aiohttp
import asyncio
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class UniversalInputAdapter:
    """Adapter to route MCP requests through Universal Input API"""
    
    def __init__(self, api_url: str = "http://localhost:8000"):
        self.api_url = api_url
        self.universal_endpoint = f"{api_url}/api/v2/universal/request"
        self.health_endpoint = f"{api_url}/api/v2/universal/health"
    
    async def chat(
        self,
        user_input: str,
        user_id: str = "allan",
        context: List[Dict[str, Any]] = None,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Send chat request through Universal Input API
        
        Args:
            user_input: User's message/query
            user_id: User identifier (for per-user personality)
            context: Optional pre-fetched context
            temperature: AI temperature parameter
            
        Returns:
            {
                'success': bool,
                'message': str,
                'mood': str,
                'personality_changes': dict,
                'actions': list
            }
        """
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "source": "cursor-mcp",
                    "source_metadata": {
                        "platform": "cursor",
                        "timestamp": asyncio.get_event_loop().time()
                    },
                    "ai_service": "chat",
                    "payload": {
                        "input": user_input,
                        "context": context,
                        "parameters": {
                            "temperature": temperature,
                            "max_tokens": 1500
                        }
                    },
                    "user_id": user_id,
                    "fetch_context": True  # Get vector search context
                }
                
                logger.info(f"[Cursor MCP] Sending request to Universal Input API: {user_input[:50]}...")
                
                async with session.post(
                    self.universal_endpoint,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if data.get('status') == 'approved':
                            robbie = data.get('robbie_response', {})
                            
                            logger.info(f"[Cursor MCP] ✅ Response received (mood: {robbie.get('mood')})")
                            
                            return {
                                'success': True,
                                'message': robbie.get('message', ''),
                                'mood': robbie.get('mood', 'focused'),
                                'personality_changes': robbie.get('personality_changes', {}),
                                'actions': robbie.get('actions', []),
                                'processing_time_ms': data.get('processing_time_ms', 0)
                            }
                        else:
                            # Request was rejected or revised
                            logger.warning(f"[Cursor MCP] Request {data.get('status')}: {data.get('gatekeeper_review', {}).get('reasoning')}")
                            
                            return {
                                'success': False,
                                'error': data.get('gatekeeper_review', {}).get('reasoning', 'Request blocked'),
                                'status': data.get('status')
                            }
                    else:
                        error_text = await response.text()
                        logger.error(f"[Cursor MCP] API returned {response.status}: {error_text}")
                        
                        return {
                            'success': False,
                            'error': f"API error: {response.status}"
                        }
                        
        except asyncio.TimeoutError:
            logger.error("[Cursor MCP] Request timeout")
            return {
                'success': False,
                'error': "Request timeout - API took too long to respond"
            }
        except Exception as e:
            logger.error(f"[Cursor MCP] Universal Input request failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def check_health(self) -> bool:
        """
        Check if Universal Input API is available
        
        Returns:
            True if API is healthy, False otherwise
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    self.health_endpoint,
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        is_healthy = data.get('status') == 'healthy'
                        
                        if is_healthy:
                            logger.info("[Cursor MCP] ✅ Universal Input API is healthy")
                        else:
                            logger.warning("[Cursor MCP] ⚠️ Universal Input API reports unhealthy")
                        
                        return is_healthy
                    else:
                        logger.error(f"[Cursor MCP] Health check failed: {response.status}")
                        return False
                        
        except Exception as e:
            logger.error(f"[Cursor MCP] Health check error: {e}")
            return False
    
    async def get_personality_status(self, user_id: str = "allan") -> Dict[str, Any]:
        """
        Get current personality status for user
        
        Args:
            user_id: User identifier
            
        Returns:
            {
                'mood': str,
                'attraction': int,
                'gandhi_genghis': int,
                'updated_at': str
            }
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.api_url}/api/personality/{user_id}",
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        logger.error(f"[Cursor MCP] Failed to get personality status: {response.status}")
                        return {
                            'mood': 'focused',
                            'attraction': 7,
                            'gandhi_genghis': 7
                        }
                        
        except Exception as e:
            logger.error(f"[Cursor MCP] Personality status error: {e}")
            return {
                'mood': 'focused',
                'attraction': 7,
                'gandhi_genghis': 7
            }


# Global instance
universal_input_adapter = UniversalInputAdapter()
