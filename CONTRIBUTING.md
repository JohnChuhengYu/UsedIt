# Contributing to UsedIt

Thank you for your interest in contributing to **UsedIt**! 🎉

Whether you are fixing a bug, adding vocabulary enrichment features, improving the UI, or enhancing our AI prompt pipelines, your contributions help make UsedIt a better tool for language learners worldwide.

---

## 📋 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please treat all contributors and users with respect, empathy, and constructive feedback.

---

## 🛠️ Getting Started

### 1. Fork & Clone
1. Fork the repository on GitHub: `https://github.com/JohnChuhengYu/UsedIt`
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/UsedIt.git
   cd UsedIt
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/JohnChuhengYu/UsedIt.git
   ```

### 2. Local Development Setup
Follow the step-by-step instructions in the [Quick Start Guide in README](./README.md#-quick-start-guide) to set up:
- **Ollama**: Ensure `ollama run llama3.1:8b` is running.
- **Backend**: Set up the Python virtual environment in `backend/` and install requirements (`pip install -r requirements.txt`).
- **Frontend**: Install Node dependencies in `frontend/` (`npm install`).

---

## 🌿 Branching Strategy

Always create a new branch from `main` for your work. Use clear branch names prefixed by category:

| Prefix | Usage | Example |
| :--- | :--- | :--- |
| `feat/` | New features or enhancements | `feat/speech-to-text-input` |
| `fix/` | Bug fixes | `fix/chroma-case-sensitivity` |
| `docs/` | Documentation improvements | `docs/add-api-specs` |
| `refactor/` | Code refactoring without changing behavior | `refactor/practice-pipeline` |
| `perf/` | Performance optimizations | `perf/vector-search-caching` |

```bash
git checkout -b feat/your-feature-name
```

---

## 📝 Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>(<scope>): <subject>
```

Common types:
* `feat`: A new feature
* `fix`: A bug fix
* `docs`: Documentation only changes
* `style`: Changes that do not affect the meaning of the code (white-space, formatting)
* `refactor`: A code change that neither fixes a bug nor adds a feature
* `perf`: A code change that improves performance
* `test`: Adding missing tests or correcting existing tests
* `chore`: Changes to build process, dependencies, or auxiliary tools

**Example**:
```text
feat(practice): add speech-to-text input with Web Speech API
fix(auth): handle expired JWT tokens gracefully with 401 redirect
docs: update vector database benchmark figures
```

---

## 🎨 Coding Standards

### Backend (Python / FastAPI)
* Follow **PEP 8** naming conventions and formatting.
* Use type annotations (`int | None`, `Pydantic BaseModel`, `SQLModel`).
* Ensure all database models inherit from `SQLModel` with table specifications.
* Keep routers decoupled inside `backend/app/routers/`.
* When interacting with LLMs, always use structured outputs (`with_structured_output`) with Pydantic validation.

### Frontend (React 19 / TypeScript / Vite)
* Write clean, functional React components with standard hooks (`useState`, `useEffect`, `useCallback`).
* Follow TypeScript strict mode; avoid using `any`.
* Use **Tailwind CSS v4** utility classes following the existing editorial design style.
* Keep layout responsive (mobile-first breakpoints: `sm:`, `md:`, `lg:`).

---

## 🧪 Testing Your Changes

Before submitting your PR:
1. Ensure the frontend builds cleanly without errors:
   ```bash
   cd frontend
   npm run build
   ```
2. Verify backend startup and database table generation:
   ```bash
   cd backend
   ./venv/bin/uvicorn app.main:app --reload
   ```
3. Test the core user flows:
   - Add a word to the library.
   - Run a practice session and receive AI judgment.
   - Check progress page statistics.

---

## 📬 Submitting a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Open a Pull Request against the `main` branch of `JohnChuhengYu/UsedIt`.
3. Fill in the Pull Request template describing:
   - **What changed** and **why**.
   - Any relevant issue numbers (`Fixes #12`).
   - Testing steps or screenshots/GIFs demonstrating the change.
4. Maintainers will review your PR and provide constructive feedback!

---

## 💡 Areas Where We Welcome Help

Looking for ideas to contribute? Check out our [Roadmap in README](./README.md#-roadmap--future-improvements) or tackle one of these high-value items:
- [ ] Docker Compose setup for instant one-click deployment.
- [ ] Spaced Repetition (FSRS / SM-2) algorithm integration.
- [ ] Voice input / Speech-to-Text for pronunciation practice.
- [ ] Unit tests for the dual-LLM pipeline and RAG retriever.
- [ ] UI dark mode toggle.

Thank you for contributing to the UsedIt community! 🚀

