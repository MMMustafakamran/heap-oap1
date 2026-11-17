# Findings: CopilotKit docs, OpenAI Agents (Python) + React

Open doc defects for https://docs.copilotkit.ai/openai-agents-python (React pages), found by following each page verbatim in this harness.

Stack: `@copilotkit/react-core` 1.85.0, `@copilotkit/runtime` 1.85.0, `@ag-ui/client` 1.0.2 (doc pins it), Next.js 16.4.5, React 19.3.0 · `openai-agents` 0.24.0, `ag-ui-openai-agents` 0.1.0, FastAPI 0.163.1 · Node 26.7.0, npm 11, Python 3.13.15 · Microsoft Windows 11 Pro · docs snapshot 2026-11-17. CI installs npm `latest` CopilotKit / AG-UI each run (`VERSIONS.md`).

## Dev blockers

### [Render agent state in your app](https://docs.copilotkit.ai/openai-agents-python/shared-state/rendering-in-app)

**#1** `useAgent()` without an agent id looks for an agent named `default`, which no step registers.
- **Doc:** `const { agent, isReady } = useAgent();` with "No agentId means the "default" agent", under `<CopilotKit runtimeUrl="/api/copilotkit">`. The quickstart registers only `openai_agent`.
- **Error (every load):** `useAgent: Agent 'default' not found after runtime sync (runtimeUrl=/api/copilotkit). Known agents: [openai_agent, …]`. No reply, no state rendered.
- **Confirmed by harness:** a copy with `agent="openai_agent"` on the provider runs.

### [Headless Threads](https://docs.copilotkit.ai/openai-agents-python/headless-threads)

**#2** The page's runtime registers the agent as `default`, while the quickstart's provider targets `openai_agent`.
- **Doc:** `agents: { default: agent }` in `server.ts`; `agent` and `verifyAppSession` are never defined.
- **Error:** `useAgent: Agent 'openai_agent' not found after runtime sync (runtimeUrl=/api/copilotkit-threads). Known agents: [default]`. No reply.

### [State and actions](https://docs.copilotkit.ai/openai-agents-python/generative-ui/components/state-and-actions)

**#3** Asked for product cards, the assistant message stays empty: no `ProductCard` renders and the cart never fills (3/3 runs). `shopUI` is split across several blocks on the page (merged into one catalog in the harness).

### [A2UI](https://docs.copilotkit.ai/openai-agents-python/generative-ui/a2ui)

**#4** Wrong-framework agent code and a broken surface.
- **Doc:** `from copilotkit import a2ui` (CopilotKit Python SDK); no OpenAI Agents agent. The page says the runtime adds a tool named `generate_a2ui`; the tool called is `render_a2ui`.
- **Error (3/3):** `A2UI render error: Cannot read properties of undefined (reading 'map')`. Same with the quickstart agent.

### [Dynamic Schema A2UI](https://docs.copilotkit.ai/openai-agents-python/generative-ui/a2ui/dynamic-schema)

**#5** The agent code is LangGraph: `from ag_ui_langgraph import get_a2ui_tools`, `from langchain_openai import ChatOpenAI`; `my_other_tool` is undefined. The surface fails with the same `A2UI render error: Cannot read properties of undefined (reading 'map')` (3/3).

### [Fixed Schema A2UI](https://docs.copilotkit.ai/openai-agents-python/generative-ui/a2ui/fixed-schema)

**#6** `display_flight` is defined but no `Agent` using it is built, and `a2ui_schemas/flight_schema.json` is never shown.
- **Result (3/3, harness agent + showcase schema):** the "Flight Details" card and "Book flight" button render, but airports, airline and price are empty.

### [Hashbrown](https://docs.copilotkit.ai/openai-agents-python/generative-ui/hashbrown)

**#7** (⚠️) The page gives no OpenAI Agents agent, only "The agent sends **one JSON object** as the assistant message" and example output. The dashboard renders once an agent is written by hand (harness agent).

## Minor notes

- **#8** `demo_agents._common` (`MODEL`, `chat_settings`) is imported on Shared State, Agent Read-Only Context, HITL, Sub-agents, Components as Tools, Frontend Tools and Fixed Schema A2UI but never shown.
- **#9** Shared State: step 1's agent lists `tools=[set_notes]`, defined only in step 2; imports never shown.
- **#10** State Streaming: `shared_state_streaming_agent` is mounted but never defined.
- **#11** Tool Call Rendering: `SYSTEM_PROMPT`, `search_flights`, `get_stock_price`, `roll_d20` are never defined (NameError as published).
- **#12** Programmatic Control: `agent_server.py` uses `AGENTS` and `lifespan` without defining them.
- **#13** Reasoning / Reasoning Messages: no agent or model is given; the example model `gpt-6-luna` does not exist.
- **#14** JSON Render: no OpenAI Agents agent, only example agent output (same gap as #7; works on a harness agent).
- **#15** Open Generative UI: `VISUALIZATION_DESIGN_SKILL` is never defined. Adopt from A2UI: `Airport` / `Arrow` renderers never shown. Surfaces: `Product` / `ProductRow` never defined.
- **#16** WebMCP: `searchOrders` is never defined. Governed actions: no page/provider/agent shown; `executeSideEffect` undefined.
- **#17** HITL overview steps 4–5 point to `useInterrupt`, whose page says "Not available on this framework"; `_answers` in `SchedulerAgent` is undefined.
- **#18** Voice: the doc's `${AGENT_URL}/voice` collides with the quickstart's `AGENT_URL` (`…/agent`), giving `/agent/voice`.
- **#19** Headless UI logs `[langgraph-python:headless-simple]` (wrong framework label).
- **#20** Prebuilt Chat / Sidebar / Popup: `useAgenticChatSuggestions`, `MainContent`, `Suggestions` never shown; Chat controls: `analytics` undefined.
- **#22** Theming: works, but the reply sometimes renders nothing ("Part of this UI couldn't be shown").
- **#21** Next.js logs `require('node:crypto').randomUUID()` "unstable value in a Client Component" from `CopilotKitProvider` on every route.
