"""
UsedIt — FastAPI application entry point.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_db_and_tables
from app.routers import sessions, words, practice


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    create_db_and_tables()
    yield


app = FastAPI(
    title="UsedIt API",
    description="Vocabulary learning app — practice words in context with AI feedback.",
    version="1.0.0",
    lifespan=lifespan,
)

import os
from dotenv import load_dotenv

load_dotenv()

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

# ── CORS ───────────────────────────────────────────────────────────
# Allow the Vite dev server (localhost:5173) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────
app.include_router(words.router)
app.include_router(sessions.router)
app.include_router(practice.router)


@app.get("/")
def root():
    return {"message": "UsedIt API is running", "docs": "/docs"}
