#!/usr/bin/env python3
"""
Dual RTX 4090 MCP Server - 48GB of PURE BEAST MODE! 🔥🔥
Load-balanced, auto-failover, maximum performance
"""

import asyncio
import json
import sys
import os
import aiohttp
import time
from typing import List, Dict, Optional

GPU1_ENDPOINT = os.getenv("GPU1_ENDPOINT", "http://localhost:8080")
GPU2_ENDPOINT = os.getenv("GPU2_ENDPOINT", "http://localhost:8081")
LOAD_BALANCE = os.getenv("LOAD_BALANCE", "true").lower() == "true"

class DualGPUMCPServer:
    def __init__(self):
        self.name = "dual-rtx4090"
        self.version = "1.0.0"
        self.current_gpu = 0  # Round-robin counter
        self.gpu_health = {GPU1_ENDPOINT: True, GPU2_ENDPOINT: True}
        
    async def handle_request(self, request: dict) -> dict:
        method = request.get("method")
        params = request.get("params", {})
        
        if method == "initialize":
            return self.initialize(params)
        elif method == "tools/list":
            return self.list_tools()
        elif method == "tools/call":
            return await self.call_tool(params)
        else:
            return {"error": f"Unknown method: {method}"}
    
    def initialize(self, params: dict) -> dict:
        return {
            "protocolVersion": "2024-11-05",
            "serverInfo": {
                "name": self.name,
                "version": self.version
            },
            "capabilities": {"tools": {}}
        }
    
    def list_tools(self) -> dict:
        return {
            "tools": [
                {
                    "name": "balanced_chat",
                    "description": "Chat with load-balanced dual GPU mesh (auto-failover!)",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "message": {"type": "string"},
                            "model": {"type": "string", "default": "qwen2.5:7b"},
                            "temperature": {"type": "number", "default": 0.7}
                        },
                        "required": ["message"]
                    }
                },
                {
                    "name": "gpu_status",
                    "description": "Check health and status of both GPUs",
                    "inputSchema": {
                        "type": "object",
                        "properties": {}
                    }
                },
                {
                    "name": "force_gpu",
                    "description": "Force request to specific GPU (1 or 2)",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "gpu_number": {"type": "integer", "enum": [1, 2]},
                            "message": {"type": "string"},
                            "model": {"type": "string", "default": "qwen2.5:7b"}
                        },
                        "required": ["gpu_number", "message"]
                    }
                },
                {
                    "name": "benchmark",
                    "description": "Run performance benchmark on both GPUs",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "prompt": {"type": "string", "default": "Explain quantum computing in one sentence."}
                        }
                    }
                }
            ]
        }
    
    async def call_tool(self, params: dict) -> dict:
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        try:
            if tool_name == "balanced_chat":
                return await self.balanced_chat(arguments)
            elif tool_name == "gpu_status":
                return await self.gpu_status()
            elif tool_name == "force_gpu":
                return await self.force_gpu(arguments)
            elif tool_name == "benchmark":
                return await self.benchmark(arguments)
            else:
                return {"error": f"Unknown tool: {tool_name}"}
        except Exception as e:
            return {"error": str(e)}
    
    def get_next_gpu(self) -> str:
        """Round-robin load balancing with health check"""
        endpoints = [GPU1_ENDPOINT, GPU2_ENDPOINT]
        healthy_endpoints = [e for e in endpoints if self.gpu_health.get(e, True)]
        
        if not healthy_endpoints:
            # Both down - try them anyway
            return endpoints[self.current_gpu % 2]
        
        # Round-robin through healthy GPUs
        endpoint = healthy_endpoints[self.current_gpu % len(healthy_endpoints)]
        self.current_gpu += 1
        return endpoint
    
    async def chat_with_gpu(self, endpoint: str, message: str, model: str = "qwen2.5:7b", temperature: float = 0.7) -> dict:
        """Send chat request to specific GPU"""
        async with aiohttp.ClientSession() as session:
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": message}],
                "stream": False,
                "options": {"temperature": temperature}
            }
            
            try:
                async with session.post(f"{endpoint}/api/chat", json=payload, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                    result = await resp.json()
                    self.gpu_health[endpoint] = True
                    return {
                        "success": True,
                        "response": result.get("message", {}).get("content", ""),
                        "gpu": endpoint
                    }
            except Exception as e:
                self.gpu_health[endpoint] = False
                return {
                    "success": False,
                    "error": str(e),
                    "gpu": endpoint
                }
    
    async def balanced_chat(self, args: dict) -> dict:
        """Load-balanced chat with auto-failover"""
        message = args["message"]
        model = args.get("model", "qwen2.5:7b")
        temperature = args.get("temperature", 0.7)
        
        # Try primary GPU
        primary_gpu = self.get_next_gpu()
        result = await self.chat_with_gpu(primary_gpu, message, model, temperature)
        
        if result["success"]:
            return {
                "content": [{
                    "type": "text",
                    "text": f"{result['response']}\n\n[GPU: {result['gpu']}]"
                }]
            }
        
        # Failover to other GPU
        other_gpu = GPU2_ENDPOINT if primary_gpu == GPU1_ENDPOINT else GPU1_ENDPOINT
        result = await self.chat_with_gpu(other_gpu, message, model, temperature)
        
        if result["success"]:
            return {
                "content": [{
                    "type": "text",
                    "text": f"{result['response']}\n\n[GPU: {result['gpu']} - FAILOVER from {primary_gpu}]"
                }]
            }
        
        return {"error": f"Both GPUs failed. GPU1: {self.gpu_health[GPU1_ENDPOINT]}, GPU2: {self.gpu_health[GPU2_ENDPOINT]}"}
    
    async def gpu_status(self) -> dict:
        """Check status of both GPUs"""
        async with aiohttp.ClientSession() as session:
            results = {}
            
            for i, endpoint in enumerate([GPU1_ENDPOINT, GPU2_ENDPOINT], 1):
                try:
                    start = time.time()
                    async with session.get(f"{endpoint}/api/tags", timeout=aiohttp.ClientTimeout(total=5)) as resp:
                        data = await resp.json()
                        latency = (time.time() - start) * 1000
                        results[f"GPU{i}"] = {
                            "status": "online",
                            "endpoint": endpoint,
                            "models": [m["name"] for m in data.get("models", [])],
                            "latency_ms": round(latency, 2),
                            "healthy": True
                        }
                        self.gpu_health[endpoint] = True
                except Exception as e:
                    results[f"GPU{i}"] = {
                        "status": "offline",
                        "endpoint": endpoint,
                        "error": str(e),
                        "healthy": False
                    }
                    self.gpu_health[endpoint] = False
            
            return {
                "content": [{
                    "type": "text",
                    "text": json.dumps(results, indent=2)
                }]
            }
    
    async def force_gpu(self, args: dict) -> dict:
        """Force request to specific GPU"""
        gpu_num = args["gpu_number"]
        endpoint = GPU1_ENDPOINT if gpu_num == 1 else GPU2_ENDPOINT
        message = args["message"]
        model = args.get("model", "qwen2.5:7b")
        
        result = await self.chat_with_gpu(endpoint, message, model)
        
        if result["success"]:
            return {
                "content": [{
                    "type": "text",
                    "text": f"{result['response']}\n\n[Forced GPU{gpu_num}: {endpoint}]"
                }]
            }
        else:
            return {"error": f"GPU{gpu_num} failed: {result['error']}"}
    
    async def benchmark(self, args: dict) -> dict:
        """Benchmark both GPUs"""
        prompt = args.get("prompt", "Explain quantum computing in one sentence.")
        results = {}
        
        for i, endpoint in enumerate([GPU1_ENDPOINT, GPU2_ENDPOINT], 1):
            start = time.time()
            result = await self.chat_with_gpu(endpoint, prompt, "qwen2.5:7b", 0.7)
            elapsed = time.time() - start
            
            results[f"GPU{i}"] = {
                "endpoint": endpoint,
                "success": result["success"],
                "time_seconds": round(elapsed, 3),
                "response_length": len(result.get("response", "")) if result["success"] else 0,
                "tokens_per_second": round(len(result.get("response", "").split()) / elapsed, 2) if result["success"] and elapsed > 0 else 0
            }
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps(results, indent=2)
            }]
        }

async def main():
    server = DualGPUMCPServer()
    
    async for line in sys.stdin:
        try:
            request = json.loads(line)
            response = await server.handle_request(request)
            print(json.dumps(response), flush=True)
        except Exception as e:
            error_response = {"error": str(e)}
            print(json.dumps(error_response), flush=True)

if __name__ == "__main__":
    asyncio.run(main())




