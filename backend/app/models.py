"""
UsedIt — SQLModel table definitions and Pydantic schemas.
Migrated from Prisma schema (schema.prisma).
"""

from datetime import datetime, timezone
from typing import Optional

from pydantic import ConfigDict
from sqlmodel import Field, Relationship, SQLModel


# ── Helper ─────────────────────────────────────────────────────────

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ── Table Models ───────────────────────────────────────────────────

class Word(SQLModel, table=True):
    """Vocabulary word stored in the user's library."""

    id: int | None = Field(default=None, primary_key=True)
    text: str = Field(unique=True, index=True)
    definition: str
    example: str = Field(default="")
    status: str = Field(default="NEW")  # NEW | PRACTICING | MASTERED
    
    phonetic: str | None = Field(default=None)
    audio_url: str | None = Field(default=None)
    part_of_speech: str | None = Field(default=None)
    synonyms: str | None = Field(default=None)
    antonyms: str | None = Field(default=None)
    etymology: str | None = Field(default=None)
    difficulty: str | None = Field(default=None)
    tone: str | None = Field(default=None)
    memory_aid: str | None = Field(default=None)
    is_enriched: bool = Field(default=False)

    created_at: datetime = Field(default_factory=_utcnow)

    # Relationship: one word → many sessions
    sessions: list["PracticeSession"] = Relationship(
        back_populates="word",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class PracticeSession(SQLModel, table=True):
    """A single practice attempt for a word."""

    __tablename__ = "session"  # match original Prisma table name

    id: int | None = Field(default=None, primary_key=True)
    word_id: int = Field(foreign_key="word.id")
    scene: str
    user_sentence: str
    ai_feedback: str
    passed: bool
    created_at: datetime = Field(default_factory=_utcnow)

    # Relationship back to Word
    word: Word | None = Relationship(back_populates="sessions")


# ── Request / Response Schemas ─────────────────────────────────────
# Separate from table models to control what the API accepts/returns.

class WordCreate(SQLModel):
    """Schema for POST /words request body."""
    text: str
    definition: str
    example: str = ""


class WordRead(SQLModel):
    """Schema for word data returned by the API."""
    model_config = ConfigDict(populate_by_name=True)

    id: int
    text: str
    definition: str
    example: str
    status: str
    created_at: datetime

    phonetic: str | None = None
    audio_url: str | None = None
    part_of_speech: str | None = None
    synonyms: str | None = None
    antonyms: str | None = None
    etymology: str | None = None
    difficulty: str | None = None
    tone: str | None = None
    memory_aid: str | None = None
    is_enriched: bool = False

    sessions: list["SessionRead"] = []
    collocations: list[str] = []


class SessionCreate(SQLModel):
    """Schema for POST /sessions request body."""
    word_id: int
    scene: str
    user_sentence: str
    ai_feedback: str
    passed: bool


class SessionRead(SQLModel):
    """Schema for session data returned by the API."""
    model_config = ConfigDict(populate_by_name=True)

    id: int
    word_id: int
    scene: str
    user_sentence: str
    ai_feedback: str
    passed: bool
    created_at: datetime
