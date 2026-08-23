# TASK-007: Synchronize approved gameplay rules

## Status

Ready for implementation.

## Objective

Synchronize the repository with the frozen gameplay rules approved through 2026-08-22:

- iterative Diagnosis with evidence-supported Isolation;
- authored candidate Faults and Evidence outcomes;
- the ordinary Repair gateway;
- failed Verify returning a Ticket to Diagnosis while preserving history;
- incremental Documentation and immutable Worklog chronology;
- first-version deck, turn, Search, and Refresh rules;
- zero-Action, non-scoring, statistically attributable Ticket closure;
- removal of the account/loadout Equipment system; and
- Qualifications as non-mechanical honor badges.

This task resolves [`SYNC-014` through `SYNC-020`](../design/decisions/UNSYNCHRONIZED_DECISIONS.md#confirmed-unsynchronized-decisions) across design documents, schema notes, JSON Schemas, examples, candidate flows, story/UI candidates, and validation tests. It is a synchronization and migration task, not a new rules-design pass or game implementation.

## Authority and open-rule boundary

- [`FROZEN_RULES.md`](../design/decisions/FROZEN_RULES.md) is authoritative.
- [`UNFROZEN_RULES.md`](../design/decisions/UNFROZEN_RULES.md) identifies decisions this task must not silently resolve.
- [`CANDIDATE_DECISIONS.md`](../design/decisions/CANDIDATE_DECISIONS.md) has no active candidates and preserves lifecycle history only.
- If synchronization reveals a genuine contradiction in frozen rules, stop and report it. Do not repair the contradiction by editing frozen authority.
- Do not select final `SCORE-001` contribution classes, values, visibility, duplicate policy, Root Cause policy, handicap policy, or cooperative aggregation.
- Do not implement or freeze the `GEN-001` Ticket Builder, its configuration schema, constraint solver, or generator algorithm. Recommendations may identify future contract opportunities only.
- Do not resolve other configuration, timer, terminal, Room, spectator, computer-player, statistics, or content-balance questions.

## Required inputs

Read completely before editing:

- `AGENTS.md`, the root `README.md`, and this task;
- every file in `docs/design/decisions/`;
- every top-level file in `docs/design/`, including `00_GAME_ENGINE_OVERVIEW.md` through `07_FAULT_BROWSER_AND_SEARCH.md`, `RECOMMENDED_DATA_MODEL.md`, `RECOMMENDED_PRESETS.json`, and `DOCUMENTS_TO_UPDATE.md`;
- every file in `docs/schema-notes/`;
- every JSON Schema in `schemas/domain/` and `schemas/runtime/`;
- every fixture in `examples/domain/` and `examples/runtime/`;
- `docs/tasks/TASK-006-candidate-gameplay-flows-v0.0.md` and every file in `docs/candidate_flows/`;
- story and application candidates in `docs/story/` that mention lifecycle state, Equipment, Qualifications, preparation, scoring, or Ticket generation; and
- `docs/ui-plan/TODO.md`, the wireframe index, and every wireframe whose labels or flows mention Equipment, Qualifications, closure, Worklog, or synchronized match state.

Read files completely rather than relying only on search matches. Search results may route the audit but do not establish context or authority.

## Required work

### 1. Synchronize every top-level design source

Review every top-level file in `docs/design/`, including technical catalogs that may need only a confirmed no-change audit.

- Update lifecycle wording so Observe, Hypothesize, Test, Isolate, Repair, Verify, and Document are evidentiary functions rather than seven departments or a permanently one-way state machine.
- Represent Diagnosis as `Hypothesize <-> Test -> Isolate`, with accepted Isolation gating ordinary Repair.
- Preserve the distinction between Knowledge State and machine state.
- Preserve failed Verify, prior Evidence, prior machine changes, and earlier Worklog events when returning to Diagnosis.
- Align card, Test, Tool, Command, Repair, Validation Procedure, target, visibility, turn, utility-resource, closure, and result descriptions with frozen rules.
- Do not rename stable domain IDs.
- Record each reviewed top-level design file in the completion report, including files that required no edits.

Review `RECOMMENDED_DATA_MODEL.md` for update opportunities across Ticket state, Knowledge State, action/event identity, Worklog projections, contribution ledgers, closure, player-safe views, and versioned rules. It must remain clearly recommended rather than normative where decisions are unfrozen.

Analyze `DOCUMENTS_TO_UPDATE.md` as an outdated but potentially useful migration map:

- mark recommendations as completed by TASK-007, still relevant, superseded, or deferred;
- update its affected-file inventory and sequencing advice;
- do not implement a recommendation merely because this file contains it; and
- do not let it become a second normative rules source.

Update `RECOMMENDED_PRESETS.json` only where frozen configuration or terminology requires it. Do not embed unresolved scoring or Ticket Builder policy.

### 2. Synchronize schema notes and JSON Schemas

Update affected artifacts when they exist. At minimum audit and, where necessary, update:

- `schemas/domain/repair_ticket.schema.json` for public authored candidates, server-only causal truth references, authored Evidence outcomes, Isolation requirements, Repair/Verify requirements, and structured closure requirements;
- `schemas/runtime/ticket_state.schema.json` for Diagnosis, Repair-ready, Awaiting Verify, Returned to Diagnosis, Ready to close, closed state, current/stale Verify passes, preserved failure history, and Ticket-owned progress;
- `schemas/runtime/knowledge_state.schema.json` for private/team Knowledge State without conflating it with machine state;
- `schemas/runtime/action_request.schema.json` and `action_result.schema.json` for Commit Isolation, Document Live, zero-Action closure, Search, Refresh, expected revisions, and before-payment rejection;
- `schemas/runtime/game_event.schema.json` for immutable event identity, four-category visibility, Worklog placeholders, publication links, action/publication times, failed Verify, closure, contribution attribution, and queue reconciliation;
- `schemas/runtime/turn_state.schema.json` for the frozen draw/two-Action flow and the immediate post-Verify closure-resolution window;
- `schemas/runtime/player_state.schema.json`, `match_state.schema.json`, `public_match_view.schema.json`, and `private_player_view.schema.json` for utility resources, player-safe Evidence, Ticket progress, contribution/statistical ledgers, reconnect state, closure, and results; and
- any domain or runtime schema transitively affected by those changes.

Update `docs/schema-notes/DOMAIN_SCHEMAS.md`, `RUNTIME_SCHEMAS.md`, and `SERVER_AUTHORITY.md` to match the schemas and frozen server-authority boundary.

Schema requirements:

- retain stable IDs and existing `$id` values unless a deliberate schema-version migration is documented;
- preserve authoritative/private/public separation;
- model generic score/contribution hooks without choosing unresolved `SCORE-001` values;
- do not add Equipment fields, slots, ownership, effects, or Installed Equipment objects;
- do not give Qualifications any runtime match representation or gameplay effect; and
- do not add a normative Ticket Builder configuration while `GEN-001` remains unfrozen.

### 3. Synchronize examples and validation tests

Update every affected fixture in `examples/domain/` and `examples/runtime/`. Add the smallest additional fixtures needed to exercise the synchronized contracts, including:

- accepted and rejected evidence-supported Isolation;
- Repair after accepted Isolation;
- failed Verify returning to Diagnosis without erasing history;
- later successful Verify and zero-Action closure;
- public Worklog placeholder plus later publication enrichment;
- competitive private and cooperative team Evidence;
- stale-revision rejection before payment;
- Search/Refresh resources and an empty draw that is not a loss; and
- closure statistics distinct from causal Service Point events.

Add or update repository tests that parse every changed JSON file, resolve schema references, validate valid fixtures, reject representative invalid fixtures, and enforce visibility and lifecycle invariants. Do not add a new package, framework, backend, or build system.

### 4. Rewrite candidate-flow contradictions

The candidate-flow package remains non-authoritative, but it must no longer demonstrate rules explicitly rejected after TASK-006.

Update every affected file in `docs/candidate_flows/`:

- change Document Close from one Action to the frozen zero-Action closure window;
- remove the base Service Point previously awarded to the closer;
- preserve closure as Player/team statistical attribution;
- use a clearly labeled example-local pending causal-contribution rubric that settles only at closure;
- do not describe the example rubric as the answer to unfrozen `SCORE-001`;
- recalculate every turn, Action total, hand/deck/discard state, score, resource grant, Worklog event, result, and final audit affected by the change;
- rewrite the Candidate-Frozen Example Profile and all focused/full journeys consistently;
- remove account/loadout Equipment, Equipment Store inventory, Equipment compatibility, Ready Equipment snapshots, Installed Equipment, and Qualification-to-Equipment gates;
- preserve technical Tool cards and ordinary real-world references to equipment where they do not describe the removed account mechanic;
- make Qualifications recognition-only honor badges with no gameplay, access, deck, story, procedure, or matchmaking effect; and
- retain the legacy equipping-example filename if links depend on it, but rewrite its purpose and title into a synchronized account/appearance/Qualification-recognition flow, or document and validate a deliberate link-safe replacement.

The revised package must retain TASK-006's replay and authority discipline: exactly three closures in each audited match, valid round/turn ordering, reconciled card zones/resources/scores, player-safe information, immutable Worklog chronology, reduced-motion equivalents, and unresolved *Quiet Cascade* technical truth.

### 5. Remove Equipment and synchronize Qualifications elsewhere

Audit affected story candidates, UI planning, schema notes, design recommendations, account examples, Store flows, My Info flows, Room readiness, and wireframes.

- Remove only the capitalized account/loadout **Equipment** mechanic and its equivalents.
- Do not erase technical Tools, server hardware, repair parts, or natural-language discussion of real equipment.
- Remove Equipment destinations, tabs, Store categories, slots, inventories, compatibility, effects, and readiness snapshots.
- Retain Qualifications only as honor-badge recognition in account, profile, campaign-history, or progression surfaces.
- Remove Qualification gates and effects on gameplay, content access, story access, decks, procedures, Equipment, and matchmaking.
- If affected SVG wireframes are edited, regenerate their PNG counterparts and visually inspect both at full size for clipping, stale labels, and layout gaps.

### 6. Close the synchronization queue honestly

At completion, update `UNSYNCHRONIZED_DECISIONS.md` and `DECISION_INDEX.md`:

- remove `SYNC-014`–`SYNC-020` only when every affected source is synchronized and verified;
- retain or narrow any entry whose work is incomplete, naming the exact remaining artifacts;
- do not mark an entry resolved merely because a schema can represent the rule if examples or prose still contradict it; and
- do not edit frozen or unfrozen behavior unless the user separately approves a rule change.

## Files allowed to change

- `README.md`
- `docs/tasks/INDEX.md`
- `docs/tasks/TASK-007-synchronize-approved-gameplay-rules.md`
- `docs/design/*.md`
- `docs/design/*.json`
- `docs/design/decisions/DECISION_INDEX.md`
- `docs/design/decisions/UNSYNCHRONIZED_DECISIONS.md`
- `docs/schema-notes/*.md`
- `schemas/domain/*.json`
- `schemas/runtime/*.json`
- `examples/domain/*.json`
- `examples/runtime/*.json`
- `docs/candidate_flows/*.md`
- `docs/story/**/*.md`
- `docs/ui-plan/**/*.md`
- `docs/ui-plan/wireframes/*.svg`
- `docs/ui-plan/wireframes/*.png`
- `tests/*.mjs`
- `tests/helpers/*.mjs`

If a required affected artifact falls outside this list, stop and request a task amendment rather than editing it opportunistically.

## Prohibited work

- Do not edit `FROZEN_RULES.md`, `UNFROZEN_RULES.md`, or `CANDIDATE_DECISIONS.md` during TASK-007 implementation.
- Do not modify `viewer/` or its generated manifest.
- Do not implement a game engine, multiplayer client, backend, Ticket Builder, constraint solver, campaign runtime, account system, matchmaking rank, or Equipment replacement mechanic.
- Do not add a framework, package, dependency, backend, or build tool.
- Do not rename stable entity IDs.
- Do not invent technical content, unsupported Ticket facts, story truth, or a final scoring policy.
- Do not remove the Tool domain category merely because some prose calls Tools “equipment.”
- Do not resolve *The Quiet Cascade*.
- Do not begin TASK-008 or any later work.

## Verification

Before completion:

1. Confirm every top-level `docs/design/` file was reviewed and report edited/no-change totals.
2. Confirm every repository-relative Markdown link added or changed by TASK-007 resolves, including fragments.
3. Parse every JSON file changed by the task successfully.
4. Resolve every local JSON Schema `$ref` and validate all domain/runtime example fixtures against their declared schemas.
5. Confirm representative invalid fixtures fail for the intended reason.
6. Confirm lifecycle states support iterative Diagnosis, accepted Isolation, Repair, failed Verify, return to Diagnosis, later Verify, and closure without erasing history.
7. Confirm visibility projections enforce `SERVER_ONLY`, `PRIVATE_PLAYER`, `TEAM`, and `PUBLIC_MATCH` without leaks.
8. Confirm zero-Action closure has no Service Point award, retains statistical attribution, resolves before automatic end-turn when Verify used the last Action, and triggers the complete frozen transaction.
9. Confirm candidate-flow games and full journeys reconcile exact Action, card-zone, utility-resource, Worklog, contribution, score, and Ticket totals after their rewrites.
10. Confirm no account/loadout Equipment mechanic remains in affected sources. Review every retained case-insensitive “equipment” match and classify it as a legitimate technical/natural-language use.
11. Confirm Qualifications have no gameplay, access, loadout, procedure, story, or matchmaking effect.
12. Confirm `SCORE-001` and `GEN-001` remain visibly unfrozen and were not embedded as normative schema behavior.
13. Render and inspect any changed SVG/PNG wireframe pair.
14. Run all purpose-built TASK-007 tests plus the existing repository tests.
15. Run `git diff --check`.
16. Verify only files allowed by this task changed.

Report every command, exit code, pass/fail total, changed file, no-change audited design file, unresolved item, and retained synchronization entry.

## Completion boundary

Stop after repository-wide rule synchronization, candidate-flow correction, schema/example validation, wireframe synchronization where required, and honest synchronization-queue reconciliation.

Do not implement the playable game, freeze `SCORE-001` or `GEN-001`, create the Ticket Builder, finalize scoring balance, add matchmaking rank, replace Equipment with another progression mechanic, or simplify the decision-document lifecycle. Those require user review after TASK-007 succeeds.

## Completion record

Not started.
