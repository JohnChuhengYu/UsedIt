"""
UsedIt — Curated Linguistic Decks API endpoints.
Provides academic corpus-grounded vocabulary sets with verifiable citations.
"""

import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel

from app.database import get_session
from app.models import Dictionary, UserWord, User
from app.auth import get_current_user

router = APIRouter(prefix="/decks", tags=["Decks"])

DECKS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "preset_decks"
)


# ── Schemas ───────────────────────────────────────────────────────

class DeckWordItem(SQLModel):
    text: str
    phonetic: str | None = None
    part_of_speech: str | None = None
    definition: str
    example: str
    difficulty: str | None = None


class DeckSummary(SQLModel):
    id: str
    title: str
    subtitle: str
    corpus: str
    citation: str
    cefr_level: str
    badge: str
    code: str
    description: str
    word_count: int
    words_preview: list[str]


class DeckDetail(SQLModel):
    id: str
    title: str
    subtitle: str
    corpus: str
    citation: str
    cefr_level: str
    badge: str
    code: str
    description: str
    word_count: int
    words: list[DeckWordItem]


class DeckImportResponse(SQLModel):
    deck_id: str
    title: str
    imported_count: int
    skipped_count: int
    total: int
    added_words: list[str]


# ── Helper to load decks ──────────────────────────────────────────

def _load_all_decks() -> dict[str, dict]:
    decks: dict[str, dict] = {}
    if not os.path.isdir(DECKS_DIR):
        return decks

    for filename in sorted(os.listdir(DECKS_DIR)):
        if filename.endswith(".json"):
            filepath = os.path.join(DECKS_DIR, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "id" in data and "words" in data:
                        decks[data["id"]] = data
            except Exception as e:
                print(f"Error loading deck file {filename}: {e}")
    return decks


# ── Routes ────────────────────────────────────────────────────────

@router.get("", response_model=list[DeckSummary])
def list_decks():
    """GET /decks — 返回所有权威语言学预设词库摘要及学术文献出处"""
    decks = _load_all_decks()
    summaries = []
    for d in decks.values():
        words = d.get("words", [])
        summaries.append(
            DeckSummary(
                id=d["id"],
                title=d["title"],
                subtitle=d.get("subtitle", ""),
                corpus=d.get("corpus", "Standard Corpus"),
                citation=d.get("citation", ""),
                cefr_level=d.get("cefr_level", "B2-C1"),
                badge=d.get("badge", "Academic"),
                code=d.get("code", "LEX"),
                description=d.get("description", ""),
                word_count=len(words),
                words_preview=[w["text"] for w in words[:6]],
            )
        )
    return summaries


@router.get("/{deck_id}", response_model=DeckDetail)
def get_deck_detail(deck_id: str):
    """GET /decks/{id} — 获取单个词库的全部单词与详细元数据"""
    decks = _load_all_decks()
    deck = decks.get(deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail=f"Deck '{deck_id}' not found")

    words = deck.get("words", [])
    return DeckDetail(
        id=deck["id"],
        title=deck["title"],
        subtitle=deck.get("subtitle", ""),
        corpus=deck.get("corpus", "Standard Corpus"),
        citation=deck.get("citation", ""),
        cefr_level=deck.get("cefr_level", "B2-C1"),
        badge=deck.get("badge", "Academic"),
        code=deck.get("code", "LEX"),
        description=deck.get("description", ""),
        word_count=len(words),
        words=[DeckWordItem(**w) for w in words],
    )


@router.post("/{deck_id}/import", response_model=DeckImportResponse)
def import_deck(
    deck_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """POST /decks/{id}/import — 将指定权威语料库的一键导入到当前用户词库"""
    decks = _load_all_decks()
    deck = decks.get(deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail=f"Deck '{deck_id}' not found")

    words = deck.get("words", [])
    imported_count = 0
    skipped_count = 0
    added_words: list[str] = []
    seen_texts: set[str] = set()

    for item in words:
        text = item.get("text", "").lower().strip()
        if not text or text in seen_texts:
            continue
        seen_texts.add(text)

        dict_entry = session.exec(select(Dictionary).where(Dictionary.text == text)).first()
        if not dict_entry:
            dict_entry = Dictionary(
                text=text,
                definition=item.get("definition", ""),
                example=item.get("example", ""),
                phonetic=item.get("phonetic"),
                part_of_speech=item.get("part_of_speech"),
                difficulty=item.get("difficulty", "Medium"),
                is_enriched=True,
            )
            session.add(dict_entry)
            session.commit()
            session.refresh(dict_entry)

        existing_user_word = session.exec(
            select(UserWord).where(
                UserWord.user_id == current_user.id,
                UserWord.dictionary_id == dict_entry.id,
            )
        ).first()

        if existing_user_word:
            skipped_count += 1
        else:
            uw = UserWord(user_id=current_user.id, dictionary_id=dict_entry.id, status="NEW")
            session.add(uw)
            added_words.append(text)
            imported_count += 1

    session.commit()

    return DeckImportResponse(
        deck_id=deck["id"],
        title=deck["title"],
        imported_count=imported_count,
        skipped_count=skipped_count,
        total=len(seen_texts),
        added_words=added_words,
    )

