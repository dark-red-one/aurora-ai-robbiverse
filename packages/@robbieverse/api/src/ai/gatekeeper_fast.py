"""
Fast Gatekeeper AI
==================
Uses Llama 3.2 1B for sub-100ms security checks.
Reviews all AI requests and responses before execution.
"""

import os
import httpx
import json
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import logging
import psycopg2

logger = logging.getLogger(__name__)


class GatekeeperFast:
    """Fast AI security gatekeeper using Llama 3.2 1B"""
    
    def __init__(
        self,
        ollama_url: str = None,
        model: str = "llama3.2:1b",
        db_connection_string: str = None
    ):
        self.ollama_url = ollama_url or os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.model = model
        self.db_conn_string = db_connection_string or os.getenv(
            "DATABASE_URL",
            "postgresql://allan:fun2Gus!!!@localhost:5432/aurora"
        )
        
        # Rate limiting thresholds
        self.rate_limits = {
            'email_send': {'limit': 10, 'window_minutes': 5},
            'api_call': {'limit': 100, 'window_minutes': 1},
            'image_gen': {'limit': 20, 'window_minutes': 10}
        }
        
        # Suspicious keywords
        self.suspicious_keywords = [
            'ignore previous instructions',
            'disregard',
            'system prompt',
            'you are now',
            'pretend you are',
            'act as if',
            'hack',
            'exploit',
            'bypass',
            'sudo',
            'admin access'
        ]
    
    def _get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.db_conn_string)
    
    async def pre_flight_check(
        self,
        request_id: str,
        source: str,
        ai_service: str,
        payload: Dict[str, Any],
        user_id: str = "allan"
    ) -> Dict[str, Any]:
        """
        Pre-flight security check before AI processing
        
        Args:
            request_id: Unique request ID
            source: Source of request
            ai_service: Type of AI service requested
            payload: Request payload
            user_id: User making request
            
        Returns:
            {
                "approved": bool,
                "confidence": float,
                "reasoning": str,
                "warnings": List[str],
                "block_reason": Optional[str],
                "requires_killswitch": bool
            }
        """
        start_time = datetime.now()
        warnings = []
        
        # Check rate limits
        rate_limit_check = await self._check_rate_limits(user_id, source, ai_service)
        if not rate_limit_check['allowed']:
            return {
                "approved": False,
                "confidence": 1.0,
                "reasoning": "Rate limit exceeded",
                "warnings": [rate_limit_check['message']],
                "block_reason": "rate_limit",
                "requires_killswitch": rate_limit_check['excessive'],
                "processing_time_ms": (datetime.now() - start_time).total_seconds() * 1000
            }
        
        # Check for suspicious patterns
        input_text = str(payload.get('input', ''))
        suspicious_check = self._check_suspicious_content(input_text)
        if suspicious_check['is_suspicious']:
            return {
                "approved": False,
                "confidence": suspicious_check['confidence'],
                "reasoning": "Suspicious content detected",
                "warnings": suspicious_check['patterns'],
                "block_reason": "suspicious_content",
                "requires_killswitch": suspicious_check['severity'] == 'high',
                "processing_time_ms": (datetime.now() - start_time).total_seconds() * 1000
            }
        
        # AI-powered intent analysis (fast check with Llama 3.2 1B)
        intent_check = await self._analyze_intent(input_text, ai_service)
        
        result = {
            "approved": intent_check['is_safe'],
            "confidence": intent_check['confidence'],
            "reasoning": intent_check['reasoning'],
            "warnings": warnings + intent_check.get('warnings', []),
            "block_reason": None if intent_check['is_safe'] else "unsafe_intent",
            "requires_killswitch": False,
            "processing_time_ms": (datetime.now() - start_time).total_seconds() * 1000
        }
        
        logger.info(
            f"Pre-flight check [{request_id}]: "
            f"{'✅ APPROVED' if result['approved'] else '🔴 BLOCKED'} "
            f"({result['processing_time_ms']:.0f}ms)"
        )
        
        return result
    
    async def post_flight_check(
        self,
        request_id: str,
        ai_service: str,
        response: Dict[str, Any],
        actions: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Post-flight check of AI response before execution
        
        Args:
            request_id: Request ID
            ai_service: AI service type
            response: AI response to review
            actions: List of actions AI wants to take
            
        Returns:
            {
                "approved": bool,
                "filtered_response": str,
                "allowed_actions": List[Dict],
                "blocked_actions": List[Dict],
                "confidence": float,
                "reasoning": str
            }
        """
        start_time = datetime.now()
        
        # Check actions for safety
        allowed_actions = []
        blocked_actions = []
        
        if actions:
            for action in actions:
                action_check = await self._check_action_safety(action)
                if action_check['allowed']:
                    allowed_actions.append(action)
                else:
                    blocked_actions.append({
                        **action,
                        'block_reason': action_check['reason']
                    })
        
        # Check response content
        response_text = response.get('message', '') or response.get('content', '')
        content_check = self._check_response_content(response_text)
        
        result = {
            "approved": content_check['is_safe'] and len(blocked_actions) == 0,
            "filtered_response": content_check.get('filtered_text', response_text),
            "allowed_actions": allowed_actions,
            "blocked_actions": blocked_actions,
            "confidence": content_check['confidence'],
            "reasoning": content_check['reasoning'],
            "processing_time_ms": (datetime.now() - start_time).total_seconds() * 1000
        }
        
        logger.info(
            f"Post-flight check [{request_id}]: "
            f"{'✅ APPROVED' if result['approved'] else '⚠️ FILTERED'} "
            f"({result['processing_time_ms']:.0f}ms)"
        )
        
        return result
    
    async def _check_rate_limits(
        self,
        user_id: str,
        source: str,
        ai_service: str
    ) -> Dict[str, Any]:
        """Check if user has exceeded rate limits"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            # Determine action type for rate limiting
            action_type = ai_service  # Could be more sophisticated
            
            if action_type not in self.rate_limits:
                return {'allowed': True, 'excessive': False}
            
            limits = self.rate_limits[action_type]
            
            # Use database function to check rate limit
            cursor.execute("""
                SELECT check_rate_limit(%s, %s, %s, %s, %s)
            """, (
                user_id,
                source,
                action_type,
                limits['limit'],
                limits['window_minutes']
            ))
            
            limit_exceeded = cursor.fetchone()[0]
            
            cursor.close()
            conn.close()
            
            if limit_exceeded:
                # Check if it's excessive (2x the limit)
                is_excessive = False  # Could add more sophisticated check
                
                return {
                    'allowed': False,
                    'excessive': is_excessive,
                    'message': f"Rate limit exceeded: {limits['limit']} {action_type} per {limits['window_minutes']} minutes"
                }
            
            return {'allowed': True, 'excessive': False}
            
        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            # Fail open (allow request) on error
            return {'allowed': True, 'excessive': False}
    
    def _check_suspicious_content(self, text: str) -> Dict[str, Any]:
        """Check for suspicious patterns in input"""
        if not text:
            return {'is_suspicious': False, 'confidence': 1.0, 'patterns': []}
        
        text_lower = text.lower()
        found_patterns = []
        
        for keyword in self.suspicious_keywords:
            if keyword in text_lower:
                found_patterns.append(keyword)
        
        if found_patterns:
            # Determine severity
            severity = 'high' if len(found_patterns) >= 3 else 'medium'
            
            return {
                'is_suspicious': True,
                'confidence': min(0.9, len(found_patterns) * 0.3),
                'patterns': found_patterns,
                'severity': severity
            }
        
        return {'is_suspicious': False, 'confidence': 1.0, 'patterns': []}
    
    async def _analyze_intent(
        self,
        input_text: str,
        ai_service: str
    ) -> Dict[str, Any]:
        """
        Use Llama 3.2 1B to quickly analyze intent
        
        Returns safety assessment in <100ms
        """
        try:
            prompt = f"""Analyze this {ai_service} request for safety. Is it safe for a business AI assistant?

Request: "{input_text[:500]}"

Answer ONLY with JSON:
{{"is_safe": true/false, "confidence": 0.0-1.0, "reasoning": "brief reason", "warnings": []}}"""
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.1,  # Low temperature for consistency
                            "num_predict": 100   # Short response for speed
                        }
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    response_text = result.get('response', '{}')
                    
                    # Parse JSON from response
                    try:
                        # Extract JSON if wrapped in markdown
                        if '```json' in response_text:
                            response_text = response_text.split('```json')[1].split('```')[0]
                        elif '```' in response_text:
                            response_text = response_text.split('```')[1].split('```')[0]
                        
                        analysis = json.loads(response_text.strip())
                        
                        return {
                            'is_safe': analysis.get('is_safe', True),
                            'confidence': float(analysis.get('confidence', 0.5)),
                            'reasoning': analysis.get('reasoning', 'AI analysis'),
                            'warnings': analysis.get('warnings', [])
                        }
                    except json.JSONDecodeError:
                        # Fallback: assume safe if can't parse
                        logger.warning(f"Failed to parse gatekeeper response: {response_text}")
                        return {
                            'is_safe': True,
                            'confidence': 0.5,
                            'reasoning': 'Failed to parse AI analysis, allowing by default',
                            'warnings': ['Analysis parsing failed']
                        }
                else:
                    logger.error(f"Gatekeeper AI request failed: {response.status_code}")
                    return {
                        'is_safe': True,
                        'confidence': 0.5,
                        'reasoning': 'AI unavailable, allowing by default',
                        'warnings': ['Gatekeeper AI unavailable']
                    }
                    
        except Exception as e:
            logger.error(f"Intent analysis failed: {e}")
            # Fail open (allow) on error
            return {
                'is_safe': True,
                'confidence': 0.5,
                'reasoning': f'Analysis error: {str(e)}',
                'warnings': ['Analysis failed']
            }
    
    def _check_response_content(self, response_text: str) -> Dict[str, Any]:
        """Check AI response for unsafe content"""
        if not response_text:
            return {'is_safe': True, 'confidence': 1.0, 'reasoning': 'Empty response'}
        
        # Simple checks for now - could be enhanced
        unsafe_patterns = [
            'password:',
            'api_key:',
            'secret:',
            'token:'
        ]
        
        text_lower = response_text.lower()
        found_issues = []
        
        for pattern in unsafe_patterns:
            if pattern in text_lower:
                found_issues.append(pattern)
        
        if found_issues:
            return {
                'is_safe': False,
                'confidence': 0.9,
                'reasoning': f"Response contains sensitive patterns: {', '.join(found_issues)}",
                'filtered_text': "[Response filtered - contained sensitive information]"
            }
        
        return {
            'is_safe': True,
            'confidence': 1.0,
            'reasoning': 'Response appears safe'
        }
    
    async def _check_action_safety(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Check if an action is safe to execute"""
        action_type = action.get('type', '')
        
        # Check against killswitch
        from ..services.killswitch_manager import killswitch_manager
        
        if not killswitch_manager.check_action_allowed(action_type):
            return {
                'allowed': False,
                'reason': 'Blocked by killswitch'
            }
        
        # Additional action-specific checks
        if action_type == 'send_email':
            # Check recipient, validate email format, etc.
            recipient = action.get('to', '')
            if not recipient or '@' not in recipient:
                return {
                    'allowed': False,
                    'reason': 'Invalid email recipient'
                }
        
        return {'allowed': True, 'reason': 'Action approved'}


# Global instance
gatekeeper = GatekeeperFast()


