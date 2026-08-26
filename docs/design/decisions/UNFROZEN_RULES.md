# Unfrozen Rules

This is the canonical ledger for accepted Server Repair TCG rule questions that are not yet approved.

## Current state

`PRESSURE-005` through `PRESSURE-008` were resolved by approved PT-001 D through PT-005 A and synchronized into `first-version-v2` by TASK-013 on 2026-08-24. One approved future-version pressure remains: TASK-017 and `PRESSURE-009` are deferred until the project owner returns to the separate V2 dependency-inference migration. `PRESSURE-010` is an open V0 decision about deliberate same-state diagnostic repetition. `first-version-v1` remains pinned for its historical artifacts; the V0 diagnosis successor is `first-version-v2`.

### PRESSURE-009 — Dependency-derived diagnostic inference

Hands-on review established that V0's Test `evidence_rules`, reciprocal Fault `effective_test_ids`, Ticket-authored candidate effects, and separately authored Isolation requirements do not form a dependency-based elimination engine. A passing Test should rule out a candidate only when the modeled topology, capability dependencies, Fault effects, selected conditions, and observation coverage make that outcome impossible under the candidate—not because a Ticket remembered to label an outcome `RULE_OUT`. Likewise, failure of a shared or redundant capability must not overstate which dependency is faulty.

This pressures Frozen §§11–12 and §20's authored Ticket/Builder boundary, plus the current domain/runtime schemas and content architecture. V0 remains reproducible under `first-version-v1`; the approved resolution is an audited Migration Seed and separate V2 repository rather than an in-place contract replacement. The retained Migration Seed choices and superseded sequencing decision are recorded in `APPROVALS.md`; TASK-017 is approved but deferred.

Affected surfaces: ontology, server/component topology, capabilities, typed dependency expressions, Fault modes/effects, Test conditions, observations and measurement coverage, Evidence dispositions and derivation traces, candidates/possible worlds, elimination, Isolation proofs, Builder solvability, hidden-information projections, deterministic replay, domain migration, difficulty content, automated proof cases, story opportunities, and future UI explanations.

Content breadth (`PT-006 D`), tutorial scope (`PT-007 A`), and the scrolling/caret defects are approved work ordered around the pressures above but are not frozen-rule decisions by themselves. A future SLA remains deferred. MS-006 A's earlier V0-parking sequence is superseded; TASK-017 is deferred rather than active.

### PRESSURE-010 — Same-state diagnostic repetition

Frozen §11 rejects an identical same-diagnostic, same-target, same-machine-revision execution before payment when no new eligible outcome exists. V0 diagnostics otherwise produce deterministic Evidence and do not change machine state, so hands-on play makes the one-run restriction feel arbitrary even though it prevents Action waste and repeated-Evidence farming.

PT-008 asks whether a deliberate new request may instead pay the diagnostic cost and reproduce the prior result as explicitly redundant, non-citable Evidence linked to its canonical original. Approval must keep request idempotency separate from gameplay repetition, preserve zero-Action anti-loop protection, prevent duplicates from satisfying isolation/elimination/corroboration or scoring, record redundant-work statistics, and keep automated policies from looping. A changed target, machine revision, or future authoritative test condition remains fresh Evidence rather than a duplicate.

Affected surfaces: Frozen §11 and Evidence/scoring/statistics language; action requests and idempotency; legal-intent projections; game events, Ticket history, Knowledge State, and player-safe schemas; Isolation/elimination citation validation; Worklog/result presentation; automated policies and stall detection; canonical/staged parity; and TASK-021's post-resolution diagnostic state. Review PT-008 in `APPROVALS.md`; TASK-022-XHIGH is proposed but blocked until that choice is approved.

## Boundary

An empty ledger does not turn content balance, interface layout, deployment limits, AI heuristics, moderation, retention, or future-version features into frozen game rules. Frozen §21 assigns those concerns to their proper workstreams and identifies features deliberately absent from the first version.

New gameplay proposals or newly discovered pressure against a frozen rule enter this file directly. They remain non-authoritative until explicitly approved. A proposal must identify the frozen behavior and implementation surfaces it would affect.

## Change discipline

When a future open rule is approved:

1. add its normative behavior to `FROZEN_RULES.md`;
2. remove it from this ledger;
3. update affected schemas, examples, presets, and tests;
4. record saved-state or rules-version migrations where applicable; and
5. preserve rejected or superseded alternatives in discussion, completed tasks, and Git history rather than another permanent rule ledger.
