from sqlmodel import Session
from app.database import engine, create_db_and_tables
from app.models import Word, PracticeSession
import time

create_db_and_tables()

with Session(engine) as session:
    word1 = Word(id=9, text="eloquent", definition="Fluent or persuasive in speaking or writing.", example="An eloquent speech.")
    session.add(word1)
    
    ps = PracticeSession(
        word_id=9,
        scene="At a debate competition",
        user_sentence="He spoke in an eloquent manner that won the debate.",
        ai_feedback="Great usage! The context fits perfectly.",
        passed=True
    )
    session.add(ps)
    
    ps2 = PracticeSession(
        word_id=9,
        scene="Writing an essay",
        user_sentence="The eloquent of the poem is good.",
        ai_feedback="'Eloquent' is an adjective, not a noun. Try 'eloquence'.",
        passed=False
    )
    session.add(ps2)

    word2 = Word(id=4, text="trivial", definition="Of little value or importance", example="Don't waste time on trivial matters.")
    session.add(word2)
    
    session.commit()
    print("Seeded database!")
