"""Smoke tests for the API surface."""

from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)


def test_health_ok():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["service"] == "placements-agent-api"


def test_root_ok():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["docs"] == "/docs"


def test_openapi_schema():
    r = client.get("/openapi.json")
    assert r.status_code == 200
    assert r.json()["info"]["title"].startswith("Placements")
