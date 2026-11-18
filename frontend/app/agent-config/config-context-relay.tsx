"use client"; // HARNESS: client component (the doc's block has no directive; hooks need one in Next.js)

// Doc: agent-config, block "frontend/src/app/page.tsx — UI publishes the typed config", verbatim below.
import { useAgentContext } from "@copilotkit/react-core/v2";

type AgentConfig = { tone: string; expertise: string; responseLength: string };

function ConfigContextRelay({ config }: { config: AgentConfig }) {
  useAgentContext({
    description: "Agent response preferences",
    value: {
      tone: config.tone,
      expertise: config.expertise,
      responseLength: config.responseLength,
    },
  });
  return null;
}

export { ConfigContextRelay }; // HARNESS: the doc never exports it; page.tsx mounts it.
