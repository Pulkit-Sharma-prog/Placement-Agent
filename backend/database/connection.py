"""
database/connection.py — SQLAlchemy engine and session management.
"""

import os
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.models import Base

# Use an absolute path so the DB location is the same regardless of CWD
_HERE = os.path.dirname(os.path.abspath(__file__))
_DEFAULT_DB = f"sqlite:///{os.path.join(_HERE, 'placements.db')}"
DATABASE_URL = os.getenv("DATABASE_URL", _DEFAULT_DB)

# connect_args only needed for SQLite
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)
SessionLocal = sessionmaker(bind=engine, autoflush=True, autocommit=False)


def create_tables():
    Base.metadata.create_all(bind=engine)


@contextmanager
def get_db():
    """Provide a transactional scope around database operations."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_db_session():
    """FastAPI dependency that yields a db session."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
