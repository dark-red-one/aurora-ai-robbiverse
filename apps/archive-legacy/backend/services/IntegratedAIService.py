"""
IntegratedAIService.py
======================
Master integration layer that brings all smart services together.

This service orchestrates:
- AIRouterService: Intelligent model selection
- LearningService: Pattern recognition & user profiling
- HealthMonitorService: System health & auto-recovery
- CircuitBreaker: Fault tolerance
- DailyBriefSystem: Revenue-focused summaries

Provides a single, unified interface for all AI interactions with built-in:
- Learning from every interaction
- Automatic failover and recovery
- Performance optimization
- Health monitoring
- Circuit breaker protection

This is the "brain" that coordinates all the smart subsystems.
"""

import os
import logging
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime

# Import our smart services
from AIRouterService import get_router
from LearningService import get_learning_service
from HealthMonitorService import get_health_monitor
from DailyBriefSystem import get_brief_system
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../middleware'))
try:
    from circuitBreaker import get_circuit_breaker, CircuitBreakerConfig
except ImportError:
    # Fallback if import fails
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../middleware')))
    from circuitBreaker import get_circuit_breaker, CircuitBreakerConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class IntegratedAIService:
    """
    Master AI service that coordinates all smart subsystems
    """
    
    def __init__(self, user_id: str = "allan"):
        self.user_id = user_id
        
        # Initialize all subsystems
        self.router = get_router()
        self.learning = get_learning_service()
        self.health = get_health_monitor()
        self.briefs = get_brief_system()
        
        # Circuit breakers for each subsystem
        self.ai_breaker = get_circuit_breaker("ai_generation", CircuitBreakerConfig(
            failure_threshold=5,
            success_threshold=2,
            timeout=30.0
        ))
        
        logger.info("🧠 Integrated AI Service initialized")
    
    async def chat(self,
                   message: str,
                   context: Optional[Dict] = None,
                   require_premium: bool = False) -> Dict[str, Any]:
        """
        Main chat interface with full intelligence
        
        Args:
            message: User message
            context: Optional conversation context
            require_premium: Force use of premium models
        
        Returns:
            Response dict with content, metadata, and learning insights
        """
        start_time = datetime.now()
        
        # Get user profile for personalization
        profile = self.learning.get_user_profile(self.user_id)
        
        # Classify topic (simple heuristic for now)
        topic = self._classify_topic(message)
        
        # Get model recommendation based on learning
        recommended_model = self.learning.get_model_recommendation(self.user_id, topic)
        logger.info(f"💡 Learning service recommends: {recommended_model or 'no preference'}")
        
        # Generate response through circuit breaker
        try:
            response = await self.ai_breaker.async_call(
                self.router.generate,
                prompt=message,
                system_prompt=self._build_system_prompt(profile),
                request_type=topic,
                require_premium=require_premium
            )
            
            # Calculate satisfaction score (simple heuristic)
            satisfaction = self._estimate_satisfaction(response)
            
            # Log interaction for learning
            self.learning.log_interaction(
                user_id=self.user_id,
                prompt=message,
                response=response['content'],
                model_used=response['model'],
                response_time=response['response_time'],
                satisfaction_score=satisfaction,
                topic=topic,
                context=context
            )
            
            # Add learning insights to response
            response['learning'] = {
                'topic': topic,
                'satisfaction_estimate': satisfaction,
                'user_interactions': profile.total_interactions if profile else 0,
                'model_recommended': recommended_model,
                'model_used': response['model']
            }
            
            elapsed = (datetime.now() - start_time).total_seconds()
            logger.info(f"✅ Chat completed in {elapsed:.2f}s (AI: {response['response_time']:.2f}s)")
            
            return response
        
        except Exception as e:
            logger.error(f"❌ Chat failed: {e}")
            
            # Log failed interaction
            self.learning.log_interaction(
                user_id=self.user_id,
                prompt=message,
                response="",
                model_used="error",
                response_time=0.0,
                satisfaction_score=0.0,
                topic=topic,
                context={'error': str(e)}
            )
            
            return {
                'content': f"I apologize, but I encountered an error: {str(e)}",
                'model': 'error',
                'success': False,
                'error': str(e)
            }
    
    def _classify_topic(self, message: str) -> str:
        """Classify message topic (simple heuristic)"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['code', 'function', 'python', 'javascript', 'bug', 'error']):
            return 'code'
        elif any(word in message_lower for word in ['deal', 'sales', 'revenue', 'customer', 'crm']):
            return 'business'
        elif any(word in message_lower for word in ['analyze', 'data', 'metrics', 'report']):
            return 'analysis'
        elif any(word in message_lower for word in ['create', 'write', 'story', 'content']):
            return 'creative'
        else:
            return 'general'
    
    def _build_system_prompt(self, profile) -> str:
        """Build personalized system prompt based on user profile"""
        base = "You are Robbie, Allan's AI executive assistant. Be direct, strategic, and revenue-focused."
        
        if profile:
            # Adapt based on learned preferences
            if profile.communication_style == "technical":
                base += " Use technical language and provide detailed explanations."
            elif profile.communication_style == "casual":
                base += " Keep it casual and conversational."
            
            # Add context about their interests
            if profile.topic_interests:
                top_topics = sorted(profile.topic_interests.items(), key=lambda x: x[1], reverse=True)[:3]
                topics_str = ", ".join([t[0] for t in top_topics])
                base += f" They're particularly interested in: {topics_str}."
        
        return base
    
    def _estimate_satisfaction(self, response: Dict) -> float:
        """Estimate user satisfaction with response (simple heuristic)"""
        score = 0.7  # Base score
        
        # Faster responses are better
        if response['response_time'] < 2.0:
            score += 0.1
        elif response['response_time'] > 5.0:
            score -= 0.1
        
        # First attempt is better
        if response['attempts'] and len(response['attempts']) == 1:
            score += 0.1
        
        # Performance tier matters
        if response['tier'] == 'performance':
            score += 0.05
        elif response['tier'] == 'premium':
            score += 0.1
        
        return max(0.0, min(1.0, score))
    
    async def get_morning_brief(self) -> str:
        """Get formatted morning brief"""
        brief = await self.briefs.generate_morning_brief()
        return self.briefs.format_brief_text(brief)
    
    async def get_afternoon_brief(self) -> str:
        """Get formatted afternoon brief"""
        brief = await self.briefs.generate_afternoon_brief()
        return self.briefs.format_brief_text(brief)
    
    async def get_evening_brief(self) -> str:
        """Get formatted evening brief"""
        brief = await self.briefs.generate_evening_brief()
        return self.briefs.format_brief_text(brief)
    
    async def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        # Run health check
        await self.health._check_all_services()
        
        return {
            'health': self.health.get_status(),
            'router_stats': self.router.get_stats(),
            'learning_stats': self.learning.get_stats(),
            'timestamp': datetime.now().isoformat()
        }
    
    async def start_monitoring(self):
        """Start background health monitoring"""
        logger.info("🚀 Starting background health monitoring...")
        asyncio.create_task(self.health.start())
    
    def stop_monitoring(self):
        """Stop background monitoring"""
        self.health.stop()


# Singleton instance
_integrated_service = None

def get_integrated_service(user_id: str = "allan") -> IntegratedAIService:
    """Get or create the integrated service singleton"""
    global _integrated_service
    if _integrated_service is None:
        _integrated_service = IntegratedAIService(user_id)
    return _integrated_service


# Example usage
if __name__ == "__main__":
    async def test_integration():
        print("🧠 Testing Integrated AI Service\n")
        print("="*60)
        
        service = get_integrated_service()
        
        # Test 1: Simple chat
        print("\n1️⃣ Testing Chat...")
        response = await service.chat("What's 2+2?")
        print(f"   Response: {response['content'][:100]}")
        print(f"   Model: {response['model']} ({response['tier']})")
        print(f"   Learning: {response['learning']}")
        
        # Test 2: Code-related chat
        print("\n2️⃣ Testing Code Chat...")
        response = await service.chat("Write a Python function to reverse a string")
        print(f"   Response: {response['content'][:100]}...")
        print(f"   Model: {response['model']} ({response['tier']})")
        print(f"   Topic: {response['learning']['topic']}")
        
        # Test 3: Morning brief
        print("\n3️⃣ Testing Morning Brief...")
        brief = await service.get_morning_brief()
        print(brief[:500] + "...")
        
        # Test 4: System status
        print("\n4️⃣ Testing System Status...")
        status = await service.get_system_status()
        print(f"   Services: {status['health']['summary']['healthy']}/{status['health']['summary']['total']} healthy")
        print(f"   Total Requests: {status['router_stats']['total_requests']}")
        print(f"   Total Users: {status['learning_stats']['total_users']}")
        
        print("\n" + "="*60)
        print("✅ Integration test complete!\n")
    
    asyncio.run(test_integration())

