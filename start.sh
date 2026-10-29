#!/usr/bin/env bash
# ==============================================================================
# UsedIt — One-Click Development & Launch Script
# ==============================================================================
# Starts Ollama (if available), FastAPI backend, and Vite frontend with one command.
# Automatically opens your browser at http://localhost:5173 and handles clean shutdown.
# ==============================================================================

set -e

# Terminal colors
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo -e "${BOLD}${CYAN}"
echo "  _   _               _ _____ _   "
echo " | | | |___  ___   __| |_   _| |_ "
echo " | | | / __|/ _ \ / _\` | | | | __|"
echo " | |_| \__ \  __/| (_| | | | | |_ "
echo "  \___/|___/\___| \__,_| |_|  \__|"
echo -e "${RESET}"
echo -e "${BOLD}🚀 Starting UsedIt in Local-First Mode...${RESET}\n"

# ── 1. Check & Handle Ollama (Local LLM) ──────────────────────────────────────
echo -e "${CYAN}[1/4] Checking Ollama AI service...${RESET}"
if command -v ollama >/dev/null 2>&1; then
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${RESET} Ollama server is running on http://localhost:11434"
    else
        echo -e "  ${YELLOW}!${RESET} Starting Ollama daemon in background..."
        ollama serve >/dev/null 2>&1 &
        sleep 2
    fi

    # Check model
    if ollama list 2>/dev/null | grep -q "llama3.1:8b"; then
        echo -e "  ${GREEN}✓${RESET} Llama 3.1 8B model is available"
    else
        echo -e "  ${YELLOW}!${RESET} Model 'llama3.1:8b' not found in local library."
        echo -e "    You can pull it anytime using: ${BOLD}ollama pull llama3.1:8b${RESET}"
    fi
else
    echo -e "  ${YELLOW}!${RESET} Ollama not detected in PATH. (Install from https://ollama.com for local AI practice)"
fi

# ── 2. Setup & Start Backend ──────────────────────────────────────────────────
echo -e "\n${CYAN}[2/4] Setting up Python backend (FastAPI)...${RESET}"
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    echo -e "  Creating Python virtual environment..."
    python3 -m venv venv
fi

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "  ${GREEN}✓${RESET} Created backend/.env from template"
fi

# Activate venv & check uvicorn
source venv/bin/activate
if ! python -c "import uvicorn, fastapi, sqlmodel, chromadb" >/dev/null 2>&1; then
    echo -e "  Installing backend dependencies (first-time setup)..."
    pip install -r requirements.txt
fi

echo -e "  ${GREEN}✓${RESET} Launching FastAPI backend on http://localhost:8000..."
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload >/dev/null 2>&1 &
BACKEND_PID=$!

# ── 3. Setup & Start Frontend ─────────────────────────────────────────────────
echo -e "\n${CYAN}[3/4] Setting up React 19 frontend (Vite)...${RESET}"
cd "$FRONTEND_DIR"

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "  ${GREEN}✓${RESET} Created frontend/.env from template"
fi

if [ ! -d "node_modules" ]; then
    echo -e "  Installing frontend dependencies (first-time setup)..."
    npm install
fi

echo -e "  ${GREEN}✓${RESET} Launching Vite dev server on http://localhost:5173..."
npm run dev >/dev/null 2>&1 &
FRONTEND_PID=$!

# ── 4. Open Browser & Monitor ─────────────────────────────────────────────────
echo -e "\n${CYAN}[4/4] Opening application in browser...${RESET}"
sleep 1.5

URL="http://localhost:5173"
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "$URL" 2>/dev/null || sensible-browser "$URL" 2>/dev/null || true
fi

echo -e "\n${BOLD}${GREEN}================================================================${RESET}"
echo -e "${BOLD}${GREEN}  UsedIt is up and running!${RESET}"
echo -e "  👉 Frontend Web UI:   ${BOLD}http://localhost:5173${RESET}"
echo -e "  👉 Backend API Docs:  ${BOLD}http://localhost:8000/docs${RESET}"
echo -e "  👉 Local LLM Engine:  ${BOLD}http://localhost:11434${RESET}"
echo -e "${BOLD}${GREEN}================================================================${RESET}"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services gracefully.${RESET}\n"

# Clean shutdown handler
cleanup() {
    echo -e "\n\n${YELLOW}Shutting down UsedIt services...${RESET}"
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    echo -e "${GREEN}All services stopped cleanly. Goodbye! 👋${RESET}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
while true; do
    sleep 2
done
