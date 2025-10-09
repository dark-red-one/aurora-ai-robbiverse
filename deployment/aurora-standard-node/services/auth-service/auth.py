#!/usr/bin/env python3
"""
Distributed Auth Service
Runs on EVERY node - provides local authentication
JWT tokens + session management synced via Redis
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
from fastapi import FastAPI, HTTPException, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from jose import JWTError, jwt
from passlib.context import CryptContext

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Auth Service - Distributed Authentication")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
NODE_NAME = os.getenv("NODE_NAME", "unknown")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "aurora_unified")
POSTGRES_USER = os.getenv("POSTGRES_USER", "aurora_app")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")

# JWT settings - Get from Secrets Manager
async def get_jwt_secret():
    """Get JWT secret from Secrets Manager with fallback"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "http://secrets-manager:8008/api/secrets/jwt_secret",
                headers={"X-API-Key": os.getenv("API_KEY", "robbie-2025")},
                timeout=5.0
            )
            if response.status_code == 200:
                secret_data = response.json()
                return secret_data.get("value", os.getenv("JWT_SECRET_KEY", "fallback-secret"))
    except Exception as e:
        logger.warning(f"Could not get JWT secret from Secrets Manager: {e}")
    
    # Fallback to environment variable
    return os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")

# Initialize JWT secret
SECRET_KEY = "initializing"  # Will be updated on startup
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

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


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class User(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime


@app.on_event("startup")
async def startup_event():
    """Initialize auth service"""
    logger.info(f"🔐 Starting Auth Service on {NODE_NAME}...")
    
    # Ensure users table exists
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    full_name VARCHAR(255),
                    password_hash VARCHAR(255) NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    metadata JSONB DEFAULT '{}'
                )
            """)
            
            cur.execute("""
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    token_jti VARCHAR(255) UNIQUE NOT NULL,
                    node_name VARCHAR(50),
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    expires_at TIMESTAMP NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE
                )
            """)
            
            conn.commit()
            
        logger.info("✅ Auth service ready")
    finally:
        conn.close()


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "auth", "node": NODE_NAME}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict:
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            raise credentials_exception
        
        token_data = TokenData(username=username)
        
    except JWTError:
        raise credentials_exception
    
    # Check if token is in Redis (session management)
    session_key = f"aurora:session:{token_data.username}"
    session_data = redis_client.get(session_key)
    
    if not session_data:
        raise credentials_exception
    
    # Get user from database
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, username, email, full_name, is_active, created_at
                FROM users
                WHERE username = %s AND is_active = TRUE
            """, (token_data.username,))
            
            user = cur.fetchone()
            
            if user is None:
                raise credentials_exception
            
            return dict(user)
            
    finally:
        conn.close()


@app.post("/api/auth/register", response_model=User)
async def register(user: UserCreate):
    """Register a new user"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Check if user exists
                cur.execute("""
                    SELECT id FROM users WHERE username = %s OR email = %s
                """, (user.username, user.email))
                
                if cur.fetchone():
                    raise HTTPException(
                        status_code=400,
                        detail="Username or email already registered"
                    )
                
                # Hash password
                password_hash = get_password_hash(user.password)
                
                # Create user
                cur.execute("""
                    INSERT INTO users (username, email, full_name, password_hash)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, username, email, full_name, is_active, created_at
                """, (user.username, user.email, user.full_name, password_hash))
                
                new_user = cur.fetchone()
                conn.commit()
                
                # Publish event
                redis_client.publish("aurora:auth:user_created", json.dumps({
                    "username": user.username,
                    "node": NODE_NAME,
                    "timestamp": datetime.utcnow().isoformat()
                }))
                
                return User(**dict(new_user))
                
        finally:
            conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login and get JWT tokens"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Get user
                cur.execute("""
                    SELECT id, username, email, password_hash, is_active
                    FROM users
                    WHERE username = %s
                """, (form_data.username,))
                
                user = cur.fetchone()
                
                if not user or not verify_password(form_data.password, user["password_hash"]):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Incorrect username or password",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                
                if not user["is_active"]:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="User account is inactive"
                    )
                
                # Create tokens
                access_token = create_access_token(data={"sub": user["username"]})
                refresh_token = create_refresh_token(data={"sub": user["username"]})
                
                # Store session in Redis (synced across nodes)
                session_data = {
                    "user_id": str(user["id"]),
                    "username": user["username"],
                    "node": NODE_NAME,
                    "created_at": datetime.utcnow().isoformat(),
                    "access_token": access_token,
                    "refresh_token": refresh_token
                }
                
                redis_client.setex(
                    f"aurora:session:{user['username']}",
                    ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                    json.dumps(session_data)
                )
                
                # Log session in database
                cur.execute("""
                    INSERT INTO user_sessions (user_id, token_jti, node_name, expires_at)
                    VALUES (%s, %s, %s, NOW() + INTERVAL '%s minutes')
                """, (
                    user["id"],
                    access_token[:50],  # First 50 chars as JTI
                    NODE_NAME,
                    ACCESS_TOKEN_EXPIRE_MINUTES
                ))
                
                conn.commit()
                
                # Publish event
                redis_client.publish("aurora:auth:user_login", json.dumps({
                    "username": user["username"],
                    "node": NODE_NAME,
                    "timestamp": datetime.utcnow().isoformat()
                }))
                
                return Token(
                    access_token=access_token,
                    refresh_token=refresh_token
                )
                
        finally:
            conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/logout")
async def logout(current_user: Dict = Depends(get_current_user)):
    """Logout (invalidate token)"""
    try:
        # Remove session from Redis
        redis_client.delete(f"aurora:session:{current_user['username']}")
        
        # Mark sessions as inactive in database
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE user_sessions
                    SET is_active = FALSE
                    WHERE user_id = %s AND is_active = TRUE
                """, (current_user["id"],))
                
                conn.commit()
        finally:
            conn.close()
        
        # Publish event
        redis_client.publish("aurora:auth:user_logout", json.dumps({
            "username": current_user["username"],
            "node": NODE_NAME,
            "timestamp": datetime.utcnow().isoformat()
        }))
        
        return {"message": "Successfully logged out"}
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/auth/me", response_model=User)
async def get_current_user_info(current_user: Dict = Depends(get_current_user)):
    """Get current user info"""
    return User(**current_user)


@app.get("/api/auth/verify")
async def verify_token(token: str = Depends(oauth2_scheme)):
    """Verify if token is valid"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {
            "valid": True,
            "username": payload.get("sub"),
            "expires": payload.get("exp")
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


@app.get("/api/auth/sessions")
async def get_active_sessions(current_user: Dict = Depends(get_current_user)):
    """Get all active sessions for current user"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, node_name, ip_address, user_agent, created_at, expires_at
                    FROM user_sessions
                    WHERE user_id = %s AND is_active = TRUE AND expires_at > NOW()
                    ORDER BY created_at DESC
                """, (current_user["id"],))
                
                sessions = cur.fetchall()
                
                return {
                    "sessions": [
                        {
                            **dict(session),
                            "id": str(session["id"]),
                            "created_at": session["created_at"].isoformat(),
                            "expires_at": session["expires_at"].isoformat()
                        }
                        for session in sessions
                    ],
                    "total": len(sessions)
                }
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Sessions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8008)
