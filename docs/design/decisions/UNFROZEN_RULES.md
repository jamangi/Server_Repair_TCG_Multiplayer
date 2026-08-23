# Unfrozen Rules

This is the canonical ledger for accepted Server Repair TCG rule questions that are not yet approved.

## Current state

**None.** The user approved every remaining first-version recommendation on 2026-08-23. `SCORE-001`, `GEN-001`, terminal conditions, departure cleanup, Room lifecycle, all other reviewed items, and `PRESSURE-001` through `PRESSURE-004` are resolved in [`FROZEN_RULES.md`](FROZEN_RULES.md).

The first-version foundation therefore has no known rule-design blocker. Domain objects, the Ticket Builder, game engine, backend, account system, and application shell may rely on the frozen ledger, subject to their own scoped implementation tasks and validation.

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
