import asyncio
import json
import time
from typing import Dict, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pynvml import nvmlInit, nvmlDeviceGetCount, nvmlDeviceGetHandleByIndex, nvmlDeviceGetMemoryInfo
import torch
import ray

app = FastAPI(title="Aurora GPU Mesh Coordinator")

class GPUMeshCoordinator:
    def __init__(self):
        self.nodes = {}
        self.gpu_resources = {}
        self.task_queue = []
        self.active_tasks = {}
        
    async def register_node(self, node_id: str, gpu_count: int, gpu_memory: int, websocket: WebSocket):
        """Register a new node in the GPU mesh"""
        self.nodes[node_id] = {
            "websocket": websocket,
            "gpu_count": gpu_count,
            "gpu_memory": gpu_memory,
            "status": "active",
            "last_ping": time.time()
        }
        print(f"✅ Node {node_id} registered with {gpu_count} GPUs ({gpu_memory}GB VRAM)")
        
    async def distribute_task(self, task_id: str, task_type: str, requirements: Dict):
        """Distribute a task across available GPUs"""
        available_gpus = self.get_available_gpus()
        
        if not available_gpus:
            return {"error": "No available GPUs"}
            
        # Find best node for task
        best_node = self.find_best_node(requirements)
        
        if best_node:
            task = {
                "task_id": task_id,
                "task_type": task_type,
                "requirements": requirements,
                "assigned_node": best_node,
                "status": "assigned"
            }
            
            self.active_tasks[task_id] = task
            
            # Send task to node
            await self.send_task_to_node(best_node, task)
            
            return {"status": "assigned", "node": best_node}
        else:
            return {"error": "No suitable node available"}
    
    def get_available_gpus(self) -> List[Dict]:
        """Get list of available GPUs across all nodes"""
        available = []
        for node_id, node_info in self.nodes.items():
            if node_info["status"] == "active":
                available.append({
                    "node_id": node_id,
                    "gpu_count": node_info["gpu_count"],
                    "gpu_memory": node_info["gpu_memory"]
                })
        return available
    
    def find_best_node(self, requirements: Dict) -> Optional[str]:
        """Find the best node for a task based on requirements"""
        required_memory = requirements.get("memory_gb", 0)
        required_gpus = requirements.get("gpu_count", 1)
        
        best_node = None
        best_score = 0
        
        for node_id, node_info in self.nodes.items():
            if node_info["status"] == "active":
                if (node_info["gpu_memory"] >= required_memory and 
                    node_info["gpu_count"] >= required_gpus):
                    
                    # Score based on available resources
                    score = (node_info["gpu_memory"] - required_memory) + 
                           (node_info["gpu_count"] - required_gpus) * 10
                    
                    if score > best_score:
                        best_score = score
                        best_node = node_id
        
        return best_node
    
    async def send_task_to_node(self, node_id: str, task: Dict):
        """Send task to specific node"""
        if node_id in self.nodes:
            websocket = self.nodes[node_id]["websocket"]
            await websocket.send_text(json.dumps({
                "type": "task_assignment",
                "task": task
            }))

coordinator = GPUMeshCoordinator()

@app.get("/")
async def root():
    return {
        "service": "Aurora GPU Mesh Coordinator",
        "status": "active",
        "total_nodes": len(coordinator.nodes),
        "total_gpus": sum(node["gpu_count"] for node in coordinator.nodes.values()),
        "total_vram": sum(node["gpu_memory"] for node in coordinator.nodes.values())
    }

@app.get("/gpu_status")
async def gpu_status():
    return {
        "nodes": coordinator.nodes,
        "available_gpus": coordinator.get_available_gpus(),
        "active_tasks": len(coordinator.active_tasks)
    }

@app.post("/submit_task")
async def submit_task(task_type: str, requirements: Dict):
    task_id = f"task_{int(time.time())}"
    result = await coordinator.distribute_task(task_id, task_type, requirements)
    return result

@app.websocket("/ws/{node_id}")
async def websocket_endpoint(websocket: WebSocket, node_id: str):
    await websocket.accept()
    
    # Get GPU info for this node
    nvmlInit()
    gpu_count = nvmlDeviceGetCount()
    total_memory = 0
    
    for i in range(gpu_count):
        handle = nvmlDeviceGetHandleByIndex(i)
        mem_info = nvmlDeviceGetMemoryInfo(handle)
        total_memory += mem_info.total // (1024**3)  # Convert to GB
    
    await coordinator.register_node(node_id, gpu_count, total_memory, websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "task_complete":
                task_id = message["task_id"]
                if task_id in coordinator.active_tasks:
                    coordinator.active_tasks[task_id]["status"] = "completed"
                    print(f"✅ Task {task_id} completed on {node_id}")
                    
    except WebSocketDisconnect:
        coordinator.nodes[node_id]["status"] = "disconnected"
        print(f"❌ Node {node_id} disconnected")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
