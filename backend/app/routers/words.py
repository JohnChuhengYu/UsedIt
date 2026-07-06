"""
UsedIt — Word CRUD API endpoints.
Migrated from Next.js API route: app/src/app/api/words/route.ts
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

import os
import requests
import chromadb
import logging
from app.database import get_session
from app.models import Word, WordCreate, WordRead, PracticeSession, SessionRead

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/words", tags=["Words"])

CHROMA_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "chroma_db")
try:
    chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
except Exception:
    chroma_client = None

@router.get("", response_model=list[WordRead])
def list_words(session: Session = Depends(get_session)):
    """GET /words — list all words, newest first."""
    statement = select(Word).order_by(Word.created_at.desc())
    words = session.exec(statement).all()
    return words


@router.post("", response_model=WordRead, status_code=201)
def create_word(body: WordCreate, session: Session = Depends(get_session)):
    """POST /words — add a new word. Returns 409 if duplicate."""
    cleaned_text = body.text.lower().strip()

    # Check for duplicates
    existing = session.exec(select(Word).where(Word.text == cleaned_text)).first()
    if existing:
        raise HTTPException(status_code=409, detail="This word already exists in your vocabulary")

    word = Word(
        text=cleaned_text,
        definition=body.definition.strip(),
        example=body.example.strip() if body.example else "",
    )
    session.add(word)
    session.commit()
    session.refresh(word)
    return word


DIFFICULTY_DB = {
    "trivial": "Easy",
    "eloquent": "Medium",
    "procrastinate": "Hard",
    "profound": "Hard",
    "skeptical": "Medium",
    "versatile": "Medium"
}
ETYMOLOGY_DB = {
    "eloquent": "From Latin eloquent- 'speaking out', from the verb eloqui, from e- (variant of ex-) 'out' + loqui 'speak'.",
    "trivial": "From Latin trivialis 'belonging to the crossroads, commonplace', from trivium 'place where three roads meet'.",
}

@router.get("/{word_id}", response_model=WordRead)
def get_word(word_id: int, session: Session = Depends(get_session)):
    """GET /words/{id} — get a single word by ID (with auto-enrichment)."""
    word = session.get(Word, word_id)
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    
    if not word.is_enriched:
        try:
            # 1. Free Dictionary API
            res = requests.get(f"https://api.dictionaryapi.dev/api/v2/entries/en/{word.text}", timeout=5)
            if res.status_code == 200:
                data = res.json()[0]
                phonetics = data.get("phonetics", [])
                word.phonetic = data.get("phonetic") or (phonetics[0].get("text") if phonetics else None)
                for p in phonetics:
                    if p.get("audio"):
                        word.audio_url = p["audio"]
                        break
                        
                meanings = data.get("meanings", [])
                if meanings:
                    word.part_of_speech = meanings[0].get("partOfSpeech", "")
                    # Backfill definition and example from API
                    defs = meanings[0].get("definitions", [])
                    if defs:
                        if not word.definition:
                            word.definition = defs[0].get("definition", "")
                        if not word.example:
                            word.example = defs[0].get("example", "")
                    syns = []
                    ants = []
                    for m in meanings:
                        syns.extend(m.get("synonyms", []))
                        ants.extend(m.get("antonyms", []))
                    word.synonyms = ", ".join(list(set(syns))[:5]) if syns else None
                    word.antonyms = ", ".join(list(set(ants))[:5]) if ants else None
            
            # 2. Static Lookups
            word.difficulty = DIFFICULTY_DB.get(word.text, "Medium")
            word.etymology = ETYMOLOGY_DB.get(word.text)
            
            # 3. Local AI (Ollama)
            try:
                ollama_url = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/generate")
                ollama_model = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
                ai_res = requests.post(
                    ollama_url,
                    json={
                        "model": ollama_model,
                        "prompt": f"Respond ONLY with a valid JSON object mapping 'tone' (formal, neutral, informal, or academic) and 'memory_aid' (2 sentences max) for the word '{word.text}'.",
                        "stream": False
                    },
                    timeout=2
                )
                if ai_res.status_code == 200:
                    import json
                    resp_text = ai_res.json().get("response", "{}")
                    parsed = json.loads(resp_text)
                    logger.info(f"--- LLM Enrichment ---")
                    logger.info(f"Word: {word.text}, Output: {parsed}")
                    word.tone = parsed.get("tone", "neutral").capitalize()
                    word.memory_aid = parsed.get("memory_aid")
                else:
                    raise Exception("Ollama failed")
            except Exception:
                # Mock if Ollama fails/not present
                word.tone = "Formal" if len(word.text) > 6 else "Neutral"
                word.memory_aid = f"Think of a time when you had to be very {word.text}."

            word.is_enriched = True
            session.add(word)
            session.commit()
            session.refresh(word)
        except Exception as e:
            print(f"Enrichment failed: {e}")

    # Convert to WordRead before attaching non-DB fields (use dump to avoid relationship recursion)
    response = WordRead(**word.model_dump())

    # Attach sessions
    response.sessions = session.exec(select(PracticeSession).where(PracticeSession.word_id == word_id).order_by(PracticeSession.created_at.desc())).all()

    # Attach collocations
    response.collocations = []
    if chroma_client:
        try:
            collection = chroma_client.get_collection(name="vocab-examples")
            results = collection.get(where={"word": word.text})
            if results and results.get("documents"):
                response.collocations = results["documents"]
        except Exception:
            pass

    return response


@router.delete("/{word_id}")
def delete_word(word_id: int, session: Session = Depends(get_session)):
    """DELETE /words/{id} — delete a word and its sessions (cascade)."""
    word = session.get(Word, word_id)
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    session.delete(word)
    session.commit()
    return {"success": True}


@router.get("/{word_id}/sessions", response_model=list[SessionRead])
def get_word_sessions(word_id: int, session: Session = Depends(get_session)):
    """GET /words/{id}/sessions — get practice history for a word."""
    word = session.get(Word, word_id)
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    
    statement = select(PracticeSession).where(PracticeSession.word_id == word_id).order_by(PracticeSession.created_at.desc())
    results = session.exec(statement).all()
    return results


@router.get("/{word_id}/collocations", response_model=list[str])
def get_word_collocations(word_id: int, session: Session = Depends(get_session)):
    """GET /words/{id}/collocations — get real usage examples from ChromaDB."""
    word = session.get(Word, word_id)
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    
    if not chroma_client:
        return []

    try:
        collection = chroma_client.get_collection(name="vocab-examples")
        results = collection.get(where={"word": word.text})
        if results and results.get("documents"):
            return results["documents"]
        return []
    except Exception:
        # Collection might not exist yet
        return []
