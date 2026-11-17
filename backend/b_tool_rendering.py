# Doc: generative-ui/tool-rendering (openai-agents-python): get_weather block and tool_rendering.py
# (TOOLS + tool_rendering_agent), verbatim.
# HARNESS: imports below; the page never shows them.
from random import choice, randint

from agents import Agent, function_tool

from demo_agents._common import MODEL, chat_settings

# HARNESS: SYSTEM_PROMPT is used by the page's agent but never defined on the OpenAI Agents page.
# Text taken from the LangGraph Python version of the same page.
SYSTEM_PROMPT = (
    "You are a travel & lifestyle concierge. Use the mock tools for "
    "weather, flights, stock prices, or d20 rolls when the user asks; "
    "otherwise reply in plain text. For flights, default origin to 'SFO' "
    "if the user only names a destination. Call multiple tools in one "
    "turn if asked. After tools return, summarize in one short sentence. "
    "Never fabricate data a tool could provide."
)


@function_tool
def get_weather(location: str) -> dict:
    """Get the current weather for a given location."""
    return {
        "city": location,
        "temperature": 68,
        "humidity": 55,
        "wind_speed": 10,
        "conditions": "Sunny",
    }


# HARNESS: search_flights, get_stock_price, roll_d20 are listed in TOOLS but never defined on the
# page. Ported from the showcase (LangGraph tool_rendering_agent.py) with @function_tool.
@function_tool
def search_flights(origin: str, destination: str) -> dict:  # HARNESS
    """Search mock flights from an origin airport to a destination airport."""
    return {
        "origin": origin,
        "destination": destination,
        "flights": [
            {"airline": "United", "flight": "UA231", "depart": "08:15", "arrive": "16:45", "price_usd": 348},
            {"airline": "Delta", "flight": "DL412", "depart": "11:20", "arrive": "19:55", "price_usd": 312},
            {"airline": "JetBlue", "flight": "B6722", "depart": "17:05", "arrive": "01:30", "price_usd": 289},
        ],
    }


@function_tool
def get_stock_price(ticker: str, price_usd: float | None = None, change_pct: float | None = None) -> dict:  # HARNESS
    """Get a mock current price for a stock ticker."""
    return {
        "ticker": ticker.upper(),
        "price_usd": round(price_usd if price_usd is not None else 100 + randint(0, 400) + randint(0, 99) / 100, 2),
        "change_pct": round(change_pct if change_pct is not None else choice([-1, 1]) * randint(0, 300) / 100, 2),
    }


@function_tool
def roll_d20(value: int | None = None) -> dict:  # HARNESS
    """Roll a 20-sided die."""
    rolled = value if isinstance(value, int) and 1 <= value <= 20 else randint(1, 20)
    return {"sides": 20, "value": rolled, "result": rolled}


TOOLS = [get_weather, search_flights, get_stock_price, roll_d20]


tool_rendering_agent = Agent(
    name="concierge",
    instructions=SYSTEM_PROMPT,
    model=MODEL,
    model_settings=chat_settings(),
    tools=TOOLS,
)
