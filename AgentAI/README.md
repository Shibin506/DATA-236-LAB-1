# Concierge Agent (FastAPI)

A minimal FastAPI microservice providing a structured AI concierge endpoint for the frontend "Ask Agent AI" button.

## Endpoints
- `GET /` — health check
- `POST /api/v1/concierge-agent` — accepts context and returns a structured response

### Request shape (JSON)
- `booking_context`: object (e.g., { location, dates, guests })
- `preferences`: object (free-form preferences)
- `local_context`: object (any UI/local state)
- `nlu_prompt`: string (free-text prompt from the user)

### Response shape (JSON)
- `day_by_day_plan`: array of objects
- `activity_cards`: array of objects
- `restaurant_recommendations`: array of objects
- `packing_checklist`: array of objects

## Run locally
1. Create a virtualenv (recommended)
2. Install deps
3. Start the server

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Frontend should use:
- `VITE_AGENT_API_BASE=http://localhost:8000/api/v1`

## CORS
By default CORS is configured to allow `http://localhost:3000`. Override with env var:

```bash
export FRONTEND_URL=http://localhost:3000
```

## Environment variables (.env)
Instead of exporting variables in your shell, you can create a `.env` file in the `AgentAI` folder. The service automatically loads it.

1) Copy the example file and edit values:
```bash
cp .env.example .env
```

2) Set your values in `.env`:
```
# Frontend origin for CORS
FRONTEND_URL=http://localhost:3000

# Tavily API key (recommended for live search)
TAVILY_API_KEY=your_key_here

# Optional: Ollama model for LangChain
# LLM_MODEL=llama3:8b
```

3) Install dependencies and run:
```bash
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Notes:
- `.env` is git-ignored to keep secrets safe.
- If `TAVILY_API_KEY` is not set, the endpoint will still respond but with fewer dynamic sources.

## Agent Core (LangChain) — Llama 3 via Ollama
This project is configured to use Llama 3 locally through Ollama.

### Install and run Ollama (macOS)
```bash
brew install ollama
ollama serve &
ollama pull llama3   # or: ollama pull llama3:8b
```

You can override the model via env var:
```bash
export LLM_MODEL=llama3:8b
```

Tools:
- `LocalContextTool` — queries local/static catalog (simulated MySQL via placeholder).
- `LiveWebSearchTool` — wraps Tavily for live/weather/up-to-the-minute info (requires TAVILY_API_KEY and tavily-python).

Function `initialize_agent()` creates an AI Concierge agent with a detailed system prompt and both tools loaded. It uses LangChain’s ChatOllama under the hood.
