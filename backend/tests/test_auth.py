"""
Business-logic tests for the auth flow.

Uses a throwaway in-memory SQLite DB so the tests are hermetic and
don't touch the real placements.db.
"""

import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


@pytest.fixture
def client(monkeypatch, tmp_path):
    """A TestClient wired to a fresh SQLite DB per test."""
    db_path = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")

    # Force a re-import so connection.py picks up the env var
    for mod in list(sys.modules):
        if mod.startswith(("database", "api", "utils.auth", "agents")):
            sys.modules.pop(mod, None)

    from api.main import app, limiter
    from database.connection import create_tables

    # Rate limiter would block repeated login attempts in a single test
    limiter.reset()

    create_tables()
    with TestClient(app) as c:
        yield c


def test_register_then_login(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "alice@example.edu",
        "password": "correct-horse-battery-staple",
        "full_name": "Alice Example",
        "roll_number": "R-001",
    })
    assert r.status_code == 200, r.text

    r = client.post("/api/v1/auth/login", json={
        "email": "alice@example.edu",
        "password": "correct-horse-battery-staple",
    })
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert "token" in body["data"]
    assert body["data"]["user"]["email"] == "alice@example.edu"
    assert body["data"]["user"]["role"] == "student"


def test_login_rejects_bad_password(client):
    client.post("/api/v1/auth/register", json={
        "email": "bob@example.edu",
        "password": "real-password",
    })
    r = client.post("/api/v1/auth/login", json={
        "email": "bob@example.edu",
        "password": "wrong",
    })
    assert r.status_code == 401


def test_register_rejects_duplicate_email(client):
    payload = {"email": "dup@example.edu", "password": "pw12345678"}
    r1 = client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 200
    r2 = client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 409


def test_login_rate_limit_triggers(client):
    payload = {"email": "nobody@example.edu", "password": "x"}
    # 5/minute limit — 6th attempt from the same IP must get 429
    statuses = []
    for _ in range(6):
        statuses.append(client.post("/api/v1/auth/login", json=payload).status_code)
    assert statuses.count(429) >= 1, f"expected at least one 429, got {statuses}"
