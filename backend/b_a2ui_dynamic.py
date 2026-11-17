# HARNESS: the A2UI / Dynamic Schema (default auto-inject path) page gives no OpenAI Agents agent. Showcase system prompt (same as the
# LangGraph harness agent), served as a plain OpenAI Agents SDK Agent; the AG-UI adapter passes the
# run's frontend tools and context to the model.
from agents import Agent, ModelSettings

SYSTEM_PROMPT = 'You are a demo assistant for Declarative Generative UI (A2UI — Dynamic Schema). Whenever a response would benefit from a rich visual — a dashboard, status report, KPI summary, card layout, info grid, a pie/donut chart of part-of-whole breakdowns, or a bar chart comparing values across categories — call `generate_a2ui` to draw it. Keep chat replies to one short sentence and let the UI do the talking.'

a2ui_dynamic_agent = Agent(
    name="a2ui_dynamic_agent",
    instructions=SYSTEM_PROMPT,
    model="gpt-4.1-mini",  # HARNESS: same model as demo_agents._common.MODEL
)
