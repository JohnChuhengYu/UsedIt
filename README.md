# <img src="./frontend/public/icon.svg" width="35" align="center" /> UsedIt

> Vocabulary learning app — practice words in context with AI feedback.

UsedIt is a full-stack vocabulary learning platform that leverages local LLMs (via Ollama) to generate dynamic, context-aware vocabulary practice exercises. It helps users learn words actively rather than just memorizing definitions.

## ✨ Features

- **Dynamic Context Generation:** Uses local LLMs (Llama 3.1) to generate realistic example sentences for vocabulary words.
- **Interactive Practice:** Practice words in various contexts with immediate AI-powered feedback on your usage.
- **Modern UI/UX:** Clean, responsive, and animated user interface built with React 19 and Tailwind CSS v4.
- **Vector Search (ChromaDB):** Efficient similarity search for contextual matching.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript
- **Routing:** React Router DOM

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQLite (with SQLModel/SQLAlchemy)
- **Vector DB:** ChromaDB
- **LLM Integration:** LangChain, Ollama (`llama3.1:8b` by default)

## 📁 Project Structure

```text
UsedIt/
├── frontend/                 # React 19 SPA
│   ├── src/                  # React components, pages, config, types
│   ├── .env.example          # Frontend environment template
│   └── package.json          # Node dependencies
├── backend/                  # FastAPI backend services
│   ├── app/                  # Application code (routers, models, database)
│   ├── data/                 # Databases (SQLite dev.db, ChromaDB chroma_db/)
│   ├── scripts/              # Data automation and maintenance scripts
│   ├── .env.example          # Backend environment template
│   └── requirements.txt      # Python dependencies
├── docs/                     # Additional documentation
│   └── QUICKSTART_CN.md      # 📖 完整中文启动与数据库配置指南
└── .gitignore                # Git ignore rules
```

---

## 🧭 Services & Ports Overview

| Component | Technology | Address / Port | Needs Standalone Start? | Startup Command |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | FastAPI (Python) | `http://localhost:8000` | **Yes** | `uvicorn app.main:app --reload --port 8000` |
| **Relational DB** | SQLite (SQLModel) | `backend/data/dev.db` | ❌ **No (Auto-created)** | Initialized automatically when backend boots up |
| **Vector DB** | ChromaDB | `backend/data/chroma_db/` | ❌ **No (Embedded)** | Embedded Python library; runs inside backend |
| **Local LLM** | Ollama (`llama3.1:8b`) | `http://localhost:11434` | **Yes** | `ollama run llama3.1:8b` |
| **Frontend** | React 19 + Vite | `http://localhost:5173` | **Yes** | `cd frontend && npm run dev` |

> 🇨🇳 **Looking for Chinese instructions?** See [docs/QUICKSTART_CN.md](./docs/QUICKSTART_CN.md) for the complete Chinese guide.

---

## 💡 How Database Bootup Works (FAQ)

> **"Do I need to start a database server like MySQL or PostgreSQL?"**
> 
> **No!** UsedIt uses **SQLite** and **ChromaDB**:
> - **SQLite (`backend/data/dev.db`)**: Self-contained, zero-configuration file-based database. When you start the FastAPI backend (`uvicorn app.main:app`), the application's startup lifecycle (`lifespan`) automatically executes `create_db_and_tables()`, creating the database file and all tables (`User`, `Dictionary`, `UserWord`, `PracticeSession`) if they do not already exist.
> - **ChromaDB**: Operates in embedded mode directly inside the Python backend process (stored at `backend/data/chroma_db`). No separate daemon or Docker container is needed.

---

## 🚀 Getting Started (Step-by-Step)

### Step 0: Prerequisites
1. **Python** (v3.10+)
2. **Node.js** (v18+) & **npm**
3. **Ollama**: Download and install [Ollama](https://ollama.com/)

---

### Step 1: Start Ollama (Local LLM)
UsedIt uses Ollama to generate sentences and evaluate practice feedback.

In your terminal:
```bash
ollama run llama3.1:8b
```
*(If Ollama service is already running in the background, this will load the model immediately).*

---

### Step 2: Configure & Start Backend (and Database)

Navigate to the `backend` folder:
```bash
cd backend
```

#### 1. Set Up Python Virtual Environment
- **macOS / Linux**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```
- **Windows (PowerShell)**:
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
- **Windows (Command Prompt)**:
  ```cmd
  python -m venv venv
  venv\Scripts\activate.bat
  ```

#### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 3. Environment Variables (`.env`)
Copy the provided example template:
```bash
cp .env.example .env
```
Ensure `backend/.env` contains your desired settings:
```env
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
SESSION_SECRET=usedit_session_dev_secret_key_change_in_production
JWT_SECRET_KEY=usedit_jwt_dev_secret_key_change_in_production
```

#### 4. Run Backend Server
```bash
# If venv is activated:
uvicorn app.main:app --reload --port 8000

# Or run directly via the venv binary (recommended):
./venv/bin/uvicorn app.main:app --reload --port 8000
# (Windows: .\venv\Scripts\uvicorn.exe app.main:app --reload --port 8000)
```

**Verify Backend & Database**:
- **Health Check**: Visit [http://localhost:8000/](http://localhost:8000/) — returns `{"message": "UsedIt API is running", "docs": "/docs"}`
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Database File**: Check `backend/data/` to confirm `dev.db` has been automatically created.

---

### Step 3: Start Frontend

Open a new terminal window and navigate to `frontend`:
```bash
cd frontend

# 1. Copy environment template
cp .env.example .env

# 2. Install Node dependencies (first time only)
npm install

# 3. Start Vite dev server
npm run dev
```

Open your browser at:
👉 **[http://localhost:5173](http://localhost:5173)**

---

### Step 4: Login / Register an Account

1. Open [http://localhost:5173](http://localhost:5173) in your browser.
2. Click **Register** on the auth page.
3. Enter any username and password (e.g. `testuser` / `password123`) to register and immediately log in.

---

## 🏛️ Architecture & Data Model

UsedIt uses a two-tier database structure designed for maximum storage efficiency and fast word lookup:

```text
[Dictionary (Global Shared Cache)] ── (1:N) ── [UserWord (User Learning State)]
  • Global word metadata (stored once)           • user_id (User ownership)
  • Definitions, phonetics, audio URLs           • status (NEW / PRACTICING / MASTERED)
  • Etymology, difficulty, memory aids, tone     • Timestamps
  • Synonyms, antonyms                                   │ (1:N)
                                                         ▼
                                                [PracticeSession (History Logs)]
                                                  • Context scene
                                                  • User input sentence
                                                  • AI evaluation & feedback
                                                  • passed (true / false)
```

- **`User`**: Supports password auth (bcrypt) and Google OAuth, storing the user's grading strictness preference (`Lenient`, `Normal`, `Strict`).
- **`Dictionary`**: Automatically enriched once via LLM/APIs when any user adds a word. Shared across all users.
- **`UserWord`**: Manages personal learning state (`NEW` -> `PRACTICING` -> `MASTERED`).
- **`PracticeSession`**: Logs all contextual practice attempts and detailed AI feedback.

---

## 📡 API Endpoints Reference

Explore and test interactive endpoints at **[http://localhost:8000/docs](http://localhost:8000/docs)**:

| Module | Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/register` | Public | Register a new username and password |
| | `POST` | `/auth/login` | Public | Authenticate and obtain JWT Bearer Token |
| | `GET` | `/auth/me` | Bearer | Get current user's profile and settings |
| | `PATCH` | `/auth/me` | Bearer | Update user settings (e.g., `grading_strictness`) |
| | `GET` | `/auth/google` | Public | Initiate Google OAuth redirect |
| **Words** | `GET` | `/words` | Bearer | Paginated word list with status filter (`skip`, `limit`, `status`) |
| | `POST` | `/words` | Bearer | Add word to user list (auto-enriches Dictionary entry) |
| | `GET` | `/words/stats` | Bearer | Learning statistics counts (`mastered`, `practicing`, `new`, `total`) |
| | `GET` | `/words/{id}` | Bearer | Detailed word metadata, collocations from ChromaDB, and practice history |
| | `DELETE` | `/words/{id}` | Bearer | Remove word from user list (preserves shared Dictionary) |
| **Practice** | `GET` | `/practice/{word_id}/scene` | Bearer | Generate real-world context scenario using Ollama + ChromaDB collocations |
| | `POST` | `/practice/{word_id}/judge` | Bearer | Evaluate user sentence for meaning, grammar, and naturalness with AI feedback |
| **Sessions** | `GET` | `/sessions` | Bearer | List practice history sessions for current user |
| | `POST` | `/sessions` | Bearer | Record a completed practice session |
| | `GET` | `/sessions/stats` | Bearer | Aggregate practice statistics (`total_sessions`, `passed_sessions`, `accuracy`) |

---

## 🗄️ Database Management & Maintenance

- **Reset Database**:
  To clear all data and start fresh, simply delete `backend/data/dev.db` while backend is stopped, then start the backend again. All tables will be cleanly recreated.
  ```bash
  rm backend/data/dev.db
  ```
- **ChromaDB Vector Scripts**:
  Located in `backend/scripts/` (run from the `backend/` directory using the virtual environment Python):
  - `./venv/bin/python scripts/read_chromadb.py`: Inspect the examples stored in ChromaDB.
  - `./venv/bin/python scripts/setup_chroma.py`: Test initialization and insert sample vectors.
  - `./venv/bin/python scripts/automation_pipeline.py`: Ingest vocabulary datasets into ChromaDB.

---

## 🛠️ Troubleshooting & FAQ

- **`command not found: uvicorn`**:
  Make sure you have activated the virtual environment (`source venv/bin/activate`) or use the explicit path `./venv/bin/uvicorn`.
- **Port 8000 or 5173 in use**:
  Check running processes with `lsof -i :8000` or specify another port (`uvicorn app.main:app --port 8001`).
- **Ollama connection failed / Practice gives 500 error**:
  Ensure Ollama is running (`curl http://localhost:11434/api/tags`) and model `llama3.1:8b` is pulled (`ollama pull llama3.1:8b`).

---

## 🗺️ Roadmap & Future Improvements

- [ ] **Dockerization:** Add `Dockerfile` and `docker-compose.yml` for one-click setup.
- [ ] **Frontend State/Data Fetching:** Integrate `@tanstack/react-query` to handle API loading/error states and caching.
- [ ] **Database Migrations:** Integrate `Alembic` for manageable backend database schema changes.
- [ ] **CI/CD Pipeline:** Add GitHub Actions for automated linting, testing, and deployment.
- [ ] **Testing:** Add `pytest` for backend unit tests and `vitest` for frontend components.
- [ ] **Security:** Implement rate limiting for LLM endpoints and tighten CORS settings.

---
*Built with ❤️ for better vocabulary learning.*
