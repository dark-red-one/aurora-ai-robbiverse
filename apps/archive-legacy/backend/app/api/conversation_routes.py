"""
Aurora RobbieVerse - Enhanced Conversation API Routes
Handles conversation context, rollback, and branching
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import uuid

from app.db.database import database
from app.services.conversation_context import ConversationContextManager
from app.services.ai.dual_llm_coordinator import DualLLMCoordinator
from app.websockets.conversation_ws import conversation_ws_manager

router = APIRouter(prefix="/conversations", tags=["conversations"])

# Initialize services
context_manager = ConversationContextManager()
dual_llm = DualLLMCoordinator()

# Pydantic models for request/response
class MessageRequest(BaseModel):
    content: str
    role: str = "user"
    metadata: Optional[Dict[str, Any]] = None

class ConversationCreateRequest(BaseModel):
    title: Optional[str] = None
    user_id: str = "default"
    context_window_size: int = 10

class BranchCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    branch_point_message_id: str

class RollbackRequest(BaseModel):
    message_id: str
    reason: str = "User rollback"

@router.post("/")
async def create_conversation(request: ConversationCreateRequest):
    """Create a new conversation"""
    conversation_id = str(uuid.uuid4())
    
    query = """
    INSERT INTO conversations (
        id, user_id, title, context_window_size, created_at, updated_at
    ) VALUES (
        :id, :user_id, :title, :context_window_size, :created_at, :updated_at
    )
    """
    
    await database.execute(query, {
        "id": conversation_id,
        "user_id": request.user_id,
        "title": request.title,
        "context_window_size": request.context_window_size,
        "created_at": "now()",
        "updated_at": "now()"
    })
    
    return {
        "conversation_id": conversation_id,
        "title": request.title,
        "user_id": request.user_id,
        "context_window_size": request.context_window_size
    }

@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str, include_deleted: bool = False):
    """Get conversation with context"""
    try:
        context = await context_manager.get_conversation_context(
            conversation_id, 
            include_deleted=include_deleted
        )
        return context
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{conversation_id}/messages")
async def add_message(
    conversation_id: str, 
    request: MessageRequest,
    branch_id: Optional[str] = None
):
    """Add a message to conversation"""
    try:
        message_id = await context_manager.add_message(
            conversation_id=conversation_id,
            role=request.role,
            content=request.content,
            branch_id=branch_id,
            metadata=request.metadata
        )
        
        return {
            "message_id": message_id,
            "conversation_id": conversation_id,
            "role": request.role,
            "content": request.content,
            "timestamp": "now()"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{conversation_id}/chat")
async def chat_with_context(
    conversation_id: str,
    message: str,
    client_id: str = "anonymous",
    use_context: bool = True,
    context_window: Optional[int] = None
):
    """Chat with conversation context"""
    try:
        # Get conversation context if requested
        context_data = {}
        if use_context:
            context = await context_manager.get_conversation_context(
                conversation_id, 
                context_window or 10
            )
            context_data = {
                "conversation_history": context["messages"],
                "conversation_metadata": context["conversation"]
            }
        
        # Process through dual LLM system
        result = await dual_llm.process_user_message(
            message, 
            client_id, 
            context_data
        )
        
        # Add user message to conversation
        user_message_id = await context_manager.add_message(
            conversation_id=conversation_id,
            role="user",
            content=message,
            metadata={"client_id": client_id}
        )
        
        # Add AI response to conversation
        ai_message_id = await context_manager.add_message(
            conversation_id=conversation_id,
            role="assistant",
            content=result["response"],
            metadata={
                "source": result["source"],
                "safety_status": result["safety_status"],
                "confidence": result.get("robbie_confidence", 0.8),
                "processing_time_ms": result["processing_time_ms"]
            },
            model_used=result.get("model_used", "dual_llm")
        )
        
        # Broadcast WebSocket events
        await conversation_ws_manager.handle_message_added(conversation_id, {
            "id": user_message_id,
            "role": "user",
            "content": message,
            "created_at": "now()"
        })
        await conversation_ws_manager.handle_message_added(conversation_id, {
            "id": ai_message_id,
            "role": "assistant",
            "content": result["response"],
            "created_at": "now()"
        })
        
        return {
            "response": result["response"],
            "conversation_id": conversation_id,
            "user_message_id": user_message_id,
            "ai_message_id": ai_message_id,
            "source": result["source"],
            "safety_status": result["safety_status"],
            "confidence": result.get("robbie_confidence", 0.8),
            "processing_time_ms": result["processing_time_ms"],
            "context_used": use_context,
            "context_window": context_window or 10
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{conversation_id}/rollback")
async def rollback_message(conversation_id: str, request: RollbackRequest):
    """Rollback (soft delete) a message"""
    try:
        success = await context_manager.rollback_message(
            request.message_id, 
            request.reason
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Broadcast WebSocket event
        await conversation_ws_manager.handle_message_rolled_back(
            conversation_id, 
            request.message_id, 
            request.reason
        )
        
        return {
            "message_id": request.message_id,
            "rolled_back": True,
            "reason": request.reason,
            "timestamp": "now()"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{conversation_id}/restore")
async def restore_message(conversation_id: str, message_id: str):
    """Restore a previously rolled back message"""
    try:
        success = await context_manager.restore_message(message_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Message not found or not deleted")
        
        # Broadcast WebSocket event
        await conversation_ws_manager.handle_message_restored(conversation_id, message_id)
        
        return {
            "message_id": message_id,
            "restored": True,
            "timestamp": "now()"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{conversation_id}/rollback-history")
async def get_rollback_history(conversation_id: str):
    """Get rollback history for conversation"""
    try:
        history = await context_manager.get_rollback_history(conversation_id)
        return {
            "conversation_id": conversation_id,
            "rollback_history": history,
            "total_rolled_back": len(history)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{conversation_id}/branches")
async def create_branch(conversation_id: str, request: BranchCreateRequest):
    """Create a new conversation branch"""
    try:
        branch_id = await context_manager.create_conversation_branch(
            conversation_id=conversation_id,
            branch_point_message_id=request.branch_point_message_id,
            name=request.name,
            description=request.description
        )
        
        # Broadcast WebSocket event
        await conversation_ws_manager.handle_branch_created(conversation_id, {
            "id": branch_id,
            "name": request.name,
            "description": request.description,
            "branch_point_message_id": request.branch_point_message_id,
            "created_at": "now()"
        })
        
        return {
            "branch_id": branch_id,
            "conversation_id": conversation_id,
            "name": request.name,
            "description": request.description,
            "branch_point_message_id": request.branch_point_message_id,
            "created_at": "now()"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{conversation_id}/branches")
async def get_conversation_branches(conversation_id: str):
    """Get all branches for a conversation"""
    try:
        branches = await context_manager.get_conversation_branches(conversation_id)
        return {
            "conversation_id": conversation_id,
            "branches": branches,
            "total_branches": len(branches)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{conversation_id}/branches/{branch_id}/switch")
async def switch_to_branch(conversation_id: str, branch_id: str):
    """Switch conversation to a specific branch"""
    try:
        success = await context_manager.switch_to_branch(conversation_id, branch_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Branch not found")
        
        # Broadcast WebSocket event
        await conversation_ws_manager.handle_branch_switched(conversation_id, branch_id)
        
        return {
            "conversation_id": conversation_id,
            "branch_id": branch_id,
            "switched": True,
            "timestamp": "now()"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{conversation_id}/compress")
async def compress_conversation(conversation_id: str):
    """Compress long conversation context"""
    try:
        result = await context_manager.compress_conversation_context(conversation_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{conversation_id}/context")
async def get_context_summary(conversation_id: str, window_size: int = 10):
    """Get conversation context summary"""
    try:
        context = await context_manager.get_conversation_context(
            conversation_id, 
            context_window=window_size
        )
        
        # Calculate context statistics
        messages = context["messages"]
        total_tokens = sum(msg.get("token_count", 0) for msg in messages)
        
        return {
            "conversation_id": conversation_id,
            "context_window": window_size,
            "message_count": len(messages),
            "total_tokens": total_tokens,
            "context_compressed": context["context_compressed"],
            "active_branch": context["active_branch"],
            "messages": messages
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str, permanent: bool = False):
    """Delete a conversation (soft delete by default)"""
    try:
        if permanent:
            # Hard delete - remove all related data
            queries = [
                "DELETE FROM messages WHERE conversation_id = :conversation_id",
                "DELETE FROM conversation_branches WHERE conversation_id = :conversation_id",
                "DELETE FROM context_snapshots WHERE conversation_id = :conversation_id",
                "DELETE FROM conversations WHERE id = :conversation_id"
            ]
            
            for query in queries:
                await database.execute(query, {"conversation_id": conversation_id})
        else:
            # Soft delete - mark as archived
            query = "UPDATE conversations SET is_archived = true WHERE id = :conversation_id"
            await database.execute(query, {"conversation_id": conversation_id})
        
        return {
            "conversation_id": conversation_id,
            "deleted": True,
            "permanent": permanent,
            "timestamp": "now()"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
