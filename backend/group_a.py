from fastapi import FastAPI

# HARNESS: group app on 8092; each page's doc agent is wrapped and mounted at /<agent-name>.
from ag_ui_openai_agents import OpenAIAgentsAgent, add_openai_agents_fastapi_endpoint

from a_agent_config import agent_config_agent
from a_frontend_tools import gen_ui_tool_based_agent
from a_harness_agent import harness_agent
from a_programmatic_control import app as programmatic_control_app
from a_reasoning import reasoning_agent

app = FastAPI()  # HARNESS: group app; pages mount their doc agents here

# HARNESS: pages that show no agent at all get the quickstart agent.
for _name in [
    "agentic_chat", "prebuilt-sidebar", "prebuilt-popup", "chat-controls",
    "chat-customization-css", "chat-slots", "markdown", "headless-simple", "headless-complete",
    "multimodal-demo", "voice", "threads", "inspector",
]:
    add_openai_agents_fastapi_endpoint(app, OpenAIAgentsAgent(harness_agent), f"/{_name}")

add_openai_agents_fastapi_endpoint(app, OpenAIAgentsAgent(gen_ui_tool_based_agent), "/frontend_tools")
add_openai_agents_fastapi_endpoint(app, OpenAIAgentsAgent(agent_config_agent), "/agent-config")
add_openai_agents_fastapi_endpoint(app, OpenAIAgentsAgent(reasoning_agent), "/reasoning-default")
add_openai_agents_fastapi_endpoint(app, OpenAIAgentsAgent(reasoning_agent), "/reasoning-custom")
# Doc's own server app (programmatic-control), mounted under /pc.
app.mount("/pc", programmatic_control_app)
