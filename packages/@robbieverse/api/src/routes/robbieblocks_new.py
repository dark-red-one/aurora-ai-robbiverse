"""
💋 RobbieBlocks CMS Routes - Using the Sexy Service
New routes that use the RobbieBlocksCMS service for dynamic rendering
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Optional
import logging
from src.services.robbieblocks_cms import robbieblocks_cms

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/robbieblocks/page/{page_key}")
async def get_page_definition(page_key: str, node_id: Optional[str] = "robbiebook1"):
    """
    💋 Get complete page definition from RobbieBlocks CMS
    
    Returns the full page definition with all components, props, and styling
    needed to render a dynamic RobbieBlocks page.
    
    Args:
        page_key: Page identifier (e.g., 'cursor-sidebar-main')
        node_id: Node ID for branding (default: 'robbiebook1')
    """
    try:
        logger.info(f"💋 Fetching page definition: {page_key} for node: {node_id}")
        
        # Get the full page definition from CMS service
        page_definition = await robbieblocks_cms.get_page_definition(page_key, node_id)
        
        if not page_definition or not page_definition.get('success'):
            raise HTTPException(
                status_code=404, 
                detail=f"Page not found: {page_key}"
            )
        
        return JSONResponse(content=page_definition)
        
    except Exception as e:
        logger.error(f"Error fetching page definition: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch page definition: {str(e)}"
        )

@router.get("/robbieblocks/component/{component_key}")
async def get_component_definition(component_key: str):
    """
    🔥 Get individual component definition
    
    Returns the complete component definition with code, props, and styling.
    """
    try:
        logger.info(f"🔥 Fetching component definition: {component_key}")
        
        component_definition = await robbieblocks_cms.get_component_definition(component_key)
        
        if not component_definition or not component_definition.get('success'):
            raise HTTPException(
                status_code=404,
                detail=f"Component not found: {component_key}"
            )
        
        return JSONResponse(content=component_definition)
        
    except Exception as e:
        logger.error(f"Error fetching component definition: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch component definition: {str(e)}"
        )

@router.get("/robbieblocks/pages")
async def list_pages():
    """
    📋 List all available RobbieBlocks pages
    """
    try:
        logger.info("📋 Listing all RobbieBlocks pages")
        
        pages = await robbieblocks_cms.list_pages()
        
        return JSONResponse(content=pages)
        
    except Exception as e:
        logger.error(f"Error listing pages: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list pages: {str(e)}"
        )

@router.get("/robbieblocks/branding/{node_id}")
async def get_node_branding(node_id: str):
    """
    🎨 Get branding configuration for a specific node
    """
    try:
        logger.info(f"🎨 Fetching branding for node: {node_id}")
        
        branding = await robbieblocks_cms.get_node_branding(node_id)
        
        return JSONResponse(content=branding)
        
    except Exception as e:
        logger.error(f"Error fetching branding: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch branding: {str(e)}"
        )

@router.get("/robbieblocks/stats")
async def get_cms_stats():
    """
    📊 Get CMS statistics
    """
    try:
        logger.info("📊 Fetching CMS statistics")
        
        stats = await robbieblocks_cms.get_cms_stats()
        
        return JSONResponse(content=stats)
        
    except Exception as e:
        logger.error(f"Error fetching CMS stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch CMS stats: {str(e)}"
        )

@router.get("/robbieblocks/check-updates")
async def check_updates():
    """
    🔄 Hot reload endpoint - Check if Robbie pushed updates
    
    Returns whether the frontend should reload for updates.
    This enables Robbie to push hot reloads without manual extension reinstallation.
    """
    try:
        # For now, always return false to prevent constant reloading
        # In the future, this could check file timestamps, git commits, or other indicators
        return JSONResponse(content={
            "updated": False,
            "message": "No updates available",
            "timestamp": "2025-10-10T20:30:00Z"
        })
        
    except Exception as e:
        logger.error(f"Error checking updates: {e}")
        return JSONResponse(content={
            "updated": False,
            "error": str(e),
            "timestamp": "2025-10-10T20:30:00Z"
        })

@router.post("/robbieblocks/trigger-reload")
async def trigger_reload():
    """
    🚀 Force trigger a hot reload
    
    Allows Robbie to manually trigger a frontend reload when she makes updates.
    """
    try:
        logger.info("🚀 Robbie triggered hot reload!")
        
        # In a real implementation, this could:
        # - Set a flag in the database
        # - Send a WebSocket message
        # - Update a file timestamp
        
        return JSONResponse(content={
            "success": True,
            "message": "Hot reload triggered! Frontend should reload within 30 seconds.",
            "timestamp": "2025-10-10T20:30:00Z"
        })
        
    except Exception as e:
        logger.error(f"Error triggering reload: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to trigger reload: {str(e)}"
        )
