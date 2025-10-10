#!/usr/bin/env python3
"""
Campaign Manager Service
Track marketing campaigns, ROI, and multi-channel attribution
Part of Robbie@Growth marketing platform
"""

import os
import json
import logging
from datetime import datetime, date
from typing import Dict, List, Optional
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "robbieverse")
POSTGRES_USER = os.getenv("POSTGRES_USER", "robbie")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

# ============================================================================
# MODELS
# ============================================================================

class Campaign(BaseModel):
    """Marketing campaign"""
    name: str
    description: Optional[str] = None
    goal: Optional[str] = None
    budget_allocated: Decimal = Decimal("0")
    start_date: date
    end_date: Optional[date] = None
    channels: List[str] = []  # ['linkedin', 'twitter', 'email']
    target_metrics: Dict = {}  # {leads: 100, conversions: 10, revenue: 120000}
    owner: Optional[str] = None
    utm_campaign: Optional[str] = None
    metadata: Dict = {}

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
# CAMPAIGN MANAGEMENT
# ============================================================================

def create_campaign(campaign: Campaign) -> Dict:
    """Create a new marketing campaign"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO marketing_campaigns
                (name, description, goal, budget_allocated, start_date, end_date,
                 channels, target_metrics, owner, utm_campaign, metadata, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'planning')
                RETURNING id, name, budget_allocated, start_date, status
            """, (
                campaign.name,
                campaign.description,
                campaign.goal,
                campaign.budget_allocated,
                campaign.start_date,
                campaign.end_date,
                json.dumps(campaign.channels),
                json.dumps(campaign.target_metrics),
                campaign.owner,
                campaign.utm_campaign,
                json.dumps(campaign.metadata)
            ))
            
            result = cur.fetchone()
            conn.commit()
            
            logger.info(f"✅ Created campaign: {result['name']} (${result['budget_allocated']})")
            return {
                "success": True,
                "campaign_id": str(result["id"]),
                "name": result["name"],
                "budget": float(result["budget_allocated"]),
                "status": result["status"]
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to create campaign: {e}")
        conn.rollback()
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

def update_campaign_status(campaign_id: str, status: str) -> Dict:
    """Update campaign status"""
    conn = get_db_connection()
    
    valid_statuses = ['planning', 'active', 'paused', 'completed', 'cancelled']
    if status not in valid_statuses:
        return {"success": False, "error": f"Invalid status. Must be one of: {valid_statuses}"}
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE marketing_campaigns
                SET status = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, name, status
            """, (status, campaign_id))
            
            result = cur.fetchone()
            
            if not result:
                return {"success": False, "error": "Campaign not found"}
            
            conn.commit()
            
            logger.info(f"✅ Updated campaign {result['name']} status to {status}")
            return {
                "success": True,
                "campaign_id": str(result["id"]),
                "name": result["name"],
                "status": result["status"]
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to update campaign status: {e}")
        conn.rollback()
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

def update_campaign_metrics(campaign_id: str, metrics: Dict) -> Dict:
    """Update campaign performance metrics"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get current metrics
            cur.execute("""
                SELECT actual_metrics, budget_spent
                FROM marketing_campaigns
                WHERE id = %s
            """, (campaign_id,))
            
            campaign = cur.fetchone()
            if not campaign:
                return {"success": False, "error": "Campaign not found"}
            
            # Merge new metrics with existing
            current_metrics = campaign["actual_metrics"] or {}
            updated_metrics = {**current_metrics, **metrics}
            
            # Calculate ROI if we have revenue and cost
            revenue = Decimal(str(updated_metrics.get("revenue", 0)))
            cost = campaign["budget_spent"] or Decimal("0")
            
            roi = None
            roi_percentage = None
            if cost > 0:
                roi = (revenue - cost) / cost
                roi_percentage = roi * 100
            
            # Update campaign
            cur.execute("""
                UPDATE marketing_campaigns
                SET actual_metrics = %s,
                    roi = %s,
                    roi_percentage = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, name, actual_metrics, roi, roi_percentage
            """, (
                json.dumps(updated_metrics),
                roi,
                roi_percentage,
                campaign_id
            ))
            
            result = cur.fetchone()
            conn.commit()
            
            logger.info(f"✅ Updated metrics for campaign {result['name']} - ROI: {result['roi_percentage']}%")
            return {
                "success": True,
                "campaign_id": str(result["id"]),
                "metrics": result["actual_metrics"],
                "roi": float(result["roi"]) if result["roi"] else None,
                "roi_percentage": float(result["roi_percentage"]) if result["roi_percentage"] else None
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to update campaign metrics: {e}")
        conn.rollback()
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

def record_campaign_spend(campaign_id: str, amount: Decimal, description: str) -> Dict:
    """Record spend against a campaign"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE marketing_campaigns
                SET budget_spent = budget_spent + %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, name, budget_allocated, budget_spent
            """, (amount, campaign_id))
            
            result = cur.fetchone()
            
            if not result:
                return {"success": False, "error": "Campaign not found"}
            
            conn.commit()
            
            logger.info(f"✅ Recorded ${amount} spend for campaign {result['name']}")
            return {
                "success": True,
                "campaign_id": str(result["id"]),
                "budget_allocated": float(result["budget_allocated"]),
                "budget_spent": float(result["budget_spent"]),
                "remaining": float(result["budget_allocated"] - result["budget_spent"])
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to record campaign spend: {e}")
        conn.rollback()
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

def get_campaigns(
    status: Optional[str] = None,
    owner: Optional[str] = None,
    active_only: bool = False
) -> List[Dict]:
    """Get campaigns with filters"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = """
                SELECT 
                    id,
                    name,
                    description,
                    goal,
                    budget_allocated,
                    budget_spent,
                    (budget_allocated - budget_spent) as budget_remaining,
                    start_date,
                    end_date,
                    channels,
                    target_metrics,
                    actual_metrics,
                    roi,
                    roi_percentage,
                    status,
                    owner,
                    utm_campaign,
                    created_at,
                    updated_at
                FROM marketing_campaigns
                WHERE 1=1
            """
            params = []
            
            if status:
                query += " AND status = %s"
                params.append(status)
            
            if owner:
                query += " AND owner = %s"
                params.append(owner)
            
            if active_only:
                query += " AND status = 'active'"
            
            query += " ORDER BY start_date DESC, name ASC"
            
            cur.execute(query, params)
            campaigns = cur.fetchall()
            
            return [dict(campaign) for campaign in campaigns]
            
    finally:
        conn.close()

def get_campaign_performance(campaign_id: str) -> Dict:
    """Get detailed campaign performance"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get campaign data
            cur.execute("""
                SELECT * FROM marketing_campaigns WHERE id = %s
            """, (campaign_id,))
            
            campaign = cur.fetchone()
            if not campaign:
                return {"success": False, "error": "Campaign not found"}
            
            # Get performance history (daily snapshots)
            cur.execute("""
                SELECT 
                    snapshot_date,
                    metrics,
                    spend_to_date,
                    revenue_to_date,
                    roi_to_date
                FROM campaign_performance
                WHERE campaign_id = %s
                ORDER BY snapshot_date ASC
            """, (campaign_id,))
            
            performance_history = cur.fetchall()
            
            # Get associated Buffer posts
            cur.execute("""
                SELECT 
                    COUNT(*) as post_count,
                    SUM((engagement->>'likes')::int) as total_likes,
                    SUM((engagement->>'comments')::int) as total_comments,
                    SUM((engagement->>'shares')::int) as total_shares,
                    SUM((engagement->>'clicks')::int) as total_clicks,
                    SUM((engagement->>'impressions')::int) as total_impressions
                FROM buffer_posts
                WHERE campaign_id = %s
            """, (campaign_id,))
            
            social_stats = cur.fetchone()
            
            # Get associated deals (revenue attribution)
            cur.execute("""
                SELECT 
                    COUNT(*) as deal_count,
                    SUM(amount) as total_revenue,
                    AVG(amount) as avg_deal_size
                FROM crm_deals
                WHERE lead_source = %s
            """, (campaign["utm_campaign"],))
            
            revenue_stats = cur.fetchone()
            
            # Calculate key metrics
            actual_metrics = campaign["actual_metrics"] or {}
            target_metrics = campaign["target_metrics"] or {}
            
            metrics_comparison = {}
            for key in target_metrics:
                target = target_metrics.get(key, 0)
                actual = actual_metrics.get(key, 0)
                metrics_comparison[key] = {
                    "target": target,
                    "actual": actual,
                    "percentage": round((actual / target * 100) if target > 0 else 0, 2)
                }
            
            return {
                "success": True,
                "campaign": dict(campaign),
                "metrics_comparison": metrics_comparison,
                "performance_history": [dict(p) for p in performance_history],
                "social_stats": dict(social_stats) if social_stats else {},
                "revenue_stats": dict(revenue_stats) if revenue_stats else {}
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to get campaign performance: {e}")
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

def get_roi_dashboard() -> Dict:
    """Get ROI dashboard across all campaigns"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get from campaign_roi_analysis view
            cur.execute("""
                SELECT * FROM campaign_roi_analysis
                ORDER BY roi DESC NULLS LAST
                LIMIT 20
            """)
            
            campaigns = cur.fetchall()
            
            # Overall summary
            cur.execute("""
                SELECT 
                    COUNT(*) as total_campaigns,
                    SUM(budget_allocated) as total_budget,
                    SUM(budget_spent) as total_spent,
                    SUM((actual_metrics->>'revenue')::numeric) as total_revenue,
                    SUM((actual_metrics->>'leads')::integer) as total_leads,
                    SUM((actual_metrics->>'conversions')::integer) as total_conversions,
                    AVG(roi_percentage) as avg_roi_percentage
                FROM marketing_campaigns
                WHERE status IN ('active', 'completed')
            """)
            
            summary = cur.fetchone()
            
            # Best performing campaigns
            cur.execute("""
                SELECT name, roi_percentage, 
                       (actual_metrics->>'revenue')::numeric as revenue,
                       budget_spent
                FROM marketing_campaigns
                WHERE status IN ('active', 'completed')
                AND roi_percentage IS NOT NULL
                ORDER BY roi_percentage DESC
                LIMIT 5
            """)
            
            top_performers = cur.fetchall()
            
            # Channel performance
            cur.execute("""
                SELECT 
                    channel,
                    COUNT(*) as campaign_count,
                    SUM(budget_spent) as total_spent,
                    SUM((actual_metrics->>'revenue')::numeric) as total_revenue,
                    AVG(roi_percentage) as avg_roi
                FROM marketing_campaigns,
                     jsonb_array_elements_text(channels) as channel
                WHERE status IN ('active', 'completed')
                GROUP BY channel
                ORDER BY avg_roi DESC NULLS LAST
            """)
            
            channel_performance = cur.fetchall()
            
            return {
                "success": True,
                "summary": dict(summary) if summary else {},
                "campaigns": [dict(c) for c in campaigns],
                "top_performers": [dict(t) for t in top_performers],
                "channel_performance": [dict(c) for c in channel_performance]
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to get ROI dashboard: {e}")
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

def create_performance_snapshot(campaign_id: str) -> Dict:
    """Create a daily performance snapshot"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO campaign_performance
                (campaign_id, snapshot_date, metrics, spend_to_date, revenue_to_date, roi_to_date)
                SELECT 
                    id,
                    CURRENT_DATE,
                    actual_metrics,
                    budget_spent,
                    (actual_metrics->>'revenue')::numeric,
                    roi
                FROM marketing_campaigns
                WHERE id = %s
                ON CONFLICT (campaign_id, snapshot_date)
                DO UPDATE SET
                    metrics = EXCLUDED.metrics,
                    spend_to_date = EXCLUDED.spend_to_date,
                    revenue_to_date = EXCLUDED.revenue_to_date,
                    roi_to_date = EXCLUDED.roi_to_date
                RETURNING id, snapshot_date
            """, (campaign_id,))
            
            result = cur.fetchone()
            conn.commit()
            
            return {"success": True, "snapshot_id": str(result["id"])}
            
    except Exception as e:
        logger.error(f"❌ Failed to create performance snapshot: {e}")
        conn.rollback()
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print("🧪 Testing Campaign Manager Service")
    
    # Get ROI dashboard
    dashboard = get_roi_dashboard()
    print(f"ROI Dashboard: {json.dumps(dashboard, indent=2, default=str)}")
    
    # Get active campaigns
    active_campaigns = get_campaigns(active_only=True)
    print(f"Active Campaigns: {len(active_campaigns)}")


