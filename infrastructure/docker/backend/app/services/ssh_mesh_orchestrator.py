"""
SSH MESH ORCHESTRATOR
Simple, scalable, no port juggling!

Every node accessed via SSH, all use port 11434 locally.
"""

import asyncio
import subprocess
import json
import time
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class SSHNode:
    """A node in the SSH mesh"""
    name: str
    ssh_alias: str  # From ~/.ssh/config (e.g., "vengeance", "aurora", "runpod")
    priority: int
    active_requests: int = 0
    total_requests: int = 0
    failures: int = 0
    avg_latency: float = 0.0
    status: str = 'unknown'
    
    def load_score(self) -> float:
        """Calculate load score (lower is better)"""
        return (self.active_requests * 100) + (self.avg_latency * 10) + (self.failures * 50)


class SSHMeshOrchestrator:
    """
    Orchestrator that routes requests across SSH mesh
    No port forwarding, no tunnels, just SSH!
    """
    
    def __init__(self):
        self.nodes = [
            SSHNode(
                name="Vengeance RTX 4090",
                ssh_alias="vengeance",
                priority=1
            ),
            SSHNode(
                name="RunPod RTX 4090",
                ssh_alias="runpod",
                priority=2
            ),
            SSHNode(
                name="Aurora CPU",
                ssh_alias="aurora",
                priority=3
            )
        ]
        
        self._lock = asyncio.Lock()
        self._health_check_task = None
    
    async def initialize(self):
        """Initialize the orchestrator"""
        logger.info("🚀 SSH Mesh Orchestrator initializing...")
        
        # Initial health check
        await self.check_all_nodes()
        
        # Start continuous monitoring
        self._health_check_task = asyncio.create_task(self._continuous_health_check())
        
        logger.info("✅ SSH Mesh Orchestrator ready")
    
    async def _continuous_health_check(self):
        """Background health monitoring"""
        while True:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                await self.check_all_nodes()
            except Exception as e:
                logger.error(f"Health check error: {e}")
    
    async def check_all_nodes(self):
        """Check health of all nodes"""
        tasks = []
        for node in self.nodes:
            tasks.append(self._check_node(node))
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _check_node(self, node: SSHNode):
        """Check if a node is healthy via SSH"""
        try:
            start = time.time()
            
            # SSH to node and check Ollama
            cmd = [
                "ssh", "-o", "ConnectTimeout=2",
                "-o", "BatchMode=yes",
                node.ssh_alias,
                "curl -s http://localhost:11434/api/tags"
            ]
            
            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(result.communicate(), timeout=5)
            
            if result.returncode == 0:
                latency = (time.time() - start) * 1000
                node.status = 'online'
                node.avg_latency = (node.avg_latency + latency) / 2 if node.avg_latency > 0 else latency
                node.failures = max(0, node.failures - 1)  # Decay failures
                logger.debug(f"✅ {node.name}: ONLINE ({latency:.0f}ms)")
            else:
                node.status = 'offline'
                node.failures += 1
                logger.debug(f"❌ {node.name}: OFFLINE")
                
        except Exception as e:
            node.status = 'offline'
            node.failures += 1
            logger.debug(f"❌ {node.name}: ERROR ({str(e)[:50]})")
    
    async def select_best_node(self) -> Optional[SSHNode]:
        """Select best node based on load score"""
        async with self._lock:
            # Get online nodes
            available = [n for n in self.nodes if n.status == 'online']
            
            if not available:
                logger.error("❌ No nodes available!")
                return None
            
            # Sort by load score (lower is better), then priority
            available.sort(key=lambda n: (n.load_score(), n.priority))
            
            best = available[0]
            logger.info(f"🎯 Selected: {best.name} (load: {best.load_score():.1f})")
            
            return best
    
    async def generate(self, model: str, prompt: str, stream: bool = False) -> Dict:
        """
        Generate response using best available node
        Routes via SSH - no port forwarding needed!
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
                
                # Build request
                request_data = {
                    "model": model,
                    "prompt": prompt,
                    "stream": stream
                }
                
                # SSH to node and call its local Ollama
                cmd = [
                    "ssh", "-o", "ConnectTimeout=5",
                    "-o", "BatchMode=yes",
                    node.ssh_alias,
                    f"curl -s http://localhost:11434/api/generate -d '{json.dumps(request_data)}'"
                ]
                
                logger.info(f"📡 Calling {node.name} via SSH...")
                
                result = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                stdout, stderr = await asyncio.wait_for(result.communicate(), timeout=60)
                
                if result.returncode == 0:
                    response = json.loads(stdout.decode())
                    
                    # Record success metrics
                    latency = (time.time() - start) * 1000
                    async with self._lock:
                        node.total_requests += 1
                        node.avg_latency = (node.avg_latency + latency) / 2 if node.avg_latency > 0 else latency
                        node.active_requests -= 1
                    
                    # Add metadata
                    response['_node'] = node.name
                    response['_latency_ms'] = latency
                    response['_via'] = 'ssh'
                    
                    logger.info(f"✅ {node.name} completed in {latency:.0f}ms")
                    return response
                else:
                    raise Exception(f"SSH command failed: {stderr.decode()[:100]}")
                    
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
                    await asyncio.sleep(0.5)
                else:
                    raise Exception(f"All nodes failed after {max_retries} attempts")
    
    def get_stats(self) -> Dict:
        """Get current mesh statistics"""
        stats = {}
        for node in self.nodes:
            stats[node.ssh_alias] = {
                'name': node.name,
                'status': node.status,
                'active_requests': node.active_requests,
                'total_requests': node.total_requests,
                'avg_latency_ms': node.avg_latency,
                'failures': node.failures,
                'load_score': node.load_score(),
                'ssh_alias': node.ssh_alias
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


# Global orchestrator instance
_orchestrator: Optional[SSHMeshOrchestrator] = None


async def get_ssh_orchestrator() -> SSHMeshOrchestrator:
    """Get or create the global SSH orchestrator instance"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = SSHMeshOrchestrator()
        await _orchestrator.initialize()
    return _orchestrator
