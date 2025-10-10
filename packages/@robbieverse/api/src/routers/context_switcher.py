"""
Context Switcher API - Multi-Context Management
Allows users to switch between TestPilot, Aurora Town, Presidential privileges, etc.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import asyncpg
from ..database import get_db_pool

router = APIRouter(prefix="/api/contexts", tags=["contexts"])


class Context(BaseModel):
    """User context definition"""
    type: str  # 'town', 'company', 'role'
    id: str
    name: str
    display_name: str
    permissions: dict
    is_active: bool = True


class ContextSwitch(BaseModel):
    """Request to switch active context"""
    user_id: str
    context_type: str  # 'town', 'company', 'role'
    context_id: str
    session_id: str = "default"


class ActiveContext(BaseModel):
    """User's current active context"""
    user_id: str
    context_type: str
    context_id: str
    context_name: str
    display_name: str
    permissions: dict
    switched_at: str


@router.get("/{user_id}", response_model=List[Context])
async def get_user_contexts(user_id: str):
    """Get all available contexts for user"""
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        # Get all contexts for user
        rows = await conn.fetch("""
            SELECT 
                context_type as type,
                context_id as id,
                context_name as name,
                display_name,
                permissions,
                is_active
            FROM user_contexts
            WHERE user_id = $1 AND is_active = true
            ORDER BY 
                CASE context_type
                    WHEN 'role' THEN 1
                    WHEN 'town' THEN 2
                    WHEN 'company' THEN 3
                    ELSE 4
                END,
                context_name
        """, user_id)
        
        contexts = [
            Context(
                type=row['type'],
                id=row['id'],
                name=row['name'],
                display_name=row['display_name'],
                permissions=row['permissions'] or {},
                is_active=row['is_active']
            )
            for row in rows
        ]
        
        return contexts


@router.post("/switch")
async def switch_context(switch: ContextSwitch):
    """Switch active context and return new permissions"""
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        # Use the PostgreSQL function to switch context
        result = await conn.fetchval("""
            SELECT switch_user_context($1, $2, $3, $4)
        """, switch.user_id, switch.session_id, switch.context_type, switch.context_id)
        
        if not result.get('success'):
            raise HTTPException(
                status_code=404, 
                detail=result.get('error', 'Context not found')
            )
        
        return result


@router.get("/current/{user_id}", response_model=ActiveContext)
async def get_current_context(user_id: str, session_id: str = "default"):
    """Get user's current active context with full details"""
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT 
                uac.user_id,
                uac.active_context_type as context_type,
                uac.active_context_id as context_id,
                uc.context_name,
                uc.display_name,
                uc.permissions,
                uac.switched_at::text
            FROM user_active_contexts uac
            JOIN user_contexts uc ON 
                uac.user_id = uc.user_id 
                AND uac.active_context_type = uc.context_type
                AND uac.active_context_id = uc.context_id
            WHERE uac.user_id = $1 
            AND (uac.session_id = $2 OR uac.session_id = 'default')
            ORDER BY 
                CASE WHEN uac.session_id = $2 THEN 1 ELSE 2 END
            LIMIT 1
        """, user_id, session_id)
        
        if not row:
            # No active context, return default (first context or president if available)
            row = await conn.fetchrow("""
                SELECT 
                    user_id,
                    context_type,
                    context_id,
                    context_name,
                    display_name,
                    permissions,
                    NOW()::text as switched_at
                FROM user_contexts
                WHERE user_id = $1 AND is_active = true
                ORDER BY 
                    CASE context_id 
                        WHEN 'president' THEN 1
                        ELSE 2
                    END
                LIMIT 1
            """, user_id)
            
            if not row:
                raise HTTPException(status_code=404, detail="No contexts found for user")
        
        return ActiveContext(
            user_id=row['user_id'],
            context_type=row['context_type'],
            context_id=row['context_id'],
            context_name=row['context_name'],
            display_name=row['display_name'],
            permissions=row['permissions'] or {},
            switched_at=row['switched_at']
        )


@router.get("/privileges/{user_id}")
async def get_user_privileges(user_id: str):
    """Get special privileges like Presidential access"""
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT 
                privilege_level,
                description,
                grants_all_access
            FROM user_privileges
            WHERE user_id = $1
        """, user_id)
        
        if not row:
            return {
                "has_privilege": False,
                "level": "citizen"
            }
        
        return {
            "has_privilege": True,
            "level": row['privilege_level'],
            "description": row['description'],
            "grants_all_access": row['grants_all_access']
        }


@router.get("/data/{user_id}/{table_name}")
async def get_context_filtered_data(user_id: str, table_name: str):
    """Get data filtered by user's active context"""
    pool = await get_db_pool()
    
    # Validate table name to prevent SQL injection
    allowed_tables = ['companies', 'contacts', 'deals', 'activities']
    if table_name not in allowed_tables:
        raise HTTPException(status_code=400, detail=f"Table {table_name} not allowed")
    
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT * FROM get_user_accessible_data($1, $2)
        """, user_id, table_name)
        
        return [
            {
                "id": row['id'],
                **row['data']
            }
            for row in rows
        ]

