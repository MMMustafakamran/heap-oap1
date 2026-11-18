# State Rendering

> Render your agent's state with custom UI components in real-time.

<!-- interactive demo: shared-state-streaming -->

## What is this? [#what-is-this]

State rendering lets you build UI that reflects your agent's state in real-time. As your agent progresses through nodes and emits state updates, your frontend renders those changes, showing progress, drafts, or intermediate results.

## When should I use this? [#when-should-i-use-this]

Use state rendering when you want to:

- Show real-time progress (e.g. "Researching... 2/5 complete")
- Display drafts that update as the agent works
- Build dashboards that reflect agent state
- Render structured output outside of the chat

## How it works in code [#how-it-works-in-code]

<Steps>
  <Step>
    ### Show the model the state in its instructions

    The page's state arrives with every run as `RunAgentInput.state`, and the
    adapter makes it the run's shared state. It does not reach the prompt by
    itself. Give the agent dynamic instructions that read it with the
    adapter's `shared_state()`, so the model sees the current value on every
    turn, including edits the user made with `agent.setState`:

~~~~python title="shared_state.py"
def with_state(prompt: str) -> Callable[[RunContextWrapper[Any], Agent[Any]], str]:
    """Dynamic instructions: ``prompt`` plus the run's shared state as JSON."""

    def instructions(_ctx: RunContextWrapper[Any], _agent: Agent[Any]) -> str:
        state = shared_state().value
        if not state:
            return prompt
        return (
            f"{prompt}\n\nCurrent shared application state (JSON; the user may "
            f"have edited it since your last turn):\n{json.dumps(state)}"
        )

    return instructions


~~~~

~~~~python title="shared_state.py"
READ_WRITE_PROMPT = (
    "You are a helpful, concise assistant. The shared application state below "
    "has a `preferences` object with the user's name, preferred tone, "
    "language and interests, which the user edits in the app: always respect "
    "them, and address the user by name when you know it. Its `notes` list "
    "holds what you have remembered so far. When the user asks you to "
    "remember something, or when you observe something worth surfacing in "
    "the UI, call `set_notes` with the FULL updated list of short note "
    "strings (existing notes + new)."
)


shared_state_read_write_agent = Agent(
    name="preferences_assistant",
    instructions=with_state(READ_WRITE_PROMPT),
    model=MODEL,
    model_settings=chat_settings(),
    tools=[set_notes],
)


~~~~

  </Step>
  <Step>
    ### Write state from a server tool

    Server tools are ordinary `@function_tool` functions. Inside one,
    `shared_state().update(...)` merges top-level keys into the state and
    streams a `STATE_SNAPSHOT` to the browser before the tool's own result, so
    any component subscribed with `useAgent` re-renders while the agent is
    still running.

~~~~python title="shared_state.py"
@function_tool
def set_notes(notes: list[str]) -> str:
    """Replace the notes array in shared state with the full updated list.

    Use this tool whenever the user asks you to "remember" something, or
    when you have an observation about the user worth surfacing in the
    UI's notes panel. Always pass the FULL notes list (existing notes +
    any new ones), not a diff. Keep each note short (< 120 chars).
    """
    shared_state().update(notes=notes)
    return "Notes updated."


~~~~

    `shared_state().set(value)` replaces the whole state instead. The
    request's own `state` is never changed.

  </Step>
</Steps>

<Callout type="info" title="Inside an OpenAIAgentsAgent run">
  `OpenAIAgentsAgent` sets up `shared_state()` for every request. If you
  drive the SDK yourself with the adapter's translator, start the run inside
  `use_shared_state(SharedState(run_input.state))` and pass the same object
  to `to_agui`.
</Callout>

1. On the backend, write the value to a key in the
   [agent state](/openai-agents-python/shared-state). To stream a tool argument into a state key
   token by token, see [State Streaming](/openai-agents-python/shared-state/streaming).
2. On the frontend, import `useAgent` from `@copilotkit/react-core/v2`:

   ```tsx
   import { useAgent, UseAgentUpdate } from "@copilotkit/react-core/v2";
   ```

3. Subscribe to the agent state. Each time the state changes, your component
   renders again with the latest value:

   ```typescript title="src/app/demos/shared-state-streaming/page.tsx"
     // Subscribe to BOTH state changes and run-status changes. The former
     // drives the per-token document rerender; the latter toggles the
     // "LIVE" badge when the agent starts / stops.
     const { agent } = useAgent({
       agentId: "shared-state-streaming",
       updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
     });
   ```

4. Read the key from `agent.state` and render it:

   ```tsx
   const document = (agent.state as { document?: string }).document ?? "";
   ```

To check it, ask the agent to write a short poem. Your component renders the
poem each time the agent updates `document` in its state.

To render the state inside the chat instead, pass a `children` function to
the chat's `messageView` slot and add your UI next to the messages. For
example, to list the searches an agent keeps in a `searches` key:

```tsx
<CopilotChat
  agentId="sample_agent"
  messageView={{
    children: ({ messageElements, interruptElement }) => (
      <div>
        {messageElements}
        {state.searches?.map((search, index) => (
          <div key={index}>{search.done ? "✅" : "❌"} {search.query}</div>
        ))}
        {interruptElement}
      </div>
    ),
  }}
/>
```

Here `state` is `agent.state` from `useAgent`.

<Callout type="info">
  **Free course:** See this pattern built end-to-end in [Build Interactive Agents with Generative UI](https://www.deeplearning.ai/short-courses/build-interactive-agents-with-generative-ui/). This free DeepLearning.AI short course is taught by CopilotKit's CEO. It covers the full Generative UI spectrum (Controlled, Declarative, and Open-Ended).
</Callout>

<IntegrationGrid
  path="generative-ui/state-rendering"
  exclude={["agno", "agent-spec"]}
/>
