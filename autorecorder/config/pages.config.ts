/**
 * One entry per tested doc page of https://docs.copilotkit.ai/google-antigravity, in the order
 * the clips are numbered. docUrl, demoUrl and the filename are derived from project.config.ts.
 *
 * Every demo route is served from the root of the app (demoSuffix is ''), because this harness
 * puts each doc page on its own route rather than a `/demo-chat` sub-page.
 *
 * Pages with no frontend to drive (State Rendering, Sub-Agents) are `docOnly`: their backends
 * were tested over AG-UI directly (see FINDINGS.md), and the clip is the doc read on camera.
 *
 * Not registered: premium/Intelligence pages and Threads (owner instruction, 2026-11-04).
 */
import { definePages } from '../core/types';
import { PAGES_A } from './pages-a';
import { PAGES_B } from './pages-b';
import { PAGES_C } from './pages-c';

/** Registered but not recorded, with the reason printed on every run. */
export const SKIP_RECORDING: Record<string, string> = {};

export const PAGES = definePages([
  {
    id: 'quickstart', name: 'Quickstart', videoName: 'Quickstart',
    docPath: 'quickstart', route: '',
    ideFile: 'frontend/VERSIONS.md', startLine: 1, endLine: 11,
    extraTabs: [
      { filePath: 'backend/main.py', startLine: 1, endLine: 16 },
      { filePath: 'frontend/app/api/copilotkit/route.ts', startLine: 1, endLine: 22 },
      { filePath: 'frontend/app/layout.tsx', startLine: 1, endLine: 15 },
      { filePath: 'frontend/app/page.tsx', startLine: 1, endLine: 11 },
    ],
    prompt: 'Tell me in one sentence what this app can do.',
  },
  ...PAGES_A,
  ...PAGES_B,
  ...PAGES_C,

  // --- Batch 2: the remaining runnable pages of the LangGraph JS track (37) ---
  // --- Rows from the team testing doc not covered above ---
  // --- Added 2026-11-08: Voice + Threads (team doc "Threads" row) ---
]);
