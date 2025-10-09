#!/usr/bin/env python3
"""
Aurora GPU Mesh Coordinator
Central coordinator that manages GPU resources across the mesh network
"""

import asyncio
import json
import time
import os
from typing import Dict, List, Optional
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Aurora GPU Mesh Coordinator", version="1.0.0")

# Node configuration
NODE_NAME = os.getenv('NODE_NAME', 'coordinator')
NODE_ROLE = os.getenv('NODE_ROLE', 'lead')

class TaskSubmission(BaseModel):
    task_type: str
    requirements: Dict
    priority: int = 5

class GPUMeshCoordinator:
    def __init__(self):
        self.nodes = {}
        self.task_queue = []
        self.active_tasks = {}
        self.completed_tasks = []
        self.task_counter = 0
        
    async def register_node(self, node_id: str, node_info: Dict, websocket: WebSocket):
        """Register a new GPU node in the mesh"""
        self.nodes[node_id] = {
            "websocket": websocket,
            "gpu_count": node_info.get("gpu_count", 0),
            "gpu_memory": node_info.get("gpu_memory", 0),
            "gpu_type": node_info.get("gpu_type", "unknown"),
            "status": "active",
            "last_ping": time.time(),
            "active_tasks": 0,
            "completed_tasks": 0,
            "node_info": node_info
        }
        print(f"✅ [{datetime.now().isoformat()}] Node {node_id} registered: "
              f"{node_info.get('gpu_count', 0)} x {node_info.get('gpu_type', 'unknown')} "
              f"({node_info.get('gpu_memory', 0)}GB VRAM)")
        
        # Broadcast node registry update
        await self.broadcast_node_update()
        
    async def unregister_node(self, node_id: str):
        """Remove a node from the mesh"""
        if node_id in self.nodes:
            self.nodes[node_id]["status"] = "disconnected"
            print(f"❌ [{datetime.now().isoformat()}] Node {node_id} disconnected")
            
            # Reassign any active tasks from this node
            await self.reassign_tasks_from_node(node_id)
            await self.broadcast_node_update()
    
    async def reassign_tasks_from_node(self, node_id: str):
        """Reassign tasks from a failed node"""
        tasks_to_reassign = [
            task_id for task_id, task in self.active_tasks.items()
            if task.get("assigned_node") == node_id
        ]
        
        for task_id in tasks_to_reassign:
            task = self.active_tasks[task_id]
            print(f"⚠️  Reassigning task {task_id} from failed node {node_id}")
            
            # Mark task as pending reassignment
            task["status"] = "pending"
            task["assigned_node"] = None
            
            # Try to redistribute
            await self.distribute_task_internal(task)
    
    async def broadcast_node_update(self):
        """Broadcast node registry update to all connected nodes"""
        message = {
            "type": "node_update",
            "nodes": {
                node_id: {
                    "gpu_count": node["gpu_count"],
                    "gpu_memory": node["gpu_memory"],
                    "gpu_type": node["gpu_type"],
                    "status": node["status"],
                    "active_tasks": node["active_tasks"]
                }
                for node_id, node in self.nodes.items()
            }
        }
        
        for node_id, node in self.nodes.items():
            if node["status"] == "active":
                try:
                    await node["websocket"].send_text(json.dumps(message))
                except:
                    pass
    
    async def submit_task(self, task_type: str, requirements: Dict, priority: int = 5):
        """Submit a new task for distribution"""
        self.task_counter += 1
        task_id = f"task_{NODE_NAME}_{self.task_counter}_{int(time.time())}"
        
        task = {
            "task_id": task_id,
            "task_type": task_type,
            "requirements": requirements,
            "priority": priority,
            "status": "pending",
            "assigned_node": None,
            "submitted_at": time.time(),
            "started_at": None,
            "completed_at": None
        }
        
        self.active_tasks[task_id] = task
        result = await self.distribute_task_internal(task)
        
        return {"task_id": task_id, **result}
    
    async def distribute_task_internal(self, task: Dict):
        """Distribute a task to the best available node"""
        best_node = self.find_best_node(task["requirements"], task["priority"])
        
        if best_node:
            task["assigned_node"] = best_node
            task["status"] = "assigned"
            task["started_at"] = time.time()
            
            # Update node stats
            self.nodes[best_node]["active_tasks"] += 1
            
            # Send task to node
            await self.send_task_to_node(best_node, task)
            
            print(f"📤 [{datetime.now().isoformat()}] Task {task['task_id']} assigned to {best_node}")
            
            return {"status": "assigned", "node": best_node}
        else:
            # Queue for later
            self.task_queue.append(task)
            task["status"] = "queued"
            
            print(f"⏸️  [{datetime.now().isoformat()}] Task {task['task_id']} queued (no available nodes)")
            
            return {"status": "queued", "message": "No available nodes, task queued"}
    
    def find_best_node(self, requirements: Dict, priority: int) -> Optional[str]:
        """Find the best node for a task based on requirements and current load"""
        required_memory = requirements.get("memory_gb", 0)
        required_gpus = requirements.get("gpu_count", 1)
        preferred_gpu_type = requirements.get("gpu_type", None)
        
        best_node = None
        best_score = -1
        
        for node_id, node in self.nodes.items():
            if node["status"] != "active":
                continue
                
            # Check if node meets requirements
            if (node["gpu_memory"] < required_memory or 
                node["gpu_count"] < required_gpus):
                continue
            
            # Check GPU type preference
            if preferred_gpu_type and node["gpu_type"] != preferred_gpu_type:
                continue
            
            # Calculate score based on:
            # 1. Available resources (higher is better)
            # 2. Current load (lower is better)
            # 3. GPU type match (bonus)
            
            resource_score = (node["gpu_memory"] - required_memory) * 10
            resource_score += (node["gpu_count"] - required_gpus) * 50
            
            load_penalty = node["active_tasks"] * 20
            
            score = resource_score - load_penalty
            
            # Bonus for GPU type match
            if preferred_gpu_type and node["gpu_type"] == preferred_gpu_type:
                score += 100
            
            # Bonus for high priority tasks (prefer more powerful nodes)
            if priority >= 8 and "4090" in node["gpu_type"]:
                score += 200
            
            if score > best_score:
                best_score = score
                best_node = node_id
        
        return best_node
    
    async def send_task_to_node(self, node_id: str, task: Dict):
        """Send task assignment to a specific node"""
        if node_id in self.nodes:
            websocket = self.nodes[node_id]["websocket"]
            try:
                await websocket.send_text(json.dumps({
                    "type": "task_assignment",
                    "task": task
                }))
            except Exception as e:
                print(f"❌ Failed to send task to {node_id}: {e}")
                await self.unregister_node(node_id)
    
    async def handle_task_completion(self, node_id: str, task_id: str, result: Dict):
        """Handle task completion from a node"""
        if task_id in self.active_tasks:
            task = self.active_tasks[task_id]
            task["status"] = "completed"
            task["completed_at"] = time.time()
            task["result"] = result
            
            # Update node stats
            if node_id in self.nodes:
                self.nodes[node_id]["active_tasks"] -= 1
                self.nodes[node_id]["completed_tasks"] += 1
            
            # Move to completed tasks
            self.completed_tasks.append(task)
            del self.active_tasks[task_id]
            
            duration = task["completed_at"] - task["started_at"]
            print(f"✅ [{datetime.now().isoformat()}] Task {task_id} completed by {node_id} in {duration:.2f}s")
            
            # Process any queued tasks
            await self.process_task_queue()
    
    async def handle_task_failure(self, node_id: str, task_id: str, error: str):
        """Handle task failure from a node"""
        if task_id in self.active_tasks:
            task = self.active_tasks[task_id]
            task["status"] = "failed"
            task["error"] = error
            
            # Update node stats
            if node_id in self.nodes:
                self.nodes[node_id]["active_tasks"] -= 1
            
            print(f"❌ [{datetime.now().isoformat()}] Task {task_id} failed on {node_id}: {error}")
            
            # Retry task on different node
            task["assigned_node"] = None
            task["status"] = "pending"
            await self.distribute_task_internal(task)
    
    async def process_task_queue(self):
        """Process any queued tasks"""
        if not self.task_queue:
            return
        
        tasks_to_process = list(self.task_queue)
        self.task_queue.clear()
        
        for task in tasks_to_process:
            await self.distribute_task_internal(task)
    
    def get_mesh_status(self) -> Dict:
        """Get current mesh status"""
        return {
            "coordinator": NODE_NAME,
            "total_nodes": len([n for n in self.nodes.values() if n["status"] == "active"]),
            "total_gpus": sum(n["gpu_count"] for n in self.nodes.values() if n["status"] == "active"),
            "total_vram": sum(n["gpu_memory"] for n in self.nodes.values() if n["status"] == "active"),
            "active_tasks": len(self.active_tasks),
            "queued_tasks": len(self.task_queue),
            "completed_tasks": len(self.completed_tasks),
            "nodes": {
                node_id: {
                    "gpu_count": node["gpu_count"],
                    "gpu_type": node["gpu_type"],
                    "gpu_memory": node["gpu_memory"],
                    "status": node["status"],
                    "active_tasks": node["active_tasks"],
                    "completed_tasks": node["completed_tasks"]
                }
                for node_id, node in self.nodes.items()
            }
        }

# Global coordinator instance
coordinator = GPUMeshCoordinator()

# API Endpoints
@app.get("/")
async def root():
    return {
        "service": "Aurora GPU Mesh Coordinator",
        "version": "1.0.0",
        "coordinator": NODE_NAME,
        "role": NODE_ROLE,
        "status": "active"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/mesh/status")
async def mesh_status():
    """Get mesh network status"""
    return coordinator.get_mesh_status()

@app.get("/mesh/nodes")
async def mesh_nodes():
    """Get list of registered nodes"""
    return {
        "nodes": {
            node_id: {
                "gpu_count": node["gpu_count"],
                "gpu_type": node["gpu_type"],
                "gpu_memory": node["gpu_memory"],
                "status": node["status"],
                "active_tasks": node["active_tasks"],
                "completed_tasks": node["completed_tasks"],
                "last_ping": node["last_ping"]
            }
            for node_id, node in coordinator.nodes.items()
        }
    }

@app.get("/tasks/active")
async def active_tasks():
    """Get active tasks"""
    return {"tasks": coordinator.active_tasks}

@app.get("/tasks/completed")
async def completed_tasks():
    """Get completed tasks"""
    return {"tasks": coordinator.completed_tasks[-100:]}  # Last 100

@app.post("/tasks/submit")
async def submit_task(submission: TaskSubmission):
    """Submit a new task"""
    result = await coordinator.submit_task(
        submission.task_type,
        submission.requirements,
        submission.priority
    )
    return result

@app.websocket("/ws/{node_id}")
async def websocket_endpoint(websocket: WebSocket, node_id: str):
    """WebSocket endpoint for GPU nodes"""
    await websocket.accept()
    print(f"🔌 [{datetime.now().isoformat()}] Node {node_id} connecting...")
    
    try:
        # Wait for node registration message
        data = await websocket.receive_text()
        message = json.loads(data)
        
        if message["type"] == "register":
            await coordinator.register_node(node_id, message["node_info"], websocket)
            
            # Send acknowledgment
            await websocket.send_text(json.dumps({
                "type": "registered",
                "coordinator": NODE_NAME,
                "message": "Successfully registered with GPU mesh"
            }))
            
            # Main message loop
            while True:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                if message["type"] == "ping":
                    coordinator.nodes[node_id]["last_ping"] = time.time()
                    await websocket.send_text(json.dumps({"type": "pong"}))
                
                elif message["type"] == "task_complete":
                    await coordinator.handle_task_completion(
                        node_id,
                        message["task_id"],
                        message.get("result", {})
                    )
                
                elif message["type"] == "task_failed":
                    await coordinator.handle_task_failure(
                        node_id,
                        message["task_id"],
                        message.get("error", "Unknown error")
                    )
                
                elif message["type"] == "status_update":
                    # Update node status
                    if node_id in coordinator.nodes:
                        coordinator.nodes[node_id]["node_info"] = message.get("node_info", {})
                
    except WebSocketDisconnect:
        await coordinator.unregister_node(node_id)
    except Exception as e:
        print(f"❌ Error in websocket for {node_id}: {e}")
        await coordinator.unregister_node(node_id)

if __name__ == "__main__":
    import uvicorn
    print(f"🚀 Starting Aurora GPU Mesh Coordinator on {NODE_NAME}")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
