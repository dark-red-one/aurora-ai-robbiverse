"""
Performance Optimization - Response Caching for Robbie
Caches common queries to improve response time
"""
import hashlib
import json
import time
from typing import Dict, Optional, Any
from collections import OrderedDict
import structlog

logger = structlog.get_logger()

class ResponseCache:
    """
    LRU cache for Ollama responses
    
    Revenue Impact:
    - Instant responses for common questions → Better demo experience
    - Reduced server load → More concurrent users
    - Lower latency → Professional feel
    """
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 300):
        """
        Initialize cache
        
        Args:
            max_size: Maximum number of cached responses
            ttl_seconds: Time-to-live for cache entries (default 5 min)
        """
        self.cache: OrderedDict = OrderedDict()
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        
        # Stats
        self.hits = 0
        self.misses = 0
        self.evictions = 0
    
    def _make_key(self, prompt: str, model: str, context: Optional[Dict] = None) -> str:
        """Generate cache key from prompt, model, and context"""
        # Normalize prompt (strip whitespace, lowercase)
        normalized_prompt = prompt.strip().lower()
        
        # Include relevant context in key
        context_str = ""
        if context:
            # Only include certain context fields in cache key
            relevant_context = {
                k: v for k, v in context.items()
                if k in ['user_id', 'conversation_id', 'file_path']
            }
            context_str = json.dumps(relevant_context, sort_keys=True)
        
        # Create hash
        key_string = f"{model}:{normalized_prompt}:{context_str}"
        return hashlib.sha256(key_string.encode()).hexdigest()
    
    def get(
        self,
        prompt: str,
        model: str,
        context: Optional[Dict] = None
    ) -> Optional[Dict]:
        """
        Get cached response if available and not expired
        
        Returns:
            Cached response dict or None if not found/expired
        """
        key = self._make_key(prompt, model, context)
        
        if key not in self.cache:
            self.misses += 1
            return None
        
        entry = self.cache[key]
        
        # Check if expired
        age = time.time() - entry['timestamp']
        if age > self.ttl_seconds:
            del self.cache[key]
            self.misses += 1
            logger.debug("Cache expired", key=key[:8], age=age)
            return None
        
        # Move to end (mark as recently used)
        self.cache.move_to_end(key)
        self.hits += 1
        
        logger.debug(
            "Cache hit",
            key=key[:8],
            age=age,
            hit_rate=self.get_hit_rate()
        )
        
        return entry['response']
    
    def set(
        self,
        prompt: str,
        model: str,
        response: Dict,
        context: Optional[Dict] = None
    ):
        """
        Cache a response
        
        Args:
            prompt: User prompt
            model: Model used
            response: Response dict from Ollama
            context: Optional context dict
        """
        key = self._make_key(prompt, model, context)
        
        # Evict oldest if at capacity
        if len(self.cache) >= self.max_size:
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]
            self.evictions += 1
            logger.debug("Cache eviction", key=oldest_key[:8])
        
        self.cache[key] = {
            'response': response,
            'timestamp': time.time()
        }
        
        logger.debug("Cache set", key=key[:8], size=len(self.cache))
    
    def invalidate(self, pattern: Optional[str] = None):
        """
        Invalidate cache entries
        
        Args:
            pattern: If provided, only invalidate keys containing pattern
                    If None, clear entire cache
        """
        if pattern is None:
            count = len(self.cache)
            self.cache.clear()
            logger.info("Cache cleared", entries=count)
        else:
            keys_to_delete = [
                k for k in self.cache.keys()
                if pattern in k
            ]
            for key in keys_to_delete:
                del self.cache[key]
            logger.info("Cache invalidated", pattern=pattern, entries=len(keys_to_delete))
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "hits": self.hits,
            "misses": self.misses,
            "evictions": self.evictions,
            "hit_rate": f"{hit_rate:.1f}%",
            "total_requests": total_requests
        }
    
    def get_hit_rate(self) -> float:
        """Get hit rate as percentage"""
        total = self.hits + self.misses
        return (self.hits / total * 100) if total > 0 else 0.0


class ModelPreloader:
    """
    Pre-load models into memory for faster first response
    
    Revenue Impact:
    - No cold start delay → Professional experience
    - Faster demos → Better first impression
    - Consistent performance → Reliable product
    """
    
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.preloaded_models = set()
    
    async def preload_model(self, model: str):
        """Pre-load a model by sending a dummy request"""
        if model in self.preloaded_models:
            return
        
        import httpx
        
        try:
            logger.info("Pre-loading model", model=model)
            start_time = time.time()
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": model,
                        "prompt": "Ready",
                        "stream": False
                    }
                )
            
            load_time = time.time() - start_time
            self.preloaded_models.add(model)
            
            logger.info(
                "Model pre-loaded",
                model=model,
                load_time=f"{load_time:.2f}s"
            )
            
        except Exception as e:
            logger.error("Model pre-load failed", model=model, error=str(e))
    
    async def preload_all_robbie_models(self):
        """Pre-load all Robbie models"""
        models = [
            "qwen2.5-coder:7b",
            "qwen2.5-coder:32k",
            "llama3.2-vision:11b"
        ]
        
        for model in models:
            await self.preload_model(model)


# Global cache instance
_cache = None

def get_cache() -> ResponseCache:
    """Get global cache instance"""
    global _cache
    if _cache is None:
        _cache = ResponseCache()
    return _cache


# Convenience functions
def cache_response(prompt: str, model: str, response: Dict, context: Optional[Dict] = None):
    """Cache a response"""
    cache = get_cache()
    cache.set(prompt, model, response, context)


def get_cached_response(prompt: str, model: str, context: Optional[Dict] = None) -> Optional[Dict]:
    """Get cached response"""
    cache = get_cache()
    return cache.get(prompt, model, context)


def get_cache_stats() -> Dict:
    """Get cache statistics"""
    cache = get_cache()
    return cache.get_stats()


# Test if run directly
if __name__ == "__main__":
    import asyncio
    
    async def test_cache():
        """Test cache functionality"""
        cache = ResponseCache(max_size=5, ttl_seconds=2)
        
        print("🧪 Testing Response Cache\n")
        
        # Test set/get
        print("Test 1: Set and get")
        cache.set("test prompt", "qwen2.5:7b", {"response": "test response"})
        result = cache.get("test prompt", "qwen2.5:7b")
        print(f"  Result: {result}")
        print(f"  Stats: {cache.get_stats()}\n")
        
        # Test normalization (should hit cache)
        print("Test 2: Normalization (whitespace/case)")
        result = cache.get("  TEST PROMPT  ", "qwen2.5:7b")
        print(f"  Result: {result}")
        print(f"  Stats: {cache.get_stats()}\n")
        
        # Test miss
        print("Test 3: Cache miss")
        result = cache.get("different prompt", "qwen2.5:7b")
        print(f"  Result: {result}")
        print(f"  Stats: {cache.get_stats()}\n")
        
        # Test expiration
        print("Test 4: Expiration (waiting 3 seconds)")
        await asyncio.sleep(3)
        result = cache.get("test prompt", "qwen2.5:7b")
        print(f"  Result: {result}")
        print(f"  Stats: {cache.get_stats()}\n")
        
        # Test eviction
        print("Test 5: Eviction (max_size=5)")
        for i in range(6):
            cache.set(f"prompt {i}", "qwen2.5:7b", {"response": f"response {i}"})
        print(f"  Cache size: {len(cache.cache)}")
        print(f"  Stats: {cache.get_stats()}\n")
        
        print("✅ All cache tests complete!")
    
    asyncio.run(test_cache())


