#!/usr/bin/env python3
"""
MCP Server for Direct Ollama Integration with Cursor
Provides tools for chat with local Ollama instance
"""

import asyncio
import json
import os
import sys
from typing import Any
import aiohttp

def send_message(type: str, data: dict[str, Any]) -> None:
    message = {"jsonrpc": "2.0", "method": type, **data}
    print(json.dumps(message), flush=True)

async def chat_with_ollama(prompt: str, model: str = "qwen2.5:7b"):
    """Send chat request to Ollama"""
    endpoint = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434")
    
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
        async with session.post(
            f"{endpoint}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False}
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                return {"response": data.get("response", "")}
            else:
                return {"error": f"Ollama returned {resp.status}"}

async def list_models():
    """List available models"""
    endpoint = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434")
    
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
        async with session.get(f"{endpoint}/api/tags") as resp:
            if resp.status == 200:
                data = await resp.json()
                return {"models": [m["name"] for m in data.get("models", [])]}
            else:
                return {"error": f"Ollama returned {resp.status}"}

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
                    "name": "ollama-qwen",
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
                        "name": "list_models",
                        "description": "List all available Ollama models",
                        "inputSchema": {
                            "type": "object",
                            "properties": {},
                            "required": []
                        }
                    },
                    {
                        "name": "chat",
                        "description": "Chat with Ollama AI",
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
        
        if tool_name == "list_models":
            result = await list_models()
            send_message("result", {
                "id": message.get("id"),
                "result": {
                    "content": [{
                        "type": "text",
                        "text": json.dumps(result, indent=2)
                    }]
                }
            })
        
        elif tool_name == "chat":
            result = await chat_with_ollama(
                args.get("prompt"),
                args.get("model", "qwen2.5:7b")
            )
            send_message("result", {
                "id": message.get("id"),
                "result": {
                    "content": [{
                        "type": "text",
                        "text": result.get("response", json.dumps(result))
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
