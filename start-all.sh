#!/usr/bin/env bash
# HARNESS: starts OpenAIAgents-React on its harness ports (QA-RULES §4: never 3000/8000).
#   8091 quickstart agent (backend/main.py; doc port 8000, doc command `uv run --env-file .env uvicorn main:app --port 8000`)
#   8092-8099 page agents (see the PAGE AGENTS block below)
#   3090 Next.js frontend; Copilot Runtime at /api/copilotkit (AGENT_URL in frontend/.env.local, the doc's own override)
cd "$(dirname "$0")"
mkdir -p logs
# CHANGED: every server runs in a real terminal (.qa/tools/ptyrun.cjs): logs/<name>.log as before,
# plus logs/<name>.log.pty, the raw terminal the recorder shows on a failed take.
PTYRUN="node $(pwd)/.qa/tools/ptyrun.cjs"
(cd backend && $PTYRUN ../logs/backend-8091.log --name "uv run uvicorn main:app --host 0.0.0.0 --port 8091" -- uv run --env-file .env uvicorn main:app --host 0.0.0.0 --port 8091) &
# ── PAGE AGENTS: one line per page backend (ports 8092-8099)
(cd backend && $PTYRUN ../logs/backend-8092.log --name "uv run uvicorn group_a:app --host 0.0.0.0 --port 8092" -- uv run --env-file .env uvicorn group_a:app --host 0.0.0.0 --port 8092) &  # chat, look and feel, threads, frontend tools
(cd backend && $PTYRUN ../logs/backend-8093.log --name "uv run uvicorn group_b:app --host 0.0.0.0 --port 8093" -- uv run --env-file .env uvicorn group_b:app --host 0.0.0.0 --port 8093) &  # generative UI
(cd backend && $PTYRUN ../logs/backend-8094.log --name "uv run uvicorn group_c:app --host 0.0.0.0 --port 8094" -- uv run --env-file .env uvicorn group_c:app --host 0.0.0.0 --port 8094) &  # shared state, HITL, webmcp, sub-agents
# ── END PAGE AGENTS
(cd frontend && $PTYRUN ../logs/frontend-3090.log --name "npm run dev" -- npm run dev) &
wait
