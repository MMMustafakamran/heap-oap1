# HARNESS: these guide pages (chat, sidebar, popup, chat controls, CSS, slots, markdown, headless UI,
# multimodal, voice, threads) show only frontend code and never give an agent. Stand-in: the
# quickstart's own agent (backend/main.py), one copy per page path.
from agents import Agent

harness_agent = Agent(
    name="assistant",
    instructions="You are a helpful assistant embedded in a CopilotKit app.",
)
