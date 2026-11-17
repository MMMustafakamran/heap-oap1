"use client";
// HARNESS: the page shows AgentTrigger but not where to mount it. Provider + a chat (to see the
// messages the button sends) on the doc's Python graph (backend/programmatic_control.py).
import { CopilotKit, CopilotChat } from "@copilotkit/react-core/v2";
import { AgentTrigger } from "./AgentTrigger";

export default function Page() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="programmatic_control">
      <div style={{ padding: 12 }}>
        <AgentTrigger agentId="programmatic_control" />
      </div>
      <div style={{ height: "85vh" }}>
        <CopilotChat agentId="programmatic_control" />
      </div>
    </CopilotKit>
  );
}
