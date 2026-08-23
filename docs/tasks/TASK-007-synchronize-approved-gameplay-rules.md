# TASK-007: Synchronize approved gameplay rules

## Status

Completed 2026-08-23.

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

This task resolved `SYNC-014` through `SYNC-020` across design documents, schema notes, JSON Schemas, examples, candidate flows, story/UI candidates, and validation tests. It was a synchronization and migration task, not a new rules-design pass or game implementation. The resolved synchronization ledger was retired after this task completed; this completion record and Git history preserve it.

## Authority and open-rule boundary

- [`FROZEN_RULES.md`](../design/decisions/FROZEN_RULES.md) is authoritative.
- [`UNFROZEN_RULES.md`](../design/decisions/UNFROZEN_RULES.md) identifies decisions this task must not silently resolve.
- The candidate ledger had no active candidates and preserved lifecycle history only. It was retired after this task completed; Git history preserves that record.
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

Completed 2026-08-23. `SYNC-014`–`SYNC-020` are synchronized and removed from the active reconciliation queue. All 92 TASK-007 changed files are within the task's allowed paths. `FROZEN_RULES.md`, `UNFROZEN_RULES.md`, `CANDIDATE_DECISIONS.md`, and `viewer/` are unchanged. One concurrent untracked root research draft, `SERVER-REPAIR-DOMAIN-EXPANSION-DRAFT-2026-08-23.txt`, is outside this task; it was left untouched and excluded from the TASK-007 commit.

### Outcome

- Foundational prose, recommendations, presets, schemas, examples, candidate flows, story/UI candidates, and wireframes now describe Diagnosis as an iterative Evidence loop with accountable Isolation rather than seven isolated departments or a permanently one-way state machine.
- Domain and runtime contracts represent authored candidates/outcomes, hidden causal truth, accepted Isolation, the ordinary Repair gate, failed Verify history, later successful Verify, incremental Documentation, immutable Worklog chronology, the frozen first-version deck/turn/economy, player-safe projections, and the complete closure transaction.
- Candidate games retain six exact three-Ticket closures. Every closure costs zero Actions, awards no closer Service Point, preserves closer statistics, and settles only the package's explicitly example-local pending causal events.
- The account/loadout Equipment mechanic is absent. Technical Tools remain intact. Qualifications are honor-only recognition with no gameplay, access, deck, procedure, story, Room, or matchmaking effect.
- The root README, decision index, task index, and reconciliation ledger now describe the synchronized state honestly.

### Required review inventory

Top-level `docs/design/` review: **11 edited, 0 no-change**. Reviewed and edited:

- `00_GAME_ENGINE_OVERVIEW.md`
- `01_DATA_ARCHITECTURE.md`
- `02_CARD_TYPES.md`
- `03_FAULT_CATALOG_V0_1.md`
- `04_COMPONENT_CATALOG_V0_1.md`
- `05_TESTS_TOOLS_COMMANDS_V0_1.md`
- `06_IMPLEMENTATION_AND_CONTENT_VALIDATION.md`
- `07_FAULT_BROWSER_AND_SEARCH.md`
- `DOCUMENTS_TO_UPDATE.md`
- `RECOMMENDED_DATA_MODEL.md`
- `RECOMMENDED_PRESETS.json`

Schema review: **24 total; 16 edited, 8 confirmed no-change**. No-change domain schemas were `command`, `component`, `fault_causal_edge`, `fault`, `protocol`, `symptom`, and `tool`; the no-change runtime schema was `card_instance`. All 24 retained their prior `$id`.

Candidate-flow review: **11 of 11 edited**. The legacy `v0.0_ex1_equipping_examples.md` path was retained and rewritten as an account appearance and Qualification-recognition flow.

### Verification results

- Repository-relative Markdown links: **253 paths and 64 fragments resolved; 0 failed**.
- JSON: **45 changed JSON files parsed; 0 failed**. The schema/fixture validation set contains **24 schemas and 31 fixtures (55 files); 55 passed**.
- JSON Schema: **300 local `$ref` occurrences resolved; 24/24 `$id` values remained unique and unchanged from `HEAD`**.
- Valid/invalid contracts: **21/21 TASK-007 schema tests passed**. Negative cases cover undeclared candidate/outcome links, Repair outside causal truth, malformed lifecycle/history, hidden-state leakage, wrong private/team recipients, stale payment, paid-action Worklog order, paid closure, incomplete closure, illegal card copies/zones/resources, incoherent Match references, and invalid RFC 3339 dates/times.
- Lifecycle: accepted Isolation gates Repair; failed Verify preserves earlier Evidence, Repairs, passes, machine revisions, return history, and Worklog events; later current passes permit closure.
- Visibility: `SERVER_ONLY`, `PRIVATE_PLAYER`, `TEAM`, and `PUBLIC_MATCH` fixtures and projection checks passed with recursive secret-key and recipient/team rejection.
- Closure: the immediate post-Verify window remains open even after the second Action; the zero-Action transaction follows the eight frozen steps at one revision; the closure event is not a Service Point event, closer attribution has no point award, and policy-neutral causal score events remain separate.
- First-version economy: 30-card totals, maximum-three copies, disjoint zones, non-losing empty draw, two-Action arithmetic, Search/Refresh costs and mutations, caps, and closure grants all passed positive and negative checks.
- Candidate replays: **6/6 zero-Action closures**; Game 1 has 27 Worklog events, 6 team Service Points, final zones `6/17/7/0` and `3/18/9/0`, and Action equations `12+4=16` and `13+1=14`; Game 2 has 21 Worklog events, a `3–3` result, final zones `8/18/4/0` and `5/18/7/0`, and equations `6+8=14` and `11+3=14`. Both end Search/Refresh at `5/1` for each Player. Focused, networked, campaign, multiplayer, and combined restatements each retain exactly three closures per audited match.
- Stable candidate-flow domain references: **85/85 resolved; 0 missing**.
- Equipment scan: **48 retained match-lines reviewed**—34 explicit absence/migration/technical-boundary statements, 4 legitimate real-world or diagnostic-equipment uses, and 10 frozen/historical decision-ledger references; **0 active account/loadout mechanics**. JSON property scans also found none.
- Qualification scan: **92 retained match-lines reviewed**—81 synchronized honor-only/boundary uses and 11 frozen/historical decision-ledger uses; **0 gameplay, access, loadout, procedure, story, or matchmaking effect**. JSON property scans found no runtime/domain field.
- Open-rule boundary: `SCORE-001` remains represented only by generic hooks and explicitly example-local fixture policy IDs; `GEN-001` has no Ticket Builder configuration, solver, or algorithm in schemas or examples.
- Wireframes: **3/3 SVGs parsed**, each rendered pixel-identically to its PNG partner, and all three pairs were visually inspected at full size with no clipping, stale label, or layout gap. Dimensions are `1200×750`, `1200×750`, and `1200×760`.
- Purpose-built tests: document synchronization **3/3**, schema contracts **21/21**. Full repository suite: **30/30**. Viewer baseline: **3/3**. All syntax checks passed.
- Whitespace and scope: `git diff --check` exited 0; the TASK-007 changed-path audit found **92 allowed, 0 disallowed**; prohibited decision/viewer diff audit found **0 changed paths**. The separate untracked research draft named above was preserved and excluded.

### Final verification commands

All commands below exited 0:

```powershell
node --check tests/helpers/json-schema-validator.mjs
node --check tests/helpers/task-007-semantics.mjs
node --check tests/task-007-schema-contracts.test.mjs
node --check tests/task-007-document-sync.test.mjs
node --test tests/task-007-document-sync.test.mjs
node --test tests/task-007-schema-contracts.test.mjs
node --test tests/*.mjs
node --check viewer/js/app.js
node --check viewer/js/data-loader.js
node --check viewer/js/entity-types.js
node --test tests/viewer-baseline.test.mjs
```

The remaining audits were executed as read-only PowerShell/Node one-liners:

```powershell
# Parse every changed JSON path reported by git status.
$files = git -c safe.directory=C:/Users/madis/Documents/repos/Server_Repair_TCG_Multiplayer status --porcelain=v1 | ForEach-Object { $_.Substring(3) } | Where-Object { $_ -like '*.json' }; foreach ($file in $files) { Get-Content -Raw -LiteralPath $file | ConvertFrom-Json | Out-Null }

# Parse the three changed SVGs as XML.
$svgs = @('docs/ui-plan/wireframes/02-room-browser.svg','docs/ui-plan/wireframes/05-my-info-and-character.svg','docs/ui-plan/wireframes/07-store.svg'); foreach ($svg in $svgs) { [xml](Get-Content -Raw -LiteralPath $svg) | Out-Null }

# Review every retained Equipment and Qualification line.
rg -n -i '\bequipment\b' README.md docs/design docs/schema-notes docs/candidate_flows docs/story docs/ui-plan -g '*.md' -g '*.svg'
rg -n -i '\bqualifications?\b' README.md docs/design docs/schema-notes docs/candidate_flows docs/story docs/ui-plan -g '*.md' -g '*.svg'

# Whitespace, prohibited paths, and final allowed-scope checks.
git -c safe.directory=C:/Users/madis/Documents/repos/Server_Repair_TCG_Multiplayer diff --check
git -c safe.directory=C:/Users/madis/Documents/repos/Server_Repair_TCG_Multiplayer diff --cached --check
git -c safe.directory=C:/Users/madis/Documents/repos/Server_Repair_TCG_Multiplayer diff --quiet HEAD -- docs/design/decisions/FROZEN_RULES.md docs/design/decisions/UNFROZEN_RULES.md docs/design/decisions/CANDIDATE_DECISIONS.md viewer
git -c safe.directory=C:/Users/madis/Documents/repos/Server_Repair_TCG_Multiplayer status --porcelain=v1
```

The schema-reference, stable-`$id`, candidate-domain-reference, TASK-007 changed-path allowlist, and SVG/PNG raw-pixel comparisons used dependency-free recursive Node or PowerShell checks over the exact inventories reported above. Their results were respectively **300/300**, **24/24**, **85/85**, **92/92**, and **3/3**.

### Changed files

Root, task, and decision state (5):

- `README.md`
- `docs/tasks/INDEX.md`
- `docs/tasks/TASK-007-synchronize-approved-gameplay-rules.md`
- `docs/design/decisions/DECISION_INDEX.md`
- `docs/design/decisions/UNSYNCHRONIZED_DECISIONS.md`

Top-level design sources (11):

- `docs/design/00_GAME_ENGINE_OVERVIEW.md`
- `docs/design/01_DATA_ARCHITECTURE.md`
- `docs/design/02_CARD_TYPES.md`
- `docs/design/03_FAULT_CATALOG_V0_1.md`
- `docs/design/04_COMPONENT_CATALOG_V0_1.md`
- `docs/design/05_TESTS_TOOLS_COMMANDS_V0_1.md`
- `docs/design/06_IMPLEMENTATION_AND_CONTENT_VALIDATION.md`
- `docs/design/07_FAULT_BROWSER_AND_SEARCH.md`
- `docs/design/DOCUMENTS_TO_UPDATE.md`
- `docs/design/RECOMMENDED_DATA_MODEL.md`
- `docs/design/RECOMMENDED_PRESETS.json`

Schema notes (3):

- `docs/schema-notes/DOMAIN_SCHEMAS.md`
- `docs/schema-notes/RUNTIME_SCHEMAS.md`
- `docs/schema-notes/SERVER_AUTHORITY.md`

Domain/runtime schemas (16):

- `schemas/domain/card.schema.json`
- `schemas/domain/repair_procedure.schema.json`
- `schemas/domain/repair_ticket.schema.json`
- `schemas/domain/test.schema.json`
- `schemas/domain/validation_procedure.schema.json`
- `schemas/runtime/action_request.schema.json`
- `schemas/runtime/action_result.schema.json`
- `schemas/runtime/fault_state.schema.json`
- `schemas/runtime/game_event.schema.json`
- `schemas/runtime/knowledge_state.schema.json`
- `schemas/runtime/match_state.schema.json`
- `schemas/runtime/player_state.schema.json`
- `schemas/runtime/private_player_view.schema.json`
- `schemas/runtime/public_match_view.schema.json`
- `schemas/runtime/ticket_state.schema.json`
- `schemas/runtime/turn_state.schema.json`

Domain/runtime examples (28):

- `examples/domain/test.memory_diagnostic.json`
- `examples/domain/repair_ticket.memory_no_post.json`
- `examples/runtime/action_request.run_memory_test.json`
- `examples/runtime/action_request.commit_isolation.json`
- `examples/runtime/action_request.document_live.json`
- `examples/runtime/action_request.perform_repair.json`
- `examples/runtime/action_request.publish_closure.json`
- `examples/runtime/action_request.refresh.json`
- `examples/runtime/action_request.search.json`
- `examples/runtime/action_result.isolation_accepted.json`
- `examples/runtime/action_result.isolation_not_supported.json`
- `examples/runtime/action_result.publish_closure.json`
- `examples/runtime/action_result.refresh.json`
- `examples/runtime/action_result.repair_gate_rejected.json`
- `examples/runtime/action_result.search.json`
- `examples/runtime/action_result.stale_revision.json`
- `examples/runtime/game_event.private_evidence.json`
- `examples/runtime/game_event.server_truth.json`
- `examples/runtime/game_event.team_evidence.json`
- `examples/runtime/game_event.worklog_placeholder.json`
- `examples/runtime/game_event.worklog_publication.json`
- `examples/runtime/knowledge_state.team_after_test.json`
- `examples/runtime/match_state.after_closure.json`
- `examples/runtime/player_state.empty_draw.json`
- `examples/runtime/private_player_view.after_test.json`
- `examples/runtime/public_match_view.after_closure.json`
- `examples/runtime/ticket_state.return_verify_close.json`
- `examples/runtime/turn_state.closure_window.json`

Candidate flows (11):

- `docs/candidate_flows/README.md`
- `docs/candidate_flows/v0.0_ex1_board_and_cards.md`
- `docs/candidate_flows/v0.0_ex1_cards_gameplay_examples.md`
- `docs/candidate_flows/v0.0_ex1_decisions.md`
- `docs/candidate_flows/v0.0_ex1_deckbuilding_examples.md`
- `docs/candidate_flows/v0.0_ex1_equipping_examples.md`
- `docs/candidate_flows/v0.0_ex1_full.md`
- `docs/candidate_flows/v0.0_ex1_full_campaign.md`
- `docs/candidate_flows/v0.0_ex1_full_multiplayer.md`
- `docs/candidate_flows/v0.0_ex1_multiplayer_gameplay_examples.md`
- `docs/candidate_flows/v0.0_ex1_story_gameplay_examples.md`

Story sources (6):

- `docs/story/README.md`
- `docs/story/REAL_WORLD_INSPIRATION.md`
- `docs/story/STORY.md`
- `docs/story/gameplay_candidates/APP_SHELL.md`
- `docs/story/gameplay_candidates/CARDLESS_ACTIONS.md`
- `docs/story/gameplay_candidates/CARDS.md`

UI plan and wireframes (8):

- `docs/ui-plan/TODO.md`
- `docs/ui-plan/wireframes/INDEX.md`
- `docs/ui-plan/wireframes/02-room-browser.svg`
- `docs/ui-plan/wireframes/02-room-browser.png`
- `docs/ui-plan/wireframes/05-my-info-and-character.svg`
- `docs/ui-plan/wireframes/05-my-info-and-character.png`
- `docs/ui-plan/wireframes/07-store.svg`
- `docs/ui-plan/wireframes/07-store.png`

Tests (4):

- `tests/helpers/json-schema-validator.mjs`
- `tests/helpers/task-007-semantics.mjs`
- `tests/task-007-document-sync.test.mjs`
- `tests/task-007-schema-contracts.test.mjs`

### Deliberately unresolved and retained boundaries

- Active synchronization entries retained: **none**.
- `SCORE-001` remains unfrozen, including contribution classes/values, visibility, duplicate policy, Root Cause policy, handicap policy, and cooperative aggregation.
- `GEN-001` remains unfrozen; no Ticket Builder, configuration contract, constraint solver, or generation algorithm was added.
- Other production configuration, timer, terminal, Room, spectator, computer-player, statistics, and balance questions remain in `UNFROZEN_RULES.md`.
- *The Quiet Cascade* remains technically unresolved.
- Seven catalog references remain planned rather than materialized public content: `fault.thermal.chassis.overheating`, `component.chassis.server`, `component.pcie.riser`, `component.power.distribution`, `component.storage.sas_ssd`, `component.storage.sata_hdd`, and `test.system.stress`.
- Five workflow IDs remain recommended future contracts rather than current domain objects: `workflow.document.repair_action`, `workflow.document.part_trace`, `workflow.document.verification`, `workflow.escalate.unresolved`, and `workflow.nff.standard`.
