# OpenAIAgents-React

Docs QA harness for CopilotKit + OpenAI Agents SDK (Python), React: https://docs.copilotkit.ai/openai-agents-python. One route per doc page, doc code verbatim, one clip per page. The goal is to show doc defects; fixes that hide one are banned. Overview: [README.md](README.md).

## Rules

`.qa/` is the vendored copy of the shared tooling and rules (filled by the sync script; never edit it here).

@.qa/instructions/QA-RULES.md
@.qa/instructions/AUTORECORDER.md
@.qa/instructions/VOICE.md
@.qa/instructions/REVIEW.md
@.qa/instructions/REPORT.md

## This repo

- Ports: frontend **3090** (Next.js, Copilot Runtime at `/api/copilotkit`), quickstart agent **8091** (`backend/main.py`), page agents **8092** (`group_a`: chat, look and feel, threads, frontend tools) · **8093** (`group_b`: generative UI) · **8094** (`group_c`: shared state, HITL, WebMCP, sub-agents). Never 3000 / 8000; the doc's 8000 is overridden with `--port` and its own `AGENT_URL`.
- Guide pages' agent names are registered in `frontend/harness/agents-{a,b,c}.ts` (HARNESS: no doc step registers them).
- Keys: `backend/.env` (`OPENAI_API_KEY`), `frontend/.env.local` (`AGENT_URL`). Names in [.env.example](.env.example). Never print or commit them.
- `npm run dev` never type-checks: TS errors are build-only findings.
- Recorder: `autorecorder/` (`npm run record -- --pages=<id>`, `doctor`). `autorecorder/core/` is frozen. `assignment.json` is the report source (`.qa/report/build.py`).
