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


def test_batch_word_import():
    """Verify batch word import functionality with deduplication."""
    import uuid
    unique_suffix = uuid.uuid4().hex[:6]
    word1 = f"testword_a_{unique_suffix}"
    word2 = f"testword_b_{unique_suffix}"

    payload = {
        "words": [
            {
                "text": word1,
                "definition": "Definition for test word A",
                "example": "This is an example sentence for test word A."
            },
            {
                "text": word2,
                "definition": "Definition for test word B",
                "example": "This is an example sentence for test word B."
            }
        ]
    }
    response = client.post("/words/batch", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["imported_count"] == 2
    assert res_data["skipped_count"] == 0
    assert word1 in res_data["added_words"]

    # Re-importing same batch should skip all without failing
    response_dup = client.post("/words/batch", json=payload)
    assert response_dup.status_code == 200
    dup_data = response_dup.json()
    assert dup_data["imported_count"] == 0
    assert dup_data["skipped_count"] == 2

