# Design Migration Map

## Status and authority

This file is an administrative migration map, not a second source of game rules. Normative decisions live in [`decisions/FROZEN_RULES.md`](decisions/FROZEN_RULES.md); unresolved decisions live in [`decisions/UNFROZEN_RULES.md`](decisions/UNFROZEN_RULES.md). [`TASK-007`](../tasks/TASK-007-synchronize-approved-gameplay-rules.md) is the controlling synchronization contract.

The former “Documents To Update For Configurable Matches” list predated the 2026-08-22 rule resolutions. The dispositions below record which recommendations were completed in the top-level design pass, which were superseded by TASK-007's more precise contract, and which remain deferred. A disposition does not by itself prove repository-wide synchronization or close an entry in the decision queue.

## Disposition vocabulary

- **Completed — top-level pass:** the named top-level design source was reviewed and synchronized during TASK-007.
- **Superseded by TASK-007:** the old recommendation was too narrow or called the work “later”; TASK-007 now specifies the authoritative migration scope. Completion must be established by TASK-007 verification.
- **Deferred:** the work depends on unresolved decisions or is product/engine implementation beyond TASK-007.
- **Still relevant:** the recommendation remains useful but is not a rule or proof of completion.

## Deferred normative documents

### `08_MATCH_CONFIGURATION_AND_RESULTS.md`

**Disposition: Deferred.** Do not create this SHALL-based contract until the remaining scoring, terminal-precedence, timer/configuration, and results questions are resolved. Frozen configuration, queue, first-version card economy, closure, and finite queue-empty results already live in `FROZEN_RULES.md`; this map must not duplicate them normatively.

### `09_ROOM_LIFECYCLE_AND_COMMANDS.md`

**Disposition: Deferred.** Frozen Room membership/role/capacity/concession foundations already live in `FROZEN_RULES.md`, while ownership, host transfer, Ready/start policy, late joining, moderation, retention, and rematch policy remain unresolved. TASK-007 is synchronization, not a new Room-design pass.

## Top-level design review

| File | Disposition | TASK-007 result |
| --- | --- | --- |
| `00_GAME_ENGINE_OVERVIEW.md` | Completed — top-level pass | Replaced fixed win/draw-loss and one-way lifecycle wording with configurable matches, iterative Diagnosis, evidence-supported Isolation, failed Verify return, immutable Worklog, zero-Action non-scoring closure, frozen card economy, and explicit `SCORE-001`/`GEN-001` boundaries. |
| `01_DATA_ARCHITECTURE.md` | Completed — top-level pass | Added authored candidates/outcomes/Isolation, Ticket and Knowledge State separation, immutable action/event/Worklog identity, closure/statistical hooks, Repair/Verify rules, first-version invariants, and no Equipment/Qualification runtime state. |
| `02_CARD_TYPES.md` | Completed — top-level pass | Clarified authored Ticket surfaces, diagnostic substitution, Repair gateway, failed Verify, universal Documentation, explicit targets, frozen deck/turn/Search/Refresh, technical Tools, and honor-only Qualifications. |
| `03_FAULT_CATALOG_V0_1.md` | Completed — top-level pass | Technical catalog retained; mixed Test/Repair examples were separated, Ticket authorship/gateway rules were stated, and an unmaterialized planned Fault ID was labeled without renaming it. |
| `04_COMPONENT_CATALOG_V0_1.md` | Completed — top-level pass | Technical catalog retained; Component state was separated from account Equipment, planned IDs were bounded, and automatic generation language was deferred to `GEN-001`. |
| `05_TESTS_TOOLS_COMMANDS_V0_1.md` | Completed — top-level pass | Technical catalog retained; immutable authored outcomes, temporary substitution, Repair/Verify rules, Documentation basics, and one legacy-ID migration risk were made explicit. |
| `06_IMPLEMENTATION_AND_CONTENT_VALIDATION.md` | Completed — top-level pass | Expanded solvability and behavior validation for the full iterative lifecycle, visibility, Worklog, closure transaction, first-version economy, and policy boundaries without implementing a solver. |
| `07_FAULT_BROWSER_AND_SEARCH.md` | Completed — top-level pass | Separated encyclopedia search from token-based deck Search and protected public candidates and player-safe/live hidden state. |
| `RECOMMENDED_DATA_MODEL.md` | Completed — top-level pass | Reworked as a visibly non-normative, versioned recommendation with Ticket/Knowledge/action/event/Worklog/contribution/closure/player-safe models and no embedded scoring or Ticket Builder policy. |
| `RECOMMENDED_PRESETS.json` | Completed — top-level pass | Added `max_search_tokens`, removed embedded Ticket Builder constraints, and made closure plus unresolved scoring/generation boundaries explicit. |
| `DOCUMENTS_TO_UPDATE.md` | Completed — top-level pass | Replaced the outdated future-work list with this disposition map and current affected-file inventory. |

No stable domain ID was renamed in this pass.

## Schema notes and JSON Schemas

**Disposition: Superseded by TASK-007 §§2 and 6.** The old map described a later configurable-match migration and omitted newly frozen lifecycle, Evidence, Documentation, closure, Equipment, and Qualification requirements. TASK-007 is now the explicit migration scope.

The affected inventory includes:

- `docs/schema-notes/DOMAIN_SCHEMAS.md`
- `docs/schema-notes/RUNTIME_SCHEMAS.md`
- `docs/schema-notes/SERVER_AUTHORITY.md`
- `schemas/domain/repair_ticket.schema.json`
- `schemas/runtime/action_request.schema.json`
- `schemas/runtime/action_result.schema.json`
- `schemas/runtime/card_instance.schema.json` where persistent playable zones need clarification
- `schemas/runtime/fault_state.schema.json`
- `schemas/runtime/game_event.schema.json`
- `schemas/runtime/knowledge_state.schema.json`
- `schemas/runtime/match_state.schema.json`
- `schemas/runtime/player_state.schema.json`
- `schemas/runtime/private_player_view.schema.json`
- `schemas/runtime/public_match_view.schema.json`
- `schemas/runtime/ticket_state.schema.json`
- `schemas/runtime/turn_state.schema.json`
- and any other schema transitively affected by those contracts.

The migration must cover authored candidate/outcome/Isolation/Repair/Verify/closure content; iterative Ticket state; Knowledge State; immutable actions/events and four-category visibility; Worklog placeholders/publication links; Search/Refresh; generic contribution/score hooks; zero-Action closure statistics and transaction ordering; and player-safe reconnect/results.

It must not define `SCORE-001` values/classes or a `GEN-001` builder, add Equipment fields, or give Qualifications runtime representation. Completion belongs in TASK-007's verification report and synchronization queue, not in this map.

## Examples and validation tests

**Disposition: Superseded by TASK-007 §3.** The former generic fixture list was incomplete. TASK-007 now requires the smallest valid/invalid fixtures and tests for:

- accepted and rejected evidence-supported Isolation;
- Repair only after accepted Isolation;
- failed Verify with preserved return to Diagnosis and later success;
- Document Live placeholder enrichment and publication chronology;
- competitive private and cooperative team Evidence;
- stale-revision rejection before payment;
- frozen deck/turn/Search/Refresh behavior and non-loss empty draw;
- zero-Action, non-scoring, statistically attributable closure;
- generic causal contribution and closure-statistic separation; and
- removal of Equipment plus honor-only Qualifications.

Seeded generated-Ticket fixtures are **Deferred** under `GEN-001`. Deterministic fixed authored fixtures remain valid and do not imply a generator algorithm.

## Candidate flows, story, and UI planning

**Disposition: Superseded by TASK-007 §§4–5 for synchronization; production design remains Deferred.**

TASK-007 owns correction of the existing non-authoritative candidate-flow replays, full journeys, story candidates, UI labels, and affected wireframes so they no longer demonstrate paid/scoring closure, Equipment loadouts, or mechanical Qualifications. That synchronization does not freeze example-local card balance, story truth, app routes, motion, commerce, Room policy, or a production client.

Future production UI specifications remain deferred for:

- finalized match setup and admitted customization;
- queue virtualization for large configured queues;
- finalized roster/team/clock/connection displays;
- result/statistic visibility and persistence after those rules are resolved; and
- warnings for potentially long or resource-intensive configurations.

## Engine and product implementation

The former implementation sequence is **Superseded** where it called current schema and projection migration “later.” TASK-007 should proceed in this order:

1. synchronize approved prose and recommended top-level models;
2. synchronize schema notes, schemas, fixtures, and validation tests;
3. correct candidate flows, story candidates, UI planning, and affected wireframes;
4. verify lifecycle, visibility, closure, card/resource arithmetic, Equipment removal, Qualification boundaries, JSON/schema integrity, links, and allowed scope; and
5. close or narrow synchronization entries only after every affected source agrees.

The following remain **Deferred implementation** after TASK-007:

- a playable game engine, multiplayer client, or backend;
- runtime configuration, ticket, score, clock, or termination policy code;
- the `GEN-001` Ticket Builder, constraints, solver, and versioned generator;
- final `SCORE-001` policy and balance;
- production Room/setup/results UI; and
- any replacement for the removed Equipment system.

After synchronization, resolve remaining fundamental rules through the decision lifecycle before building behavior that depends on them. Stable entity IDs remain public contracts and must not be renamed without an explicit migration task.
