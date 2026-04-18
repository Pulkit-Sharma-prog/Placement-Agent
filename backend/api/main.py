"""
api/main.py — FastAPI application entry point.

All routes follow API_SPEC.md.
Base URL: /api/v1
"""

import asyncio
import logging
import os
import sys
from contextlib import asynccontextmanager

# Ensure backend/ is in the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api.limiter import limiter
from api.routes import admin, analytics, applications, auth, jobs, recruiters, students
from database.bootstrap import ensure_demo_accounts
from database.connection import create_tables

logger = logging.getLogger("placements.api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


def _run_matching_job() -> None:
    """Run the matching engine once. Executed by APScheduler in a worker thread."""
    from agents.matching_engine.agent import MatchingEngineAgent
    try:
        asyncio.run(MatchingEngineAgent().run({"mode": "full"}))
    except Exception:
        logger.exception("Matching engine run failed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    create_tables()
    logger.info("Database tables created/verified")
    ensure_demo_accounts()

    scheduler = None
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        scheduler = BackgroundScheduler()
        scheduler.add_job(_run_matching_job, "interval", hours=6, id="matching_engine")
        scheduler.start()
        logger.info("Background scheduler started (matching engine: every 6h)")
    except Exception:
        logger.exception("Scheduler not started")

    try:
        yield
    finally:
        if scheduler is not None:
            scheduler.shutdown(wait=False)
            logger.info("Scheduler shut down")


app = FastAPI(
    title="Placements Agent System API",
    description="AI-powered multi-agent platform for college placement automation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Wire up the rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


def _build_allowed_origins() -> list[str]:
    """
    Build CORS allowed origins.

    CORS_ORIGINS (comma-separated) takes precedence. Falls back to
    FRONTEND_URL + localhost dev URLs.
    """
    raw = os.getenv("CORS_ORIGINS", "").strip()
    if raw:
        return [o.strip() for o in raw.split(",") if o.strip()]

    origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:4173",
    ]
    frontend_url = os.getenv("FRONTEND_URL", "").strip()
    if frontend_url.startswith("http"):
        origins.append(frontend_url)
    return origins


app.add_middleware(
    CORSMiddleware,
    allow_origins=_build_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Versioned API routes ────────────────────────────────────────────────────────
PREFIX = "/api/v1"

app.include_router(auth.router,         prefix=PREFIX)
app.include_router(students.router,     prefix=PREFIX)
app.include_router(jobs.router,         prefix=PREFIX)
app.include_router(applications.router, prefix=PREFIX)
app.include_router(recruiters.router,   prefix=PREFIX)
app.include_router(analytics.router,    prefix=PREFIX)
app.include_router(admin.router,        prefix=PREFIX)


@app.get("/health", tags=["System"])
def health():
    return {"status": "ok", "version": app.version, "service": "placements-agent-api"}


@app.get("/", tags=["System"])
def root():
    return {
        "message": "Placements Agent System API",
        "docs": "/docs",
        "version": app.version,
    }
