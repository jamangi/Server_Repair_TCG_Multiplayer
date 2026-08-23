# Unsynchronized Decisions

This file is the active reconciliation queue for decisions that overlap, contradict, or require migration in another source.

An entry here does not silently change authority. [`FROZEN_RULES.md`](FROZEN_RULES.md) remains authoritative for approved behavior; [`UNFROZEN_RULES.md`](UNFROZEN_RULES.md) remains the canonical open-rule inventory; and [`CANDIDATE_DECISIONS.md`](CANDIDATE_DECISIONS.md) remains non-authoritative staging and history. See [`DECISION_INDEX.md`](DECISION_INDEX.md) for the decision lifecycle.

## Active reconciliation queue

None as of 2026-08-23. [`TASK-007`](../../tasks/TASK-007-synchronize-approved-gameplay-rules.md) synchronized the migrations formerly recorded as `SYNC-014` through `SYNC-020` and verified the affected design sources, schema contracts, fixtures, candidate flows, story/UI candidates, wireframes, and tests.

An accepted unfrozen question is not automatically an unsynchronized entry. Add a new entry only when another source actually overlaps, contradicts, or prematurely resolves it.

<a id="resolved-synchronization-record"></a>
## Resolved synchronization record

| Entry | Synchronized outcome | Verified surfaces |
| --- | --- | --- |
| `SYNC-014` | Diagnosis is iterative; accepted Isolation gates ordinary Repair; failed Verify returns the Ticket to Diagnosis without erasing Evidence, machine changes, or history. | All top-level design sources, Ticket/Knowledge schemas, fixtures, projections, candidate/story/UI wording, and lifecycle tests. |
| `SYNC-015` | Tickets expose authored public candidates while server-only causal truth and authored outcome matrices remain hidden; accepted Isolation cites eligible Evidence. | Domain Ticket schema, runtime Ticket/Knowledge/Fault state, authored fixture, cross-reference checks, and player-safe projections. |
| `SYNC-016` | Actions and immutable events use four visibility categories; paid actions create public Worklog placeholders; Documentation can enrich them later without moving chronology. | Action/result/event/view schemas, private/team/public/server fixtures, reconnect projection, recipient/leak tests, and Worklog publication checks. |
| `SYNC-017` | The first version uses 30-card decks, a three-copy limit, five-card opening hands, start-turn draw, two Actions, non-losing empty draws, and separately capped Search/Refresh resources. | Design/preset recommendations, Player/turn/action schemas, exact-zone/resource fixtures, negative economics checks, UI labels, and candidate ledgers. |
| `SYNC-018` | Current Verify passes are machine-revision scoped; failed Verify history is preserved; closure is an immediate atomic transaction before automatic end-turn. | Ticket/match/turn/action/event/result contracts, return-and-reclose fixture, ordered transaction fixture, projection and semantic checks. |
| `SYNC-019` | Closure costs zero Actions, awards no Service Points, retains Player/team closure statistics, and settles only policy-defined causal events. | All eleven candidate-flow documents, six replayed closures, exact Action/card/resource/Worklog/score audits, result journeys, and document tests. |
| `SYNC-020` | The account/loadout Equipment system is absent; technical Tools remain; Qualifications are recognition-only honor badges with no mechanical or access effect. | Design/schema/story/UI/candidate/account/Store/Ready surfaces, three synchronized wireframe pairs, JSON property scans, and document scans. |

Git history preserves the former active-entry narratives and affected-artifact lists. The TASK-007 completion record preserves the final verification and changed-file inventory.

## Accepted decision pressures

These canonical open questions remain visible, but TASK-007 did not turn them into normative schema behavior:

| Decision | Continuing pressure | Current boundary |
| --- | --- | --- |
| [`SCORE-001`](UNFROZEN_RULES.md#score-001) | A future score contract may need qualifying causal-contribution classes, values, duplicate handling, visibility, Root Cause policy, handicap policy, and cooperative aggregation. | Keep contribution and score-event hooks policy-neutral. Candidate replay values remain explicitly example-local and closure itself remains non-scoring. |
| [`GEN-001`](UNFROZEN_RULES.md#gen-001) | A future Ticket Builder needs configuration, constraint solving, failure behavior, seeded determinism, and versioning. | Do not add a normative builder configuration, solver, or algorithm. Current Ticket contracts validate authored content only. |

<a id="likely-future-unsynchronized-decisions"></a>
## Review disposition of the former queue

The former `SYNC-001`–`SYNC-013` inventory overlaps were removed after duplicate open wording was narrowed or deleted. Their frozen outcomes—completed-resolution replenishment, spectator capacity, clock expiration and pauses, shared Tickets, stale rejection, Ticket-owned progress, visibility defaults, computer knowledge, no-human termination, concession fallback, seat reclamation, and integer core fields—remain in [`FROZEN_RULES.md`](FROZEN_RULES.md).

The former `FUTURE-SYNC-001`–`FUTURE-SYNC-009` pressures were resolved before TASK-007: Documentation may occur incrementally but is mandatory for closure; publication uses four visibility categories; Worklog placeholders preserve chronology; cooperative team Evidence remains available before public Documentation; accepted Isolation is public Ticket progress; and Diagnosis is an umbrella sub-lifecycle whose accepted Isolation gates ordinary Repair. TASK-007 completed the repository migration caused by those outcomes.

## Resolution record template

Use this shape when adding a synchronization item:

```markdown
### SYNC-NNN — Short title

**Sources:** Frozen section; unfrozen or candidate decision

**Authority during review:** Frozen rule or explicitly stated exception

**Fundamental dependency:** Decision ID

Describe the overlap or contradiction.

Affected artifacts:

- normative decisions;
- schemas and examples;
- presets;
- implementation and tests;
- older design documents.
```

## Synchronization checklist

When the fundamental decision is resolved:

1. Update the frozen or unfrozen rule explicitly when authority itself changes.
2. Remove or narrow duplicate open wording.
3. Update affected schemas, examples, presets, prose, and UI candidates.
4. Add behavior-focused tests before implementation relies on the rule.
5. Record migrations for persisted or transmitted data.
6. Remove the active entry only after every affected source agrees; Git history preserves its former state.
