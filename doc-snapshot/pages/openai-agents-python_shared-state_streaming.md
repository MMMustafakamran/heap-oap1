# State Streaming

> Stream partial agent state updates to the UI while a tool call is still running.

<!-- interactive demo: shared-state-streaming -->

## What is this? [#what-is-this]

By default, agent state only updates *between* backend checkpoints, so
a long-running tool call (writing a full document, drafting an email)
appears to the UI as one big burst at the end. For agent-native apps,
that feels broken: users expect to watch the output materialise.

**State streaming** copies one tool argument into an agent state key
while the model writes the argument.
The UI, subscribed via `useAgent`, re-renders every token.

## When should I use this? [#when-should-i-use-this]

Use state streaming whenever a tool's output is long-form text or a
growing structured value and you want the user to see it assemble in
real time. Common shapes:

- A collaborative writing agent that emits a document
- A research agent that accumulates a list of findings
- A planning agent that builds up a step-by-step plan

## The backend: one streaming state mapping [#the-backend-one-streaming-state-mapping]

The adapter streams a tool call's arguments as `TOOL_CALL_ARGS` events while
the model writes them, but it does not copy them into state. The tool writes
the finished value to state when it runs:

~~~~python title="shared_state_streaming.py"
@function_tool
def write_document(document: str) -> str:
    """Write a document for the user. Always call this tool when the user asks
    you to write, draft, or revise any text. The `document` argument is
    streamed into shared state under the `document` key so the UI renders
    the body live.
    """
    shared_state().update(document=document)
    return "Document written to shared state."


~~~~

To fill the state while the model is still writing the argument, subclass
`OpenAIAgentsAgent` and turn those argument chunks into `STATE_DELTA` events.
The arguments are unfinished JSON until the call ends, so parse them with
`pydantic_core.from_json(..., allow_partial="trailing-strings")`, which keeps
a string that is cut off mid-way:

~~~~python title="shared_state_streaming.py"
def _document_so_far(arguments: str) -> str | None:
    """The ``document`` argument as far as the model has written it."""
    try:
        # Unfinished JSON: a string cut off mid-way is kept as it stands.
        value = from_json(arguments, allow_partial="trailing-strings")
    except ValueError:
        return None
    document = value.get("document") if isinstance(value, dict) else None
    return document if isinstance(document, str) else None


class DocumentStreamingAgent(OpenAIAgentsAgent):
    """Streams ``write_document``'s ``document`` argument into the state."""

    async def run_streamed(self, input: RunAgentInput) -> AsyncIterator[BaseEvent]:
        arguments: dict[str, str] = {}  # tool call id -> arguments so far
        async with aclosing(super().run_streamed(input)) as events:
            async for event in events:
                yield event
                if (
                    event.type == EventType.TOOL_CALL_START
                    and event.tool_call_name == write_document.name
                ):
                    arguments[event.tool_call_id] = ""
                elif (
                    event.type == EventType.TOOL_CALL_ARGS
                    and event.tool_call_id in arguments
                ):
                    arguments[event.tool_call_id] += event.delta
                    document = _document_so_far(arguments[event.tool_call_id])
                    if document is not None:
                        yield StateDeltaEvent(
                            type=EventType.STATE_DELTA,
                            delta=[
                                {"op": "add", "path": "/document", "value": document}
                            ],
                        )


~~~~

Mount the agent wrapped in that subclass,
`DocumentStreamingAgent(shared_state_streaming_agent)`, instead of a plain
`OpenAIAgentsAgent`. The page then sees the document grow token by token, and
the tool's own `STATE_SNAPSHOT` settles it once the call runs.

The backend pattern is always the same: map one streaming tool argument
to one shared-state key. Each framework does this in its own way:

- LangGraph Python: `StateStreamingMiddleware` with `StateItem(...)` entries.
- LangGraph TypeScript: `copilotkitCustomizeConfig` with an
  `emitIntermediateState` mapping.
- Direct SDK adapters: parse partial tool arguments in the streaming loop,
  and emit `STATE_SNAPSHOT` whenever the mapped value changes.
- LlamaIndex and Pydantic AI: there is no per-token mapping. A backend tool
  sends a state snapshot after each step or tool call instead (see the setup
  above).

When the LLM streams that argument, CopilotKit writes every partial value
into shared state before the tool even finishes executing.

```python title="src/demo_agents/shared_state_streaming.py"
def _document_so_far(arguments: str) -> str | None:
    """The ``document`` argument as far as the model has written it."""
    try:
        # Unfinished JSON: a string cut off mid-way is kept as it stands.
        value = from_json(arguments, allow_partial="trailing-strings")
    except ValueError:
        return None
    document = value.get("document") if isinstance(value, dict) else None
    return document if isinstance(document, str) else None


class DocumentStreamingAgent(OpenAIAgentsAgent):
    """Streams ``write_document``'s ``document`` argument into the state."""

    async def run_streamed(self, input: RunAgentInput) -> AsyncIterator[BaseEvent]:
        arguments: dict[str, str] = {}  # tool call id -> arguments so far
        async with aclosing(super().run_streamed(input)) as events:
            async for event in events:
                yield event
                if (
                    event.type == EventType.TOOL_CALL_START
                    and event.tool_call_name == write_document.name
                ):
                    arguments[event.tool_call_id] = ""
                elif (
                    event.type == EventType.TOOL_CALL_ARGS
                    and event.tool_call_id in arguments
                ):
                    arguments[event.tool_call_id] += event.delta
                    document = _document_so_far(arguments[event.tool_call_id])
                    if document is not None:
                        yield StateDeltaEvent(
                            type=EventType.STATE_DELTA,
                            delta=[
                                {"op": "add", "path": "/document", "value": document}
                            ],
                        )

```

A few things to note:

- The state key must exist in your agent state (`document` in this demo).
- The tool and argument names must match the exact LLM-facing tool call
  you want to forward (`write_document.document` here).
- Streamed values are previews. When the step ends, the state the agent
  saves replaces them, so save the final value when the tool finishes. On
  CrewAI, LlamaIndex and Pydantic AI, write the final value to the agent
  state yourself, or it is overwritten when the step returns.

## The frontend: useAgent + OnStateChanged [#the-frontend-useagent--onstatechanged]

The UI side is the same as any other [shared-state](/openai-agents-python/shared-state) subscription:
`useAgent` with `OnStateChanged` gives you a reactive `agent.state`.
Add `OnRunStatusChanged` if you want a "LIVE" / "done" indicator.

```typescript title="src/app/demos/shared-state-streaming/page.tsx"
  // Subscribe to BOTH state changes and run-status changes. The former
  // drives the per-token document rerender; the latter toggles the
  // "LIVE" badge when the agent starts / stops.
  const { agent } = useAgent({
    agentId: "shared-state-streaming",
    updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
  });
```

From there, `agent.state.document` is just a string that grows on every
token, and `agent.isRunning` tells you whether to show a streaming
indicator.

## Try it [#try-it]

Ask the agent to write a short poem. The `document` text grows in your UI
while the agent writes. When the run ends, `agent.isRunning` is `false`, so
your streaming indicator turns off.

<IntegrationGrid path="shared-state/streaming" exclude={["agno", "agent-spec", "spring-ai", "langroid"]} />
