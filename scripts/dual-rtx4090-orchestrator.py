#!/usr/bin/env python3
"""
Dual RTX 4090 Orchestrator - MAX OUT Performance
Load balances between Vengeance 4090 and RunPod 4090
"""

import asyncio
import aiohttp
import json
import time
import random
from typing import Dict, Any, List

class DualRTX4090Orchestrator:
    def __init__(self):
        self.gpus = {
            "vengeance_4090": {
                "endpoint": "http://localhost:8080",
                "model": "qwen2.5:7b",
                "gpu": "RTX 4090 (24.6GB VRAM)",
                "status": False,
                "load": 0
            },
            "runpod_4090": {
                "endpoint": "http://localhost:8081",
                "model": "qwen2.5:7b", 
                "gpu": "RTX 4090 (23.6GB VRAM)",
                "status": False,
                "load": 0
            }
        }
        self.current_gpu = "vengeance_4090"
        self.health_check_interval = 30
        self.last_health_check = 0
        
    async def health_check_all(self):
        """Check health of both RTX 4090s"""
        current_time = time.time()
        if current_time - self.last_health_check < self.health_check_interval:
            return
            
        self.last_health_check = current_time
        
        # Check Vengeance 4090
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.gpus['vengeance_4090']['endpoint']}/api/tags", timeout=5) as response:
                    if response.status == 200:
                        self.gpus['vengeance_4090']['status'] = True
                        print("✅ Vengeance 4090: Available")
                    else:
                        self.gpus['vengeance_4090']['status'] = False
                        print("❌ Vengeance 4090: Unavailable")
        except:
            self.gpus['vengeance_4090']['status'] = False
            print("❌ Vengeance 4090: Unavailable")
            
        # Check RunPod 4090
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.gpus['runpod_4090']['endpoint']}/api/tags", timeout=5) as response:
                    if response.status == 200:
                        self.gpus['runpod_4090']['status'] = True
                        print("✅ RunPod 4090: Available")
                    else:
                        self.gpus['runpod_4090']['status'] = False
                        print("❌ RunPod 4090: Unavailable")
        except:
            self.gpus['runpod_4090']['status'] = False
            print("❌ RunPod 4090: Unavailable")
    
    def select_best_gpu(self):
        """Select best available GPU based on load and status"""
        available_gpus = [name for name, gpu in self.gpus.items() if gpu['status']]
        
        if not available_gpus:
            return None
            
        # Round-robin load balancing
        if len(available_gpus) == 1:
            return available_gpus[0]
            
        # Select GPU with lowest load
        best_gpu = min(available_gpus, key=lambda gpu: self.gpus[gpu]['load'])
        return best_gpu
    
    async def generate_dual_4090(self, prompt: str, max_tokens: int = 1000, temperature: float = 0.7) -> Dict[str, Any]:
        """Generate response using best available RTX 4090"""
        await self.health_check_all()
        
        selected_gpu = self.select_best_gpu()
        if not selected_gpu:
            return {
                "response": "Sorry, both RTX 4090s are unavailable.",
                "source": "none",
                "gpu": "none",
                "performance": "none",
                "success": False
            }
        
        # Increment load for selected GPU
        self.gpus[selected_gpu]['load'] += 1
        
        try:
            payload = {
                "model": "qwen2.5:7b",
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.gpus[selected_gpu]['endpoint']}/api/generate",
                    json=payload,
                    timeout=30
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            "response": result.get("response", ""),
                            "source": selected_gpu,
                            "gpu": self.gpus[selected_gpu]['gpu'],
                            "performance": "MAX RTX 4090 acceleration",
                            "success": True
                        }
        except Exception as e:
            print(f"❌ {selected_gpu} generation failed: {e}")
            self.gpus[selected_gpu]['status'] = False
        finally:
            # Decrement load for selected GPU
            self.gpus[selected_gpu]['load'] = max(0, self.gpus[selected_gpu]['load'] - 1)
        
        # Try other GPU if available
        other_gpu = "runpod_4090" if selected_gpu == "vengeance_4090" else "vengeance_4090"
        if self.gpus[other_gpu]['status']:
            return await self.generate_dual_4090(prompt, max_tokens, temperature)
        
        return {
            "response": "Sorry, both RTX 4090s failed.",
            "source": "none",
            "gpu": "none",
            "performance": "none",
            "success": False
        }
    
    async def get_dual_4090_status(self) -> Dict[str, Any]:
        """Get status of both RTX 4090s"""
        await self.health_check_all()
        
        return {
            "vengeance_4090": {
                "available": self.gpus['vengeance_4090']['status'],
                "endpoint": self.gpus['vengeance_4090']['endpoint'],
                "model": self.gpus['vengeance_4090']['model'],
                "gpu": self.gpus['vengeance_4090']['gpu'],
                "load": self.gpus['vengeance_4090']['load'],
                "performance": "MAX RTX 4090 acceleration"
            },
            "runpod_4090": {
                "available": self.gpus['runpod_4090']['status'],
                "endpoint": self.gpus['runpod_4090']['endpoint'],
                "model": self.gpus['runpod_4090']['model'],
                "gpu": self.gpus['runpod_4090']['gpu'],
                "load": self.gpus['runpod_4090']['load'],
                "performance": "MAX RTX 4090 acceleration"
            },
            "total_vram": "48.2GB (24.6GB + 23.6GB)",
            "load_balancing": "Round-robin between GPUs",
            "recommended": "dual_4090" if any(gpu['status'] for gpu in self.gpus.values()) else "none"
        }

# Test the dual 4090 orchestrator
async def test_dual_4090():
    orchestrator = DualRTX4090Orchestrator()
    
    print("🚀 DUAL RTX 4090 ORCHESTRATOR - MAX OUT PERFORMANCE")
    print("==================================================")
    
    # Test both GPUs
    await orchestrator.health_check_all()
    
    # Get status
    status = await orchestrator.get_dual_4090_status()
    print(f"Status: {json.dumps(status, indent=2)}")
    
    # Test generation
    if status["recommended"] != "none":
        print("\n🔧 Testing dual 4090 generation...")
        result = await orchestrator.generate_dual_4090("Hello, I am Robbie, your AI assistant. Tell me about your capabilities.")
        print(f"Result: {json.dumps(result, indent=2)}")
    else:
        print("❌ No RTX 4090s available")

if __name__ == "__main__":
    asyncio.run(test_dual_4090())
