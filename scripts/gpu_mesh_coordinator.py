#!/usr/bin/env python3
"""
Aurora AI GPU Mesh Coordinator
4-node fault-tolerant distributed GPU processing system
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import aiohttp
import redis
from dataclasses import dataclass, asdict
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NodeStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"
    RECOVERING = "recovering"

class TaskPriority(Enum):
    CRITICAL = 1  # Revenue-generating tasks
    HIGH = 2      # Business operations
    NORMAL = 3    # Standard AI processing
    LOW = 4       # Background tasks

@dataclass
class GPUNode:
    node_id: str
    host: str
    port: int
    gpu_count: int
    gpu_memory: int
    status: NodeStatus
    current_load: float
    memory_used: float
    last_heartbeat: datetime
    capabilities: List[str]
    performance_score: float = 0.0

@dataclass
class Task:
    task_id: str
    priority: TaskPriority
    node_requirements: Dict
    estimated_duration: float
    created_at: datetime
    assigned_node: Optional[str] = None
    status: str = "pending"

class GPUMeshCoordinator:
    def __init__(self, redis_host="localhost", redis_port=6379):
        self.redis_client = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
        self.nodes: Dict[str, GPUNode] = {}
        self.task_queue: List[Task] = []
        self.running = False
        
        # Performance metrics
        self.metrics = {
            "total_tasks_processed": 0,
            "average_task_duration": 0.0,
            "node_utilization": {},
            "failover_count": 0,
            "last_health_check": None
        }
        
        # Business priority weights
        self.business_weights = {
            "revenue_generation": 1.0,
            "customer_interaction": 0.9,
            "deal_processing": 0.95,
            "background_analysis": 0.3
        }

    async def start(self):
        """Start the GPU mesh coordinator"""
        logger.info("🚀 Starting Aurora AI GPU Mesh Coordinator...")
        self.running = True
        
        # Start background tasks
        asyncio.create_task(self._health_monitor())
        asyncio.create_task(self._load_balancer())
        asyncio.create_task(self._metrics_collector())
        
        # Register known nodes
        await self._register_initial_nodes()
        
        logger.info("✅ GPU Mesh Coordinator started successfully")

    async def _register_initial_nodes(self):
        """Register the 4-node GPU mesh topology"""
        initial_nodes = [
            {
                "node_id": "aurora-town-main",
                "host": "aurora-town-u44170.vm.elestio.app",
                "port": 8001,
                "gpu_count": 2,
                "gpu_memory": 24,
                "capabilities": ["llm_inference", "training", "business_processing"]
            },
            {
                "node_id": "iceland-compute",
                "host": "82.221.170.242",
                "port": 24505,
                "gpu_count": 1,
                "gpu_memory": 24,
                "capabilities": ["llm_inference", "analysis"]
            },
            {
                "node_id": "vengeance-dev",
                "host": "localhost",
                "port": 8002,
                "gpu_count": 1,
                "gpu_memory": 24,
                "capabilities": ["training", "development", "testing"]
            },
            {
                "node_id": "backup-node",
                "host": "backup.aurora.ai",
                "port": 8003,
                "gpu_count": 1,
                "gpu_memory": 16,
                "capabilities": ["llm_inference", "backup"]
            }
        ]
        
        for node_config in initial_nodes:
            node = GPUNode(
                node_id=node_config["node_id"],
                host=node_config["host"],
                port=node_config["port"],
                gpu_count=node_config["gpu_count"],
                gpu_memory=node_config["gpu_memory"],
                status=NodeStatus.HEALTHY,
                current_load=0.0,
                memory_used=0.0,
                last_heartbeat=datetime.now(),
                capabilities=node_config["capabilities"],
                performance_score=1.0
            )
            self.nodes[node.node_id] = node
            logger.info(f"📡 Registered node: {node.node_id} at {node.host}:{node.port}")

    async def _health_monitor(self):
        """Continuously monitor GPU node health"""
        while self.running:
            try:
                for node_id, node in self.nodes.items():
                    health_status = await self._check_node_health(node)
                    
                    if health_status != node.status:
                        logger.warning(f"⚠️ Node {node_id} status changed: {node.status.value} → {health_status.value}")
                        
                        if health_status == NodeStatus.FAILED:
                            await self._handle_node_failure(node_id)
                        elif health_status == NodeStatus.RECOVERING:
                            await self._handle_node_recovery(node_id)
                    
                    node.status = health_status
                    node.last_heartbeat = datetime.now()
                
                self.metrics["last_health_check"] = datetime.now()
                
            except Exception as e:
                logger.error(f"❌ Health monitor error: {e}")
            
            await asyncio.sleep(30)  # Check every 30 seconds

    async def _check_node_health(self, node: GPUNode) -> NodeStatus:
        """Check individual node health"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"http://{node.host}:{node.port}/health", timeout=5) as response:
                    if response.status == 200:
                        data = await response.json()
                        node.current_load = data.get("gpu_utilization", 0.0)
                        node.memory_used = data.get("memory_used", 0.0)
                        node.performance_score = data.get("performance_score", 1.0)
                        
                        # Determine status based on metrics
                        if node.current_load > 95 or node.memory_used > 95:
                            return NodeStatus.DEGRADED
                        elif node.current_load > 85:
                            return NodeStatus.DEGRADED
                        else:
                            return NodeStatus.HEALTHY
                    else:
                        return NodeStatus.FAILED
                        
        except Exception as e:
            logger.error(f"❌ Health check failed for {node.node_id}: {e}")
            return NodeStatus.FAILED

    async def _load_balancer(self):
        """Distribute tasks across healthy nodes"""
        while self.running:
            try:
                # Get pending tasks
                pending_tasks = [task for task in self.task_queue if task.status == "pending"]
                
                if pending_tasks:
                    # Sort by priority (Critical first)
                    pending_tasks.sort(key=lambda t: t.priority.value)
                    
                    # Assign tasks to best available nodes
                    for task in pending_tasks:
                        best_node = await self._find_best_node(task)
                        if best_node:
                            await self._assign_task(task, best_node)
                        else:
                            logger.warning(f"⚠️ No available nodes for task {task.task_id}")
                
                await asyncio.sleep(5)  # Check every 5 seconds
                
            except Exception as e:
                logger.error(f"❌ Load balancer error: {e}")

    async def _find_best_node(self, task: Task) -> Optional[GPUNode]:
        """Find the best available node for a task"""
        available_nodes = [
            node for node in self.nodes.values()
            if node.status == NodeStatus.HEALTHY and self._node_can_handle_task(node, task)
        ]
        
        if not available_nodes:
            return None
        
        # Score nodes based on multiple factors
        scored_nodes = []
        for node in available_nodes:
            score = self._calculate_node_score(node, task)
            scored_nodes.append((score, node))
        
        # Return highest scoring node
        scored_nodes.sort(key=lambda x: x[0], reverse=True)
        return scored_nodes[0][1]

    def _calculate_node_score(self, node: GPUNode, task: Task) -> float:
        """Calculate node suitability score for a task"""
        # Base score from performance
        score = node.performance_score
        
        # Penalize high utilization
        utilization_penalty = node.current_load * 0.5
        memory_penalty = (node.memory_used / 100) * 0.3
        
        # Bonus for business-critical tasks
        business_bonus = 0.0
        if "revenue" in task.task_id.lower() or "deal" in task.task_id.lower():
            business_bonus = 0.2
        
        # Capability matching bonus
        capability_bonus = 0.1 if self._node_has_required_capabilities(node, task) else 0.0
        
        final_score = score - utilization_penalty - memory_penalty + business_bonus + capability_bonus
        return max(0.0, final_score)

    def _node_can_handle_task(self, node: GPUNode, task: Task) -> bool:
        """Check if node can handle the task requirements"""
        # Check GPU memory requirements
        required_memory = task.node_requirements.get("gpu_memory", 0)
        if required_memory > node.gpu_memory:
            return False
        
        # Check capability requirements
        required_capabilities = task.node_requirements.get("capabilities", [])
        if not all(cap in node.capabilities for cap in required_capabilities):
            return False
        
        # Check current utilization
        if node.current_load > 90:
            return False
        
        return True

    def _node_has_required_capabilities(self, node: GPUNode, task: Task) -> bool:
        """Check if node has all required capabilities"""
        required_capabilities = task.node_requirements.get("capabilities", [])
        return all(cap in node.capabilities for cap in required_capabilities)

    async def _assign_task(self, task: Task, node: GPUNode):
        """Assign task to a specific node"""
        task.assigned_node = node.node_id
        task.status = "assigned"
        
        # Update node load
        estimated_load = task.estimated_duration * 0.1  # Rough estimate
        node.current_load = min(100, node.current_load + estimated_load)
        
        logger.info(f"📋 Assigned task {task.task_id} to node {node.node_id}")
        
        # Store in Redis for persistence
        await self._store_task_assignment(task)

    async def _store_task_assignment(self, task: Task):
        """Store task assignment in Redis"""
        task_data = {
            "task_id": task.task_id,
            "assigned_node": task.assigned_node,
            "status": task.status,
            "assigned_at": datetime.now().isoformat()
        }
        
        self.redis_client.hset("task_assignments", task.task_id, json.dumps(task_data))

    async def _handle_node_failure(self, node_id: str):
        """Handle node failure with automatic failover"""
        logger.error(f"💥 Node {node_id} failed! Initiating failover...")
        
        # Reassign tasks from failed node
        failed_tasks = [task for task in self.task_queue if task.assigned_node == node_id]
        
        for task in failed_tasks:
            task.status = "pending"
            task.assigned_node = None
            logger.info(f"🔄 Requeuing task {task.task_id} from failed node {node_id}")
        
        self.metrics["failover_count"] += 1
        
        # Update node status
        self.nodes[node_id].status = NodeStatus.FAILED

    async def _handle_node_recovery(self, node_id: str):
        """Handle node recovery"""
        logger.info(f"🔄 Node {node_id} is recovering...")
        
        # Reset node metrics
        self.nodes[node_id].current_load = 0.0
        self.nodes[node_id].memory_used = 0.0
        self.nodes[node_id].status = NodeStatus.HEALTHY
        
        logger.info(f"✅ Node {node_id} recovered successfully")

    async def _metrics_collector(self):
        """Collect and store performance metrics"""
        while self.running:
            try:
                # Calculate current metrics
                total_nodes = len(self.nodes)
                healthy_nodes = len([n for n in self.nodes.values() if n.status == NodeStatus.HEALTHY])
                avg_utilization = sum(n.current_load for n in self.nodes.values()) / total_nodes if total_nodes > 0 else 0
                
                self.metrics.update({
                    "total_nodes": total_nodes,
                    "healthy_nodes": healthy_nodes,
                    "average_utilization": avg_utilization,
                    "timestamp": datetime.now().isoformat()
                })
                
                # Store in Redis
                self.redis_client.hset("mesh_metrics", "current", json.dumps(self.metrics))
                
                await asyncio.sleep(60)  # Update every minute
                
            except Exception as e:
                logger.error(f"❌ Metrics collection error: {e}")

    async def submit_task(self, task_id: str, priority: TaskPriority, requirements: Dict, estimated_duration: float) -> bool:
        """Submit a new task to the mesh"""
        task = Task(
            task_id=task_id,
            priority=priority,
            node_requirements=requirements,
            estimated_duration=estimated_duration,
            created_at=datetime.now()
        )
        
        self.task_queue.append(task)
        logger.info(f"📥 Submitted task {task_id} with priority {priority.name}")
        
        return True

    def get_mesh_status(self) -> Dict:
        """Get current mesh status"""
        return {
            "nodes": {node_id: asdict(node) for node_id, node in self.nodes.items()},
            "metrics": self.metrics,
            "task_queue_size": len([t for t in self.task_queue if t.status == "pending"]),
            "timestamp": datetime.now().isoformat()
        }

    async def stop(self):
        """Stop the GPU mesh coordinator"""
        logger.info("🛑 Stopping GPU Mesh Coordinator...")
        self.running = False

# Main execution
async def main():
    coordinator = GPUMeshCoordinator()
    
    try:
        await coordinator.start()
        
        # Example: Submit a business-critical task
        await coordinator.submit_task(
            task_id="deal_analysis_001",
            priority=TaskPriority.CRITICAL,
            requirements={
                "gpu_memory": 8,
                "capabilities": ["llm_inference", "business_processing"]
            },
            estimated_duration=30.0
        )
        
        # Keep running
        while True:
            status = coordinator.get_mesh_status()
            total_nodes = len(status['nodes'])
            healthy_nodes = sum(1 for n in status['nodes'].values() if n['status'] == 'healthy')
            logger.info(f"📊 Mesh Status: {healthy_nodes}/{total_nodes} nodes healthy, {status['task_queue_size']} tasks queued")
            await asyncio.sleep(60)
            
    except KeyboardInterrupt:
        logger.info("🛑 Received shutdown signal")
    finally:
        await coordinator.stop()

if __name__ == "__main__":
    asyncio.run(main())