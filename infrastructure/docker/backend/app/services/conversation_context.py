"""
Aurora RobbieVerse - Conversation Context Manager
Handles conversation context, rollback, and branching functionality
"""
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy import select, and_, or_, desc, func
from sqlalchemy.orm import selectinload
import json
import uuid

from app.db.database import database
from app.models.conversation import Conversation, Message, ConversationBranch, ContextSnapshot

class ConversationContextManager:
    """Manages conversation context, rollback, and branching"""
    
    def __init__(self, default_context_window: int = 10):
        self.default_context_window = default_context_window
        self.max_context_tokens = 4000  # Approximate token limit for context
        self.compression_threshold = 20  # Messages before compression kicks in
    
    async def get_conversation_context(
        self, 
        conversation_id: str, 
        context_window: Optional[int] = None,
        include_deleted: bool = False
    ) -> Dict[str, Any]:
        """Get conversation context with intelligent message selection"""
        
        context_window = context_window or self.default_context_window
        
        # Get conversation details
        conv_query = select(Conversation).where(Conversation.id == conversation_id)
        conversation = await database.fetch_one(conv_query)
        
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")
        
        # Get recent messages with context prioritization
        messages_query = select(Message).where(
            and_(
                Message.conversation_id == conversation_id,
                Message.is_deleted == False if not include_deleted else True
            )
        ).order_by(Message.created_at.desc()).limit(context_window * 2)
        
        messages = await database.fetch_all(messages_query)
        
        # Apply intelligent context selection
        context_messages = self._select_context_messages(messages, context_window)
        
        # Get active branch if exists
        branch_query = select(ConversationBranch).where(
            and_(
                ConversationBranch.conversation_id == conversation_id,
                ConversationBranch.is_active == True
            )
        )
        active_branch = await database.fetch_one(branch_query)
        
        return {
            "conversation": dict(conversation),
            "messages": [dict(msg) for msg in context_messages],
            "active_branch": dict(active_branch) if active_branch else None,
            "context_window": context_window,
            "total_messages": len(messages),
            "context_compressed": len(messages) > self.compression_threshold
        }
    
    def _select_context_messages(self, messages: List, context_window: int) -> List:
        """Intelligently select messages for context based on importance and recency"""
        
        # Sort by importance score (combination of recency and importance)
        scored_messages = []
        now = datetime.utcnow()
        for msg in messages:
            # Calculate importance score (1-10)
            # Handle timezone-aware datetimes
            msg_time = msg.created_at
            if msg_time.tzinfo is not None:
                msg_time = msg_time.replace(tzinfo=None)
            
            recency_score = min(10, max(1, 10 - (now - msg_time).days))
            importance_score = getattr(msg, 'context_importance', 5)
            
            # Weighted score: 70% recency, 30% importance
            total_score = (recency_score * 0.7) + (importance_score * 0.3)
            
            scored_messages.append((total_score, msg))
        
        # Sort by score and take top messages
        scored_messages.sort(key=lambda x: x[0], reverse=True)
        selected_messages = [msg for score, msg in scored_messages[:context_window]]
        
        # Sort selected messages by creation time for proper context order
        selected_messages.sort(key=lambda x: x.created_at)
        
        return selected_messages
    
    async def add_message(
        self, 
        conversation_id: str, 
        role: str, 
        content: str, 
        branch_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        token_count: Optional[int] = None,
        model_used: Optional[str] = None
    ) -> str:
        """Add a new message to conversation"""
        
        message_id = str(uuid.uuid4())
        
        # Calculate context importance based on content
        importance = self._calculate_message_importance(content, role)
        
        insert_query = """
        INSERT INTO messages (
            id, conversation_id, branch_id, role, content, 
            metadata, token_count, model_used, context_importance, created_at
        ) VALUES (
            :id, :conversation_id, :branch_id, :role, :content,
            :metadata, :token_count, :model_used, :importance, :created_at
        )
        """
        
        await database.execute(insert_query, {
            "id": message_id,
            "conversation_id": conversation_id,
            "branch_id": branch_id,
            "role": role,
            "content": content,
            "metadata": json.dumps(metadata or {}),
            "token_count": token_count or 0,
            "model_used": model_used,
            "importance": importance,
            "created_at": datetime.utcnow()
        })
        
        # Update conversation timestamp
        await self._update_conversation_timestamp(conversation_id)
        
        return message_id
    
    def _calculate_message_importance(self, content: str, role: str) -> int:
        """Calculate message importance for context prioritization"""
        base_importance = 5
        
        # System and gatekeeper messages are more important
        if role in ['system', 'gatekeeper']:
            base_importance += 3
        
        # Longer messages might be more important
        if len(content) > 200:
            base_importance += 1
        
        # Messages with questions or specific requests
        if '?' in content or any(word in content.lower() for word in ['help', 'explain', 'how', 'what', 'why']):
            base_importance += 2
        
        return min(10, max(1, base_importance))
    
    async def rollback_message(self, message_id: str, reason: str = "User rollback") -> bool:
        """Rollback (soft delete) a message"""
        
        update_query = """
        UPDATE messages 
        SET is_deleted = true, deleted_at = :deleted_at, deleted_reason = :reason
        WHERE id = :message_id
        """
        
        await database.execute(update_query, {
            "message_id": message_id,
            "deleted_at": datetime.utcnow(),
            "reason": reason
        })
        
        # Check if the message was actually updated
        check_query = "SELECT is_deleted FROM messages WHERE id = :message_id"
        result = await database.fetch_one(check_query, {"message_id": message_id})
        return result and result["is_deleted"]
    
    async def restore_message(self, message_id: str) -> bool:
        """Restore a previously rolled back message"""
        
        update_query = """
        UPDATE messages 
        SET is_deleted = false, deleted_at = NULL, deleted_reason = NULL
        WHERE id = :message_id
        """
        
        await database.execute(update_query, {
            "message_id": message_id
        })
        
        # Check if the message was actually updated
        check_query = "SELECT is_deleted FROM messages WHERE id = :message_id"
        result = await database.fetch_one(check_query, {"message_id": message_id})
        return result and not result["is_deleted"]
    
    async def create_conversation_branch(
        self, 
        conversation_id: str, 
        branch_point_message_id: str,
        name: str,
        description: Optional[str] = None
    ) -> str:
        """Create a new conversation branch from a specific message"""
        
        branch_id = str(uuid.uuid4())
        
        insert_query = """
        INSERT INTO conversation_branches (
            id, conversation_id, branch_point_message_id, name, description, created_at
        ) VALUES (
            :id, :conversation_id, :branch_point_message_id, :name, :description, :created_at
        )
        """
        
        await database.execute(insert_query, {
            "id": branch_id,
            "conversation_id": conversation_id,
            "branch_point_message_id": branch_point_message_id,
            "name": name,
            "description": description,
            "created_at": datetime.utcnow()
        })
        
        return branch_id
    
    async def switch_to_branch(self, conversation_id: str, branch_id: str) -> bool:
        """Switch conversation to a specific branch"""
        
        # Deactivate current branch
        deactivate_query = """
        UPDATE conversation_branches 
        SET is_active = false 
        WHERE conversation_id = :conversation_id AND is_active = true
        """
        await database.execute(deactivate_query, {"conversation_id": conversation_id})
        
        # Activate new branch
        activate_query = """
        UPDATE conversation_branches 
        SET is_active = true 
        WHERE id = :branch_id AND conversation_id = :conversation_id
        """
        
        result = await database.execute(activate_query, {
            "branch_id": branch_id,
            "conversation_id": conversation_id
        })
        
        return result.rowcount > 0
    
    async def compress_conversation_context(self, conversation_id: str) -> Dict[str, Any]:
        """Compress long conversation context using AI summarization"""
        
        # Get all messages for compression
        messages_query = select(Message).where(
            and_(
                Message.conversation_id == conversation_id,
                Message.is_deleted == False
            )
        ).order_by(Message.created_at)
        
        messages = await database.fetch_all(messages_query)
        
        if len(messages) <= self.compression_threshold:
            return {"compressed": False, "reason": "Not enough messages to compress"}
        
        # Create compression snapshot
        snapshot_id = str(uuid.uuid4())
        
        # Group messages by time periods for compression
        compressed_content = self._compress_messages_by_periods(messages)
        
        # Store compression snapshot
        snapshot_query = """
        INSERT INTO context_snapshots (
            id, conversation_id, snapshot_type, content, message_count, created_at
        ) VALUES (
            :id, :conversation_id, :snapshot_type, :content, :message_count, :created_at
        )
        """
        
        await database.execute(snapshot_query, {
            "id": snapshot_id,
            "conversation_id": conversation_id,
            "snapshot_type": "compressed",
            "content": compressed_content,
            "message_count": len(messages),
            "created_at": datetime.utcnow()
        })
        
        return {
            "compressed": True,
            "snapshot_id": snapshot_id,
            "original_message_count": len(messages),
            "compressed_content": compressed_content
        }
    
    def _compress_messages_by_periods(self, messages: List) -> str:
        """Compress messages by grouping them into time periods"""
        
        # Group messages by hour periods
        periods = {}
        for msg in messages:
            period_key = msg.created_at.strftime("%Y-%m-%d %H:00")
            if period_key not in periods:
                periods[period_key] = []
            periods[period_key].append(msg)
        
        compressed = []
        for period, period_messages in periods.items():
            if len(period_messages) == 1:
                compressed.append(f"[{period}] {period_messages[0].role}: {period_messages[0].content}")
            else:
                # Summarize multiple messages in the same period
                user_msgs = [m for m in period_messages if m.role == 'user']
                assistant_msgs = [m for m in period_messages if m.role == 'assistant']
                
                summary = f"[{period}] "
                if user_msgs:
                    summary += f"User: {len(user_msgs)} messages"
                if assistant_msgs:
                    summary += f" | Assistant: {len(assistant_msgs)} responses"
                
                compressed.append(summary)
        
        return "\n".join(compressed)
    
    async def get_conversation_branches(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get all branches for a conversation"""
        
        query = select(ConversationBranch).where(
            ConversationBranch.conversation_id == conversation_id
        ).order_by(ConversationBranch.created_at.desc())
        
        branches = await database.fetch_all(query)
        return [dict(branch) for branch in branches]
    
    async def get_rollback_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get rollback history for a conversation"""
        
        query = select(Message).where(
            and_(
                Message.conversation_id == conversation_id,
                Message.is_deleted == True
            )
        ).order_by(Message.deleted_at.desc())
        
        deleted_messages = await database.fetch_all(query)
        return [dict(msg) for msg in deleted_messages]
    
    async def _update_conversation_timestamp(self, conversation_id: str):
        """Update conversation's updated_at timestamp"""
        
        update_query = """
        UPDATE conversations 
        SET updated_at = :updated_at 
        WHERE id = :conversation_id
        """
        
        await database.execute(update_query, {
            "conversation_id": conversation_id,
            "updated_at": datetime.utcnow()
        })
