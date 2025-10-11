#!/usr/bin/env python3
"""
RobbieBook1 GPU Mesh Client
Connects to Aurora RTX 4090 GPU via SSH tunnel for AI inference
"""

import asyncio
import json
import sys
import aiohttp
from typing import Dict, Optional

class RobbieBookGPUClient:
    def __init__(self, ollama_endpoint="http://localhost:11435"):
        self.ollama_endpoint = ollama_endpoint
        self.node_name = "robbiebook1"
        self.connected = False
        
    async def test_connection(self) -> bool:
        """Test connection to Aurora GPU via tunnel"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.ollama_endpoint}/api/tags", timeout=5) as response:
                    if response.status == 200:
                        data = await response.json()
                        models = data.get("models", [])
                        print(f"✅ Connected to Aurora GPU!")
                        print(f"📊 Available models: {len(models)}")
                        for model in models:
                            print(f"   - {model['name']}")
                        self.connected = True
                        return True
                    else:
                        print(f"❌ Connection failed: HTTP {response.status}")
                        return False
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            print(f"💡 Make sure the SSH tunnel is running:")
            print(f"   ./deployment/start-aurora-gpu-tunnel.sh &")
            return False
    
    async def generate(self, model: str, prompt: str, stream: bool = False) -> Dict:
        """Generate text using Aurora GPU"""
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": model,
                    "prompt": prompt,
                    "stream": stream
                }
                
                async with session.post(
                    f"{self.ollama_endpoint}/api/generate",
                    json=payload,
                    timeout=120
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            "status": "success",
                            "response": result.get("response", ""),
                            "model": model,
                            "node": "aurora-gpu"
                        }
                    else:
                        return {
                            "status": "error",
                            "error": f"HTTP {response.status}"
                        }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
    
    async def embed(self, model: str, texts: list) -> Dict:
        """Generate embeddings using Aurora GPU"""
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": model,
                    "prompt": texts[0] if isinstance(texts, list) else texts
                }
                
                async with session.post(
                    f"{self.ollama_endpoint}/api/embeddings",
                    json=payload,
                    timeout=30
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            "status": "success",
                            "embedding": result.get("embedding", []),
                            "model": model,
                            "node": "aurora-gpu"
                        }
                    else:
                        return {
                            "status": "error",
                            "error": f"HTTP {response.status}"
                        }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
    
    async def get_status(self) -> Dict:
        """Get Aurora GPU status"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.ollama_endpoint}/api/tags", timeout=5) as response:
                    if response.status == 200:
                        data = await response.json()
                        models = data.get("models", [])
                        return {
                            "status": "online",
                            "node": "aurora-gpu",
                            "endpoint": self.ollama_endpoint,
                            "models": [m["name"] for m in models],
                            "model_count": len(models)
                        }
                    else:
                        return {
                            "status": "error",
                            "error": f"HTTP {response.status}"
                        }
        except Exception as e:
            return {
                "status": "offline",
                "error": str(e)
            }

async def main():
    client = RobbieBookGPUClient()
    
    # Test mode
    if "--test" in sys.argv:
        print("🧪 Testing RobbieBook1 → Aurora GPU Connection...")
        print(f"   Endpoint: {client.ollama_endpoint}")
        print("")
        
        if await client.test_connection():
            print("")
            print("🎯 Testing inference...")
            result = await client.generate(
                model="qwen2.5:7b",
                prompt="Say 'Hello from Aurora GPU!' in 5 words or less."
            )
            
            if result["status"] == "success":
                print(f"✅ Response: {result['response']}")
                print(f"📍 Node: {result['node']}")
            else:
                print(f"❌ Error: {result.get('error')}")
            
            return 0
        else:
            return 1
    
    # Status mode
    elif "--status" in sys.argv:
        status = await client.get_status()
        print(json.dumps(status, indent=2))
        return 0 if status["status"] == "online" else 1
    
    # Default: show usage
    else:
        print("RobbieBook1 GPU Client - Aurora RTX 4090")
        print("")
        print("Usage:")
        print("  python3 services/gpu-mesh/robbiebook-client.py --test")
        print("  python3 services/gpu-mesh/robbiebook-client.py --status")
        print("")
        print("Make sure the SSH tunnel is running first:")
        print("  ./deployment/start-aurora-gpu-tunnel.sh &")
        return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

