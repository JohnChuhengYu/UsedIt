# Changelog

All notable changes to the **UsedIt** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

