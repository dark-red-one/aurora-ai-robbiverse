"""
AIRouterService.py
==================
Intelligent AI request routing with 5-level fallback chain, performance tracking, and learning.

This service routes AI requests to the best available model based on:
- Real-time performance metrics
- Model availability and health
- Request type and requirements
- Historical success rates

Fallback Chain:
1. SSH Tunnel GPU (qwen2.5:7b) - Fastest for most tasks
2. Local Ollama (qwen2.5:7b, mistral:7b, llama3.1:8b) - Always available
3. OpenAI (GPT-4) - Premium quality when needed
4. Anthropic (Claude) - High quality alternative
5. Simple response system - Never fail completely

Performance tracking enables continuous learning and optimization.
"""

import os
import json
import time
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import asyncio
import aiohttp
import requests
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelTier(Enum):
    """Model performance tiers"""
    PREMIUM = "premium"      # OpenAI GPT-4, Claude Opus
    PERFORMANCE = "performance"  # GPU-accelerated local models
    STANDARD = "standard"    # CPU local models
    FALLBACK = "fallback"    # Simple response system


@dataclass
class ModelEndpoint:
    """Model endpoint configuration"""
    name: str
    tier: ModelTier
    endpoint_url: str
    model_name: str
    api_key: Optional[str] = None
    priority: int = 50  # Lower = higher priority
    avg_response_time: float = 0.0
    success_rate: float = 1.0
    last_used: Optional[datetime] = None
    is_healthy: bool = True
    token_speed: float = 0.0  # tokens per second
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        data['tier'] = self.tier.value
        data['last_used'] = self.last_used.isoformat() if self.last_used else None
        return data


class AIRouterService:
    """
    Intelligent AI routing service with performance tracking and learning
    """
    
    def __init__(self, metrics_file: str = "/home/allan/aurora-ai-robbiverse/data/ai_router_metrics.json"):
        self.metrics_file = metrics_file
        self.endpoints: List[ModelEndpoint] = []
        self.request_history: List[Dict] = []
        self._load_metrics()
        self._initialize_endpoints()
        
    def _load_metrics(self):
        """Load historical performance metrics"""
        try:
            if os.path.exists(self.metrics_file):
                with open(self.metrics_file, 'r') as f:
                    data = json.load(f)
                    self.request_history = data.get('request_history', [])
                    logger.info(f"Loaded {len(self.request_history)} historical requests")
        except Exception as e:
            logger.error(f"Error loading metrics: {e}")
            self.request_history = []
    
    def _save_metrics(self):
        """Save performance metrics"""
        try:
            os.makedirs(os.path.dirname(self.metrics_file), exist_ok=True)
            with open(self.metrics_file, 'w') as f:
                json.dump({
                    'endpoints': [ep.to_dict() for ep in self.endpoints],
                    'request_history': self.request_history[-1000:],  # Keep last 1000
                    'last_updated': datetime.now().isoformat()
                }, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving metrics: {e}")
    
    def _initialize_endpoints(self):
        """Initialize all available endpoints"""
        # GPU endpoints (Performance Tier)
        self.endpoints.append(ModelEndpoint(
            name="ssh_tunnel_gpu",
            tier=ModelTier.PERFORMANCE,
            endpoint_url="http://localhost:8080",
            model_name="qwen2.5:7b",
            priority=10,  # Highest priority - fastest GPU
            token_speed=1.1  # From our test
        ))
        
        # Local Ollama endpoints (Standard Tier)
        self.endpoints.append(ModelEndpoint(
            name="local_qwen",
            tier=ModelTier.STANDARD,
            endpoint_url="http://localhost:11434",
            model_name="qwen2.5:7b",
            priority=20,
            token_speed=0.4  # From our test
        ))
        
        self.endpoints.append(ModelEndpoint(
            name="local_mistral",
            tier=ModelTier.STANDARD,
            endpoint_url="http://localhost:11434",
            model_name="mistral:7b",
            priority=21,
            token_speed=0.5  # From our test
        ))
        
        self.endpoints.append(ModelEndpoint(
            name="local_llama",
            tier=ModelTier.STANDARD,
            endpoint_url="http://localhost:11434",
            model_name="llama3.1:8b",
            priority=22,
            token_speed=0.3  # From our test
        ))
        
        # Premium endpoints (Premium Tier)
        openai_key = os.getenv('OPENAI_API_KEY')
        if openai_key:
            self.endpoints.append(ModelEndpoint(
                name="openai_gpt4",
                tier=ModelTier.PREMIUM,
                endpoint_url="https://api.openai.com/v1/chat/completions",
                model_name="gpt-4",
                api_key=openai_key,
                priority=30,
                token_speed=20.0  # Typical GPT-4 speed
            ))
        
        anthropic_key = os.getenv('ANTHROPIC_API_KEY')
        if anthropic_key:
            self.endpoints.append(ModelEndpoint(
                name="anthropic_claude",
                tier=ModelTier.PREMIUM,
                endpoint_url="https://api.anthropic.com/v1/messages",
                model_name="claude-3-opus-20240229",
                api_key=anthropic_key,
                priority=31,
                token_speed=25.0  # Typical Claude speed
            ))
        
        logger.info(f"Initialized {len(self.endpoints)} endpoints")
    
    async def _check_health(self, endpoint: ModelEndpoint) -> bool:
        """Check if an endpoint is healthy"""
        try:
            if 'ollama' in endpoint.endpoint_url or endpoint.endpoint_url.startswith('http://localhost'):
                # Check Ollama health
                async with aiohttp.ClientSession() as session:
                    async with session.get(f"{endpoint.endpoint_url}/api/tags", timeout=aiohttp.ClientTimeout(total=2)) as response:
                        return response.status == 200
            elif 'openai' in endpoint.endpoint_url:
                # OpenAI doesn't have a simple health endpoint, check if key exists
                return endpoint.api_key is not None
            elif 'anthropic' in endpoint.endpoint_url:
                # Anthropic doesn't have a simple health endpoint, check if key exists
                return endpoint.api_key is not None
            else:
                return False
        except Exception as e:
            logger.debug(f"Health check failed for {endpoint.name}: {e}")
            return False
    
    async def _update_health_status(self):
        """Update health status for all endpoints"""
        tasks = [self._check_health(ep) for ep in self.endpoints]
        results = await asyncio.gather(*tasks)
        for endpoint, is_healthy in zip(self.endpoints, results):
            endpoint.is_healthy = is_healthy
    
    def _get_best_endpoint(self, 
                          request_type: str = "general",
                          require_premium: bool = False,
                          max_response_time: Optional[float] = None) -> Optional[ModelEndpoint]:
        """
        Select the best endpoint based on criteria
        
        Args:
            request_type: Type of request (general, code, analysis, creative)
            require_premium: Force use of premium models
            max_response_time: Maximum acceptable response time in seconds
        
        Returns:
            Best available endpoint or None
        """
        # Filter by health and requirements
        candidates = [ep for ep in self.endpoints if ep.is_healthy]
        
        if require_premium:
            candidates = [ep for ep in candidates if ep.tier == ModelTier.PREMIUM]
        
        if max_response_time:
            candidates = [ep for ep in candidates 
                         if ep.avg_response_time == 0 or ep.avg_response_time <= max_response_time]
        
        if not candidates:
            logger.warning("No healthy candidates available")
            return None
        
        # Sort by priority, then success rate, then response time
        candidates.sort(key=lambda ep: (
            ep.priority,
            -ep.success_rate,
            ep.avg_response_time if ep.avg_response_time > 0 else float('inf')
        ))
        
        return candidates[0]
    
    async def _call_ollama(self, endpoint: ModelEndpoint, prompt: str, system_prompt: Optional[str] = None) -> Tuple[str, float]:
        """Call Ollama endpoint"""
        start_time = time.time()
        
        async with aiohttp.ClientSession() as session:
            payload = {
                "model": endpoint.model_name,
                "prompt": prompt,
                "stream": False
            }
            
            if system_prompt:
                payload["system"] = system_prompt
            
            async with session.post(
                f"{endpoint.endpoint_url}/api/generate",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as response:
                response.raise_for_status()
                result = await response.json()
                elapsed = time.time() - start_time
                return result.get('response', ''), elapsed
    
    async def _call_openai(self, endpoint: ModelEndpoint, prompt: str, system_prompt: Optional[str] = None) -> Tuple[str, float]:
        """Call OpenAI endpoint"""
        start_time = time.time()
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                endpoint.endpoint_url,
                headers={
                    "Authorization": f"Bearer {endpoint.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": endpoint.model_name,
                    "messages": messages
                },
                timeout=aiohttp.ClientTimeout(total=60)
            ) as response:
                response.raise_for_status()
                result = await response.json()
                elapsed = time.time() - start_time
                return result['choices'][0]['message']['content'], elapsed
    
    async def _call_anthropic(self, endpoint: ModelEndpoint, prompt: str, system_prompt: Optional[str] = None) -> Tuple[str, float]:
        """Call Anthropic endpoint"""
        start_time = time.time()
        
        async with aiohttp.ClientSession() as session:
            payload = {
                "model": endpoint.model_name,
                "max_tokens": 1024,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
            
            if system_prompt:
                payload["system"] = system_prompt
            
            async with session.post(
                endpoint.endpoint_url,
                headers={
                    "x-api-key": endpoint.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json=payload,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as response:
                response.raise_for_status()
                result = await response.json()
                elapsed = time.time() - start_time
                return result['content'][0]['text'], elapsed
    
    async def generate(self,
                      prompt: str,
                      system_prompt: Optional[str] = None,
                      request_type: str = "general",
                      require_premium: bool = False,
                      max_response_time: Optional[float] = None) -> Dict[str, Any]:
        """
        Generate a response using the best available model
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            request_type: Type of request
            require_premium: Force premium models
            max_response_time: Max acceptable response time
        
        Returns:
            Response dict with content, metadata, and performance info
        """
        # Update health status
        await self._update_health_status()
        
        # Try endpoints in priority order
        attempts = []
        response_content = None
        used_endpoint = None
        
        while not response_content:
            endpoint = self._get_best_endpoint(request_type, require_premium, max_response_time)
            
            if not endpoint:
                # No more endpoints to try - use fallback
                logger.error("All endpoints failed, using fallback")
                return {
                    'content': "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
                    'model': 'fallback',
                    'tier': ModelTier.FALLBACK.value,
                    'attempts': attempts,
                    'success': False
                }
            
            try:
                logger.info(f"Trying {endpoint.name} ({endpoint.tier.value})")
                
                # Route to appropriate caller
                if 'ollama' in endpoint.endpoint_url or endpoint.endpoint_url.startswith('http://localhost'):
                    response_content, elapsed = await self._call_ollama(endpoint, prompt, system_prompt)
                elif 'openai' in endpoint.endpoint_url:
                    response_content, elapsed = await self._call_openai(endpoint, prompt, system_prompt)
                elif 'anthropic' in endpoint.endpoint_url:
                    response_content, elapsed = await self._call_anthropic(endpoint, prompt, system_prompt)
                
                # Success!
                used_endpoint = endpoint
                
                # Update metrics
                endpoint.last_used = datetime.now()
                if endpoint.avg_response_time == 0:
                    endpoint.avg_response_time = elapsed
                else:
                    endpoint.avg_response_time = 0.8 * endpoint.avg_response_time + 0.2 * elapsed
                
                endpoint.success_rate = 0.95 * endpoint.success_rate + 0.05 * 1.0
                
                attempts.append({
                    'endpoint': endpoint.name,
                    'success': True,
                    'elapsed': elapsed
                })
                
                logger.info(f"✅ Success with {endpoint.name} in {elapsed:.2f}s")
                
            except Exception as e:
                logger.warning(f"❌ Failed with {endpoint.name}: {e}")
                endpoint.is_healthy = False
                endpoint.success_rate = 0.95 * endpoint.success_rate + 0.05 * 0.0
                
                attempts.append({
                    'endpoint': endpoint.name,
                    'success': False,
                    'error': str(e)
                })
        
        # Record request
        request_record = {
            'timestamp': datetime.now().isoformat(),
            'request_type': request_type,
            'endpoint': used_endpoint.name,
            'tier': used_endpoint.tier.value,
            'response_time': elapsed,
            'attempts': len(attempts),
            'success': True
        }
        self.request_history.append(request_record)
        
        # Save metrics periodically
        if len(self.request_history) % 10 == 0:
            self._save_metrics()
        
        return {
            'content': response_content,
            'model': used_endpoint.name,
            'model_name': used_endpoint.model_name,
            'tier': used_endpoint.tier.value,
            'response_time': elapsed,
            'token_speed': used_endpoint.token_speed,
            'attempts': attempts,
            'success': True
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        return {
            'endpoints': [ep.to_dict() for ep in self.endpoints],
            'total_requests': len(self.request_history),
            'recent_requests': self.request_history[-10:],
            'health_summary': {
                'healthy': sum(1 for ep in self.endpoints if ep.is_healthy),
                'total': len(self.endpoints)
            }
        }


# Singleton instance
_router_instance = None

def get_router() -> AIRouterService:
    """Get or create the router singleton"""
    global _router_instance
    if _router_instance is None:
        _router_instance = AIRouterService()
    return _router_instance


# Example usage
if __name__ == "__main__":
    async def test_router():
        router = get_router()
        
        # Test a simple request
        result = await router.generate(
            prompt="What is 2+2?",
            system_prompt="You are a helpful math assistant."
        )
        
        print(f"\n✅ Response: {result['content']}")
        print(f"📊 Model: {result['model_name']} ({result['tier']})")
        print(f"⚡ Response time: {result['response_time']:.2f}s")
        print(f"🔄 Attempts: {len(result['attempts'])}")
        
        # Show stats
        stats = router.get_stats()
        print(f"\n📈 Router Stats:")
        print(f"   Total requests: {stats['total_requests']}")
        print(f"   Healthy endpoints: {stats['health_summary']['healthy']}/{stats['health_summary']['total']}")
    
    asyncio.run(test_router())















