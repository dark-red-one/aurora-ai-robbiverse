#!/bin/bash
# Quick fix to add /generate endpoint to Aurora Town AI Router
# Run this ON Aurora Town

echo "🔧 Fixing Aurora AI Router..."

# Stop the service
sudo systemctl stop ai-router

# Backup existing file
sudo cp /home/allan/robbie-ai/ai-router/ai_router.py /home/allan/robbie-ai/ai-router/ai_router.py.backup

# Replace with the new API
sudo tee /home/allan/robbie-ai/ai-router/ai_router.py > /dev/null << 'ENDOFFILE'
#!/usr/bin/env python3
"""
Aurora Town AI Router API - Complete Version
Provides REST API for Ollama models with /generate endpoint
"""

import subprocess
import json
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import uvicorn
import httpx

app = FastAPI(title="Aurora Town AI Router", version="1.0.0")

class GenerateRequest(BaseModel):
    prompt: str
    model: str = "llama3"
    system_prompt: Optional[str] = None
    max_tokens: int = 1024

class EmbedRequest(BaseModel):
    text: str
    model: str = "nomic-embed-text"

@app.get("/health")
async def health():
    """Health check with GPU and Ollama status"""
    gpu_name = "unknown"
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
            capture_output=True, text=True, timeout=2
        )
        if result.returncode == 0:
            gpu_name = result.stdout.strip()
    except:
        pass
    
    models_loaded = 0
    ollama_status = "unknown"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:11434/api/tags", timeout=2)
            if response.status_code == 200:
                data = response.json()
                models_loaded = len(data.get('models', []))
                ollama_status = "running"
    except:
        ollama_status = "not_running"
    
    return {
        "status": "healthy",
        "gpu": gpu_name,
        "ollama": ollama_status,
        "models_loaded": models_loaded
    }

@app.post("/generate")
async def generate(req: GenerateRequest):
    """Generate text using Ollama"""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            payload = {
                "model": req.model,
                "prompt": req.prompt,
                "stream": False
            }
            if req.system_prompt:
                payload["system"] = req.system_prompt
            
            response = await client.post(
                "http://localhost:11434/api/generate",
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            
            return {
                "content": result.get('response', ''),
                "model": req.model,
                "success": True
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/embed")
async def embed(req: EmbedRequest):
    """Generate embeddings using Ollama"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "http://localhost:11434/api/embeddings",
                json={"model": req.model, "prompt": req.text}
            )
            response.raise_for_status()
            result = response.json()
            
            return {
                "embedding": result.get('embedding', []),
                "model": req.model,
                "dimension": len(result.get('embedding', []))
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
async def models():
    """List available Ollama models"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:11434/api/tags", timeout=2)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {
        "service": "Aurora Town AI Router",
        "gpu": "RTX 4090",
        "docs": "/docs",
        "endpoints": {
            "/health": "GET - Health check",
            "/generate": "POST - Generate text",
            "/embed": "POST - Generate embeddings",
            "/models": "GET - List models"
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
ENDOFFILE

# Make it executable
sudo chmod +x /home/allan/robbie-ai/ai-router/ai_router.py

# Restart the service
sudo systemctl daemon-reload
sudo systemctl start ai-router

# Wait for startup
sleep 3

# Test
echo ""
echo "Testing endpoints..."
echo "1. Health check:"
curl -s http://localhost:8000/health | jq .

echo ""
echo "2. Models:"
curl -s http://localhost:8000/models | jq '.models[] | .name' | head -5

echo ""
echo "3. Generate test:"
curl -s -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Say hello in 5 words","model":"llama3"}' | jq .

echo ""
echo "✅ AI Router fixed and running!"
echo "Access at: http://8.17.147.158:8000"
echo "API docs: http://8.17.147.158:8000/docs"

