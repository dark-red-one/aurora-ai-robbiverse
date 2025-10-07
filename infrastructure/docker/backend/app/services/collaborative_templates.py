"""
Aurora RobbieVerse - Collaborative Template System
Community templates with sharing, forking, and collaboration
"""
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json
import uuid
from enum import Enum

from app.db.database import database
from app.services.conversation_templates import template_manager

class TemplateVisibility(Enum):
    PRIVATE = "private"
    PUBLIC = "public"
    SHARED = "shared"  # Shared with specific users
    COMMUNITY = "community"  # Community contributed

class CollaborativeTemplateManager:
    """Manages template sharing, forking, and collaboration"""
    
    def __init__(self):
        self.base_template_manager = template_manager
    
    async def share_template(
        self,
        template_id: str,
        owner_user_id: str,
        visibility: TemplateVisibility,
        shared_with_users: Optional[List[str]] = None,
        allow_forking: bool = True,
        allow_editing: bool = False
    ) -> Dict[str, Any]:
        """Share a template with other users or make it public"""
        
        # Verify template ownership
        template = await self._get_template_with_ownership(template_id, owner_user_id)
        if not template:
            raise ValueError("Template not found or access denied")
        
        share_id = str(uuid.uuid4())
        
        # Create share record
        await database.execute("""
            INSERT INTO template_shares (
                id, template_id, owner_user_id, visibility, shared_with_users,
                allow_forking, allow_editing, created_at
            ) VALUES (
                :id, :template_id, :owner_user_id, :visibility, :shared_with_users,
                :allow_forking, :allow_editing, :created_at
            )
        """, {
            "id": share_id,
            "template_id": template_id,
            "owner_user_id": owner_user_id,
            "visibility": visibility.value,
            "shared_with_users": json.dumps(shared_with_users or []),
            "allow_forking": allow_forking,
            "allow_editing": allow_editing,
            "created_at": datetime.utcnow()
        })
        
        # Update template metadata
        await database.execute("""
            UPDATE conversation_templates
            SET metadata = COALESCE(metadata, '{}'::jsonb) || :share_metadata
            WHERE id = :template_id
        """, {
            "template_id": template_id,
            "share_metadata": json.dumps({
                "shared": True,
                "visibility": visibility.value,
                "shared_at": datetime.utcnow().isoformat(),
                "share_id": share_id
            })
        })
        
        return {
            "share_id": share_id,
            "template_id": template_id,
            "visibility": visibility.value,
            "allow_forking": allow_forking,
            "allow_editing": allow_editing,
            "shared_with": len(shared_with_users) if shared_with_users else 0,
            "shared_at": datetime.utcnow().isoformat()
        }
    
    async def fork_template(
        self,
        template_id: str,
        user_id: str,
        new_name: Optional[str] = None,
        new_description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Fork a shared template to create your own version"""
        
        # Get original template
        original_template = await database.fetch_one("""
            SELECT ct.*, ts.allow_forking, ts.owner_user_id as original_owner
            FROM conversation_templates ct
            LEFT JOIN template_shares ts ON ct.id = ts.template_id
            WHERE ct.id = :template_id
            AND (
                ct.user_id = :user_id OR 
                ts.visibility IN ('public', 'community')
            )
        """, {"template_id": template_id, "user_id": user_id})
        
        if not original_template:
            raise ValueError("Template not found or not accessible")
        
        if not original_template["allow_forking"] and original_template["user_id"] != user_id:
            raise ValueError("Template forking not allowed")
        
        # Create forked template
        fork_id = f"fork_{uuid.uuid4().hex[:12]}"
        
        fork_name = new_name or f"{original_template['name']} (Fork)"
        fork_description = new_description or f"Forked from: {original_template['description']}"
        
        await database.execute("""
            INSERT INTO conversation_templates (
                id, user_id, name, description, category, personality,
                initial_messages, suggested_topics, context_settings,
                metadata, created_at
            ) VALUES (
                :id, :user_id, :name, :description, :category, :personality,
                :initial_messages, :suggested_topics, :context_settings,
                :metadata, :created_at
            )
        """, {
            "id": fork_id,
            "user_id": user_id,
            "name": fork_name,
            "description": fork_description,
            "category": original_template["category"],
            "personality": original_template["personality"],
            "initial_messages": original_template["initial_messages"],
            "suggested_topics": original_template["suggested_topics"],
            "context_settings": original_template["context_settings"],
            "metadata": json.dumps({
                "forked_from": template_id,
                "original_owner": str(original_template["original_owner"]) if original_template["original_owner"] else str(original_template["user_id"]),
                "forked_at": datetime.utcnow().isoformat(),
                "is_fork": True
            }),
            "created_at": datetime.utcnow()
        })
        
        # Record fork relationship
        await database.execute("""
            INSERT INTO template_forks (
                id, original_template_id, forked_template_id, user_id, created_at
            ) VALUES (
                :id, :original_template_id, :forked_template_id, :user_id, :created_at
            )
        """, {
            "id": str(uuid.uuid4()),
            "original_template_id": template_id,
            "forked_template_id": fork_id,
            "user_id": user_id,
            "created_at": datetime.utcnow()
        })
        
        return {
            "fork_id": fork_id,
            "original_template_id": template_id,
            "name": fork_name,
            "description": fork_description,
            "forked_by": user_id,
            "forked_at": datetime.utcnow().isoformat()
        }
    
    async def get_community_templates(
        self,
        category: Optional[str] = None,
        sort_by: str = "popular",
        limit: int = 20,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get community-shared templates"""
        
        where_conditions = ["ts.visibility IN ('public', 'community')"]
        params = {"limit": limit, "offset": offset}
        
        if category:
            where_conditions.append("ct.category = :category")
            params["category"] = category
        
        # Sort options
        if sort_by == "popular":
            order_clause = "ORDER BY usage_count DESC, ct.created_at DESC"
        elif sort_by == "recent":
            order_clause = "ORDER BY ct.created_at DESC"
        elif sort_by == "forks":
            order_clause = "ORDER BY fork_count DESC, ct.created_at DESC"
        else:
            order_clause = "ORDER BY ct.created_at DESC"
        
        query = f"""
        SELECT 
            ct.*,
            ts.visibility,
            ts.allow_forking,
            ts.allow_editing,
            u.username as owner_name,
            COALESCE(usage_stats.usage_count, 0) as usage_count,
            COALESCE(fork_stats.fork_count, 0) as fork_count,
            COALESCE(rating_stats.avg_rating, 0) as avg_rating,
            COALESCE(rating_stats.rating_count, 0) as rating_count
        FROM conversation_templates ct
        JOIN template_shares ts ON ct.id = ts.template_id
        JOIN users u ON ct.user_id = u.id
        LEFT JOIN (
            SELECT template_id, COUNT(*) as usage_count
            FROM template_usage_stats
            WHERE created_at >= :recent_date
            GROUP BY template_id
        ) usage_stats ON ct.id = usage_stats.template_id
        LEFT JOIN (
            SELECT original_template_id, COUNT(*) as fork_count
            FROM template_forks
            GROUP BY original_template_id
        ) fork_stats ON ct.id = fork_stats.original_template_id
        LEFT JOIN (
            SELECT template_id, AVG(rating) as avg_rating, COUNT(*) as rating_count
            FROM template_ratings
            GROUP BY template_id
        ) rating_stats ON ct.id = rating_stats.template_id
        WHERE {' AND '.join(where_conditions)}
        {order_clause}
        LIMIT :limit OFFSET :offset
        """
        
        params["recent_date"] = datetime.utcnow() - timedelta(days=30)
        
        templates = await database.fetch_all(query, params)
        
        return [
            {
                "template_id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "category": row["category"],
                "personality": row["personality"],
                "owner_name": row["owner_name"],
                "visibility": row["visibility"],
                "allow_forking": row["allow_forking"],
                "allow_editing": row["allow_editing"],
                "usage_count": row["usage_count"],
                "fork_count": row["fork_count"],
                "avg_rating": float(row["avg_rating"]) if row["avg_rating"] else 0.0,
                "rating_count": row["rating_count"],
                "created_at": row["created_at"].isoformat(),
                "suggested_topics": json.loads(row["suggested_topics"]) if row["suggested_topics"] else []
            }
            for row in templates
        ]
    
    async def rate_template(
        self,
        template_id: str,
        user_id: str,
        rating: int,
        review: Optional[str] = None
    ) -> Dict[str, Any]:
        """Rate and review a community template"""
        
        if not 1 <= rating <= 5:
            raise ValueError("Rating must be between 1 and 5")
        
        # Check if user already rated this template
        existing_rating = await database.fetch_one("""
            SELECT id FROM template_ratings 
            WHERE template_id = :template_id AND user_id = :user_id
        """, {"template_id": template_id, "user_id": user_id})
        
        if existing_rating:
            # Update existing rating
            await database.execute("""
                UPDATE template_ratings 
                SET rating = :rating, review = :review, updated_at = :updated_at
                WHERE template_id = :template_id AND user_id = :user_id
            """, {
                "template_id": template_id,
                "user_id": user_id,
                "rating": rating,
                "review": review,
                "updated_at": datetime.utcnow()
            })
            action = "updated"
        else:
            # Create new rating
            await database.execute("""
                INSERT INTO template_ratings (
                    id, template_id, user_id, rating, review, created_at
                ) VALUES (
                    :id, :template_id, :user_id, :rating, :review, :created_at
                )
            """, {
                "id": str(uuid.uuid4()),
                "template_id": template_id,
                "user_id": user_id,
                "rating": rating,
                "review": review,
                "created_at": datetime.utcnow()
            })
            action = "created"
        
        return {
            "template_id": template_id,
            "user_id": user_id,
            "rating": rating,
            "review": review,
            "action": action,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def get_template_reviews(
        self,
        template_id: str,
        limit: int = 10,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get reviews for a template"""
        
        reviews = await database.fetch_all("""
            SELECT 
                tr.rating,
                tr.review,
                tr.created_at,
                tr.updated_at,
                u.username
            FROM template_ratings tr
            JOIN users u ON tr.user_id = u.id
            WHERE tr.template_id = :template_id
            AND tr.review IS NOT NULL
            ORDER BY tr.created_at DESC
            LIMIT :limit OFFSET :offset
        """, {
            "template_id": template_id,
            "limit": limit,
            "offset": offset
        })
        
        return [
            {
                "rating": row["rating"],
                "review": row["review"],
                "username": row["username"],
                "created_at": row["created_at"].isoformat(),
                "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None
            }
            for row in reviews
        ]
    
    async def track_template_usage(
        self,
        template_id: str,
        user_id: str,
        conversation_id: str
    ) -> None:
        """Track template usage for analytics"""
        
        await database.execute("""
            INSERT INTO template_usage_stats (
                id, template_id, user_id, conversation_id, created_at
            ) VALUES (
                :id, :template_id, :user_id, :conversation_id, :created_at
            )
        """, {
            "id": str(uuid.uuid4()),
            "template_id": template_id,
            "user_id": user_id,
            "conversation_id": conversation_id,
            "created_at": datetime.utcnow()
        })
    
    async def get_trending_templates(
        self,
        days: int = 7,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get trending templates based on recent usage"""
        
        trending = await database.fetch_all("""
            SELECT 
                ct.id,
                ct.name,
                ct.description,
                ct.category,
                u.username as owner_name,
                COUNT(tus.id) as recent_usage,
                AVG(tr.rating) as avg_rating
            FROM conversation_templates ct
            JOIN users u ON ct.user_id = u.id
            JOIN template_usage_stats tus ON ct.id = tus.template_id
            LEFT JOIN template_ratings tr ON ct.id = tr.template_id
            WHERE tus.created_at >= :start_date
            GROUP BY ct.id, ct.name, ct.description, ct.category, u.username
            HAVING COUNT(tus.id) >= 2
            ORDER BY recent_usage DESC, avg_rating DESC NULLS LAST
            LIMIT :limit
        """, {
            "start_date": datetime.utcnow() - timedelta(days=days),
            "limit": limit
        })
        
        return [
            {
                "template_id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "category": row["category"],
                "owner_name": row["owner_name"],
                "recent_usage": row["recent_usage"],
                "avg_rating": float(row["avg_rating"]) if row["avg_rating"] else 0.0
            }
            for row in trending
        ]
    
    async def _get_template_with_ownership(
        self,
        template_id: str,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get template if user owns it"""
        
        result = await database.fetch_one("""
            SELECT * FROM conversation_templates 
            WHERE id = :template_id AND user_id = :user_id
        """, {"template_id": template_id, "user_id": user_id})
        
        return dict(result) if result else None

# Global instance
collaborative_template_manager = CollaborativeTemplateManager()
