// HARNESS: agent names the guide pages use but no doc step registers. Group file, owned by one builder.
// Group B (generative UI), backend/group_b.py on 8093: one path per page id.
import { HttpAgent } from "@ag-ui/client";
export const harnessAgents: Record<string, HttpAgent> = {
  "gen-ui-tool-based": new HttpAgent({ url: "http://localhost:8093/tool-based" }), // generative-ui/tool-based
  "tool-rendering": new HttpAgent({ url: "http://localhost:8093/tool-rendering" }), // generative-ui/tool-rendering (per-tool)
  "tool-rendering-default-catchall": new HttpAgent({ url: "http://localhost:8093/tool-rendering" }), // same page, default catch-all
  "tool-rendering-custom-catchall": new HttpAgent({ url: "http://localhost:8093/tool-rendering" }), // same page, custom catch-all
};
