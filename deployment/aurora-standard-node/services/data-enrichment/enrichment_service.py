#!/usr/bin/env python3
"""
Data Enrichment Service
Enriches CRM contacts and companies using Clay, Apollo, Clearbit, etc.
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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Data Enrichment Service")

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

# Enrichment API keys
CLAY_API_KEY = os.getenv("CLAY_API_KEY", "")
APOLLO_API_KEY = os.getenv("APOLLO_API_KEY", "")
CLEARBIT_API_KEY = os.getenv("CLEARBIT_API_KEY", "")

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
class EnrichmentRequest(BaseModel):
    record_type: str  # 'contact' or 'company'
    record_id: str
    external_id: str
    enrichment_sources: List[str] = ["clay", "apollo"]
    force_refresh: bool = False

class EnrichmentResult(BaseModel):
    record_id: str
    external_id: str
    enrichment_sources: List[str]
    enriched_data: Dict[str, Any]
    enrichment_score: int
    last_enriched: datetime
    cost: float

# Enrichment providers
class ClayEnrichment:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.clay.com/v1"
        self.cost_per_request = 2.00

    async def enrich_contact(self, email: str, company_domain: str = None) -> Dict[str, Any]:
        """Enrich contact using Clay API"""
        if not self.api_key:
            raise Exception("Clay API key not configured")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/enrichment/contact",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "email": email,
                        "company_domain": company_domain,
                        "fields": [
                            "job_title_verified",
                            "company_size",
                            "company_revenue", 
                            "linkedin_profile",
                            "recent_job_changes",
                            "company_news",
                            "funding_rounds",
                            "tech_stack",
                            "mutual_connections",
                            "professional_interests"
                        ]
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    raise Exception(f"Clay API error: {response.status_code} - {response.text}")
                    
        except Exception as e:
            logger.error(f"Clay enrichment failed: {e}")
            raise

    async def enrich_company(self, domain: str) -> Dict[str, Any]:
        """Enrich company using Clay API"""
        if not self.api_key:
            raise Exception("Clay API key not configured")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/enrichment/company",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "domain": domain,
                        "fields": [
                            "company_size",
                            "company_revenue",
                            "funding_rounds",
                            "recent_news",
                            "tech_stack",
                            "hiring_trends",
                            "social_media_presence"
                        ]
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    raise Exception(f"Clay API error: {response.status_code} - {response.text}")
                    
        except Exception as e:
            logger.error(f"Clay company enrichment failed: {e}")
            raise

class ApolloEnrichment:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.apollo.io/v1"
        self.cost_per_request = 1.50

    async def enrich_contact(self, email: str) -> Dict[str, Any]:
        """Enrich contact using Apollo API"""
        if not self.api_key:
            raise Exception("Apollo API key not configured")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/people/match",
                    headers={"Cache-Control": "no-cache", "X-Api-Key": self.api_key},
                    params={"email": email},
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    raise Exception(f"Apollo API error: {response.status_code} - {response.text}")
                    
        except Exception as e:
            logger.error(f"Apollo enrichment failed: {e}")
            raise

# Initialize enrichment providers
clay = ClayEnrichment(CLAY_API_KEY)
apollo = ApolloEnrichment(APOLLO_API_KEY)

# Enrichment logic
async def enrich_contact(contact_id: str, external_id: str, sources: List[str]) -> EnrichmentResult:
    """Enrich a contact using specified sources"""
    
    # Get contact data from database
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT email, first_name, last_name, company_domain
                FROM crm_contacts 
                WHERE id = %s
            """, (contact_id,))
            contact = cur.fetchone()
            
            if not contact:
                raise HTTPException(status_code=404, detail="Contact not found")
            
            enriched_data = {}
            total_cost = 0.0
            enrichment_score = 0
            
            # Enrich with Clay
            if "clay" in sources:
                try:
                    clay_data = await clay.enrich_contact(contact["email"], contact.get("company_domain"))
                    enriched_data["clay"] = clay_data
                    total_cost += clay.cost_per_request
                    enrichment_score += 40  # Clay provides high-quality data
                except Exception as e:
                    logger.warning(f"Clay enrichment failed: {e}")
                    enriched_data["clay"] = {"error": str(e)}
            
            # Enrich with Apollo
            if "apollo" in sources:
                try:
                    apollo_data = await apollo.enrich_contact(contact["email"])
                    enriched_data["apollo"] = apollo_data
                    total_cost += apollo.cost_per_request
                    enrichment_score += 30  # Apollo provides good data
                except Exception as e:
                    logger.warning(f"Apollo enrichment failed: {e}")
                    enriched_data["apollo"] = {"error": str(e)}
            
            # Store enrichment data
            cur.execute("""
                INSERT INTO shared_enriched_records 
                (record_type, external_id, enrichment_source, enrichment_data, source_town, shared_with, is_public)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (record_type, external_id) 
                DO UPDATE SET 
                    enrichment_data = EXCLUDED.enrichment_data,
                    enrichment_date = CURRENT_TIMESTAMP
            """, (
                "contact",
                external_id,
                ",".join(sources),
                json.dumps(enriched_data),
                "aurora",  # Source town
                ["aurora", "star", "vengeance", "robbiebook1"],  # Shared with all towns
                True
            ))
            
            conn.commit()
            
            return EnrichmentResult(
                record_id=contact_id,
                external_id=external_id,
                enrichment_sources=sources,
                enriched_data=enriched_data,
                enrichment_score=min(enrichment_score, 100),
                last_enriched=datetime.now(),
                cost=total_cost
            )
            
    finally:
        conn.close()

async def enrich_company(company_id: str, external_id: str, sources: List[str]) -> EnrichmentResult:
    """Enrich a company using specified sources"""
    
    # Get company data from database
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT name, domain
                FROM crm_companies 
                WHERE id = %s
            """, (company_id,))
            company = cur.fetchone()
            
            if not company:
                raise HTTPException(status_code=404, detail="Company not found")
            
            enriched_data = {}
            total_cost = 0.0
            enrichment_score = 0
            
            # Enrich with Clay
            if "clay" in sources and company.get("domain"):
                try:
                    clay_data = await clay.enrich_company(company["domain"])
                    enriched_data["clay"] = clay_data
                    total_cost += clay.cost_per_request
                    enrichment_score += 40
                except Exception as e:
                    logger.warning(f"Clay company enrichment failed: {e}")
                    enriched_data["clay"] = {"error": str(e)}
            
            # Store enrichment data
            cur.execute("""
                INSERT INTO shared_enriched_records 
                (record_type, external_id, enrichment_source, enrichment_data, source_town, shared_with, is_public)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (record_type, external_id) 
                DO UPDATE SET 
                    enrichment_data = EXCLUDED.enrichment_data,
                    enrichment_date = CURRENT_TIMESTAMP
            """, (
                "company",
                external_id,
                ",".join(sources),
                json.dumps(enriched_data),
                "aurora",
                ["aurora", "star", "vengeance", "robbiebook1"],
                True
            ))
            
            conn.commit()
            
            return EnrichmentResult(
                record_id=company_id,
                external_id=external_id,
                enrichment_sources=sources,
                enriched_data=enriched_data,
                enrichment_score=min(enrichment_score, 100),
                last_enriched=datetime.now(),
                cost=total_cost
            )
            
    finally:
        conn.close()

# API endpoints
@app.post("/api/enrich/contact")
async def enrich_contact_endpoint(request: EnrichmentRequest, background_tasks: BackgroundTasks):
    """Enrich a contact with specified sources"""
    try:
        result = await enrich_contact(
            request.record_id,
            request.external_id,
            request.enrichment_sources
        )
        
        # Publish enrichment event
        await redis_client.publish("enrichment_events", json.dumps({
            "type": "contact_enriched",
            "record_id": request.record_id,
            "external_id": request.external_id,
            "enrichment_score": result.enrichment_score,
            "cost": result.cost,
            "timestamp": datetime.now().isoformat()
        }))
        
        return result
        
    except Exception as e:
        logger.error(f"Contact enrichment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/enrich/company")
async def enrich_company_endpoint(request: EnrichmentRequest, background_tasks: BackgroundTasks):
    """Enrich a company with specified sources"""
    try:
        result = await enrich_company(
            request.record_id,
            request.external_id,
            request.enrichment_sources
        )
        
        # Publish enrichment event
        await redis_client.publish("enrichment_events", json.dumps({
            "type": "company_enriched",
            "record_id": request.record_id,
            "external_id": request.external_id,
            "enrichment_score": result.enrichment_score,
            "cost": result.cost,
            "timestamp": datetime.now().isoformat()
        }))
        
        return result
        
    except Exception as e:
        logger.error(f"Company enrichment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/enrich/status/{record_id}")
async def get_enrichment_status(record_id: str):
    """Get enrichment status for a record"""
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT record_type, external_id, enrichment_source, enrichment_data, 
                       enrichment_date, source_town
                FROM shared_enriched_records 
                WHERE external_id = %s
                ORDER BY enrichment_date DESC
                LIMIT 1
            """, (record_id,))
            
            result = cur.fetchone()
            if result:
                return {
                    "record_id": record_id,
                    "external_id": result["external_id"],
                    "enrichment_source": result["enrichment_source"],
                    "enrichment_date": result["enrichment_date"],
                    "source_town": result["source_town"],
                    "has_data": bool(result["enrichment_data"])
                }
            else:
                return {"record_id": record_id, "enriched": False}
                
    finally:
        conn.close()

@app.get("/api/enrich/batch/contacts")
async def batch_enrich_contacts(limit: int = 10, sources: str = "clay,apollo"):
    """Batch enrich contacts that haven't been enriched recently"""
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Find contacts that need enrichment
            cur.execute("""
                SELECT c.id, c.hubspot_id, c.email, c.first_name, c.last_name, c.company_domain
                FROM crm_contacts c
                LEFT JOIN shared_enriched_records ser ON ser.external_id = c.hubspot_id
                WHERE c.hubspot_id IS NOT NULL 
                AND (ser.enrichment_date IS NULL OR ser.enrichment_date < NOW() - INTERVAL '7 days')
                ORDER BY c.updated_at DESC
                LIMIT %s
            """, (limit,))
            
            contacts = cur.fetchall()
            enrichment_sources = sources.split(",")
            
            results = []
            for contact in contacts:
                try:
                    result = await enrich_contact(
                        contact["id"],
                        contact["hubspot_id"],
                        enrichment_sources
                    )
                    results.append(result)
                except Exception as e:
                    logger.error(f"Failed to enrich contact {contact['id']}: {e}")
                    results.append({
                        "record_id": contact["id"],
                        "external_id": contact["hubspot_id"],
                        "error": str(e)
                    })
            
            return {
                "enriched_count": len(results),
                "results": results
            }
            
    finally:
        conn.close()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "data-enrichment",
        "timestamp": datetime.now().isoformat(),
        "providers": {
            "clay": bool(CLAY_API_KEY),
            "apollo": bool(APOLLO_API_KEY),
            "clearbit": bool(CLEARBIT_API_KEY)
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8010)
