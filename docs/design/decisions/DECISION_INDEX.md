# Design Decision Index

This directory is the authoritative entry point for Server Repair TCG rule decisions. The active foundation now has two ledgers: approved rules and accepted open rules. This keeps implementation from silently deciding unresolved behavior without requiring every new process to read proposal and synchronization history.

## Current decision state

- [`FROZEN_RULES.md`](FROZEN_RULES.md) is the normative source implementations and tests may rely on.
- [`UNFROZEN_RULES.md`](UNFROZEN_RULES.md) is the canonical open inventory and contains four post-playtest pressures accepted for review on 2026-08-24.
- [`APPROVALS.md`](APPROVALS.md) is the current non-authoritative A/B/C review packet for those pressures plus content/tutorial scope. No option is approved merely because it appears there.
- The former candidate ledger was fully resolved on 2026-08-22. The former synchronization ledger was fully resolved by [`TASK-007`](../../tasks/TASK-007-synchronize-approved-gameplay-rules.md) on 2026-08-23. Both retired ledgers remain available in Git history.
- `SCORE-001`, `GEN-001`, terminal policy, departure cleanup, Room lifecycle, and the four previously pressured frozen rules are approved. [`TASK-008`](../../tasks/TASK-008-freeze-first-version-foundation.md) records their synchronization.
- The repository has a frozen first-version gameplay foundation, deterministic engine/Builder, automated-game campaign, and deployed browser-local solo client. `first-version-v1` remains authoritative while the post-playtest changes are reviewed.

## Reading order

1. Read this index for authority and lifecycle.
2. Read [`FROZEN_RULES.md`](FROZEN_RULES.md) for behavior implementation may rely on.
3. Check [`UNFROZEN_RULES.md`](UNFROZEN_RULES.md) for accepted open questions or pressure against Frozen behavior.
4. When choices are pending, review [`APPROVALS.md`](APPROVALS.md) and keep every option non-authoritative until the user responds.

## Active decision documents

| Document | Authority | Purpose |
| --- | --- | --- |
| [`FROZEN_RULES.md`](FROZEN_RULES.md) | Normative | Approved behavior that implementations and tests may rely on. |
| [`UNFROZEN_RULES.md`](UNFROZEN_RULES.md) | Non-normative open inventory | Accepted unresolved rules and pressure; currently contains `PRESSURE-005` through `PRESSURE-008`. |
| [`APPROVALS.md`](APPROVALS.md) | Non-normative review packet | Clarified post-playtest options awaiting user selection. |

Completed task records, case studies, candidate flows, examples, and Git history explain provenance but are not additional rule ledgers.

## Status definitions

- **Unfrozen:** An accepted rule question that must be resolved before affected behavior is implemented. New rule proposals enter this ledger directly and remain non-authoritative until approved.
- **Frozen:** An approved rule that remains authoritative until deliberately changed through the rules-version process.
- **Pressured:** A frozen rule contains an unresolved assumption or conflicts with a proposed resolution. The pressure is recorded in the unfrozen ledger; the existing frozen wording remains authoritative until the user approves an adjustment.
- **Synchronized:** The approved decision and every affected contract, schema, example, preset, test, and design document agree.

## Decision lifecycle

```mermaid
flowchart LR
    A["Idea or design discussion"] --> B["Accepted open rule in UNFROZEN_RULES"]
    B --> C["Approved rule in FROZEN_RULES"]
    C --> D["Schemas, design docs, tests, and presets synchronized"]
    B --> E["Conflict or pressure discovered"]
    C --> E
    E --> B
    E --> C
```

Rejected, derivative, or superseded ideas need not remain in the active foundation. Git history and the discussion or task that resolved them preserve their rationale.

## Foundation status

The immediate rule-decision order is `PT-001` through `PT-005` in `APPROVALS.md`, followed by synchronization through TASK-013. Independent interface defects may proceed under TASK-012. Content expansion and tutorials remain downstream so they are not authored against behavior that is about to change.

## Maintenance rules

### Recording an open rule or pressure

1. Confirm the question changes game, authority, persistence, or information behavior rather than only content tuning or interface presentation.
2. Add it to `UNFROZEN_RULES.md` with the frozen rules and implementation surfaces it pressures.
3. Keep all options non-authoritative until the user approves one.

### Freezing a decision

1. Record the approved behavior in `FROZEN_RULES.md`.
2. Remove the corresponding question and pressure from `UNFROZEN_RULES.md`.
3. Update affected contracts, schemas, examples, presets, and tests.
4. Add migration and release notes when persisted or player-visible behavior changes.

### Handling synchronization work

1. State which frozen rule remains authoritative during migration.
2. Create a scoped task when multiple artifacts must change.
3. Add behavior-focused tests before relying on the new rule.
4. Close the task only after every affected source agrees. Do not recreate a permanent synchronization ledger merely to preserve completed history.
