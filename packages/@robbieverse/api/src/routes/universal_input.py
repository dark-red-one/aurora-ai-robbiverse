"""
Universal Input API
===================
Single endpoint for ALL AI requests from any source.
Handles chat, embeddings, images, code - everything goes through here.
"""

import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
import logging

from ..ai.gatekeeper_fast import gatekeeper
from ..ai.service_router import ai_router
from ..ai.personality_prompts import personality_prompt_builder
from ..ai.mood_analyzer import mood_analyzer
from ..services.universal_logger import universal_logger
from ..services.vector_search import vector_search_service
from ..services.killswitch_manager import killswitch_manager
from ..services.personality_state_manager import personality_state_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v2/universal", tags=["universal"])


# ============================================
# PYDANTIC MODELS
# ============================================

class SourceMetadata(BaseModel):
    sender: Optional[str] = None
    timestamp: Optional[str] = None
    platform: Optional[str] = None
    extra: Optional[Dict[str, Any]] = {}


class RequestPayload(BaseModel):
    input: str = Field(..., description="User input or data")
    context: Optional[List[Dict[str, Any]]] = Field(default=None, description="Optional pre-fetched context")
    parameters: Optional[Dict[str, Any]] = Field(default={}, description="Service-specific parameters")


class UniversalAIRequest(BaseModel):
    request_id: Optional[str] = Field(default=None, description="Optional request ID (auto-generated if not provided)")
    source: str = Field(..., description="Source of request (email, sms, chat, web_form, linkedin, elesti, api, etc.)")
    source_metadata: Optional[SourceMetadata] = Field(default=None)
    ai_service: str = Field(..., description="AI service type (chat, embedding, image, code, analysis)")
    payload: RequestPayload
    user_id: Optional[str] = Field(default="allan")
    fetch_context: Optional[bool] = Field(default=True, description="Whether to fetch vector context automatically")


class GatekeeperReview(BaseModel):
    approved: bool
    confidence: float
    reasoning: str
    warnings: List[str]


class RobbieResponse(BaseModel):
    mood: str
    message: str
    sticky_notes: List[Dict[str, Any]]
    personality_changes: Dict[str, Any]
    actions: List[Dict[str, Any]]


class UniversalAIResponse(BaseModel):
    request_id: str
    status: str  # approved, rejected, revised, blocked
    robbie_response: Optional[RobbieResponse] = None
    gatekeeper_review: GatekeeperReview
    processing_time_ms: int
    timestamp: str


# ============================================
# MAIN ENDPOINT
# ============================================

@router.post("/request", response_model=UniversalAIResponse)
async def universal_ai_request(
    request: UniversalAIRequest,
    x_api_key: Optional[str] = Header(None)
) -> UniversalAIResponse:
    """
    Universal AI Input API
    
    Handles ALL AI requests from any source.
    - Pre-flight gatekeeper check
    - Vector context retrieval
    - AI service routing
    - Post-flight gatekeeper check
    - Comprehensive logging
    
    Example request:
    ```json
    {
      "source": "email",
      "source_metadata": {
        "sender": "customer@example.com",
        "timestamp": "2025-10-10T12:00:00Z",
        "platform": "gmail"
      },
      "ai_service": "chat",
      "payload": {
        "input": "What's the pricing for TestPilot?",
        "parameters": {"temperature": 0.7}
      }
    }
    ```
    """
    start_time = datetime.now()
    
    # Generate request ID if not provided
    request_id = request.request_id or str(uuid.uuid4())
    
    # Check killswitch
    if killswitch_manager.is_active():
        logger.warning(f"🔴 Request blocked by active killswitch: {request_id}")
        return UniversalAIResponse(
            request_id=request_id,
            status="blocked",
            gatekeeper_review=GatekeeperReview(
                approved=False,
                confidence=1.0,
                reasoning="Killswitch is active - internet access blocked",
                warnings=["System is in emergency lockdown mode"]
            ),
            processing_time_ms=int((datetime.now() - start_time).total_seconds() * 1000),
            timestamp=datetime.now().isoformat()
        )
    
    # Log incoming request
    universal_logger.log_request(
        request_id=request_id,
        source=request.source,
        ai_service=request.ai_service,
        input_summary=request.payload.input[:200],  # Safe summary
        source_metadata=request.source_metadata.dict() if request.source_metadata else {},
        user_id=request.user_id
    )
    
    try:
        # STEP 0: Get current personality/mood state (BEFORE everything else!)
        logger.info(f"[{request_id}] Checking personality state for {request.user_id}...")
        personality = await personality_state_manager.get_current_state(request.user_id)
        current_mood = personality['current_mood']
        attraction = personality['attraction_level']
        gandhi_genghis = personality['gandhi_genghis_level']
        
        logger.info(f"[{request_id}] Personality: mood={current_mood}, attraction={attraction}, g-g={gandhi_genghis}")
        
        # STEP 1: Pre-flight gatekeeper check
        logger.info(f"[{request_id}] Pre-flight check starting...")
        pre_flight = await gatekeeper.pre_flight_check(
            request_id=request_id,
            source=request.source,
            ai_service=request.ai_service,
            payload=request.payload.dict(),
            user_id=request.user_id
        )
        
        if not pre_flight['approved']:
            # Log the block
            universal_logger.log_gatekeeper_block(
                request_id=request_id,
                block_reason=pre_flight['reasoning'],
                block_category=pre_flight.get('block_reason', 'other'),
                severity='high' if pre_flight.get('requires_killswitch') else 'medium',
                source=request.source,
                input_pattern=request.payload.input[:100],
                triggered_killswitch=pre_flight.get('requires_killswitch', False),
                user_id=request.user_id
            )
            
            # Activate killswitch if needed
            if pre_flight.get('requires_killswitch'):
                killswitch_manager.activate(
                    reason=pre_flight['reasoning'],
                    activated_by="gatekeeper",
                    auto_trigger=pre_flight.get('block_reason')
                )
            
            return UniversalAIResponse(
                request_id=request_id,
                status="rejected",
                gatekeeper_review=GatekeeperReview(
                    approved=False,
                    confidence=pre_flight['confidence'],
                    reasoning=pre_flight['reasoning'],
                    warnings=pre_flight['warnings']
                ),
                processing_time_ms=int((datetime.now() - start_time).total_seconds() * 1000),
                timestamp=datetime.now().isoformat()
            )
        
        # STEP 2: Fetch vector context if requested
        context = request.payload.context or []
        
        if request.fetch_context and not context and request.ai_service in ['chat', 'analysis', 'code']:
            logger.info(f"[{request_id}] Fetching vector context...")
            
            # First get embedding for the input
            embedding_response = await ai_router.route_request(
                'embedding',
                {'input': request.payload.input}
            )
            
            if embedding_response.get('success') and embedding_response.get('embedding'):
                # Search for similar content
                context_results = await vector_search_service.get_context_for_request(
                    query_embedding=embedding_response['embedding'],
                    source=request.source,
                    max_results=5
                )
                context = context_results.get('context_items', [])
                logger.info(f"[{request_id}] Found {len(context)} context items")
        
        # STEP 3: Build personality-aware system prompt
        logger.info(f"[{request_id}] Building personality-aware prompt...")
        personality_prompt = personality_prompt_builder.build_system_prompt(
            mood=current_mood,
            attraction=attraction,
            gandhi_genghis=gandhi_genghis,
            context=request.source
        )
        
        # STEP 4: Route to AI service with personality
        logger.info(f"[{request_id}] Routing to {request.ai_service} service with personality...")
        ai_response = await ai_router.route_request(
            ai_service=request.ai_service,
            payload=request.payload.dict(),
            context=context,
            personality_prompt=personality_prompt  # NEW: Inject personality
        )
        
        if not ai_response.get('success'):
            raise Exception(f"AI service failed: {ai_response.get('error')}")
        
        # STEP 5: Post-flight gatekeeper check
        logger.info(f"[{request_id}] Post-flight check starting...")
        
        # Extract actions from AI response (if any)
        actions = []
        
        post_flight = await gatekeeper.post_flight_check(
            request_id=request_id,
            ai_service=request.ai_service,
            response=ai_response,
            actions=actions
        )
        
        # STEP 6: Check if mood should update based on interaction
        logger.info(f"[{request_id}] Checking if mood should update...")
        new_mood = await mood_analyzer.should_update_mood(
            user_input=request.payload.input,
            ai_response=ai_response,
            current_mood=current_mood,
            interaction_type=request.source
        )
        
        personality_changes = {}
        if new_mood and new_mood != current_mood:
            logger.info(f"[{request_id}] Mood changing: {current_mood} → {new_mood}")
            await personality_state_manager.update_mood(
                user_id=request.user_id,
                new_mood=new_mood,
                reason=f"interaction_triggered_{request.source}"
            )
            personality_changes['mood'] = {
                'from': current_mood,
                'to': new_mood,
                'reason': 'interaction_based'
            }
            current_mood = new_mood  # Use new mood in response
        
        # STEP 7: Build response
        robbie_response = RobbieResponse(
            mood=current_mood,  # ✅ Real mood from DB (possibly updated)
            message=ai_response.get('message') or ai_response.get('code') or ai_response.get('analysis', ''),
            sticky_notes=[],  # TODO: Extract sticky notes
            personality_changes=personality_changes,  # ✅ Track mood changes
            actions=post_flight['allowed_actions']
        )
        
        final_status = "approved" if post_flight['approved'] else "revised"
        
        # STEP 8: Log response
        universal_logger.log_response(
            request_id=request_id,
            output_summary=robbie_response.message[:200],
            gatekeeper_status=final_status,
            gatekeeper_confidence=post_flight['confidence'],
            gatekeeper_reasoning=post_flight['reasoning'],
            processing_time_ms=int((datetime.now() - start_time).total_seconds() * 1000),
            ai_model=ai_response.get('model'),
            tokens_used=ai_response.get('tokens_used')
        )
        
        return UniversalAIResponse(
            request_id=request_id,
            status=final_status,
            robbie_response=robbie_response,
            gatekeeper_review=GatekeeperReview(
                approved=post_flight['approved'],
                confidence=post_flight['confidence'],
                reasoning=post_flight['reasoning'],
                warnings=[]
            ),
            processing_time_ms=int((datetime.now() - start_time).total_seconds() * 1000),
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"[{request_id}] Universal AI request failed: {e}", exc_info=True)
        
        # Log error
        universal_logger.log_response(
            request_id=request_id,
            output_summary=f"Error: {str(e)}",
            gatekeeper_status="error",
            gatekeeper_confidence=0.0,
            gatekeeper_reasoning=f"Processing failed: {str(e)}",
            processing_time_ms=int((datetime.now() - start_time).total_seconds() * 1000)
        )
        
        raise HTTPException(status_code=500, detail=f"AI request failed: {str(e)}")


# ============================================
# HELPER ENDPOINTS
# ============================================

@router.get("/health")
async def health_check():
    """Health check for universal input API"""
    return {
        "status": "healthy",
        "killswitch_active": killswitch_manager.is_active(),
        "services": {
            "gatekeeper": "operational",
            "ai_router": "operational",
            "vector_search": "operational",
            "logger": "operational"
        },
        "timestamp": datetime.now().isoformat()
    }


@router.get("/stats")
async def get_stats():
    """Get stats about recent requests"""
    try:
        recent_blocks = universal_logger.get_recent_blocks(limit=10)
        
        return {
            "recent_blocks": recent_blocks,
            "killswitch_status": killswitch_manager.get_status(),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


