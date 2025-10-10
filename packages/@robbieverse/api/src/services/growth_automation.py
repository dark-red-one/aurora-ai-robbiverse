#!/usr/bin/env python3
"""
Growth Automation Engine
Intelligent LinkedIn automation with approval workflows and guardrails
Part of Robbie@Growth marketing platform
"""

import os
import json
import logging
from datetime import datetime, time
from typing import Dict, List, Optional, Tuple
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

class LinkedInAction(BaseModel):
    """LinkedIn action to queue"""
    action_type: str  # 'post', 'comment', 'dm', 'connection_request', 'like', 'share'
    target_profile_url: Optional[str] = None
    target_post_url: Optional[str] = None
    content: Optional[str] = None
    reason: str  # Why Robbie wants to do this
    quality_score: int = 7  # 1-10
    priority: int = 5  # 1-10
    contact_id: Optional[str] = None
    deal_id: Optional[str] = None
    campaign_id: Optional[str] = None
    metadata: Dict = {}

class AutomationSettings(BaseModel):
    """Automation settings for a user"""
    automation_level: int = 50  # 0-100
    action_settings: Dict = {}
    guardrails: Dict = {}
    notification_settings: Dict = {}

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
# AUTOMATION SETTINGS
# ============================================================================

def get_automation_settings(user_id: int) -> Dict:
    """Get automation settings for a user"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT * FROM growth_automation_settings
                WHERE user_id = %s
            """, (user_id,))
            
            settings = cur.fetchone()
            
            if not settings:
                # Create default settings
                cur.execute("""
                    INSERT INTO growth_automation_settings (user_id)
                    VALUES (%s)
                    RETURNING *
                """, (user_id,))
                settings = cur.fetchone()
                conn.commit()
            
            return {"success": True, "settings": dict(settings)}
            
    except Exception as e:
        logger.error(f"❌ Failed to get automation settings: {e}")
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

def update_automation_level(user_id: int, level: int) -> Dict:
    """Update automation level (0-100)"""
    if level < 0 or level > 100:
        return {"success": False, "error": "Level must be between 0 and 100"}
    
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE growth_automation_settings
                SET automation_level = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s
                RETURNING automation_level
            """, (level, user_id))
            
            result = cur.fetchone()
            conn.commit()
            
            logger.info(f"✅ Updated automation level to {level}% for user {user_id}")
            return {"success": True, "level": result["automation_level"]}
            
    except Exception as e:
        logger.error(f"❌ Failed to update automation level: {e}")
        conn.rollback()
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

def update_action_settings(user_id: int, action_type: str, settings: Dict) -> Dict:
    """Update settings for a specific action type"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE growth_automation_settings
                SET action_settings = jsonb_set(
                        action_settings,
                        %s,
                        %s::jsonb
                    ),
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s
                RETURNING action_settings
            """, ([action_type], json.dumps(settings), user_id))
            
            result = cur.fetchone()
            conn.commit()
            
            logger.info(f"✅ Updated {action_type} settings for user {user_id}")
            return {"success": True, "action_settings": result["action_settings"]}
            
    except Exception as e:
        logger.error(f"❌ Failed to update action settings: {e}")
        conn.rollback()
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

# ============================================================================
# LINKEDIN ACTION QUEUE
# ============================================================================

def queue_action(action: LinkedInAction) -> Dict:
    """Queue a LinkedIn action for approval/execution"""
    conn = get_db_connection()
    
    try:
        # Get user's automation settings (assume user_id 1 for now - should come from context)
        settings_result = get_automation_settings(1)
        if not settings_result["success"]:
            return settings_result
        
        settings = settings_result["settings"]
        action_settings = settings["action_settings"].get(f"linkedin_{action.action_type}", {})
        guardrails = settings["guardrails"]
        
        # Check if action type is enabled
        if not action_settings.get("enabled", False):
            return {"success": False, "error": f"{action.action_type} actions are disabled"}
        
        # Check quality score threshold
        min_quality = guardrails.get("min_quality_score", 7)
        if action.quality_score < min_quality:
            return {
                "success": False,
                "error": f"Quality score {action.quality_score} below minimum {min_quality}"
            }
        
        # Check daily limits
        max_per_day = action_settings.get("max_per_day", 10)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT COUNT(*) as count
                FROM linkedin_action_queue
                WHERE action_type = %s
                AND DATE(created_at) = CURRENT_DATE
                AND status IN ('pending', 'approved', 'executed')
            """, (action.action_type,))
            
            today_count = cur.fetchone()["count"]
            
            if today_count >= max_per_day:
                return {
                    "success": False,
                    "error": f"Daily limit reached for {action.action_type} ({max_per_day})"
                }
        
        # Determine if approval is required
        requires_approval = action_settings.get("requires_approval", True)
        automation_level = settings["automation_level"]
        
        # At 100% automation, some actions don't need approval
        if automation_level == 100 and action.action_type in ['like', 'comment']:
            requires_approval = False
        
        # Queue the action
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO linkedin_action_queue
                (action_type, target_profile_url, target_post_url, content, reason,
                 quality_score, priority, requires_approval, contact_id, deal_id,
                 campaign_id, metadata, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
                RETURNING id, action_type, requires_approval, status
            """, (
                action.action_type,
                action.target_profile_url,
                action.target_post_url,
                action.content,
                action.reason,
                action.quality_score,
                action.priority,
                requires_approval,
                action.contact_id,
                action.deal_id,
                action.campaign_id,
                json.dumps(action.metadata)
            ))
            
            result = cur.fetchone()
            conn.commit()
            
            logger.info(f"✅ Queued {result['action_type']} action - Approval required: {result['requires_approval']}")
            return {
                "success": True,
                "action_id": str(result["id"]),
                "action_type": result["action_type"],
                "requires_approval": result["requires_approval"],
                "status": result["status"]
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to queue action: {e}")
        conn.rollback()
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

def approve_action(action_id: str, approved_by: str) -> Dict:
    """Approve a queued action"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE linkedin_action_queue
                SET status = 'approved',
                    approved_by = %s,
                    approved_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND status = 'pending'
                RETURNING id, action_type, content
            """, (approved_by, action_id))
            
            result = cur.fetchone()
            
            if not result:
                return {"success": False, "error": "Action not found or already processed"}
            
            conn.commit()
            
            logger.info(f"✅ Approved {result['action_type']} action by {approved_by}")
            return {
                "success": True,
                "action_id": str(result["id"]),
                "status": "approved",
                "ready_for_execution": True
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to approve action: {e}")
        conn.rollback()
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

def reject_action(action_id: str, approved_by: str, reason: Optional[str] = None) -> Dict:
    """Reject a queued action"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE linkedin_action_queue
                SET status = 'rejected',
                    approved_by = %s,
                    approved_at = CURRENT_TIMESTAMP,
                    error_message = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND status = 'pending'
                RETURNING id, action_type
            """, (approved_by, reason, action_id))
            
            result = cur.fetchone()
            
            if not result:
                return {"success": False, "error": "Action not found or already processed"}
            
            conn.commit()
            
            logger.info(f"✅ Rejected {result['action_type']} action by {approved_by}")
            return {
                "success": True,
                "action_id": str(result["id"]),
                "status": "rejected"
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to reject action: {e}")
        conn.rollback()
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

def get_pending_actions(limit: int = 20) -> List[Dict]:
    """Get actions awaiting approval"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT * FROM get_pending_approvals(%s)
            """, (limit,))
            
            actions = cur.fetchall()
            return [dict(action) for action in actions]
            
    finally:
        conn.close()

def get_approved_actions(limit: int = 50) -> List[Dict]:
    """Get actions ready for execution"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    laq.*,
                    c.first_name,
                    c.last_name,
                    c.email,
                    d.name as deal_name,
                    d.stage as deal_stage
                FROM linkedin_action_queue laq
                LEFT JOIN crm_contacts c ON c.id = laq.contact_id
                LEFT JOIN crm_deals d ON d.id = laq.deal_id
                WHERE laq.status = 'approved'
                AND laq.executed_at IS NULL
                ORDER BY laq.priority DESC, laq.created_at ASC
                LIMIT %s
            """, (limit,))
            
            actions = cur.fetchall()
            return [dict(action) for action in actions]
            
    finally:
        conn.close()

def mark_action_executed(action_id: str, result: Dict) -> Dict:
    """Mark an action as executed"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE linkedin_action_queue
                SET status = 'executed',
                    executed_at = CURRENT_TIMESTAMP,
                    result = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, action_type
            """, (json.dumps(result), action_id))
            
            action = cur.fetchone()
            
            if not action:
                return {"success": False, "error": "Action not found"}
            
            conn.commit()
            
            logger.info(f"✅ Marked {action['action_type']} action as executed")
            return {"success": True, "action_id": str(action["id"])}
            
    except Exception as e:
        logger.error(f"❌ Failed to mark action executed: {e}")
        conn.rollback()
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

# ============================================================================
# LEAD SCORING
# ============================================================================

def calculate_and_store_lead_score(contact_id: str) -> Dict:
    """Calculate lead score using database function"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Calculate score
            cur.execute("""
                SELECT calculate_lead_score(%s) as score
            """, (contact_id,))
            
            score = cur.fetchone()["score"]
            
            # Determine temperature
            if score >= 70:
                temperature = "hot"
            elif score >= 40:
                temperature = "warm"
            else:
                temperature = "cold"
            
            # Update or insert score
            cur.execute("""
                INSERT INTO linkedin_lead_scores
                (contact_id, score, temperature, updated_at)
                VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (contact_id)
                DO UPDATE SET
                    score = EXCLUDED.score,
                    temperature = EXCLUDED.temperature,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id, score, temperature
            """, (contact_id, score, temperature))
            
            result = cur.fetchone()
            conn.commit()
            
            logger.info(f"✅ Lead score for contact {contact_id}: {score} ({temperature})")
            return {
                "success": True,
                "contact_id": contact_id,
                "score": score,
                "temperature": temperature
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to calculate lead score: {e}")
        conn.rollback()
        return {"success": False, "error": str(e)}
        
    finally:
        conn.close()

def get_hot_leads(limit: int = 20) -> List[Dict]:
    """Get hot leads from LinkedIn engagement"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT * FROM linkedin_engagement_pipeline
                WHERE temperature = 'hot'
                ORDER BY score DESC
                LIMIT %s
            """, (limit,))
            
            leads = cur.fetchall()
            return [dict(lead) for lead in leads]
            
    finally:
        conn.close()

# ============================================================================
# GUARDRAIL CHECKS
# ============================================================================

def check_quiet_hours() -> Tuple[bool, str]:
    """Check if current time is within quiet hours"""
    now = datetime.now().time()
    quiet_start = time(22, 0)  # 10 PM
    quiet_end = time(7, 0)     # 7 AM
    
    if quiet_start <= now or now <= quiet_end:
        return False, "Outside quiet hours (10PM-7AM)"
    
    return True, "OK"

def check_content_quality(content: str, guardrails: Dict) -> Tuple[bool, str]:
    """Check if content meets quality guidelines"""
    blacklist = guardrails.get("blacklist_keywords", [])
    
    content_lower = content.lower()
    for keyword in blacklist:
        if keyword.lower() in content_lower:
            return False, f"Contains blacklisted keyword: {keyword}"
    
    # Check length
    if len(content) < 10:
        return False, "Content too short"
    
    if len(content) > 3000:
        return False, "Content too long"
    
    return True, "OK"

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print("🧪 Testing Growth Automation Engine")
    
    # Get automation settings
    settings = get_automation_settings(1)
    print(f"Settings: {json.dumps(settings, indent=2, default=str)}")
    
    # Get pending actions
    pending = get_pending_actions()
    print(f"Pending Actions: {len(pending)}")
    
    # Get hot leads
    hot_leads = get_hot_leads(10)
    print(f"Hot Leads: {len(hot_leads)}")


