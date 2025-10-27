# DATA-236-LAB-1 — Airbnb-style App + Agent AI Concierge

A full-stack sample that mimics an Airbnb-style experience with a React frontend, an Express/MySQL backend, and a separate FastAPI “Agent AI Concierge” service for dynamic trip planning.

- Frontend: React 18 + Vite, Axios, Bootstrap
- Backend: Node.js (Express), MySQL (mysql2), file uploads, sessions, favorites, bookings
- Agent AI: FastAPI with optional Tavily live search and Ollama/LangChain integration

## Repository structure

```
.
├── Backend/        # Express API + MySQL
├── Frontend/       # React (Vite) SPA
└── AgentAI/        # FastAPI concierge microservice
```

## System diagram

```mermaid
flowchart LR
	subgraph Web[Browser]
		FE[React Vite Frontend]
	end

	subgraph API[Backend: Express]
		SESS[Sessions (cookie)]
		UPL[/Static Uploads /uploads/]
		DB[(MySQL)]
	end

	subgraph Agent[Agent AI: FastAPI]
		TAV[Tavily Search\n(optional)]
		OLL[Ollama/LangChain\n(optional)]
	end

	FE <--> |CORS + Cookies| API
	FE <--> |JSON| Agent
	API <--> DB
	API --> UPL
	Agent -.-> |live search| TAV
	Agent -.-> |local LLM| OLL
```

Ports (default):
- Frontend: 3000 (Vite dev server)
- Backend: 3001 (Express)
- Agent AI: 8000 (FastAPI via Uvicorn)

---

## Prerequisites
- Node.js 18+ and npm
- Python 3.10+ (recommended 3.11) and pip
- MySQL 8.x running locally
- macOS/zsh examples are shown below

Optional:
- Tavily API key for live web search in Agent AI
- Ollama for local LLMs (Llama 3) if you want LangChain agenting locally

---

## Database setup (MySQL)

Create a database and credentials. Example:

```sql
CREATE DATABASE air_bnb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'airbnb'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON air_bnb.* TO 'airbnb'@'localhost';
FLUSH PRIVILEGES;
```

Backend environment variables (see `Backend/.env`):

```
DB_HOST=localhost
DB_USER=airbnb
DB_PASSWORD=your_password_here
DB_NAME=air_bnb
DB_PORT=3306
PORT=3001
SESSION_SECRET=change_me
```

Notes:
- On startup, the backend tests the DB connection and runs `initializeDatabase()` to ensure required tables exist.
- Static uploads (property images, profile pics) are served at `http://localhost:3001/uploads/...`.

---

## Backend (Express)

Install and run:

```bash
cd Backend
npm install
npm start
# Health check
# open http://localhost:3001/health
```

CORS
- Allowed frontends default to: http://localhost:3000, http://127.0.0.1:3000
- Configure via `FRONTEND_URLS` (comma-separated) in `Backend/.env`

Key routes (prefix: `/api`):
- `/auth/*` — login/session endpoints
- `/users/*` — profile, avatars
- `/properties/*` — search, details, owner CRUD, image upload/delete
- `/bookings/*` — create/validate booking requests
- `/favorites/*` — traveler favorites

---

## Frontend (React + Vite)

Environment (`Frontend/.env`):

```
VITE_API_BASE=http://localhost:3001/api
VITE_AGENT_API_BASE=http://localhost:8000/api/v1
VITE_MOCK=false
```

Install and run:

```bash
cd Frontend
npm install
npm run dev
# open http://localhost:3000
```

Features
- Traveler: login/session, property search with availability, details page with client-side validation, favorites, profile with avatar
- Owner: property management (listings, delete, availability window)
- Agent AI: “Ask Agent AI” modal that calls the FastAPI concierge

Image handling
- Frontend builds absolute URLs to `Backend/uploads` for property and profile images

---

## Agent AI (FastAPI)

Environment (`AgentAI/.env`):

```
FRONTEND_URL=http://localhost:3000
TAVILY_API_KEY=your_tavily_key # optional but recommended for live results
# LLM_MODEL=llama3:8b           # optional for LangChain + Ollama
```

Install and run:

```bash
cd AgentAI
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # then edit values
uvicorn app:app --reload --host 0.0.0.0 --port 8000
# open http://localhost:8000/
```

Frontend points to: `VITE_AGENT_API_BASE=http://localhost:8000/api/v1`

Endpoints
- `POST /api/v1/concierge-agent` — accepts either legacy or new structured payloads; returns itinerary, activities, restaurants, packing_list, plus legacy keys for compatibility
- `GET /api/v1/concierge-agent/diag` — quick diagnostics to confirm Tavily availability

Notes
- Without `TAVILY_API_KEY`, the service returns sensible fallbacks; with Tavily, it pulls live articles/POIs and attaches source links.
- The service infers location/days from free text if dates are not provided.

---

## Running everything together

1) Start MySQL and ensure credentials match `Backend/.env`
2) Start Backend
3) Start Agent AI
4) Start Frontend

```bash
# Terminal 1
cd Backend && npm start

# Terminal 2
cd AgentAI && source .venv/bin/activate && uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Terminal 3
cd Frontend && npm run dev
```

---

## Troubleshooting

- CORS or 429s on preflight
	- Backend enables CORS before rate limit and skips OPTIONS; update `FRONTEND_URLS` if your origin differs.
- Sessions not persisting
	- Ensure cookies are allowed in the browser; adjust `SESSION_SECRET` and consider a MySQL session store if needed.
- Images not loading
	- Confirm `http://localhost:3001/uploads/...` is reachable and your image upload endpoints are wired (properties/users).
- Agent returning “fallback” lists
	- Check `GET /api/v1/concierge-agent/diag` → `tavily_enabled` true and `sample_results > 0` after setting `TAVILY_API_KEY` in `AgentAI/.env` and restarting the service.
- Agent itinerary days don’t match
	- The agent infers day counts from text when dates are missing; verify `debug.date_range` in the response.
- Agent modal not scrollable
	- The modal body is capped at `85vh` and scrolls vertically. If you customize the UI, keep `overflow-y: auto` on the scrollable container.

---

## Security notes
- Never commit real API keys or secrets. `.env` files are git-ignored inside `AgentAI/`.
- Use environment variables for DB credentials, session secrets, and third-party keys.

---

## License
Educational use for lab/demo purposes.
