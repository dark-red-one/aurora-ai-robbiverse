"""
ROBBIE RESOURCE ORCHESTRATOR
Intelligent network-aware resource discovery and routing over SSH mesh

Priority Order:
1. Vengeance RTX 4090 (via reverse SSH tunnel on localhost:11434)
2. Local Aurora CPU (localhost:11434 direct)
3. RunPod GPU (when available)
"""

import asyncio
import aiohttp
import logging
from typing import Optional, Dict, List
from datetime import datetime
import psutil

logger = logging.getLogger(__name__)


class ResourceNode:
    def __init__(self, name: str, priority: int, endpoints: Dict[str, str], capabilities: List[str]):
        self.name = name
        self.priority = priority
        self.endpoints = endpoints
        self.capabilities = capabilities
        self.status = 'unknown'
        self.last_check = None
        self.latency = None
        self.gpu_available = False
        self.gpu_name = None


class ResourceOrchestrator:
    def __init__(self):
        self.nodes = {
            'vengeance': ResourceNode(
                name='Vengeance RTX 4090',
                priority=1,
                endpoints={
                    'ollama': 'http://localhost:11434',  # Via reverse SSH tunnel
                    'gpu': 'http://localhost:8001',
                    'db': 'postgresql://localhost:5433/vengeance'
                },
                capabilities=['chat', 'llm', 'rtx-4090', 'gpu-inference']
            ),
            'aurora': ResourceNode(
                name='Aurora Town CPU',
                priority=2,
                endpoints={
                    'ollama': 'http://localhost:11434',  # Direct local
                    'db': 'postgresql://localhost:5432/aurora'
                },
                capabilities=['chat', 'llm', 'cpu-inference', 'database']
            ),
            'runpod': ResourceNode(
                name='RunPod GPU',
                priority=3,
                endpoints={
                    'ollama': 'http://localhost:11435',  # Via SSH tunnel (when configured)
                },
                capabilities=['chat', 'llm', 'gpu-inference', 'high-vram']
            )
        }
        
        self.current_node = None
        self.discovery_task = None
        self._session = None

    async def initialize(self):
        """Initialize orchestrator and start resource discovery"""
        logger.info("🚀 Robbie Resource Orchestrator starting...")
        
        # Create aiohttp session
        self._session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=2))
        
        # Initial discovery
        await self.discover_resources()
        
        # Start continuous monitoring (every 30 seconds)
        self.discovery_task = asyncio.create_task(self._continuous_discovery())
        
        logger.info(f"✅ Orchestrator initialized. Current node: {self.current_node.name if self.current_node else 'None'}")
        return self.current_node

    async def _continuous_discovery(self):
        """Background task for continuous resource discovery"""
        while True:
            try:
                await asyncio.sleep(30)
                await self.discover_resources()
            except Exception as e:
                logger.error(f"Error in continuous discovery: {e}")

    async def discover_resources(self):
        """Discover and test all available resources"""
        logger.info("🔍 Discovering available resources...")
        
        # Test all nodes in parallel
        tasks = []
        for node_name, node in self.nodes.items():
            tasks.append(self._test_node(node_name, node))
        
        await asyncio.gather(*tasks, return_exceptions=True)
        
        # Select best available resource
        self.select_best_resource()

    async def _test_node(self, node_name: str, node: ResourceNode):
        """Test if a node is available and responsive"""
        try:
            start_time = asyncio.get_event_loop().time()
            
            # Try to ping the Ollama endpoint
            async with self._session.get(f"{node.endpoints['ollama']}/api/tags") as response:
                if response.status == 200:
                    data = await response.json()
                    node.status = 'online'
                    node.latency = int((asyncio.get_event_loop().time() - start_time) * 1000)
                    node.last_check = datetime.now()
                    
                    # Check if it's a GPU node by looking at available models
                    if 'models' in data and len(data['models']) > 0:
                        # Vengeance has GPU if we can reach it on the tunnel
                        if node_name == 'vengeance':
                            node.gpu_available = True
                            node.gpu_name = 'RTX 4090'
                    
                    logger.info(f"✅ {node.name}: ONLINE ({node.latency}ms)")
                else:
                    node.status = 'degraded'
                    logger.warning(f"⚠️  {node.name}: DEGRADED (HTTP {response.status})")
        except asyncio.TimeoutError:
            node.status = 'offline'
            node.latency = None
            logger.debug(f"❌ {node.name}: TIMEOUT")
        except Exception as e:
            node.status = 'offline'
            node.latency = None
            logger.debug(f"❌ {node.name}: OFFLINE ({str(e)})")

    def select_best_resource(self):
        """Select the best available resource based on priority and status"""
        # Get all online nodes sorted by priority
        available = [
            node for node in self.nodes.values()
            if node.status == 'online'
        ]
        available.sort(key=lambda x: x.priority)
        
        if available:
            self.current_node = available[0]
            logger.info(f"🎯 Selected: {self.current_node.name} (Priority {self.current_node.priority}, {self.current_node.latency}ms)")
        else:
            # Fallback to Aurora (always assume local is available)
            self.current_node = self.nodes['aurora']
            logger.warning("⚠️  No nodes responding, using Aurora CPU fallback")

    def get_resource_info(self) -> Dict:
        """Get current resource info for UI display"""
        if not self.current_node:
            return {
                'name': 'No Resource',
                'status': 'offline',
                'hardware': 'Unknown',
                'capabilities': []
            }
        
        return {
            'name': self.current_node.name,
            'status': self.current_node.status,
            'latency': self.current_node.latency,
            'hardware': self._get_hardware_info(self.current_node),
            'capabilities': self.current_node.capabilities,
            'last_check': self.current_node.last_check.isoformat() if self.current_node.last_check else None,
            'gpu_available': self.current_node.gpu_available,
            'gpu_name': self.current_node.gpu_name
        }

    def _get_hardware_info(self, node: ResourceNode) -> str:
        """Get hardware info string for display"""
        if node.gpu_available and node.gpu_name:
            return f"GPU: {node.gpu_name}"
        elif 'vengeance' in node.name.lower():
            return 'GPU: RTX 4090'
        elif 'aurora' in node.name.lower():
            return 'CPU: AMD EPYC'
        elif 'runpod' in node.name.lower():
            return 'GPU: RunPod'
        return 'Unknown'

    def get_ollama_endpoint(self) -> str:
        """Get the Ollama endpoint for the current resource"""
        if not self.current_node:
            return 'http://localhost:11434'
        return self.current_node.endpoints.get('ollama', 'http://localhost:11434')

    def get_database_endpoint(self) -> str:
        """Get the database endpoint for the current resource"""
        if not self.current_node:
            return None
        return self.current_node.endpoints.get('db')

    def has_capability(self, capability: str) -> bool:
        """Check if current resource has a specific capability"""
        if not self.current_node:
            return False
        return capability in self.current_node.capabilities

    async def failover_and_retry(self):
        """Mark current node as degraded and select next best resource"""
        if self.current_node:
            logger.warning(f"🔄 Failing over from {self.current_node.name}")
            self.current_node.status = 'degraded'
        
        await self.discover_resources()
        
        if not self.current_node or self.current_node.status != 'online':
            raise Exception("All resources unavailable")

    async def cleanup(self):
        """Cleanup resources"""
        if self.discovery_task:
            self.discovery_task.cancel()
            try:
                await self.discovery_task
            except asyncio.CancelledError:
                pass
        
        if self._session:
            await self._session.close()


# Global orchestrator instance
_orchestrator: Optional[ResourceOrchestrator] = None


async def get_orchestrator() -> ResourceOrchestrator:
    """Get or create the global orchestrator instance"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = ResourceOrchestrator()
        await _orchestrator.initialize()
    return _orchestrator


async def get_current_resource_info() -> Dict:
    """Get current resource info (convenience function)"""
    orchestrator = await get_orchestrator()
    return orchestrator.get_resource_info()
