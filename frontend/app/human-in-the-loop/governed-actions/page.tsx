"use client"; // HARNESS
// HARNESS page: the doc shows no page, provider or agent. Mounted under the quickstart's
// <CopilotKit agent="openai_agent"> (layout.tsx); OpenAIAgentsAgent hands frontend tools to the model.
import { CopilotChat } from "@copilotkit/react-core/v2";
import { GovernedActionApproval, GovernedActionTool } from "./governed";

export default function Page() {
  return (
    <>
      <GovernedActionApproval />
      <GovernedActionTool />
      <div style={{ height: "100vh" }}>
        <CopilotChat />
      </div>
    </>
  );
}
