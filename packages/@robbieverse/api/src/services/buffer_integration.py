#!/usr/bin/env python3
"""
Buffer Integration Service
Schedule and manage social media posts across LinkedIn, Twitter, etc.
Part of Robbie@Growth marketing platform
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import httpx
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

BUFFER_API_BASE = "https://api.bufferapp.com/1"
BUFFER_ACCESS_TOKEN = os.getenv("BUFFER_ACCESS_TOKEN", "")

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "robbieverse")
POSTGRES_USER = os.getenv("POSTGRES_USER", "robbie")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

# ============================================================================
# MODELS
# ============================================================================

class BufferAccount(BaseModel):
    """Buffer social media account"""
    account_type: str
    account_name: str
    account_handle: Optional[str] = None
    buffer_profile_id: str
    access_token: str
    is_active: bool = True
    metadata: Dict = {}

class BufferPost(BaseModel):
    """Social media post via Buffer"""
    account_id: str
    content: str
    media_urls: List[str] = []
    scheduled_at: Optional[datetime] = None
    status: str = "draft"
    created_by: str = "robbie"
    campaign_id: Optional[str] = None
    utm_params: Dict = {}
    metadata: Dict = {}

class BufferResponse(BaseModel):
    """Buffer API response"""
    success: bool
    data: Optional[Dict] = None
    error: Optional[str] = None

# ============================================================================
# DATABASE
# ============================================================================

def get_db_connection():
    """Get PostgreSQL connection"""
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD
    )

# ============================================================================
# BUFFER API CLIENT
# ============================================================================

class BufferClient:
    """Buffer API client for social media management"""
    
    def __init__(self, access_token: str = BUFFER_ACCESS_TOKEN):
        self.access_token = access_token
        self.base_url = BUFFER_API_BASE
        
    async def _request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Make API request to Buffer"""
        url = f"{self.base_url}/{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            if method == "GET":
                response = await client.get(url, headers=headers, params=data or {})
            elif method == "POST":
                response = await client.post(url, headers=headers, json=data or {})
            elif method == "PUT":
                response = await client.put(url, headers=headers, json=data or {})
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Buffer API error: {response.status_code} - {response.text}")
                raise Exception(f"Buffer API error: {response.status_code}")
    
    async def get_profiles(self) -> List[Dict]:
        """Get all Buffer profiles (social accounts)"""
        return await self._request("GET", "profiles.json")
    
    async def get_profile(self, profile_id: str) -> Dict:
        """Get specific Buffer profile"""
        return await self._request("GET", f"profiles/{profile_id}.json")
    
    async def create_update(self, profile_id: str, text: str, 
                           scheduled_at: Optional[datetime] = None,
                           media: Optional[List[str]] = None,
                           shorten: bool = True) -> Dict:
        """Create a new post/update"""
        data = {
            "profile_ids": [profile_id],
            "text": text,
            "shorten": shorten
        }
        
        if scheduled_at:
            data["scheduled_at"] = int(scheduled_at.timestamp())
        else:
            data["now"] = True
        
        if media:
            data["media"] = {"photo": media[0]} if len(media) == 1 else {"photo": media}
        
        return await self._request("POST", "updates/create.json", data)
    
    async def update_update(self, update_id: str, text: str, 
                           scheduled_at: Optional[datetime] = None) -> Dict:
        """Update an existing post"""
        data = {"text": text}
        
        if scheduled_at:
            data["scheduled_at"] = int(scheduled_at.timestamp())
        
        return await self._request("POST", f"updates/{update_id}/update.json", data)
    
    async def delete_update(self, update_id: str) -> Dict:
        """Delete a scheduled post"""
        return await self._request("POST", f"updates/{update_id}/destroy.json")
    
    async def get_pending_updates(self, profile_id: str) -> List[Dict]:
        """Get pending updates for a profile"""
        return await self._request("GET", f"profiles/{profile_id}/updates/pending.json")
    
    async def get_sent_updates(self, profile_id: str) -> List[Dict]:
        """Get sent updates for a profile"""
        return await self._request("GET", f"profiles/{profile_id}/updates/sent.json")
    
    async def get_update_statistics(self, update_id: str) -> Dict:
        """Get engagement statistics for an update"""
        return await self._request("GET", f"updates/{update_id}/interactions.json")

# ============================================================================
# SERVICE FUNCTIONS
# ============================================================================

async def sync_buffer_accounts():
    """Sync Buffer accounts from API to database"""
    client = BufferClient()
    
    try:
        profiles = await client.get_profiles()
        
        conn = get_db_connection()
        synced_count = 0
        
        try:
            with conn.cursor() as cur:
                for profile in profiles:
                    # Map Buffer service to account_type
                    service = profile.get("service", "").lower()
                    account_type_map = {
                        "linkedin": "linkedin_personal",
                        "linkedincompany": "linkedin_company",
                        "twitter": "twitter",
                        "facebook": "facebook",
                        "instagram": "instagram"
                    }
                    account_type = account_type_map.get(service, service)
                    
                    cur.execute("""
                        INSERT INTO buffer_accounts 
                        (buffer_profile_id, account_type, account_name, account_handle, 
                         is_active, metadata)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (buffer_profile_id)
                        DO UPDATE SET
                            account_name = EXCLUDED.account_name,
                            is_active = EXCLUDED.is_active,
                            metadata = EXCLUDED.metadata,
                            updated_at = CURRENT_TIMESTAMP
                    """, (
                        profile.get("id"),
                        account_type,
                        profile.get("formatted_username", ""),
                        profile.get("service_username", ""),
                        profile.get("_id") is not None,
                        json.dumps(profile)
                    ))
                    synced_count += 1
                
                conn.commit()
            
            logger.info(f"✅ Synced {synced_count} Buffer accounts")
            return {"success": True, "synced": synced_count}
            
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"❌ Failed to sync Buffer accounts: {e}")
        return {"success": False, "error": str(e)}

async def create_post(
    account_id: str,
    content: str,
    scheduled_at: Optional[datetime] = None,
    media_urls: List[str] = None,
    campaign_id: Optional[str] = None,
    utm_params: Dict = None,
    created_by: str = "robbie"
) -> Dict:
    """Create a new social media post"""
    
    conn = get_db_connection()
    client = BufferClient()
    
    try:
        # Get Buffer profile ID
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT buffer_profile_id, account_type 
                FROM buffer_accounts 
                WHERE id = %s AND is_active = true
            """, (account_id,))
            
            account = cur.fetchone()
            if not account:
                return {"success": False, "error": "Account not found or inactive"}
        
        # Add UTM parameters to content if LinkedIn/Twitter
        final_content = content
        if utm_params and account["account_type"] in ["linkedin_personal", "linkedin_company", "twitter"]:
            # Content with UTM tracking would be added here
            pass
        
        # Create post in Buffer
        buffer_response = await client.create_update(
            profile_id=account["buffer_profile_id"],
            text=final_content,
            scheduled_at=scheduled_at,
            media=media_urls or []
        )
        
        # Store in database
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO buffer_posts 
                (account_id, buffer_id, content, media_urls, scheduled_at, 
                 status, created_by, campaign_id, utm_params, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                account_id,
                buffer_response.get("id"),
                final_content,
                json.dumps(media_urls or []),
                scheduled_at,
                "scheduled" if scheduled_at else "posted",
                created_by,
                campaign_id,
                json.dumps(utm_params or {}),
                json.dumps(buffer_response)
            ))
            
            post_id = cur.fetchone()["id"]
            conn.commit()
        
        logger.info(f"✅ Created Buffer post: {post_id}")
        return {
            "success": True,
            "post_id": str(post_id),
            "buffer_id": buffer_response.get("id"),
            "scheduled_at": scheduled_at.isoformat() if scheduled_at else None
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to create post: {e}")
        conn.rollback()
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

async def get_scheduled_posts(account_id: Optional[str] = None, limit: int = 50) -> List[Dict]:
    """Get scheduled posts"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if account_id:
                cur.execute("""
                    SELECT 
                        bp.*,
                        ba.account_name,
                        ba.account_type,
                        mc.name as campaign_name
                    FROM buffer_posts bp
                    JOIN buffer_accounts ba ON ba.id = bp.account_id
                    LEFT JOIN marketing_campaigns mc ON mc.id = bp.campaign_id
                    WHERE bp.account_id = %s 
                    AND bp.status = 'scheduled'
                    ORDER BY bp.scheduled_at ASC
                    LIMIT %s
                """, (account_id, limit))
            else:
                cur.execute("""
                    SELECT 
                        bp.*,
                        ba.account_name,
                        ba.account_type,
                        mc.name as campaign_name
                    FROM buffer_posts bp
                    JOIN buffer_accounts ba ON ba.id = bp.account_id
                    LEFT JOIN marketing_campaigns mc ON mc.id = bp.campaign_id
                    WHERE bp.status = 'scheduled'
                    ORDER BY bp.scheduled_at ASC
                    LIMIT %s
                """, (limit,))
            
            posts = cur.fetchall()
            return [dict(post) for post in posts]
            
    finally:
        conn.close()

async def sync_post_engagement():
    """Sync engagement metrics from Buffer for posted content"""
    conn = get_db_connection()
    client = BufferClient()
    
    try:
        # Get posts that need engagement sync (posted in last 30 days)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT id, buffer_id, account_id
                FROM buffer_posts
                WHERE status = 'posted'
                AND posted_at > CURRENT_DATE - INTERVAL '30 days'
                AND buffer_id IS NOT NULL
            """)
            
            posts = cur.fetchall()
        
        synced_count = 0
        
        for post in posts:
            try:
                # Get engagement stats from Buffer
                stats = await client.get_update_statistics(post["buffer_id"])
                
                engagement = {
                    "likes": stats.get("likes", 0),
                    "comments": stats.get("comments", 0),
                    "shares": stats.get("shares", 0),
                    "clicks": stats.get("clicks", 0),
                    "impressions": stats.get("reach", 0)
                }
                
                # Update database
                with conn.cursor() as cur:
                    cur.execute("""
                        UPDATE buffer_posts
                        SET engagement = %s,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    """, (json.dumps(engagement), post["id"]))
                
                synced_count += 1
                
            except Exception as e:
                logger.warning(f"Failed to sync engagement for post {post['id']}: {e}")
                continue
        
        conn.commit()
        logger.info(f"✅ Synced engagement for {synced_count} posts")
        return {"success": True, "synced": synced_count}
        
    except Exception as e:
        logger.error(f"❌ Failed to sync engagement: {e}")
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

async def get_content_calendar(days: int = 14) -> Dict:
    """Get content calendar for next N days"""
    conn = get_db_connection()
    
    try:
        end_date = datetime.now() + timedelta(days=days)
        
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    DATE(bp.scheduled_at) as post_date,
                    COUNT(*) as post_count,
                    json_agg(
                        json_build_object(
                            'id', bp.id,
                            'content', LEFT(bp.content, 100),
                            'account_name', ba.account_name,
                            'account_type', ba.account_type,
                            'scheduled_at', bp.scheduled_at,
                            'campaign_name', mc.name,
                            'status', bp.status
                        ) ORDER BY bp.scheduled_at
                    ) as posts
                FROM buffer_posts bp
                JOIN buffer_accounts ba ON ba.id = bp.account_id
                LEFT JOIN marketing_campaigns mc ON mc.id = bp.campaign_id
                WHERE bp.scheduled_at BETWEEN CURRENT_TIMESTAMP AND %s
                AND bp.status IN ('scheduled', 'approved')
                GROUP BY DATE(bp.scheduled_at)
                ORDER BY post_date ASC
            """, (end_date,))
            
            calendar = cur.fetchall()
            return {
                "success": True,
                "days": days,
                "calendar": [dict(day) for day in calendar]
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to get content calendar: {e}")
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import asyncio
    
    async def test():
        """Test Buffer integration"""
        print("🧪 Testing Buffer Integration")
        
        # Sync accounts
        result = await sync_buffer_accounts()
        print(f"Sync accounts: {result}")
        
        # Get content calendar
        calendar = await get_content_calendar(7)
        print(f"Content calendar: {calendar}")
    
    asyncio.run(test())

