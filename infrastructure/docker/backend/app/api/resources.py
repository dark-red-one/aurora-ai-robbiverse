"""
API endpoints for resource orchestrator
"""

from fastapi import APIRouter, HTTPException
from typing import Dict
from app.services.resource_orchestrator import get_orchestrator, get_current_resource_info

router = APIRouter(prefix="/api/v1/resources", tags=["resources"])


@router.get("/status")
async def get_resource_status() -> Dict:
    """Get current resource status and info"""
    try:
        return await get_current_resource_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/discover")
async def trigger_discovery() -> Dict:
    """Manually trigger resource discovery"""
    try:
        orchestrator = await get_orchestrator()
        await orchestrator.discover_resources()
        return await get_current_resource_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nodes")
async def list_nodes() -> Dict:
    """List all configured nodes and their status"""
    try:
        orchestrator = await get_orchestrator()
        nodes = {}
        for name, node in orchestrator.nodes.items():
            nodes[name] = {
                'name': node.name,
                'priority': node.priority,
                'status': node.status,
                'latency': node.latency,
                'capabilities': node.capabilities,
                'gpu_available': node.gpu_available,
                'gpu_name': node.gpu_name,
                'last_check': node.last_check.isoformat() if node.last_check else None
            }
        return {'nodes': nodes, 'current': orchestrator.current_node.name if orchestrator.current_node else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
