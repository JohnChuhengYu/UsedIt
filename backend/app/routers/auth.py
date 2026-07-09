"""
UsedIt — Authentication routes (register, login, Google OAuth).
"""

import os

from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select

from app.database import get_session
from app.models import User, UserCreate, UserLogin, UserRead
from app.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Username / Password ───────────────────────────────────────────

@router.post("/register", response_model=UserRead, status_code=201)
def register(body: UserCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.username == body.username)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")

    user = User(username=body.username, password_hash=hash_password(body.password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.post("/login")
def login(body: UserLogin, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == body.username)).first()

    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


# ── Google OAuth ──────────────────────────────────────────────────

oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@router.get("/google")
async def google_login(request: Request):
    """Redirect the user to Google's authorization page."""
    redirect_uri = "http://localhost:8000/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, session: Session = Depends(get_session)):
    """Handle Google's redirect: exchange code for user info, login or auto-register."""
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get("userinfo")

    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to get user info from Google")

    google_id = user_info["sub"]
    email = user_info.get("email")

    # Look up existing user by google_id
    user = session.exec(select(User).where(User.google_id == google_id)).first()

    if not user:
        # Auto-register: create a new account using email as username
        # password_hash is left empty since this is an OAuth-only user
        user = User(
            username=email,
            password_hash="",
            google_id=google_id,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})

    # Redirect back to the frontend with the token in the URL
    frontend_url = f"http://localhost:5173/auth/callback?token={access_token}"
    return RedirectResponse(url=frontend_url)
