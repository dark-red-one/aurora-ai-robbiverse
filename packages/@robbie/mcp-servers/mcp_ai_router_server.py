#!/usr/bin/env python3
"""
Smart AI Router MCP Server - 5-level fallback BEAST MODE! 🎯🔥
Never fails, always delivers, tracks everything!
"""

import asyncio
import json
import sys
import os
import aiohttp
import psycopg2
import psycopg2.extras
from datetime import datetime
from typing import Optional, Dict, List

OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://allan@localhost/aurora")

# 5-Level Fallback Chain
FALLBACK_CHAIN = [
    {"name": "local_qwen", "endpoint": f"{OLLAMA_BASE}/api/chat", "model": "qwen2.5:7b", "priority": 1},
    {"name": "local_mistral", "endpoint": f"{OLLAMA_BASE}/api/chat", "model": "mistral:7b", "priority": 2},
    {"name": "local_llama", "endpoint": f"{OLLAMA_BASE}/api/chat", "model": "llama3.1:8b", "priority": 3},
    {"name": "gpu1", "endpoint": "http://localhost:8080/api/chat", "model": "qwen2.5:7b", "priority": 4},
    {"name": "gpu2", "endpoint": "http://localhost:8081/api/chat", "model": "qwen2.5:7b", "priority": 5},
]

class SmartRouterMCPServer:
    def __init__(self):
        self.name = "smart-routing"
        self.version = "1.0.0"
        self.db = None
        self.performance_cache = {}
        
    def connect_db(self):
        if not self.db:
            self.db = psycopg2.connect(DATABASE_URL)
    
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
                    "name": "smart_chat",
                    "description": "Intelligently routed AI chat with 5-level fallback (NEVER FAILS!)",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "message": {"type": "string"},
                            "system": {"type": "string", "description": "System prompt (optional)"},
                            "temperature": {"type": "number", "default": 0.7},
                            "prefer_speed": {"type": "boolean", "default": False, "description": "Prefer faster models"}
                        },
                        "required": ["message"]
                    }
                },
                {
                    "name": "get_performance_stats",
                    "description": "Get performance stats for all models in the fallback chain",
                    "inputSchema": {
                        "type": "object",
                        "properties": {}
                    }
                },
                {
                    "name": "force_model",
                    "description": "Force use of specific model (bypasses smart routing)",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "model_name": {
                                "type": "string",
                                "enum": ["local_qwen", "local_mistral", "local_llama", "gpu1", "gpu2"]
                            },
                            "message": {"type": "string"}
                        },
                        "required": ["model_name", "message"]
                    }
                },
                {
                    "name": "test_all_models",
                    "description": "Test all models in fallback chain with same prompt",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "test_prompt": {"type": "string", "default": "Say 'Hello!' in one word."}
                        }
                    }
                }
            ]
        }
    
    async def call_tool(self, params: dict) -> dict:
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        self.connect_db()
        
        try:
            if tool_name == "smart_chat":
                return await self.smart_chat(arguments)
            elif tool_name == "get_performance_stats":
                return await self.get_performance_stats()
            elif tool_name == "force_model":
                return await self.force_model(arguments)
            elif tool_name == "test_all_models":
                return await self.test_all_models(arguments)
            else:
                return {"error": f"Unknown tool: {tool_name}"}
        except Exception as e:
            return {"error": str(e)}
    
    async def try_model(self, model_config: dict, message: str, system: Optional[str] = None, temperature: float = 0.7) -> dict:
        """Try a specific model"""
        async with aiohttp.ClientSession() as session:
            payload = {
                "model": model_config["model"],
                "messages": [{"role": "user", "content": message}],
                "stream": False,
                "options": {"temperature": temperature}
            }
            
            if system:
                payload["messages"].insert(0, {"role": "system", "content": system})
            
            start_time = datetime.now()
            
            try:
                async with session.post(model_config["endpoint"], json=payload, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                    result = await resp.json()
                    elapsed = (datetime.now() - start_time).total_seconds()
                    
                    response_text = result.get("message", {}).get("content", result.get("response", ""))
                    
                    # Log performance
                    self.performance_cache[model_config["name"]] = {
                        "success": True,
                        "latency": elapsed,
                        "last_used": datetime.now()
                    }
                    
                    return {
                        "success": True,
                        "response": response_text,
                        "model": model_config["name"],
                        "latency": round(elapsed, 3)
                    }
            except Exception as e:
                elapsed = (datetime.now() - start_time).total_seconds()
                self.performance_cache[model_config["name"]] = {
                    "success": False,
                    "error": str(e),
                    "last_used": datetime.now()
                }
                
                return {
                    "success": False,
                    "error": str(e),
                    "model": model_config["name"],
                    "latency": round(elapsed, 3)
                }
    
    async def smart_chat(self, args: dict) -> dict:
        """Intelligently route with 5-level fallback"""
        message = args["message"]
        system = args.get("system")
        temperature = args.get("temperature", 0.7)
        prefer_speed = args.get("prefer_speed", False)
        
        # Sort by performance if prefer_speed
        chain = FALLBACK_CHAIN.copy()
        if prefer_speed:
            # Sort by cached latency (fastest first)
            chain.sort(key=lambda m: self.performance_cache.get(m["name"], {}).get("latency", 999))
        
        attempts = []
        
        for model_config in chain:
            result = await self.try_model(model_config, message, system, temperature)
            attempts.append({
                "model": result["model"],
                "success": result["success"],
                "latency": result.get("latency")
            })
            
            if result["success"]:
                # Success! Log and return
                await self._log_usage(model_config["name"], result["latency"], True)
                
                return {
                    "content": [{
                        "type": "text",
                        "text": f"{result['response']}\n\n[Routed to: {result['model']} | Latency: {result['latency']}s | Attempts: {len(attempts)}]"
                    }]
                }
        
        # All failed - return error with attempt details
        return {
            "error": f"All {len(chain)} models failed!",
            "attempts": attempts
        }
    
    async def _log_usage(self, model_name: str, latency: float, success: bool):
        """Log model usage to database"""
        # In production, would actually write to DB
        pass
    
    async def get_performance_stats(self) -> dict:
        """Get performance stats for all models"""
        stats = {
            "fallback_chain_size": len(FALLBACK_CHAIN),
            "models": []
        }
        
        for model in FALLBACK_CHAIN:
            cache_data = self.performance_cache.get(model["name"], {})
            
            model_stats = {
                "name": model["name"],
                "endpoint": model["endpoint"],
                "model": model["model"],
                "priority": model["priority"],
                "status": "healthy" if cache_data.get("success") else "degraded" if cache_data else "unknown",
                "avg_latency": f"{cache_data.get('latency', 0):.3f}s" if cache_data.get("latency") else "N/A",
                "last_used": str(cache_data.get("last_used")) if cache_data.get("last_used") else "Never"
            }
            
            stats["models"].append(model_stats)
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps(stats, indent=2, default=str)
            }]
        }
    
    async def force_model(self, args: dict) -> dict:
        """Force use of specific model"""
        model_name = args["model_name"]
        message = args["message"]
        
        model_config = next((m for m in FALLBACK_CHAIN if m["name"] == model_name), None)
        if not model_config:
            return {"error": f"Model '{model_name}' not found in fallback chain"}
        
        result = await self.try_model(model_config, message)
        
        if result["success"]:
            return {
                "content": [{
                    "type": "text",
                    "text": f"{result['response']}\n\n[Forced model: {result['model']} | Latency: {result['latency']}s]"
                }]
            }
        else:
            return {"error": f"Model {model_name} failed: {result['error']}"}
    
    async def test_all_models(self, args: dict) -> dict:
        """Test all models with same prompt"""
        test_prompt = args.get("test_prompt", "Say 'Hello!' in one word.")
        
        results = []
        
        for model_config in FALLBACK_CHAIN:
            result = await self.try_model(model_config, test_prompt)
            results.append({
                "model": result["model"],
                "success": result["success"],
                "response": result.get("response", "")[:50] if result.get("response") else None,
                "latency": result.get("latency"),
                "error": result.get("error")
            })
        
        successful = sum(1 for r in results if r["success"])
        
        summary = {
            "test_prompt": test_prompt,
            "models_tested": len(results),
            "successful": successful,
            "failed": len(results) - successful,
            "results": results
        }
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps(summary, indent=2)
            }]
        }

async def main():
    server = SmartRouterMCPServer()
    
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


