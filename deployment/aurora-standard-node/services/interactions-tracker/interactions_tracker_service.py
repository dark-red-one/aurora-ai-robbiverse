#!/usr/bin/env python3
"""
Interactions Tracker Service
Tracks all communications and calculates engagement scores
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

import httpx
import numpy as np
import psycopg2
import redis
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Interactions Tracker", version="1.0.0")

# Database and Redis connections
POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://aurora_app:aurora_password@aurora-postgres:5432/aurora_unified")
REDIS_URL = os.getenv("REDIS_URL", "redis://:aurora_password@redis-sentinel-aurora:26379")

# Redis client
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

class Interaction(BaseModel):
    interaction_type: str  # 'email', 'slack', 'linkedin', 'website', 'phone', 'meeting'
    direction: str  # 'inbound', 'outbound'
    person_id: Optional[str] = None
    company_id: Optional[str] = None
    deal_id: Optional[str] = None
    subject: Optional[str] = None
    content: Optional[str] = None
    source: str
    external_id: Optional[str] = None
    thread_id: Optional[str] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    time_spent_seconds: int = 0
    sentiment: Optional[str] = None
    urgency: Optional[str] = None
    priority: Optional[str] = None

class WebsiteActivity(BaseModel):
    person_id: Optional[str] = None
    company_id: Optional[str] = None
    page_url: str
    page_title: Optional[str] = None
    referrer: Optional[str] = None
    session_id: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    time_on_page_seconds: int = 0
    scroll_depth_percent: int = 0
    bounce: bool = False
    converted: bool = False
    conversion_type: Optional[str] = None
    conversion_value: Optional[float] = None

class EngagementScoreUpdate(BaseModel):
    person_id: Optional[str] = None
    company_id: Optional[str] = None
    recalculate: bool = False

class InteractionsTracker:
    def __init__(self):
        self.db_conn = None
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.engagement_rules = {}
        
    async def connect_db(self):
        """Connect to PostgreSQL database"""
        try:
            self.db_conn = psycopg2.connect(POSTGRES_URL)
            self.db_conn.autocommit = True
            logger.info("✅ Connected to PostgreSQL")
            return True
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False
    
    async def load_engagement_rules(self):
        """Load engagement scoring rules from database"""
        try:
            if not self.db_conn:
                await self.connect_db()
            
            cursor = self.db_conn.cursor()
            cursor.execute("""
                SELECT rule_name, rule_type, conditions, base_score, multiplier, max_score, 
                       decay_hours, decay_factor, priority
                FROM engagement_rules 
                WHERE active = TRUE 
                ORDER BY priority DESC
            """)
            
            rules = cursor.fetchall()
            for rule in rules:
                rule_name, rule_type, conditions, base_score, multiplier, max_score, decay_hours, decay_factor, priority = rule
                self.engagement_rules[rule_name] = {
                    "type": rule_type,
                    "conditions": conditions,
                    "base_score": float(base_score),
                    "multiplier": float(multiplier),
                    "max_score": float(max_score),
                    "decay_hours": decay_hours,
                    "decay_factor": float(decay_factor),
                    "priority": priority
                }
            
            cursor.close()
            logger.info(f"✅ Loaded {len(self.engagement_rules)} engagement rules")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load engagement rules: {e}")
            return False
    
    async def track_interaction(self, interaction: Interaction):
        """Track a new interaction"""
        try:
            if not self.db_conn:
                await self.connect_db()
            
            cursor = self.db_conn.cursor()
            
            # Calculate engagement score
            engagement_score = await self._calculate_engagement_score(interaction)
            
            # Insert interaction
            cursor.execute("""
                INSERT INTO interactions (
                    interaction_type, direction, person_id, company_id, deal_id,
                    subject, content, source, external_id, thread_id,
                    opened_at, clicked_at, replied_at, time_spent_seconds,
                    engagement_score, sentiment, urgency, priority,
                    company_id_tenant, town_id
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) RETURNING id
            """, (
                interaction.interaction_type,
                interaction.direction,
                interaction.person_id,
                interaction.company_id,
                interaction.deal_id,
                interaction.subject,
                interaction.content,
                interaction.source,
                interaction.external_id,
                interaction.thread_id,
                interaction.opened_at,
                interaction.clicked_at,
                interaction.replied_at,
                interaction.time_spent_seconds,
                engagement_score,
                interaction.sentiment,
                interaction.urgency,
                interaction.priority,
                interaction.company_id,  # Assuming same as company_id_tenant
                "00000000-0000-0000-0000-000000000000"  # Default town_id
            ))
            
            interaction_id = cursor.fetchone()[0]
            cursor.close()
            
            # Update person/company engagement scores
            if interaction.person_id:
                await self._update_person_engagement_score(interaction.person_id)
            if interaction.company_id:
                await self._update_company_engagement_score(interaction.company_id)
            
            logger.info(f"✅ Tracked interaction {interaction_id} with score {engagement_score}")
            return {"interaction_id": str(interaction_id), "engagement_score": engagement_score}
            
        except Exception as e:
            logger.error(f"❌ Failed to track interaction: {e}")
            return {"error": str(e)}
    
    async def track_website_activity(self, activity: WebsiteActivity):
        """Track website activity"""
        try:
            if not self.db_conn:
                await self.connect_db()
            
            cursor = self.db_conn.cursor()
            
            # Insert website activity
            cursor.execute("""
                INSERT INTO website_activity (
                    person_id, company_id, page_url, page_title, referrer,
                    session_id, user_agent, ip_address, time_on_page_seconds,
                    scroll_depth_percent, bounce, converted, conversion_type,
                    conversion_value, company_id_tenant, town_id
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) RETURNING id
            """, (
                activity.person_id,
                activity.company_id,
                activity.page_url,
                activity.page_title,
                activity.referrer,
                activity.session_id,
                activity.user_agent,
                activity.ip_address,
                activity.time_on_page_seconds,
                activity.scroll_depth_percent,
                activity.bounce,
                activity.converted,
                activity.conversion_type,
                activity.conversion_value,
                activity.company_id,  # Assuming same as company_id_tenant
                "00000000-0000-0000-0000-000000000000"  # Default town_id
            ))
            
            activity_id = cursor.fetchone()[0]
            cursor.close()
            
            # Update engagement scores
            if activity.person_id:
                await self._update_person_engagement_score(activity.person_id)
            if activity.company_id:
                await self._update_company_engagement_score(activity.company_id)
            
            logger.info(f"✅ Tracked website activity {activity_id}")
            return {"activity_id": str(activity_id)}
            
        except Exception as e:
            logger.error(f"❌ Failed to track website activity: {e}")
            return {"error": str(e)}
    
    async def _calculate_engagement_score(self, interaction: Interaction) -> float:
        """Calculate engagement score for an interaction"""
        try:
            score = 0.0
            
            # Apply engagement rules
            for rule_name, rule in self.engagement_rules.items():
                if await self._rule_matches(rule, interaction):
                    rule_score = rule["base_score"] * rule["multiplier"]
                    score += min(rule_score, rule["max_score"])
            
            # Apply time decay
            if interaction.opened_at:
                hours_ago = (datetime.now() - interaction.opened_at).total_seconds() / 3600
                for rule_name, rule in self.engagement_rules.items():
                    if rule["decay_hours"] and hours_ago > rule["decay_hours"]:
                        decay_periods = hours_ago / rule["decay_hours"]
                        score *= (rule["decay_factor"] ** decay_periods)
            
            # Cap at 1.0
            return min(score, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating engagement score: {e}")
            return 0.0
    
    async def _rule_matches(self, rule: Dict, interaction: Interaction) -> bool:
        """Check if an interaction matches a rule"""
        try:
            conditions = rule["conditions"]
            
            if rule["type"] == "email":
                if interaction.interaction_type != "email":
                    return False
                
                if "action" in conditions:
                    if conditions["action"] == "opened" and not interaction.opened_at:
                        return False
                    if conditions["action"] == "clicked" and not interaction.clicked_at:
                        return False
                    if conditions["action"] == "replied" and not interaction.replied_at:
                        return False
                
                if "count" in conditions:
                    # This would need to be implemented with actual counts
                    pass
            
            elif rule["type"] == "website":
                if interaction.interaction_type != "website":
                    return False
                
                if "time_on_page" in conditions:
                    time_condition = conditions["time_on_page"]
                    if time_condition.startswith(">") and interaction.time_spent_seconds <= int(time_condition[1:]):
                        return False
            
            elif rule["type"] == "interaction":
                if interaction.interaction_type != conditions.get("type"):
                    return False
                if interaction.direction != conditions.get("direction"):
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking rule match: {e}")
            return False
    
    async def _update_person_engagement_score(self, person_id: str):
        """Update engagement score for a person"""
        try:
            if not self.db_conn:
                await self.connect_db()
            
            cursor = self.db_conn.cursor()
            
            # Calculate scores by type
            cursor.execute("""
                SELECT 
                    interaction_type,
                    COUNT(*) as count,
                    AVG(engagement_score) as avg_score,
                    MAX(created_at) as last_interaction
                FROM interactions 
                WHERE person_id = %s 
                GROUP BY interaction_type
            """, (person_id,))
            
            type_scores = cursor.fetchall()
            
            # Calculate overall scores
            total_score = 0.0
            email_score = 0.0
            website_score = 0.0
            social_score = 0.0
            meeting_score = 0.0
            
            total_interactions = 0
            email_interactions = 0
            website_visits = 0
            social_interactions = 0
            meetings = 0
            
            last_interaction_at = None
            
            for interaction_type, count, avg_score, last_interaction in type_scores:
                total_interactions += count
                total_score += avg_score * count
                
                if interaction_type == "email":
                    email_score = float(avg_score) if avg_score else 0.0
                    email_interactions = count
                elif interaction_type == "website":
                    website_score = float(avg_score) if avg_score else 0.0
                    website_visits = count
                elif interaction_type in ["linkedin", "slack"]:
                    social_score += float(avg_score) if avg_score else 0.0
                    social_interactions += count
                elif interaction_type == "meeting":
                    meeting_score = float(avg_score) if avg_score else 0.0
                    meetings = count
                
                if last_interaction and (not last_interaction_at or last_interaction > last_interaction_at):
                    last_interaction_at = last_interaction
            
            # Normalize total score
            if total_interactions > 0:
                total_score = total_score / total_interactions
            
            # Calculate trends (simplified)
            score_trend = "stable"
            activity_trend = "stable"
            
            # Upsert person engagement score
            cursor.execute("""
                INSERT INTO person_engagement_scores (
                    person_id, total_score, email_score, website_score, social_score, meeting_score,
                    total_interactions, email_interactions, website_visits, social_interactions, meetings,
                    last_interaction_at, score_trend, activity_trend
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) ON CONFLICT (person_id) DO UPDATE SET
                    total_score = EXCLUDED.total_score,
                    email_score = EXCLUDED.email_score,
                    website_score = EXCLUDED.website_score,
                    social_score = EXCLUDED.social_score,
                    meeting_score = EXCLUDED.meeting_score,
                    total_interactions = EXCLUDED.total_interactions,
                    email_interactions = EXCLUDED.email_interactions,
                    website_visits = EXCLUDED.website_visits,
                    social_interactions = EXCLUDED.social_interactions,
                    meetings = EXCLUDED.meetings,
                    last_interaction_at = EXCLUDED.last_interaction_at,
                    score_trend = EXCLUDED.score_trend,
                    activity_trend = EXCLUDED.activity_trend,
                    updated_at = CURRENT_TIMESTAMP
            """, (
                person_id, total_score, email_score, website_score, social_score, meeting_score,
                total_interactions, email_interactions, website_visits, social_interactions, meetings,
                last_interaction_at, score_trend, activity_trend
            ))
            
            cursor.close()
            logger.info(f"✅ Updated engagement score for person {person_id}: {total_score:.2f}")
            
        except Exception as e:
            logger.error(f"❌ Failed to update person engagement score: {e}")
    
    async def _update_company_engagement_score(self, company_id: str):
        """Update engagement score for a company"""
        try:
            if not self.db_conn:
                await self.connect_db()
            
            cursor = self.db_conn.cursor()
            
            # Calculate scores by type
            cursor.execute("""
                SELECT 
                    interaction_type,
                    COUNT(*) as count,
                    AVG(engagement_score) as avg_score,
                    COUNT(DISTINCT person_id) as unique_people,
                    MAX(created_at) as last_interaction
                FROM interactions 
                WHERE company_id = %s 
                GROUP BY interaction_type
            """, (company_id,))
            
            type_scores = cursor.fetchall()
            
            # Calculate overall scores
            total_score = 0.0
            email_score = 0.0
            website_score = 0.0
            social_score = 0.0
            meeting_score = 0.0
            
            total_interactions = 0
            unique_people_interacted = 0
            email_interactions = 0
            website_visits = 0
            social_interactions = 0
            meetings = 0
            
            last_interaction_at = None
            
            for interaction_type, count, avg_score, unique_people, last_interaction in type_scores:
                total_interactions += count
                unique_people_interacted = max(unique_people_interacted, unique_people)
                total_score += avg_score * count
                
                if interaction_type == "email":
                    email_score = float(avg_score) if avg_score else 0.0
                    email_interactions = count
                elif interaction_type == "website":
                    website_score = float(avg_score) if avg_score else 0.0
                    website_visits = count
                elif interaction_type in ["linkedin", "slack"]:
                    social_score += float(avg_score) if avg_score else 0.0
                    social_interactions += count
                elif interaction_type == "meeting":
                    meeting_score = float(avg_score) if avg_score else 0.0
                    meetings = count
                
                if last_interaction and (not last_interaction_at or last_interaction > last_interaction_at):
                    last_interaction_at = last_interaction
            
            # Normalize total score
            if total_interactions > 0:
                total_score = total_score / total_interactions
            
            # Calculate trends (simplified)
            score_trend = "stable"
            activity_trend = "stable"
            
            # Upsert company engagement score
            cursor.execute("""
                INSERT INTO company_engagement_scores (
                    company_id, total_score, email_score, website_score, social_score, meeting_score,
                    total_interactions, unique_people_interacted, email_interactions, website_visits, 
                    social_interactions, meetings, last_interaction_at, score_trend, activity_trend
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) ON CONFLICT (company_id) DO UPDATE SET
                    total_score = EXCLUDED.total_score,
                    email_score = EXCLUDED.email_score,
                    website_score = EXCLUDED.website_score,
                    social_score = EXCLUDED.social_score,
                    meeting_score = EXCLUDED.meeting_score,
                    total_interactions = EXCLUDED.total_interactions,
                    unique_people_interacted = EXCLUDED.unique_people_interacted,
                    email_interactions = EXCLUDED.email_interactions,
                    website_visits = EXCLUDED.website_visits,
                    social_interactions = EXCLUDED.social_interactions,
                    meetings = EXCLUDED.meetings,
                    last_interaction_at = EXCLUDED.last_interaction_at,
                    score_trend = EXCLUDED.score_trend,
                    activity_trend = EXCLUDED.activity_trend,
                    updated_at = CURRENT_TIMESTAMP
            """, (
                company_id, total_score, email_score, website_score, social_score, meeting_score,
                total_interactions, unique_people_interacted, email_interactions, website_visits,
                social_interactions, meetings, last_interaction_at, score_trend, activity_trend
            ))
            
            cursor.close()
            logger.info(f"✅ Updated engagement score for company {company_id}: {total_score:.2f}")
            
        except Exception as e:
            logger.error(f"❌ Failed to update company engagement score: {e}")

# Initialize tracker
tracker = InteractionsTracker()

@app.on_event("startup")
async def startup():
    """Initialize service on startup"""
    await tracker.connect_db()
    await tracker.load_engagement_rules()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "interactions-tracker"}

@app.post("/api/interactions/track")
async def track_interaction(interaction: Interaction, background_tasks: BackgroundTasks):
    """Track a new interaction"""
    result = await tracker.track_interaction(interaction)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@app.post("/api/website/track")
async def track_website_activity(activity: WebsiteActivity, background_tasks: BackgroundTasks):
    """Track website activity"""
    result = await tracker.track_website_activity(activity)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@app.post("/api/engagement/recalculate")
async def recalculate_engagement_scores(update: EngagementScoreUpdate, background_tasks: BackgroundTasks):
    """Recalculate engagement scores"""
    if update.person_id:
        background_tasks.add_task(tracker._update_person_engagement_score, update.person_id)
    if update.company_id:
        background_tasks.add_task(tracker._update_company_engagement_score, update.company_id)
    
    return {"message": "Engagement score recalculation started"}

@app.get("/api/engagement/person/{person_id}")
async def get_person_engagement_score(person_id: str):
    """Get engagement score for a person"""
    try:
        if not tracker.db_conn:
            await tracker.connect_db()
        
        cursor = tracker.db_conn.cursor()
        cursor.execute("""
            SELECT * FROM person_engagement_scores WHERE person_id = %s
        """, (person_id,))
        
        result = cursor.fetchone()
        cursor.close()
        
        if result:
            return {
                "person_id": result[1],
                "total_score": float(result[2]),
                "email_score": float(result[3]),
                "website_score": float(result[4]),
                "social_score": float(result[5]),
                "meeting_score": float(result[6]),
                "total_interactions": result[7],
                "last_interaction_at": result[12].isoformat() if result[12] else None
            }
        else:
            return {"person_id": person_id, "total_score": 0.0, "message": "No engagement data"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/engagement/company/{company_id}")
async def get_company_engagement_score(company_id: str):
    """Get engagement score for a company"""
    try:
        if not tracker.db_conn:
            await tracker.connect_db()
        
        cursor = tracker.db_conn.cursor()
        cursor.execute("""
            SELECT * FROM company_engagement_scores WHERE company_id = %s
        """, (company_id,))
        
        result = cursor.fetchone()
        cursor.close()
        
        if result:
            return {
                "company_id": result[1],
                "total_score": float(result[2]),
                "email_score": float(result[3]),
                "website_score": float(result[4]),
                "social_score": float(result[5]),
                "meeting_score": float(result[6]),
                "total_interactions": result[7],
                "unique_people_interacted": result[8],
                "last_interaction_at": result[13].isoformat() if result[13] else None
            }
        else:
            return {"company_id": company_id, "total_score": 0.0, "message": "No engagement data"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8016)
