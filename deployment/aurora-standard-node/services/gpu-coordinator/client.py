#!/usr/bin/env python3
"""
Aurora GPU Mesh Client
Runs on GPU compute nodes to connect to the mesh coordinator
"""

import asyncio
import json
import os
import time
from typing import Dict, Optional
import websockets

# Node configuration
NODE_NAME = os.getenv('NODE_NAME', 'compute-node')
MESH_COORDINATOR_URL = os.getenv('MESH_COORDINATOR_URL', 'ws://10.0.0.1:8001')

class GPUMeshClient:
    def __init__(self, node_name: str, coordinator_url: str):
        self.node_name = node_name
        self.coordinator_url = coordinator_url
        self.websocket = None
        self.running = False
        self.gpu_info = None
        
    async def detect_gpus(self) -> Dict:
        """Detect GPU configuration"""
        try:
            import torch
            from pynvml import nvmlInit, nvmlDeviceGetCount, nvmlDeviceGetHandleByIndex, nvmlDeviceGetMemoryInfo, nvmlDeviceGetName
            
            nvmlInit()
            gpu_count = nvmlDeviceGetCount()
            
            if gpu_count == 0:
                return {
                    "gpu_count": 0,
                    "gpu_memory": 0,
                    "gpu_type": "none",
                    "cuda_available": False
                }
            
            # Get info from first GPU (assume all are same type)
            handle = nvmlDeviceGetHandleByIndex(0)
            gpu_name = nvmlDeviceGetName(handle)
            if isinstance(gpu_name, bytes):
                gpu_name = gpu_name.decode('utf-8')
            
            # Total memory across all GPUs
            total_memory = 0
            for i in range(gpu_count):
                handle = nvmlDeviceGetHandleByIndex(i)
                mem_info = nvmlDeviceGetMemoryInfo(handle)
                total_memory += mem_info.total // (1024**3)  # GB
            
            return {
                "gpu_count": gpu_count,
                "gpu_memory": total_memory,
                "gpu_type": gpu_name,
                "cuda_available": torch.cuda.is_available(),
                "cuda_version": torch.version.cuda if torch.cuda.is_available() else None
            }
            
        except Exception as e:
            print(f"⚠️  Failed to detect GPUs: {e}")
            return {
                "gpu_count": 0,
                "gpu_memory": 0,
                "gpu_type": "none",
                "cuda_available": False,
                "error": str(e)
            }
    
    async def connect(self):
        """Connect to GPU mesh coordinator"""
        max_retries = 10
        retry_delay = 5
        
        for attempt in range(max_retries):
            try:
                # Detect GPUs
                if not self.gpu_info:
                    self.gpu_info = await self.detect_gpus()
                    print(f"📊 GPU Info: {self.gpu_info}")
                
                # Connect to coordinator
                ws_url = f"{self.coordinator_url}/ws/{self.node_name}"
                print(f"🔌 Connecting to coordinator: {ws_url}")
                
                self.websocket = await websockets.connect(ws_url)
                
                # Register with coordinator
                await self.websocket.send(json.dumps({
                    "type": "register",
                    "node_info": self.gpu_info
                }))
                
                # Wait for confirmation
                response = await self.websocket.recv()
                message = json.loads(response)
                
                if message["type"] == "registered":
                    print(f"✅ Registered with coordinator: {message.get('coordinator')}")
                    self.running = True
                    return True
                
            except Exception as e:
                print(f"❌ Connection attempt {attempt + 1}/{max_retries} failed: {e}")
                if attempt < max_retries - 1:
                    print(f"⏳ Retrying in {retry_delay}s...")
                    await asyncio.sleep(retry_delay)
        
        return False
    
    async def handle_messages(self):
        """Handle incoming messages from coordinator"""
        try:
            while self.running:
                message_str = await self.websocket.recv()
                message = json.loads(message_str)
                
                message_type = message.get("type")
                
                if message_type == "task_assignment":
                    await self.handle_task(message["task"])
                
                elif message_type == "node_update":
                    print(f"📊 Mesh update: {len(message['nodes'])} nodes active")
                
                elif message_type == "pong":
                    pass  # Heartbeat response
                
        except websockets.exceptions.ConnectionClosed:
            print("❌ Connection to coordinator lost")
            self.running = False
        except Exception as e:
            print(f"❌ Error handling message: {e}")
            self.running = False
    
    async def handle_task(self, task: Dict):
        """Execute a task assigned by the coordinator"""
        task_id = task["task_id"]
        task_type = task["task_type"]
        
        print(f"📥 Received task {task_id} ({task_type})")
        
        try:
            # Execute task based on type
            result = await self.execute_task(task)
            
            # Report completion
            await self.websocket.send(json.dumps({
                "type": "task_complete",
                "task_id": task_id,
                "result": result
            }))
            
            print(f"✅ Task {task_id} completed")
            
        except Exception as e:
            print(f"❌ Task {task_id} failed: {e}")
            
            # Report failure
            await self.websocket.send(json.dumps({
                "type": "task_failed",
                "task_id": task_id,
                "error": str(e)
            }))
    
    async def execute_task(self, task: Dict) -> Dict:
        """Execute task logic (placeholder - override in subclass)"""
        task_type = task["task_type"]
        
        # Simulate work
        await asyncio.sleep(2)
        
        return {
            "status": "completed",
            "task_type": task_type,
            "node": self.node_name
        }
    
    async def send_heartbeat(self):
        """Send periodic heartbeat to coordinator"""
        while self.running:
            try:
                await self.websocket.send(json.dumps({"type": "ping"}))
                await asyncio.sleep(30)  # Every 30 seconds
            except:
                break
    
    async def run(self):
        """Main run loop"""
        print(f"🚀 Starting GPU Mesh Client: {self.node_name}")
        
        while True:
            if await self.connect():
                # Start message handler and heartbeat
                await asyncio.gather(
                    self.handle_messages(),
                    self.send_heartbeat()
                )
            
            # Reconnect after delay
            print("⏳ Reconnecting in 10 seconds...")
            await asyncio.sleep(10)

async def main():
    client = GPUMeshClient(NODE_NAME, MESH_COORDINATOR_URL)
    await client.run()

if __name__ == "__main__":
    asyncio.run(main())
