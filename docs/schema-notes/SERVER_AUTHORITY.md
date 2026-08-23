# Server authority and player-safe projections

The client is a renderer and input device, not a trusted rules engine. Client-side convenience checks may improve feedback, but only the authoritative server can accept and serialize an intent.

## Before mutation

For every `ActionRequest`, the server validates:

1. authentication, Room membership, and active Player role;
2. the request/nonce idempotency key;
3. `expected_revision` against current Match revision;
4. turn ownership and any open resolution window;
5. card ownership/zone or named basic-action availability;
6. exact Ticket, component, Fault-instance, card, Evidence, or Worklog target;
7. Actions and Search/Refresh resources;
8. authored outcome eligibility at the current machine revision; and
9. hidden-information and effect legality.

A stale request is rejected before payment. It spends no Action or utility token, moves no card, and creates no Worklog/event record. An unsupported Commit Isolation is different: the intent is accepted, one Action is spent, a public placeholder is created, and the response is only `ISOLATION_NOT_SUPPORTED`.

Public candidates are discoverable possibilities, not an exhaustive mirror of causal truth. A hidden causal Fault may be revealed into that set later, while Repair checks continue to use server-only truth.

## Authoritative secrets

Never send these fields to a Player or spectator until a rule explicitly publishes a safe projection:

- `server_only_truth`, Fault-instance causal relationships, and actual presence;
- unused authored Evidence outcomes and server-selected random state;
- opponent hand identities and exact deck order;
- another competitive Player's Evidence or Hypothesis;
- server-only pending scoring-slot eligibility and hidden Ticket point budget; and
- private scenario branches.

CSS hiding, disabled controls, obfuscated identifiers, and encrypted-looking strings do not protect data already delivered to a browser.

## One event log, four audiences

The server appends immutable semantic events in one authoritative sequence and projects them by `SERVER_ONLY`, `PRIVATE_PLAYER`, `TEAM`, or `PUBLIC_MATCH` visibility. Competitive Evidence defaults to the acting Player; cooperative Evidence defaults to the team. Spectators receive only `PUBLIC_MATCH` events and state.

Player-safe payload validation is recursive. Moving a forbidden field beneath a generic `detail`, `result`, or similar object does not make server truth safe to transmit. A private projection must match the authenticated Player recipient; a team projection must match that Player's team identity.

Every accepted paid action also appends a public Worklog placeholder with the actor, Ticket, source name, public target surface, Action cost, and action time. The placeholder precedes other public events produced by that result, including Search and Refresh completion. Concealed targets/results remain in their authorized event. Document Live later publishes an eligible result by appending a publication event and enriching the public Worklog projection with its source links, publication time, and publisher. The source event is never overwritten or widened.

Successful and failed Verify summaries are public immediately because they change eligibility. A failed or inconclusive result and any stale pass remain in authoritative history when the Ticket returns to Diagnosis.

## Closure transaction

After current Verify requirements pass, the server opens the closure-resolution window before automatic end-turn. A valid zero-Action bundle is serialized once and completes the full frozen transaction before any terminal result is evaluated. Closure preserves every Repair in the accepted path and accepts decisive Evidence only from the current accepted Isolation's citations. The closure event records statistical attribution but is not a Service Point source. Causal score records settle the eligible one-point Isolation and necessary-Repair slots and retain their contributors.

## Reconnect

Reconnect installs the latest player-safe public/private snapshot first. Only explicitly supplied unseen semantic events after that snapshot sequence are then applied, and duplicate event IDs are ignored. The same projection boundary is used for computer-player input and accessibility announcements.

See the synchronized [runtime schema notes](RUNTIME_SCHEMAS.md) and [frozen rules](../design/decisions/FROZEN_RULES.md) for the complete contract boundary.
