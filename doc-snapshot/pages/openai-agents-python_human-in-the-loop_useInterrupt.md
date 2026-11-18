# Pausing the Agent for Input

> Pause an agent run mid-tool, hand control to a custom React component, and resume with the user's answer.

<!-- interactive demo: gen-ui-interrupt -->

## What is this? [#what-is-this]

Some agent steps need a person's answer before the run can continue, such as
approving a payment or picking a meeting time. `useInterrupt` pauses the run,
shows your React component, and resumes the run with the answer. How the pause
works depends on your agent framework.

<Callout type="warn" title="Use useHumanInTheLoop on this framework">
  `useInterrupt` needs an agent that emits an AG-UI interrupt (`RUN_FINISHED` with
  `outcome.type === "interrupt"`) or an `on_interrupt` custom event, and a
  working resume path. On the Built-in Agent, interrupts are temporarily
  unavailable. [`useHumanInTheLoop`](../human-in-the-loop) pauses on a tool
  call instead. It works on every framework that supports tool calls.
</Callout>

## When should I use this? [#when-should-i-use-this]

Reach for `useInterrupt` when the pause is a **checkpoint in your
agent code** where the code path _must_ stop and wait for a human,
not an LLM-initiated tool call. Typical cases:

- A sensitive action (payments, irreversible writes) must be approved
- A required piece of state isn't known and can only be collected from the user
- The agent explicitly reaches an approval node in a longer workflow
- You want the server-side contract to be an interrupt that resumes with a payload

For LLM-initiated pauses where the model decides on the fly to ask
the user, prefer [`useHumanInTheLoop`](../human-in-the-loop).

## AG-UI standard interrupt flow vs. custom-event flow [#ag-ui-standard-interrupt-flow-vs-custom-event-flow]

This section is a reference for developers who write `render` code for their
own agent. The [`useInterrupt` reference](/reference/hooks/useInterrupt) lists
every option. `useInterrupt` handles two kinds of interrupt, and your agent
framework decides which kind it sends.

### Standard flow (`RUN_FINISHED` with `outcome.type === "interrupt"`) [#standard-flow-run_finished-with-outcometype--interrupt]

When the agent backend conforms to the AG-UI protocol, it signals an interrupt
by emitting a `RUN_FINISHED` event whose outcome carries the interrupts array:

```
outcome.type === "interrupt"
outcome.interrupts  // Interrupt[]
```

The hook detects this on `onRunFinishedEvent` and exposes the interrupts on the
render props **after** `onRunFinalized` fires. Your `render` function receives:

- **`interrupt`**: the primary `Interrupt` (`interrupts[0]`), with shape
  `{ id, reason, message?, toolCallId?, responseSchema?, expiresAt?, metadata? }`.
- **`interrupts`**: the full open set (usually one, but multi-interrupt is
  supported, as described below).
- **`resolve(payload?, interruptId?)`**: records `{ status: "resolved", payload }`
  for the targeted interrupt (defaults to the primary). The agent run resumes
  once every open interrupt has a response.
- **`cancel(interruptId?)`**: records `{ status: "cancelled" }` for the
  targeted interrupt. Same accumulate-then-submit logic applies.

Each resume entry carries the interrupt `id`, the status, and your payload.
`resolve` and `cancel` send no `metadata`.

### Custom-event flow (`on_interrupt`) [#custom-event-flow-on_interrupt]

Agents that emit a custom `on_interrupt` event use this flow. The LangGraph
adapter emits this event by default. The hook detects this on `onCustomEvent` and sets
`interrupt` to `null` and `interrupts` to `[]`. The payload is in
`event.value`. Calling `resolve(payload)` resumes via `forwardedProps.command`
(the custom-event resume mechanism). `cancel()` dismisses the interrupt without
resuming. The agent never receives a response.

### Priority [#priority]

If both signals appear on the same run, the standard flow wins.

### Approve / Cancel example [#approve--cancel-example]

```tsx
function ApprovalInterrupt() {
  useInterrupt({
    render: ({ interrupt, resolve, cancel }) => (
      <div className="p-3 border rounded">
        <p>{interrupt?.message ?? "Approve this action?"}</p>
        <div className="mt-2 flex gap-2">
          <button onClick={() => resolve({ approved: true })}>Approve</button>
          <button onClick={() => cancel()}>Cancel</button>
        </div>
      </div>
    ),
  });
  return null;
}
```

`resolve({ approved: true })` records a resolved entry and submits the `resume`
array to the agent. `cancel()` records a cancelled entry and does the same.
Both return the `RunAgentResult` once the run restarts.

### Multi-interrupt behavior [#multi-interrupt-behavior]

Some agents issue more than one interrupt in a single run (e.g. two independent
approvals). Each interrupt has its own `id`. Address them individually:

```tsx
useInterrupt({
  render: ({ interrupts, resolve, cancel }) => (
    <ul>
      {interrupts.map((i) => (
        <li key={i.id}>
          {i.message}
          <button onClick={() => resolve({ ok: true }, i.id)}>Approve</button>
          <button onClick={() => cancel(i.id)}>Cancel</button>
        </li>
      ))}
    </ul>
  ),
});
```

The agent run only resumes once **every** open interrupt has been addressed.
Calling `resolve` or `cancel` with a specific `interruptId` marks that interrupt
done; the hook auto-submits the accumulated responses when the last one is
addressed. If you omit `interruptId`, the primary interrupt (`interrupts[0]`)
is targeted.

### `responseSchema`: surface only, no client-side validation [#responseschema-surface-only-no-client-side-validation]

The `Interrupt` type exposes a `responseSchema` field (a JSON Schema object)
that the agent can use to describe the expected payload shape. `useInterrupt`
surfaces this field on `interrupt.responseSchema` for your UI to read
(e.g. to drive a form), but it does **not** validate `resolve` payloads against
it. Validation is the agent's responsibility on resume.
