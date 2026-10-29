"""
API integration tests for UsedIt.
Validates core endpoints, database initialization, and local-first fallback.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_health():
    """Verify backend health endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "UsedIt API is running"


def test_local_user_auto_provisioning():
    """Verify that unauthenticated requests automatically resolve to local user profile."""
    response = client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert "username" in data
    assert "grading_strictness" in data


def test_words_stats():
    """Verify words statistics endpoint returns valid metrics."""
    response = client.get("/words/stats")
    assert response.status_code == 200
    data = response.json()
    assert "mastered" in data
    assert "practicing" in data
    assert "new" in data
    assert "total" in data


def test_sessions_stats():
    """Verify sessions statistics endpoint returns valid metrics."""
    response = client.get("/sessions/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_sessions" in data
    assert "passed_sessions" in data
    assert "accuracy" in data

