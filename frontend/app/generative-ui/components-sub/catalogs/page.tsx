"use client";
// HARNESS page. Provider line is the doc's ("Then give it to the provider"), plus a CopilotChat.
// HARNESS: agentId openai_agent (the quickstart agent); the doc provider names no agent and this runtime has no "default".
import { CopilotKitProvider, CopilotChat } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { shopUI } from "./catalog";

export default function Page() {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit" generativeUI={{ ui: shopUI }}>
      <div style={{ height: "100vh" }}><CopilotChat agentId="openai_agent" /></div>
    </CopilotKitProvider>
  );
}
