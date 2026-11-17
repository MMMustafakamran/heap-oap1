#!/usr/bin/env bash
# HARNESS: starts OpenAIAgents-React on its harness ports (QA-RULES §4: never 3000/8000).
#   8091 quickstart agent (backend/main.py; doc port 8000, doc command `uv run --env-file .env uvicorn main:app --port 8000`)
#   8092-8099 page agents (see the PAGE AGENTS block below)
#   3090 Next.js frontend; Copilot Runtime at /api/copilotkit (AGENT_URL in frontend/.env.local, the doc's own override)
cd "$(dirname "$0")"
mkdir -p logs
(cd backend && uv run --env-file .env uvicorn main:app --host 0.0.0.0 --port 8091 > ../logs/backend-8091.log 2>&1) &
# ── PAGE AGENTS: one line per page backend (ports 8092-8099)
(cd backend && uv run --env-file .env uvicorn group_a:app --host 0.0.0.0 --port 8092 > ../logs/backend-8092.log 2>&1) &  # chat, look and feel, threads, frontend tools
(cd backend && uv run --env-file .env uvicorn group_b:app --host 0.0.0.0 --port 8093 > ../logs/backend-8093.log 2>&1) &  # generative UI
(cd backend && uv run --env-file .env uvicorn group_c:app --host 0.0.0.0 --port 8094 > ../logs/backend-8094.log 2>&1) &  # shared state, HITL, webmcp, sub-agents
# ── END PAGE AGENTS
(cd frontend && npm run dev > ../logs/frontend-3090.log 2>&1) &
wait
