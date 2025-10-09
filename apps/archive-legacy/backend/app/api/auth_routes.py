"""
Authentication Routes - Database-backed user authentication
Supports bcrypt password hashing and JWT tokens
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
import bcrypt
import jwt
import os
from datetime import datetime, timedelta
from app.db.database import get_db
import psycopg2.extras

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "robbie-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: Optional[str] = None


class AuthResponse(BaseModel):
    token: str
    user: dict


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_token(user_id: str, email: str) -> str:
    """Create a JWT token for authenticated user"""
    expiration = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    cursor.execute(
        "SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = %s",
        (payload["user_id"],)
    )
    user = cursor.fetchone()
    cursor.close()
    
    if not user or not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return dict(user)


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Login with email and password
    Returns JWT token and user info
    """
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Find user by email
    cursor.execute(
        "SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = %s",
        (request.email,)
    )
    user = cursor.fetchone()
    cursor.close()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Verify password
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Update last login
    cursor = db.cursor()
    cursor.execute(
        "UPDATE users SET last_login = NOW() WHERE id = %s",
        (user["id"],)
    )
    db.commit()
    cursor.close()
    
    # Create token
    token = create_token(str(user["id"]), user["email"])
    
    # Return user info (without password hash)
    user_data = {
        "id": str(user["id"]),
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "role": user["role"]
    }
    
    return {
        "token": token,
        "user": user_data
    }


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """
    Register a new user
    Returns JWT token and user info
    """
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Check if user already exists
    cursor.execute("SELECT id FROM users WHERE email = %s", (request.email,))
    existing = cursor.fetchone()
    
    if existing:
        cursor.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    password_hash = hash_password(request.password)
    
    # Create user
    cursor.execute(
        """
        INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
        VALUES (%s, %s, %s, %s, 'user', true)
        RETURNING id, email, first_name, last_name, role
        """,
        (request.email, password_hash, request.first_name, request.last_name)
    )
    user = cursor.fetchone()
    db.commit()
    cursor.close()
    
    # Create token
    token = create_token(str(user["id"]), user["email"])
    
    # Return user info
    user_data = {
        "id": str(user["id"]),
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "role": user["role"]
    }
    
    return {
        "token": token,
        "user": user_data
    }


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """
    Get current user info
    Requires authentication
    """
    return user


@router.post("/refresh")
async def refresh_token(user: dict = Depends(get_current_user)):
    """
    Refresh JWT token
    Returns new token with extended expiration
    """
    token = create_token(user["id"], user["email"])
    return {"token": token}








