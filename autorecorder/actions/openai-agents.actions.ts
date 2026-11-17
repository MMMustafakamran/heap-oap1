import { join } from 'node:path';
import { type Locator, type Page } from 'playwright';
import { type PageActionHandler, type PageRecordConfig, type ActionContext } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { getGlobalCursorPos, humanGlide, idleNudge, sleep } from '../core/overlays/cursor';
import { glideClick, glideTo } from './glide-click';
import { runStandardAction } from '../core/actions';
import { closeNotepad, openNotepad, typeInNotepad } from '../core/overlays/notepad';
import { clickTaskbarApp, ensureOverlays, waitForHydration } from '../core/overlays/taskbar';
import { checkpoint, describe, logAction, mark, probeText, tracked } from '../core/timeline';
import { SELECTORS } from '../config/selectors.config';
import { registerDocEvidence } from '../core/doc-evidence';

import { humanizeNote } from '../core/overlays/note-style';
/** Probe: the last assistant message's text (null when there is none). Read-only. */
const lastReply = (page: Page) => () => probeText(page.locator(SELECTORS.assistantMessage).last());
/** Probe: the error banner's text once its details are open (null when there is no banner). */
const bannerText = (page: Page) => () =>
  probeText(page.getByText(/^(Show|Hide) Details$/).first().locator('xpath=ancestor::*[3]'));

/**
 * Finding clips end with the note pasted into Notepad (AUTORECORDER.md §2): doc says → happened →
 * why. Written plainly; humanizeNote() gives it the hurried style. OpenAI Agents (Python) + React,
 * numbers in comments are this repo's FINDINGS.md IDs. All level 1 (no team anchor for this framework).
 */
export const TYPING = { charDelayMs: 34, jitter: 0.65, thinkChance: 0.05 };

export interface DocEvidence {
  /** Text inside the element to point at (matched against pre/code/p/li/h2/h3). */
  text: string;
  /** Recorder-log note for this spot (not shown in the video). */
  caption: string;
  /** Tab to click first when the snippet sits behind a language tab. */
  clickTab?: string;
}

export const FINDING_NOTES: Record<string, string> = {
  // #1
  'rendering-in-app': [
    'doc says useAgent with no agentid means the default agent and the canvas shows the agent state',
    'page crashes instead, useagent agent default not found after runtime sync',
    'known agents is only openai_agent from the quickstart',
    'nothing on the page registers a default agent or says to pass agentid',
    'harness copy with agent=openai_agent on the provider works',
  ].join('\n'),
  // #2
  'headless-threads': [
    'headless threads page says use this runtime and the sidebar lists ur threads',
    'chat never replies,agent openai_agent not found after runtime sync, known agents default',
    'the server.ts on the page registers the agent as default',
    'but the quickstart provider targets openai_agent so they never match',
    'also agent and verifyappsession in server.ts are never defined,had to add them',
  ].join('\n'),
  // #3
  'components-state-actions': [
    'doc says the agent renders product cards with an add to cart button that fills the cart',
    'asked for 2 product cards, assistant message just stays empty',
    'no productcard renders and the cart never fills,3 runs same',
    'shopui is split over a few blocks on the page,merged it into one catalog',
  ].join('\n'),
  // #4
  a2ui: [
    'a2ui page says the agent emits a2ui operations and the surface renders',
    'got a red box instead,a2ui render error cannot read properties of undefined reading map',
    'the agent code on the page is from copilotkit import a2ui,thats the copilotkit python sdk not openai agents',
    'no openai agents agent anywhere so i wrote one myself',
  ].join('\n'),
  // #5
  'a2ui-dynamic': [
    'dynamic schema page says the generated dashboard renders cards as data comes in',
    'no dashboard,chat shows a2ui render error cannot read properties of undefined reading map',
    'the agent.py on the page is langgraph,ag_ui_langgraph get_a2ui_tools and langchain_openai',
    'and my_other_tool is never defined,nothing for openai agents so agent is my own',
  ].join('\n'),
  // #6
  'a2ui-fixed': [
    'fixed schema page says display_flight fills the flight card with origin destination airline price',
    'card and book flight button show up but every field is empty',
    'page defines display_flight but never builds an agent that uses it',
    'and a2ui_schemas/flight_schema.json is never shown,copied it from the showcase',
  ].join('\n'),
  // #7 (⚠️)
  hashbrown: [
    'hashbrown page says the agent sends one json object and the dashboard streams in',
    'dashboard does render here,but only on an agent i wrote myself',
    'page has no openai agents agent at all,just the example json',
    'so u have to guess the agent and its prompt',
  ].join('\n'),
};

/** Where each finding shows on the RENDERED doc page (checked headless, 2026-11-17). */
export const FINDING_EVIDENCE: Record<string, DocEvidence[]> = {
  'rendering-in-app': [
    { text: 'No agentId means the "default" agent', caption: 'useAgent() with no id wants "default"; the quickstart registers only openai_agent' },
  ],
  'headless-threads': [
    { text: 'default: agent,', caption: 'server.ts registers "default"; the quickstart provider targets openai_agent' },
  ],
  'components-state-actions': [
    { text: '"Add to cart" must add to the cart, with no message to the agent.', caption: 'No ProductCard renders, cart stays empty' },
  ],
  a2ui: [
    { text: 'from copilotkit import a2ui', caption: 'CopilotKit Python SDK, not OpenAI Agents' },
  ],
  'a2ui-dynamic': [
    { text: 'from ag_ui_langgraph import get_a2ui_tools', caption: 'LangGraph agent code on the OpenAI Agents page' },
  ],
  'a2ui-fixed': [
    { text: 'def display_flight(origin: str, destination: str, airline: str, price: str) -> dict:', caption: 'Tool defined, but no Agent is built with it' },
    { text: 'with open(_SCHEMAS_DIR / "flight_schema.json", encoding="utf-8") as _f:', caption: 'flight_schema.json is never shown' },
  ],
  hashbrown: [
    { text: 'The agent sends one JSON object as the assistant message', caption: 'Only the output format, no OpenAI Agents agent' },
  ],
};

/**
 * A match that is in the DOM but hidden usually sits in an inactive tab panel (React/Angular,
 * Python/TypeScript). Click the tab that controls that panel, the way a reader would, so the
 * highlight never silently skips (zero-length evidence segment). Returns true if a tab was clicked.
 */
async function revealHiddenMatch(page: Page, text: string): Promise<boolean> {
  const tabIndex = await page
    .evaluate((needle) => {
      const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
      for (const panel of panels) {
        if (!(panel.textContent ?? '').includes(needle)) continue;
        const r = (panel as HTMLElement).getBoundingClientRect();
        if (r.width > 0 && r.height > 0) continue; // already visible
        const id = panel.getAttribute('id');
        const labelled = panel.getAttribute('aria-labelledby');
        const tab =
          (id && document.querySelector(`[role="tab"][aria-controls="${CSS.escape(id)}"]`)) ||
          (labelled && document.getElementById(labelled));
        if (tab) return Array.from(document.querySelectorAll('[role="tab"]')).indexOf(tab);
      }
      return -1;
    }, text)
    .catch(() => -1);
  if (tabIndex < 0) return false;
  const tab = page.locator('[role="tab"]').nth(tabIndex);
  if (!(await tab.isVisible().catch(() => false))) return false;
  console.log(`   🗂️ Evidence is behind a tab: clicking "${(await tab.innerText().catch(() => '')).trim()}"`);
  await wheelIntoView(page, tab);
  await glideClick(page, tab);
  await sleep(1200);
  return true;
}

async function findEvidence(page: Page, text: string) {
  // First visible match: the snippet a finding cites is the first place the doc shows it
  // (later blocks often repeat the line, e.g. agentId "starterAgent" on Interrupt Flow).
  for (const sel of ['pre', 'code', 'p', 'li', 'h2', 'h3']) {
    const all = page.locator(sel, { hasText: text });
    const n = await all.count();
    for (let i = 0; i < n; i++) {
      if (await all.nth(i).isVisible().catch(() => false)) return all.nth(i);
    }
  }
  // Callouts and banners are plain divs: fall back to the innermost element with the text.
  const any = page.getByText(text, { exact: false }).first();
  if ((await any.count()) > 0 && (await any.isVisible().catch(() => false))) return any;
  return null;
}

/** Go back to the doc page and point at each defect, one by one. */
export async function showDocEvidence(
  page: Page,
  config: PageRecordConfig,
  items: DocEvidence[] | undefined = FINDING_EVIDENCE[config.id],
): Promise<void> {
  if (!items?.length) return;
  console.log(`   🔎 Showing the finding on the doc page (${items.length} spot(s))...`);
  await clickTaskbarApp(page, 'chrome').catch(() => {});
  // The demo's verdict is settled before this point. docs.copilotkit.ai can throw its own React
  // hydration error (#418), and the take's error collectors would blame the app for it, so they
  // are detached before the doc revisit (Antigravity FINDINGS.md #48).
  page.removeAllListeners('pageerror');
  page.removeAllListeners('console');
  // A doc-only take is already on the doc page: scroll back up instead of reloading it.
  if (page.url().split('#')[0].replace(/\/$/, '') !== config.docUrl.replace(/\/$/, '')) {
    await page.goto(config.docUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await ensureOverlays(page, 'chrome');
    await waitForHydration(page, 15000).catch(() => false);
  }
  await sleep(1500);

  for (const item of items) {
    mark('evidence', item.text);
    if (item.clickTab) {
      const tab = page.getByRole('tab', { name: item.clickTab, exact: true }).first();
      if (await tab.isVisible().catch(() => false)) {
        await wheelIntoView(page, tab);
        await glideClick(page, tab);
        await sleep(1200);
      }
    }
    let target = await findEvidence(page, item.text);
    if (!target && (await revealHiddenMatch(page, item.text))) target = await findEvidence(page, item.text);
    void checkpoint('evidence', `doc shows "${item.text}"`, () => (target ? probeText(target) : null));
    if (!target) {
      // Loud on purpose: a missing highlight means the doc text changed (or the evidence is wrong).
      console.error(`   ❌ EVIDENCE NOT FOUND on the doc page (no highlight in the clip): "${item.text}"`);
      continue;
    }
    console.log(`   👉 ${item.caption}`);
    await wheelIntoView(page, target, item.text);
    await dragSelect(page, target, item.text);
    // Rest on the highlighted text the way a person pauses while pointing something out.
    for (let i = 0; i < 4; i++) {
      await sleep(900);
      await idleNudge(page);
    }
  }
}

/**
 * Where the wheel scrolls the doc page itself. docs.copilotkit.ai scrolls a full-height <div>, not
 * the window; code boxes (max-h 600px) and the sidebars have their own scrollbars and would eat the
 * wheel, and the sticky header scrolls nothing. Probe a few points over the article and keep the
 * first whose nearest scrolling ancestor is the page scroller (clientHeight >= 70% of the window and
 * containing the article: the sidebar is tall too).
 */
async function pageWheelPoint(page: Page): Promise<{ x: number; y: number } | null> {
  return page
    .evaluate(() => {
      const art = document.querySelector('article') ?? document.querySelector('main');
      const r = art ? art.getBoundingClientRect() : { left: 300, right: window.innerWidth - 300 };
      const xs = [r.left + 6, r.left + 18, r.right - 8, (r.left + r.right) / 2];
      const h = window.innerHeight;
      const ys = [h * 0.5, h * 0.4, h * 0.62, h * 0.3, h * 0.72];
      const pts: { x: number; y: number }[] = [];
      for (const y of ys) for (const x of xs) pts.push({ x, y });
      for (const p of pts) {
        let el = document.elementFromPoint(p.x, p.y) as HTMLElement | null;
        for (; el && el !== document.body; el = el.parentElement) {
          const oy = getComputedStyle(el).overflowY;
          if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 4) break;
        }
        if (el && el !== document.body && el.clientHeight >= h * 0.7 && (!art || el.contains(art))) return p;
      }
      return null;
    })
    .catch(() => null);
}

/** The text's centre Y, and the rect of its own (non-page) scroll box if it sits in one. */
async function scrollInfo(target: Locator, text?: string): Promise<{ textY: number | null; inner: { top: number; bottom: number; left: number; right: number } | null }> {
  const textY = text ? await textCentreY(target, text) : null;
  const inner = await target
    .evaluate((el) => {
      const h = window.innerHeight;
      for (let e: HTMLElement | null = el as HTMLElement; e && e !== document.body; e = e.parentElement) {
        const oy = getComputedStyle(e).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && e.scrollHeight > e.clientHeight + 4) {
          if (e.clientHeight >= h * 0.7) return null; // the page scroller
          const r = e.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
        }
      }
      return null;
    })
    .catch(() => null);
  return { textY, inner };
}

async function wheelBurst(page: Page, delta: number): Promise<void> {
  const notches = Math.max(2, Math.round(Math.abs(delta) / 100));
  for (let n = 0; n < notches; n++) {
    await page.mouse.wheel(0, delta / notches);
    await sleep(35 + Math.random() * 45);
  }
  await sleep(250 + Math.random() * 400);
}

/**
 * Scroll the way a person does (mouse-wheel bursts, no programmatic jump): wheel the page from a
 * point that scrolls the page until the text is mid-screen; if the text sits in a code box with its
 * own scrollbar, wheel over that box until the line is inside it. Stops when the page can't move
 * further (target near the top/bottom), instead of looping on the spot.
 */
async function wheelIntoView(page: Page, target: Locator, text?: string): Promise<void> {
  const vh = page.viewportSize()?.height ?? 900;
  const mid = vh * 0.5;
  let lastPageY: number | null = null;
  for (let i = 0; i < 60; i++) {
    const box = await target.boundingBox().catch(() => null);
    if (!box) break;
    const { textY, inner } = await scrollInfo(target, text);
    const ty = textY ?? box.y + Math.min(box.height, 120) / 2;
    // 1. The box is on screen but the line is scrolled away inside it: wheel over the box.
    if (inner && inner.top > 60 && inner.bottom < vh - 30 && (ty < inner.top + 24 || ty > inner.bottom - 24)) {
      const cx = inner.left + Math.min(220, (inner.right - inner.left) / 2);
      const cy = (inner.top + inner.bottom) / 2;
      const { x, y } = getGlobalCursorPos();
      if (Math.abs(x - cx) > 40 || Math.abs(y - cy) > 40) await humanGlide(page, cx, cy);
      const want = ty - cy;
      await wheelBurst(page, Math.sign(want) * Math.min(Math.abs(want), 420));
      continue;
    }
    // 2. Otherwise move the page so the line (or the box) sits mid-screen.
    const anchor = inner && (ty < inner.top || ty > inner.bottom) ? (inner.top + inner.bottom) / 2 : ty;
    const off = anchor - mid;
    if (Math.abs(off) < 140) break;
    // Page already at its top or bottom: the line can't get closer to the middle, stop wheeling.
    if (lastPageY !== null && Math.abs(anchor - lastPageY) < 4 && anchor > 70 && anchor < vh - 30) break;
    lastPageY = anchor;
    // No page scroller under the article (e.g. the demo's chat): wheel over the target, kept on screen.
    const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
    const pt = (await pageWheelPoint(page)) ?? {
      x: clamp(box.x + Math.min(box.width / 2, 260), 120, 1700),
      y: clamp(Math.min(Math.max(box.y + 40, 160), Math.min(box.y + box.height - 20, 900)), 160, 900),
    };
    const { x, y } = getGlobalCursorPos();
    if (Math.abs(x - pt.x) > 60 || Math.abs(y - pt.y) > 60) await humanGlide(page, pt.x, pt.y);
    await wheelBurst(page, Math.sign(off) * Math.min(Math.abs(off), 300 + Math.random() * 200));
  }
  await sleep(600);
  logAction('scroll', text ?? describe(target));
}

interface TextSpan { sx: number; sy: number; ex: number; ey: number }

/**
 * Viewport position of `text` inside `target`: first and last character. Code blocks can hold
 * more than one copy of the code (one per colour theme, the others hidden), so every match is
 * tried and the first one that is actually rendered wins.
 */
async function locateText(target: Locator, text: string): Promise<TextSpan | null> {
  // Plain loops only: tsx wraps nested named functions in a `__name` helper that does not exist
  // inside the page, which made this evaluate throw and silently fall back.
  return target
    .evaluate((el, needle) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let full = '';
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        nodes.push(n as Text);
        full += (n as Text).data;
      }
      // Prose wraps in the source (a newline + indent where the needle has one space), so any
      // run of whitespace in the needle matches any run of whitespace on the page.
      const pattern = new RegExp(
        needle.split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+'),
        'g',
      );
      for (let m = pattern.exec(full); m; m = pattern.exec(full)) {
        const at = m.index;
        pattern.lastIndex = at + 1;
        const rects: DOMRect[] = [];
        for (const pos of [at, at + m[0].length - 1]) {
          let acc = 0;
          for (const node of nodes) {
            if (pos < acc + node.data.length) {
              const r = document.createRange();
              r.setStart(node, pos - acc);
              r.setEnd(node, Math.min(pos - acc + 1, node.data.length));
              const b = r.getBoundingClientRect();
              if (b.width > 0 && b.height > 0) rects.push(b);
              break;
            }
            acc += node.data.length;
          }
        }
        if (rects.length === 2) {
          const [s, e] = rects;
          return { sx: s.left + 1, sy: s.top + s.height / 2, ex: e.right - 1, ey: e.top + e.height / 2 };
        }
      }
      return null;
    }, text)
    .catch((err) => {
      console.warn(`   ⚠️ locateText failed: ${String(err).slice(0, 160)}`);
      return null;
    });
}

async function textCentreY(target: Locator, text: string): Promise<number | null> {
  return (await locateText(target, text))?.sy ?? null;
}

/**
 * Highlight `text` inside `target` with a real mouse drag (press at its first character,
 * drag to its last, release), so the browser's own text selection marks the faulty snippet.
 * Skipped (with a warning) when the exact text is not on screen.
 */
async function dragSelect(page: Page, target: Locator, text: string): Promise<void> {
  const pts = await locateText(target, text);
  const vh = page.viewportSize()?.height ?? 900;
  // Never drag at a guess: a miss selects whatever is under the cursor (the docs banner, prose).
  if (!pts || pts.sy < 70 || pts.ey > vh - 30) {
    console.warn(`   ⚠️ Text not on screen, not selecting: "${text}"`);
    return;
  }
  await humanGlide(page, pts.sx - 3, pts.sy);
  await sleep(300 + Math.random() * 300);
  await page.mouse.down();
  await humanGlide(page, pts.ex + 2, pts.ey, 34);
  await sleep(120);
  await page.mouse.up();
  logAction('select-text', text);
}


/** Level 2 pages (QA-RULES §8a): none here, no team anchor exists for this framework yet. */
export const KNOWN_ISSUE = new Set<string>([]);

/** Doc step: highlight each page's faulty doc text before the IDE (AUTORECORDER §2). */
registerDocEvidence(FINDING_EVIDENCE, { skip: KNOWN_ISSUE });

/** Type a page's finding into Notepad at the end of its take. */
export async function writeFinding(page: Page, id: string, config?: PageRecordConfig): Promise<void> {
  const body = FINDING_NOTES[id];
  if (!body) return;
  if (KNOWN_ISSUE.has(id)) {
    if (config?.docOnly) await showDocEvidence(page, config).catch((e) => console.warn(`   ⚠️ Doc evidence step failed: ${String(e).slice(0, 120)}`));
    return;
  }
  // The doc highlight now runs in the doc step, before the IDE (core/doc-evidence, registered below).
  mark('notepad');
  await openNotepad(page, `finding-${id}.txt`);
  await typeInNotepad(page, humanizeNote(body), TYPING);
  await closeNotepad(page, 4000);
  mark('notepad-closed');
}

/** Wrap any page action so the finding (doc evidence + Notepad) always closes the take. */
function withFinding(handler: PageActionHandler): PageActionHandler {
  return async (page, config, root, ctx) => {
    try {
      await handler(page, config, root, ctx);
    } finally {
      // A failed take still gets its explanation.
      await writeFinding(page, config.id, config);
    }
  };
}

/**
 * Prompt, then whichever comes first: CopilotKit's run-error banner (open its details so the
 * error is readable and stop there, as a person would) or a normal reply.
 */
const promptOrError: PageActionHandler = async (page, config, root, ctx) => {
  const input = page.locator('textarea').first();
  if (!(await input.isVisible().catch(() => false))) {
    // No chat on the page (e.g. the page crashed): let the standard take record and report it.
    await runStandardAction(page, config, root, ctx);
    return;
  }
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const errored = await Promise.race([
    errorBanner(page).waitFor({ state: 'visible', timeout: 180000 }).then(() => true),
    waitForAgentResponseCompletion(page, 2500, msgCount).then(() => false),
  ]).catch(() => false);
  if (errored) {
    mark('error');
    await showErrorBanner(page);
    void checkpoint('error', 'run error details visible', bannerText(page));
    ctx.fail('The run failed with an error banner (see the details shown in the clip).');
    return;
  }
  void checkpoint('reply', 'agent reply rendered', lastReply(page));
  await sleep(2500);
};

/** The prompt take (stopping at an error banner), then the finding in Notepad. */
export const runStandardWithFinding: PageActionHandler = withFinding(promptOrError);
/** Same take without the finding tail, for ✅ pages (AUTORECORDER.md §3). */
export const runPromptOrError: PageActionHandler = promptOrError;
/**
 * CopilotKit's run-error banner sits at the bottom edge, partly under the recorder's taskbar.
 * Open its details so the viewer can read the actual error (presentation only, app untouched).
 */
function errorBanner(page: Page) {
  return page.getByText('Show Details', { exact: true }).first();
}

async function showErrorBanner(page: Page): Promise<void> {
  const details = errorBanner(page);
  if (await details.isVisible().catch(() => false)) {
    await glideClick(page, details);
    await sleep(5000);
  } else {
    await sleep(3000);
  }
}

/**
 * Send by keyboard (click the box, type, Enter) instead of the recorder's click-the-send-button
 * path. On these full-height chat pages the recorder's send never reached the runtime (no user
 * message appeared), while type + Enter works on the same page. Then wait for the reply as usual.
 */
const keyboardSend: PageActionHandler = async (page, config, _root, ctx) => {
  const { getAssistantMessageCount } = await import('../core/actions');
  const input = page.locator('textarea:visible, [contenteditable="true"]:visible').first();
  await input.waitFor({ state: 'visible', timeout: 60000 });
  await sleep(2000);
  const before = await getAssistantMessageCount(page);
  const surfacesBefore = await page.evaluate(() => document.querySelectorAll('[data-generative-ui-surface], .a2ui-surface').length).catch(() => 0);
  await glideClick(page, input);
  await sleep(300);
  await page.keyboard.type(config.prompt, { delay: 45 });
  logAction('type', describe(input), 'ok', { text: config.prompt });
  await sleep(400);
  if (!(await input.inputValue().catch(() => config.prompt)).trim()) await input.fill(config.prompt);
  await page.keyboard.press('Enter');
  logAction('key', 'Enter');
  const errored = await Promise.race([
    errorBanner(page).waitFor({ state: 'visible', timeout: 180000 }).then(() => true),
    waitForAgentResponseCompletion(page, 2500, before).then(() => false),
    // Generative-UI pages often answer with a surface only (no assistant text), which the
    // text-based reply check never sees. A new surface counts as the reply.
    page
      .waitForFunction(
        (n) => document.querySelectorAll('[data-generative-ui-surface], .a2ui-surface').length > n,
        surfacesBefore,
        { timeout: 180000, polling: 500 },
      )
      .then(async () => { await sleep(6000); return false; }),
  ]).catch((e) => {
    ctx.fail(`No reply after a keyboard send: ${String(e).slice(0, 160)}`);
    return null;
  });
  if (errored) {
    mark('error');
    await showErrorBanner(page);
    void checkpoint('error', 'run error details visible', bannerText(page));
    ctx.fail('The run failed with an error banner (see the details shown in the clip).');
    return;
  }
  // A reply is either assistant text or a new generative-UI surface; record both.
  void checkpoint('reply', 'agent reply rendered', lastReply(page), { ok: () => errored === false });
  void checkpoint('surface', 'generative-UI surface rendered (if this page renders one)', async () => {
    const n = await page.evaluate(() => document.querySelectorAll('[data-generative-ui-surface], .a2ui-surface').length).catch(() => 0);
    return n > surfacesBefore ? `${n - surfacesBefore} new surface(s)` : null;
  });
  await sleep(2500);
};
export const runKeyboardSendAction: PageActionHandler = keyboardSend;
// ---------------------------------------------------------------------------------------------
// Scripted takes: pages whose feature only shows after an interaction (change a setting, attach a
// file, toggle state) or whose doc page must be shown failing before the harness route. Added
// after the clip review of 2026-11-07 found clips that never exercised the feature.
// ---------------------------------------------------------------------------------------------
type Step =
  | { goto: string; holdMs?: number }
  | { click: string; holdMs?: number; optional?: boolean }
  | { select: number; value: string }
  | { prompt: string }
  | { waitText: string; timeoutMs?: number }
  | { waitGone: string; timeoutMs?: number }
  | { press: string; holdMs?: number }
  | { attach: string; holdMs?: number }
  | { holdMs: number };

const BASE = process.env.FRONTEND_URL || 'http://localhost:3090';

function scripted(steps: Step[]): PageActionHandler {
  return async (page, config, root, ctx) => {
    for (const s of steps) {
      if ('goto' in s) {
        // A second route is a new demo segment for narration (demo#2, demo#3 ...).
        mark('demo', s.goto);
        await page.goto(BASE + s.goto, { waitUntil: 'load' }).catch(() => {});
        await sleep(s.holdMs ?? 4000);
      } else if ('click' in s) {
        const el = page.getByText(s.click, { exact: false }).first();
        // optional: a control that only shows sometimes (the dev inspector's hide button); absent = skip, not a 60 s stall.
        const seen = await el.waitFor({ state: 'visible', timeout: s.optional ? 6000 : 60000 }).then(() => true).catch((e) => {
          if (s.optional) return false;
          throw e;
        });
        if (!seen) continue;
        await glideClick(page, el);
        await sleep(s.holdMs ?? 1500);
      } else if ('select' in s) {
        const el = page.locator('select').nth(s.select);
        await glideTo(page, el, 600);
        await tracked('select', describe(el), () => el.selectOption(s.value), { value: s.value });
        await sleep(1200);
      } else if ('press' in s) {
        // Send what is already in the composer (e.g. text the page itself inserted).
        await page.locator('textarea').first().focus().catch(() => {});
        await tracked('press', s.press, () => page.keyboard.press(s.press));
        await sleep(s.holdMs ?? 1500);
      } else if ('attach' in s) {
        // The doc's own path: the chat's + button -> "Add attachments" -> pick a file (repo-relative).
        mark('click', 'attach');
        await glideClick(page, page.locator('[data-testid="copilot-add-menu-button"]').first());
        await sleep(900);
        const chooser = page.waitForEvent('filechooser', { timeout: 15000 });
        await glideClick(page, page.getByRole('menuitem', { name: /add attachments/i }).first());
        const fc = await chooser;
        await tracked('attach', s.attach, () => fc.setFiles(join(root, s.attach)));
        const chip = await page.locator('[data-testid="copilot-attachment-queue"] img').first()
          .waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false);
        void checkpoint('attach', 'attachment preview above the input', async () => (chip ? s.attach : null));
        if (!chip) ctx.fail(`The attachment ${s.attach} never showed in the input.`);
        await sleep(s.holdMs ?? 2500);
      } else if ('prompt' in s) {
        await keyboardSend(page, { ...config, prompt: s.prompt }, root, ctx);
      } else if ('waitText' in s) {
        const ok = await page.getByText(s.waitText, { exact: false }).first()
          .waitFor({ state: 'visible', timeout: s.timeoutMs ?? 120000 }).then(() => true).catch(() => false);
        void checkpoint('text', `"${s.waitText}" visible`, () => probeText(page.getByText(s.waitText, { exact: false })));
        if (!ok) ctx.fail(`Expected "${s.waitText}" on screen; it never appeared.`);
        await sleep(2500);
      } else if ('waitGone' in s) {
        await page.getByText(s.waitGone, { exact: false }).first()
          .waitFor({ state: 'hidden', timeout: s.timeoutMs ?? 240000 }).catch(() => ctx.fail(`"${s.waitGone}" never finished.`));
        const gone = s.waitGone;
        void checkpoint('done', `"${gone}" finished (no longer visible)`, async () =>
          !(await page.getByText(gone, { exact: false }).first().isVisible().catch(() => false)));
        await sleep(4000);
      } else {
        await sleep(s.holdMs);
      }
    }
  };
}
export const SCRIPTED: Record<string, PageActionHandler> = {
  'agent-config': scripted([
    { select: 0, value: 'enthusiastic' },
    { select: 1, value: 'beginner' },
    { select: 2, value: 'detailed' },
    { prompt: 'Explain what an API is.' },
  ]),
  // The doc's attach path (+ button, pick a file), not the showcase's "Try with sample image"
  // button (CI 2026-11-09: that click attached nothing). 5 of 5 probes replied about the image.
  multimodal: scripted([
    { attach: 'frontend/public/demo-files/sample.png', holdMs: 2500 },
    { prompt: 'What is in this image?' },
  ]),
};

const SURFACE_SEL = '[data-generative-ui-surface], .a2ui-surface';
const surfaceCount = (page: Page) =>
  page.evaluate((sel) => document.querySelectorAll(sel).length, SURFACE_SEL).catch(() => 0);

/** Send the prompt, wait for the run to end, then check that generated UI rendered. */
const genuiTake: PageActionHandler = async (page, config, _root, ctx) => {
  const input = page.locator('textarea:visible, [contenteditable="true"]:visible').first();
  await input.waitFor({ state: 'visible', timeout: 60000 });
  await sleep(2000);
  const before = await surfaceCount(page);
  const seenWarn: { text: string | null } = { text: null };
  page.on('console', (m) => {
    const text = m.text();
    if (seenWarn.text === null && /render_ui/.test(text) && /rendered nothing/.test(text)) seenWarn.text = text;
  });
  // The run is one streamed POST to the runtime (/api/copilotkit/agent/<id>/run); it finishes
  // when the agent run ends, whatever the agent sent.
  const runDone = page
    .waitForEvent('requestfinished', { predicate: (r) => /\/agent\/[^/]+\/run/.test(r.url()), timeout: 180000 })
    .then(() => true)
    .catch(() => false);
  await glideClick(page, input);
  await sleep(300);
  await page.keyboard.type(config.prompt, { delay: 45 });
  logAction('type', describe(input), 'ok', { text: config.prompt });
  await sleep(400);
  await page.keyboard.press('Enter');
  logAction('key', 'Enter');
  const appeared = page
    .waitForFunction(
      ({ sel, n }) => document.querySelectorAll(sel).length > n,
      { sel: SURFACE_SEL, n: before },
      { timeout: 180000, polling: 500 },
    )
    .then(() => 'surface' as const)
    .catch(() => null);
  const first = await Promise.race([
    appeared,
    runDone.then(() => 'done' as const),
    errorBanner(page).waitFor({ state: 'visible', timeout: 180000 }).then(() => 'error' as const).catch(() => null),
  ]);
  if (first === 'error') {
    mark('error');
    await showErrorBanner(page);
    void checkpoint('error', 'run error details visible', bannerText(page));
    ctx.fail('The run failed with an error banner (see the details shown in the clip).');
    return;
  }
  // The run ended: give the UI time to finish rendering, as a person would wait.
  if (first !== 'surface') await Promise.race([appeared, sleep(10000)]);
  await sleep(first === 'surface' ? 6000 : 1500);
  const after = await surfaceCount(page);
  const reply = await lastReply(page)();
  void checkpoint('reply', 'agent reply text', async () => reply);
  void checkpoint('surface', 'generative-UI surface rendered', async () =>
    after > before ? `${after - before} new surface(s)` : null,
  );
  if (after > before) {
    ctx.warn('A generative-UI surface rendered in this take: the known failure did not reproduce.');
    await sleep(2500);
    return;
  }
  // Rest on the result so the viewer can see that nothing rendered. 'error' starts the segment the
  // narration's outcome line hangs on, so the voice never states the result before it shows.
  mark('error');
  const last = page.locator(SELECTORS.assistantMessage).last();
  if (await last.isVisible().catch(() => false)) await glideTo(page, last, 2500);
  else await sleep(2500);
  await idleNudge(page);
  await sleep(5500); // the error line (up to ~7.5 s of audio) must end before the failure terminal
  const seen = seenWarn.text;
  ctx.fail(
    seen
      ? `Nothing rendered. Browser console: ${seen.slice(0, 220)}`
      : `Nothing rendered: no generative-UI component after the run finished (reply: ${JSON.stringify((reply ?? '').slice(0, 120))}).`,
  );
};

/** Like withFinding, but the finding is typed only when the take actually failed. */
function withFindingOnFailure(handler: PageActionHandler): PageActionHandler {
  return async (page, config, root, ctx) => {
    let failed = false;
    const tracking: ActionContext = {
      ...ctx,
      fail: (m: string) => {
        failed = true;
        ctx.fail(m);
      },
    };
    try {
      await handler(page, config, root, tracking);
    } catch (e) {
      failed = true;
      throw e;
    } finally {
      if (failed) await writeFinding(page, config.id, config);
    }
  };
}
export const runGenuiFindingAction = withFindingOnFailure(genuiTake);
/** True for the POST that carries an agent run (REST `/agent/<id>/run` or the single endpoint). */
function isRunRequest(r: import('playwright').Request): boolean {
  if (r.method() !== 'POST' || !/copilotkit/.test(r.url())) return false;
  if (/\/agent\/[^/]+\/run/.test(r.url())) return true;
  return /"method"\s*:\s*"agent\/run"/.test(r.postData() ?? '');
}

/**
 * Type the prompt and send it with Enter; resolves when the agent run's POST finishes.
 * Enter is ignored while the chat is still connecting to its runtime (the prompt stays in the
 * box), so it is pressed again, the way a person would, until the box clears.
 */
async function sendAndAwaitRun(page: Page, prompt: string, timeoutMs: number): Promise<boolean> {
  const input = page.locator('textarea:visible, [contenteditable="true"]:visible').first();
  await input.waitFor({ state: 'visible', timeout: 60000 });
  await sleep(2000);
  const runDone = page
    .waitForEvent('requestfinished', { predicate: isRunRequest, timeout: timeoutMs })
    .then(() => true)
    .catch(() => false);
  await glideClick(page, input);
  await sleep(300);
  await page.keyboard.type(prompt, { delay: 45 });
  logAction('type', describe(input), 'ok', { text: prompt });
  await sleep(400);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Enter');
    logAction('key', 'Enter');
    await sleep(2500);
    const left = (await input.inputValue().catch(() => '')).trim();
    if (!left) break;
    await input.focus().catch(() => {});
    await sleep(1500);
  }
  return runDone;
}

/** Wait until the page text stops changing for `quietMs` (max `maxMs`). */
async function waitForQuiet(page: Page, quietMs: number, maxMs: number): Promise<void> {
  const start = Date.now();
  let last = '';
  let since = Date.now();
  while (Date.now() - start < maxMs) {
    const now = await page.evaluate(() => document.body.innerText).catch(() => '');
    if (now !== last) {
      last = now;
      since = Date.now();
    } else if (Date.now() - since >= quietMs) return;
    await sleep(1000);
  }
}
// #34: on 1.85.0 the renderer fails with "A2UI render error: Cannot read properties of undefined
// (reading 'map')" (CI 2026-11-09); older runs showed "Unable to display Card ...". Either one is
// the failure, and either one starts the 'error' segment the narration hangs on.
const UNABLE_RE = /Unable to display|A2UI render error/i;

/** Dynamic Schema A2UI: the generated surface must render without A2UI render errors. */
const a2uiDynamicTake: PageActionHandler = async (page, config, _root, ctx) => {
  const done = await sendAndAwaitRun(page, config.prompt, 180000);
  // The surface finishes rendering after the stream closes: wait until the chat stops changing.
  await waitForQuiet(page, 8000, 60000);
  const errs = page.getByText(UNABLE_RE);
  const n = await errs.count();
  const quotes: string[] = [];
  for (let i = 0; i < n && quotes.length < 4; i++) {
    const t = ((await errs.nth(i).innerText().catch(() => '')) || '').trim();
    if (t && !quotes.includes(t)) quotes.push(t.split('\n')[0]);
  }
  void checkpoint('run', 'agent run finished', async () => done);
  void checkpoint('surface', 'A2UI surface rendered', async () => {
    const s = await surfaceCount(page);
    return s > 0 ? `${s} surface(s)` : null;
  });
  void checkpoint('render', 'no A2UI render errors ("A2UI render error" / "Unable to display")', async () => (quotes.length ? quotes.join(' | ') : null), {
    ok: (seen) => !seen,
  });
  if (quotes.length) {
    mark('error');
    const first = errs.first();
    // Scroll only when the first error is off screen (the chat usually shows it already).
    const box = await first.boundingBox().catch(() => null);
    if (!box || box.y < 0 || box.y + box.height > 950) await wheelIntoView(page, first, undefined);
    await glideTo(page, first, 3000);
    await idleNudge(page);
    if (n > 1) await glideTo(page, errs.nth(n - 1), 3000);
    await sleep(4500); // room for the narration's 'error' line before the failure terminal
    ctx.fail(`Generated components failed to render: ${quotes.join(' | ').slice(0, 300)}`);
    return;
  }
  if (!done) ctx.fail('The agent run never finished (3 min).');
  if ((await surfaceCount(page)) === 0) ctx.fail('No A2UI surface rendered after the run.');
  await sleep(3000);
};
export const runA2uiDynamicFindingAction = withFindingOnFailure(a2uiDynamicTake);

/**
 * Open Generative UI (✅): the visualiser streams in for a minute or more ("Building ..." /
 * "Rendering bars ..." over a spinner). The CI take of 2026-11-09 stopped on the first streamed
 * line. Wait for the whole agent run (its POST), then for the chat and the iframe to settle, so the
 * clip ends on the finished visualiser.
 */
const openGenUiTake: PageActionHandler = async (page, config, _root, ctx) => {
  const done = await sendAndAwaitRun(page, config.prompt, 300000);
  await waitForQuiet(page, 8000, 90000);
  const frame = page.locator('iframe').last();
  const hasFrame = await frame.isVisible().catch(() => false);
  if (hasFrame) {
    // The iframe paints its content after the HTML lands; give it time, then rest on it.
    await sleep(8000);
    await glideTo(page, frame, 2500);
    await idleNudge(page);
  }
  void checkpoint('run', 'agent run finished', async () => done);
  void checkpoint('surface', 'visualiser iframe rendered', async () => (hasFrame ? 'iframe visible' : null));
  void checkpoint('reply', 'agent reply rendered', lastReply(page));
  if (!done) ctx.fail('The agent run never finished (5 min).');
  else if (!hasFrame) ctx.fail('The run finished but no generated UI (iframe) is on screen.');
  await sleep(5000);
};
export const runOpenGenUiAction: PageActionHandler = openGenUiTake;

// ---------------------------------------------------------------------------------------------
// Render agent state in your app (#1): the doc's page (provider with no agent, Canvas calls
// useAgent() with no id) crashes with "useAgent: Agent 'default' not found after runtime sync".
// Then the harness copy (agent="openai_agent") shows the canvas working.
// ---------------------------------------------------------------------------------------------
const CRASH_TEXT = 'Reload to try again';
const renderingInAppTake: PageActionHandler = async (page, config, root, ctx) => {
  const crashed = await page.getByText(CRASH_TEXT).first()
    .waitFor({ state: 'visible', timeout: 45000 }).then(() => true).catch(() => false);
  void checkpoint('crash', 'the doc page crashes ("This page couldn\'t load")', () => probeText(page.getByText(CRASH_TEXT)));
  if (crashed) {
    mark('error');
    await glideTo(page, page.getByText(CRASH_TEXT).first(), 2500);
    await idleNudge(page);
    await sleep(5000);
    ctx.fail("The doc's page crashes: useAgent: Agent 'default' not found after runtime sync (quickstart registers only openai_agent).");
  } else {
    const title = await probeText(page.locator('main.canvas h1'));
    ctx.warn(`The doc's page did not crash this time (canvas title: ${JSON.stringify(title)}).`);
  }
  await scripted([
    { goto: '/shared-state/rendering-in-app/harness', holdMs: 6000 },
    { waitText: 'Project launch', timeoutMs: 30000 },
    { prompt: 'Hi! What can you see?' },
  ])(page, config, root, ctx);
};
export const runRenderingInAppFindingAction = withFindingOnFailure(renderingInAppTake);
/** Doc-only finding (docOnlyAction): highlight the faulty text on the doc, then the Notepad note. */
export const runDocOnlyFindingAction: PageActionHandler = async (page, config) => {
  await writeFinding(page, config.id, config);
};

// humanizeNote: the shared hurried Notepad style lives in core/overlays/note-style.ts (AUTORECORDER.md section 2).
export { humanizeNote };
// ---------------------------------------------------------------------------------------------
// Threads pages, re-tested with the Intelligence key (2026-11-08). No Notepad on either: a
// working take is a plain clip, and a failing one waits for the owner's decision.
// ---------------------------------------------------------------------------------------------
const DRAWER_ROW = 'copilotkit-threads-drawer li[role="option"][data-thread-id]';

/** Threads Drawer: chat once, the thread shows in the drawer, start a new one, reopen the old one. */
const threadsDrawerTake: PageActionHandler = async (page, config, root, ctx) => {
  const rowsBefore = await page.locator(DRAWER_ROW).count();
  await keyboardSend(page, config, root, ctx);
  const listed = await page
    .waitForFunction((n) => (document.querySelector('copilotkit-threads-drawer')?.shadowRoot
      ?.querySelectorAll('li[role="option"][data-thread-id]').length ?? 0) > n, rowsBefore, { timeout: 30000, polling: 500 })
    .then(async () => (await page.locator(DRAWER_ROW).count()) > rowsBefore)
    .catch(() => false);
  void checkpoint('thread', 'the new thread is listed in the drawer', async () => `${await page.locator(DRAWER_ROW).count()} row(s)`, {
    ok: () => listed,
  });
  if (!listed) {
    ctx.fail('The drawer did not list the new conversation.');
    return;
  }
  await sleep(4000); // the auto-generated thread name fills in
  const first = page.locator(DRAWER_ROW).first();
  await glideTo(page, first, 2000);
  mark('click', 'New Conversation');
  await glideClick(page, page.getByText('New Conversation', { exact: true }).first());
  const reset = await page.getByText('How can I help you today?').first()
    .waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false);
  void checkpoint('new', '"New Conversation" resets the chat', async () => reset);
  if (!reset) ctx.fail('"New Conversation" did not reset the chat.');
  await sleep(2500);
  mark('click', 'reopen thread');
  await glideClick(page, page.locator(DRAWER_ROW).first());
  const replayed = await page.getByText(config.prompt, { exact: false }).first()
    .waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
  void checkpoint('replay', 'selecting the thread replays its history', () => probeText(page.getByText(config.prompt, { exact: false })));
  if (!replayed) ctx.fail('Selecting the thread did not replay its conversation.');
  await sleep(4000);
};
export const runThreadsDrawerAction: PageActionHandler = threadsDrawerTake;

/** Headless Threads: chat once, the sidebar built with useThreads must list the thread. */
const headlessThreadsTake: PageActionHandler = async (page, config, root, ctx) => {
  await keyboardSend(page, config, root, ctx);
  // Threads appear in the sidebar as "<name>" + Rename / Archive buttons (the doc's ThreadSidebar).
  const rename = page.getByRole('button', { name: 'Rename' });
  const listed = await rename.first().waitFor({ state: 'visible', timeout: 30000 }).then(() => true).catch(() => false);
  void checkpoint('thread', 'the sidebar lists the thread (Rename / Archive row)', async () => `${await rename.count()} row(s)`, {
    ok: () => listed,
  });
  if (listed) {
    await glideTo(page, rename.first(), 3000);
    await sleep(3000);
    return;
  }
  // Reload, as a person would, to check the list is not just late.
  mark('demo', 'reload');
  await page.reload({ waitUntil: 'load' }).catch(() => {});
  await ensureOverlays(page, 'chrome').catch(() => {});
  await sleep(8000);
  const after = await rename.count();
  void checkpoint('thread-reload', 'after a reload the sidebar lists the thread', async () => `${after} row(s)`, { ok: () => after > 0 });
  if (after === 0) {
    ctx.fail('The chat replied, but the useThreads sidebar lists no threads .');
  }
  await sleep(3000);
};
export const runHeadlessThreadsAction: PageActionHandler = withFinding(headlessThreadsTake); // #2: finding always closes the take
/** Shared state streaming (Python): the agent writes into the Document pane, not the chat. Wait for the pane text. */
export const runDocumentStreamAction: PageActionHandler = async (page, config, _root, ctx) => {
  const pane = page.locator('main').first();
  await pane.waitFor({ state: 'visible', timeout: 60000 });
  const before = ((await pane.innerText().catch(() => '')) || '').length;
  await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  mark('action');
  let last = before, stable = 0;
  for (let i = 0; i < 90 && stable < 4; i++) {
    await sleep(1000);
    const n = ((await pane.innerText().catch(() => '')) || '').length;
    stable = n > before + 60 && n === last ? stable + 1 : 0;
    last = n;
  }
  void checkpoint('document', 'Document pane filled by the streamed state', () => pane.innerText().catch(() => ''));
  if (last <= before + 60) ctx.fail('The Document pane never filled (no streamed state).');
  await sleep(2500);
};

/** Programmatic control: click the page's "Run agent" button, wait for the agent's reply. */
export const runAgentTriggerAction: PageActionHandler = async (page, _config, _root, ctx) => {
  const btn = page.getByRole('button', { name: 'Run agent' }).first();
  await btn.waitFor({ state: 'visible', timeout: 60000 });
  await sleep(2000);
  mark('click');
  const before = await (await import('../core/actions')).getAssistantMessageCount(page);
  await glideClick(page, btn);
  const ok = await waitForAgentResponseCompletion(page, 2500, before).then(() => true).catch(() => false);
  void checkpoint('reply', 'agent reply after Run agent', lastReply(page));
  if (!ok) ctx.fail('No agent reply after clicking "Run agent".');
  await sleep(2500);
};
export const runKeyboardSendWithFinding: PageActionHandler = withFinding(keyboardSend);
