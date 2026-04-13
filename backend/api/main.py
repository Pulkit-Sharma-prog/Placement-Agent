"""
api/main.py — FastAPI application entry point.

All routes follow API_SPEC.md.
Base URL: /api/v1
"""

import os
import sys

# Ensure backend/ is in the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import admin, analytics, applications, auth, jobs, recruiters, students
from database.connection import create_tables

app = FastAPI(
    title="Placements Agent System API",
    description="AI-powered multi-agent platform for college placement automation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

_FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Build allowed origins: always include localhost dev URLs + any configured FRONTEND_URL
_allowed_origins = list(filter(None, [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    _FRONTEND_URL if _FRONTEND_URL.startswith("http") else None,
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_tables()
    print("✓ Database tables created/verified")

    # Schedule periodic matching engine (every 6 hours)
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        import asyncio

        def run_matching():
            from agents.matching_engine.agent import MatchingEngineAgent
            loop = asyncio.new_event_loop()
            agent = MatchingEngineAgent()
            loop.run_until_complete(agent.run({"mode": "full"}))
            loop.close()

        scheduler = BackgroundScheduler()
        scheduler.add_job(run_matching, "interval", hours=6, id="matching_engine")
        scheduler.start()
        print("✓ Background scheduler started (matching engine: every 6h)")
    except Exception as e:
        print(f"  Scheduler not started: {e}")


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
