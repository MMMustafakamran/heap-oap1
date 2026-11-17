# HARNESS: the Reasoning pages (generative-ui/reasoning, custom-look-and-feel/reasoning-messages)
# show only frontend code and give no agent. They say reasoning-capable models emit reasoning
# tokens; stand-in: a reasoning model with reasoning summaries switched on.
from agents import Agent, ModelSettings
from openai.types.shared import Reasoning

reasoning_agent = Agent(
    name="reasoning_assistant",
    instructions="You are a helpful assistant. Think step by step.",
    model="gpt-5-mini",  # HARNESS: the page names gpt-6-luna as an example, no model for this agent
    model_settings=ModelSettings(reasoning=Reasoning(effort="low", summary="auto")),  # HARNESS
)
