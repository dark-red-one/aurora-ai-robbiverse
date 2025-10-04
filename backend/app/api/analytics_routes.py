"""
Aurora RobbieVerse - Analytics API Routes
Conversation analytics and monitoring dashboard
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json

from app.db.database import database
from app.websockets.conversation_ws import conversation_ws_manager

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/conversations/stats")
async def get_conversation_stats(
    user_id: Optional[str] = None,
    days: int = 7,
    limit: int = 100
):
    """Get conversation statistics"""
    try:
        # Base query
        where_clause = "WHERE c.created_at >= :start_date"
        params = {
            "start_date": datetime.utcnow() - timedelta(days=days),
            "limit": limit
        }
        
        if user_id:
            where_clause += " AND c.user_id = :user_id"
            params["user_id"] = user_id
        
        # Get conversation statistics
        stats_query = f"""
        SELECT 
            COUNT(*) as total_conversations,
            COUNT(CASE WHEN c.is_archived = false THEN 1 END) as active_conversations,
            COUNT(CASE WHEN c.is_archived = true THEN 1 END) as archived_conversations,
            AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at))/3600) as avg_conversation_duration_hours,
            MAX(c.updated_at) as last_activity
        FROM conversations c
        {where_clause}
        """
        
        stats = await database.fetch_one(stats_query, params)
        
        # Get message statistics
        message_stats_query = f"""
        SELECT 
            COUNT(*) as total_messages,
            COUNT(CASE WHEN m.role = 'user' THEN 1 END) as user_messages,
            COUNT(CASE WHEN m.role = 'assistant' THEN 1 END) as assistant_messages,
            COUNT(CASE WHEN m.role = 'system' THEN 1 END) as system_messages,
            COUNT(CASE WHEN m.role = 'gatekeeper' THEN 1 END) as gatekeeper_messages,
            COUNT(CASE WHEN m.is_deleted = true THEN 1 END) as rolled_back_messages,
            AVG(m.token_count) as avg_tokens_per_message,
            SUM(m.token_count) as total_tokens
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        {where_clause}
        """
        
        message_stats = await database.fetch_one(message_stats_query, params)
        
        # Get branch statistics
        branch_stats_query = f"""
        SELECT 
            COUNT(*) as total_branches,
            COUNT(CASE WHEN cb.is_active = true THEN 1 END) as active_branches,
            AVG(EXTRACT(EPOCH FROM (cb.created_at - c.created_at))/3600) as avg_branch_creation_hours
        FROM conversation_branches cb
        JOIN conversations c ON cb.conversation_id = c.id
        {where_clause}
        """
        
        branch_stats = await database.fetch_one(branch_stats_query, params)
        
        # Get context compression statistics
        compression_stats_query = f"""
        SELECT 
            COUNT(*) as total_compressions,
            AVG(cs.message_count) as avg_messages_per_compression,
            MAX(cs.created_at) as last_compression
        FROM context_snapshots cs
        JOIN conversations c ON cs.conversation_id = c.id
        WHERE cs.snapshot_type = 'compressed'
        {where_clause.replace('c.created_at', 'c.created_at')}
        """
        
        compression_stats = await database.fetch_one(compression_stats_query, params)
        
        return {
            "period_days": days,
            "conversation_stats": dict(stats) if stats else {},
            "message_stats": dict(message_stats) if message_stats else {},
            "branch_stats": dict(branch_stats) if branch_stats else {},
            "compression_stats": dict(compression_stats) if compression_stats else {},
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/activity")
async def get_conversation_activity(
    user_id: Optional[str] = None,
    hours: int = 24,
    interval_minutes: int = 60
):
    """Get conversation activity over time"""
    try:
        start_time = datetime.utcnow() - timedelta(hours=hours)
        
        where_clause = "WHERE m.created_at >= :start_time"
        params = {
            "start_time": start_time,
            "interval_minutes": interval_minutes
        }
        
        if user_id:
            where_clause += " AND c.user_id = :user_id"
            params["user_id"] = user_id
        
        # Get activity by time intervals
        activity_query = f"""
        SELECT 
            DATE_TRUNC('minute', m.created_at) as time_bucket,
            COUNT(*) as message_count,
            COUNT(CASE WHEN m.role = 'user' THEN 1 END) as user_messages,
            COUNT(CASE WHEN m.role = 'assistant' THEN 1 END) as assistant_messages,
            COUNT(CASE WHEN m.is_deleted = true THEN 1 END) as rolled_back_messages
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        {where_clause}
        GROUP BY time_bucket
        ORDER BY time_bucket
        """
        
        activity = await database.fetch_all(activity_query, params)
        
        return {
            "period_hours": hours,
            "interval_minutes": interval_minutes,
            "activity": [dict(row) for row in activity],
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/top")
async def get_top_conversations(
    user_id: Optional[str] = None,
    days: int = 7,
    limit: int = 10,
    sort_by: str = "message_count"
):
    """Get top conversations by various metrics"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        where_clause = "WHERE c.created_at >= :start_date"
        params = {
            "start_date": start_date,
            "limit": limit
        }
        
        if user_id:
            where_clause += " AND c.user_id = :user_id"
            params["user_id"] = user_id
        
        # Validate sort_by parameter
        valid_sorts = ["message_count", "duration", "tokens", "branches", "rollbacks"]
        if sort_by not in valid_sorts:
            raise HTTPException(status_code=400, detail=f"Invalid sort_by. Must be one of: {valid_sorts}")
        
        # Build sort clause
        if sort_by == "message_count":
            sort_clause = "message_count DESC"
        elif sort_by == "duration":
            sort_clause = "duration_hours DESC"
        elif sort_by == "tokens":
            sort_clause = "total_tokens DESC"
        elif sort_by == "branches":
            sort_clause = "branch_count DESC"
        elif sort_by == "rollbacks":
            sort_clause = "rollback_count DESC"
        
        top_conversations_query = f"""
        SELECT 
            c.id,
            c.title,
            c.user_id,
            c.created_at,
            c.updated_at,
            COUNT(m.id) as message_count,
            EXTRACT(EPOCH FROM (c.updated_at - c.created_at))/3600 as duration_hours,
            SUM(m.token_count) as total_tokens,
            COUNT(DISTINCT cb.id) as branch_count,
            COUNT(CASE WHEN m.is_deleted = true THEN 1 END) as rollback_count
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        LEFT JOIN conversation_branches cb ON c.id = cb.conversation_id
        {where_clause}
        GROUP BY c.id, c.title, c.user_id, c.created_at, c.updated_at
        ORDER BY {sort_clause}
        LIMIT :limit
        """
        
        conversations = await database.fetch_all(top_conversations_query, params)
        
        return {
            "period_days": days,
            "sort_by": sort_by,
            "limit": limit,
            "conversations": [dict(row) for row in conversations],
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/activity")
async def get_user_activity(
    days: int = 7,
    limit: int = 50
):
    """Get user activity statistics"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        user_activity_query = """
        SELECT 
            u.id,
            u.username,
            u.email,
            u.created_at as user_created_at,
            COUNT(DISTINCT c.id) as conversation_count,
            COUNT(m.id) as total_messages,
            SUM(m.token_count) as total_tokens,
            COUNT(CASE WHEN m.is_deleted = true THEN 1 END) as rollback_count,
            COUNT(DISTINCT cb.id) as branch_count,
            MAX(c.updated_at) as last_activity
        FROM users u
        LEFT JOIN conversations c ON u.id = c.user_id AND c.created_at >= :start_date
        LEFT JOIN messages m ON c.id = m.conversation_id
        LEFT JOIN conversation_branches cb ON c.id = cb.conversation_id
        GROUP BY u.id, u.username, u.email, u.created_at
        HAVING COUNT(c.id) > 0
        ORDER BY total_messages DESC
        LIMIT :limit
        """
        
        users = await database.fetch_all(user_activity_query, {
            "start_date": start_date,
            "limit": limit
        })
        
        return {
            "period_days": days,
            "limit": limit,
            "users": [dict(row) for row in users],
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/system/health")
async def get_system_health():
    """Get system health metrics"""
    try:
        # Database health
        db_start = datetime.utcnow()
        await database.fetch_one("SELECT 1")
        db_response_time = (datetime.utcnow() - db_start).total_seconds() * 1000
        
        # WebSocket connections
        ws_stats = conversation_ws_manager.get_connection_stats()
        
        # Recent activity (last hour)
        recent_activity_query = """
        SELECT 
            COUNT(*) as messages_last_hour,
            COUNT(DISTINCT conversation_id) as active_conversations
        FROM messages 
        WHERE created_at >= :one_hour_ago
        """
        
        recent_activity = await database.fetch_one(recent_activity_query, {
            "one_hour_ago": datetime.utcnow() - timedelta(hours=1)
        })
        
        # Error rate (last hour)
        error_rate_query = """
        SELECT 
            COUNT(*) as total_messages,
            COUNT(CASE WHEN is_deleted = true THEN 1 END) as rolled_back_messages
        FROM messages 
        WHERE created_at >= :one_hour_ago
        """
        
        error_stats = await database.fetch_one(error_rate_query, {
            "one_hour_ago": datetime.utcnow() - timedelta(hours=1)
        })
        
        error_rate = 0
        if error_stats and error_stats["total_messages"] > 0:
            error_rate = (error_stats["rolled_back_messages"] / error_stats["total_messages"]) * 100
        
        return {
            "status": "healthy",
            "database": {
                "status": "connected",
                "response_time_ms": round(db_response_time, 2)
            },
            "websockets": ws_stats,
            "activity": {
                "messages_last_hour": recent_activity["messages_last_hour"] if recent_activity else 0,
                "active_conversations": recent_activity["active_conversations"] if recent_activity else 0
            },
            "quality": {
                "rollback_rate_percent": round(error_rate, 2),
                "total_messages": error_stats["total_messages"] if error_stats else 0,
                "rolled_back_messages": error_stats["rolled_back_messages"] if error_stats else 0
            },
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "generated_at": datetime.utcnow().isoformat()
        }

@router.get("/conversations/{conversation_id}/analytics")
async def get_conversation_analytics(conversation_id: str):
    """Get detailed analytics for a specific conversation"""
    try:
        # Conversation basic info
        conv_query = """
        SELECT 
            c.*,
            u.username,
            COUNT(m.id) as message_count,
            SUM(m.token_count) as total_tokens,
            COUNT(CASE WHEN m.is_deleted = true THEN 1 END) as rollback_count,
            COUNT(DISTINCT cb.id) as branch_count
        FROM conversations c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN messages m ON c.id = m.conversation_id
        LEFT JOIN conversation_branches cb ON c.id = cb.conversation_id
        WHERE c.id = :conversation_id
        GROUP BY c.id, u.username
        """
        
        conversation = await database.fetch_one(conv_query, {"conversation_id": conversation_id})
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Message timeline
        timeline_query = """
        SELECT 
            DATE_TRUNC('minute', created_at) as time_bucket,
            role,
            COUNT(*) as message_count,
            AVG(token_count) as avg_tokens
        FROM messages 
        WHERE conversation_id = :conversation_id
        GROUP BY time_bucket, role
        ORDER BY time_bucket
        """
        
        timeline = await database.fetch_all(timeline_query, {"conversation_id": conversation_id})
        
        # Branch analysis
        branch_query = """
        SELECT 
            cb.*,
            COUNT(m.id) as message_count
        FROM conversation_branches cb
        LEFT JOIN messages m ON cb.id = m.branch_id
        WHERE cb.conversation_id = :conversation_id
        GROUP BY cb.id
        ORDER BY cb.created_at
        """
        
        branches = await database.fetch_all(branch_query, {"conversation_id": conversation_id})
        
        # Rollback analysis
        rollback_query = """
        SELECT 
            role,
            deleted_reason,
            COUNT(*) as count,
            AVG(EXTRACT(EPOCH FROM (deleted_at - created_at))/60) as avg_time_to_rollback_minutes
        FROM messages 
        WHERE conversation_id = :conversation_id AND is_deleted = true
        GROUP BY role, deleted_reason
        ORDER BY count DESC
        """
        
        rollbacks = await database.fetch_all(rollback_query, {"conversation_id": conversation_id})
        
        return {
            "conversation": dict(conversation),
            "timeline": [dict(row) for row in timeline],
            "branches": [dict(row) for row in branches],
            "rollbacks": [dict(row) for row in rollbacks],
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))











