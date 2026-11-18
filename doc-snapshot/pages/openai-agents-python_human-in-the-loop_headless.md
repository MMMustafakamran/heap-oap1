# Headless Interrupts

> Resolve agent interrupts from any UI, without a useInterrupt render slot.

<!-- interactive demo: interrupt-headless -->

## What is this? [#what-is-this]

Sometimes the agent's question belongs outside the chat, in a dashboard, a
side panel, or a modal. A headless interrupt lets any component show the
question and resume the run with the answer. No chat needs to be mounted.

This page shows how to resolve an interrupt without the chat. You build the
resolver from the same hooks that `useInterrupt` uses. It can be a button
grid, a form, a modal, or a keyboard shortcut.

<Callout type="warn" title="Use useHumanInTheLoop on this framework">
  Headless interrupts need an agent that emits an AG-UI interrupt (`RUN_FINISHED` with
  `outcome.type === "interrupt"`) or an `on_interrupt` custom event, and a
  working resume path. On the Built-in Agent, interrupts are temporarily
  unavailable. [`useHumanInTheLoop`](../human-in-the-loop) pauses on a tool
  call instead. It works on every framework that supports tool calls.
</Callout>

## When should I use this? [#when-should-i-use-this]

- **Testing / Playwright fixtures**: a deterministic, chat-less button
  grid is easier to drive than a chat surface where the picker only
  appears after an LLM call.
- **Non-chat UIs**: dashboards, side panels, inspector surfaces, or
  any place where you want the _agent's interrupt_ without the _chat
  transcript_.
- **Custom flow control**: when you need to know exactly when the
  interrupt arrived (e.g. to gate other UI) and when it was resolved.
- **Research / debugging**: when you want to observe the raw AG-UI
  custom events without the abstraction layer.

If you just want "a picker in chat", just use
[`useInterrupt`](./useInterrupt). For pauses that the model decides on, use
[`useHumanInTheLoop`](../human-in-the-loop).
