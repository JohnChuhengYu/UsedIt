# Changelog

All notable changes to the **UsedIt** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-10-31

### Added
- **Local-First Zero-Login Architecture**: Replaced the mandatory login wall with automatic local provisioning (`local_learner`). Instant, zero-friction access on startup without passwords or session tokens.
- **Authoritative Corpus-Grounded Decks (`/decks`)**: Integrated peer-reviewed academic corpora (Coxhead AWL Sublist 1, Oxford 5000 C1, ETS GRE Analytical, COCA Spoken High-Yield) with full academic citations and CEFR level tagging.
- **Dedicated Corpora Tab in OWN View**: Integrated corpus browsing and one-click import directly into the progress dashboard, replacing disruptive modal dialogs.
- **Batch Word Ingestion (`POST /words/batch`)**: High-throughput word import endpoint with automatic dictionary deduplication and enrichment.
- **Global In-Memory Instant Search**: Client-side 0ms instant search across the entire dictionary, paired with backend `search` parameter support in `GET /words`.
- **One-Click Process Lifecycle Scripts**: Added `start.sh` and `stop.sh` with live log streaming, port conflict resolution, and background daemon management.

### Changed
- **Performance Upgrade — Full-Library Loading**: Eliminated the sluggish 20-item infinite scroll and scroll event listeners. The app now loads the complete vocabulary library in a single lightweight request (< 30 KB for hundreds of words), delivering 120 FPS native scrolling.
- **Editorial Minimalist Aesthetic Overhaul**: Enforced strict zero-emoji design guidelines across all views. Refined typography using classic serif and monospace layouts, subtle micro-rotations, and intentional `#EC4899` editorial accents.
- **User Profile Scope**: Streamlined `/auth/me` (`GET`/`PATCH`) exclusively for user settings and grading strictness (`Lenient`, `Normal`, `Strict`).
- **Synchronized Progress Metrics**: Aligned backend SQL queries and frontend stats rendering for mastered, practicing, and new words.

### Fixed
- **Mastery Criteria Bug**: Corrected consecutive-pass threshold from an unattainable 4 out of 3 sessions to 3 consecutive verified passes in `backend/app/routers/practice.py`.
- **Test Database Isolation**: Configured SQLite in-memory engine with `StaticPool` for `pytest`, preventing test records from polluting the primary development database (`dev.db`).

---

## [1.0.0] - 2026-10-29

### Added
- **Local AI Context Generation**: Integrated LangChain and Ollama (`llama3.1:8b`) to generate dynamic, role-playing conversational prompts tailored to vocabulary words.
* **Dual-LLM Temperature Architecture**: Decoupled prompt generation (`temperature=0.3`) from deterministic grading (`temperature=0.1`).
* **RAG-Powered Collocation Retrieval**: ChromaDB vector store populated with authentic Tatoeba English sentences to rewrite awkward learner sentences.
* **Cascaded Multi-Stage Judgment**: Split evaluation into independent semantic/syntax checks (`judge_meaning`) and native phrasing checks (`judge_naturalness`).
* **Adaptive Strictness Tiers**: Added `Lenient`, `Normal`, and `Strict` grading presets configurable from the user profile.
* **Two-Tier Database Architecture**: Decoupled shared global dictionary cache (`Dictionary`) from user learning relationships (`UserWord`) for 90%+ storage and query efficiency.
* **Full Authentication Flow**: Supports username/password with `bcrypt` + JWT tokens, and Google OAuth 2.0 integration via `Authlib`.
* **React 19 + Tailwind CSS v4 Frontend**: Clean editorial aesthetic, responsive design, progress tracking charts, and optimistic UI state updates.
* **Corpus Ingestion Pipeline**: Automation script (`automation_pipeline.py`) to parse, clean, and embed TSV corpora into persistent ChromaDB collections.
* **Full Documentation Suite**:
  - Comprehensive English & Chinese Architecture Deep Dive (`docs/BACKEND_AND_AI_TECH.md` & `docs/BACKEND_AND_AI_TECH_CN.md`).
  - Step-by-step Quickstart guide (`docs/QUICKSTART_CN.md`).
  - Open-source community files (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE`).

---

[1.0.0]: https://github.com/JohnChuhengYu/UsedIt/releases/tag/v1.0.0

