import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client"; // HARNESS: OpenAI Agents backend over AG-UI instead of the showcase LangGraph agent

// Dedicated runtime for the Open Generative UI demos.
// Isolated here because the `openGenerativeUI` runtime flag sets
// `openGenerativeUIEnabled: true` globally on the probe response, which
// causes the CopilotKit provider's setTools effect to wipe per-demo
// `useFrontendTool`/`useComponent` registrations in the default runtime.


const openGenUiAgent = new HttpAgent({ url: "http://localhost:8093/open-gen-ui" }) // HARNESS: OpenAI Agents backend;
const openGenUiAdvancedAgent = new HttpAgent({ url: "http://localhost:8093/open-gen-ui-advanced" }) // HARNESS: OpenAI Agents backend;

const agents: Record<string, HttpAgent> = {
  "open-gen-ui": openGenUiAgent,
  "open-gen-ui-advanced": openGenUiAdvancedAgent,
};

export const POST = async (req: NextRequest) => {
  try {
    const copilotHandler = createCopilotRuntimeHandler({
      // @region[minimal-runtime-flag]
      // @region[advanced-runtime-config]
      // Server-side config is identical for the minimal and advanced cells —
      // the advanced behaviour (sandbox -> host function calls) is wired
      // entirely on the frontend via `openGenerativeUI.sandboxFunctions` on
      // the provider. The single `openGenerativeUI` flag below turns on
      // Open Generative UI for the listed agent(s); the runtime middleware
      // converts each agent's `generateSandboxedUi` tool call into
      // `open-generative-ui` activity events.
      runtime: new CopilotRuntime({
        agents,
        openGenerativeUI: {
          agents: ["open-gen-ui", "open-gen-ui-advanced"],
        },
      }),
      // @endregion[advanced-runtime-config]
      // @endregion[minimal-runtime-flag],
      basePath: "/api/copilotkit-ogui",
      mode: "single-route",
    });
    return await copilotHandler(req);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 },
    );
  }
};
