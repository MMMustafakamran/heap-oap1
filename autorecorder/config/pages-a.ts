/**
 * Group A pages (prebuilt components, look and feel, threads, frontend tools, ...) of
 * https://docs.copilotkit.ai/openai-agents-python. Spread into PAGES in pages.config.ts.
 * Backends: backend/group_a.py (port 8092); agent names: frontend/harness/agents-a.ts.
 */
export const PAGES_A = [
  {
    id: 'prebuilt-chat', name: 'Prebuilt Components - Chat', videoName: 'PrebuiltChat',
    docPath: 'prebuilt-components/chat', route: 'agentic-chat',
    ideFile: 'frontend/app/agentic-chat/page.tsx', startLine: 1, endLine: 24,
    extraTabs: [{ filePath: 'backend/a_harness_agent.py', startLine: 1, endLine: 9 }],
    prompt: 'Tell me a joke about developers.',
  },
  {
    id: 'prebuilt-sidebar', name: 'Prebuilt Components - Sidebar', videoName: 'PrebuiltSidebar',
    docPath: 'prebuilt-components/sidebar', route: 'prebuilt-sidebar',
    ideFile: 'frontend/app/prebuilt-sidebar/page.tsx', startLine: 1, endLine: 20,
    prompt: 'Say hi!',
  },
  {
    id: 'prebuilt-popup', name: 'Prebuilt Components - Popup', videoName: 'PrebuiltPopup',
    docPath: 'prebuilt-components/popup', route: 'prebuilt-popup',
    ideFile: 'frontend/app/prebuilt-popup/page.tsx', startLine: 1, endLine: 24,
    prompt: 'Say hi from the popup!',
  },
  {
    id: 'chat-controls', name: 'Prebuilt Components - Chat Controls', videoName: 'ChatControls',
    docPath: 'prebuilt-components/chat-controls', route: 'prebuilt-components/chat-controls/feedback',
    ideFile: 'frontend/app/prebuilt-components/chat-controls/feedback/page.tsx', startLine: 1, endLine: 32,
    extraTabs: [
      { filePath: 'frontend/app/prebuilt-components/chat-controls/open-state/page.tsx', startLine: 1, endLine: 19 },
      { filePath: 'frontend/app/prebuilt-components/chat-controls/programmatic/page.tsx', startLine: 1, endLine: 37 },
    ],
    prompt: 'Give me a link to the React docs and a short heading.',
  },
  {
    id: 'programmatic-control', name: 'Programmatic Control', videoName: 'ProgrammaticControl',
    docPath: 'programmatic-control', route: 'programmatic-control',
    ideFile: 'frontend/app/programmatic-control/AgentTrigger.tsx', startLine: 1, endLine: 39,
    extraTabs: [
      { filePath: 'backend/a_programmatic_control.py', startLine: 1, endLine: 27 },
      { filePath: 'frontend/app/programmatic-control/page.tsx', startLine: 1, endLine: 18 },
    ],
    prompt: 'Say hi in five words.',
  },
  {
    id: 'css', name: 'Custom Look and Feel - CSS', videoName: 'CSS',
    docPath: 'custom-look-and-feel/css', route: 'chat-customization-css',
    ideFile: 'frontend/app/chat-customization-css/page.tsx', startLine: 1, endLine: 30,
    prompt: 'Hi! In one sentence, what can you do?',
  },
  {
    id: 'slots', name: 'Custom Look and Feel - Slots', videoName: 'Slots',
    docPath: 'custom-look-and-feel/slots', route: 'chat-slots',
    ideFile: 'frontend/app/chat-slots/page.tsx', startLine: 20, endLine: 60,
    prompt: 'Write a short sonnet about AI.',
  },
  {
    id: 'markdown', name: 'Custom Look and Feel - Markdown', videoName: 'Markdown',
    docPath: 'custom-look-and-feel/markdown', route: 'custom-look-and-feel/markdown/tags',
    ideFile: 'frontend/app/custom-look-and-feel/markdown/tags/page.tsx', startLine: 1, endLine: 38,
    prompt: 'Reply with a markdown h2 heading and a link to https://react.dev',
  },
  {
    id: 'headless-ui', name: 'Custom Look and Feel - Headless UI', videoName: 'HeadlessUI',
    docPath: 'custom-look-and-feel/headless-ui', route: 'headless-simple',
    ideFile: 'frontend/app/headless-simple/chat.tsx', startLine: 1, endLine: 117,
    extraTabs: [{ filePath: 'frontend/app/headless-complete/page.tsx', startLine: 1, endLine: 49 }],
    prompt: 'What is the capital of France? One sentence.',
  },
  {
    id: 'reasoning-messages', name: 'Custom Look and Feel - Reasoning Messages', videoName: 'ReasoningMessages',
    docPath: 'custom-look-and-feel/reasoning-messages', route: 'reasoning-custom',
    ideFile: 'frontend/app/reasoning-custom/page.tsx', startLine: 12, endLine: 52,
    extraTabs: [{ filePath: 'backend/a_reasoning.py', startLine: 1, endLine: 12 }],
    prompt: 'What is 17 times 23? Think step by step.',
    timeouts: { replyStartMs: 180000, replyStreamMs: 180000 },
  },
  {
    id: 'reasoning', name: 'Generative UI - Reasoning (default)', videoName: 'Reasoning',
    docPath: 'generative-ui/reasoning', route: 'reasoning-default',
    ideFile: 'frontend/app/reasoning-default/page.tsx', startLine: 1, endLine: 37,
    extraTabs: [{ filePath: 'backend/a_reasoning.py', startLine: 1, endLine: 12 }],
    prompt: 'What is 17 times 23? Think step by step.',
    timeouts: { replyStartMs: 180000, replyStreamMs: 180000 },
  },
  {
    id: 'multimodal', name: 'Multimodal Attachments', videoName: 'Multimodal',
    docPath: 'multimodal-attachments', route: 'multimodal',
    ideFile: 'frontend/app/multimodal/page.tsx', startLine: 1, endLine: 18,
    prompt: 'What kinds of files can you read?',
  },
  {
    id: 'voice', name: 'Voice', videoName: 'Voice',
    docPath: 'voice', route: 'voice',
    ideFile: 'frontend/app/voice/page.tsx', startLine: 1, endLine: 22,
    extraTabs: [
      { filePath: 'frontend/app/api/copilotkit-voice/[[...slug]]/route.ts', startLine: 1, endLine: 41 },
      { filePath: 'frontend/app/voice/sample-audio-button.tsx', startLine: 1, endLine: 17 },
      { filePath: 'frontend/app/voice/voice-chat.tsx', startLine: 1, endLine: 20 },
    ],
    prompt: 'What is the weather in Tokyo?',
  },
  {
    id: 'prebuilt-components-copilot-threads-drawer', name: 'Prebuilt Components - Threads Drawer', videoName: 'ThreadsDrawer',
    docPath: 'prebuilt-components/copilot-threads-drawer', route: 'threads-drawer',
    ideFile: 'frontend/app/threads-drawer/page.tsx', startLine: 1, endLine: 22,
    prompt: 'Say hi in five words.',
  },
  {
    id: 'headless-threads', name: 'Headless Threads', videoName: 'HeadlessThreads',
    docPath: 'headless-threads', route: 'headless-threads',
    ideFile: 'frontend/app/api/copilotkit-threads/[[...slug]]/route.ts', startLine: 1, endLine: 49,
    ideAddedText: ['const agent = new HttpAgent({ url: "http://localhost:8092/threads" }); // HARNESS: group A backend', 'async function verifyAppSession(_request: Request) {'],
    extraTabs: [
      { filePath: 'frontend/app/headless-threads/ThreadSidebar.tsx', startLine: 1, endLine: 32 },
      { filePath: 'frontend/app/headless-threads/App.tsx', startLine: 1, endLine: 17 },
    ],
    prompt: 'Say hi in five words.',
  },
  {
    id: 'frontend-tools', name: 'App Control - Frontend Tools', videoName: 'FrontendTools',
    docPath: 'frontend-tools', route: 'frontend-tools',
    ideFile: 'backend/a_frontend_tools.py', startLine: 1, endLine: 31,
    extraTabs: [{ filePath: 'frontend/app/frontend-tools/page.tsx', startLine: 1, endLine: 51 }],
    prompt: 'Change the background to a sunset gradient.',
  },
  {
    id: 'agent-config', name: 'Agent Config', videoName: 'AgentConfig',
    docPath: 'agent-config', route: 'agent-config',
    ideFile: 'backend/a_agent_config.py', startLine: 1, endLine: 38,
    extraTabs: [{ filePath: 'frontend/app/agent-config/config-context-relay.tsx', startLine: 1, endLine: 25 }],
    prompt: 'Hi! Explain what an API is.',
  },
  {
    id: 'inspector', name: 'Debugging - Inspector', videoName: 'Inspector',
    docPath: 'inspector', route: 'inspector-disabled',
    ideFile: 'frontend/app/inspector-disabled/page.tsx', startLine: 1, endLine: 18,
    prompt: 'Say hello in five words.',
  },
];
