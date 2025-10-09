#!/usr/bin/env python3
"""
Cursor GPU Proxy - Routes requests to correct GPU based on model
Gives Cursor access to ALL models across both GPUs
"""

from fastapi import FastAPI, Request, Response
from fastapi.responses import StreamingResponse
import httpx
import json
import uvicorn

app = FastAPI()

# Model routing: which GPU has which model
GPU_ROUTES = {
    # Local GPU (Vengeance - localhost:11434) - Fast, always available
    "robbie:latest": "http://localhost:11434",
    "qwen2.5:7b": "http://localhost:11434",
    
    # Remote GPU (RunPod - localhost:8080) - Powerful, cloud models
    "deepseek-coder:33b-instruct": "http://localhost:8080",
    "codellama:13b-instruct": "http://localhost:8080",
    "deepseek-r1:7b": "http://localhost:8080",
    "qwen2.5-coder:7b": "http://localhost:8080",
}

# Smart fallback: try local first if remote is slow
ENABLE_SMART_FALLBACK = True

# Default to remote GPU (has better models)
DEFAULT_GPU = "http://localhost:8080"


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_all(path: str, request: Request):
    """Proxy all requests to the appropriate GPU"""
    
    # Determine target GPU
    target_url = DEFAULT_GPU
    
    # If it's a generation request, route based on model
    if path in ["api/generate", "api/chat", "v1/chat/completions", "v1/completions"]:
        try:
            body = await request.json()
            model = body.get("model", "")
            if model in GPU_ROUTES:
                target_url = GPU_ROUTES[model]
                print(f"🎯 Routing {model} -> {target_url}")
            else:
                print(f"⚠️  Unknown model {model}, using default: {DEFAULT_GPU}")
        except:
            pass
    
    # Build full URL
    full_url = f"{target_url}/{path}"
    
    # Forward the request
    async with httpx.AsyncClient(timeout=300.0) as client:
        # Prepare headers
        headers = dict(request.headers)
        headers.pop("host", None)  # Remove host header
        
        # Get body
        body = await request.body()
        
        # Make request
        try:
            response = await client.request(
                method=request.method,
                url=full_url,
                headers=headers,
                content=body,
                params=dict(request.query_params)
            )
            
            # Stream response if it's a streaming endpoint
            if "stream" in full_url or response.headers.get("content-type", "").startswith("text/event-stream"):
                async def stream_response():
                    async for chunk in response.aiter_bytes():
                        yield chunk
                
                return StreamingResponse(
                    stream_response(),
                    status_code=response.status_code,
                    headers=dict(response.headers)
                )
            
            # Return normal response
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
            
        except Exception as e:
            print(f"❌ Proxy error: {e}")
            return Response(
                content=json.dumps({"error": str(e)}),
                status_code=500,
                media_type="application/json"
            )


@app.get("/api/tags")
async def list_all_models():
    """Aggregate models from all GPUs"""
    all_models = []
    
    for gpu_url in set(GPU_ROUTES.values()):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{gpu_url}/api/tags")
                data = response.json()
                all_models.extend(data.get("models", []))
        except Exception as e:
            print(f"⚠️  Failed to get models from {gpu_url}: {e}")
    
    return {"models": all_models}


@app.get("/health")
async def health():
    """Health check endpoint"""
    status = {}
    
    for model, gpu_url in GPU_ROUTES.items():
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{gpu_url}/api/tags")
                status[gpu_url] = "✅ healthy"
        except:
            status[gpu_url] = "❌ offline"
    
    return status


if __name__ == "__main__":
    print("🚀 Starting Cursor GPU Proxy...")
    print(f"📡 Aggregating {len(GPU_ROUTES)} models across 2 GPUs")
    print("🎯 Cursor should connect to: http://localhost:11435")
    uvicorn.run(app, host="0.0.0.0", port=11435, log_level="info")

