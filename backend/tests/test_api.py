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


def test_preset_academic_decks():
    """Verify standard corpus-grounded decks list, detail, and import endpoints."""
    # 1. List decks
    response = client.get("/decks")
    assert response.status_code == 200
    decks = response.json()
    assert len(decks) >= 4
    deck_ids = [d["id"] for d in decks]
    assert "awl-sublist-1" in deck_ids
    assert "oxford-5000-c1" in deck_ids
    assert "gre-analytical" in deck_ids
    assert "coca-spoken" in deck_ids

    # Verify academic citation and corpus exist
    awl_summary = next(d for d in decks if d["id"] == "awl-sublist-1")
    assert "Coxhead" in awl_summary["citation"]
    assert awl_summary["cefr_level"] == "B2 - C1"

    # 2. Detail
    res_detail = client.get("/decks/awl-sublist-1")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert len(detail["words"]) > 0
    assert any(w["text"] == "analyze" for w in detail["words"])

    # 3. Import
    res_import = client.post("/decks/awl-sublist-1/import")
    assert res_import.status_code == 200
    import_data = res_import.json()
    assert import_data["deck_id"] == "awl-sublist-1"
    assert import_data["total"] > 0
    assert "analyze" in import_data["added_words"] or import_data["skipped_count"] > 0

