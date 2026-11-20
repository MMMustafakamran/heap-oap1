"use client";
// HARNESS: the Headless Threads page never shows where App goes or which provider wraps it.
// Mounted under the quickstart's provider (CopilotKit with an agent prop) pointing at the doc's
// server.ts runtime (app/api/copilotkit-threads/[[...slug]]/route.ts).
// HARNESS: the quickstart provider says agent="openai_agent"; the doc's server.ts registers the agent
// as "default" (and useThreads asks for "default"), so the provider's agent is renamed to "default".
import { CopilotKit } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { App } from "./App";

export default function HeadlessThreadsPage() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit-threads" agent="default">
      <App />
    </CopilotKit>
  );
}
