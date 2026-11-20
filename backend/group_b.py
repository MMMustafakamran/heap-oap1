# HARNESS: group B (generative UI) page agents on port 8093. No doc page shows how its agent is
# served; each page's doc agent is wrapped in OpenAIAgentsAgent and mounted at /<page-id>, the way
# the quickstart serves its agent. Each mount is isolated so one broken page module cannot take
# the others down; the traceback goes to the log (logs/backend-8093.log).
import importlib
import traceback

from ag_ui_openai_agents import OpenAIAgentsAgent, add_openai_agents_fastapi_endpoint
from fastapi import FastAPI

app = FastAPI()  # HARNESS: group app; pages mount their doc agents here


def _mount(path: str, module: str, attr: str, wrap: bool = True) -> None:  # HARNESS
    try:
        obj = getattr(importlib.import_module(module), attr)
        add_openai_agents_fastapi_endpoint(app, OpenAIAgentsAgent(obj) if wrap else obj, path)
        print(f"[group_b] mounted {path} <- {module}.{attr}", flush=True)
    except Exception:
        print(f"[group_b] FAILED {path} <- {module}.{attr}", flush=True)
        traceback.print_exc()


_mount("/tool-based", "b_tool_based", "gen_ui_tool_based_agent")
_mount("/tool-rendering", "b_tool_rendering", "tool_rendering_agent")
_mount("/json-render", "b_json_render", "json_render_agent")
_mount("/hashbrown", "b_hashbrown", "hashbrown_agent")
_mount("/open-gen-ui", "b_open_gen_ui", "open_gen_ui_agent")
_mount("/open-gen-ui-advanced", "b_open_gen_ui_advanced", "open_gen_ui_advanced_agent")
_mount("/mcp-apps", "b_mcp_apps", "mcp_apps_agent")
_mount("/a2ui-dynamic", "b_a2ui_dynamic", "a2ui_dynamic_agent")
_mount("/a2ui-fixed", "b_a2ui_fixed", "a2ui_fixed_agent")

# HARNESS: Code-tab agents (demo_agents/*, copied verbatim from each page's Code tab) mounted at
# the paths the Code-tab routes call (`${AGENT_URL}/<path>`). No page shows the agent server.
_mount("/declarative_json_render", "demo_agents.byoc_json_render", "byoc_json_render_agent")
_mount("/declarative_hashbrown", "demo_agents.byoc_hashbrown", "byoc_hashbrown_agent")
_mount("/declarative_gen_ui", "demo_agents.a2ui_dynamic", "declarative_gen_ui_agent")
_mount("/a2ui_fixed_schema", "demo_agents.a2ui_fixed", "a2ui_fixed_agent")
