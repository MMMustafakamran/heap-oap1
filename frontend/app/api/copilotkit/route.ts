import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import type { NextRequest } from "next/server";
// HARNESS: guide pages target other agent names; registered from these group files (no doc step does it).
import { harnessAgents as ga } from "../../../harness/agents-a";
import { harnessAgents as gb } from "../../../harness/agents-b";
import { harnessAgents as gc } from "../../../harness/agents-c";

const runtime = new CopilotRuntime({
  agents: {
    openai_agent: new HttpAgent({
      url: process.env.AGENT_URL ?? "http://localhost:8000/agent", // HARNESS: AGENT_URL=http://localhost:8091/agent in .env.local (never 8000)
    }),
    ...ga, ...gb, ...gc, // HARNESS
  },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});

export const POST = (req: NextRequest) => handler(req);
