#!/usr/bin/env python3
"""
Distributed Secrets Manager
Centrally manages API credentials with node-level overrides and connectivity status
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from cryptography.fernet import Fernet
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Secrets Manager")

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

# Encryption key (should be in secure vault in production)
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())
cipher = Fernet(ENCRYPTION_KEY.encode())

# Redis client
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD if REDIS_PASSWORD else None,
    decode_responses=True
)


def get_db_connection():
    """Get PostgreSQL connection"""
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        cursor_factory=RealDictCursor
    )


# Pydantic models
class SecretCreate(BaseModel):
    service: str
    key_name: str
    key_value: str
    scope: str = "global"  # global, node, company
    scope_id: Optional[str] = None
    metadata: Optional[Dict] = {}


class SecretUpdate(BaseModel):
    key_value: Optional[str] = None
    scope: Optional[str] = None
    scope_id: Optional[str] = None
    metadata: Optional[Dict] = None


class APIStatusUpdate(BaseModel):
    service: str
    status: str  # healthy, degraded, down
    response_time_ms: Optional[int] = None
    last_error: Optional[str] = None


@app.on_event("startup")
async def startup_event():
    """Initialize secrets manager"""
    logger.info("🔐 Starting Secrets Manager...")
    
    # Create tables if not exist
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Secrets table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS secrets (
                    id SERIAL PRIMARY KEY,
                    service TEXT NOT NULL,
                    key_name TEXT NOT NULL,
                    key_value_encrypted TEXT NOT NULL,
                    scope TEXT DEFAULT 'global',
                    scope_id TEXT,
                    metadata JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    created_by TEXT,
                    UNIQUE(service, key_name, scope, scope_id)
                )
            """)
            
            # API connectivity status table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS api_connectivity_status (
                    id SERIAL PRIMARY KEY,
                    node_name TEXT NOT NULL,
                    service TEXT NOT NULL,
                    status TEXT NOT NULL,
                    response_time_ms INTEGER,
                    last_error TEXT,
                    last_check TIMESTAMP DEFAULT NOW(),
                    UNIQUE(node_name, service)
                )
            """)
            
            # Indexes
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_secrets_service 
                ON secrets(service, scope)
            """)
            
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_api_status_service 
                ON api_connectivity_status(service, status)
            """)
            
        conn.commit()
        logger.info("✅ Database tables initialized")
        
    finally:
        conn.close()


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "secrets-manager"}


@app.post("/api/secrets")
async def create_secret(secret: SecretCreate, x_node_name: Optional[str] = Header(None)):
    """Create or update a secret"""
    try:
        # Encrypt the secret value
        encrypted_value = cipher.encrypt(secret.key_value.encode()).decode()
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO secrets (
                        service, key_name, key_value_encrypted, 
                        scope, scope_id, metadata, created_by
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (service, key_name, scope, scope_id)
                    DO UPDATE SET
                        key_value_encrypted = EXCLUDED.key_value_encrypted,
                        metadata = EXCLUDED.metadata,
                        updated_at = NOW()
                    RETURNING id
                """, (
                    secret.service,
                    secret.key_name,
                    encrypted_value,
                    secret.scope,
                    secret.scope_id,
                    json.dumps(secret.metadata),
                    x_node_name or 'system'
                ))
                
                result = cur.fetchone()
                conn.commit()
                
                # Invalidate cache
                cache_key = f"secret:{secret.service}:{secret.key_name}:{secret.scope}:{secret.scope_id or 'none'}"
                redis_client.delete(cache_key)
                
                # Publish event
                redis_client.publish("aurora:secrets:updated", json.dumps({
                    "service": secret.service,
                    "key_name": secret.key_name,
                    "scope": secret.scope,
                    "timestamp": datetime.utcnow().isoformat()
                }))
                
                return {
                    "success": True,
                    "secret_id": result['id'],
                    "message": "Secret stored successfully"
                }
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error creating secret: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/secrets/{service}/{key_name}")
async def get_secret(
    service: str,
    key_name: str,
    scope: str = "global",
    scope_id: Optional[str] = None,
    x_node_name: Optional[str] = Header(None)
):
    """
    Get a secret with override logic:
    1. Check for node-specific override (scope=node, scope_id=node_name)
    2. Check for company-specific override (scope=company, scope_id=company_id)
    3. Fall back to global secret
    """
    try:
        # Check cache first
        cache_key = f"secret:{service}:{key_name}:{scope}:{scope_id or 'none'}"
        cached = redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Try node-specific first
                if x_node_name:
                    cur.execute("""
                        SELECT key_value_encrypted, metadata, scope, scope_id
                        FROM secrets
                        WHERE service = %s AND key_name = %s 
                          AND scope = 'node' AND scope_id = %s
                        ORDER BY updated_at DESC
                        LIMIT 1
                    """, (service, key_name, x_node_name))
                    
                    result = cur.fetchone()
                    if result:
                        decrypted = cipher.decrypt(result['key_value_encrypted'].encode()).decode()
                        response = {
                            "service": service,
                            "key_name": key_name,
                            "key_value": decrypted,
                            "scope": result['scope'],
                            "scope_id": result['scope_id'],
                            "metadata": result['metadata'],
                            "override_applied": "node"
                        }
                        
                        # Cache for 5 minutes
                        redis_client.setex(cache_key, 300, json.dumps(response))
                        return response
                
                # Try company-specific if scope_id provided
                if scope == "company" and scope_id:
                    cur.execute("""
                        SELECT key_value_encrypted, metadata, scope, scope_id
                        FROM secrets
                        WHERE service = %s AND key_name = %s 
                          AND scope = 'company' AND scope_id = %s
                        ORDER BY updated_at DESC
                        LIMIT 1
                    """, (service, key_name, scope_id))
                    
                    result = cur.fetchone()
                    if result:
                        decrypted = cipher.decrypt(result['key_value_encrypted'].encode()).decode()
                        response = {
                            "service": service,
                            "key_name": key_name,
                            "key_value": decrypted,
                            "scope": result['scope'],
                            "scope_id": result['scope_id'],
                            "metadata": result['metadata'],
                            "override_applied": "company"
                        }
                        
                        redis_client.setex(cache_key, 300, json.dumps(response))
                        return response
                
                # Fall back to global
                cur.execute("""
                    SELECT key_value_encrypted, metadata, scope, scope_id
                    FROM secrets
                    WHERE service = %s AND key_name = %s AND scope = 'global'
                    ORDER BY updated_at DESC
                    LIMIT 1
                """, (service, key_name))
                
                result = cur.fetchone()
                if result:
                    decrypted = cipher.decrypt(result['key_value_encrypted'].encode()).decode()
                    response = {
                        "service": service,
                        "key_name": key_name,
                        "key_value": decrypted,
                        "scope": result['scope'],
                        "scope_id": result['scope_id'],
                        "metadata": result['metadata'],
                        "override_applied": None
                    }
                    
                    redis_client.setex(cache_key, 300, json.dumps(response))
                    return response
                
                raise HTTPException(status_code=404, detail="Secret not found")
                
        finally:
            conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting secret: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/secrets")
async def list_secrets(
    service: Optional[str] = None,
    scope: Optional[str] = None
):
    """List all secrets (without values)"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                query = """
                    SELECT service, key_name, scope, scope_id, metadata, 
                           created_at, updated_at
                    FROM secrets
                    WHERE 1=1
                """
                params = []
                
                if service:
                    query += " AND service = %s"
                    params.append(service)
                
                if scope:
                    query += " AND scope = %s"
                    params.append(scope)
                
                query += " ORDER BY service, key_name"
                
                cur.execute(query, params)
                secrets = cur.fetchall()
                
                return {
                    "secrets": [
                        {
                            "service": s['service'],
                            "key_name": s['key_name'],
                            "scope": s['scope'],
                            "scope_id": s['scope_id'],
                            "metadata": s['metadata'],
                            "created_at": s['created_at'].isoformat() if s['created_at'] else None,
                            "updated_at": s['updated_at'].isoformat() if s['updated_at'] else None
                        }
                        for s in secrets
                    ],
                    "total": len(secrets)
                }
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error listing secrets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/connectivity/status")
async def update_connectivity_status(
    status: APIStatusUpdate,
    x_node_name: Optional[str] = Header(None)
):
    """Update API connectivity status from a node"""
    try:
        if not x_node_name:
            raise HTTPException(status_code=400, detail="X-Node-Name header required")
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO api_connectivity_status (
                        node_name, service, status, response_time_ms, 
                        last_error, last_check
                    )
                    VALUES (%s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (node_name, service)
                    DO UPDATE SET
                        status = EXCLUDED.status,
                        response_time_ms = EXCLUDED.response_time_ms,
                        last_error = EXCLUDED.last_error,
                        last_check = NOW()
                """, (
                    x_node_name,
                    status.service,
                    status.status,
                    status.response_time_ms,
                    status.last_error
                ))
                
                conn.commit()
                
                # Publish event
                redis_client.publish("aurora:api:status", json.dumps({
                    "node": x_node_name,
                    "service": status.service,
                    "status": status.status,
                    "timestamp": datetime.utcnow().isoformat()
                }))
                
                return {"success": True, "message": "Status updated"}
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error updating connectivity status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/connectivity/status")
async def get_connectivity_status(service: Optional[str] = None):
    """Get API connectivity status across all nodes"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                if service:
                    cur.execute("""
                        SELECT node_name, service, status, response_time_ms,
                               last_error, last_check
                        FROM api_connectivity_status
                        WHERE service = %s
                        ORDER BY node_name
                    """, (service,))
                else:
                    cur.execute("""
                        SELECT node_name, service, status, response_time_ms,
                               last_error, last_check
                        FROM api_connectivity_status
                        ORDER BY service, node_name
                    """)
                
                statuses = cur.fetchall()
                
                # Group by service
                by_service = {}
                for s in statuses:
                    service_name = s['service']
                    if service_name not in by_service:
                        by_service[service_name] = {
                            "service": service_name,
                            "overall_status": "healthy",
                            "nodes": []
                        }
                    
                    node_status = {
                        "node": s['node_name'],
                        "status": s['status'],
                        "response_time_ms": s['response_time_ms'],
                        "last_error": s['last_error'],
                        "last_check": s['last_check'].isoformat() if s['last_check'] else None
                    }
                    
                    by_service[service_name]["nodes"].append(node_status)
                    
                    # Update overall status (worst status wins)
                    if s['status'] == 'down':
                        by_service[service_name]["overall_status"] = "down"
                    elif s['status'] == 'degraded' and by_service[service_name]["overall_status"] != "down":
                        by_service[service_name]["overall_status"] = "degraded"
                
                return {
                    "services": list(by_service.values()),
                    "total_services": len(by_service)
                }
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting connectivity status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/connectivity/health")
async def get_overall_health():
    """Get overall API health summary"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        COUNT(DISTINCT service) as total_services,
                        COUNT(DISTINCT CASE WHEN status = 'healthy' THEN service END) as healthy,
                        COUNT(DISTINCT CASE WHEN status = 'degraded' THEN service END) as degraded,
                        COUNT(DISTINCT CASE WHEN status = 'down' THEN service END) as down
                    FROM api_connectivity_status
                """)
                
                result = cur.fetchone()
                
                overall_status = "healthy"
                if result['down'] > 0:
                    overall_status = "critical"
                elif result['degraded'] > 0:
                    overall_status = "degraded"
                
                return {
                    "overall_status": overall_status,
                    "total_services": result['total_services'],
                    "healthy": result['healthy'],
                    "degraded": result['degraded'],
                    "down": result['down'],
                    "timestamp": datetime.utcnow().isoformat()
                }
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting overall health: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
