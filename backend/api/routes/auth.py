"""
routes/auth.py — Login, registration, and Google OAuth endpoints.
"""

import os

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from api.limiter import limiter
from database.connection import get_db_session
from database.models import Recruiter, Student, User
from utils.auth import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str = "student"
    full_name: str = ""
    roll_number: str = ""


class GoogleAuthRequest(BaseModel):
    credential: str   # Google ID token (JWT) — used by credential flow


class GoogleTokenRequest(BaseModel):
    """Used by the implicit/access_token flow (useGoogleLogin)."""
    access_token: str
    email: str
    name: str = ""
    google_sub: str = ""
    picture: str = ""


@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, req: LoginRequest, db: Session = Depends(get_db_session)):
    user = db.query(User).filter_by(email=req.email, is_active=True).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
    })

    return {
        "success": True,
        "data": {
            "token": token,
            "user": {"id": user.id, "email": user.email, "role": user.role},
        }
    }


@router.post("/register")
@limiter.limit("10/hour")
def register(request: Request, req: RegisterRequest, db: Session = Depends(get_db_session)):
    if req.role not in ("student",):
        raise HTTPException(status_code=400, detail="Only student registration is open.")

    if db.query(User).filter_by(email=req.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        role=req.role,
    )
    db.add(user)
    db.flush()

    if req.role == "student":
        student = Student(
            user_id=user.id,
            full_name=req.full_name,
            roll_number=req.roll_number,
        )
        db.add(student)

    return {"success": True, "data": {"user_id": user.id}}


@router.post("/google")
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db_session)):
    """
    Verify a Google ID token, then create or log in the student.
    Only students can sign in with Google.
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=501,
            detail="Google Sign-In is not configured. Add GOOGLE_CLIENT_ID to your .env file."
        )

    # Verify the token with Google
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        id_info = id_token.verify_oauth2_token(
            req.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {e}")

    email = id_info.get("email")
    name = id_info.get("name", "")
    picture = id_info.get("picture", "")
    google_sub = id_info.get("sub")   # stable Google user ID

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    # Find or create user
    user = db.query(User).filter_by(email=email).first()

    if user:
        # Existing user — only allow if they are a student
        if user.role not in ("student",):
            raise HTTPException(
                status_code=403,
                detail="Google Sign-In is only available for students. Use email/password login instead."
            )
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is deactivated")
    else:
        # New user — create student account automatically
        user = User(
            email=email,
            # Store google_sub as password hash — it's never used for password login
            password_hash=hash_password(google_sub),
            role="student",
        )
        db.add(user)
        db.flush()

        student = Student(
            user_id=user.id,
            full_name=name,
        )
        db.add(student)
        db.flush()

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
    })

    return {
        "success": True,
        "data": {
            "token": token,
            "user": {"id": user.id, "email": user.email, "role": user.role},
        }
    }


@router.post("/google-token")
def google_token_auth(req: GoogleTokenRequest, db: Session = Depends(get_db_session)):
    """
    Accept Google userinfo (fetched by the frontend using the access token).
    Verifies the access_token is valid by calling Google's tokeninfo endpoint,
    then creates or logs in the student.
    """
    import urllib.request
    import json as _json

    # Verify access token is genuine by hitting Google's tokeninfo
    try:
        url = f"https://www.googleapis.com/oauth2/v3/tokeninfo?access_token={req.access_token}"
        with urllib.request.urlopen(url, timeout=5) as resp:
            info = _json.loads(resp.read())
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Could not verify Google token: {e}")

    # Ensure the token's email matches what was sent
    token_email = info.get("email", "")
    if not token_email:
        raise HTTPException(status_code=401, detail="Token has no email claim")
    if token_email.lower() != req.email.lower():
        raise HTTPException(status_code=401, detail="Token email mismatch")

    email = token_email
    name = req.name or email.split("@")[0]

    # Find or create student
    user = db.query(User).filter_by(email=email).first()

    if user:
        if user.role not in ("student",):
            raise HTTPException(
                status_code=403,
                detail="Google Sign-In is only available for students. Use email/password login."
            )
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is deactivated")
    else:
        # Brand new user — auto-create student account
        google_sub = req.google_sub or email
        user = User(
            email=email,
            password_hash=hash_password(google_sub),
            role="student",
        )
        db.add(user)
        db.flush()

        student = Student(
            user_id=user.id,
            full_name=name,
        )
        db.add(student)
        db.flush()

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
    })

    return {
        "success": True,
        "data": {
            "token": token,
            "user": {"id": user.id, "email": user.email, "role": user.role},
        }
    }
