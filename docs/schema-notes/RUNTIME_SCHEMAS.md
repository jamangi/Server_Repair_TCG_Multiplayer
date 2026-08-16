# Runtime Schemas v0.1 — Server-Authoritative Game Model

These schemas describe **mutable match state and client/server interaction**, not the static technical-knowledge database.

## Recommended content order

The intended development order is:

1. **Schemas for domain knowledge**
2. **Domain content records**
   - Faults
   - Symptoms
   - Components
   - Tools
   - Tests
   - Commands
   - Procedures
   - Protocols
3. **Repair Ticket definitions**
4. **Runtime state schemas**
5. **Playable card definitions that reference domain content**
6. **Decks and balancing data**
7. **More content / expansions**

The earlier package contains only a few example records to prove the schema design. It is not yet a substantive card database.

## Server-authoritative design

The client should be treated as an untrusted presentation layer.

The server should own:

- deck order,
- hidden cards,
- hidden Faults,
- hidden ticket data,
- all KnowledgeState truth,
- legal action calculation,
- random outcomes,
- effect resolution,
- scoring,
- turn progression,
- match revision.

A client submits an `ActionRequest`. The server checks:

1. authentication / player identity,
2. match membership,
3. expected match revision,
4. turn ownership,
5. card ownership and zone,
6. resource/action costs,
7. target legality,
8. hidden-information permissions,
9. rule/effect legality.

Only then does the server mutate authoritative state and return an `ActionResult`.

## Why `expected_revision` exists

Each client action carries the match revision it believes is current.

If the server state has already advanced, the server rejects the stale request.

This prevents:

- accidental double actions,
- race conditions,
- replay of stale UI actions,
- some classes of client tampering.

## Public vs private state

Do **not** send the authoritative MatchState directly to React.

Instead generate projections:

### PublicMatchView

Safe information both players may see.

### PrivatePlayerView

Information only the authenticated player may see:

- their hand,
- their private KnowledgeState,
- private test results,
- legal actions.

Hidden server state should never appear in either response until game rules reveal it.

## Critical hidden-information rule

A Fault can be `actual_present: true` in authoritative `FaultState` while remaining absent from a player's `KnowledgeState`.

This is intentional.

The machine has one reality; each player has only the evidence they have earned.

## Test / Repair / Verification separation

- Tests write evidence into `KnowledgeState`.
- Repairs modify `FaultState.machine_status`.
- Verification appends results to `TicketState.verification_history`.
- Ticket closure is a server rule that checks all required conditions.

## Events

`GameEvent` provides an append-only semantic history.

This is useful for:

- replay,
- debugging,
- audits,
- spectator UI,
- reconnecting clients,
- dispute investigation.

A later implementation can use full event sourcing or simply maintain events alongside current snapshots.

## Language independence

Nothing in these schemas requires JavaScript, TypeScript, Python, Go, Rust, Java, or another implementation language.

The React client can consume JSON projections while any server technology validates and executes the rules.
