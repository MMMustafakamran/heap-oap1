/**
 * Page id -> action. Pages not listed run the standard prompt-and-reply take.
 * OpenAI Agents (Python) + React. Finding pages end with doc evidence + Notepad (AUTORECORDER.md §2).
 */
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { runStandardAction } from '../core/actions';
import { type Page } from 'playwright';

import { waitForPageReady } from './page-ready';
import {
  runA2uiDynamicFindingAction,
  runAgentTriggerAction,
  runDocumentStreamAction,
  runGenuiAction,
  runGenuiFindingAction,
  runHeadlessThreadsAction,
  runKeyboardSendAction,
  runOpenGenUiAction,
  runPromptOrError,
  runRenderingInAppAction,
  runThreadsDrawerAction,
  SCRIPTED,
} from './openai-agents.actions';

/** Keys are page ids from `config/pages.config.ts`. Doctor flags any orphans. */
export const ACTION_MAP: Record<string, PageActionHandler> = {
  // ❌ finding pages (level 1 full clips)
  'components-state-actions': runGenuiFindingAction, // #3
  components: runGenuiAction, // ✅: surface renders (2/2 CI takes 2026-11-20)
  a2ui: runA2uiDynamicFindingAction, // #4
  'a2ui-dynamic': runA2uiDynamicFindingAction, // #5
  // ✅ since 2026-11-20 (minor notes only)
  'rendering-in-app': runRenderingInAppAction, // harness route with agent="openai_agent"
  'headless-threads': runHeadlessThreadsAction,
  'a2ui-fixed': runPromptOrError,
  hashbrown: runKeyboardSendAction,
  // ✅ pages with a page-specific take
  'prebuilt-components-copilot-threads-drawer': runThreadsDrawerAction,
  'headless-ui': runKeyboardSendAction,
  'json-render': runKeyboardSendAction,
  'components-catalogs': runKeyboardSendAction,
  'components-surfaces': runKeyboardSendAction,
  'components-theming': runKeyboardSendAction,
  'components-standard-catalog': runKeyboardSendAction,
  'components-from-a2ui': runKeyboardSendAction,
  'components-markdown-mode': runKeyboardSendAction,
  'components-transports': runKeyboardSendAction,
  'open-generative-ui': runOpenGenUiAction,
  'programmatic-control': runAgentTriggerAction,
  'state-streaming': runDocumentStreamAction,
  'state-rendering': runDocumentStreamAction,
  'mcp-apps': runPromptOrError,
  'tool-based': runPromptOrError,
  // Scripted takes (agent-config selects, multimodal attach) override the entries above.
  ...SCRIPTED,
};

export async function executePageAction(
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
  ctx: ActionContext,
): Promise<void> {
  if (!config.docOnly) await waitForPageReady(page, { label: config.id });

  const handler = ACTION_MAP[config.id] ?? runStandardAction;
  await handler(page, config, rootPath, ctx);
}
