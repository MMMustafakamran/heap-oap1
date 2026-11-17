// Dedicated runtime for the Declarative Generative UI (A2UI — Dynamic Schema) cell.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client"; // HARNESS: OpenAI Agents backend over AG-UI instead of the showcase LangGraph agent


const declarativeGenUiAgent = new HttpAgent({ url: "http://localhost:8093/a2ui-dynamic" }) // HARNESS: OpenAI Agents backend;

const runtime = new CopilotRuntime({
  // @ts-ignore -- see main route.ts
  agents: { "declarative-gen-ui": declarativeGenUiAgent },
  // No runtime `a2ui` config: the page passes a catalog to the provider
  // (`<CopilotKit a2ui={{ catalog }}>`), which auto-enables A2UI and defaults
  // tool injection on (CopilotKit >= 1.61.2, PR #5611).
});

export const POST = async (req: NextRequest) => {
  try {
    const copilotHandler = createCopilotRuntimeHandler({
      runtime,
      basePath: "/api/copilotkit-declarative-gen-ui",
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
