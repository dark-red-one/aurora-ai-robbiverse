"""
SMART LOAD BALANCER
Automatically distributes LLM requests across mesh nodes
"""

import asyncio
import aiohttp
import time
import logging
from typing import Optional, Dict, List
from collections import deque
from datetime import datetime

logger = logging.getLogger(__name__)


class NodeMetrics:
    def __init__(self, name: str, endpoint: str, priority: int):
        self.name = name
        self.endpoint = endpoint
        self.priority = priority
        self.active_requests = 0
        self.total_requests = 0
        self.total_latency = 0
        self.failures = 0
        self.last_check = None
        self.status = 'unknown'
        self.recent_latencies = deque(maxlen=10)  # Last 10 request latencies
        
    @property
    def avg_latency(self) -> float:
        """Average latency from recent requests"""
        if not self.recent_latencies:
            return float('inf')
        return sum(self.recent_latencies) / len(self.recent_latencies)
    
    @property
    def load_score(self) -> float:
        """Lower is better - combines active requests and latency"""
        # Penalize nodes with many active requests
        # Penalize nodes with high latency
        # Penalize nodes with recent failures
        base_score = self.active_requests * 100
        latency_penalty = self.avg_latency / 1000  # Convert ms to seconds
        failure_penalty = self.failures * 50
        
        return base_score + latency_penalty + failure_penalty


class SmartLoadBalancer:
    def __init__(self):
        self.nodes = {
            'vengeance': NodeMetrics(
                name='Vengeance RTX 4090',
                endpoint='http://localhost:11434',
                priority=1
            ),
            'runpod': NodeMetrics(
                name='RunPod RTX 4090',
                endpoint='http://localhost:11435',  # Via Aurora tunnel
                priority=2
            ),
            'aurora': NodeMetrics(
                name='Aurora CPU',
                endpoint='http://localhost:11434',  # Direct on Aurora
                priority=3
            )
        }
        
        self._session: Optional[aiohttp.ClientSession] = None
        self._health_check_task = None
        self._lock = asyncio.Lock()
        
    async def initialize(self):
        """Initialize the load balancer"""
        logger.info("🚀 Smart Load Balancer initializing...")
        self._session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30))
        
        # Initial health check
        await self.check_all_nodes()
        
        # Start continuous health monitoring
        self._health_check_task = asyncio.create_task(self._continuous_health_check())
        
        logger.info("✅ Smart Load Balancer ready")
    
    async def _continuous_health_check(self):
        """Background task to continuously monitor node health"""
        while True:
            try:
                await asyncio.sleep(10)  # Check every 10 seconds
                await self.check_all_nodes()
            except Exception as e:
                logger.error(f"Health check error: {e}")
    
    async def check_all_nodes(self):
        """Check health of all nodes"""
        tasks = []
        for node_name, node in self.nodes.items():
            tasks.append(self._check_node(node_name, node))
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _check_node(self, node_name: str, node: NodeMetrics):
        """Check if a node is healthy"""
        try:
            start = time.time()
            async with self._session.get(f"{node.endpoint}/api/tags", timeout=aiohttp.ClientTimeout(total=2)) as response:
                if response.status == 200:
                    latency = (time.time() - start) * 1000
                    node.status = 'online'
                    node.last_check = datetime.now()
                    node.recent_latencies.append(latency)
                    node.failures = max(0, node.failures - 1)  # Decay failures
                    logger.debug(f"✅ {node.name}: ONLINE ({latency:.0f}ms)")
                else:
                    node.status = 'degraded'
                    node.failures += 1
        except Exception as e:
            node.status = 'offline'
            node.failures += 1
            logger.debug(f"❌ {node.name}: OFFLINE ({str(e)[:50]})")
    
    async def select_best_node(self) -> Optional[NodeMetrics]:
        """
        Select the best node using intelligent load balancing:
        1. Only consider online nodes
        2. Sort by load score (active requests + latency + failures)
        3. Use priority as tiebreaker
        """
        async with self._lock:
            # Get all online nodes
            available = [
                node for node in self.nodes.values()
                if node.status == 'online'
            ]
            
            if not available:
                logger.error("❌ No nodes available!")
                return None
            
            # Sort by load score (lower is better), then by priority
            available.sort(key=lambda n: (n.load_score, n.priority))
            
            best = available[0]
            logger.info(f"🎯 Selected: {best.name} (load: {best.load_score:.1f}, active: {best.active_requests})")
            
            return best
    
    async def generate(self, model: str, prompt: str, stream: bool = False) -> Dict:
        """
        Generate response using best available node
        Automatically handles failover if node fails
        """
        max_retries = 3
        attempt = 0
        
        while attempt < max_retries:
            node = await self.select_best_node()
            
            if not node:
                raise Exception("No nodes available")
            
            try:
                # Track active request
                async with self._lock:
                    node.active_requests += 1
                
                start = time.time()
                
                # Make the request
                async with self._session.post(
                    f"{node.endpoint}/api/generate",
                    json={
                        "model": model,
                        "prompt": prompt,
                        "stream": stream
                    }
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        
                        # Record success metrics
                        latency = (time.time() - start) * 1000
                        async with self._lock:
                            node.total_requests += 1
                            node.total_latency += latency
                            node.recent_latencies.append(latency)
                            node.active_requests -= 1
                        
                        # Add metadata about which node handled it
                        result['_node'] = node.name
                        result['_latency_ms'] = latency
                        
                        logger.info(f"✅ {node.name} completed request in {latency:.0f}ms")
                        return result
                    else:
                        raise Exception(f"HTTP {response.status}")
                        
            except Exception as e:
                logger.warning(f"⚠️  {node.name} failed: {e}")
                
                # Record failure
                async with self._lock:
                    node.active_requests = max(0, node.active_requests - 1)
                    node.failures += 1
                    node.status = 'degraded'
                
                attempt += 1
                
                if attempt < max_retries:
                    logger.info(f"🔄 Retrying with different node (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(0.5)  # Brief delay before retry
                else:
                    raise Exception(f"All nodes failed after {max_retries} attempts")
    
    def get_stats(self) -> Dict:
        """Get current load balancer statistics"""
        stats = {}
        for node_name, node in self.nodes.items():
            stats[node_name] = {
                'name': node.name,
                'status': node.status,
                'active_requests': node.active_requests,
                'total_requests': node.total_requests,
                'avg_latency_ms': node.avg_latency if node.recent_latencies else 0,
                'failures': node.failures,
                'load_score': node.load_score,
                'last_check': node.last_check.isoformat() if node.last_check else None
            }
        return stats
    
    async def cleanup(self):
        """Cleanup resources"""
        if self._health_check_task:
            self._health_check_task.cancel()
            try:
                await self._health_check_task
            except asyncio.CancelledError:
                pass
        
        if self._session:
            await self._session.close()


# Global load balancer instance
_load_balancer: Optional[SmartLoadBalancer] = None


async def get_load_balancer() -> SmartLoadBalancer:
    """Get or create the global load balancer instance"""
    global _load_balancer
    if _load_balancer is None:
        _load_balancer = SmartLoadBalancer()
        await _load_balancer.initialize()
    return _load_balancer
