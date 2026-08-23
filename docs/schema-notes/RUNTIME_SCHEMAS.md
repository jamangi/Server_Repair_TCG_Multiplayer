# Runtime schemas — synchronized server-authoritative model

The runtime schemas describe mutable match state, player-safe projections, authoritative intents, immutable semantic events, and reconnect state. They are implementation-neutral contracts, not a game engine.

## Lifecycle and state separation

[`ticket_state.schema.json`](../../schemas/runtime/ticket_state.schema.json) represents these Ticket-owned states:

```text
DIAGNOSIS --accepted Isolation--> REPAIR_READY -> AWAITING_VERIFY -> READY_TO_CLOSE -> CLOSED
    ^                                                     |
    `----------- RETURNED_TO_DIAGNOSIS <------------------' failed or inconclusive Verify
```

The diagram is a state summary, not seven one-way departments. Hypothesis revision and Tests iterate inside Diagnosis. `isolation_history`, `repair_history`, `verification_history`, `return_to_diagnosis_history`, `documentation_publications`, and Worklog IDs remain append-only across a return. A new accepted Isolation is required before another ordinary Repair.

[`knowledge_state.schema.json`](../../schemas/runtime/knowledge_state.schema.json) contains only Player-private or cooperative-team beliefs and Evidence. [`fault_state.schema.json`](../../schemas/runtime/fault_state.schema.json) contains authoritative machine reality. A player-safe view never infers one from the other.

The initial public candidate set is not required to contain every hidden causal Fault. Authored play may reveal a previously hidden candidate dynamically; Repair legality still resolves against the authoritative causal truth and its requirements rather than treating the public candidate list as truth.

## Actions, payment, and utility resources

[`action_request.schema.json`](../../schemas/runtime/action_request.schema.json) gives every intent a request ID, actor, target revision, action discriminator, and type-specific payload. It covers card execution plus the cardless actions Revise Hypothesis, Commit Isolation, Document Live, Publish Closure, Search, Refresh, and Pass.

[`action_result.schema.json`](../../schemas/runtime/action_result.schema.json) distinguishes an accepted paid action from a request rejected before payment. An unsupported Isolation is an accepted one-Action resolution with the generic `ISOLATION_NOT_SUPPORTED` resolution code; it is not a free request rejection. A stale revision rejects with zero Actions, zero utility resources, no card movement, and no events.

Search spends one Action and one Search Token to select a remaining-deck card before shuffling the remainder. Refresh spends one Action and one Refresh Token to combine discard with the remaining deck. [`player_state.schema.json`](../../schemas/runtime/player_state.schema.json) stores public utility-resource counts/caps, the 30-card Ready snapshot, card zones, skipped empty draws, and reconnect cursors. It contains no empty-deck loss flag.

[`turn_state.schema.json`](../../schemas/runtime/turn_state.schema.json) fixes two starting Actions, records `DRAWN` or `SKIPPED_EMPTY`, and holds an explicit `CLOSURE_RESOLUTION` window. That window precedes automatic zero-Action end-turn processing, so a successful Verify using the last Action can still be closed immediately for zero Actions.

## Events, Worklog, and visibility

[`game_event.schema.json`](../../schemas/runtime/game_event.schema.json) uses immutable event IDs, sequence numbers, revisions, action time, and publication time. Its only visibility categories are:

- `SERVER_ONLY`
- `PRIVATE_PLAYER`
- `TEAM`
- `PUBLIC_MATCH`

Every accepted paid action creates a public Worklog placeholder. A later Document Live publication creates a new event linked to that placeholder and its source result. The current Worklog projection can be enriched while the original action/result events and chronology remain immutable. Publication does not mutate the source Evidence visibility.

For an accepted paid result, the placeholder is the first public event from that action. Search and Refresh follow the same rule before publishing their completion event; rejected requests publish neither event.

Every non-`SERVER_ONLY` payload is also constrained against direct authoritative-secret fields. Dependency-free semantic validation applies the same prohibition recursively so a nested object cannot smuggle causal truth, unexecuted outcomes, random state, deck order, opponent hands, or internal scoring modifiers into a player-safe event. Private and team projections additionally verify that each event and Knowledge State is addressed to the authenticated Player or that Player's team.

[`public_match_view.schema.json`](../../schemas/runtime/public_match_view.schema.json) contains only public candidates, accepted Isolation, machine-state summaries, Verify summaries, Worklog projections, public utility counts, public turn state, scores, closure statistics, and the public result/statistics projection. [`private_player_view.schema.json`](../../schemas/runtime/private_player_view.schema.json) adds the authenticated hand, authorized private/team Knowledge States and events, legal actions, and reconnect cursor. Neither view can carry `server_only_truth` or authoritative `fault_states`.

## Closure and causal scoring

A closed Ticket stores a zero-Action structured bundle and links every step in the atomic transaction: Worklog lock, policy-selected score events, archive/removal, utility grants, queue reconciliation, terminal evaluation, and turn end. Its closure record preserves the complete accepted-path Repair history, and its decisive Evidence links must be citations from the current accepted Isolation. The closer and optional team are recorded only as closure statistics. No closure card recovery or closure Service Point field exists.

`pending_contributions`, `contribution_ledger`, and `service_point_events` implement the frozen causal policy. Every required actionable Fault has one one-point Isolation slot and one one-point necessary-Repair slot. The earliest qualifying final-path event owns each slot. Pending eligibility remains server-only until closure; settled score events are public. Root Cause has no bonus. Cooperative awards credit the shared team directly while retaining the contributing Player ID.

Runtime contracts contain no Equipment or Qualification fields. Technical Tool/card state remains ordinary match content.

## Fixture and reference validation

Example filenames declare their schema by the prefix before the first dot: `action_request.*.json` validates against `action_request.schema.json`, `ticket_state.*.json` against `ticket_state.schema.json`, and so on. The TASK-007 test loads every schema by `$id`, resolves internal and repository-local `$ref` values, validates every example, strictly checks RFC 3339 calendar date-times, and checks relationships that JSON Schema cannot express alone: Ticket-local authored references, lifecycle/history coherence, exact Action arithmetic, stale rejection, card-zone disjointness, deck copy counts, utility caps and zone effects, audience identity, card/event registry references, and atomic closure cleanup.
