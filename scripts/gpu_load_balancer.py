#!/usr/bin/env python3
"""
Aurora AI Empire - Intelligent GPU Load Balancer
Distributes AI workloads across the GPU mesh with intelligent routing
"""

import asyncio
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Optional
import hashlib
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GPULoadBalancer:
    def __init__(self):
        self.task_queue = []
        self.active_tasks = {}
        self.gpu_workloads = {}
        self.load_balancing_strategies = {
            "round_robin": self.round_robin_distribution,
            "least_loaded": self.least_loaded_distribution,
            "memory_optimized": self.memory_optimized_distribution,
            "performance_optimized": self.performance_optimized_distribution,
            "fault_tolerant": self.fault_tolerant_distribution
        }
        self.current_strategy = "fault_tolerant"
        
    def calculate_gpu_load(self, gpu_info: Dict) -> float:
        """Calculate GPU load score (0-1, higher = more loaded)"""
        memory_load = gpu_info.get("memory_usage_percent", 0) / 100
        utilization_load = gpu_info.get("utilization", 0) / 100
        temperature_load = min(gpu_info.get("temperature", 0) / 100, 1.0)
        
        # Weighted load calculation
        load_score = (
            memory_load * 0.4 +      # Memory usage (40%)
            utilization_load * 0.4 +  # GPU utilization (40%)
            temperature_load * 0.2    # Temperature (20%)
        )
        
        return min(load_score, 1.0)
    
    def round_robin_distribution(self, available_gpus: List[Dict]) -> Optional[Dict]:
        """Round-robin distribution strategy"""
        if not available_gpus:
            return None
        
        # Sort by node priority and GPU ID for consistent round-robin
        sorted_gpus = sorted(available_gpus, key=lambda x: (x["priority"], x["gpu_id"]))
        
        # Find the least recently used GPU
        current_time = time.time()
        least_recently_used = min(sorted_gpus, 
                                key=lambda x: self.gpu_workloads.get(f"{x['node']}_{x['gpu_id']}", {}).get("last_used", 0))
        
        return least_recently_used
    
    def least_loaded_distribution(self, available_gpus: List[Dict]) -> Optional[Dict]:
        """Least loaded GPU distribution strategy"""
        if not available_gpus:
            return None
        
        # Calculate load for each GPU
        gpu_loads = []
        for gpu in available_gpus:
            load_score = self.calculate_gpu_load(gpu)
            gpu_loads.append((gpu, load_score))
        
        # Return GPU with lowest load
        return min(gpu_loads, key=lambda x: x[1])[0]
    
    def memory_optimized_distribution(self, available_gpus: List[Dict], task_requirements: Dict) -> Optional[Dict]:
        """Memory-optimized distribution strategy"""
        if not available_gpus:
            return None
        
        required_memory = task_requirements.get("memory_required", 0)
        
        # Filter GPUs with sufficient memory
        suitable_gpus = [gpu for gpu in available_gpus if gpu["available"] >= required_memory]
        
        if not suitable_gpus:
            return None
        
        # Sort by available memory (descending) and priority
        suitable_gpus.sort(key=lambda x: (-x["available"], x["priority"]))
        
        return suitable_gpus[0]
    
    def performance_optimized_distribution(self, available_gpus: List[Dict]) -> Optional[Dict]:
        """Performance-optimized distribution strategy"""
        if not available_gpus:
            return None
        
        # Sort by priority (lower = higher priority) and utilization (lower = better)
        sorted_gpus = sorted(available_gpus, key=lambda x: (x["priority"], x.get("utilization", 0)))
        
        return sorted_gpus[0]
    
    def fault_tolerant_distribution(self, available_gpus: List[Dict], task_requirements: Dict) -> Optional[Dict]:
        """Fault-tolerant distribution strategy (combines multiple strategies)"""
        if not available_gpus:
            return None
        
        # Filter out failed or degraded GPUs
        healthy_gpus = [gpu for gpu in available_gpus if gpu.get("status", "healthy") == "healthy"]
        
        if not healthy_gpus:
            # Fallback to any available GPU if no healthy ones
            healthy_gpus = available_gpus
        
        # Apply memory optimization first
        memory_optimized = self.memory_optimized_distribution(healthy_gpus, task_requirements)
        if memory_optimized:
            return memory_optimized
        
        # Fallback to least loaded
        return self.least_loaded_distribution(healthy_gpus)
    
    def select_gpu(self, task_requirements: Dict, available_gpus: List[Dict]) -> Optional[Dict]:
        """Select the best GPU for a task using the current strategy"""
        strategy_func = self.load_balancing_strategies.get(self.current_strategy)
        if not strategy_func:
            logger.error(f"Unknown load balancing strategy: {self.current_strategy}")
            return None
        
        return strategy_func(available_gpus, task_requirements)
    
    def create_task_id(self, task: Dict) -> str:
        """Create a unique task ID"""
        task_data = json.dumps(task, sort_keys=True)
        return hashlib.md5(task_data.encode()).hexdigest()[:12]
    
    async def distribute_task(self, task: Dict, available_gpus: List[Dict]) -> Dict:
        """Distribute a task to the best available GPU"""
        task_id = self.create_task_id(task)
        task["id"] = task_id
        
        # Select best GPU
        selected_gpu = self.select_gpu(task, available_gpus)
        
        if not selected_gpu:
            return {
                "status": "failed",
                "error": "No suitable GPU available",
                "task_id": task_id
            }
        
        # Update GPU workload tracking
        gpu_key = f"{selected_gpu['node']}_{selected_gpu['gpu_id']}"
        if gpu_key not in self.gpu_workloads:
            self.gpu_workloads[gpu_key] = {"tasks": [], "last_used": 0}
        
        self.gpu_workloads[gpu_key]["tasks"].append(task_id)
        self.gpu_workloads[gpu_key]["last_used"] = time.time()
        
        # Track active task
        self.active_tasks[task_id] = {
            "task": task,
            "assigned_gpu": selected_gpu,
            "start_time": datetime.now().isoformat(),
            "status": "running"
        }
        
        logger.info(f"✅ Task {task_id} distributed to {selected_gpu['node']} GPU {selected_gpu['gpu_id']}")
        logger.info(f"   Strategy: {self.current_strategy}")
        logger.info(f"   GPU Load: {self.calculate_gpu_load(selected_gpu):.2f}")
        
        return {
            "status": "distributed",
            "task_id": task_id,
            "assigned_gpu": selected_gpu,
            "strategy_used": self.current_strategy,
            "estimated_completion": datetime.now().isoformat()
        }
    
    def get_load_balancing_stats(self) -> Dict:
        """Get load balancing statistics"""
        total_tasks = len(self.active_tasks)
        gpu_stats = {}
        
        for gpu_key, workload in self.gpu_workloads.items():
            gpu_stats[gpu_key] = {
                "active_tasks": len(workload["tasks"]),
                "last_used": workload["last_used"],
                "load_score": self.calculate_gpu_load(workload) if workload else 0
            }
        
        return {
            "total_active_tasks": total_tasks,
            "current_strategy": self.current_strategy,
            "available_strategies": list(self.load_balancing_strategies.keys()),
            "gpu_workloads": gpu_stats,
            "load_balancing_efficiency": self.calculate_efficiency()
        }
    
    def calculate_efficiency(self) -> float:
        """Calculate load balancing efficiency (0-1)"""
        if not self.gpu_workloads:
            return 1.0
        
        # Calculate load variance (lower variance = better balance)
        loads = [workload.get("load_score", 0) for workload in self.gpu_workloads.values()]
        if not loads:
            return 1.0
        
        mean_load = sum(loads) / len(loads)
        variance = sum((load - mean_load) ** 2 for load in loads) / len(loads)
        
        # Convert variance to efficiency (0-1, higher is better)
        efficiency = max(0, 1 - (variance / 0.25))  # Normalize by 0.25 (max reasonable variance)
        
        return efficiency
    
    def set_strategy(self, strategy: str):
        """Set the load balancing strategy"""
        if strategy in self.load_balancing_strategies:
            self.current_strategy = strategy
            logger.info(f"🔄 Load balancing strategy changed to: {strategy}")
        else:
            logger.error(f"Unknown strategy: {strategy}")
    
    async def start_load_balancer(self):
        """Start the load balancer service"""
        logger.info("⚖️ Starting GPU Load Balancer...")
        logger.info(f"🎯 Strategy: {self.current_strategy}")
        logger.info("🧠 Intelligent workload distribution enabled...")
        
        # Start web server for load balancer API
        from fastapi import FastAPI
        import uvicorn
        
        app = FastAPI(title="Aurora GPU Load Balancer")
        
        @app.get("/loadbalancer/stats")
        async def get_stats():
            return self.get_load_balancing_stats()
        
        @app.post("/loadbalancer/distribute")
        async def distribute_task_endpoint(task: dict, available_gpus: list):
            return await self.distribute_task(task, available_gpus)
        
        @app.post("/loadbalancer/strategy")
        async def set_strategy_endpoint(strategy: dict):
            self.set_strategy(strategy["strategy"])
            return {"status": "success", "strategy": self.current_strategy}
        
        @app.get("/loadbalancer/health")
        async def health_check():
            return {
                "status": "healthy",
                "strategy": self.current_strategy,
                "efficiency": self.calculate_efficiency()
            }
        
        # Start the load balancer
        logger.info("✅ GPU Load Balancer started!")
        logger.info("🌐 Load Balancer API available at http://localhost:8002")
        
        # Run the web server
        config = uvicorn.Config(app, host="0.0.0.0", port=8002, log_level="info")
        server = uvicorn.Server(config)
        await server.serve()

if __name__ == "__main__":
    load_balancer = GPULoadBalancer()
    asyncio.run(load_balancer.start_load_balancer())
