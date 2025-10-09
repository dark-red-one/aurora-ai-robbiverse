#!/usr/bin/env python3
"""
Clay Automation Service
Automatically enriches contacts and companies using Clay API
"""

import asyncio
import json
import logging
import os
import schedule
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import httpx
import psycopg2
import redis
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Clay Automation", version="1.0.0")

# Database and Redis connections
POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://aurora_app:aurora_password@aurora-postgres:5432/aurora_unified")
REDIS_URL = os.getenv("REDIS_URL", "redis://:aurora_password@redis-sentinel-aurora:26379")
CLAY_API_KEY = os.getenv("CLAY_API_KEY")

# Redis client
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

class EnrichmentRequest(BaseModel):
    contact_id: Optional[str] = None
    company_id: Optional[str] = None
    email: Optional[str] = None
    domain: Optional[str] = None
    priority: str = "normal"  # "low", "normal", "high", "urgent"

class ClayAutomation:
    def __init__(self):
        self.db_conn = None
        self.clay_api_key = CLAY_API_KEY
        self.enrichment_queue = "clay_enrichment_queue"
        self.daily_limit = 1000  # Clay API daily limit
        self.hourly_limit = 100  # Clay API hourly limit
        self.enriched_today = 0
        self.enriched_this_hour = 0
        
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
    
    async def get_enrichment_stats(self):
        """Get current enrichment statistics"""
        try:
            today = datetime.now().date()
            hour_ago = datetime.now() - timedelta(hours=1)
            
            # Get today's count
            today_count = redis_client.get(f"clay_enriched_today_{today}")
            self.enriched_today = int(today_count) if today_count else 0
            
            # Get this hour's count
            hour_count = redis_client.get(f"clay_enriched_hour_{hour_ago.hour}")
            self.enriched_this_hour = int(hour_count) if hour_count else 0
            
            return {
                "enriched_today": self.enriched_today,
                "enriched_this_hour": self.enriched_this_hour,
                "daily_limit": self.daily_limit,
                "hourly_limit": self.hourly_limit,
                "daily_remaining": self.daily_limit - self.enriched_today,
                "hourly_remaining": self.hourly_limit - self.enriched_this_hour
            }
        except Exception as e:
            logger.error(f"Error getting enrichment stats: {e}")
            return {"error": str(e)}
    
    async def can_enrich(self) -> bool:
        """Check if we can perform enrichment (within limits)"""
        stats = await self.get_enrichment_stats()
        return (stats.get("daily_remaining", 0) > 0 and 
                stats.get("hourly_remaining", 0) > 0)
    
    async def enrich_contact(self, contact_id: str) -> Dict:
        """Enrich a contact using Clay API"""
        try:
            if not await self.can_enrich():
                return {"error": "Enrichment limits exceeded", "status": "skipped"}
            
            if not self.db_conn:
                await self.connect_db()
            
            # Get contact from database
            cursor = self.db_conn.cursor()
            cursor.execute("""
                SELECT id, email, first_name, last_name, company_name, phone, linkedin_url
                FROM crm_contacts 
                WHERE id = %s
            """, (contact_id,))
            
            contact = cursor.fetchone()
            if not contact:
                return {"error": "Contact not found", "status": "error"}
            
            contact_id, email, first_name, last_name, company_name, phone, linkedin_url = contact
            
            # Check if already enriched recently
            cursor.execute("""
                SELECT created_at FROM shared_enriched_records 
                WHERE contact_id = %s AND source = 'clay'
                ORDER BY created_at DESC LIMIT 1
            """, (contact_id,))
            
            last_enrichment = cursor.fetchone()
            if last_enrichment:
                last_enrichment_time = last_enrichment[0]
                if datetime.now() - last_enrichment_time < timedelta(days=7):
                    return {"message": "Contact enriched recently", "status": "skipped"}
            
            # Prepare Clay API request
            clay_data = {
                "email": email,
                "firstName": first_name,
                "lastName": last_name,
                "companyName": company_name,
                "phone": phone,
                "linkedinUrl": linkedin_url
            }
            
            # Call Clay API
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://www.clay.com/api/v1/enrichment/contact",
                    headers={
                        "Authorization": f"Bearer {self.clay_api_key}",
                        "Content-Type": "application/json"
                    },
                    json=clay_data,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    enrichment_data = response.json()
                    
                    # Store enrichment data
                    await self._store_enrichment_data(contact_id, None, enrichment_data, "clay")
                    
                    # Update enrichment counters
                    await self._update_enrichment_counters()
                    
                    logger.info(f"✅ Enriched contact {contact_id}")
                    return {"status": "success", "data": enrichment_data}
                else:
                    logger.error(f"❌ Clay API error: {response.status_code} - {response.text}")
                    return {"error": f"Clay API error: {response.status_code}", "status": "error"}
            
        except Exception as e:
            logger.error(f"❌ Failed to enrich contact: {e}")
            return {"error": str(e), "status": "error"}
    
    async def enrich_company(self, company_id: str) -> Dict:
        """Enrich a company using Clay API"""
        try:
            if not await self.can_enrich():
                return {"error": "Enrichment limits exceeded", "status": "skipped"}
            
            if not self.db_conn:
                await self.connect_db()
            
            # Get company from database
            cursor = self.db_conn.cursor()
            cursor.execute("""
                SELECT id, name, domain, industry, size, location, linkedin_url
                FROM crm_companies 
                WHERE id = %s
            """, (company_id,))
            
            company = cursor.fetchone()
            if not company:
                return {"error": "Company not found", "status": "error"}
            
            company_id, name, domain, industry, size, location, linkedin_url = company
            
            # Check if already enriched recently
            cursor.execute("""
                SELECT created_at FROM shared_enriched_records 
                WHERE company_id = %s AND source = 'clay'
                ORDER BY created_at DESC LIMIT 1
            """, (company_id,))
            
            last_enrichment = cursor.fetchone()
            if last_enrichment:
                last_enrichment_time = last_enrichment[0]
                if datetime.now() - last_enrichment_time < timedelta(days=30):
                    return {"message": "Company enriched recently", "status": "skipped"}
            
            # Prepare Clay API request
            clay_data = {
                "companyName": name,
                "domain": domain,
                "industry": industry,
                "size": size,
                "location": location,
                "linkedinUrl": linkedin_url
            }
            
            # Call Clay API
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://www.clay.com/api/v1/enrichment/company",
                    headers={
                        "Authorization": f"Bearer {self.clay_api_key}",
                        "Content-Type": "application/json"
                    },
                    json=clay_data,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    enrichment_data = response.json()
                    
                    # Store enrichment data
                    await self._store_enrichment_data(None, company_id, enrichment_data, "clay")
                    
                    # Update enrichment counters
                    await self._update_enrichment_counters()
                    
                    logger.info(f"✅ Enriched company {company_id}")
                    return {"status": "success", "data": enrichment_data}
                else:
                    logger.error(f"❌ Clay API error: {response.status_code} - {response.text}")
                    return {"error": f"Clay API error: {response.status_code}", "status": "error"}
            
        except Exception as e:
            logger.error(f"❌ Failed to enrich company: {e}")
            return {"error": str(e), "status": "error"}
    
    async def _store_enrichment_data(self, contact_id: Optional[str], company_id: Optional[str], 
                                   data: Dict, source: str):
        """Store enrichment data in database"""
        try:
            cursor = self.db_conn.cursor()
            
            # Store in shared_enriched_records
            cursor.execute("""
                INSERT INTO shared_enriched_records (
                    contact_id, company_id, source, data_type, raw_data, 
                    processed_data, confidence_score, created_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                contact_id,
                company_id,
                source,
                "contact" if contact_id else "company",
                json.dumps(data),
                json.dumps(self._process_enrichment_data(data)),
                0.8,  # Default confidence score
                datetime.now()
            ))
            
            # Update contact/company records with enriched data
            if contact_id:
                await self._update_contact_with_enrichment(contact_id, data)
            if company_id:
                await self._update_company_with_enrichment(company_id, data)
            
            cursor.close()
            
        except Exception as e:
            logger.error(f"Error storing enrichment data: {e}")
    
    async def _process_enrichment_data(self, data: Dict) -> Dict:
        """Process and clean enrichment data"""
        processed = {}
        
        # Extract common fields
        if "email" in data:
            processed["email"] = data["email"]
        if "phone" in data:
            processed["phone"] = data["phone"]
        if "linkedin" in data:
            processed["linkedin_url"] = data["linkedin"]
        if "company" in data:
            processed["company_name"] = data["company"]
        if "title" in data:
            processed["job_title"] = data["title"]
        if "location" in data:
            processed["location"] = data["location"]
        if "industry" in data:
            processed["industry"] = data["industry"]
        if "size" in data:
            processed["company_size"] = data["size"]
        if "revenue" in data:
            processed["revenue"] = data["revenue"]
        if "technologies" in data:
            processed["technologies"] = data["technologies"]
        
        return processed
    
    async def _update_contact_with_enrichment(self, contact_id: str, data: Dict):
        """Update contact record with enriched data"""
        try:
            cursor = self.db_conn.cursor()
            
            # Update contact fields
            updates = []
            params = []
            
            if "email" in data and data["email"]:
                updates.append("email = %s")
                params.append(data["email"])
            
            if "phone" in data and data["phone"]:
                updates.append("phone = %s")
                params.append(data["phone"])
            
            if "linkedin" in data and data["linkedin"]:
                updates.append("linkedin_url = %s")
                params.append(data["linkedin"])
            
            if "title" in data and data["title"]:
                updates.append("job_title = %s")
                params.append(data["title"])
            
            if "location" in data and data["location"]:
                updates.append("location = %s")
                params.append(data["location"])
            
            if updates:
                params.append(contact_id)
                cursor.execute(f"""
                    UPDATE crm_contacts 
                    SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, params)
            
            cursor.close()
            
        except Exception as e:
            logger.error(f"Error updating contact with enrichment: {e}")
    
    async def _update_company_with_enrichment(self, company_id: str, data: Dict):
        """Update company record with enriched data"""
        try:
            cursor = self.db_conn.cursor()
            
            # Update company fields
            updates = []
            params = []
            
            if "domain" in data and data["domain"]:
                updates.append("domain = %s")
                params.append(data["domain"])
            
            if "industry" in data and data["industry"]:
                updates.append("industry = %s")
                params.append(data["industry"])
            
            if "size" in data and data["size"]:
                updates.append("size = %s")
                params.append(data["size"])
            
            if "location" in data and data["location"]:
                updates.append("location = %s")
                params.append(data["location"])
            
            if "revenue" in data and data["revenue"]:
                updates.append("revenue = %s")
                params.append(data["revenue"])
            
            if "technologies" in data and data["technologies"]:
                updates.append("technologies = %s")
                params.append(data["technologies"])
            
            if updates:
                params.append(company_id)
                cursor.execute(f"""
                    UPDATE crm_companies 
                    SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, params)
            
            cursor.close()
            
        except Exception as e:
            logger.error(f"Error updating company with enrichment: {e}")
    
    async def _update_enrichment_counters(self):
        """Update enrichment counters in Redis"""
        try:
            today = datetime.now().date()
            current_hour = datetime.now().hour
            
            # Update daily counter
            redis_client.incr(f"clay_enriched_today_{today}")
            redis_client.expire(f"clay_enriched_today_{today}", 86400)  # 24 hours
            
            # Update hourly counter
            redis_client.incr(f"clay_enriched_hour_{current_hour}")
            redis_client.expire(f"clay_enriched_hour_{current_hour}", 3600)  # 1 hour
            
        except Exception as e:
            logger.error(f"Error updating enrichment counters: {e}")
    
    async def get_contacts_needing_enrichment(self, limit: int = 50) -> List[str]:
        """Get contacts that need enrichment"""
        try:
            if not self.db_conn:
                await self.connect_db()
            
            cursor = self.db_conn.cursor()
            
            # Get contacts that haven't been enriched in the last 7 days
            cursor.execute("""
                SELECT c.id 
                FROM crm_contacts c
                LEFT JOIN shared_enriched_records ser ON c.id = ser.contact_id 
                    AND ser.source = 'clay' 
                    AND ser.created_at > NOW() - INTERVAL '7 days'
                WHERE ser.id IS NULL 
                    AND c.email IS NOT NULL 
                    AND c.email != ''
                ORDER BY c.created_at ASC
                LIMIT %s
            """, (limit,))
            
            contact_ids = [row[0] for row in cursor.fetchall()]
            cursor.close()
            
            return contact_ids
            
        except Exception as e:
            logger.error(f"Error getting contacts needing enrichment: {e}")
            return []
    
    async def get_companies_needing_enrichment(self, limit: int = 50) -> List[str]:
        """Get companies that need enrichment"""
        try:
            if not self.db_conn:
                await self.connect_db()
            
            cursor = self.db_conn.cursor()
            
            # Get companies that haven't been enriched in the last 30 days
            cursor.execute("""
                SELECT c.id 
                FROM crm_companies c
                LEFT JOIN shared_enriched_records ser ON c.id = ser.company_id 
                    AND ser.source = 'clay' 
                    AND ser.created_at > NOW() - INTERVAL '30 days'
                WHERE ser.id IS NULL 
                    AND (c.domain IS NOT NULL OR c.name IS NOT NULL)
                ORDER BY c.created_at ASC
                LIMIT %s
            """, (limit,))
            
            company_ids = [row[0] for row in cursor.fetchall()]
            cursor.close()
            
            return company_ids
            
        except Exception as e:
            logger.error(f"Error getting companies needing enrichment: {e}")
            return []
    
    async def run_automated_enrichment(self):
        """Run automated enrichment for contacts and companies"""
        try:
            logger.info("🤖 Starting automated Clay enrichment...")
            
            # Get enrichment stats
            stats = await self.get_enrichment_stats()
            logger.info(f"📊 Enrichment stats: {stats}")
            
            if not await self.can_enrich():
                logger.warning("⚠️ Enrichment limits exceeded, skipping automated enrichment")
                return
            
            # Enrich contacts
            contact_ids = await self.get_contacts_needing_enrichment(10)
            for contact_id in contact_ids:
                if not await self.can_enrich():
                    break
                
                result = await self.enrich_contact(contact_id)
                logger.info(f"Contact {contact_id}: {result.get('status', 'unknown')}")
                
                # Small delay to avoid rate limiting
                await asyncio.sleep(1)
            
            # Enrich companies
            company_ids = await self.get_companies_needing_enrichment(5)
            for company_id in company_ids:
                if not await self.can_enrich():
                    break
                
                result = await self.enrich_company(company_id)
                logger.info(f"Company {company_id}: {result.get('status', 'unknown')}")
                
                # Small delay to avoid rate limiting
                await asyncio.sleep(1)
            
            logger.info("✅ Automated Clay enrichment completed")
            
        except Exception as e:
            logger.error(f"❌ Automated enrichment failed: {e}")

# Initialize Clay automation
clay_automation = ClayAutomation()

@app.on_event("startup")
async def startup():
    """Initialize service on startup"""
    await clay_automation.connect_db()
    
    # Schedule automated enrichment
    schedule.every().hour.do(lambda: asyncio.create_task(clay_automation.run_automated_enrichment()))
    schedule.every().day.at("09:00").do(lambda: asyncio.create_task(clay_automation.run_automated_enrichment()))
    
    # Start background scheduler
    asyncio.create_task(run_scheduler())

async def run_scheduler():
    """Run the scheduler in background"""
    while True:
        schedule.run_pending()
        await asyncio.sleep(60)  # Check every minute

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "clay-automation"}

@app.post("/api/enrich/contact/{contact_id}")
async def enrich_contact_endpoint(contact_id: str):
    """Enrich a specific contact"""
    result = await clay_automation.enrich_contact(contact_id)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@app.post("/api/enrich/company/{company_id}")
async def enrich_company_endpoint(company_id: str):
    """Enrich a specific company"""
    result = await clay_automation.enrich_company(company_id)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@app.post("/api/enrich/automated")
async def run_automated_enrichment(background_tasks: BackgroundTasks):
    """Run automated enrichment"""
    background_tasks.add_task(clay_automation.run_automated_enrichment)
    return {"message": "Automated enrichment started"}

@app.get("/api/enrich/stats")
async def get_enrichment_stats():
    """Get enrichment statistics"""
    return await clay_automation.get_enrichment_stats()

@app.get("/api/enrich/queue")
async def get_enrichment_queue():
    """Get contacts and companies needing enrichment"""
    contacts = await clay_automation.get_contacts_needing_enrichment(20)
    companies = await clay_automation.get_companies_needing_enrichment(20)
    
    return {
        "contacts_needing_enrichment": len(contacts),
        "companies_needing_enrichment": len(companies),
        "contact_ids": contacts[:10],  # First 10 for preview
        "company_ids": companies[:10]  # First 10 for preview
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8017)
