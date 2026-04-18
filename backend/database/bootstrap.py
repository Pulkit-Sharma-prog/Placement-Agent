"""
bootstrap.py — Idempotent creation of demo admin + recruiter accounts.

Runs on app startup so the credentials shown on the login page's demo
buttons actually work in a freshly-deployed environment where the full
seed script hasn't been executed.

Safe to call on every boot: it's a no-op if an admin already exists.
"""

import logging

from passlib.context import CryptContext

from database.connection import SessionLocal
from database.models import Recruiter, User

logger = logging.getLogger("placements.bootstrap")
_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def ensure_demo_accounts() -> None:
    db = SessionLocal()
    try:
        if db.query(User).filter_by(role="admin").first():
            return

        admin = User(
            email="admin@college.edu",
            password_hash=_pwd.hash("admin123"),
            role="admin",
        )
        db.add(admin)

        rec_user = User(
            email="sarah@google.com",
            password_hash=_pwd.hash("recruiter123"),
            role="recruiter",
        )
        db.add(rec_user)
        db.flush()

        recruiter = Recruiter(
            user_id=rec_user.id,
            company_name="Google",
            sector="Technology",
            contact_name="Sarah Chen",
            website="google.com",
        )
        recruiter.preferences = {
            "min_cgpa": 7.5,
            "preferred_branches": ["CSE", "IT", "ECE"],
            "role_types": ["Software Engineering", "Data Science"],
        }
        db.add(recruiter)
        db.commit()
        logger.info("Demo admin + recruiter accounts bootstrapped")
    except Exception:
        db.rollback()
        logger.exception("Demo account bootstrap failed")
    finally:
        db.close()
