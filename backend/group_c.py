from fastapi import FastAPI

# HARNESS: group app on 8094; each page's doc agent is wrapped and mounted at /<page-id>.
from ag_ui_openai_agents import OpenAIAgentsAgent, add_openai_agents_fastapi_endpoint

from c_app_context import app_context_agent
from c_hitl import hitl_in_chat_agent
from c_shared_state import shared_state_read_write_agent
from c_shared_state_streaming import DocumentStreamingAgent, shared_state_streaming_agent
from c_subagents import subagents_agent

app = FastAPI()  # HARNESS: group app; pages mount their doc agents here

add_openai_agents_fastapi_endpoint(app, OpenAIAgentsAgent(shared_state_read_write_agent), "/shared-state")
# Doc (streaming): "Mount the agent wrapped in that subclass"
add_openai_agents_fastapi_endpoint(app, DocumentStreamingAgent(shared_state_streaming_agent), "/shared-state-streaming")
add_openai_agents_fastapi_endpoint(app, OpenAIAgentsAgent(app_context_agent), "/agent-readonly")
add_openai_agents_fastapi_endpoint(app, OpenAIAgentsAgent(hitl_in_chat_agent), "/human-in-the-loop")
add_openai_agents_fastapi_endpoint(app, OpenAIAgentsAgent(subagents_agent), "/subagents")
