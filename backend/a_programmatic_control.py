# Doc: programmatic-control (openai-agents-python), block titled agent_server.py, verbatim
# (the three lines between "--- Doc" and "--- end doc").
# HARNESS: the page never defines AGENTS or lifespan, nor shows the imports; filled below with the
# quickstart agent under the page's agent name, and a no-op lifespan.
from contextlib import asynccontextmanager

from agents import Agent
from ag_ui_openai_agents import OpenAIAgentsAgent, add_openai_agents_fastapi_endpoint
from fastapi import FastAPI

AGENTS = {  # HARNESS
    "programmatic_control": OpenAIAgentsAgent(
        Agent(name="assistant", instructions="You are a helpful assistant embedded in a CopilotKit app.")
    ),
}


@asynccontextmanager
async def lifespan(app):  # HARNESS
    yield


# --- Doc ---
app = FastAPI(title="OpenAI Agents SDK Agent Server", lifespan=lifespan)
for name, agent in AGENTS.items():
    add_openai_agents_fastapi_endpoint(app, agent, f"/{name}", include_health=False)
# --- end doc ---
