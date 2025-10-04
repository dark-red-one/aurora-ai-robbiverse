from typing import Optional
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from authlib.integrations.starlette_client import OAuth
import os
from app.db.database import database

router = APIRouter()

oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID", ""),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET", ""),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly",
    },
)

@router.get("/google/login")
async def google_login(request: Request):
    redirect_uri = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8000/api/v1/auth/google/callback")
    if not oauth.google.client_id or not oauth.google.client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
        userinfo = token.get("userinfo") or {}
        # Persist token in integrations table (upsert per user email)
        email = userinfo.get("email") or token.get("id_token")
        if email:
            # Find or create a user for this email
            user_id = await database.fetch_val(
                "SELECT id FROM users WHERE email=:email", {"email": email}
            )
            if not user_id:
                user_id = await database.fetch_val(
                    "INSERT INTO users (username, email, password_hash, role) VALUES (:u, :e, , user) RETURNING id",
                    {"u": email.split("@")[0], "e": email},
                )
            # Upsert integration
            await database.execute(
                """
                INSERT INTO integrations (user_id, service, config, is_active)
                VALUES (:user_id, :service, :config::jsonb, true)
                ON CONFLICT (id) DO NOTHING
                """,
                {"user_id": user_id, "service": "google", "config": JSONResponse(token).body.decode() if hasattr(JSONResponse(token), body) else str(token)},
            )
        return RedirectResponse(url="/docs")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth callback error: {str(e)}")

@router.post("/webhook")
async def webhook_receiver(request: Request):
    try:
        payload = await request.json()
    except Exception:
        payload = {"raw": await request.body()}
    await database.execute(
        "INSERT INTO system_logs (level, component, message, metadata) VALUES (INFO, webhook, :msg, :meta)",
        {"msg": "webhook_received", "meta": payload},
    )
    return {"status": "ok"}
