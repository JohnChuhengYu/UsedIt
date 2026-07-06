"""
UsedIt — Practice endpoints: scene generation and sentence judgment.
Built with LangChain + ChatOllama, using Pydantic for structured output.
"""

import os
import random
import chromadb
import logging
from enum import Enum
from typing import Optional

logger = logging.getLogger("uvicorn.error")

from fastapi import APIRouter, Depends, HTTPException
from langchain_ollama import ChatOllama
from langchain_core.runnables import RunnableLambda
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.database import get_session
from app.models import Word, PracticeSession

router = APIRouter(prefix="/words", tags=["Practice"])

# ── ChromaDB setup ──────────────────────────────────────────────────

CHROMA_DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "chroma_db"
)
try:
    chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
except Exception:
    chroma_client = None

def get_reference_examples(word_text: str, n_results: int = 3) -> list[str]:
    if not chroma_client:
        return []
    try:
        collection = chroma_client.get_collection(name="vocab-examples")
        results = collection.query(query_texts=[word_text], n_results=n_results)
        return results["documents"][0] if results and results.get("documents") else []
    except Exception:
        return []


# ── LLM setup ──────────────────────────────────────────────────────

ollama_model = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
ollama_url = os.getenv("OLLAMA_API_URL", "http://localhost:11434")

# Note: ChatOllama expects base_url, not the full /api/generate path
base_url = ollama_url.replace("/api/generate", "") if ollama_url.endswith("/api/generate") else ollama_url

llm = ChatOllama(model=ollama_model, base_url=base_url, temperature=0.3)


# ── Structured output schemas ─────────────────────────────────────

class SceneOutput(BaseModel):
    context_reasoning: str = Field(
        description="Brief reasoning: what kind of real-life social situation naturally calls for this word, based on its meaning"
    )
    scene: str = Field(
        description="A short, specific conversational scenario matching the reasoning above"
    )


class JudgeOutput(BaseModel):
    correct: bool = Field(description="Whether the word is used with the correct meaning and grammar")
    natural: bool = Field(description="Whether the sentence sounds natural, like a native speaker would say it")
    feedback: str = Field(description="One short sentence of feedback; if incorrect or unnatural, briefly explain why and suggest a fix")

class MeaningJudgment(BaseModel):
    reasoning: str = Field(description="Brief analysis: does the word's core meaning match how it's used here, and is the grammar correct?")
    correct: bool = Field(description="Based on the reasoning above: true only if meaning and grammar are both correct")
    rating_word: str = Field(description="ONE word summarizing this: 'Correct', 'Close', or 'Incorrect'")

class NaturalnessJudgment(BaseModel):
    reasoning: str = Field(description="Brief analysis: would a native speaker phrase it this way, or does it sound stiff/translated/awkward?")
    natural: bool = Field(description="Based on the reasoning above: true only if it sounds fully native, no awkwardness")
    rating_word: str = Field(description="ONE word summarizing this: 'Native', 'Slightly Off', or 'Awkward'")

class FeedbackOutput(BaseModel):
    feedback: str = Field(description="One short, actionable sentence — must match the assessment given, never contradict it")
    example_sentence: str = Field(description="A corrected example sentence that MUST include the exact target word, demonstrating correct natural usage in the same scene. Leave empty string if no example is needed.")

scene_model = llm.with_structured_output(SceneOutput)
meaning_model = llm.with_structured_output(MeaningJudgment)
naturalness_model = llm.with_structured_output(NaturalnessJudgment)
feedback_model = llm.with_structured_output(FeedbackOutput)

def _has_json_artifacts(text: str) -> bool:
    if not text:
        return False
    return any(c in text for c in ['{', '}', '":'])

def judge_meaning(word: str, scene: str, sentence: str) -> MeaningJudgment:
    system = (
        "You are a precise grammar and semantics judge for a vocabulary app. "
        "Analyze ONLY whether the target word's meaning fits its use here, and whether "
        "the grammar around it is correct. Ignore style or naturalness entirely — a "
        "sentence can be grammatically correct but sound awkward, and that is NOT your concern.\n\n"
        "Common failure patterns to check for:\n"
        "- Wrong part of speech (e.g. using an adjective as a noun)\n"
        "- Wrong meaning sense (word has multiple meanings, wrong one used)\n"
        "- Missing required grammar structure (e.g. 'whether' often needs 'or')\n\n"
        "Keep your reasoning to ONE sentence. Do not explain the word's general definition "
        "at length — just state whether this specific usage is correct and why, briefly.\n"
        "Also provide a rating_word: one word only, no explanation, from the given options."
    )
    user = f'Word: "{word}"\nScene: {scene}\nSentence: {sentence}'
    
    for _ in range(3):
        result = meaning_model.invoke([("system", system), ("human", user)])
        if not _has_json_artifacts(result.reasoning):
            return result
            
    return MeaningJudgment(
        reasoning="I couldn't properly analyze the meaning of this sentence.",
        correct=False,
        rating_word="INCORRECT"
    )

def judge_naturalness(word: str, scene: str, sentence: str) -> NaturalnessJudgment:
    system = (
        "You are a native-speaker naturalness judge for a vocabulary app. Assume grammar "
        "and meaning are already correct and already explained elsewhere — do NOT restate "
        "or re-explain what the word means. Focus ONLY on whether a native speaker would "
        "phrase it this way, or whether it sounds textbook-ish, overly formal, or translated.\n\n"
        "Keep your reasoning to ONE sentence. Do not repeat the word's definition — just "
        "state what specifically sounds off (word choice, phrasing, tone) and why.\n"
        "Also provide a rating_word: one word only, no explanation, from the given options."
    )
    user = f'Word: "{word}"\nScene: {scene}\nSentence: {sentence}'
    
    for _ in range(3):
        result = naturalness_model.invoke([("system", system), ("human", user)])
        if not _has_json_artifacts(result.reasoning):
            return result
            
    return NaturalnessJudgment(
        reasoning="This phrasing sounds a bit awkward.",
        natural=False,
        rating_word="AWKWARD"
    )

def _clean_feedback(feedback: str) -> str | None:
    has_json_artifacts = _has_json_artifacts(feedback)
    too_long = len(feedback.split()) > 40
    too_short = len(feedback.strip()) < 5
    
    if has_json_artifacts or too_long or too_short:
        return None
    return feedback.strip()

def generate_simple_feedback(word: str, sentence: str, scene: str, meaning: MeaningJudgment) -> FeedbackOutput:
    system = (
        "The user made a meaning/grammar mistake with the target word. Using the reasoning "
        "given, write ONE short sentence pointing out what's wrong, PLUS one corrected example "
        "sentence that uses the word correctly in the same scene.\n\n"
        f'CRITICAL: the example_sentence MUST contain the exact word "{word}".\n'
        "The feedback field must be ONE clean sentence, under 25 words. Do not repeat the "
        "reasoning verbatim. Do not include JSON syntax, brackets, or quotation marks around "
        "the whole sentence."
    )
    user = f'Word: "{word}"\nScene: {scene}\nSentence: {sentence}\nWhy it\'s wrong: {meaning.reasoning}'

    for _ in range(3):
        result = feedback_model.invoke([("system", system), ("human", user)])
        cleaned = _clean_feedback(result.feedback)
        if cleaned:
            result.feedback = cleaned
            if result.example_sentence and word.lower() not in result.example_sentence.lower():
                result.example_sentence = None
            return result

    return FeedbackOutput(
        feedback=f'"{word}" isn\'t used correctly here — check the meaning and try rephrasing.',
        example_sentence=None,
    )

def generate_positive_feedback(word: str, sentence: str, meaning: MeaningJudgment, naturalness: NaturalnessJudgment) -> FeedbackOutput:
    system = (
        "The user used the target word correctly and naturally. Write ONE short, specific "
        "encouraging sentence, under 20 words. Do NOT include example_sentence, leave it null. "
        "Do not include JSON syntax or brackets in the feedback text."
    )
    user = f'Word: "{word}"\nSentence: {sentence}\nWhy it works: {meaning.reasoning} {naturalness.reasoning}'

    for _ in range(3):
        result = feedback_model.invoke([("system", system), ("human", user)])
        cleaned = _clean_feedback(result.feedback)
        if cleaned:
            result.feedback = cleaned
            result.example_sentence = None
            return result

    return FeedbackOutput(feedback=f'Nice work using "{word}" naturally!', example_sentence=None)

def generate_rag_enhanced_feedback(word: str, sentence: str, scene: str, naturalness: NaturalnessJudgment, examples: list[str]) -> FeedbackOutput:
    examples_text = "\n".join(f"- {ex}" for ex in examples) if examples else "No reference examples available."
    system = (
        "The user's grammar/meaning is correct, but it sounds unnatural. Using the reasoning "
        "and real reference examples given, write ONE short sentence explaining why it sounds "
        "off, PLUS one more natural example sentence for the same scene.\n\n"
        f'CRITICAL: the example_sentence MUST contain the exact word "{word}".\n'
        "The feedback field must be ONE clean sentence, under 30 words. Do NOT repeat the "
        "reasoning verbatim, do NOT include JSON syntax, brackets, or any formatting characters."
    )
    user = f'Word: "{word}"\nScene: {scene}\nSentence: {sentence}\nWhy it sounds off: {naturalness.reasoning}\nReal usage examples:\n{examples_text}'

    for _ in range(3):
        result = feedback_model.invoke([("system", system), ("human", user)])
        cleaned = _clean_feedback(result.feedback)
        if cleaned:
            result.feedback = cleaned
            if result.example_sentence and word.lower() not in result.example_sentence.lower():
                result.example_sentence = None
            return result

    return FeedbackOutput(
        feedback="This usage sounds a bit off — try adjusting the phrasing to feel more natural.",
        example_sentence=None,
    )


# ── Routes ─────────────────────────────────────────────────────────

@router.get("/{word_id}/scene")
def get_scene(word_id: int, session: Session = Depends(get_session)):
    """GET /words/{id}/scene — generate a conversational scene, letting the AI reason about the best context for this word."""
    word = session.get(Word, word_id)
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    system_prompt = (
        "You are a scene generator for a vocabulary practice app. Your task has two steps:\n\n"
        "STEP 1 — Think: What kind of real-life social situation would naturally call for "
        "this word? Consider the word's meaning and typical usage (e.g. does it relate to a "
        "decision, an opinion, a request, a complaint, an emotion, a description of someone's "
        "ability?). Briefly state your reasoning in 1 sentence.\n\n"
        "STEP 2 — Generate a scenario matching that reasoning, where someone speaks directly "
        "TO the user, and the user needs to reply using the target word.\n\n"
        "STRICT RULES:\n"
        "1. The scenario MUST include a direct quote where someone asks the user a question, "
        "asks for advice, or directly requests the user's input/decision. A statement that "
        "only describes the speaker's own feelings, without asking the user anything, is NOT "
        "acceptable.\n"
        "2. The scenario text must NOT contain the target word itself, any form of it, or its "
        "direct synonyms anywhere. Describe the SITUATION that calls for this word, without "
        "naming it.\n"
        "3. Do NOT generate an example answer, do NOT translate the word, do NOT explain its "
        "meaning.\n"
        "4. Maximum 2 sentences for the scene, under 35 words total.\n"
        "5. Vary who is speaking — friend, coworker, family member, stranger, manager, doctor, "
        "roommate, interviewer, etc. Do not default to the same relationship every time.\n\n"
        "Example 1:\n"
        "Word: 'whether'\n"
        "context_reasoning: 'This word relates to uncertainty between two choices, so a good "
        "situation involves someone facing a decision.'\n"
        "scene: 'Your friend holds up two jackets and asks, \"Which one should I get? I can't "
        "decide.\"'\n\n"
        "Example 2:\n"
        "Word: 'eloquent'\n"
        "context_reasoning: 'This word describes someone speaking impressively well, so a good "
        "situation involves evaluating someone's speaking performance.'\n"
        "scene: 'Your coworker just finished a big presentation and asks, \"Be honest, how did "
        "I do?\"'\n\n"
        "Example 3:\n"
        "Word: 'reluctant'\n"
        "context_reasoning: 'This word describes unwillingness to do something, so a good "
        "situation involves someone being asked to do a task they may not want to do.'\n"
        "scene: 'Your manager says, \"I need someone to work this weekend — can you do it?\"'"
    )
    user_prompt = f'Generate a conversational scenario for practicing the word "{word.text}".'

    for attempt in range(3):
        try:
            result: SceneOutput = scene_model.invoke(
                [("system", system_prompt), ("human", user_prompt)]
            )
            
            logger.info(f"--- LLM Scene Generation ---")
            logger.info(f"Word: {word.text}, Output: {result.model_dump()}")
            
            scene_text = result.scene

            word_count = len(scene_text.split())
            contains_target_word = word.text.lower() in scene_text.lower()
            has_quoted_speech = '"' in scene_text or "'" in scene_text

            if word_count > 45 or contains_target_word or not has_quoted_speech or _has_json_artifacts(scene_text):
                continue

            return {
                "word": word.text,
                "scene": scene_text,
                "reasoning": result.context_reasoning,
            }

        except Exception:
            continue

    return {
        "word": word.text,
        "scene": f'A friend turns to you and says, "What do you think about this?" — try responding using "{word.text}".',
        "reasoning": None,
    }


@router.post("/{word_id}/judge")
def judge_sentence(word_id: int, scene: str, sentence: str, session: Session = Depends(get_session)):
    """POST /words/{id}/judge — judge a user's sentence, update word status if needed."""
    word = session.get(Word, word_id)
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    try:
        meaning = judge_meaning(word.text, scene, sentence)
        
        if not meaning.correct:
            feedback_out = generate_simple_feedback(word.text, sentence, scene, meaning)
            natural = False
            feedback_text = feedback_out.feedback
            example_sentence = feedback_out.example_sentence
        else:
            naturalness = judge_naturalness(word.text, scene, sentence)
            if not naturalness.natural:
                examples = get_reference_examples(word.text, n_results=3)
                feedback_out = generate_rag_enhanced_feedback(word.text, sentence, scene, naturalness, examples)
                natural = False
                feedback_text = feedback_out.feedback
                example_sentence = feedback_out.example_sentence
            else:
                feedback_out = generate_positive_feedback(word.text, sentence, meaning, naturalness)
                natural = True
                feedback_text = feedback_out.feedback
                example_sentence = feedback_out.example_sentence
                
        logger.info(f"--- LLM Judgment Pipeline ---")
        logger.info(f"Sentence: {sentence}")
        logger.info(f"Meaning reasoning: {meaning.reasoning} -> Correct: {meaning.correct}")
        if meaning.correct:
            logger.info(f"Naturalness reasoning: {naturalness.reasoning} -> Natural: {natural}")
        logger.info(f"Final Feedback: {feedback_text}")
        if example_sentence:
            logger.info(f"Example Sentence: {example_sentence}")
        
    except Exception as e:
        logger.error(f"AI judgment failed: {e}")
        raise HTTPException(status_code=503, detail="AI judgment failed — please try again")

    passed = meaning.correct and natural

    if word.status == "NEW":
        word.status = "PRACTICING"
        session.add(word)
        session.commit()

    recent = session.exec(
        select(PracticeSession)
        .where(PracticeSession.word_id == word_id)
        .order_by(PracticeSession.created_at.desc())
        .limit(3)
    ).all()

    consecutive_passed = [passed] + [s.passed for s in recent]
    if len(consecutive_passed) >= 4 and all(consecutive_passed[:4]):
        word.status = "MASTERED"
        session.add(word)
        session.commit()

    return {
        "correct": meaning.correct,
        "natural": natural,
        "passed": passed,
        "feedback": feedback_text,
        "example_sentence": example_sentence,
        "word_status": word.status,
        "meaning_reasoning": meaning.reasoning,
        "naturalness_reasoning": naturalness.reasoning if 'naturalness' in locals() else None,
        "meaning_rating": meaning.rating_word,
        "naturalness_rating": naturalness.rating_word if 'naturalness' in locals() else None,
    }
