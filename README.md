# OpenAIAgents-React: CopilotKit docs QA (OpenAI Agents SDK, Python, React)

QA harness for https://docs.copilotkit.ai/openai-agents-python. Every reachable doc page has a route in a real Next.js app with the doc's snippets pasted **verbatim**; a clip shows what happens when a reader follows the page. Defects are listed in [FINDINGS.md](FINDINGS.md). The only allowed edits are marked `HARNESS`.

## Layout

```
backend/        OpenAI Agents SDK agents over AG-UI (FastAPI): main.py 8091 (quickstart), group_a 8092, group_b 8093, group_c 8094
frontend/       Next.js app (3090), one route per doc page; Copilot Runtime at /api/copilotkit*
autorecorder/   clip recorder (config/pages*.ts, actions/)
narration/      voice-over scripts and audio for failing pages
doc-snapshot/   docs snapshot used by the drift check
assignment.json per-page status, findings, clips, Loom links (report source)
start-all.sh    starts every server on the harness ports (never 3000 / 8000)
```

## Run

1. `backend/.env`: `OPENAI_API_KEY=...`; `frontend/.env.local`: `AGENT_URL=http://localhost:8091/agent` (see `.env.example`).
2. `cd backend && uv sync`, `cd frontend && npm install`, then `bash start-all.sh`.
3. Open http://localhost:3090 (quickstart) or http://localhost:3090/<route>.
