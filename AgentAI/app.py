from typing import Dict, List, Optional
import os
import json
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# LangChain (optional use in Task 1; initialized for future steps)
try:
    from langchain_community.tools.tavily_search import TavilySearchAPITool  # type: ignore
    TAVILY_AVAILABLE = True
except Exception:
    TAVILY_AVAILABLE = False

# Additional LangChain imports for Task 2 (Llama 3 via Ollama)
try:
    from langchain.tools import tool  # decorator for tools
    from langchain.agents import initialize_agent as lc_initialize_agent, AgentType
    from langchain_community.chat_models import ChatOllama
    LANGCHAIN_AVAILABLE = True
except Exception:
    LANGCHAIN_AVAILABLE = False


# ------------------------------
# Pydantic Models
# ------------------------------
class AgentInput(BaseModel):
    booking_context: Dict
    preferences: Dict
    local_context: Dict
    nlu_prompt: str

class AgentResponse(BaseModel):
    day_by_day_plan: List[Dict]
    activity_cards: List[Dict]
    restaurant_recommendations: List[Dict]
    packing_checklist: List[Dict]


# ------------------------------
# FastAPI App & Router
# ------------------------------
app = FastAPI(title="Concierge Agent API", version="0.1.0")

# CORS: allow frontend origin (default to localhost:3000)
frontend_origin = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
router = APIRouter(prefix="/api/v1", tags=["concierge-agent"]) 


# ------------------------------
# Task 2: LangChain Tools & Agent Core
# ------------------------------

# Placeholder for a DB query (simulate MySQL-backed local catalog)
def _fetch_local_catalog(query: str, city: Optional[str] = None, dates: Optional[List[str]] = None) -> List[Dict]:
    """Simulate fetching POIs/events from a local DB based on query and filters."""
    sample = [
        {"name": "Downtown Heritage Walk", "type": "tour", "suits": ["kids", "wheelchair"], "city": city or "", "best_time": "morning"},
        {"name": "Riverside Park", "type": "outdoor", "suits": ["strollers", "low-intensity"], "city": city or "", "best_time": "evening"},
        {"name": "Green Leaf Vegan", "type": "restaurant", "cuisine": "Vegan", "notes": "Family-friendly", "city": city or ""},
    ]
    # In real usage, apply filters and full-text search
    return sample

if LANGCHAIN_AVAILABLE:
    @tool("LocalContextTool", return_direct=False)
    def LocalContextTool(query: str) -> str:
        """
        Use this tool to retrieve static/local catalog data (POIs, events, restaurants) from the host system's MySQL-backed store.
        Ideal for location knowledge that doesn't require live updates. Input should be a short natural-language query.
        """
        items = _fetch_local_catalog(query)
        return str(items)

    @tool("LiveWebSearchTool", return_direct=False)
    def LiveWebSearchTool(query: str) -> str:
        """
        Use this tool ONLY for up-to-the-minute, live, or weather-related context (e.g., current weather, live events, opening hours today).
        It wraps a real-time web search. Do not use it for static knowledge.
        """
        if not TAVILY_AVAILABLE:
            return "Live web search is unavailable (Tavily not installed or API key missing)."
        try:
            tool = TavilySearchAPITool()
            res = tool.run(query)
            return str(res)
        except Exception as e:
            return f"Live search error: {e}"

    SYSTEM_PROMPT = (
        "You are an AI Concierge for travel planning. "
        "Synthesize: (1) booking_context, (2) preferences, (3) local data via LocalContextTool, and (4) the user's prompt. "
        "Before producing results, call tools when needed (LocalContextTool for static/local catalog; LiveWebSearchTool for up-to-the-minute or weather context). "
        "Output strictly as JSON with keys: day_by_day_plan (array), activity_cards (array), restaurant_recommendations (array), packing_checklist (array). "
        "Be concise, family-friendly, accessibility-aware (strollers, wheelchairs), and align with dietary needs."
    )

    def initialize_agent():
        """Create and return a LangChain AgentExecutor configured with our tools and system prompt."""
        if not LANGCHAIN_AVAILABLE:
            raise RuntimeError("LangChain or OpenAI provider not available. Install deps and set OPENAI_API_KEY.")
        # LLM: Llama 3 via Ollama (run `ollama serve` and `ollama pull llama3`).
        # You can override model via LLM_MODEL env (e.g., "llama3:8b").
        llm = ChatOllama(model=os.getenv("LLM_MODEL", "llama3"), temperature=0)
        tools = [LocalContextTool, LiveWebSearchTool]
        agent = lc_initialize_agent(
            tools,
            llm,
            agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            verbose=False,
            agent_kwargs={"prefix": SYSTEM_PROMPT},
        )
        return agent

@router.post("/concierge-agent", response_model=AgentResponse)
async def concierge_agent(payload: AgentInput) -> AgentResponse:
    """
    Accepts user context + NLU prompt, calls the LangChain agent with a combined prompt,
    parses JSON output, and returns an AgentResponse. Falls back to a scaffolded response
    if the agent or providers are unavailable.
    """

    def _fallback_response() -> AgentResponse:
        return AgentResponse(
            day_by_day_plan=[
                {"day": 1, "title": "Arrival and local exploration", "highlights": ["Check-in", "Walk downtown", "Sunset viewpoint"]},
                {"day": 2, "title": "Activities based on preferences", "highlights": ["Kid-friendly museum", "Vegan lunch", "Short scenic trail"]},
            ],
            activity_cards=[
                {"name": "City History Museum", "type": "indoor", "duration": "2-3 hours", "suits": ["kids", "wheelchair"]},
                {"name": "River Walk", "type": "outdoor", "duration": "1 hour", "suits": ["strollers", "low-intensity"]},
            ],
            restaurant_recommendations=[
                {"name": "Green Leaf Vegan", "cuisine": "Vegan", "notes": "Casual, family-friendly"},
                {"name": "Happy Garden", "cuisine": "Vegetarian", "notes": "Reservations recommended"},
            ],
            packing_checklist=[
                {"item": "Comfortable walking shoes", "why": "Short walks and city touring"},
                {"item": "Reusable water bottles", "why": "Stay hydrated"},
                {"item": "Light jackets", "why": "Evening breeze"},
            ],
        )

    # Build a combined prompt from all inputs
    combined_prompt = (
        "SYNTHESIZE ALL CONTEXTS BELOW INTO A FINAL TRAVEL PLAN AS STRICT JSON.\n\n"
        f"BOOKING_CONTEXT: {json.dumps(payload.booking_context, ensure_ascii=False)}\n"
        f"PREFERENCES: {json.dumps(payload.preferences, ensure_ascii=False)}\n"
        f"LOCAL_CONTEXT: {json.dumps(payload.local_context, ensure_ascii=False)}\n"
        f"USER_PROMPT: {payload.nlu_prompt}\n\n"
        "Respond with JSON only. Keys: day_by_day_plan (array), activity_cards (array), "
        "restaurant_recommendations (array), packing_checklist (array)."
    )

    # If LangChain/LLM not available, return fallback
    if not LANGCHAIN_AVAILABLE:
        return _fallback_response()

    try:
        agent = initialize_agent()
        raw = agent.run(combined_prompt)
        # raw may be dict or string JSON; normalize
        if isinstance(raw, dict):
            parsed = raw
        else:
            # try JSON parse, then loose extraction
            try:
                parsed = json.loads(raw)
            except Exception:
                # extract the first {...} block heuristically
                s = str(raw)
                start = s.find('{')
                end = s.rfind('}')
                if start != -1 and end != -1 and end > start:
                    parsed = json.loads(s[start:end+1])
                else:
                    raise

        # Sanitize to ensure required keys exist
        result = {
            "day_by_day_plan": parsed.get("day_by_day_plan", []) if isinstance(parsed, dict) else [],
            "activity_cards": parsed.get("activity_cards", []) if isinstance(parsed, dict) else [],
            "restaurant_recommendations": parsed.get("restaurant_recommendations", []) if isinstance(parsed, dict) else [],
            "packing_checklist": parsed.get("packing_checklist", []) if isinstance(parsed, dict) else [],
        }
        return AgentResponse(**result)
    except Exception:
        # On any error, return a safe fallback
        return _fallback_response()


# Mount router
app.include_router(router)


# Root ping
@app.get("/")
async def root():
    return {"status": "ok", "service": "concierge-agent"}
