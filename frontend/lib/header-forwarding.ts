// HARNESS: the Code-tab routes import `extractForwardedHeaders` from "@/lib/header-forwarding",
// which no page shows. Minimal stand-in: forward the inbound `x-*` headers (the route comments say
// it forwards `x-aimock-context` and other `x-*` headers to the Python agent server).
import type { NextRequest } from "next/server";

export function extractForwardedHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (key.toLowerCase().startsWith("x-")) headers[key] = value;
  });
  return headers;
}
