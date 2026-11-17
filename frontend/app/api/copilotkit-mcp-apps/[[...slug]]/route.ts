// Verbatim from the MCP Apps page Code tab (copilotkit-mcp-apps/[[...slug]]/route.ts). HARNESS: only the region markers below are added.
// CopilotKit runtime for the MCP Apps cell — shared by two demos:
//   - headless-complete (cell exercises MCP Apps rendering via a hand-rolled
//     useRenderActivityMessage in use-rendered-messages.tsx)
//   - mcp-apps (relies on CopilotKit's built-in MCPAppsActivityRenderer)
//
// The runtime's `mcpApps` config auto-applies the MCP Apps middleware to the
// agent: when the agent calls a tool backed by an MCP UI resource, the
// middleware fetches the resource and emits the activity event that the
// built-in `MCPAppsActivityRenderer` (registered by CopilotKit internally)
// renders in the chat as a sandboxed iframe.
//
// Reference:
// https://docs.copilotkit.ai/integrations/langgraph/generative-ui/mcp-apps

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client"; // HARNESS: OpenAI Agents backend over AG-UI instead of the showcase LangGraph agent


const headlessCompleteAgent = new HttpAgent({ url: "http://localhost:8092/headless-complete" }) // HARNESS: OpenAI Agents backend;

const mcpAppsAgent = new HttpAgent({ url: "http://localhost:8093/mcp-apps" }) // HARNESS: OpenAI Agents backend;

// @region[runtime-mcpapps-config]
// The `mcpApps.servers` config is all you need server-side. The runtime
// auto-applies the MCP Apps middleware to every registered agent: on each
// MCP tool call it fetches the associated UI resource and emits an
// `activity` event that the built-in `MCPAppsActivityRenderer` renders
// inline in the chat.
const runtime = new CopilotRuntime({
  // @ts-ignore
  agents: {
    "mcp-apps": mcpAppsAgent,
    // headless-complete shares this runtime because its cell also exercises
    // MCP Apps rendering (via a hand-rolled `useRenderActivityMessage` in
    // `use-rendered-messages.tsx`).
    "headless-complete": headlessCompleteAgent,
  },
  mcpApps: {
    servers: [
      {
        type: "http",
        url: process.env.MCP_SERVER_URL || "https://mcp.excalidraw.com/mcp", // Doc (openai-agents-python) URL
        // Always pin a stable `serverId`. Without it CopilotKit hashes the
        // URL, and a URL change silently breaks restoration of persisted
        // MCP Apps in prior conversation threads.
        serverId: "excalidraw",
      },
    ],
  },
});
// @endregion[runtime-mcpapps-config]

export const POST = async (req: NextRequest) => {
  try {
    const copilotHandler = createCopilotRuntimeHandler({
      runtime,
      basePath: "/api/copilotkit-mcp-apps",
      mode: "single-route",
    });
    return await copilotHandler(req);
  } catch (error: unknown) {
    // Log full error details server-side with a correlation id, but only
    // return the id (not the message or stack) to the client. Returning
    // raw `err.message` / `err.stack` over the wire leaks internals
    // (file paths, library versions, sometimes secrets in nested error
    // messages) to anyone who can hit /api/copilotkit-mcp-apps.
    const err = error instanceof Error ? error : new Error(String(error));
    const errorId = randomUUID();
    console.error(
      JSON.stringify({
        at: new Date().toISOString(),
        level: "error",
        route: "/api/copilotkit-mcp-apps",
        errorId,
        message: err.message,
        stack: err.stack,
      }),
    );
    return NextResponse.json(
      { error: "internal runtime error", errorId },
      { status: 500 },
    );
  }
};
