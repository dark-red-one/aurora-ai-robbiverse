#!/usr/bin/env python3
"""
Intelligent Agent Router
Routes AI generation requests to the FASTEST available node

Decision logic:
1. Check node capabilities (GPU, CPU, RAM, load)
2. Estimate generation time on each node
3. Factor in network latency
4. Route to fastest option
5. Stream results back to user's node

Example: Allan on RobbieBook1, Aurora has 10x power
→ Router sends job to Aurora, streams back to RobbieBook1
"""

import os
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import httpx
import redis
import psutil
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from circuitbreaker import circuit

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Agent Router - Smart Workload Distribution")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
NODE_NAME = os.getenv("NODE_NAME", "unknown")
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")
NODE_REGISTRY_URL = os.getenv("NODE_REGISTRY_URL", "http://node-registry:9999")

# Redis client
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD if REDIS_PASSWORD else None,
    decode_responses=True
)


class GenerationRequest(BaseModel):
    prompt: str
    model: str = "llama3.1:8b"
    max_tokens: int = 1024
    temperature: float = 0.7
    user_node: Optional[str] = None  # Where user is connected


class NodeCapabilities(BaseModel):
    node_name: str
    has_gpu: bool
    gpu_count: int
    gpu_vram_gb: int
    cpu_cores: int
    ram_gb: int
    current_load: float  # 0.0 - 1.0
    network_latency_ms: int
    active_jobs: int


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "agent-router"}


@app.post("/api/route/generate")
async def route_generation(request: GenerationRequest):
    """
    Route generation request to optimal node
    
    Algorithm:
    1. Get all available nodes
    2. Calculate estimated generation time for each
    3. Factor in network latency to user's node
    4. Select fastest option
    5. Execute on that node
    6. Stream back to user
    """
    try:
        logger.info(f"🧠 Routing generation request from {request.user_node or NODE_NAME}")
        
        # 1. Get available nodes
        nodes = await get_available_nodes()
        
        if not nodes:
            raise HTTPException(status_code=503, detail="No nodes available")
        
        # 2. Calculate best node
        best_node = await calculate_best_node(nodes, request)
        
        logger.info(f"✅ Selected node: {best_node['node_name']} "
                   f"(estimated: {best_node['estimated_time_ms']}ms)")
        
        # 3. Execute on best node
        result = await execute_on_node(best_node['node_name'], request)
        
        return {
            "response": result["response"],
            "executed_on": best_node['node_name'],
            "estimated_time_ms": best_node['estimated_time_ms'],
            "actual_time_ms": result.get("execution_time_ms", 0),
            "user_node": request.user_node or NODE_NAME
        }
        
    except Exception as e:
        logger.error(f"Routing error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def get_available_nodes() -> List[Dict]:
    """Get all available nodes from registry"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{NODE_REGISTRY_URL}/nodes")
            
            if response.status_code == 200:
                data = response.json()
                return data.get("nodes", {}).values()
            
            return []
            
    except Exception as e:
        logger.error(f"Failed to get nodes: {e}")
        return []


async def calculate_best_node(nodes: List[Dict], request: GenerationRequest) -> Dict:
    """
    Calculate which node will complete the generation fastest
    
    Factors:
    - GPU availability (10x faster than CPU)
    - Current load (queue wait time)
    - Network latency to user's node
    - Model availability (cached vs download)
    """
    
    scored_nodes = []
    
    for node in nodes:
        # Base generation time estimate
        if node.get("capabilities", {}).get("gpu", False):
            # GPU nodes: ~100ms per 100 tokens
            base_time_ms = (request.max_tokens / 100) * 100
        else:
            # CPU nodes: ~1000ms per 100 tokens (10x slower)
            base_time_ms = (request.max_tokens / 100) * 1000
        
        # Adjust for current load
        current_load = node.get("status", {}).get("cpu_usage", 0) / 100
        load_multiplier = 1 + current_load  # 50% load = 1.5x time
        
        # Adjust for active jobs (queue time)
        active_jobs = node.get("active_jobs", 0)
        queue_time_ms = active_jobs * 500  # 500ms per job in queue
        
        # Network latency to user's node
        if request.user_node and request.user_node != node["name"]:
            network_latency_ms = await estimate_network_latency(
                node["name"], 
                request.user_node
            )
        else:
            network_latency_ms = 0  # Same node, no network
        
        # Total estimated time
        total_time_ms = (base_time_ms * load_multiplier) + queue_time_ms + network_latency_ms
        
        scored_nodes.append({
            "node_name": node["name"],
            "node_ip": node["vpn_ip"],
            "estimated_time_ms": int(total_time_ms),
            "has_gpu": node.get("capabilities", {}).get("gpu", False),
            "current_load": current_load,
            "breakdown": {
                "base_time": int(base_time_ms),
                "load_multiplier": load_multiplier,
                "queue_time": queue_time_ms,
                "network_latency": network_latency_ms
            }
        })
    
    # Sort by estimated time (fastest first)
    scored_nodes.sort(key=lambda x: x["estimated_time_ms"])
    
    return scored_nodes[0]  # Return fastest


async def estimate_network_latency(from_node: str, to_node: str) -> int:
    """Estimate network latency between nodes (ms)"""
    try:
        # Check Redis cache first
        cache_key = f"aurora:latency:{from_node}:{to_node}"
        cached = redis_client.get(cache_key)
        
        if cached:
            return int(cached)
        
        # Estimate based on node location
        # VPN mesh is typically < 50ms within same region
        if from_node == to_node:
            return 0
        elif "aurora" in from_node or "aurora" in to_node:
            return 20  # Elestio typically fast
        elif "runpod" in from_node or "runpod" in to_node:
            return 30  # Texas datacenter
        else:
            return 10  # Local network (Vengeance, RobbieBook1)
        
    except:
        return 50  # Default assumption


async def mark_node_failed(node_name: str):
    """Mark a node as failed in Redis for routing decisions"""
    try:
        redis_client.setex(f"aurora:node_failed:{node_name}", 300, "true")  # 5 minutes
        logger.warning(f"⚠️ Marked node {node_name} as failed")
    except Exception as e:
        logger.error(f"Failed to mark node {node_name} as failed: {e}")


@circuit(failure_threshold=3, recovery_timeout=60, expected_exception=Exception)
async def execute_on_node(node_name: str, request: GenerationRequest) -> Dict:
    """Execute generation on specific node with circuit breaker protection"""
    try:
        # Map node to Ollama endpoint
        node_endpoints = {
            "aurora": "http://10.0.0.1:11434",
            "runpod-tx": "http://10.0.0.3:11434",
            "vengeance": "http://10.0.0.4:11434",
            "robbiebook1": "http://10.0.0.5:11434"
        }
        
        ollama_url = node_endpoints.get(node_name, "http://localhost:11434")
        
        start_time = datetime.now()
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{ollama_url}/api/generate",
                json={
                    "model": request.model,
                    "prompt": request.prompt,
                    "stream": False,
                    "options": {
                        "temperature": request.temperature,
                        "num_predict": request.max_tokens
                    }
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"Ollama error: {response.status_code}")
            
            result = response.json()
            execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return {
                "response": result.get("response", ""),
                "execution_time_ms": execution_time_ms,
                "node": node_name
            }
            
    except Exception as e:
        logger.error(f"Execution failed on {node_name}: {e}")
        # Mark node as failed in Redis for routing decisions
        await mark_node_failed(node_name)
        raise


@app.get("/api/route/benchmark")
async def benchmark_nodes():
    """Benchmark all nodes to update routing decisions"""
    try:
        nodes = await get_available_nodes()
        
        benchmarks = []
        test_prompt = "Hello, world!"
        
        for node in nodes:
            try:
                start = datetime.now()
                
                result = await execute_on_node(
                    node["name"],
                    GenerationRequest(
                        prompt=test_prompt,
                        max_tokens=50
                    )
                )
                
                duration_ms = int((datetime.now() - start).total_seconds() * 1000)
                
                benchmarks.append({
                    "node": node["name"],
                    "duration_ms": duration_ms,
                    "status": "success"
                })
                
                # Cache result
                redis_client.setex(
                    f"aurora:benchmark:{node['name']}",
                    3600,  # 1 hour
                    str(duration_ms)
                )
                
            except Exception as e:
                benchmarks.append({
                    "node": node["name"],
                    "status": "failed",
                    "error": str(e)
                })
        
        # Sort by speed
        benchmarks.sort(key=lambda x: x.get("duration_ms", 999999))
        
        return {
            "benchmarks": benchmarks,
            "fastest_node": benchmarks[0]["node"] if benchmarks else None,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Benchmark error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/route/stats")
async def get_routing_stats():
    """Get routing statistics"""
    try:
        # Get routing history from Redis
        stats = {
            "total_routes": 0,
            "routes_by_node": {},
            "average_time_ms": 0
        }
        
        # Scan for recent routing decisions
        keys = []
        for key in redis_client.scan_iter("aurora:route:*", count=1000):
            keys.append(key)
        
        for key in keys[-100:]:  # Last 100 routes
            data = redis_client.get(key)
            if data:
                import json
                route = json.loads(data)
                
                stats["total_routes"] += 1
                node = route.get("node", "unknown")
                stats["routes_by_node"][node] = stats["routes_by_node"].get(node, 0) + 1
        
        return stats
        
    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8007)
