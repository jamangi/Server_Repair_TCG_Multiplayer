# Design Decision Index

This directory is the authoritative entry point for Server Repair TCG rule decisions. It separates approved rules, accepted open questions, new proposals, and synchronization problems so implementation does not silently resolve design questions.

## Current decision state

- The repository has approved match, Room, authority, visibility, first-version deck/turn/economy, Diagnosis, Isolation, Repair, Verify, Documentation, and closure-transaction rules, but no playable game engine yet.
- [`FROZEN_RULES.md`](FROZEN_RULES.md) remains authoritative while decisions are reviewed.
- [`UNFROZEN_RULES.md`](UNFROZEN_RULES.md) contains the remaining canonical open-rule inventory, including `SCORE-001` and `GEN-001`.
- [`CANDIDATE_DECISIONS.md`](CANDIDATE_DECISIONS.md) has no active candidates. It preserves promotion, freeze, spiritual-conflict, and prune history plus legacy anchors.
- [`UNSYNCHRONIZED_DECISIONS.md`](UNSYNCHRONIZED_DECISIONS.md) has no active reconciliation entries. It preserves the verified `SYNC-014`–`SYNC-020` resolution record and the boundary around accepted open decisions.
- [`TASK-007`](../../tasks/TASK-007-synchronize-approved-gameplay-rules.md) completed repository-wide synchronization on 2026-08-23 without resolving the remaining unfrozen scoring or Ticket Builder details.

## Reading order

1. Read this index for authority, status, and current priority.
2. Read [`FROZEN_RULES.md`](FROZEN_RULES.md) for behavior implementation may rely on.
3. Read [`UNSYNCHRONIZED_DECISIONS.md`](UNSYNCHRONIZED_DECISIONS.md) before relying on a frozen or unfrozen rule that may be under pressure.
4. Read [`UNFROZEN_RULES.md`](UNFROZEN_RULES.md) for accepted unresolved rules.
5. Read [`CANDIDATE_DECISIONS.md`](CANDIDATE_DECISIONS.md) for proposals still being organized or pruned.

## Decision documents

| Document | Authority | Purpose |
| --- | --- | --- |
| [`FROZEN_RULES.md`](FROZEN_RULES.md) | Normative | Approved behavior that implementations and tests may rely on. |
| [`UNFROZEN_RULES.md`](UNFROZEN_RULES.md) | Canonical open inventory | Fundamental questions accepted as real decisions but not yet resolved. |
| [`CANDIDATE_DECISIONS.md`](CANDIDATE_DECISIONS.md) | Staging | Proposed questions, dependencies, cross-stage questions, and pruned derivative ideas. |
| [`UNSYNCHRONIZED_DECISIONS.md`](UNSYNCHRONIZED_DECISIONS.md) | Reconciliation queue | Active cross-source conflicts plus retained resolution history; currently empty. |

## Status definitions

- **Candidate:** A proposed decision being tested for independence, scope, and conflicts.
- **Pruned:** A derivative idea retained beneath the more fundamental decision that controls it.
- **Unfrozen:** An accepted, fundamental rule question that must be resolved before affected behavior is implemented.
- **Frozen:** An approved rule that remains authoritative until explicitly changed.
- **Unsynchronized:** Two sources overlap, contradict, or depend on a foundation whose status changed. This status does not itself change rule authority.
- **Synchronized:** The decision and every affected contract, schema, example, preset, test, and design document agree.

## Decision lifecycle

```mermaid
flowchart LR
    A["Idea or design discussion"] --> B["Candidate decision"]
    B --> C["Pruned under a parent decision"]
    B --> D["Accepted unfrozen decision"]
    D --> E["Approved frozen rule"]
    B --> F["Potential conflict discovered"]
    D --> F
    E --> F
    F --> D
    F --> E
    E --> G["Schemas, design docs, tests, and presets synchronized"]
    F --> G
```

Pruning preserves an idea and its rationale; it does not reject it permanently. A pruned idea may become independent later if resolving its parent does not determine it.

An unsynchronized entry identifies work to reconcile. Until an explicit decision changes a rule, the frozen rule remains authoritative.

## Recommended decision order for finishing the engine

With the approved foundations synchronized, narrow the remaining rules in dependency order:

1. Resolve [`SCORE-001`](UNFROZEN_RULES.md#score-001): qualifying causal contribution classes, weights, duplicate suppression, visibility, and cooperative aggregation.
2. Resolve score-threshold and terminal precedence in [`UNFROZEN_RULES.md`](UNFROZEN_RULES.md#7-terminal-conditions-and-results) against the closure-settled score events.
3. Resolve [`GEN-001`](UNFROZEN_RULES.md#gen-001): Ticket Builder configuration, constraint solving, failure behavior, and versioned determinism.
4. Resolve the remaining production policy in `UNFROZEN_RULES.md`: configuration admission, timer precedence, Room lifecycle, computer players, statistics, and content-level balance.

Retain the separate candidate and synchronization ledgers for future proposals and cross-source conflicts even while both active queues are empty; their histories remain useful authority context.

## Maintenance rules

### Accepting a candidate

1. Confirm that the question is fundamental rather than an option controlled by another decision.
2. Record its dependencies and any frozen rules it pressures.
3. Move it to `UNFROZEN_RULES.md` without changing its decision ID.
4. Update the recommended order and synchronization queue.

### Freezing a decision

1. Record the explicit approved behavior in `FROZEN_RULES.md`.
2. Remove the corresponding question from `UNFROZEN_RULES.md`.
3. Identify affected contracts, schemas, examples, presets, and tests.
4. Complete or record the synchronization work.
5. Add migration and release notes when persisted or player-visible behavior changes.

### Resolving synchronization

1. State which source remains authoritative during the transition.
2. Resolve the most fundamental decision first.
3. Update dependent decisions and implementation artifacts.
4. Add behavior-focused tests before relying on the new rule.
5. Remove the active synchronization entry after every affected source agrees; Git history preserves the prior state.
