// HARNESS: the Threads Drawer page needs a runtime connected to CopilotKit Intelligence (the page
// says so but its snippet only points at "/api/copilotkit"). This harness's main /api/copilotkit route
// has no `intelligence`, so the drawer page points here: the quickstart runtime plus the
// `intelligence` / `identifyUser` options exactly as headless-threads shows them.
import {
  CopilotKitIntelligence,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";

const agent = new HttpAgent({ url: "http://localhost:8092/threads" }); // HARNESS: group A backend

const runtime = new CopilotRuntime({
  agents: {
    openai_agent: agent,
    // HARNESS: the Threads Drawer page's provider has no agentId, so it resolves to "default".
    default: agent,
  },
  intelligence: new CopilotKitIntelligence({
    apiKey: process.env.CPK_INTELLIGENCE_API_KEY!,
  }),
  // Threads are per-user. Without this, every visitor shares one history.
  identifyUser: (request) => ({
    id: request.headers.get("x-user-id") ?? "anonymous",
    name: request.headers.get("x-user-name") ?? "Anonymous",
  }),
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit-intelligence", // HARNESS: own path (doc: "/api/copilotkit")
});

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
