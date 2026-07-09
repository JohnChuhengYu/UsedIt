"""
UsedIt — Word CRUD API endpoints.
Rewritten to use Dictionary (shared) + UserWord (per-user relationship) structure.
"""

import os
import json
import requests
import chromadb
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel

from app.database import get_session
from app.models import Dictionary, UserWord, PracticeSession, User
from app.auth import get_current_user

router = APIRouter(prefix="/words", tags=["Words"])

CHROMA_DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "chroma_db"
)
try:
    chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
except Exception:
    chroma_client = None


# ── Response schemas ─────────────────────────────────────────────

class WordListItem(SQLModel):
    """轻量版，给列表接口用"""
    id: int  # UserWord的id，不是Dictionary的id
    text: str
    definition: str
    status: str
    created_at: str


class WordDetail(SQLModel):
    """完整版，给详情接口用"""
    id: int  # UserWord的id
    text: str
    definition: str
    example: str
    status: str
    created_at: str

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

    sessions: list = []
    collocations: list[str] = []


class WordCreate(SQLModel):
    text: str


# ── Helper: enrichment logic, unchanged from before ──────────────

DIFFICULTY_DB = {
    "trivial": "Easy", "eloquent": "Medium", "procrastinate": "Hard",
    "profound": "Hard", "skeptical": "Medium", "versatile": "Medium"
}
ETYMOLOGY_DB = {
    "eloquent": "From Latin eloquent- 'speaking out', from the verb eloqui, from e- (variant of ex-) 'out' + loqui 'speak'.",
    "trivial": "From Latin trivialis 'belonging to the crossroads, commonplace', from trivium 'place where three roads meet'.",
}


def _enrich_dictionary_entry(entry: Dictionary, session: Session):
    """只在Dictionary条目第一次被创建时调用一次，不是每个用户都重复调用"""
    try:
        res = requests.get(f"https://api.dictionaryapi.dev/api/v2/entries/en/{entry.text}", timeout=5)
        if res.status_code == 200:
            data = res.json()[0]
            phonetics = data.get("phonetics", [])
            entry.phonetic = data.get("phonetic") or (phonetics[0].get("text") if phonetics else None)
            for p in phonetics:
                if p.get("audio"):
                    entry.audio_url = p["audio"]
                    break

            meanings = data.get("meanings", [])
            if meanings:
                entry.part_of_speech = meanings[0].get("partOfSpeech", "")
                syns, ants = [], []
                for m in meanings:
                    syns.extend(m.get("synonyms", []))
                    ants.extend(m.get("antonyms", []))
                entry.synonyms = ", ".join(list(set(syns))[:5]) if syns else None
                entry.antonyms = ", ".join(list(set(ants))[:5]) if ants else None

                if not entry.definition:
                    for m in meanings:
                        defs = m.get("definitions", [])
                        if defs and defs[0].get("definition"):
                            entry.definition = defs[0]["definition"]
                            break

        entry.difficulty = DIFFICULTY_DB.get(entry.text, "Medium")
        entry.etymology = ETYMOLOGY_DB.get(entry.text)

        try:
            ai_res = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "llama3.1:8b",
                    "prompt": f"Respond ONLY with a valid JSON object mapping 'tone' (formal, neutral, informal, or academic) and 'memory_aid' (2 sentences max) for the word '{entry.text}'.",
                    "stream": False
                },
                timeout=10
            )
            if ai_res.status_code == 200:
                resp_text = ai_res.json().get("response", "{}")
                parsed = json.loads(resp_text)
                entry.tone = parsed.get("tone", "neutral").capitalize()
                entry.memory_aid = parsed.get("memory_aid")
            else:
                raise Exception("Ollama failed")
        except Exception:
            entry.tone = "Formal" if len(entry.text) > 6 else "Neutral"
            entry.memory_aid = f"Think of a time when you had to be very {entry.text}."

        entry.is_enriched = True
        session.add(entry)
        session.commit()
        session.refresh(entry)
    except Exception as e:
        print(f"Enrichment failed for '{entry.text}': {e}")


# ── Routes ────────────────────────────────────────────────────────

@router.get("", response_model=list[WordListItem])
def list_words(
    skip: int = 0,
    limit: int = 20,
    status: str | None = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """GET /words — 列出当前用户的单词，分页，支持按状态过滤，只返回轻量字段"""
    statement = (
        select(UserWord, Dictionary)
        .join(Dictionary, UserWord.dictionary_id == Dictionary.id)
        .where(UserWord.user_id == current_user.id)
    )
    if status:
        statement = statement.where(UserWord.status == status)

    statement = statement.order_by(UserWord.created_at.desc()).offset(skip).limit(limit)
    results = session.exec(statement).all()

    return [
        WordListItem(
            id=uw.id, text=d.text, definition=d.definition,
            status=uw.status, created_at=uw.created_at.isoformat()
        )
        for uw, d in results
    ]


@router.post("", status_code=201)
def create_word(
    body: WordCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """POST /words — 给当前用户添加一个词，如果Dictionary里没有这个词就先创建"""
    cleaned_text = body.text.lower().strip()

    # 查这个用户是否已经添加过这个词
    existing_dict = session.exec(select(Dictionary).where(Dictionary.text == cleaned_text)).first()

    if existing_dict:
        existing_user_word = session.exec(
            select(UserWord).where(
                UserWord.user_id == current_user.id,
                UserWord.dictionary_id == existing_dict.id
            )
        ).first()
        if existing_user_word:
            raise HTTPException(status_code=409, detail="You already added this word")
        dictionary_entry = existing_dict
    else:
        # 全局第一次出现这个词，创建Dictionary条目并做enrichment（只做这一次）
        dictionary_entry = Dictionary(text=cleaned_text, definition="")
        session.add(dictionary_entry)
        session.commit()
        session.refresh(dictionary_entry)
        _enrich_dictionary_entry(dictionary_entry, session)

    user_word = UserWord(user_id=current_user.id, dictionary_id=dictionary_entry.id, status="NEW")
    session.add(user_word)
    session.commit()
    session.refresh(user_word)

    return {"id": user_word.id, "text": dictionary_entry.text, "status": user_word.status}


@router.get("/stats")
def get_word_stats(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """GET /words/stats — 返回当前用户的单词统计数字，不受分页影响"""
    statement = select(UserWord).where(UserWord.user_id == current_user.id)
    all_user_words = session.exec(statement).all()

    mastered = sum(1 for uw in all_user_words if uw.status == "MASTERED")
    practicing = sum(1 for uw in all_user_words if uw.status == "PRACTICING")
    new = sum(1 for uw in all_user_words if uw.status == "NEW")

    return {
        "mastered": mastered,
        "practicing": practicing,
        "new": new,
        "total": len(all_user_words)
    }

@router.get("/{user_word_id}", response_model=WordDetail)
def get_word(
    user_word_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """GET /words/{id} — 获取详情，id指的是UserWord的id，同时校验属于当前用户"""
    user_word = session.get(UserWord, user_word_id)
    if not user_word or user_word.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Word not found")

    dictionary_entry = session.get(Dictionary, user_word.dictionary_id)

    sessions_list = session.exec(
        select(PracticeSession)
        .where(PracticeSession.user_word_id == user_word.id)
        .order_by(PracticeSession.created_at.desc())
    ).all()

    collocations = []
    if chroma_client:
        try:
            collection = chroma_client.get_collection(name="vocab-examples")
            results = collection.query(query_texts=[dictionary_entry.text], n_results=3)
            collocations = results["documents"][0] if results["documents"] else []
        except Exception:
            pass

    return WordDetail(
        id=user_word.id,
        text=dictionary_entry.text,
        definition=dictionary_entry.definition,
        example=dictionary_entry.example,
        status=user_word.status,
        created_at=user_word.created_at.isoformat(),
        phonetic=dictionary_entry.phonetic,
        audio_url=dictionary_entry.audio_url,
        part_of_speech=dictionary_entry.part_of_speech,
        synonyms=dictionary_entry.synonyms,
        antonyms=dictionary_entry.antonyms,
        etymology=dictionary_entry.etymology,
        difficulty=dictionary_entry.difficulty,
        tone=dictionary_entry.tone,
        memory_aid=dictionary_entry.memory_aid,
        is_enriched=dictionary_entry.is_enriched,
        sessions=sessions_list,
        collocations=collocations
    )


@router.delete("/{user_word_id}")
def delete_word(
    user_word_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """DELETE /words/{id} — 删除当前用户的这个词（不删Dictionary共享数据，只删UserWord关系）"""
    user_word = session.get(UserWord, user_word_id)
    if not user_word or user_word.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Word not found")

    session.delete(user_word)
    session.commit()
    return {"success": True}
