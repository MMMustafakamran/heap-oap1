# Doc: generative-ui/a2ui/fixed-schema (openai-agents-python), "Return render operations from the tool" block, verbatim.
# HARNESS: a2ui_schemas/flight_schema.json is never shown on the page (copied from the showcase).
# src/demo_agents/a2ui_fixed.py
import json
from pathlib import Path
from typing import Any

from agents import Agent, function_tool

from demo_agents._common import MODEL, chat_settings

CATALOG_ID = "copilotkit://flight-fixed-catalog"
SURFACE_ID = "flight-fixed-schema"

_SCHEMAS_DIR = Path(__file__).parent / "a2ui_schemas"

with open(_SCHEMAS_DIR / "flight_schema.json", encoding="utf-8") as _f:
    FLIGHT_SCHEMA: list[dict[str, Any]] = json.load(_f)


@function_tool
def display_flight(origin: str, destination: str, airline: str, price: str) -> dict:
    """Show a flight card for the given trip.

    Use short airport codes (e.g. "SFO", "JFK") for origin/destination and a
    price string like "$289".

    After this tool returns, the flight card is already rendered to the user
    via the A2UI surface — the JSON returned here is the surface descriptor
    the renderer consumes, NOT a status code. Do NOT call this tool again
    for the same flight (the user already sees the card). Reply with one
    short confirmation sentence and stop.
    """
    return {
        "a2ui_operations": [
            {
                "version": "v0.9",
                "createSurface": {"surfaceId": SURFACE_ID, "catalogId": CATALOG_ID},
            },
            {
                "version": "v0.9",
                "updateComponents": {
                    "surfaceId": SURFACE_ID,
                    "components": FLIGHT_SCHEMA,
                },
            },
            {
                "version": "v0.9",
                "updateDataModel": {
                    "surfaceId": SURFACE_ID,
                    "path": "/",
                    "value": {
                        "origin": origin,
                        "destination": destination,
                        "airline": airline,
                        "price": price,
                    },
                },
            },
        ]
    }


# HARNESS: the page defines display_flight but never builds an Agent that uses it.
a2ui_fixed_agent = Agent(
    name="a2ui_fixed",
    instructions="When the user asks for a flight, call display_flight with the origin, destination, airline and price.",  # HARNESS
    model=MODEL,
    model_settings=chat_settings(),
    tools=[display_flight],
)
