#!/usr/bin/env python3
"""
MCP Server for GPU Mesh Integration with Cursor
Provides tools for routing AI requests across multiple GPU nodes
"""

import asyncio
import json
import os
import sys
from typing import Any
import aiohttp

# MCP protocol helper
def send_message(type: str, data: dict[str, Any]) -> None:
    message = {"jsonrpc": "2.0", "method": type, **data}
    print(json.dumps(message), flush=True)

async def get_available_nodes():
    """Get list of available GPU nodes"""
    endpoints = os.getenv("OLLAMA_ENDPOINTS", "http://localhost:11434").split(",")
    nodes = []
    
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=3)) as session:
        for idx, endpoint in enumerate(endpoints):
            try:
                async with session.get(f"{endpoint}/api/tags") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        nodes.append({
                            "id": f"gpu_{idx}",
                            "endpoint": endpoint,
                            "status": "online",
                            "models": [m["name"] for m in data.get("models", [])]
                        })
            except:
                nodes.append({
                    "id": f"gpu_{idx}",
                    "endpoint": endpoint,
                    "status": "offline",
                    "models": []
                })
    
    return nodes

async def chat_with_best_node(prompt: str, model: str = "qwen2.5:7b"):
    """Send chat request to best available GPU node"""
    nodes = await get_available_nodes()
    online_nodes = [n for n in nodes if n["status"] == "online"]
    
    if not online_nodes:
        return {"error": "No GPU nodes available"}
    
    # Use first online node (could implement load balancing here)
    node = online_nodes[0]
    
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
        async with session.post(
            f"{node['endpoint']}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False}
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                return {
                    "response": data.get("response", ""),
                    "node": node["id"],
                    "endpoint": node["endpoint"]
                }
            else:
                return {"error": f"GPU node returned {resp.status}"}

async def handle_message(message: dict[str, Any]) -> None:
    """Handle incoming MCP messages"""
    method = message.get("method")
    
    if method == "initialize":
        send_message("result", {
            "id": message.get("id"),
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {
                    "name": "dual-rtx4090",
                    "version": "1.0.0"
                }
            }
        })
    
    elif method == "tools/list":
        send_message("result", {
            "id": message.get("id"),
            "result": {
                "tools": [
                    {
                        "name": "list_gpu_nodes",
                        "description": "List all available GPU nodes and their status",
                        "inputSchema": {
                            "type": "object",
                            "properties": {},
                            "required": []
                        }
                    },
                    {
                        "name": "chat_with_gpu",
                        "description": "Send a chat request to the best available GPU",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "prompt": {"type": "string", "description": "The prompt to send"},
                                "model": {"type": "string", "description": "Model name (default: qwen2.5:7b)"}
                            },
                            "required": ["prompt"]
                        }
                    }
                ]
            }
        })
    
    elif method == "tools/call":
        tool_name = message.get("params", {}).get("name")
        args = message.get("params", {}).get("arguments", {})
        
        if tool_name == "list_gpu_nodes":
            nodes = await get_available_nodes()
            send_message("result", {
                "id": message.get("id"),
                "result": {
                    "content": [{
                        "type": "text",
                        "text": json.dumps(nodes, indent=2)
                    }]
                }
            })
        
        elif tool_name == "chat_with_gpu":
            result = await chat_with_best_node(
                args.get("prompt"),
                args.get("model", "qwen2.5:7b")
            )
            send_message("result", {
                "id": message.get("id"),
                "result": {
                    "content": [{
                        "type": "text",
                        "text": json.dumps(result, indent=2)
                    }]
                }
            })

async def main():
    """Main server loop"""
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            
            message = json.loads(line)
            await handle_message(message)
        except json.JSONDecodeError:
            continue
        except Exception as e:
            sys.stderr.write(f"Error: {e}\n")
            sys.stderr.flush()

if __name__ == "__main__":
    asyncio.run(main())
