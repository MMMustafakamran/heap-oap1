/**
 * Group C pages (shared state, HITL, WebMCP, sub-agents) of docs.copilotkit.ai/openai-agents-python.
 * Page agents: backend/group_c.py on 8094, registered in frontend/harness/agents-c.ts.
 */
export const PAGES_C = [
  {
    id: 'shared-state', name: 'Shared State - read and write', videoName: 'SharedState',
    docPath: 'shared-state', route: 'shared-state-read-write',
    ideFile: 'backend/c_shared_state.py', startLine: 1, endLine: 60,
    extraTabs: [{ filePath: 'frontend/app/shared-state-read-write/page.tsx', startLine: 40, endLine: 70 }],
    prompt: 'Remember that I love hiking. Also, what is my name?',
  },
  {
    id: 'rendering-in-app', name: 'Shared State - Render agent state in your app', videoName: 'RenderAgentState',
    docPath: 'shared-state/rendering-in-app', route: 'shared-state/rendering-in-app/harness', // ✅: harness copy with agent="openai_agent" (minor note)
    ideFile: 'frontend/components/Canvas.tsx', startLine: 20, endLine: 54,
    extraTabs: [
      { filePath: 'frontend/app/shared-state/rendering-in-app/page.tsx', startLine: 1, endLine: 17 },
      { filePath: 'frontend/app/shared-state/rendering-in-app/harness/page.tsx', startLine: 1, endLine: 16, addedText: '<CopilotKit runtimeUrl="/api/copilotkit" agent="openai_agent">' },
    ],
    prompt: 'Hi! What can you see?',
  },
  {
    id: 'state-streaming', name: 'Shared State - State Streaming', videoName: 'StateStreaming',
    docPath: 'shared-state/streaming', route: 'shared-state-streaming',
    ideFile: 'backend/c_shared_state_streaming.py', startLine: 1, endLine: 72,
    extraTabs: [{ filePath: 'frontend/app/shared-state-streaming/page.tsx', startLine: 25, endLine: 43 }],
    prompt: 'Write a short poem about autumn leaves.',
    timeouts: { replyStartMs: 180000, replyStreamMs: 180000 },
  },
  {
    id: 'agent-readonly', name: 'Shared State - Agent Read-Only Context', videoName: 'AgentReadOnly',
    docPath: 'shared-state/agent-readonly', route: 'readonly-state-agent-context',
    ideFile: 'backend/c_app_context.py', startLine: 1, endLine: 22,
    extraTabs: [{ filePath: 'frontend/app/readonly-state-agent-context/page.tsx', startLine: 1, endLine: 74 }],
    prompt: 'What do you know about me from my context?',
  },
  {
    id: 'human-in-the-loop', name: 'Human in the Loop - useHumanInTheLoop', videoName: 'HumanInTheLoop',
    docPath: 'human-in-the-loop', route: 'hitl-in-chat',
    ideFile: 'frontend/app/hitl-in-chat/page.tsx', startLine: 51, endLine: 74,
    extraTabs: [{ filePath: 'backend/c_hitl.py', startLine: 1, endLine: 19 }],
    prompt: 'Please book an intro call with the sales team to discuss pricing.',
  },
  {
    id: 'governed-actions', name: 'Human in the Loop - Governed Actions', videoName: 'GovernedActions',
    docPath: 'human-in-the-loop/governed-actions', route: 'human-in-the-loop/governed-actions',
    ideFile: 'frontend/app/human-in-the-loop/governed-actions/governed.tsx', startLine: 20, endLine: 60,
    prompt: 'Send an email to bob@example.com saying the invoice is paid. Ask for approval first with approve_governed_action (verdict require_approval).',
  },
  {
    id: 'webmcp', name: 'Browser Agents - WebMCP', videoName: 'WebMCP',
    docPath: 'webmcp', route: 'webmcp',
    ideFile: 'frontend/app/webmcp/OrderSearch.tsx', startLine: 1, endLine: 35,
    prompt: 'Which of my orders are shipped?',
  },
  {
    id: 'subagents', name: 'Multi-Agent - Sub-Agents', videoName: 'SubAgents',
    docPath: 'multi-agent/subagents', route: 'subagents',
    ideFile: 'backend/c_subagents.py', startLine: 1, endLine: 99,
    prompt: 'Write a short blog post about why cats are great.',
    timeouts: { replyStartMs: 180000, replyStreamMs: 180000 },
  },
];
