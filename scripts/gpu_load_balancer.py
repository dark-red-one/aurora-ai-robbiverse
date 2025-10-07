#!/usr/bin/env python3
"""
Aurora AI GPU Load Balancer
Priority-based workload distribution system for enterprise AI tasks
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import redis
import aiohttp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TaskType(Enum):
    REVENUE_GENERATION = "revenue_generation"
    CUSTOMER_INTERACTION = "customer_interaction"
    DEAL_PROCESSING = "deal_processing"
    BUSINESS_ANALYSIS = "business_analysis"
    BACKGROUND_ANALYSIS = "background_analysis"
    TRAINING = "training"
    DEVELOPMENT = "development"

class TaskStatus(Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class WorkloadTask:
    task_id: str
    task_type: TaskType
    priority: int  # 1 = highest, 10 = lowest
    estimated_duration: float  # seconds
    resource_requirements: Dict
    business_value: float  # 0.0 to 1.0
    created_at: datetime
    assigned_node: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

@dataclass
class NodeCapacity:
    node_id: str
    current_load: float  # 0.0 to 1.0
    available_memory: float  # GB
    available_gpus: int
    capabilities: List[str]
    performance_score: float
    business_priority_multiplier: float

class GPULoadBalancer:
    def __init__(self, redis_host="localhost", redis_port=6379):
        self.redis_client = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
        self.task_queue: List[WorkloadTask] = []
        self.node_capacities: Dict[str, NodeCapacity] = {}
        self.running = False
        
        # Business priority weights
        self.business_weights = {
            TaskType.REVENUE_GENERATION: 1.0,
            TaskType.CUSTOMER_INTERACTION: 0.95,
            TaskType.DEAL_PROCESSING: 0.9,
            TaskType.BUSINESS_ANALYSIS: 0.7,
            TaskType.BACKGROUND_ANALYSIS: 0.3,
            TaskType.TRAINING: 0.6,
            TaskType.DEVELOPMENT: 0.4
        }
        
        # Load balancing metrics
        self.metrics = {
            "total_tasks_processed": 0,
            "average_completion_time": 0.0,
            "node_utilization": {},
            "business_value_processed": 0.0,
            "failover_count": 0
        }

    async def start(self):
        """Start the load balancer"""
        logger.info("⚖️ Starting Aurora AI GPU Load Balancer...")
        self.running = True
        
        # Start background tasks
        asyncio.create_task(self._task_scheduler())
        asyncio.create_task(self._capacity_monitor())
        asyncio.create_task(self._metrics_collector())
        asyncio.create_task(self._cleanup_completed_tasks())
        
        logger.info("✅ GPU Load Balancer started successfully")

    async def _task_scheduler(self):
        """Main task scheduling loop"""
        while self.running:
            try:
                # Get pending tasks
                pending_tasks = [task for task in self.task_queue if task.status == TaskStatus.PENDING]
                
                if pending_tasks and self.node_capacities:
                    # Sort tasks by business priority
                    pending_tasks.sort(key=self._calculate_task_priority, reverse=True)
                    
                    # Assign tasks to best available nodes
                    for task in pending_tasks:
                        best_node = await self._find_optimal_node(task)
                        if best_node:
                            await self._assign_task_to_node(task, best_node)
                        else:
                            logger.warning(f"⚠️ No available capacity for task {task.task_id}")
                
                await asyncio.sleep(5)  # Schedule every 5 seconds
                
            except Exception as e:
                logger.error(f"❌ Task scheduler error: {e}")

    def _calculate_task_priority(self, task: WorkloadTask) -> float:
        """Calculate comprehensive task priority score"""
        # Base business value weight
        business_weight = self.business_weights.get(task.task_type, 0.5)
        
        # Time-based priority (older tasks get higher priority)
        age_hours = (datetime.now() - task.created_at).total_seconds() / 3600
        time_priority = min(1.0, age_hours / 24)  # Max boost after 24 hours
        
        # Resource efficiency (shorter tasks get slight boost)
        duration_priority = max(0.5, 1.0 - (task.estimated_duration / 3600))  # Normalize to 1 hour
        
        # Business value from task definition
        business_value_priority = task.business_value
        
        # Calculate final priority score
        priority_score = (
            business_weight * 0.4 +
            time_priority * 0.2 +
            duration_priority * 0.1 +
            business_value_priority * 0.3
        )
        
        return priority_score

    async def _find_optimal_node(self, task: WorkloadTask) -> Optional[str]:
        """Find the optimal node for a task"""
        suitable_nodes = []
        
        for node_id, capacity in self.node_capacities.items():
            if self._node_can_handle_task(capacity, task):
                score = self._calculate_node_score(capacity, task)
                suitable_nodes.append((score, node_id))
        
        if not suitable_nodes:
            return None
        
        # Return highest scoring node
        suitable_nodes.sort(key=lambda x: x[0], reverse=True)
        return suitable_nodes[0][1]

    def _node_can_handle_task(self, capacity: NodeCapacity, task: WorkloadTask) -> bool:
        """Check if node can handle the task requirements"""
        # Check GPU availability
        required_gpus = task.resource_requirements.get("gpus", 1)
        if required_gpus > capacity.available_gpus:
            return False
        
        # Check memory requirements
        required_memory = task.resource_requirements.get("memory_gb", 0)
        if required_memory > capacity.available_memory:
            return False
        
        # Check capability requirements
        required_capabilities = task.resource_requirements.get("capabilities", [])
        if not all(cap in capacity.capabilities for cap in required_capabilities):
            return False
        
        # Check current load
        if capacity.current_load > 0.9:  # 90% utilization threshold
            return False
        
        return True

    def _calculate_node_score(self, capacity: NodeCapacity, task: WorkloadTask) -> float:
        """Calculate node suitability score for a task"""
        # Base score from performance
        score = capacity.performance_score
        
        # Penalize high utilization
        utilization_penalty = capacity.current_load * 0.5
        
        # Bonus for business priority nodes
        business_bonus = capacity.business_priority_multiplier * 0.2
        
        # Capability matching bonus
        required_capabilities = task.resource_requirements.get("capabilities", [])
        capability_match = sum(1 for cap in required_capabilities if cap in capacity.capabilities)
        capability_bonus = (capability_match / len(required_capabilities)) * 0.1 if required_capabilities else 0.1
        
        # Memory efficiency bonus (nodes with more available memory get slight bonus)
        memory_bonus = min(0.1, capacity.available_memory / 100)  # Max 10% bonus
        
        final_score = score - utilization_penalty + business_bonus + capability_bonus + memory_bonus
        return max(0.0, final_score)

    async def _assign_task_to_node(self, task: WorkloadTask, node_id: str):
        """Assign task to a specific node"""
        task.assigned_node = node_id
        task.status = TaskStatus.ASSIGNED
        task.started_at = datetime.now()
        
        # Update node capacity
        if node_id in self.node_capacities:
            capacity = self.node_capacities[node_id]
            # Estimate load increase based on task duration
            estimated_load = min(0.1, task.estimated_duration / 3600)  # Max 10% per hour
            capacity.current_load = min(1.0, capacity.current_load + estimated_load)
            
            # Update available resources
            required_gpus = task.resource_requirements.get("gpus", 1)
            required_memory = task.resource_requirements.get("memory_gb", 0)
            capacity.available_gpus -= required_gpus
            capacity.available_memory -= required_memory
        
        logger.info(f"📋 Assigned task {task.task_id} ({task.task_type.value}) to node {node_id}")
        
        # Store assignment in Redis
        await self._store_task_assignment(task)

    async def _store_task_assignment(self, task: WorkloadTask):
        """Store task assignment in Redis"""
        task_data = {
            "task_id": task.task_id,
            "task_type": task.task_type.value,
            "priority": task.priority,
            "assigned_node": task.assigned_node,
            "status": task.status.value,
            "business_value": task.business_value,
            "assigned_at": datetime.now().isoformat(),
            "estimated_duration": task.estimated_duration
        }
        
        self.redis_client.hset("task_assignments", task.task_id, json.dumps(task_data))

    async def _capacity_monitor(self):
        """Monitor node capacity updates"""
        while self.running:
            try:
                # Get node capacity updates from Redis
                capacity_updates = self.redis_client.hgetall("node_capacities")
                
                for node_id, capacity_json in capacity_updates.items():
                    capacity_data = json.loads(capacity_json)
                    
                    capacity = NodeCapacity(
                        node_id=node_id,
                        current_load=capacity_data.get("current_load", 0.0),
                        available_memory=capacity_data.get("available_memory", 0.0),
                        available_gpus=capacity_data.get("available_gpus", 0),
                        capabilities=capacity_data.get("capabilities", []),
                        performance_score=capacity_data.get("performance_score", 1.0),
                        business_priority_multiplier=capacity_data.get("business_priority_multiplier", 1.0)
                    )
                    
                    self.node_capacities[node_id] = capacity
                
                await asyncio.sleep(10)  # Update every 10 seconds
                
            except Exception as e:
                logger.error(f"❌ Capacity monitor error: {e}")

    async def _metrics_collector(self):
        """Collect and store load balancing metrics"""
        while self.running:
            try:
                # Calculate current metrics
                completed_tasks = [task for task in self.task_queue if task.status == TaskStatus.COMPLETED]
                
                if completed_tasks:
                    total_completion_time = sum(
                        (task.completed_at - task.started_at).total_seconds()
                        for task in completed_tasks
                        if task.completed_at and task.started_at
                    )
                    self.metrics["average_completion_time"] = total_completion_time / len(completed_tasks)
                
                self.metrics.update({
                    "total_tasks_processed": len(completed_tasks),
                    "business_value_processed": sum(task.business_value for task in completed_tasks),
                    "active_tasks": len([task for task in self.task_queue if task.status in [TaskStatus.ASSIGNED, TaskStatus.RUNNING]]),
                    "pending_tasks": len([task for task in self.task_queue if task.status == TaskStatus.PENDING]),
                    "timestamp": datetime.now().isoformat()
                })
                
                # Store metrics in Redis
                self.redis_client.hset("load_balancer_metrics", "current", json.dumps(self.metrics))
                
                await asyncio.sleep(60)  # Update every minute
                
            except Exception as e:
                logger.error(f"❌ Metrics collection error: {e}")

    async def _cleanup_completed_tasks(self):
        """Clean up old completed tasks"""
        while self.running:
            try:
                # Remove tasks older than 24 hours
                cutoff_time = datetime.now() - timedelta(hours=24)
                old_tasks = [
                    task for task in self.task_queue
                    if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]
                    and task.completed_at and task.completed_at < cutoff_time
                ]
                
                for task in old_tasks:
                    self.task_queue.remove(task)
                    # Remove from Redis
                    self.redis_client.hdel("task_assignments", task.task_id)
                
                if old_tasks:
                    logger.info(f"🧹 Cleaned up {len(old_tasks)} old tasks")
                
                await asyncio.sleep(3600)  # Clean up every hour
                
            except Exception as e:
                logger.error(f"❌ Task cleanup error: {e}")

    async def submit_task(self, task_id: str, task_type: TaskType, priority: int,
                         estimated_duration: float, resource_requirements: Dict,
                         business_value: float = 0.5) -> bool:
        """Submit a new task to the load balancer"""
        task = WorkloadTask(
            task_id=task_id,
            task_type=task_type,
            priority=priority,
            estimated_duration=estimated_duration,
            resource_requirements=resource_requirements,
            business_value=business_value,
            created_at=datetime.now()
        )
        
        self.task_queue.append(task)
        logger.info(f"📥 Submitted task {task_id} ({task_type.value}) with priority {priority}")
        
        return True

    async def complete_task(self, task_id: str, success: bool = True):
        """Mark a task as completed"""
        for task in self.task_queue:
            if task.task_id == task_id:
                task.completed_at = datetime.now()
                task.status = TaskStatus.COMPLETED if success else TaskStatus.FAILED
                
                # Release node resources
                if task.assigned_node and task.assigned_node in self.node_capacities:
                    capacity = self.node_capacities[task.assigned_node]
                    
                    # Estimate load decrease
                    estimated_load = min(0.1, task.estimated_duration / 3600)
                    capacity.current_load = max(0.0, capacity.current_load - estimated_load)
                    
                    # Release resources
                    required_gpus = task.resource_requirements.get("gpus", 1)
                    required_memory = task.resource_requirements.get("memory_gb", 0)
                    capacity.available_gpus += required_gpus
                    capacity.available_memory += required_memory
                
                logger.info(f"✅ Task {task_id} completed with status: {task.status.value}")
                break

    def get_load_balancer_status(self) -> Dict:
        """Get current load balancer status"""
        return {
            "task_queue_size": len(self.task_queue),
            "pending_tasks": len([t for t in self.task_queue if t.status == TaskStatus.PENDING]),
            "active_tasks": len([t for t in self.task_queue if t.status in [TaskStatus.ASSIGNED, TaskStatus.RUNNING]]),
            "completed_tasks": len([t for t in self.task_queue if t.status == TaskStatus.COMPLETED]),
            "node_count": len(self.node_capacities),
            "metrics": self.metrics,
            "timestamp": datetime.now().isoformat()
        }

    async def stop(self):
        """Stop the load balancer"""
        logger.info("🛑 Stopping GPU Load Balancer...")
        self.running = False

# Main execution
async def main():
    load_balancer = GPULoadBalancer()
    
    try:
        await load_balancer.start()
        
        # Example: Submit some test tasks
        await load_balancer.submit_task(
            task_id="deal_analysis_001",
            task_type=TaskType.REVENUE_GENERATION,
            priority=1,
            estimated_duration=300.0,  # 5 minutes
            resource_requirements={
                "gpus": 1,
                "memory_gb": 8,
                "capabilities": ["llm_inference", "business_processing"]
            },
            business_value=0.95
        )
        
        await load_balancer.submit_task(
            task_id="background_analysis_002",
            task_type=TaskType.BACKGROUND_ANALYSIS,
            priority=8,
            estimated_duration=1800.0,  # 30 minutes
            resource_requirements={
                "gpus": 1,
                "memory_gb": 4,
                "capabilities": ["analysis"]
            },
            business_value=0.3
        )
        
        # Keep running and show status
        while True:
            status = load_balancer.get_load_balancer_status()
            logger.info(f"📊 Load Balancer Status: {status['pending_tasks']} pending, {status['active_tasks']} active")
            await asyncio.sleep(60)
            
    except KeyboardInterrupt:
        logger.info("🛑 Received shutdown signal")
    finally:
        await load_balancer.stop()

if __name__ == "__main__":
    asyncio.run(main())