// HARNESS: agent names the guide pages use but no doc step registers. Group file, owned by one builder.
// Every page agent lives in backend/group_a.py (port 8092), one path per agent name.
import { HttpAgent } from "@ag-ui/client";

const A = "http://localhost:8092"; // HARNESS: group A backend (never 8000)
const at = (path: string) => new HttpAgent({ url: `${A}/${path}` });

export const harnessAgents: Record<string, HttpAgent> = {
  agentic_chat: at("agentic_chat"), // prebuilt-components/chat
  "prebuilt-sidebar": at("prebuilt-sidebar"), // prebuilt-components/sidebar
  "prebuilt-popup": at("prebuilt-popup"), // prebuilt-components/popup
  "chat-customization-css": at("chat-customization-css"), // custom-look-and-feel/css
  "chat-slots": at("chat-slots"), // custom-look-and-feel/slots
  "headless-simple": at("headless-simple"), // custom-look-and-feel/headless-ui
  "headless-complete": at("headless-complete"), // custom-look-and-feel/headless-ui
  "reasoning-default": at("reasoning-default"), // generative-ui/reasoning, reasoning-messages
  "reasoning-custom": at("reasoning-custom"), // generative-ui/reasoning, reasoning-messages
  "my-agent": at("multimodal-demo"), // multimodal-attachments
  frontend_tools: at("frontend_tools"), // frontend-tools
  programmatic_control: at("pc/programmatic_control"), // programmatic-control (doc's own server app)
};
