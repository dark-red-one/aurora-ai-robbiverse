#!/usr/bin/env python3
"""
Aurora Town AI Router API
==========================
FastAPI wrapper for the AI Router service running on Aurora Town GPU server.

Endpoints:
- GET  /health      - Health check with GPU status
- POST /generate    - Generate text using best available model
- POST /embed       - Generate embeddings
- GET  /models      - List available models
- GET  /stats       - Get performance statistics
"""

import os
import sys
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import uvicorn
import subprocess
import json

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from packages.robbieverseapi.src.services.ai_router import get_router, AIRouterService

app = FastAPI(
    title="Aurora Town AI Router",
    description="GPU-powered AI routing with intelligent fallback",
    version="1.0.0"
)

# Initialize router
router = get_router()


class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="User prompt")
    system_prompt: Optional[str] = Field(None, description="Optional system prompt")
    model: Optional[str] = Field(None, description="Specific model to use (optional)")
    request_type: str = Field("general", description="Type of request: general, code, analysis, creative")
    require_premium: bool = Field(False, description="Force use of premium models")
    max_tokens: int = Field(1024, description="Maximum tokens to generate")
    max_response_time: Optional[float] = Field(None, description="Max acceptable response time in seconds")


class EmbedRequest(BaseModel):
    text: str = Field(..., description="Text to embed")
    model: Optional[str] = Field("nomic-embed-text", description="Embedding model to use")


class GenerateResponse(BaseModel):
    content: str
    model: str
    model_name: str
    tier: str
    response_time: float
    token_speed: float
    attempts: List[Dict[str, Any]]
    success: bool


@app.get("/health")
async def health_check():
    """Health check endpoint with GPU status"""
    try:
        # Check GPU
        gpu_status = "unknown"
        gpu_name = "unknown"
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
                capture_output=True,
                text=True,
                timeout=2
            )
            if result.returncode == 0:
                gpu_name = result.stdout.strip()
                gpu_status = "available"
        except:
            gpu_status = "not_available"
        
        # Check Ollama
        ollama_status = "unknown"
        models_loaded = 0
        try:
            result = subprocess.run(
                ["curl", "-s", "http://localhost:11434/api/tags"],
                capture_output=True,
                text=True,
                timeout=2
            )
            if result.returncode == 0:
                data = json.loads(result.stdout)
                models_loaded = len(data.get('models', []))
                ollama_status = "running"
        except:
            ollama_status = "not_running"
        
        # Get router stats
        stats = router.get_stats()
        
        return {
            "status": "healthy",
            "gpu": gpu_name,
            "gpu_status": gpu_status,
            "ollama": ollama_status,
            "models_loaded": models_loaded,
            "endpoints_healthy": stats['health_summary']['healthy'],
            "endpoints_total": stats['health_summary']['total'],
            "total_requests": stats['total_requests']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


@app.post("/generate", response_model=GenerateResponse)
async def generate_text(request: GenerateRequest):
    """Generate text using the best available model"""
    try:
        result = await router.generate(
            prompt=request.prompt,
            system_prompt=request.system_prompt,
            request_type=request.request_type,
            require_premium=request.require_premium,
            max_response_time=request.max_response_time
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.post("/embed")
async def generate_embedding(request: EmbedRequest):
    """Generate embeddings using Ollama"""
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:11434/api/embeddings",
                json={
                    "model": request.model,
                    "prompt": request.text
                },
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            return {
                "embedding": result.get('embedding', []),
                "model": request.model,
                "dimension": len(result.get('embedding', []))
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")


@app.get("/models")
async def list_models():
    """List all available models"""
    try:
        # Get Ollama models
        ollama_models = []
        try:
            result = subprocess.run(
                ["curl", "-s", "http://localhost:11434/api/tags"],
                capture_output=True,
                text=True,
                timeout=2
            )
            if result.returncode == 0:
                data = json.loads(result.stdout)
                ollama_models = [
                    {
                        "name": model['name'],
                        "size": model.get('size', 0),
                        "modified": model.get('modified_at', '')
                    }
                    for model in data.get('models', [])
                ]
        except:
            pass
        
        # Get router endpoints
        stats = router.get_stats()
        endpoints = stats['endpoints']
        
        return {
            "ollama_models": ollama_models,
            "router_endpoints": endpoints,
            "total_models": len(ollama_models),
            "total_endpoints": len(endpoints)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")


@app.get("/stats")
async def get_statistics():
    """Get detailed performance statistics"""
    try:
        return router.get_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "service": "Aurora Town AI Router",
        "version": "1.0.0",
        "gpu": "RTX 4090",
        "endpoints": {
            "/health": "Health check with GPU status",
            "/generate": "Generate text using best available model",
            "/embed": "Generate embeddings",
            "/models": "List available models",
            "/stats": "Get performance statistics"
        },
        "docs": "/docs"
    }


if __name__ == "__main__":
    # Run with uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )

