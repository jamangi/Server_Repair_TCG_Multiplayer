# Unsynchronized Decisions

This file is the active reconciliation queue for decisions that overlap, contradict, or require migration in another source.

An entry here does not silently change authority. [`FROZEN_RULES.md`](FROZEN_RULES.md) remains authoritative for approved behavior; [`CANDIDATE_DECISIONS.md`](CANDIDATE_DECISIONS.md) remains non-authoritative for proposed behavior. See [`DECISION_INDEX.md`](DECISION_INDEX.md) for the decision lifecycle.

The 2026-08-22 review synchronized the four decision ledgers internally. The remaining entries are migrations into older design documents, schemas, examples, presets, tests, and superseded candidate-flow fixtures. [`TASK-007`](../../tasks/TASK-007-synchronize-approved-gameplay-rules.md) is the approved synchronization contract for `SYNC-014` through `SYNC-020`.

## Confirmed unsynchronized decisions

### SYNC-014 — Diagnosis loop and returned state

**Sources:** Frozen Rules §§1, 13; older foundational documents and runtime Ticket status

**Authority during review:** Frozen Diagnosis, Repair, and Verify rules

**Fundamental dependency:** Resolved `CROSS-004` and approved `EX1-RULE-009`

Older prose or schemas that present seven permanently ordered stages cannot represent iterative Hypothesize/Test work, evidence-supported Isolation, or failed Verify returning a Ticket to Diagnosis while preserving repair history.

Affected artifacts:

- `docs/design/00_GAME_ENGINE_OVERVIEW.md` through `07_FAULT_BROWSER_AND_SEARCH.md` where stage wording implies a one-way sequence;
- `schemas/runtime/ticket_state.schema.json` status and current Verification state;
- runtime examples, player-safe views, tests, and UI stage presentation.

`TASK-007` must review all top-level `docs/design/` sources, not only files already known to contain one-way wording. It must review `RECOMMENDED_DATA_MODEL.md` for update opportunities and analyze `DOCUMENTS_TO_UPDATE.md` as an outdated migration map without automatically implementing every recommendation it contains.

### SYNC-015 — Authored candidates, Evidence outcomes, and Isolation requirements

**Sources:** Frozen Rules §§11–12; current Ticket and Evidence schemas

**Authority during review:** Frozen authored-candidate and Isolation rules

**Fundamental dependency:** Resolved `HYP-001`, `TST-001`, and `ISO-001`

Current contracts do not yet model the public authored candidate set, the server-only true causal chain and outcome matrix, cited Evidence, authored Isolation requirements, or actionable/deepest classification.

Affected artifacts:

- `schemas/domain/repair_ticket.schema.json`;
- `schemas/runtime/ticket_state.schema.json` and Evidence records;
- Ticket generation/content validation;
- runtime examples, tests, and player-safe projections.

### SYNC-016 — Actions, visibility, Documentation, and Worklog chronology

**Sources:** Frozen Rules §§7–8, 14; current action and event schemas

**Authority during review:** Frozen player-safe visibility and Documentation rules

**Fundamental dependency:** Resolved `OBS-001` and `DOC-001`–`DOC-008`

Current runtime contracts do not fully represent Commit Isolation, Document Live, closure bundles, public placeholders, `TEAM` and `PUBLIC_MATCH`, attached result publication, in-place Worklog enrichment, or distinct action and publication times.

Affected artifacts:

- `schemas/runtime/action_request.schema.json` and `action_result.schema.json`;
- `schemas/runtime/game_event.schema.json`;
- public/private player views and reconnect history;
- Worklog UI, persistence, accessibility projections, and behavior tests.

### SYNC-017 — First-version deck, turn, Search, and Refresh rules

**Sources:** Frozen Rules §§9–10; recommended data model, presets, schemas, and older overview

**Authority during review:** Frozen first-version rules

**Fundamental dependency:** Approved `EX1-RULE-002`–`EX1-RULE-004`

The first-version deck size, copy limit, opening hand, draw cadence, two-Action turn, no hand limit, non-loss empty draw, and utility-resource behavior are now approved. Existing recommendations and contracts must stop presenting them as open or omit required state such as `max_search_tokens`.

Affected artifacts:

- `docs/design/RECOMMENDED_DATA_MODEL.md` and `RECOMMENDED_PRESETS.json`;
- `docs/design/00_GAME_ENGINE_OVERVIEW.md`, `02_CARD_TYPES.md`, and `DOCUMENTS_TO_UPDATE.md`;
- deck, Player, turn, match-configuration, action, and event schemas;
- examples, validation rules, UI, and behavior tests.

### SYNC-018 — Verify eligibility and atomic closure transaction

**Sources:** Frozen Rules §§13–15; current Ticket, match, event, and result contracts

**Authority during review:** Frozen Verify, structured closure, queue reconciliation, and transaction ordering

**Fundamental dependency:** Approved `EX1-RULE-009`, `EX1-RULE-010`, and `EX1-RULE-013`

Current contracts do not represent current passes after the latest relevant Repair, stale-pass invalidation, failed Verify history, mandatory closure membership, atomic score/resource hooks, or termination after the complete transaction.

Affected artifacts:

- Ticket, match, action, event, and result schemas;
- score and contribution ledgers;
- queue reconciliation and termination evaluation;
- examples, tests, result screens, and reconnect behavior.

### SYNC-019 — Candidate-flow closure scoring is no longer an approved direction

**Sources:** `docs/candidate_flows/v0.0_ex1_decisions.md` `EX1-RULE-012`; Frozen Rules §§14–15; unfrozen `SCORE-001`; pruned `SCORE-002`

**Authority during review:** Closure is zero-Action, non-scoring, and statistically attributable; causal-contribution details remain unfrozen

**Fundamental dependency:** [`SCORE-001`](UNFROZEN_RULES.md#score-001)

The example spends one Action on closure, awards the base Ticket point to the Player who publishes the bundle, and gives one Root Cause point to the first eligible deepest-cause isolator. The approved rule instead makes closure cost zero Actions, awards no Service Points for it, and preserves Player/team closure attribution as statistics. The example model must not be copied into implementation, schemas, presets, or new examples.

`TASK-007` must rewrite the Candidate-Frozen Example Profile, audited Action ledgers, score totals, full journeys, and related audits so they no longer remain replayable demonstrations of the rejected pressure case. Because `SCORE-001` remains unfrozen, the revised examples may use a clearly labeled example-local causal rubric but must not promote exact contribution classes or values into schemas or normative rules.

### SYNC-020 — Remove Equipment and reduce Qualifications to honor badges

**Sources:** Frozen Rules §16; candidate-flow `EX1-UI-07`, board/equipment fixtures, equipping walkthrough, full journeys, story candidates, and UI planning

**Authority during review:** The account/loadout Equipment system does not exist; Qualifications are recognition-only honor badges

**Fundamental dependency:** Frozen Equipment-removal and Qualification rules

The example flow uses Qualifications to permit Equipment and models Equipment ownership, Store inventory, Ready snapshots, and possible Installed objects. Story and UI candidates also refer to Equipment or Qualification loadouts. These assumptions now contradict the frozen removal and honor-badge boundary.

`TASK-007` must remove the account/loadout Equipment concept from affected design, story, UI, schema, example, and candidate-flow sources while preserving ordinary technical Tools and real-world uses of the lowercase word “equipment.” It must rewrite Qualification examples as non-mechanical recognition and update the legacy equipping walkthrough into a synchronized account/appearance/recognition flow or another clearly explained retained artifact.

## Accepted decision pressures

| Decision | Synchronization pressure | TASK-007 boundary |
| --- | --- | --- |
| `SCORE-001` | A future score schema may need pending causal contributions and closure settlement. | Keep the rule unfrozen; provide extensible ledgers and example-local values only where required. |
| Frozen zero-Action closure | Invalidates closure Action costs, closer points, replay turns, score totals, and transaction examples. | Synchronize all affected examples and contracts now. |
| Frozen Equipment removal | Invalidates loadout, Store, account, Installed Equipment, qualification-gate, and UI assumptions. | Remove the mechanic; preserve technical Tools. |
| Frozen Qualification boundary | Invalidates permission, unlock, loadout, procedure, and matchmaking effects. | Retain honor-badge recognition only. |
| `GEN-001` | A future Ticket Builder needs constraint configuration, seeded determinism, and generator versioning. | Keep it unfrozen; review recommendations but do not implement or freeze a builder contract in TASK-007. |

<a id="likely-future-unsynchronized-decisions"></a>
## Review disposition of the former queue

The former `SYNC-001`–`SYNC-013` inventory overlaps were removed after duplicate open wording was narrowed or deleted. Their frozen outcomes—completed-resolution replenishment, spectator capacity, clock expiration and pauses, shared Tickets, stale rejection, Ticket-owned progress, visibility defaults, computer knowledge, no-human termination, concession fallback, seat reclamation, and integer core fields—remain in [`FROZEN_RULES.md`](FROZEN_RULES.md).

The former `FUTURE-SYNC-001`–`FUTURE-SYNC-009` pressures were resolved as follows:

- Documentation is mandatory for closure but may occur incrementally.
- Documentation publishes through the approved four-category visibility model.
- Worklog placeholders and later enrichment preserve authoritative chronology.
- Cooperative team Evidence remains available before public Documentation.
- Accepted Isolation is public Ticket progress.
- Diagnosis is an umbrella sub-lifecycle, and accepted Isolation gates ordinary Repair.

Migration work caused by those resolutions is represented by `SYNC-014`–`SYNC-018` rather than leaving already answered design questions marked as future conflicts.

## Resolution record template

Use this shape when adding a synchronization item:

```markdown
### SYNC-NNN — Short title

**Sources:** Frozen section; unfrozen or candidate decision

**Authority during review:** Frozen rule or explicitly stated exception

**Fundamental dependency:** Decision ID

Describe the overlap or contradiction.

Affected artifacts:

- normative decisions;
- schemas and examples;
- presets;
- implementation and tests;
- older design documents.
```

## Synchronization checklist

When the fundamental decision is resolved:

1. Update the frozen or unfrozen rule explicitly.
2. Remove or narrow duplicate open wording.
3. Update affected schemas, examples, and presets.
4. Add behavior-focused tests before implementation relies on the new rule.
5. Update older design documents in a separately reviewed pass.
6. Record migrations for persisted or transmitted data.
7. Remove the active entry only after every affected source agrees; Git history preserves its former state.
