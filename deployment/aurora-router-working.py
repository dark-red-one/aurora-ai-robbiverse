#!/usr/bin/env python3
"""
Aurora Town AI Router - Working Version
Just the Python file, no bash complexity
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import uvicorn
import httpx
import subprocess
import json

app = FastAPI(title="Aurora AI Router", version="1.0")

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
    """Health check"""
    gpu = "unknown"
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
            capture_output=True, text=True, timeout=2
        )
        if result.returncode == 0:
            gpu = result.stdout.strip()
    except:
        pass
    
    models = 0
    status = "unknown"
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get("http://localhost:11434/api/tags", timeout=2)
            if r.status_code == 200:
                data = r.json()
                models = len(data.get('models', []))
                status = "running"
    except:
        pass
    
    return {
        "status": "healthy",
        "gpu": gpu,
        "ollama": status,
        "models_loaded": models
    }

@app.post("/generate")
async def generate(req: GenerateRequest):
    """Generate text"""
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
    """Generate embeddings"""
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
    """List models"""
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
            "GET /health": "Health check",
            "POST /generate": "Generate text",
            "POST /embed": "Generate embeddings",
            "GET /models": "List models"
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

