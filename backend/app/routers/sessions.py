"""
UsedIt — Session CRUD API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import PracticeSession, SessionCreate, SessionRead, Word

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.get("", response_model=list[SessionRead])
def list_sessions(session: Session = Depends(get_session)):
    """GET /sessions — list all practice sessions, newest first."""
    statement = select(PracticeSession).order_by(PracticeSession.created_at.desc())
    results = session.exec(statement).all()
    return results


@router.post("", response_model=SessionRead, status_code=201)
def create_session(body: SessionCreate, session: Session = Depends(get_session)):
    """POST /sessions — create a new practice session record."""
    # Verify the word exists
    word = session.get(Word, body.word_id)
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    practice = PracticeSession(
        word_id=body.word_id,
        scene=body.scene,
        user_sentence=body.user_sentence,
        ai_feedback=body.ai_feedback,
        passed=body.passed,
    )
    session.add(practice)
    session.commit()
    session.refresh(practice)
    return practice
