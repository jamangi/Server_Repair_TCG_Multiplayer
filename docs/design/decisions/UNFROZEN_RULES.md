# Unfrozen Rules

This is the canonical ledger for accepted Server Repair TCG rule questions that are not yet approved.

## Current state

Five approved but unsynchronized post-playtest/migration pressures remain recorded as of 2026-08-24. PT-001 D through PT-007 A activate the V0 training-ready sequence: TASK-012 first, then TASK-013, TASK-014, TASK-016, and TASK-015. TASK-017 and `PRESSURE-009` remain approved V2 direction but are deferred until the project owner returns to migration. Existing `first-version-v1` wording remains authoritative until each synchronization task completes its versioned boundary.

### PRESSURE-005 — Diagnostic access versus deck economy

The first solo playtest requested every Test and Command from the beginning so troubleshooting cannot appear blocked by draw order or an absent diagnostic. Follow-up review reframed the Relevant and Global mockups as switchable comfort/organization views over one globally available diagnostic catalog, with Relevant as an explainable public-graph filter rather than an authority on expert judgment. It also established that an accepted resource-spending action may never appear silent: every Test/Command must return visible Evidence, including clean, negative, unrelated, and inconclusive findings, and every other paid action must visibly report its typed result. This pressures Frozen §§9–11: Tests/Commands are presently draw-dependent Card affordances, Search is the universal deck-access tool, and diagnostics resolve only through authored Ticket outcomes.

Affected surfaces: Card placement/zones, deck legality and migration, Search/Refresh, action requests/results, events, projections, public relationship-path explanations, Ticket outcome authoring/assembly, Builder solvability, automated policies, switchable local Bench View state, target/result continuity, tutorials, and saved UI preferences. Review the required no-silent-action invariant and `PT-001` in `APPROVALS.md`.

### PRESSURE-006 — Candidate derivation and elimination-based Isolation

The playtest requested candidates derived from observed Symptoms, a five-item working maximum, manual Evidence-backed elimination, and multiple technically valid Isolation routes. It also exposed a concrete mismatch: `One Member Down` reports candidate-specific decisive `CONFIRM` Evidence for Failed SAS Drive, but the flat authored requirement still demands two citations and rejects that one-result commitment. This pressures Frozen §§11–12, where disposition meanings are not tied to sufficiency, public candidates are fully authored, Hypothesis is only a marker, and Isolation succeeds through one count-based positive citation requirement.

Affected surfaces: Evidence-disposition semantics, typed alternative Isolation routes, Ticket/Card domain contracts, Knowledge State, events, action requests/results, visibility, projections, Builder candidate/route selection and solvability, engine Isolation validation, contribution history/attribution, UI, policies, statistics, examples, and tutorials. Review `PT-002` and `PT-003`.

### PRESSURE-007 — Speculative Repair before accepted Isolation

The playtest proposed permitting a Repair guess while more than one hypothesis remains. This directly pressures Frozen §12's accepted-Isolation gateway, rejection-before-payment behavior, and explicit absence of a parts-cannon exception. It also risks turning machine response into a hidden-truth oracle.

Affected surfaces: Repair legality/payment, Card disposition, machine-state history, generic failure information, scoring eligibility, statistics, stalemate/progress classification, projections, UI, policies, and automated games. Review `PT-004`.

### PRESSURE-008 — Solo Give Up and hidden-solution reveal

The playtest requested a Show Answer action that reveals the hidden Fault and required path so a Player can distinguish misunderstanding from invalid content. Frozen rules define invalidation, closure, terminal results, and visibility but no Player-initiated Ticket abandonment/reveal transition.

Affected surfaces: Ticket lifecycle and archival, hidden-information release, pending contribution settlement, queue/terminal evaluation, results/statistics, projections, solo profile, UI confirmation/reveal, tutorial use, and automated games. Review `PT-005`.

### PRESSURE-009 — Dependency-derived diagnostic inference

Hands-on review established that V0's Test `evidence_rules`, reciprocal Fault `effective_test_ids`, Ticket-authored candidate effects, and separately authored Isolation requirements do not form a dependency-based elimination engine. A passing Test should rule out a candidate only when the modeled topology, capability dependencies, Fault effects, selected conditions, and observation coverage make that outcome impossible under the candidate—not because a Ticket remembered to label an outcome `RULE_OUT`. Likewise, failure of a shared or redundant capability must not overstate which dependency is faulty.

This pressures Frozen §§11–12 and §20's authored Ticket/Builder boundary, plus the current domain/runtime schemas and content architecture. V0 remains reproducible under `first-version-v1`; the approved resolution is an audited Migration Seed and separate V2 repository rather than an in-place contract replacement. The retained Migration Seed choices and superseded sequencing decision are recorded in `APPROVALS.md`; TASK-017 is approved but deferred.

Affected surfaces: ontology, server/component topology, capabilities, typed dependency expressions, Fault modes/effects, Test conditions, observations and measurement coverage, Evidence dispositions and derivation traces, candidates/possible worlds, elimination, Isolation proofs, Builder solvability, hidden-information projections, deterministic replay, domain migration, difficulty content, automated proof cases, story opportunities, and future UI explanations.

Content breadth (`PT-006 D`), tutorial scope (`PT-007 A`), and the scrolling/caret defects are approved work ordered around the pressures above but are not frozen-rule decisions by themselves. A future SLA remains deferred. MS-006 A's earlier V0-parking sequence is superseded; TASK-017 is deferred rather than active.

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
