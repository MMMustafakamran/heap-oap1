"use client";
// HARNESS: mounts the doc's OrderSearch inside the existing CopilotKit setup (layout.tsx, quickstart
// agent openai_agent), as the page says ("inside your existing CopilotKitProvider"), with a toggle
// to check that unmounting unregisters the WebMCP tool.
import { useState } from "react";
import { CopilotSidebar } from "@copilotkit/react-core/v2";
import { OrderSearch } from "./OrderSearch";

export default function WebMcpPage() {
  const [mounted, setMounted] = useState(true);
  return (
    <main style={{ padding: 24 }}>
      <button data-testid="toggle" onClick={() => setMounted((m) => !m)}>
        {mounted ? "Unmount OrderSearch" : "Mount OrderSearch"}
      </button>
      {mounted && <OrderSearch />}
      <CopilotSidebar />
    </main>
  );
}
