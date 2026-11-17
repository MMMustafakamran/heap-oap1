// Dedicated runtime for the A2UI — Fixed Schema cell. Splitting into its own
// endpoint lets us set `a2ui.injectA2UITool: false` — the backend agent owns
// the `display_flight` tool which emits its own `a2ui_operations` container.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client"; // HARNESS: OpenAI Agents backend over AG-UI instead of the showcase LangGraph agent


const a2uiFixedSchemaAgent = new HttpAgent({ url: "http://localhost:8093/a2ui-fixed" }) // HARNESS: OpenAI Agents backend;

const runtime = new CopilotRuntime({
  // @ts-ignore -- see main route.ts
  agents: { "a2ui-fixed-schema": a2uiFixedSchemaAgent },
  a2ui: {
    // The backend emits its own `a2ui_operations` container via `display_flight`
    // (see src/agent/a2ui-fixed.ts). We still run the A2UI middleware so it
    // detects the container in tool results and forwards surfaces to the
    // frontend — but we do NOT inject a runtime `render_a2ui` tool on top.
    injectA2UITool: false,
    agents: ["a2ui-fixed-schema"], // Doc: registering the runtime
  },
});

export const POST = async (req: NextRequest) => {
  try {
    const copilotHandler = createCopilotRuntimeHandler({
      runtime,
      basePath: "/api/copilotkit-a2ui-fixed-schema",
      mode: "single-route",
    });
    return await copilotHandler(req);
  } catch (error: unknown) {
    const e = error as { message?: string; stack?: string };
    return NextResponse.json(
      { error: e.message, stack: e.stack },
      { status: 500 },
    );
  }
};
