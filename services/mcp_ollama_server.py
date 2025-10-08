#!/usr/bin/env python3
"""
Ollama MCP Server - Local Qwen 2.5 7B power! 🧠
Gives Cursor direct access to your local GPU-accelerated LLM
"""

import asyncio
import json
import sys
import os
import aiohttp
from typing import Any, Dict

OLLAMA_BASE = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434")
MODEL = os.getenv("MODEL", "qwen2.5:7b")

class OllamaMCPServer:
    def __init__(self):
        self.name = "ollama-qwen"
        self.version = "1.0.0"
        
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
                    "name": "chat",
                    "description": f"Chat with local {MODEL} model (GPU-accelerated, FAST!)",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "message": {"type": "string", "description": "Your message"},
                            "system": {"type": "string", "description": "System prompt (optional)"},
                            "temperature": {"type": "number", "default": 0.7}
                        },
                        "required": ["message"]
                    }
                },
                {
                    "name": "generate",
                    "description": "Generate text completion (no conversation history)",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "prompt": {"type": "string"},
                            "max_tokens": {"type": "integer", "default": 512},
                            "temperature": {"type": "number", "default": 0.7}
                        },
                        "required": ["prompt"]
                    }
                },
                {
                    "name": "embed",
                    "description": "Generate text embeddings for semantic search",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "text": {"type": "string"}
                        },
                        "required": ["text"]
                    }
                },
                {
                    "name": "status",
                    "description": "Check Ollama server status and available models",
                    "inputSchema": {
                        "type": "object",
                        "properties": {}
                    }
                }
            ]
        }
    
    async def call_tool(self, params: dict) -> dict:
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        try:
            if tool_name == "chat":
                return await self.chat(arguments)
            elif tool_name == "generate":
                return await self.generate(arguments)
            elif tool_name == "embed":
                return await self.embed(arguments)
            elif tool_name == "status":
                return await self.status()
            else:
                return {"error": f"Unknown tool: {tool_name}"}
        except Exception as e:
            return {"error": str(e)}
    
    async def chat(self, args: dict) -> dict:
        """Chat with Ollama"""
        async with aiohttp.ClientSession() as session:
            payload = {
                "model": MODEL,
                "messages": [
                    {"role": "user", "content": args["message"]}
                ],
                "stream": False,
                "options": {
                    "temperature": args.get("temperature", 0.7)
                }
            }
            
            if "system" in args:
                payload["messages"].insert(0, {
                    "role": "system",
                    "content": args["system"]
                })
            
            async with session.post(f"{OLLAMA_BASE}/api/chat", json=payload) as resp:
                result = await resp.json()
                response_text = result.get("message", {}).get("content", "No response")
                
                return {
                    "content": [{
                        "type": "text",
                        "text": response_text
                    }]
                }
    
    async def generate(self, args: dict) -> dict:
        """Generate text completion"""
        async with aiohttp.ClientSession() as session:
            payload = {
                "model": MODEL,
                "prompt": args["prompt"],
                "stream": False,
                "options": {
                    "temperature": args.get("temperature", 0.7),
                    "num_predict": args.get("max_tokens", 512)
                }
            }
            
            async with session.post(f"{OLLAMA_BASE}/api/generate", json=payload) as resp:
                result = await resp.json()
                response_text = result.get("response", "No response")
                
                return {
                    "content": [{
                        "type": "text",
                        "text": response_text
                    }]
                }
    
    async def embed(self, args: dict) -> dict:
        """Generate embeddings"""
        async with aiohttp.ClientSession() as session:
            payload = {
                "model": MODEL,
                "prompt": args["text"]
            }
            
            async with session.post(f"{OLLAMA_BASE}/api/embeddings", json=payload) as resp:
                result = await resp.json()
                embedding = result.get("embedding", [])
                
                return {
                    "content": [{
                        "type": "text",
                        "text": json.dumps({
                            "embedding": embedding[:10],  # Show first 10 dimensions
                            "dimensions": len(embedding),
                            "text_length": len(args["text"])
                        }, indent=2)
                    }]
                }
    
    async def status(self) -> dict:
        """Check Ollama status"""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{OLLAMA_BASE}/api/tags") as resp:
                    result = await resp.json()
                    models = [m["name"] for m in result.get("models", [])]
                    
                    return {
                        "content": [{
                            "type": "text",
                            "text": json.dumps({
                                "status": "online",
                                "endpoint": OLLAMA_BASE,
                                "current_model": MODEL,
                                "available_models": models
                            }, indent=2)
                        }]
                    }
            except Exception as e:
                return {
                    "content": [{
                        "type": "text",
                        "text": json.dumps({
                            "status": "offline",
                            "error": str(e)
                        }, indent=2)
                    }]
                }

async def main():
    server = OllamaMCPServer()
    
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




