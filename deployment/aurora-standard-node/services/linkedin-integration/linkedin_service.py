#!/usr/bin/env python3
"""
LinkedIn Integration Service
Tracks VIPs (deal board contacts) and their LinkedIn activity
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import httpx
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="LinkedIn Integration Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "aurora_unified")
POSTGRES_USER = os.getenv("POSTGRES_USER", "aurora_app")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")

# LinkedIn credentials
LINKEDIN_EMAIL = os.getenv("LINKEDIN_EMAIL", "")
LINKEDIN_PASSWORD = os.getenv("LINKEDIN_PASSWORD", "")
LINKEDIN_API_KEY = os.getenv("LINKEDIN_API_KEY", "")

# Redis client
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD,
    decode_responses=True
)

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD
    )

# Pydantic models
class LinkedInProfile(BaseModel):
    profile_url: str
    name: str
    headline: str
    location: str
    connections: int
    followers: int
    last_activity: datetime
    profile_picture: str

class LinkedInPost(BaseModel):
    post_id: str
    author_name: str
    author_url: str
    content: str
    post_type: str  # text, image, video, article
    engagement: Dict[str, int]  # likes, comments, shares
    posted_at: datetime
    hashtags: List[str]
    mentions: List[str]

class LinkedInMessage(BaseModel):
    message_id: str
    sender_name: str
    sender_url: str
    content: str
    sent_at: datetime
    message_type: str  # connection_request, message, inmail
    is_read: bool

# LinkedIn scraper class
class LinkedInScraper:
    def __init__(self, email: str, password: str):
        self.email = email
        self.password = password
        self.driver = None
        self.wait = None

    def setup_driver(self):
        """Setup Chrome driver with stealth options"""
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        
        self.driver = webdriver.Chrome(
            service=webdriver.chrome.service.Service(ChromeDriverManager().install()),
            options=chrome_options
        )
        self.wait = WebDriverWait(self.driver, 10)

    def login(self):
        """Login to LinkedIn"""
        try:
            self.driver.get("https://www.linkedin.com/login")
            
            # Enter email
            email_field = self.wait.until(
                EC.presence_of_element_located((By.ID, "username"))
            )
            email_field.send_keys(self.email)
            
            # Enter password
            password_field = self.driver.find_element(By.ID, "password")
            password_field.send_keys(self.password)
            
            # Click login
            login_button = self.driver.find_element(By.XPATH, "//button[@type='submit']")
            login_button.click()
            
            # Wait for dashboard
            self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "global-nav"))
            )
            
            logger.info("✅ LinkedIn login successful")
            return True
            
        except Exception as e:
            logger.error(f"❌ LinkedIn login failed: {e}")
            return False

    def get_profile_info(self, profile_url: str) -> Optional[LinkedInProfile]:
        """Get LinkedIn profile information"""
        try:
            self.driver.get(profile_url)
            self.wait.until(EC.presence_of_element_located((By.CLASS_NAME, "pv-text-details__left-panel")))
            
            # Extract profile data
            name = self.driver.find_element(By.CSS_SELECTOR, "h1.text-heading-xlarge").text
            headline = self.driver.find_element(By.CSS_SELECTOR, ".text-body-medium.break-words").text
            location = self.driver.find_element(By.CSS_SELECTOR, ".text-body-small.inline.t-black--light.break-words").text
            
            # Get connection count
            try:
                connections_element = self.driver.find_element(By.CSS_SELECTOR, ".pv-top-card--list-bullet .t-bold")
                connections = int(connections_element.text.replace(",", ""))
            except:
                connections = 0
            
            # Get follower count
            try:
                followers_element = self.driver.find_element(By.CSS_SELECTOR, ".pv-top-card--list-bullet .t-bold")
                followers = int(followers_element.text.replace(",", ""))
            except:
                followers = 0
            
            # Get profile picture
            try:
                profile_pic = self.driver.find_element(By.CSS_SELECTOR, ".pv-top-card-profile-picture__image").get_attribute("src")
            except:
                profile_pic = ""
            
            return LinkedInProfile(
                profile_url=profile_url,
                name=name,
                headline=headline,
                location=location,
                connections=connections,
                followers=followers,
                last_activity=datetime.now(),
                profile_picture=profile_pic
            )
            
        except Exception as e:
            logger.error(f"❌ Failed to get profile info for {profile_url}: {e}")
            return None

    def get_recent_posts(self, profile_url: str, limit: int = 10) -> List[LinkedInPost]:
        """Get recent posts from a LinkedIn profile"""
        try:
            activity_url = f"{profile_url}/recent-activity/all/"
            self.driver.get(activity_url)
            self.wait.until(EC.presence_of_element_located((By.CLASS_NAME, "feed-shared-update-v2")))
            
            posts = []
            post_elements = self.driver.find_elements(By.CSS_SELECTOR, ".feed-shared-update-v2")[:limit]
            
            for element in post_elements:
                try:
                    # Extract post content
                    content_element = element.find_element(By.CSS_SELECTOR, ".feed-shared-text")
                    content = content_element.text
                    
                    # Extract engagement metrics
                    likes_element = element.find_element(By.CSS_SELECTOR, ".social-counts-reactions__count")
                    likes = int(likes_element.text.replace(",", "")) if likes_element.text else 0
                    
                    comments_element = element.find_element(By.CSS_SELECTOR, ".social-counts-comments__count")
                    comments = int(comments_element.text.replace(",", "")) if comments_element.text else 0
                    
                    # Extract hashtags and mentions
                    hashtags = []
                    mentions = []
                    
                    # Get post ID from data attributes
                    post_id = element.get_attribute("data-urn") or f"post_{datetime.now().timestamp()}"
                    
                    posts.append(LinkedInPost(
                        post_id=post_id,
                        author_name=profile_url.split("/")[-2],
                        author_url=profile_url,
                        content=content,
                        post_type="text",
                        engagement={"likes": likes, "comments": comments, "shares": 0},
                        posted_at=datetime.now(),  # Would need to parse actual timestamp
                        hashtags=hashtags,
                        mentions=mentions
                    ))
                    
                except Exception as e:
                    logger.warning(f"Failed to parse post: {e}")
                    continue
            
            return posts
            
        except Exception as e:
            logger.error(f"❌ Failed to get posts for {profile_url}: {e}")
            return []

    def close(self):
        """Close the driver"""
        if self.driver:
            self.driver.quit()

# LinkedIn API client (for official API access)
class LinkedInAPI:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.linkedin.com/v2"

    async def get_profile(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """Get profile using LinkedIn API"""
        if not self.api_key:
            return None
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/people/{profile_id}",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.warning(f"LinkedIn API error: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"LinkedIn API failed: {e}")
            return None

# Initialize services
scraper = LinkedInScraper(LINKEDIN_EMAIL, LINKEDIN_PASSWORD)
api_client = LinkedInAPI(LINKEDIN_API_KEY)

# Database operations
async def get_vip_contacts() -> List[Dict[str, Any]]:
    """Get VIP contacts from deal board"""
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get contacts associated with deals (VIPs)
            cur.execute("""
                SELECT DISTINCT c.id, c.first_name, c.last_name, c.email, c.linkedin_url,
                       c.company_domain, d.name as deal_name, d.amount as deal_amount
                FROM crm_contacts c
                JOIN crm_deals d ON d.associated_contacts @> jsonb_build_array(c.id::text)
                WHERE c.linkedin_url IS NOT NULL
                ORDER BY d.amount DESC NULLS LAST
            """)
            
            return cur.fetchall()
            
    finally:
        conn.close()

async def store_linkedin_profile(contact_id: str, profile: LinkedInProfile):
    """Store LinkedIn profile data"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO linkedin_profiles 
                (contact_id, profile_url, name, headline, location, connections, 
                 followers, last_activity, profile_picture, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (contact_id) 
                DO UPDATE SET
                    name = EXCLUDED.name,
                    headline = EXCLUDED.headline,
                    location = EXCLUDED.location,
                    connections = EXCLUDED.connections,
                    followers = EXCLUDED.followers,
                    last_activity = EXCLUDED.last_activity,
                    profile_picture = EXCLUDED.profile_picture,
                    updated_at = CURRENT_TIMESTAMP
            """, (
                contact_id,
                profile.profile_url,
                profile.name,
                profile.headline,
                profile.location,
                profile.connections,
                profile.followers,
                profile.last_activity,
                profile.profile_picture,
                datetime.now()
            ))
            
            conn.commit()
            
    finally:
        conn.close()

async def store_linkedin_posts(contact_id: str, posts: List[LinkedInPost]):
    """Store LinkedIn posts"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            for post in posts:
                cur.execute("""
                    INSERT INTO linkedin_posts 
                    (post_id, contact_id, author_name, author_url, content, post_type,
                     engagement, posted_at, hashtags, mentions, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (post_id) 
                    DO UPDATE SET
                        content = EXCLUDED.content,
                        engagement = EXCLUDED.engagement,
                        updated_at = CURRENT_TIMESTAMP
                """, (
                    post.post_id,
                    contact_id,
                    post.author_name,
                    post.author_url,
                    post.content,
                    post.post_type,
                    json.dumps(post.engagement),
                    post.posted_at,
                    json.dumps(post.hashtags),
                    json.dumps(post.mentions),
                    datetime.now()
                ))
            
            conn.commit()
            
    finally:
        conn.close()

# API endpoints
@app.post("/api/linkedin/sync-vips")
async def sync_vip_linkedin_data(background_tasks: BackgroundTasks):
    """Sync LinkedIn data for all VIPs"""
    try:
        # Get VIP contacts
        vips = await get_vip_contacts()
        
        if not vips:
            return {"message": "No VIP contacts found", "synced": 0}
        
        # Setup scraper
        scraper.setup_driver()
        
        if not scraper.login():
            raise HTTPException(status_code=500, detail="LinkedIn login failed")
        
        synced_count = 0
        
        for vip in vips:
            try:
                # Get profile info
                profile = scraper.get_profile_info(vip["linkedin_url"])
                if profile:
                    await store_linkedin_profile(vip["id"], profile)
                
                # Get recent posts
                posts = scraper.get_recent_posts(vip["linkedin_url"], limit=5)
                if posts:
                    await store_linkedin_posts(vip["id"], posts)
                
                synced_count += 1
                
                # Publish sync event
                await redis_client.publish("linkedin_events", json.dumps({
                    "type": "vip_synced",
                    "contact_id": vip["id"],
                    "contact_name": f"{vip['first_name']} {vip['last_name']}",
                    "posts_count": len(posts),
                    "timestamp": datetime.now().isoformat()
                }))
                
            except Exception as e:
                logger.error(f"Failed to sync VIP {vip['id']}: {e}")
                continue
        
        scraper.close()
        
        return {
            "message": f"Synced {synced_count} VIPs",
            "synced": synced_count,
            "total_vips": len(vips)
        }
        
    except Exception as e:
        logger.error(f"VIP sync failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/linkedin/vips")
async def get_vip_linkedin_data():
    """Get LinkedIn data for all VIPs"""
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT c.id, c.first_name, c.last_name, c.email, c.company_domain,
                       lp.profile_url, lp.name, lp.headline, lp.location, 
                       lp.connections, lp.followers, lp.last_activity, lp.profile_picture,
                       COUNT(lposts.id) as posts_count,
                       MAX(lposts.posted_at) as last_post_date
                FROM crm_contacts c
                LEFT JOIN linkedin_profiles lp ON lp.contact_id = c.id
                LEFT JOIN linkedin_posts lposts ON lposts.contact_id = c.id
                JOIN crm_deals d ON d.associated_contacts @> jsonb_build_array(c.id::text)
                WHERE c.linkedin_url IS NOT NULL
                GROUP BY c.id, c.first_name, c.last_name, c.email, c.company_domain,
                         lp.profile_url, lp.name, lp.headline, lp.location,
                         lp.connections, lp.followers, lp.last_activity, lp.profile_picture
                ORDER BY d.amount DESC NULLS LAST
            """)
            
            return cur.fetchall()
            
    finally:
        conn.close()

@app.get("/api/linkedin/posts/{contact_id}")
async def get_contact_posts(contact_id: str, limit: int = 10):
    """Get LinkedIn posts for a specific contact"""
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT post_id, author_name, author_url, content, post_type,
                       engagement, posted_at, hashtags, mentions
                FROM linkedin_posts
                WHERE contact_id = %s
                ORDER BY posted_at DESC
                LIMIT %s
            """, (contact_id, limit))
            
            return cur.fetchall()
            
    finally:
        conn.close()

@app.get("/api/linkedin/activity-summary")
async def get_activity_summary():
    """Get LinkedIn activity summary for all VIPs"""
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get summary stats
            cur.execute("""
                SELECT 
                    COUNT(DISTINCT lp.contact_id) as total_profiles,
                    COUNT(DISTINCT lposts.id) as total_posts,
                    AVG(lp.connections) as avg_connections,
                    AVG(lp.followers) as avg_followers,
                    COUNT(CASE WHEN lposts.posted_at > NOW() - INTERVAL '7 days' THEN 1 END) as posts_last_7_days,
                    COUNT(CASE WHEN lposts.posted_at > NOW() - INTERVAL '30 days' THEN 1 END) as posts_last_30_days
                FROM linkedin_profiles lp
                LEFT JOIN linkedin_posts lposts ON lposts.contact_id = lp.contact_id
            """)
            
            summary = cur.fetchone()
            
            # Get most active VIPs
            cur.execute("""
                SELECT c.first_name, c.last_name, c.company_domain,
                       lp.name, lp.headline, lp.connections, lp.followers,
                       COUNT(lposts.id) as posts_count,
                       MAX(lposts.posted_at) as last_post_date
                FROM crm_contacts c
                JOIN linkedin_profiles lp ON lp.contact_id = c.id
                LEFT JOIN linkedin_posts lposts ON lposts.contact_id = c.id
                GROUP BY c.id, c.first_name, c.last_name, c.company_domain,
                         lp.name, lp.headline, lp.connections, lp.followers
                ORDER BY posts_count DESC, last_post_date DESC
                LIMIT 10
            """)
            
            most_active = cur.fetchall()
            
            return {
                "summary": summary,
                "most_active_vips": most_active
            }
            
    finally:
        conn.close()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "linkedin-integration",
        "timestamp": datetime.now().isoformat(),
        "credentials_configured": {
            "email": bool(LINKEDIN_EMAIL),
            "password": bool(LINKEDIN_PASSWORD),
            "api_key": bool(LINKEDIN_API_KEY)
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8012)
