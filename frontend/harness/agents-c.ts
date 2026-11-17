// HARNESS: agent names the guide pages use but no doc step registers. Group file, owned by one builder.
// Group C (8094, backend/group_c.py): each name is the agentId the page's own snippet uses.
import { HttpAgent } from "@ag-ui/client";
export const harnessAgents: Record<string, HttpAgent> = {
  "shared-state-read-write": new HttpAgent({ url: "http://localhost:8094/shared-state" }),
  "shared-state-streaming": new HttpAgent({ url: "http://localhost:8094/shared-state-streaming" }),
  "readonly-state-agent-context": new HttpAgent({ url: "http://localhost:8094/agent-readonly" }),
  "hitl-in-chat": new HttpAgent({ url: "http://localhost:8094/human-in-the-loop" }),
  subagents: new HttpAgent({ url: "http://localhost:8094/subagents" }),
};
