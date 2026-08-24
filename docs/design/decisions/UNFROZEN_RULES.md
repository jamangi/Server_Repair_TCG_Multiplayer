# Unfrozen Rules

This is the canonical ledger for accepted Server Repair TCG rule questions that are not yet approved.

## Current state

Four accepted post-playtest pressures are open as of 2026-08-24. The existing `first-version-v1` wording remains authoritative until the user selects options in [`APPROVALS.md`](APPROVALS.md) and TASK-013 synchronizes an updated rules version.

### PRESSURE-005 — Diagnostic access versus deck economy

The first solo playtest requested every Test and Command from the beginning so troubleshooting cannot appear blocked by draw order or an absent diagnostic. This pressures Frozen §§9–11: Tests/Commands are presently draw-dependent Card affordances, Search is the universal deck-access tool, and diagnostics resolve only through authored Ticket outcomes.

Affected surfaces: Card placement/zones, deck legality and migration, Search/Refresh, action requests, projections, Ticket outcome authoring/assembly, Builder solvability, automated policies, solo UI, tutorials, and saved presets. Review `PT-001` in `APPROVALS.md`.

### PRESSURE-006 — Candidate derivation and elimination-based Isolation

The playtest requested candidates derived from observed Symptoms, a five-item working maximum, manual Evidence-backed elimination, and possible successful Isolation by eliminating every alternative. This pressures Frozen §§11–12, where public candidates are fully authored, Hypothesis is only a marker, and Isolation succeeds through a positive authored citation requirement.

Affected surfaces: Ticket/Card domain contracts, Knowledge State, events, action requests/results, visibility, projections, Builder candidate selection and solvability, engine Isolation validation, contribution history, UI, policies, statistics, examples, and tutorials. Review `PT-002` and `PT-003`.

### PRESSURE-007 — Speculative Repair before accepted Isolation

The playtest proposed permitting a Repair guess while more than one hypothesis remains. This directly pressures Frozen §12's accepted-Isolation gateway, rejection-before-payment behavior, and explicit absence of a parts-cannon exception. It also risks turning machine response into a hidden-truth oracle.

Affected surfaces: Repair legality/payment, Card disposition, machine-state history, generic failure information, scoring eligibility, statistics, stalemate/progress classification, projections, UI, policies, and automated games. Review `PT-004`.

### PRESSURE-008 — Solo Give Up and hidden-solution reveal

The playtest requested a Show Answer action that reveals the hidden Fault and required path so a Player can distinguish misunderstanding from invalid content. Frozen rules define invalidation, closure, terminal results, and visibility but no Player-initiated Ticket abandonment/reveal transition.

Affected surfaces: Ticket lifecycle and archival, hidden-information release, pending contribution settlement, queue/terminal evaluation, results/statistics, projections, solo profile, UI confirmation/reveal, tutorial use, and automated games. Review `PT-005`.

Content breadth (`PT-006`), tutorial scope (`PT-007`), the scrolling/caret defects, and a future SLA are not frozen-rule decisions by themselves. Their tasks remain ordered around the pressures above.

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
