#!/usr/bin/env python3
"""
Unified LLM Gateway - Tight Local + RunPod Integration
Routes requests between local Robbie Ollama and RunPod GPU acceleration
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, Any, Optional

class UnifiedLLMGateway:
    def __init__(self):
        self.local_endpoint = "http://localhost:9000"
        self.runpod_endpoint = "http://localhost:8080"
        self.runpod_model = "qwen2.5:7b"
        self.health_check_interval = 30
        self.last_health_check = 0
        self.runpod_available = False
        self.local_available = False
        
    async def health_check(self):
        """Check health of both endpoints"""
        current_time = time.time()
        if current_time - self.last_health_check < self.health_check_interval:
            return
            
        self.last_health_check = current_time
        
        # Check RunPod
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.runpod_endpoint}/api/tags", timeout=5) as response:
                    if response.status == 200:
                        self.runpod_available = True
                        print("✅ RunPod Ollama: Available")
                    else:
                        self.runpod_available = False
                        print("❌ RunPod Ollama: Unavailable")
        except:
            self.runpod_available = False
            print("❌ RunPod Ollama: Unavailable")
            
        # Check Local
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.local_endpoint}/health", timeout=5) as response:
                    if response.status == 200:
                        self.local_available = True
                        print("✅ Local Robbie Ollama: Available")
                    else:
                        self.local_available = False
                        print("❌ Local Robbie Ollama: Unavailable")
        except:
            self.local_available = False
            print("❌ Local Robbie Ollama: Unavailable")
    
    async def generate(self, prompt: str, max_tokens: int = 1000, temperature: float = 0.7) -> Dict[str, Any]:
        """Generate response using best available endpoint"""
        await self.health_check()
        
        # Try RunPod first (GPU acceleration)
        if self.runpod_available:
            try:
                payload = {
                    "model": self.runpod_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens
                    }
                }
                
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{self.runpod_endpoint}/api/generate",
                        json=payload,
                        timeout=30
                    ) as response:
                        if response.status == 200:
                            result = await response.json()
                            return {
                                "response": result.get("response", ""),
                                "source": "runpod",
                                "model": self.runpod_model,
                                "gpu": "RTX 4090",
                                "success": True
                            }
            except Exception as e:
                print(f"❌ RunPod generation failed: {e}")
                self.runpod_available = False
        
        # Fallback to Local Robbie Ollama
        if self.local_available:
            try:
                payload = {
                    "prompt": prompt,
                    "max_tokens": max_tokens,
                    "temperature": temperature
                }
                
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{self.local_endpoint}/generate",
                        json=payload,
                        timeout=30
                    ) as response:
                        if response.status == 200:
                            result = await response.json()
                            return {
                                "response": result.get("response", ""),
                                "source": "local",
                                "model": "robbie-ollama",
                                "gpu": "CPU",
                                "success": True
                            }
            except Exception as e:
                print(f"❌ Local generation failed: {e}")
                self.local_available = False
        
        # Both failed
        return {
            "response": "Sorry, both LLM endpoints are unavailable.",
            "source": "none",
            "model": "none",
            "gpu": "none",
            "success": False
        }
    
    async def get_status(self) -> Dict[str, Any]:
        """Get status of both endpoints"""
        await self.health_check()
        return {
            "runpod": {
                "available": self.runpod_available,
                "endpoint": self.runpod_endpoint,
                "model": self.runpod_model,
                "gpu": "RTX 4090 (23.6GB VRAM)"
            },
            "local": {
                "available": self.local_available,
                "endpoint": self.local_endpoint,
                "model": "robbie-ollama",
                "gpu": "CPU (12 cores, 23GB RAM)"
            },
            "recommended": "runpod" if self.runpod_available else "local" if self.local_available else "none"
        }

# Test the gateway
async def test_gateway():
    gateway = UnifiedLLMGateway()
    
    print("🔧 Testing Unified LLM Gateway...")
    print("=================================")
    
    # Test status
    status = await gateway.get_status()
    print(f"Status: {json.dumps(status, indent=2)}")
    
    # Test generation
    if status["recommended"] != "none":
        print("\n🔧 Testing generation...")
        result = await gateway.generate("Hello, I am Robbie, your AI assistant. Tell me about your capabilities.")
        print(f"Result: {json.dumps(result, indent=2)}")
    else:
        print("❌ No LLM endpoints available")

if __name__ == "__main__":
    asyncio.run(test_gateway())
