#!/usr/bin/env python3
"""
VISITOR TRACKING API
Comprehensive tracking for landing pages with fault-tolerant design
Tracks pageviews, engagement, events, and conversions
AUTO-SYNCS TO HUBSPOT 🔥
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import psycopg2
import logging
from datetime import datetime
import uuid
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.hubspot_sync import hubspot_sync

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# ============================================================================
# DATABASE CONNECTION
# ============================================================================

def get_db_connection():
    """Get PostgreSQL connection - fault tolerant"""
    try:
        return psycopg2.connect(
            host='localhost',
            port=5432,
            database='aurora_unified',
            user='postgres',
            password='aurora2024'
        )
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return None

# ============================================================================
# REQUEST MODELS
# ============================================================================

class PageviewData(BaseModel):
    session_id: str
    page_url: str
    page_title: Optional[str] = None
    referrer: Optional[str] = None
    user_agent: Optional[str] = None
    visitor_name: Optional[str] = None
    visitor_company: Optional[str] = None
    # HubSpot integration fields
    user_id: Optional[str] = None
    identified_email: Optional[str] = None
    hubspot_contact_id: Optional[str] = None
    hubspot_utk: Optional[str] = None

class HeartbeatData(BaseModel):
    session_id: str
    seconds: int = 10

class EventData(BaseModel):
    session_id: str
    event_type: str  # 'tab_switch', 'scroll', 'click'
    event_data: Optional[Dict[str, Any]] = {}

class ConversionData(BaseModel):
    session_id: str
    conversion_type: str  # 'calendly_book', 'email_click', 'linkedin_click'
    conversion_value: Optional[float] = 0.0

# ============================================================================
# TRACKING ENDPOINTS
# ============================================================================

@router.post("/tracking/pageview")
async def track_pageview(data: PageviewData, request: Request):
    """
    Track initial page view
    Creates or updates website_activity record
    """
    try:
        conn = get_db_connection()
        if not conn:
            return {"success": True, "message": "Tracking unavailable"}
        
        cursor = conn.cursor()
        
        # Get IP address from request
        ip_address = request.client.host if request.client else None
        
        # Insert or update activity record (with HubSpot fields)
        cursor.execute("""
            INSERT INTO website_activity (
                id,
                session_id,
                page_url,
                page_title,
                referrer,
                user_agent,
                ip_address,
                user_id,
                identified_email,
                hubspot_contact_id,
                hubspot_utk,
                time_on_page_seconds,
                scroll_depth_percent,
                bounce,
                visited_at
            ) VALUES (
                gen_random_uuid(),
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0, 0, FALSE, CURRENT_TIMESTAMP
            )
            ON CONFLICT (session_id) 
            DO UPDATE SET
                page_url = EXCLUDED.page_url,
                user_id = COALESCE(EXCLUDED.user_id, website_activity.user_id),
                identified_email = COALESCE(EXCLUDED.identified_email, website_activity.identified_email),
                hubspot_contact_id = COALESCE(EXCLUDED.hubspot_contact_id, website_activity.hubspot_contact_id),
                hubspot_utk = COALESCE(EXCLUDED.hubspot_utk, website_activity.hubspot_utk),
                visited_at = CURRENT_TIMESTAMP
            RETURNING id
        """, (
            data.session_id,
            data.page_url,
            data.page_title,
            data.referrer,
            data.user_agent,
            ip_address,
            data.user_id,
            data.identified_email,
            data.hubspot_contact_id,
            data.hubspot_utk
        ))
        
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"✅ Pageview tracked: {data.session_id} - {data.visitor_name or 'Anonymous'} @ {data.visitor_company or 'Unknown'}")
        
        return {
            "success": True,
            "session_id": data.session_id,
            "visitor": {
                "name": data.visitor_name,
                "company": data.visitor_company
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Pageview tracking error: {e}")
        # Always return success for fault tolerance
        return {"success": True, "message": "Tracking logged"}

@router.post("/tracking/heartbeat")
async def track_heartbeat(data: HeartbeatData):
    """
    Update time on page (called every 10 seconds)
    """
    try:
        conn = get_db_connection()
        if not conn:
            return {"success": True}
        
        cursor = conn.cursor()
        
        # Update time on page
        cursor.execute("""
            UPDATE website_activity
            SET time_on_page_seconds = time_on_page_seconds + %s,
                bounce = FALSE
            WHERE session_id = %s
        """, (data.seconds, data.session_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"success": True, "seconds_added": data.seconds}
        
    except Exception as e:
        logger.error(f"❌ Heartbeat tracking error: {e}")
        return {"success": True}

@router.post("/tracking/event")
async def track_event(data: EventData):
    """
    Track user interactions (tab switches, scrolls, clicks)
    """
    try:
        conn = get_db_connection()
        if not conn:
            return {"success": True}
        
        cursor = conn.cursor()
        
        # Update scroll depth if this is a scroll event
        if data.event_type == 'scroll' and 'depth' in data.event_data:
            cursor.execute("""
                UPDATE website_activity
                SET scroll_depth_percent = GREATEST(scroll_depth_percent, %s)
                WHERE session_id = %s
            """, (data.event_data['depth'], data.session_id))
        
        # Log event (you can create separate events table if needed)
        logger.info(f"📊 Event: {data.event_type} - {data.session_id}")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"success": True, "event_type": data.event_type}
        
    except Exception as e:
        logger.error(f"❌ Event tracking error: {e}")
        return {"success": True}

@router.post("/tracking/conversion")
async def track_conversion(data: ConversionData):
    """
    Track conversion events (calendly booking, email clicks, etc.)
    🔥 AUTO-SYNCS TO HUBSPOT 🔥
    """
    try:
        conn = get_db_connection()
        if not conn:
            return {"success": True}
        
        cursor = conn.cursor()
        
        # Mark as converted and get visitor details
        cursor.execute("""
            UPDATE website_activity
            SET converted = TRUE,
                conversion_type = %s,
                conversion_value = %s
            WHERE session_id = %s
            RETURNING user_id, identified_email, hubspot_contact_id, page_url, time_on_page_seconds
        """, (data.conversion_type, data.conversion_value, data.session_id))
        
        result = cursor.fetchone()
        conn.commit()
        
        # HubSpot Integration - The Magic Happens Here 💋
        if result:
            user_id, email, hs_contact_id, page_url, time_on_page = result
            
            logger.info(f"💰 CONVERSION: {data.conversion_type} - ${data.conversion_value} - {email or 'Anonymous'}")
            
            # If we have an email, sync to HubSpot
            if email and hubspot_sync.enabled:
                try:
                    # Create or update HubSpot contact
                    contact_properties = {
                        'landing_page_visited': page_url,
                        'last_conversion_type': data.conversion_type,
                        'last_conversion_value': str(data.conversion_value),
                        'testpilot_user_id': user_id or '',
                        'time_on_site_seconds': str(time_on_page or 0)
                    }
                    
                    if not hs_contact_id:
                        hs_contact_id = hubspot_sync.create_or_update_contact(email, contact_properties)
                        
                        if hs_contact_id:
                            # Store HubSpot ID locally
                            cursor.execute("""
                                UPDATE website_activity
                                SET hubspot_contact_id = %s,
                                    synced_to_hubspot = TRUE
                                WHERE session_id = %s
                            """, (hs_contact_id, data.session_id))
                            conn.commit()
                    
                    # Create deal if high-value conversion (>= $100)
                    if hs_contact_id and data.conversion_value >= 100:
                        deal_name = f"GroceryShop Landing - {email}"
                        hubspot_sync.create_deal(hs_contact_id, deal_name, data.conversion_value)
                    
                    # Log engagement to HubSpot timeline
                    if hs_contact_id:
                        hubspot_sync.log_engagement(hs_contact_id, 'NOTE', {
                            'timestamp': int(datetime.now().timestamp() * 1000),
                            'body': f'🎯 Converted on landing page: {data.conversion_type} (${data.conversion_value})\n\nPage: {page_url}\nTime on site: {time_on_page}s'
                        })
                    
                    logger.info(f"✅ Synced conversion to HubSpot contact {hs_contact_id}")
                    
                except Exception as e:
                    logger.error(f"HubSpot sync error (non-fatal): {e}")
        
        cursor.close()
        conn.close()
        
        return {
            "success": True,
            "conversion_type": data.conversion_type,
            "value": data.conversion_value,
            "hubspot_synced": email is not None and hubspot_sync.enabled
        }
        
    except Exception as e:
        logger.error(f"❌ Conversion tracking error: {e}")
        return {"success": True}

# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/tracking/stats")
async def get_tracking_stats(page_filter: Optional[str] = None):
    """
    Get tracking statistics
    Usage: /api/tracking/stats?page_filter=groceryshop
    """
    try:
        conn = get_db_connection()
        if not conn:
            return {"error": "Database unavailable"}
        
        cursor = conn.cursor()
        
        # Build query
        where_clause = "WHERE page_url LIKE %s" if page_filter else ""
        params = (f"%{page_filter}%",) if page_filter else ()
        
        cursor.execute(f"""
            SELECT 
                COUNT(DISTINCT session_id) as unique_visitors,
                AVG(time_on_page_seconds) as avg_time_seconds,
                AVG(scroll_depth_percent) as avg_scroll_percent,
                SUM(CASE WHEN converted THEN 1 ELSE 0 END) as conversions,
                SUM(CASE WHEN bounce THEN 1 ELSE 0 END) as bounces
            FROM website_activity
            {where_clause}
        """, params)
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return {
            "unique_visitors": result[0] or 0,
            "avg_time_seconds": round(float(result[1] or 0), 1),
            "avg_scroll_percent": round(float(result[2] or 0), 1),
            "conversions": result[3] or 0,
            "bounces": result[4] or 0,
            "conversion_rate": round((result[3] or 0) / max(result[0] or 1, 1) * 100, 2)
        }
        
    except Exception as e:
        logger.error(f"❌ Stats retrieval error: {e}")
        return {"error": str(e)}

@router.get("/tracking/recent")
async def get_recent_visitors(limit: int = 20):
    """
    Get recent visitors
    Usage: /api/tracking/recent?limit=20
    """
    try:
        conn = get_db_connection()
        if not conn:
            return {"visitors": []}
        
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                session_id,
                page_url,
                page_title,
                time_on_page_seconds,
                scroll_depth_percent,
                converted,
                conversion_type,
                visited_at
            FROM website_activity
            ORDER BY visited_at DESC
            LIMIT %s
        """, (limit,))
        
        visitors = []
        for row in cursor.fetchall():
            visitors.append({
                "session_id": row[0],
                "page_url": row[1],
                "page_title": row[2],
                "time_seconds": row[3],
                "scroll_percent": row[4],
                "converted": row[5],
                "conversion_type": row[6],
                "visited_at": row[7].isoformat() if row[7] else None
            })
        
        cursor.close()
        conn.close()
        
        return {"visitors": visitors, "count": len(visitors)}
        
    except Exception as e:
        logger.error(f"❌ Recent visitors error: {e}")
        return {"visitors": [], "error": str(e)}

