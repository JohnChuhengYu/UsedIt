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
│   └── package.json          # Node dependencies
├── backend/                  # FastAPI backend services
│   ├── app/                  # Application code (routers, models, database)
│   ├── data/                 # Databases and datasets (SQLite, ChromaDB)
│   ├── scripts/              # Data automation and maintenance scripts
│   └── requirements.txt      # Python dependencies
├── docs/                     # Additional documentation (empty for now)
└── .gitignore                # Git ignore rules
```

## 🚀 Getting Started

### Prerequisites
1. **Node.js** (v18+) & **npm**
2. **Python** (v3.10+)
3. **Ollama**: Install [Ollama](https://ollama.com/) and run the Llama 3.1 model locally:
   ```bash
   ollama run llama3.1:8b
   ```

### 1. Backend Setup
Navigate to the `backend` directory and set up the Python environment:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload
```
*The backend will run at `http://localhost:8000` (API docs at `http://localhost:8000/docs`).*

### 2. Frontend Setup
Open a new terminal, navigate to the `frontend` directory:

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```
*The frontend will run at `http://localhost:5173`.*

### 3. Default Test Account
You can log into the application using the following test account:
- **Username**: `testuser`
- **Password**: `password123`

## 🗄️ Data Management & Scripts

The `backend/scripts/` directory contains tools for managing the vector database (ChromaDB) which provides real-world collocation examples for words.

- **`automation_pipeline.py`**: Extracts example sentences from raw datasets, processes them, and ingests them into the Chroma vector database.
- **`read_chromadb.py`**: A utility script to quickly inspect the contents of the `vocab-examples` collection inside ChromaDB to verify data insertion.
- **`setup_chroma.py`**: A basic script to manually test ChromaDB initialization and insert a few dummy examples.

To run any of the scripts, ensure your backend virtual environment is activated, then execute:
```bash
python backend/scripts/read_chromadb.py
```

## 🗺️ Roadmap & Future Improvements

This project is currently in its initial phase. Here are some planned improvements to make it more robust and production-ready:

- [ ] **Dockerization:** Add `Dockerfile` and `docker-compose.yml` for one-click setup.
- [ ] **Frontend State/Data Fetching:** Integrate `@tanstack/react-query` to handle API loading/error states and caching.
- [ ] **Database Migrations:** Integrate `Alembic` for manageable backend database schema changes.
- [ ] **CI/CD Pipeline:** Add GitHub Actions for automated linting, testing, and deployment.
- [ ] **Testing:** Add `pytest` for backend unit tests and `vitest` for frontend components.
- [ ] **Security:** Implement rate limiting for LLM endpoints and tighten CORS settings.

---
*Built with ❤️ for better vocabulary learning.*
