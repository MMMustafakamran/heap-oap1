"use client"; // HARNESS: Next route needs a client component
// Doc: https://docs.copilotkit.ai/openai-agents-python/multimodal-attachments ("Quick start"), verbatim
// inside the HARNESS page wrapper. The page assumes "a working CopilotChat" and never registers
// "my-agent"; the harness registers it (frontend/harness/agents-a.ts, quickstart agent).
import { CopilotChat } from "@copilotkit/react-core/v2";

export default function Page() {
  return (
    <div style={{ height: "100vh" }}>
      {/* --- Doc --- */}
<CopilotChat
  agentId="my-agent"
  attachments={{ enabled: true }} // [!code highlight]
/>
      {/* --- end doc --- */}
    </div>
  );
}
