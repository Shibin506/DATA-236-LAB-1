from typing import Dict, List, Optional
import os
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# LangChain (optional use in Task 1; initialized for future steps)
try:
    from langchain_community.tools.tavily_search import TavilySearchAPITool  # type: ignore
    TAVILY_AVAILABLE = True
except Exception:
    TAVILY_AVAILABLE = False

# Additional LangChain imports for Task 2
try:
    from langchain.tools import tool  # decorator for tools (compatible across versions)
    from langchain.agents import initialize_agent, AgentType
    from langchain_openai import ChatOpenAI
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
        # LLM: GPT-3.5 (or better). Requires OPENAI_API_KEY env.
        llm = ChatOpenAI(model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"), temperature=0)
        tools = [LocalContextTool, LiveWebSearchTool]
        agent = initialize_agent(
            tools,
            llm,
            agent=AgentType.OPENAI_FUNCTIONS,
            verbose=False,
            agent_kwargs={"system_message": SYSTEM_PROMPT},
        )
        return agent

@router.post("/concierge-agent", response_model=AgentResponse)
async def concierge_agent(payload: AgentInput) -> AgentResponse:
    """
    Accepts user context + NLU prompt, returns a structured plan.
    For Task 1, we return a scaffolded static structure; future tasks can
    wire LangChain tools (e.g., Tavily) to enrich results.
    """
    # Optional: demonstrate using Tavily if configured
    tavily_snippets: List[Dict] = []
    if TAVILY_AVAILABLE:
        try:
            tool = TavilySearchAPITool()
            # Use a simple query derived from prompt; safe fallback if it fails
            q = f"family trip ideas in {payload.booking_context.get('location', '')}".strip()
            if q:
                results = tool.run(q)
                # The tool may return str or list depending on version; normalize to a list of snippets
                if isinstance(results, str):
                    tavily_snippets = [{"snippet": results[:300]}]
                elif isinstance(results, list):
                    tavily_snippets = results[:3]
        except Exception:
            tavily_snippets = []

    # Basic scaffolded response (placeholder content)
    day_by_day_plan = [
        {
            "day": 1,
            "title": "Arrival and local exploration",
            "highlights": ["Check-in", "Walk downtown", "Sunset viewpoint"],
        },
        {
            "day": 2,
            "title": "Activities based on preferences",
            "highlights": ["Kid-friendly museum", "Vegan lunch", "Short scenic trail"],
        },
    ]

    activity_cards = [
        {
            "name": "City History Museum",
            "type": "indoor",
            "duration": "2-3 hours",
            "suits": ["kids", "wheelchair"],
        },
        {
            "name": "River Walk",
            "type": "outdoor",
            "duration": "1 hour",
            "suits": ["strollers", "low-intensity"],
        },
    ]

    restaurant_recommendations = [
        {"name": "Green Leaf Vegan", "cuisine": "Vegan", "notes": "Casual, family-friendly"},
        {"name": "Happy Garden", "cuisine": "Vegetarian", "notes": "Reservations recommended"},
    ]

    packing_checklist = [
        {"item": "Comfortable walking shoes", "why": "Short walks and city touring"},
        {"item": "Reusable water bottles", "why": "Stay hydrated"},
        {"item": "Light jackets", "why": "Evening breeze"},
    ]

    # Attach any Tavily snippets as a bonus context in activity cards (optional)
    if tavily_snippets:
        activity_cards.append({
            "name": "Web snippets",
            "type": "info",
            "snippets": tavily_snippets,
        })

    return AgentResponse(
        day_by_day_plan=day_by_day_plan,
        activity_cards=activity_cards,
        restaurant_recommendations=restaurant_recommendations,
        packing_checklist=packing_checklist,
    )


# Mount router
app.include_router(router)


# Root ping
@app.get("/")
async def root():
    return {"status": "ok", "service": "concierge-agent"}
