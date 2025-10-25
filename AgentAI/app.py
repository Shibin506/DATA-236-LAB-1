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
