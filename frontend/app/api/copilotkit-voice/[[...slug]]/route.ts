// Doc: https://docs.copilotkit.ai/openai-agents-python/voice (Backend > Next.js API route), verbatim.
// src/app/api/copilotkit-voice/[[...slug]]/route.ts
import type { NextRequest } from "next/server";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";
import { createTranscriptionService } from "@/lib/transcription-service";

// HARNESS: doc line is `const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000";`. This app's
// AGENT_URL is the quickstart's full agent URL (http://localhost:8091/agent), so `${AGENT_URL}/voice`
// would hit 8091/agent/voice; pointed at the group A backend instead (never 8000).
const AGENT_URL = "http://localhost:8092";

const voiceDemoAgent = new HttpAgent({ url: `${AGENT_URL}/voice` });

let cachedHandler: ((req: Request) => Promise<Response>) | null = null;
function getHandler(): (req: Request) => Promise<Response> {
  if (cachedHandler) return cachedHandler;

  const runtime = new CopilotRuntime({
    // @ts-ignore -- see main route.ts; published agents type generic mismatch
    agents: {
      "voice-demo": voiceDemoAgent,
      default: voiceDemoAgent,
    },
    transcriptionService: createTranscriptionService(),
  });

  cachedHandler = createCopilotRuntimeHandler({
    runtime,
    basePath: "/api/copilotkit-voice",
  });
  return cachedHandler;
}

export const POST = (req: NextRequest) => getHandler()(req);
export const GET = (req: NextRequest) => getHandler()(req);
export const PUT = (req: NextRequest) => getHandler()(req);
export const DELETE = (req: NextRequest) => getHandler()(req);
