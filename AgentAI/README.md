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

## Optional: Tavily snippets
If you want quick web snippets in the response, install Tavily and set the API key:

```bash
pip install tavily-python
export TAVILY_API_KEY=your_key
```

This is optional; the service works without it.
