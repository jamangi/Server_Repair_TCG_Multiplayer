# Unsynchronized Decisions

This file is the active reconciliation queue for decisions that overlap, contradict, or require migration in another source.

An entry here does not silently change authority. [`FROZEN_RULES.md`](FROZEN_RULES.md) remains authoritative for approved behavior; [`CANDIDATE_DECISIONS.md`](CANDIDATE_DECISIONS.md) remains non-authoritative for proposed behavior. See [`DECISION_INDEX.md`](DECISION_INDEX.md) for the decision lifecycle.

The 2026-08-22 review synchronized the four decision ledgers internally. The remaining entries are migrations into older design documents, schemas, examples, presets, tests, and the now-superseded assumptions in the candidate-flow fixtures.

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

**Sources:** `docs/candidate_flows/v0.0_ex1_decisions.md` `EX1-RULE-012`; scoring review; `SCORE-001`, `SCORE-002`, `DOC-009`

**Authority during review:** Scoring remains unfrozen; the candidate-flow replay remains a non-authoritative historical fixture

**Fundamental dependency:** [`SCORE-001`](CANDIDATE_DECISIONS.md#score-001)

The example awards the base Ticket point to the Player who publishes the closure bundle and gives one Root Cause point to the first eligible deepest-cause isolator. The review identified that model as too easy to exploit through closure sniping. It must not be copied into implementation, schemas, presets, or new examples as an approved rule.

If `DOC-009` makes closure free or the scoring candidates are approved, the audited replays and their score totals will need a separately scoped rewrite. Until then they remain internally replayable demonstrations of the rejected pressure case.

### SYNC-020 — Equipment and Qualification example assumptions conflict with the new candidates

**Sources:** Candidate-flow `EX1-UI-07`, board/equipment fixtures, and equipping walkthrough; `EQP-001`–`EQP-003`, `QUAL-001`

**Authority during review:** No Equipment or Qualification gameplay model is frozen

**Fundamental dependency:** [`EQP-001`](CANDIDATE_DECISIONS.md#eqp-001) and [`QUAL-001`](CANDIDATE_DECISIONS.md#qual-001)

The example flow uses Qualifications to permit Equipment and deliberately gives Equipment no audited-match Installed object. The new candidate direction instead separates Qualifications from board gameplay and gives each Player a dedicated pre-match Equipment slot whose item is installed at match start.

Do not implement either model until the candidates are approved. If approved, update the candidate-flow board boundary, account fixtures, equipping walkthrough, Ready snapshot, full journeys, and any future account/match schemas together.

## Candidate pressures that are not frozen conflicts

| Candidate | Pressure if approved | Why it is not yet a frozen conflict |
| --- | --- | --- |
| `SCORE-001` | Adds server-only scoring rubric, pending contribution records, and settlement events. | Contribution scoring remains explicitly unfrozen. |
| `SCORE-002` | Replaces the example's closer-owned base reward and old Root Cause balance. | No exact frozen scoring award exists. |
| `DOC-009` | Changes closure bundle from one Action to zero and invalidates replay Action totals. | Frozen §14 deliberately leaves closure cost open. |
| `EQP-001`–`EQP-003` | Adds account loadout state and a starting Installed Equipment zone. | Frozen rules only snapshot generic mechanical loadout state. |
| `QUAL-001` | Removes Equipment/deck gates from Qualifications. | No Qualification rule is frozen. |
| `GEN-001` | Adds bounded random selection and saved random provenance to campaign state. | Frozen rules permit authored or generated initial Tickets. |

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
