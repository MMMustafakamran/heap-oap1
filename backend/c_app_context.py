# Doc: shared-state/agent-readonly (openai-agents-python), app_context.py block verbatim.
# HARNESS: imports below; the page never shows them.
from agents import Agent

from demo_agents._common import MODEL, chat_settings

SYSTEM_PROMPT = (
    "You are a helpful, concise assistant. The frontend may provide "
    "read-only context about the user (e.g. name, timezone, recent "
    "activity) via the `useAgentContext` hook. Always consult that "
    "context when it is relevant — address the user by name if known, "
    "respect their timezone when mentioning times, and reference "
    "recent activity when it helps you answer. Keep responses short."
)


app_context_agent = Agent(
    name="context_assistant",
    instructions=SYSTEM_PROMPT,
    model=MODEL,
    model_settings=chat_settings(),
)
