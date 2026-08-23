# Design Migration Map

## Status and authority

This file is an administrative migration map, not a second source of game rules. Normative decisions live in [`decisions/FROZEN_RULES.md`](decisions/FROZEN_RULES.md); the Unfrozen ledger is empty. [`TASK-008`](../tasks/TASK-008-freeze-first-version-foundation.md) controls the final foundation-freeze synchronization; TASK-007 remains historical context.

The former “Documents To Update For Configurable Matches” list predated the 2026-08-22 rule resolutions. The dispositions below record which recommendations were completed in the top-level design pass, which were superseded by TASK-007's more precise contract, and which remain deferred. A disposition does not by itself prove repository-wide synchronization or close an entry in the decision queue.

## Disposition vocabulary

- **Completed — top-level pass:** the named top-level design source was reviewed and synchronized during TASK-007.
- **Superseded by TASK-007:** the old recommendation was too narrow or called the work “later”; TASK-007 now specifies the authoritative migration scope. Completion must be established by TASK-007 verification.
- **Deferred:** the work is product/engine implementation or future-version scope rather than a foundation rule.
- **Still relevant:** the recommendation remains useful but is not a rule or proof of completion.

## Deferred normative documents

### `08_MATCH_CONFIGURATION_AND_RESULTS.md`

**Disposition: Superseded by Frozen Rules.** Scoring, terminal precedence, timers/configuration, and results are resolved in `FROZEN_RULES.md`. Do not create another SHALL-based design contract that duplicates the ledger; create implementation contracts only when building the engine.

### `09_ROOM_LIFECYCLE_AND_COMMANDS.md`

**Disposition: Superseded by Frozen Rules.** Room membership, roles, capacity, host transfer, Ready/start, late joining, retention, rematches, and first-version exclusions are resolved in `FROZEN_RULES.md`. Chat/moderation and exact retention time remain product policy.

## Top-level design review

| File | Disposition | TASK-007 result |
| --- | --- | --- |
| `00_GAME_ENGINE_OVERVIEW.md` | Completed — top-level pass | At TASK-007's boundary, replaced fixed win/draw-loss and one-way lifecycle wording with configurable matches, iterative Diagnosis, evidence-supported Isolation, failed Verify return, immutable Worklog, zero-Action non-scoring closure, frozen card economy, and explicit scoring/generation boundaries. TASK-008 later froze both. |
| `01_DATA_ARCHITECTURE.md` | Completed — top-level pass | Added authored candidates/outcomes/Isolation, Ticket and Knowledge State separation, immutable action/event/Worklog identity, closure/statistical hooks, Repair/Verify rules, first-version invariants, and no Equipment/Qualification runtime state. |
| `02_CARD_TYPES.md` | Completed — top-level pass | Clarified authored Ticket surfaces, diagnostic substitution, Repair gateway, failed Verify, universal Documentation, explicit targets, frozen deck/turn/Search/Refresh, technical Tools, and honor-only Qualifications. |
| `03_FAULT_CATALOG_V0_1.md` | Completed — top-level pass | Technical catalog retained; mixed Test/Repair examples were separated, Ticket authorship/gateway rules were stated, and an unmaterialized planned Fault ID was labeled without renaming it. |
| `04_COMPONENT_CATALOG_V0_1.md` | Completed — top-level pass | Technical catalog retained; Component state was separated from account Equipment, planned IDs were bounded, and automatic generation was deferred at TASK-007's boundary. TASK-008 later froze the Ticket Builder contract. |
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

The migration covered authored candidate/outcome/Isolation/Repair/Verify/closure content; iterative Ticket state; Knowledge State; immutable actions/events and four-category visibility; Worklog placeholders/publication links; Search/Refresh; contribution/score hooks; zero-Action closure statistics and transaction ordering; and player-safe reconnect/results. TASK-008 then specialized scoring hooks to frozen Isolation/Repair slots.

TASK-007 correctly did not define then-unresolved scoring or generation. TASK-008 now synchronizes their approved boundaries without adding Equipment fields or Qualification runtime effects.

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

Generated-Ticket implementation fixtures remain future Ticket Builder work. The frozen contract now requires deterministic seeded snapshots; fixed authored fixtures remain valid.

## Candidate flows, story, and UI planning

**Disposition: Superseded by TASK-007 §§4–5 for synchronization; production design remains Deferred.**

TASK-007 owns correction of the existing non-authoritative candidate-flow replays, full journeys, story candidates, UI labels, and affected wireframes so they no longer demonstrate paid/scoring closure, Equipment loadouts, or mechanical Qualifications. That synchronization does not freeze example-local card balance, story truth, app routes, motion, commerce, Room policy, or a production client.

Future production UI specifications remain deferred for:

- finalized match setup and admitted customization;
- queue virtualization for large configured queues;
- finalized roster/team/clock/connection displays;
- result/statistic presentation and account integration under the frozen visibility/persistence boundary; and
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
- the deterministic Ticket Builder implementation and versioned generation schemas;
- scoring-engine implementation and content balance within the frozen slot policy;
- production Room/setup/results UI; and
- any replacement for the removed Equipment system.

The first-version foundation is now frozen. Stable entity IDs remain public contracts and must not be renamed without an explicit migration task. If implementation exposes a new genuine rules question, record it in the empty Unfrozen ledger before choosing behavior.
