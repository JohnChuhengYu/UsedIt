"""
UsedIt — SQLModel table definitions and Pydantic schemas.
"""

from datetime import datetime, timezone
from typing import Optional

from pydantic import ConfigDict
from sqlmodel import Field, Relationship, SQLModel


# ── Helper ─────────────────────────────────────────────────────────

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ── Table Models ───────────────────────────────────────────────────

class User(SQLModel, table=True):
    """Application user — supports password login and/or Google OAuth."""

    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    password_hash: str = Field(default="")  # empty for OAuth-only users
    google_id: str | None = Field(default=None, unique=True, index=True)
    created_at: datetime = Field(default_factory=_utcnow)


class Dictionary(SQLModel, table=True):
    """全局共享的单词详情——一个英文单词只存一份，不管多少用户在学"""
    id: int | None = Field(default=None, primary_key=True)
    text: str = Field(unique=True, index=True)  # 全局唯一，这才是真正应该unique的地方
    definition: str
    example: str = Field(default="")

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


class UserWord(SQLModel, table=True):
    """某个用户和某个词之间的学习关系——只存状态和时间，不重复存词的详情"""
    __tablename__ = "user_word"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    dictionary_id: int = Field(foreign_key="dictionary.id")
    status: str = Field(default="NEW")
    created_at: datetime = Field(default_factory=_utcnow)

    sessions: list["PracticeSession"] = Relationship(
        back_populates="user_word",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class PracticeSession(SQLModel, table=True):
    __tablename__ = "session"

    id: int | None = Field(default=None, primary_key=True)
    user_word_id: int = Field(foreign_key="user_word.id")
    scene: str
    user_sentence: str
    ai_feedback: str
    passed: bool
    created_at: datetime = Field(default_factory=_utcnow)

    user_word: UserWord | None = Relationship(back_populates="sessions")


# ── Request / Response Schemas ─────────────────────────────────────
# Separate from table models to control what the API accepts/returns.

class UserCreate(SQLModel):
    """Schema for POST /auth/register request body."""
    username: str
    password: str


class UserLogin(SQLModel):
    """Schema for POST /auth/login request body."""
    username: str
    password: str


class UserRead(SQLModel):
    """Schema for user data returned by the API."""
    id: int
    username: str
    created_at: datetime


class SessionCreate(SQLModel):
    """Schema for POST /sessions request body."""
    word_id: int  # frontend calls it word_id, maps to user_word_id in backend
    scene: str
    user_sentence: str
    ai_feedback: str
    passed: bool


class SessionRead(SQLModel):
    """Schema for session data returned by the API."""
    model_config = ConfigDict(populate_by_name=True)

    id: int
    word_id: int = Field(alias="user_word_id")  # So it maps nicely
    scene: str
    user_sentence: str
    ai_feedback: str
    passed: bool
    created_at: datetime
