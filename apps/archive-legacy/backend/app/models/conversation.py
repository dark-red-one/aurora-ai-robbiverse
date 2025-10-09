"""
Aurora RobbieVerse - Conversation Context Models
"""
from sqlalchemy import Column, String, DateTime, Text, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

class Conversation(Base):
    """Conversation model with context management"""
    __tablename__ = "conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_archived = Column(Boolean, default=False)
    conversation_metadata = Column('metadata', JSON, default=dict)
    
    # Context management fields
    context_window_size = Column(Integer, default=10)  # Number of messages to keep in context
    context_compression_enabled = Column(Boolean, default=True)
    current_branch_id = Column(UUID(as_uuid=True), nullable=True)  # For conversation branching
    
    # Relationships
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    branches = relationship("ConversationBranch", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    """Message model with rollback support"""
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    branch_id = Column(UUID(as_uuid=True), ForeignKey("conversation_branches.id"), nullable=True)
    
    role = Column(String(20), nullable=False)  # user, assistant, system, gatekeeper
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    conversation_metadata = Column('metadata', JSON, default=dict)
    token_count = Column(Integer, default=0)
    model_used = Column(String(100), nullable=True)
    
    # Rollback support
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    deleted_reason = Column(String(255), nullable=True)
    parent_message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=True)  # For rollback chains
    
    # Context management
    context_importance = Column(Integer, default=1)  # 1-10 scale for context prioritization
    is_context_compressed = Column(Boolean, default=False)
    compressed_content = Column(Text, nullable=True)  # Compressed version for long conversations
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    branch = relationship("ConversationBranch", back_populates="messages", foreign_keys=[branch_id])
    parent_message = relationship("Message", remote_side=[id])

class ConversationBranch(Base):
    """Conversation branching for exploring different AI responses"""
    __tablename__ = "conversation_branches"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    parent_branch_id = Column(UUID(as_uuid=True), ForeignKey("conversation_branches.id"), nullable=True)
    branch_point_message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=False)
    
    name = Column(String(255), nullable=False)  # User-friendly branch name
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    conversation_metadata = Column('metadata', JSON, default=dict)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="branches")
    parent_branch = relationship("ConversationBranch", remote_side=[id])
    messages = relationship("Message", back_populates="branch", foreign_keys="Message.branch_id")

class ContextSnapshot(Base):
    """Snapshots for conversation context management"""
    __tablename__ = "context_snapshots"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    snapshot_type = Column(String(50), nullable=False)  # 'compressed', 'summary', 'key_points'
    content = Column(Text, nullable=False)
    message_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    conversation_metadata = Column('metadata', JSON, default=dict)
    
    # Relationships
    conversation = relationship("Conversation")
