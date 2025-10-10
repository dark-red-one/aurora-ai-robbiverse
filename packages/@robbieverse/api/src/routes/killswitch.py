"""
Killswitch API Routes
=====================
Emergency controls for internet blocking.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

from ..services.killswitch_manager import killswitch_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/code/api/killswitch", tags=["killswitch"])


# ============================================
# PYDANTIC MODELS
# ============================================

class KillswitchActivateRequest(BaseModel):
    reason: str
    activated_by: Optional[str] = "allan"
    

class KillswitchDeactivateRequest(BaseModel):
    deactivated_by: Optional[str] = "allan"


# ============================================
# ENDPOINTS
# ============================================

@router.post("/activate")
async def activate_killswitch(request: KillswitchActivateRequest):
    """
    Activate killswitch - block internet access for Robbie
    
    This will:
    - Block email sending
    - Block webhooks
    - Block external API calls
    - Allow local chat and GPU mesh
    - Set Robbie's mood to "blushing" (urgently fixing)
    """
    try:
        success = killswitch_manager.activate(
            reason=request.reason,
            activated_by=request.activated_by,
            auto_trigger="manual"
        )
        
        if success:
            return {
                "success": True,
                "message": "Killswitch activated successfully",
                "status": killswitch_manager.get_status(),
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to activate killswitch")
            
    except Exception as e:
        logger.error(f"Killswitch activation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/deactivate")
async def deactivate_killswitch(request: KillswitchDeactivateRequest):
    """
    Deactivate killswitch - restore internet access for Robbie
    
    This will:
    - Restore email sending
    - Restore webhooks
    - Restore external API calls
    - Restore Robbie's mood to focused
    """
    try:
        success = killswitch_manager.deactivate(
            deactivated_by=request.deactivated_by
        )
        
        if success:
            return {
                "success": True,
                "message": "Killswitch deactivated successfully",
                "status": killswitch_manager.get_status(),
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to deactivate killswitch")
            
    except Exception as e:
        logger.error(f"Killswitch deactivation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_killswitch_status():
    """
    Get current killswitch status
    
    Returns detailed information about:
    - Whether killswitch is active
    - When it was activated
    - Who activated it
    - What restrictions are in place
    - Recent activation history
    """
    try:
        status = killswitch_manager.get_status()
        
        return {
            "killswitch": status,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get killswitch status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/check/{action_type}")
async def check_action_allowed(action_type: str):
    """
    Check if a specific action is allowed under current killswitch state
    
    Args:
        action_type: Type of action (email_send, webhook_call, api_request, etc.)
        
    Returns:
        Whether the action is currently allowed
    """
    try:
        allowed = killswitch_manager.check_action_allowed(action_type)
        
        return {
            "action_type": action_type,
            "allowed": allowed,
            "killswitch_active": killswitch_manager.is_active(),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Action check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


