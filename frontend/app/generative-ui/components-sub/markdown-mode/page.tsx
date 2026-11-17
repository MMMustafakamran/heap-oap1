"use client";
// Doc: transports "Markdown transport" / markdown-mode "Turn it on" provider, verbatim.
// HARNESS: chat with agentId openai_agent (the quickstart agent; the doc names none and the runtime has no "default").
import { CopilotKitProvider, CopilotChat } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { standardUI } from "@copilotkit/react-core/v2/generative-ui";

export default function Page() {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit" generativeUI={{ ui: standardUI, transport: "markdown" }}>
      <div style={{ height: "100vh" }}><CopilotChat agentId="openai_agent" /></div>
    </CopilotKitProvider>
  );
}
