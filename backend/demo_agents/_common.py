# HARNESS: the doc snippets import `from demo_agents._common import MODEL, chat_settings`, but no
# page shows this module. Minimal stand-in: a fixed model id, and ModelSettings built from the
# keyword arguments the snippets pass (e.g. parallel_tool_calls=False).
from agents import ModelSettings

MODEL = "gpt-4.1-mini"  # HARNESS: the doc never says which model MODEL is


def chat_settings(**kwargs) -> ModelSettings:  # HARNESS
    return ModelSettings(**kwargs)


# HARNESS: a2ui_dynamic.py (Code tab) also imports CHAT_REASONING and openai_client from this
# module, which no page shows. Minimal stand-ins: no reasoning param, a default AsyncOpenAI client.
CHAT_REASONING = None  # HARNESS


def openai_client():  # HARNESS
    from openai import AsyncOpenAI

    return AsyncOpenAI()
