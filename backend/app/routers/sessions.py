"""
UsedIt — Session CRUD API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import PracticeSession, SessionCreate, SessionRead, UserWord, User
from app.auth import get_current_user

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.get("", response_model=list[SessionRead])
def list_sessions(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """GET /sessions — list all practice sessions for the current user, newest first."""
    statement = (
        select(PracticeSession)
        .join(UserWord)
        .where(UserWord.user_id == current_user.id)
        .order_by(PracticeSession.created_at.desc())
    )
    results = session.exec(statement).all()
    
    # Map user_word_id to word_id for the frontend response
    return [
        SessionRead(
            id=s.id,
            word_id=s.user_word_id,
            scene=s.scene,
            user_sentence=s.user_sentence,
            ai_feedback=s.ai_feedback,
            passed=s.passed,
            created_at=s.created_at
        ) for s in results
    ]


@router.post("", response_model=SessionRead, status_code=201)
def create_session(
    body: SessionCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """POST /sessions — create a new practice session record."""
    # Verify the user_word exists and belongs to the user
    user_word = session.get(UserWord, body.word_id)
    if not user_word or user_word.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Word not found")

    practice = PracticeSession(
        user_word_id=body.word_id,
        scene=body.scene,
        user_sentence=body.user_sentence,
        ai_feedback=body.ai_feedback,
        passed=body.passed,
    )
    session.add(practice)
    session.commit()
    session.refresh(practice)
    
    return SessionRead(
        id=practice.id,
        word_id=practice.user_word_id,
        scene=practice.scene,
        user_sentence=practice.user_sentence,
        ai_feedback=practice.ai_feedback,
        passed=practice.passed,
        created_at=practice.created_at
    )
