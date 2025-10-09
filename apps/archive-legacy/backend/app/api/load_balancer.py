"""
API endpoints for smart load balancer
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
from app.services.smart_load_balancer import get_load_balancer

router = APIRouter(prefix="/api/v1/loadbalancer", tags=["loadbalancer"])


class GenerateRequest(BaseModel):
    model: str = "qwen2.5:7b"
    prompt: str
    stream: bool = False


@router.post("/generate")
async def generate_with_load_balancing(request: GenerateRequest) -> Dict:
    """Generate response using smart load balancing across all nodes"""
    try:
        lb = await get_load_balancer()
        result = await lb.generate(
            model=request.model,
            prompt=request.prompt,
            stream=request.stream
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_load_balancer_stats() -> Dict:
    """Get current load balancer statistics"""
    try:
        lb = await get_load_balancer()
        return lb.get_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/health-check")
async def trigger_health_check() -> Dict:
    """Manually trigger health check of all nodes"""
    try:
        lb = await get_load_balancer()
        await lb.check_all_nodes()
        return {"status": "health check completed", "stats": lb.get_stats()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
