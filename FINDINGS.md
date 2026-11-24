# Findings: CopilotKit docs, OpenAI Agents (Python) + React

Open doc defects for https://docs.copilotkit.ai/openai-agents-python (React pages), found by following each page verbatim in this harness.

Stack: `@copilotkit/react-core` 1.90.0, `@copilotkit/runtime` 1.90.0, `@ag-ui/client` 1.0.5 (npm latest; the doc pins 1.0.2), Next.js 16.4.5, React 19.3.0 · `openai-agents` 0.25.0, `ag-ui-openai-agents` 0.2.0, FastAPI 0.165.0 · Node 26.7.0, npm 11, Python 3.13.15 · Microsoft Windows 11 Pro · docs snapshot 2026-11-18 (no drift on 2026-11-20 or 2026-11-23). CI installs npm `latest` CopilotKit / AG-UI each run (`VERSIONS.md`).

## Dev blockers

### [State and actions](https://docs.copilotkit.ai/openai-agents-python/generative-ui/components/state-and-actions)

**#3** Asked for product cards, `render_ui` is called, but the assistant message stays empty, no `ProductCard` renders and the cart never fills (2/2 CI runs). `shopUI` is split across several blocks on the page (merged into one catalog in the harness).

### [A2UI](https://docs.copilotkit.ai/openai-agents-python/generative-ui/a2ui)

**#4** The surface never renders, even on the page's own OpenAI Agents agent.
- **Doc:** "The middleware finds tool results that contain A2UI operations. It renders them as surfaces in the chat." The agent is the one in the Dynamic Schema Code tab (`a2ui_dynamic.py`, `ag_ui_a2ui_toolkit`), used as is.
- **Error (2/2 CI runs):** `A2UI render error: Cannot read properties of undefined (reading 'map')`.

### [Dynamic Schema A2UI](https://docs.copilotkit.ai/openai-agents-python/generative-ui/a2ui/dynamic-schema)

**#5** Following the Code tab's OpenAI Agents agent (`a2ui_dynamic.py` with `ag_ui_a2ui_toolkit`), `generate_a2ui` runs and returns the surface, but it never renders.
- **Doc:** "The A2UI middleware intercepts the stream and renders cards progressively as data items arrive."
- **Error (2/2 CI runs):** `A2UI render error: Cannot read properties of undefined (reading 'map')` / `Unable to display this surface: Cannot read properties of undefined (reading 'map')`.

## Minor notes

- **#1** Render agent state in your app: `useAgent()` with no id and the provider default to the `default` agent, the quickstart registers `openai_agent`; add `agent="openai_agent"` to the provider.
- **#2** Headless Threads: `server.ts` registers the agent as `default` while the quickstart provider targets `openai_agent` (one-string rename); `agent` / `verifyAppSession` are never defined.
- **#6** Fixed Schema A2UI: the agent and `flight_schema.json` are in the Code tab; `demo_agents._common` and the agent server are not shown.
- **#7** Hashbrown: the agent and its prompt are in the Code tab; `demo_agents._common` is never shown.
- **#24** JSON Render: the agent and its prompt are in the Code tab; `demo_agents._common` is never shown.
- **#29** A2UI / Dynamic Schema: the `ag-ui-a2ui-toolkit` install the Code-tab agent imports is never mentioned.
- **#8** `demo_agents._common` (`MODEL`, `chat_settings`) is imported on HITL, Sub-agents, Components as Tools, Frontend Tools and Fixed Schema A2UI but never shown.
- **#9** Shared State: step 1's agent lists `tools=[set_notes]`, defined only in step 2.
- **#10** State Streaming: `shared_state_streaming_agent` is mounted but never defined.
- **#11** Tool Call Rendering: `SYSTEM_PROMPT`, `search_flights`, `get_stock_price`, `roll_d20` are never defined (NameError as published).
- **#12** Programmatic Control: `agent_server.py` uses `AGENTS` and `lifespan` without defining them.
- **#13** Reasoning / Reasoning Messages: no agent or model is given; the example model `gpt-6-luna` does not exist.
- **#25** Slots: the snippets use placeholder components the page never defines (filled in from the showcase).
- **#26** Markdown: the `.my-link` / `.my-heading` styles are never defined (harness style block added).
- **#27** Threads Drawer: the Intelligence runtime setup is never shown (harness points `runtimeUrl` at it).
- **#15** Open Generative UI: `VISUALIZATION_DESIGN_SKILL` is never defined. Adopt from A2UI: `Airport` / `Arrow` renderers never shown. Surfaces: `Product` / `ProductRow` never defined.
- **#16** WebMCP: `searchOrders` is never defined. Governed actions: no page/provider shown; the only agent is LangGraph Python (interrupt path).
- **#17** HITL overview steps 4–5 point to `useInterrupt`, whose page says "Use useHumanInTheLoop on this framework"; `_answers` in `SchedulerAgent` is undefined.
- **#18** Voice: the doc's `${AGENT_URL}/voice` collides with the quickstart's `AGENT_URL` (`…/agent`), giving `/agent/voice`.
- **#19** Headless UI logs `[langgraph-python:headless-simple]` (wrong framework label).
- **#20** Chat controls: `analytics` undefined.
- **#23** Standard catalog: all ~60 per-component links (`/openai-agents-python/generative-ui/components/standard-catalog/<component>`) are 404s.
- **#21** Next.js logs `require('node:crypto').randomUUID()` "unstable value in a Client Component" from `CopilotKitProvider` on every route.
