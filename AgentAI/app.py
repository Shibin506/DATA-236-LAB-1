from typing import Dict, List, Optional, Any, Union, Tuple
import os
import json
from fastapi import FastAPI, APIRouter, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv
from datetime import datetime, timedelta
try:
    import pymysql
    from pymysql.cursors import DictCursor
    PYMYSQL_AVAILABLE = True
except Exception:
    PYMYSQL_AVAILABLE = False

# Load environment variables from .env if present
load_dotenv()

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
class MobilityNeeds(BaseModel):
    wheelchair: Optional[bool] = None
    max_walk_km: Optional[float] = None
    stroller: Optional[bool] = None

class Dietary(BaseModel):
    vegan: Optional[bool] = None
    vegetarian: Optional[bool] = None
    gluten_free: Optional[bool] = None
    halal: Optional[bool] = None
    kosher: Optional[bool] = None
    other: Optional[List[str]] = None

class Preferences(BaseModel):
    budget: Optional[str] = None  # low|medium|high
    interests: Optional[List[str]] = None
    mobility_needs: Optional[MobilityNeeds] = None
    dietary: Optional[Dietary] = None

class Booking(BaseModel):
    start_date: str
    end_date: str
    location: str
    party_type: Optional[str] = None  # couple|family|solo|friends
    party_size: Optional[int] = None
    children_ages: Optional[List[int]] = None

class ContextFlags(BaseModel):
    weather: Optional[str] = "auto"  # auto|provided
    events: Optional[str] = "auto"
    pois: Optional[str] = "auto"

class AgentV2Input(BaseModel):
    booking: Booking
    preferences: Preferences
    nlu_query: Optional[str] = None
    context: Optional[ContextFlags] = None
    context_overrides: Optional[Dict[str, Any]] = None

class Geo(BaseModel):
    lat: float
    lng: float

class Activity(BaseModel):
    id: str
    title: str
    address: Optional[str] = ""
    geo: Optional[Geo] = None
    price_tier: Optional[str] = None  # $|$$|$$$|$$$$
    duration_minutes: Optional[int] = None
    tags: Optional[List[str]] = None
    wheelchair_friendly: Optional[bool] = None
    child_friendly: Optional[bool] = None
    stroller_friendly: Optional[bool] = None
    booking_link: Optional[str] = None
    source: Optional[Dict[str, Any]] = None

class Restaurant(BaseModel):
    name: str
    address: Optional[str] = ""
    geo: Optional[Geo] = None
    dietary_match: Optional[List[str]] = None
    price_tier: Optional[str] = None
    kid_friendly: Optional[bool] = None
    reservation_link: Optional[str] = None
    source: Optional[Dict[str, Any]] = None

class ItineraryBlock(BaseModel):
    time_block: str  # morning|afternoon|evening
    summary: str
    activities: List[str]

class ItineraryDay(BaseModel):
    date: str
    blocks: List[ItineraryBlock]

class Note(BaseModel):
    type: str
    text: str

class DebugSource(BaseModel):
    type: str
    query: str
    url: Optional[str] = None

class AgentV2Response(BaseModel):
    itinerary: List[ItineraryDay]
    activities: List[Activity]
    restaurants: List[Restaurant]
    packing_checklist: List[Dict[str, Any]]
    notes: List[Note]
    debug: Dict[str, Any]

# Legacy request model (backward compatibility with old frontend)
class AgentLegacyInput(BaseModel):
    booking_context: Dict[str, Any]
    preferences: Dict[str, Any]
    local_context: Optional[Dict[str, Any]] = None
    nlu_prompt: Optional[str] = None


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

def _slugify(s: str) -> str:
    return ''.join(ch.lower() if ch.isalnum() else '-' for ch in s).strip('-')[:64]

# ------------------------------
# Database helpers: fetch Airbnb properties by location
# ------------------------------
def _db_connect():
    host = os.getenv("DB_HOST", "localhost")
    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASSWORD", "")
    database = os.getenv("DB_NAME", "air_bnb")
    port = int(os.getenv("DB_PORT", "3306"))
    if not PYMYSQL_AVAILABLE:
        raise RuntimeError("PyMySQL not installed. Run: pip install PyMySQL")
    return pymysql.connect(host=host, user=user, password=password, database=database, port=port, cursorclass=DictCursor, autocommit=True)

def _db_connect_no_db():
    host = os.getenv("DB_HOST", "localhost")
    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASSWORD", "")
    port = int(os.getenv("DB_PORT", "3306"))
    if not PYMYSQL_AVAILABLE:
        raise RuntimeError("PyMySQL not installed. Run: pip install PyMySQL")
    return pymysql.connect(host=host, user=user, password=password, port=port, cursorclass=DictCursor, autocommit=True)

def _discover_db_with_properties() -> Optional[str]:
    """Try to find a database that contains the 'properties' table."""
    try:
        conn = _db_connect_no_db()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT table_schema
                FROM information_schema.tables
                WHERE table_name = 'properties'
                GROUP BY table_schema
                ORDER BY COUNT(*) DESC
                LIMIT 1
            """)
            row = cur.fetchone()
        conn.close()
        if row:
            # row may be dict or tuple depending on cursorclass
            if isinstance(row, dict):
                return row.get("table_schema")
            return list(row.values())[0] if hasattr(row, 'values') else row[0]
    except Exception:
        return None
    return None

def _db_connect_to(database_name: str):
    host = os.getenv("DB_HOST", "localhost")
    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASSWORD", "")
    port = int(os.getenv("DB_PORT", "3306"))
    return pymysql.connect(host=host, user=user, password=password, database=database_name, port=port, cursorclass=DictCursor, autocommit=True)

def _fetch_properties_by_location(location: str, limit: int = 10) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    if not location:
        return [], {"reason": "no_location"}
    if not PYMYSQL_AVAILABLE:
        return [], {"reason": "pymysql_not_available"}
    like_core = f"%{location.strip()}%"
    # Primary query (with image subselect). If it fails, retry with a simpler query.
    sql_primary = (
        "SELECT p.id, p.name, p.city, p.state, p.country, p.price_per_night, "
        "(SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.image_type = 'main' ORDER BY pi.display_order ASC LIMIT 1) AS main_image "
        "FROM properties p "
        "WHERE p.is_active = TRUE AND (p.city = %s OR p.city LIKE %s OR p.state = %s OR p.country = %s OR p.address LIKE %s) "
        "ORDER BY p.created_at DESC LIMIT %s"
    )
    sql_simple = (
        "SELECT p.id, p.name, p.city, p.state, p.country, p.price_per_night "
        "FROM properties p "
        "WHERE p.is_active = TRUE AND (p.city = %s OR p.city LIKE %s OR p.state = %s OR p.country = %s OR p.address LIKE %s) "
        "ORDER BY p.created_at DESC LIMIT %s"
    )
    rows: List[Dict[str, Any]] = []
    dbg: Dict[str, Any] = {"sql": "primary", "error": None, "counts": {}, "db": {}}
    try:
        conn = _db_connect()
        dbg["db"] = {
            "host": os.getenv("DB_HOST", "localhost"),
            "db": os.getenv("DB_NAME", "airbnb_db"),
            "user": os.getenv("DB_USER", "root"),
        }
        with conn.cursor() as cur:
            # total properties (active) for sanity
            cur.execute("SELECT COUNT(*) AS c FROM properties WHERE is_active=TRUE")
            total_active = cur.fetchone()["c"] if isinstance(cur.fetchone(), dict) else None
            # Need to re-fetch because cur.fetchone() consumed a row; adjust to store value safely
        conn.close()
        # Re-open to avoid interfering with next result set
        conn = _db_connect()
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM properties WHERE is_active=TRUE")
            dbg["counts"]["active_total"] = int(list(cur.fetchone().values())[0])
            cur.execute(sql_primary, (location, like_core, location, location, like_core, int(limit)))
            rows = cur.fetchall() or []
        conn.close()
    except Exception as e:
        # Retry without image subselect
        dbg["error"] = str(e)
        dbg["sql"] = "simple"
        try:
            # Unknown database? Try discovery and connect directly to discovered DB
            discovered = _discover_db_with_properties()
            if discovered:
                dbg.setdefault("db", {})["discovered"] = discovered
                conn = _db_connect_to(discovered)
            else:
                conn = _db_connect()
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM properties WHERE is_active=TRUE")
                dbg["counts"]["active_total"] = int(list(cur.fetchone().values())[0])
                cur.execute(sql_simple, (location, like_core, location, location, like_core, int(limit)))
                rows = cur.fetchall() or []
            conn.close()
        except Exception:
            return [], dbg
    normalized: List[Dict[str, Any]] = []
    for r in rows:
        price = float(r.get("price_per_night") or 0)
        normalized.append({
            "id": r.get("id"),
            "name": r.get("name"),
            "city": r.get("city"),
            "state": r.get("state"),
            "country": r.get("country"),
            "price_per_night": price,
            "main_image": r.get("main_image"),
        })
    dbg["counts"]["filtered"] = len(normalized)
    return normalized, dbg

async def _tavily_search(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """Prefer official Tavily client if available; otherwise fallback to raw HTTP API."""
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        return []
    # Try official client first
    try:
        from tavily import TavilyClient  # type: ignore
        client = TavilyClient(api_key)
        # Tavily client is sync; call it in a thread to avoid blocking
        import asyncio
        loop = asyncio.get_event_loop()
        resp = await loop.run_in_executor(None, lambda: client.search(query=query, max_results=max_results, search_depth="advanced", include_answers=False))
        # Normalize to match our structure
        results = resp.get("results") or []
        return results
    except Exception:
        # Fallback to HTTP
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(
                    "https://api.tavily.com/search",
                    json={
                        "api_key": api_key,
                        "query": query,
                        "search_depth": "advanced",
                        "include_answers": False,
                        "max_results": max_results,
                    },
                )
                data = resp.json()
                return data.get("results", []) or []
        except Exception:
            return []

def _tavily_enabled() -> bool:
    return bool(os.getenv("TAVILY_API_KEY"))

def _normalize_str(s: Optional[str]) -> str:
    return (s or "").strip().lower()

# Note: No hard-coded or file-based fallbacks. Results may be empty if live search returns nothing.

def _city_aliases(location: Optional[str]) -> List[str]:
    """Return a set of useful aliases for a city name to help filter search results.
    We keep aliases reasonably strict to avoid cross-state noise.
    """
    loc = _normalize_str(location)
    if not loc:
        return []
    # Strip state/country if provided (e.g., "New York, NY" -> "New York")
    primary = loc.split(",")[0].strip()
    aliases: List[str] = [primary]
    # Well-known city-specific aliases
    if primary in ["new york", "new york city", "nyc"]:
        aliases.extend([
            "new york city",
            "nyc",
            "manhattan",
            "brooklyn",
            "queens",
            "bronx",
            "staten island",
            "new york, ny",
        ])
    elif primary in ["los angeles", "la", "l.a."]:
        aliases.extend([
            "los angeles",
            "l.a.",
            "la, ca",
            "hollywood",
            "santa monica",
            "venice beach",
            "west hollywood",
        ])
    elif primary in ["san francisco", "sf"]:
        aliases.extend([
            "san francisco",
            "sf",
            "fisherman's wharf",
            "golden gate",
            "mission district",
        ])
    elif primary in ["chicago"]:
        aliases.extend(["chicago", "downtown chicago"])  # keep tight
    elif primary in ["miami"]:
        aliases.extend(["miami", "miami beach"])
    elif primary in ["seattle"]:
        aliases.append("seattle")
    elif primary in ["boston"]:
        aliases.extend(["boston", "cambridge, ma", "somerville, ma"])  # greater area but same metro
    # Also add original location string if different
    if loc not in aliases:
        aliases.append(loc)
    # Deduplicate while preserving order
    seen = set()
    uniq: List[str] = []
    for a in aliases:
        if a and a not in seen:
            seen.add(a)
            uniq.append(a)
    return uniq

def _filter_results_by_location(results: List[Dict[str, Any]], location: Optional[str]) -> List[Dict[str, Any]]:
    """Filter Tavily results to those that likely belong to the requested city.
    Strategy:
    - Build city aliases and require at least one alias to appear in title/content/url
    - If this yields nothing, loosen to matching the raw location substring
    - If still empty, return the original results
    """
    if not results or not location:
        return results
    aliases = _city_aliases(location)
    if not aliases:
        return results
    def text_of(item: Dict[str, Any]) -> str:
        return _normalize_str(
            f"{item.get('title','')} {item.get('content','') or item.get('snippet','')} {item.get('url','')}"
        )
    filtered = [it for it in results if any(a in text_of(it) for a in aliases)]
    if filtered:
        return filtered
    # Loosen to raw cleaned location substring
    loc_raw = _normalize_str(location)
    filtered2 = [it for it in results if loc_raw in text_of(it)]
    return filtered2 or results

def _extract_price_tier(text: str) -> Optional[str]:
    text = (text or '').lower()
    if '$$$$' in text or 'expensive' in text or 'fine dining' in text:
        return '$$$$'
    if '$$$' in text:
        return '$$$'
    if '$$' in text or 'moderate' in text:
        return '$$'
    if '$' in text or 'cheap' in text or 'budget' in text:
        return '$'
    return None

def _dietary_keys(pref: Optional[Dietary]) -> List[str]:
    out: List[str] = []
    if not pref: return out
    for k in ["vegan","vegetarian","gluten_free","halal","kosher"]:
        if getattr(pref, k, None): out.append(k)
    if pref.other:
        out.extend([str(x).lower() for x in pref.other])
    return out

def _date_range(start: str, end: str) -> List[str]:
    def _parse(d: str):
        for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%Y/%m/%d"):
            try:
                return datetime.strptime(d, fmt).date()
            except Exception:
                continue
        # try ISO 8601
        try:
            return datetime.fromisoformat(d).date()
        except Exception:
            return None
    s = _parse(start)
    e = _parse(end)
    if not s or not e:
        return []
    days = []
    cur = s
    while cur <= e:
        days.append(cur.isoformat())
        cur += timedelta(days=1)
    return days

def _to_dict(m: Any) -> Dict[str, Any]:
    if hasattr(m, "model_dump"):
        return m.model_dump()
    if hasattr(m, "dict"):
        return m.dict()
    return dict(m)

def _pack_list_from_weather(weather_text: str) -> List[Dict[str, Any]]:
    wt = (weather_text or '').lower()
    items: List[Dict[str, Any]] = [
        {"item": "Comfortable walking shoes", "reason": "activity", "mandatory": True},
        {"item": "Reusable water bottle", "reason": "activity", "mandatory": True},
    ]
    if any(k in wt for k in ["rain", "showers", "thunder"]):
        items.append({"item": "Rain jacket / umbrella", "reason": "weather", "mandatory": True})
    if any(k in wt for k in ["sunny", "hot", "heat", "uv"]):
        items.append({"item": "Sunscreen & hat", "reason": "weather", "mandatory": True})
    if any(k in wt for k in ["cold", "chilly", "wind", "snow"]):
        items.append({"item": "Warm layer", "reason": "weather", "mandatory": False})
    return items

def _nlu_extract(query: Optional[str]) -> Dict[str, Any]:
    if not query: return {"extracted_interests": [], "constraints": []}
    q = query.lower()
    interests = []
    for key, words in {
        "museum": ["museum", "art", "gallery"],
        "outdoors": ["park", "hike", "trail", "outdoors"],
        "food": ["food", "restaurant", "cafe", "eat"],
        "shopping": ["shop", "shopping", "market"],
        "history": ["history", "historic", "heritage"],
        "nightlife": ["bar", "nightlife", "club"],
        "kids": ["kids", "children", "family"],
    }.items():
        if any(w in q for w in words):
            interests.append(key)
    constraints = []
    if "no long hike" in q or "no long hikes" in q:
        constraints.append("avoid long hikes")
    if "wheelchair" in q:
        constraints.append("wheelchair-friendly only")
    if "vegan" in q:
        constraints.append("vegan diet")
    return {"extracted_interests": interests, "constraints": constraints}

def _infer_trip_from_query(query: Optional[str]) -> Dict[str, Any]:
    """Infer simple trip hints like location and number of days from a free-text query."""
    if not query:
        return {"location": None, "days": None}
    import re
    q = query.strip()
    # days
    m_days = re.search(r"(\d+)\s*(day|days)", q, re.IGNORECASE)
    days = int(m_days.group(1)) if m_days else None
    # location: look for 'to X' or 'in X'
    loc = None
    m_to = re.search(r"\bto\s+([a-zA-Z][a-zA-Z\s]+)", q, re.IGNORECASE)
    m_in = re.search(r"\bin\s+([a-zA-Z][a-zA-Z\s]+)", q, re.IGNORECASE)
    cand = None
    if m_to:
        cand = m_to.group(1)
    elif m_in:
        cand = m_in.group(1)
    if cand:
        # trim trailing words like 'with', 'for'
        cand = re.split(r"\s+(with|for|and|,|\.)\b", cand)[0].strip()
        # title case
        loc = " ".join(w.capitalize() for w in cand.split())
    return {"location": loc, "days": days}

def _parse_date_range_from_text(query: Optional[str], today: datetime.date) -> Optional[Dict[str, str]]:
    """Parse date ranges like '2025-11-11 to 2025-11-14' or '11 Nov - 14 Nov' from text.
    Returns {start, end} ISO strings or None if not found.
    """
    if not query:
        return None
    import re
    q = query.strip()
    # Helper for month names
    month_map = {
        'jan':1,'january':1,'feb':2,'february':2,'mar':3,'march':3,'apr':4,'april':4,
        'may':5,'jun':6,'june':6,'jul':7,'july':7,'aug':8,'august':8,'sep':9,'sept':9,'september':9,
        'oct':10,'october':10,'nov':11,'november':11,'dec':12,'december':12
    }
    # 1) YYYY-MM-DD to YYYY-MM-DD
    m_iso = re.search(r"(\d{4}-\d{2}-\d{2})\s*(to|-)\s*(\d{4}-\d{2}-\d{2})", q, re.IGNORECASE)
    if m_iso:
        s = m_iso.group(1)
        e = m_iso.group(3)
        return {"start": s, "end": e}
    # 2) DD Mon to DD Mon (optional year at end or per date)
    # Examples: '11 Nov - 14 Nov', 'Nov 11 to Nov 14', '11 Nov 2025 - 14 Nov 2025'
    # a) DD Mon - DD Mon [YYYY]? 
    m1 = re.search(r"(\d{1,2})\s*([A-Za-z]{3,9})\s*(\d{4})?\s*(to|-)\s*(\d{1,2})\s*([A-Za-z]{3,9})\s*(\d{4})?", q, re.IGNORECASE)
    if m1:
        d1 = int(m1.group(1)); m1name = m1.group(2).lower(); y1 = m1.group(3)
        d2 = int(m1.group(5)); m2name = m1.group(6).lower(); y2 = m1.group(7)
        m1num = month_map.get(m1name); m2num = month_map.get(m2name)
        year = today.year
        y1i = int(y1) if y1 else year
        y2i = int(y2) if y2 else year
        try:
            sdate = datetime(y1i, m1num, d1).date()
            edate = datetime(y2i, m2num, d2).date()
            # If end before start and no years provided, assume end month later or same year wrap
            if not y1 and not y2 and edate < sdate:
                # if end month numerically less than start, likely crosses year
                if m2num < m1num:
                    edate = datetime(year+1, m2num, d2).date()
            return {"start": sdate.isoformat(), "end": edate.isoformat()}
        except Exception:
            return None
    # b) Mon DD - Mon DD [YYYY]?
    m2 = re.search(r"([A-Za-z]{3,9})\s*(\d{1,2})\s*(\d{4})?\s*(to|-)\s*([A-Za-z]{3,9})\s*(\d{1,2})\s*(\d{4})?", q, re.IGNORECASE)
    if m2:
        m1name = m2.group(1).lower(); d1 = int(m2.group(2)); y1 = m2.group(3)
        m2name = m2.group(5).lower(); d2 = int(m2.group(6)); y2 = m2.group(7)
        m1num = month_map.get(m1name); m2num = month_map.get(m2name)
        year = today.year
        y1i = int(y1) if y1 else year
        y2i = int(y2) if y2 else year
        try:
            sdate = datetime(y1i, m1num, d1).date()
            edate = datetime(y2i, m2num, d2).date()
            if not y1 and not y2 and edate < sdate:
                if m2num < m1num:
                    edate = datetime(year+1, m2num, d2).date()
            return {"start": sdate.isoformat(), "end": edate.isoformat()}
        except Exception:
            return None
    # 3) DD/MM/YYYY - DD/MM/YYYY or DD/MM - DD/MM (assume current year)
    m3 = re.search(r"(\d{1,2})/(\d{1,2})(?:/(\d{4}))?\s*(to|-)\s*(\d{1,2})/(\d{1,2})(?:/(\d{4}))?", q, re.IGNORECASE)
    if m3:
        d1 = int(m3.group(1)); mo1 = int(m3.group(2)); y1 = int(m3.group(3)) if m3.group(3) else today.year
        d2 = int(m3.group(5)); mo2 = int(m3.group(6)); y2 = int(m3.group(7)) if m3.group(7) else today.year
        try:
            sdate = datetime(y1, mo1, d1).date()
            edate = datetime(y2, mo2, d2).date()
            if not m3.group(3) and not m3.group(7) and edate < sdate and mo2 < mo1:
                edate = datetime(today.year+1, mo2, d2).date()
            return {"start": sdate.isoformat(), "end": edate.isoformat()}
        except Exception:
            return None
    return None

def _build_itinerary(dates: List[str], act_ids: List[str]) -> List[Dict[str, Any]]:
    itinerary = []
    idx = 0
    for d in dates:
        blocks = []
        for tb in ["morning","afternoon","evening"]:
            if act_ids:
                # Cycle through activities so all days/blocks have items
                a1 = act_ids[idx % len(act_ids)]
                a2 = act_ids[(idx + 1) % len(act_ids)] if len(act_ids) > 1 else a1
                chosen = [a1, a2]
                idx += 2
            else:
                chosen = []
            blocks.append({
                "time_block": tb,
                "summary": f"Suggested {tb} activities",
                "activities": chosen
            })
        itinerary.append({"date": d, "blocks": blocks})
    return itinerary

@router.post("/concierge-agent")
async def concierge_agent(payload: Union[AgentV2Input, AgentLegacyInput] = Body(...)):
    """Dynamic Concierge endpoint that follows the new contract and uses Tavily when available."""
    # Normalize legacy payload to AgentV2Input shape
    used_default_dates = False
    if isinstance(payload, AgentLegacyInput):
        bc = payload.booking_context or {}
        prefs_raw = payload.preferences or {}
        # Extract dates/location heuristically
        today = datetime.utcnow().date()
        start_raw = bc.get("start_date") or bc.get("check_in") or bc.get("checkIn") or (bc.get("dates") or {}).get("start")
        end_raw = bc.get("end_date") or bc.get("check_out") or bc.get("checkOut") or (bc.get("dates") or {}).get("end")
        parsed = None
        if not start_raw or not end_raw:
            # Try parse from free text first
            parsed = _parse_date_range_from_text(payload.nlu_prompt, today)
        if parsed and parsed.get("start") and parsed.get("end"):
            start_date = parsed["start"]
            end_date = parsed["end"]
        else:
            if not start_raw or not end_raw:
                used_default_dates = True
            start_date = start_raw or today.isoformat()
            end_date = end_raw or (today + timedelta(days=2)).isoformat()  # default 3 calendar days
        location = bc.get("location") or bc.get("city") or bc.get("destination") or ""
        party_type = bc.get("party_type") or bc.get("partyType") or None
        party_size = bc.get("guests") or bc.get("party_size") or None
        children_ages = bc.get("children_ages") or None

        booking = Booking(
            start_date=str(start_date),
            end_date=str(end_date),
            location=str(location),
            party_type=party_type,
            party_size=party_size,
            children_ages=children_ages,
        )
        # Preferences mapping
        mobility = prefs_raw.get("mobility_needs") or {}
        dietary = prefs_raw.get("dietary") or {}
        prefs = Preferences(
            budget=prefs_raw.get("budget"),
            interests=prefs_raw.get("interests"),
            mobility_needs=MobilityNeeds(
                wheelchair=mobility.get("wheelchair"),
                max_walk_km=mobility.get("max_walk_km"),
                stroller=mobility.get("stroller"),
            ),
            dietary=Dietary(
                vegan=dietary.get("vegan"),
                vegetarian=dietary.get("vegetarian"),
                gluten_free=dietary.get("gluten_free"),
                halal=dietary.get("halal"),
                kosher=dietary.get("kosher"),
                other=dietary.get("other"),
            ),
        )
        ctx_flags = ContextFlags()
        nlu_query = payload.nlu_prompt
    else:
        # Already new model
        booking = payload.booking
        prefs = payload.preferences or Preferences()
        ctx_flags = payload.context or ContextFlags()
        nlu_query = payload.nlu_query

    # Heuristic fill: infer location/days from nlu_query when missing
    hints = _infer_trip_from_query(nlu_query)
    if (not booking.location) and hints.get("location"):
        booking.location = hints["location"]
    # If dates are missing or invalid, compute from parsed text or inferred days
    if not _date_range(booking.start_date, booking.end_date):
        today = datetime.utcnow().date()
        parsed = _parse_date_range_from_text(nlu_query, today)
        if parsed and parsed.get("start") and parsed.get("end"):
            booking.start_date = parsed["start"]
            booking.end_date = parsed["end"]
        else:
            days = hints.get("days") or 3
            start = today
            booking.start_date = start.isoformat()
            booking.end_date = (start + timedelta(days=max(0, days-1))).isoformat()
    # If legacy used default dates and user asked for a specific day-count, honor it
    elif used_default_dates and hints.get("days"):
        try:
            start = datetime.fromisoformat(booking.start_date).date()
            days = int(hints["days"]) or 3
            booking.end_date = (start + timedelta(days=max(0, days-1))).isoformat()
        except Exception:
            pass

    # 1) Context acquisition (weather/events/pois)
    sources: List[DebugSource] = []
    weather_text = None
    events: List[Dict[str, Any]] = []
    pois: List[Dict[str, Any]] = []
    events_all: List[Dict[str, Any]] = []
    pois_all: List[Dict[str, Any]] = []

    context_overrides = None
    if not isinstance(payload, AgentLegacyInput):
        context_overrides = payload.context_overrides if isinstance(payload.context_overrides, dict) else None
    if context_overrides:
        weather_text = (context_overrides.get("weather") or {}).get("summary") if isinstance(context_overrides.get("weather"), dict) else None
        events = context_overrides.get("events") or []
        pois = context_overrides.get("pois") or []

    if ctx_flags.weather == "auto" and not weather_text:
        q = f"current weather and typical conditions this week in {booking.location}"
        res = await _tavily_search(q, 3)
        if res:
            weather_text = (res[0].get("content") or res[0].get("snippet") or "").strip()[:400]
            sources.append(DebugSource(type="tavily", query=q, url=res[0].get("url")))

    if ctx_flags.events == "auto" and not events:
        q = f"events this week for families in {booking.location}"
        res = await _tavily_search(q, 5)
        if res:
            events_all = res
            events = _filter_results_by_location(events_all, booking.location)[:5]
            sources.append(DebugSource(type="tavily", query=q, url=res[0].get("url")))

    if ctx_flags.pois == "auto" and not pois:
        q = f"top attractions and kid-friendly points of interest in {booking.location} with hours and prices"
        res = await _tavily_search(q, 8)
        if res:
            pois_all = res
            pois = _filter_results_by_location(pois_all, booking.location)[:8]
            sources.append(DebugSource(type="tavily", query=q, url=res[0].get("url")))

    # 2) Build activities from POIs/events (with graceful fallback)
    activities: List[Activity] = []
    def add_activity_from_item(item: Dict[str, Any], taghint: List[str]):
        title = item.get("title") or item.get("name") or "Activity"
        aid = _slugify(title)
        price = _extract_price_tier(str(item.get("content") or ""))
        activities.append(Activity(
            id=aid,
            title=title,
            address="",
            geo=Geo(lat=0.0, lng=0.0),
            price_tier=price,
            duration_minutes=90,
            tags=taghint,
            wheelchair_friendly=bool(getattr(prefs.mobility_needs or MobilityNeeds(), 'wheelchair', False)),
            child_friendly=(booking.party_type == 'family' or bool(booking.children_ages)),
            stroller_friendly=bool(getattr(prefs.mobility_needs or MobilityNeeds(), 'stroller', False)),
            booking_link=item.get("url"),
            source={"name": "tavily", "url": item.get("url")}
        ))

    for p in pois[:10]:
        add_activity_from_item(p, ["outdoors" if 'park' in (p.get('title','').lower()) else "sightseeing"]) 
    for e in events[:6]:
        add_activity_from_item(e, ["event"]) 

    # No fallback activities: if live results are empty, activities remains empty.

    # 3) Restaurants based on dietary
    dietary_filters = _dietary_keys(prefs.dietary)
    rest_query = None
    if dietary_filters:
        key = dietary_filters[0].replace('_', ' ')
        rest_query = f"best {key} restaurants in {booking.location} with price info"
    else:
        rest_query = f"best family friendly restaurants in {booking.location} with price info"
    rest_results_raw = await _tavily_search(rest_query, 6)
    rest_results = _filter_results_by_location(rest_results_raw or [], booking.location)[:6]
    restaurants: List[Restaurant] = []
    for r in rest_results:
        price = _extract_price_tier(str(r.get("content") or ""))
        restaurants.append(Restaurant(
            name=r.get("title") or "Restaurant",
            address="",
            geo=Geo(lat=0.0, lng=0.0),
            dietary_match=[d for d in dietary_filters],
            price_tier=price,
            kid_friendly=(booking.party_type == 'family'),
            reservation_link=r.get("url"),
            source={"name": "tavily", "url": r.get("url")}
        ))
    if rest_results:
        sources.append(DebugSource(type="tavily", query=rest_query, url=rest_results[0].get("url")))
    # No fallback restaurants: if live results are empty, restaurants remains empty.

    # 4) Itinerary mapping across dates
    dates = _date_range(booking.start_date, booking.end_date)
    act_ids = [a.id for a in activities]
    itinerary = _build_itinerary(dates or [booking.start_date], act_ids)

    # 5) Packing checklist and notes
    packing = _pack_list_from_weather(weather_text or "")
    if prefs.mobility_needs and getattr(prefs.mobility_needs, 'wheelchair', False):
        packing.append({"item": "Portable ramp (if needed)", "reason": "mobility", "mandatory": False})
    if booking.children_ages:
        packing.append({"item": "Snacks / wipes for kids", "reason": "activity", "mandatory": False})

    notes: List[Note] = []
    if weather_text:
        notes.append(Note(type="weather", text=weather_text[:500]))
    if dietary_filters:
        notes.append(Note(type="dietary", text=f"Filtering restaurants for: {', '.join(dietary_filters)}"))
    if prefs.mobility_needs and (getattr(prefs.mobility_needs, 'wheelchair', False) or getattr(prefs.mobility_needs, 'stroller', False)):
        notes.append(Note(type="mobility", text="Routes kept wheelchair/stroller-friendly where possible."))

    # 6) Airbnb properties in the requested location (from DB)
    properties_list: List[Dict[str, Any]] = []
    properties_dbg: Dict[str, Any] = {"reason": "skipped"}
    try:
        if booking.location:
            properties_list, properties_dbg = _fetch_properties_by_location(booking.location, limit=10)
        else:
            properties_list, properties_dbg = [], {"reason": "no_location"}
    except Exception as e:
        properties_list, properties_dbg = [], {"error": str(e)}

    tavily_on = _tavily_enabled()
    computed_dates = _date_range(booking.start_date, booking.end_date)
    debug = {
        "query_understanding": _nlu_extract(nlu_query),
        "inferred": hints,
        "tavily_enabled": tavily_on,
        "date_range": {
            "start": booking.start_date,
            "end": booking.end_date,
            "days": len(computed_dates),
        },
        "sources": [_to_dict(s) for s in sources],
        "location_filter": {
            "location": booking.location,
            "events": {"before": len(events_all or []), "after": len(events or [])},
            "pois": {"before": len(pois_all or []), "after": len(pois or [])},
            "restaurants": {"before": len(rest_results_raw or []), "after": len(rest_results or [])},
        },
    "properties": {"location": booking.location, "count": len(properties_list), **(properties_dbg or {})},
    }

    # Build backward-compatible response shape along with the new one
    legacy_day_by_day = []
    for day in itinerary:
        highlights = []
        for b in day["blocks"]:
            # Use activity titles for highlights
            highlights.extend([a.title for a in activities if a.id in b["activities"]])
        legacy_day_by_day.append({
            "day": day["date"],
            "title": f"Plan for {day['date']}",
            "highlights": highlights[:5]
        })
    legacy_activity_cards = [
        {
            "name": a.title,
            "type": ",".join(a.tags or []),
            "duration": f"{a.duration_minutes or 90} minutes",
            "suits": [
                *( ["wheelchair"] if a.wheelchair_friendly else [] ),
                *( ["kids"] if a.child_friendly else [] ),
                *( ["strollers"] if a.stroller_friendly else [] ),
            ],
            "link": a.booking_link,
        } for a in activities
    ]
    legacy_restaurants = []
    for r in restaurants:
        link = r.reservation_link
        if not link and r.source and isinstance(r.source, dict):
            link = r.source.get("url")
        legacy_restaurants.append({
            "name": r.name,
            "cuisine": ",".join(r.dietary_match or []),
            "notes": ("Kid-friendly" if r.kid_friendly else ""),
            "link": link,
        })

    response = {
        # New schema
        "itinerary": itinerary,
        "activities": [a.model_dump() if hasattr(a, "model_dump") else a.dict() for a in activities],
        "restaurants": [r.model_dump() if hasattr(r, "model_dump") else r.dict() for r in restaurants],
        "properties": (properties_list if properties_list else "no property"),
        "packing_checklist": packing,
        "notes": [n.model_dump() if hasattr(n, "model_dump") else n.dict() for n in notes],
        "debug": debug,
        # Legacy schema
        "day_by_day_plan": legacy_day_by_day,
        "activity_cards": legacy_activity_cards,
        "restaurant_recommendations": legacy_restaurants,
    }
    return response


@router.get("/concierge-agent/diag")
async def concierge_diag():
    """Diagnostic endpoint to verify dynamic mode.
    Returns whether Tavily is enabled and a tiny sample search count (0 if disabled or error).
    """
    enabled = _tavily_enabled()
    sample_count = 0
    if enabled:
        try:
            res = await _tavily_search("best things to do in London", 1)
            sample_count = len(res)
        except Exception:
            sample_count = 0
    return {"tavily_enabled": enabled, "sample_results": sample_count}

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
