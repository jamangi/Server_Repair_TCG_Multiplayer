# TASK-009: Build the playable gameplay foundation

## Status

**Completed — 2026-08-23.** The approved Card Definition/Card Instance boundary, deterministic authoritative engine, Ticket Builder, seat-safe simulator, and reproducible automated-game campaign are implemented and validated under `first-version-v1`. No new rule question or hidden-information blocker remains.

## Objective

Build a deterministic, server-authoritative first-version gameplay foundation consisting of:

1. a stable minimum Card Definition catalog derived from existing domain objects;
2. a game engine that can complete fixed authored Repair Tickets under `first-version-v1`;
3. an automated-game harness introduced with the first playable vertical slice;
4. the deterministic constraint-driven Ticket Builder; and
5. a reproducible automated-game campaign whose compact statistics are committed under `/automated_games/`.

The result must support both cooperative and competitive offline computer-player matches without exposing server-only truth to a computer Player. It is an engine/content/simulation task, not a multiplayer client, account system, Room UI, campaign UI, or production deployment task.

## Authority and implementation boundary

- [`FROZEN_RULES.md`](../design/decisions/FROZEN_RULES.md) is normative.
- [`UNFROZEN_RULES.md`](../design/decisions/UNFROZEN_RULES.md) is currently empty. If implementation exposes a genuine new rule question or pressure, record it there and stop only the affected behavior before encoding an answer.
- Recommended models guide architecture but do not override the frozen ledger or versioned schemas.
- Candidate-flow documents are replay fixtures and design probes. Their `EX1-*` IDs, balance, authored outcomes, and card text are not stable content.
- Case studies and `viewer/content` are research/domain inputs, not authority for game rules or hidden Ticket outcomes.
- Preserve `viewer/` as the static GitHub Pages application root. Do not couple the engine runtime or secret Ticket truth to a browser-delivered viewer pack.
- Prefer dependency-free JavaScript/Node modules. Do not add a framework, backend, database, package manager dependency, or build tool unless a separately approved need requires it.

## Required reading, kept intentionally scoped

Every builder must read `AGENTS.md`, the root `README.md`, this task, [`schemas/README.md`](../../schemas/README.md), the decision index, Frozen Rules, and the empty Unfrozen ledger completely before changing code. Then read only the item-specific inputs below before that milestone. This staged reading order avoids loading unrelated large research and story packages.

### Card contracts and starter Cards

- [`card-contract-and-build-order.md`](../improvement_analysis/card-contract-and-build-order.md) — approved definition/instance boundary, authoritative-server rule, illustration resolution, version pinning, and executable contract.
- [`02_CARD_TYPES.md`](../design/02_CARD_TYPES.md) — intended card families and the difference between technical concepts and playable affordances; Frozen Rules still controls any mismatch.
- Card Architecture and Major Layers in [`01_DATA_ARCHITECTURE.md`](../design/01_DATA_ARCHITECTURE.md) — separation of domain, card, scenario, runtime, and rules-service layers.
- [`card.schema.json`](../../schemas/domain/card.schema.json), [`card_instance.schema.json`](../../schemas/runtime/card_instance.schema.json), and [`card.memory_diagnostic.json`](../../examples/domain/card.memory_diagnostic.json) — current machine-readable contracts and the inheritance ambiguity that must be replaced deliberately.
- Relevant `viewer/content/*.json` records only — stable technical definitions and illustrations referenced by the selected starter cards. Do not load unrelated records or edit the generated manifest by hand.
- Card grammar/catalog sections of [`v0.0_ex1_board_and_cards.md`](../candidate_flows/v0.0_ex1_board_and_cards.md) and the two replays in [`v0.0_ex1_cards_gameplay_examples.md`](../candidate_flows/v0.0_ex1_cards_gameplay_examples.md) — complete behavioral fixtures for cost, target, disposition, recovery, and deck arithmetic; do not promote `EX1-*` identifiers.

### Game engine

- [`00_GAME_ENGINE_OVERVIEW.md`](../design/00_GAME_ENGINE_OVERVIEW.md) — concise engine/lifecycle explanation subordinate to Frozen Rules.
- [`RECOMMENDED_DATA_MODEL.md`](../design/RECOMMENDED_DATA_MODEL.md) — recommended state/service boundaries, immutable identities, projections, queue, closure, and results.
- Every file in `schemas/runtime/` and the corresponding `examples/runtime/` fixtures — current authoritative state, intent/result, event, projection, and closure contracts. Give special attention to the updated [`ticket_state.schema.json`](../../schemas/runtime/ticket_state.schema.json).
- [`RUNTIME_SCHEMAS.md`](../schema-notes/RUNTIME_SCHEMAS.md) — semantic invariants that JSON Schema alone cannot enforce.
- The complete candidate gameplay examples — deterministic end-to-end acceptance behavior, including failed Verify, Documentation recovery, private/team Evidence, zero-Action closure, scoring, and zone reconciliation.
- Frozen behavior matrix in [`06_IMPLEMENTATION_AND_CONTENT_VALIDATION.md`](../design/06_IMPLEMENTATION_AND_CONTENT_VALIDATION.md) — minimum behavior-test inventory.

### Ticket Builder

- Frozen Rules §18 — complete normative generation contract.
- [`repair_ticket.schema.json`](../../schemas/domain/repair_ticket.schema.json), [`DOMAIN_SCHEMAS.md`](../schema-notes/DOMAIN_SCHEMAS.md), and [`repair_ticket.memory_no_post.json`](../../examples/domain/repair_ticket.memory_no_post.json) — shared output shape for fixed and generated Tickets.
- Ticket solvability and causal validation in [`06_IMPLEMENTATION_AND_CONTENT_VALIDATION.md`](../design/06_IMPLEMENTATION_AND_CONTENT_VALIDATION.md) — required semantic oracle, causal DAG checks, and failure behavior.
- Ticket source/generation sections of [`RECOMMENDED_DATA_MODEL.md`](../design/RECOMMENDED_DATA_MODEL.md) and [`RECOMMENDED_PRESETS.json`](../design/RECOMMENDED_PRESETS.json) — recommended configuration/version boundary and representative match settings.
- Only the necessary records from `viewer/content/*.json`, especially Faults, causal edges, Symptoms, Tests, Commands, Repairs, Verifications, Components, Tools, and Protocols — immutable authored input set pinned by `content_version`.
- The six Ticket fixture sections in the candidate board-and-cards document — examples of complete scenario shape, never a source of stable production IDs or unsupported real-world outcomes.

### Automated games

- Frozen Rules §§4, 15, 19, and 20 — computer-player information limits, terminal precedence, multiplayer scope, and required statistics.
- Both candidate gameplay replays and their final-state audits — scripted regression cases for cooperative and competitive play.
- The accepted engine, card, Ticket Builder, and projection contracts — the simulator must call the same public legal-intent boundary as any future client or computer Player.
- Recommended presets — reusable setting groups. Intentionally endless configurations require an offline cap and must not fabricate a gameplay winner.

## Required implementation order

### Milestone 0 — synchronize approved contracts

Approval prerequisite: **Completed 2026-08-23.** Do not reopen the approved direction through implementation convenience; use the decision lifecycle if genuine pressure appears.

1. Update Card Definition, Card Instance, related runtime schemas, examples, and semantic tests together.
2. Enforce that Card Instances are authoritative server state: clients submit identifier-based intents, never trusted owner/controller/zone mutations or replacement instances.
3. Derive the actor from the authenticated connection, validate any request `player_id`, reject unexpected mutation fields, and permit state changes only through validated server transitions and immutable events.
4. Add a versioned Ticket Builder configuration/result contract and pin immutable domain input, generator, seed, produced Ticket snapshots, and structured failure diagnostics.
5. Pin the immutable card catalog at the Match or Ready/deck-snapshot boundary.
6. Preserve existing schema `$id` values unless the approved plan explicitly defines a migration.

Do not continue when the approved contract would require behavior absent from or conflicting with Frozen Rules. Record that question in the Unfrozen ledger.

### Milestone 1 — smallest complete vertical slice

1. Author the smallest stable Card Definition set and fixed Ticket set that can exercise Test, accepted/rejected Isolation, Repair gating, passing/failing Verify, Document Live, closure, scoring, Search, and Refresh.
2. Base each Card on explicit stable domain references. Do not infer card cost, effect, balance, or rules text directly from a domain object.
3. Require every published card to resolve an illustration and alt text through the approved card-specific/primary-reference policy.
4. Implement pure deterministic engine transitions from `(state, validated intent)` to `(new state, result, events)`.
5. Keep system actions cardless and keep server-only truth out of projections and computer-player input.
6. Use fixed authored Tickets first. Do not make the engine depend on Ticket Builder availability.

### Milestone 2 — automated-game harness

1. Add a scripted policy that reproduces the two candidate replay behaviors without relying on hidden truth.
2. Add at least one deterministic seat-safe baseline policy that selects only from the same legal-action projection available to its Player.
3. Use seeded randomness and a virtual authoritative clock. A repeated run with identical versions, settings, policies, and seed must produce the same result and replay digest.
4. Introduce per-match turn/closure caps for offline simulation safety. A cap stop is not a gameplay winner.
5. Run the harness in tests from this milestone onward; do not postpone it until all cards and Builder work are complete.

### Milestone 3 — deterministic Ticket Builder

1. Canonically order eligible authored inputs before seeded selection.
2. Apply all hard constraints without silent relaxation.
3. Validate referenced IDs, causal DAG shape, authored outcomes, Isolation, Repair, Verify, closure, visibility, and legal-card-pool reachability.
4. Produce complete Repair Ticket definition snapshots only after validation.
5. Return no partial Ticket on unsatisfiable input. Return stable, structured diagnostics and optionally attempt only an explicitly configured fallback as a separate auditable generation.
6. Persist configuration, generator version, content version, seed, fallback attempt identity, and output snapshots.
7. Integrate setup and queue replenishment without changing the engine path used for fixed Tickets.

### Milestone 4 — representative stable Card catalog

1. Expand from the minimum vertical-slice set across Test/Command, Repair, and Verify cards first; add Tool, Component, Protocol, or Workflow cards only where their exact first-version effect is typed and testable.
2. Validate all stable references, illustration resolution, printed cost range, exact targets, prerequisites, disposition, and deck legality.
3. Prove that each supported Ticket/preset card pool contains at least one complete legal solution path.
4. Do not add mechanical Technician cards, Ticket claims, private-state attacks, Equipment, Qualification effects, or costs above two.

### Milestone 5 — full automated-game campaign

Run a reproducible matrix that includes, at minimum:

- cooperative and competitive modes;
- fixed and generated Ticket sources;
- finite `Q = 0` queue-empty matches and replenishing `Q > 0` score-target matches;
- one, two, and representative multi-Player cooperative seats plus at least two competitive seats where valid;
- multiple seeds per setting group;
- every supported baseline computer policy and at least one mixed-policy group; and
- deliberate unsatisfiable Builder, proven-stalemate, invalidation, and simulation-cap fixtures.

Do not use account progression, hidden opponent Evidence, server-only causal truth, or client-only counters to choose computer actions or compute results.

## Automated-game artifacts

Commit compact, reproducible reports using this structure:

```text
automated_games/
|-- README.md
`-- <campaign_id>/
    |-- settings.json
    |-- matches.json
    |-- summary.json
    |-- summary.md
    `-- exceptions/
        `-- <match_id>.json
```

- `settings.json` defines each setting group once: rules/card/content/generator versions, Ticket source/configuration, collaboration and terminal settings, seats, decks/card pool, policy versions, caps, and seed range.
- `matches.json` contains one compact row per match referencing its setting-group ID. Each row records seed, replay digest, outcome, every terminal reason, success/failure classification, rounds/turns, Tickets closed/quarantined, elapsed virtual time, starting/final/net Service Points for every Player/team, contribution counts, rejected intents, disconnects/concessions, and stall classification.
- `summary.json` contains machine-readable totals and distributions by setting group and overall.
- `summary.md` explains the run for human review without repeating settings for every match.
- `exceptions/` stores enough replay/state/diagnostic detail to reproduce only stalled, capped, invalid, nondeterministic, or otherwise failed matches. Successful matches remain reproducible from the version/setting/seed row and digest.

The summary must answer explicitly:

1. How many matches started, succeeded, failed, invalidated, reached proven stalemate, stopped at a simulation cap, or exhibited a policy stall?
2. Did any match have no legal **progress** move, as distinct from the always-legal Pass action?
3. How many turns did each match take, and what are the per-group minimum, median, percentile, maximum, and mean?
4. How many Service Points did every participant/team start with, finish with, and gain?
5. Which settings and seeds produced each result, grouped without redundant per-match setting copies?
6. Did any identical-input rerun produce a different Ticket snapshot, event/replay digest, outcome, score, or turn count?

## Required validation

Add behavior-focused tests before depending on each implementation surface. At minimum verify:

- every schema and content file parses and validates;
- stable references and typed reference roles resolve;
- fault graphs are acyclic and Builder constraints operate on the validated actionable DAG;
- deck size/copy limits, opening draw, start-turn draw, Actions, 0-Action same-name limit, zones, Search, Refresh, and recovery reconcile every Card Instance exactly once;
- stale/illegal intents reject before payment and accepted paid actions create the required public Worklog placeholder;
- Evidence visibility, projections, reconnect, and computer-player input never leak server-only or opponent-private data;
- Isolation, Repair, Verify return, Documentation, closure, causal scoring, queue reconciliation, terminal precedence, and statistics match Frozen Rules;
- fixed and generated Tickets pass the same solvability oracle;
- identical Builder inputs are snapshot-identical and unsatisfiable inputs return no partial Ticket;
- scripted candidate replay audits reconcile their action, score, resource, event, and final-zone arithmetic;
- automated campaigns are deterministic and every exception artifact reproduces; and
- the committed statistics agree with recomputation from authoritative match results and event ledgers.

Run and report at least:

```powershell
node --check <every new or changed JavaScript module>
node --test tests/*.mjs
node <automated-game entry point> --verify-report automated_games/<campaign_id>
git diff --check
```

If the engine changes the Domain Viewer, also run the four baseline viewer commands in `AGENTS.md`. Otherwise leave `viewer/` unchanged and state that viewer baseline commands were not additionally required.

Record every verification command, exit code, pass/fail/skip totals, automated match totals, changed files, and unresolved items in this task's completion record.

## Allowed implementation paths after approval

- `src/**`
- `content/**`
- `schemas/**`
- `examples/**`
- `tests/**`
- `tools/**`
- `automated_games/**`
- `docs/schema-notes/**`
- `docs/improvement_analysis/card-contract-and-build-order.md`
- `docs/design/decisions/UNFROZEN_RULES.md` only when a genuine new rule/pressure is discovered
- `docs/tasks/INDEX.md`
- `docs/tasks/TASK-009-gameplay-foundation.md`
- `README.md`

Do not modify `viewer/**`, story, case-study research, candidate-flow source fixtures, Frozen Rules, recommended models, UI plans, or completed task records unless a separately approved synchronization/migration changes the allowed scope. Tests may consume candidate fixtures without rewriting them.

## Prohibited work

- No multiplayer transport, Room server, matchmaking, account/progression system, campaign runtime, playable client, UI framework, database, production deployment, chat, moderation, or monetization.
- No silent promotion of `EX1-*` IDs, candidate balance, case-study gaps, or authored example outcomes into stable domain/card/Ticket content.
- No rule invented through a schema enum, generic effect string, AI heuristic, or failing test.
- No engine access to client UI state and no computer-policy access to authoritative secrets.
- No unconstrained generated prose, silently relaxed Ticket guarantee, unseeded authoritative randomness, or partial Ticket on Builder failure.
- No arbitrary `runtime_tags`, `counters`, or effect-parameter bags used as undocumented gameplay behavior.

## Completion boundary

TASK-009 is complete only when all five milestones pass, the approved contracts are synchronized, fixed and generated matches finish through the same engine, the automated report is committed and independently reproducible, all tests pass, and no unresolved rule or hidden-information leak remains.

## Completion record — 2026-08-23

### Outcome

All five milestones and the approved contract synchronization are complete:

- a versioned 11-card typed starter catalog and two legal 30-card deck snapshots exercise Diagnostic, Repair, Verify, Search, Refresh, Documentation, recovery, and a genuine no-repair stalemate;
- three stable authored Ticket templates cover a direct cable fault, a single storage-member fault, and a failed-Verify return followed by isolation and repair of a distinct degraded-array fault;
- the dependency-free engine applies authenticated identifier-based intents through deterministic server transitions, emits immutable public events, maintains private authoritative truth, and exposes seat-safe projections and legal intents;
- fixed and generated Tickets use the same exact-target Repair gate, closure path, scoring path, and solvability oracle;
- `ticket-builder-v1` canonically orders inputs, applies seeded weighted selection and every hard constraint, emits only complete snapshots, records separate fallback attempts, and returns structured no-partial-Ticket diagnostics when unsatisfiable; and
- the automated harness calls the same public intent boundary as a future client, uses seeded policies and a virtual clock, retains compact reports, and byte-verifies campaign regeneration.

The implementation deliberately does not add a playable client, multiplayer transport, account/progression system, campaign runtime, backend deployment, or any other prohibited later-task surface. `viewer/**` is unchanged, and no `EX1-*` candidate identifier was promoted into stable content. `UNFROZEN_RULES.md` remains empty.

### Automated campaign

Campaign `task-009-foundation-v1` requested 22 deterministic runs across 11 setting groups and two seeds per group:

- 20 matches started and 12 completed successfully;
- 2 Builder-unsatisfiable fixtures stopped before match creation;
- 2 matches were administratively invalidated;
- 2 reached a proven stalemate;
- 2 stopped at the offline simulation cap;
- 2 exhibited the deliberate pass-only policy stall;
- 6 matches encountered at least one state with no legal progress move when the always-legal Pass action was excluded; and
- 22 identical-input reruns produced 0 mismatches across Ticket snapshots, replay digests, outcomes, scores, and turn counts.

The matrix covers cooperative and competitive play, fixed and generated Tickets, finite `Q = 0` and replenishing `Q > 0` queues, one through four seats where valid, every supported baseline policy, mixed policies, failed Verify reopening Diagnosis, and every required deliberate exception. Started matches took 3–25 turns (minimum 3, median 8.5, nearest-rank p95 25, maximum 25, mean 9.55). Per-seed Player/team starting, final, and net Service Points are recorded in `summary.json` and grouped for review in `summary.md`.

### Final verification

All commands were run from the repository root against the completed working tree:

| Command | Exit | Result |
| --- | ---: | --- |
| PowerShell enumeration invoking `node --check` for every changed or new `.mjs`/`.js` file | 0 | 23/23 modules passed syntax checking |
| `node --test tests/task-009-card-contracts.test.mjs` | 0 | 8 passed, 0 failed, 0 skipped |
| `node --test tests/task-009-ticket-builder.test.mjs` | 0 | 11 passed, 0 failed, 0 skipped |
| `node --test tests/task-009-engine.test.mjs` | 0 | 12 passed, 0 failed, 0 skipped |
| `node --test tests/task-009-simulation-report.test.mjs` | 0 | 5 passed, 0 failed, 0 skipped |
| `node --test tests/task-009-automated-campaign.test.mjs` | 0 | 5 passed, 0 failed, 0 skipped |
| `node --test tests/*.mjs` | 0 | 74 passed, 0 failed, 0 skipped |
| `node tools/run-automated-games.mjs --verify-report automated_games/task-009-foundation-v1` | 0 | 22 rows verified: 12 successes, 10 retained exceptions, 0 deterministic mismatches |
| `git diff --check` | 0 | no whitespace errors |

The four Domain Viewer baseline commands were not additionally required because no file under `viewer/**` changed. The existing TASK-001 acceptance count and TASK-007 schema registry assertions were synchronized to the already-present repository corpus/contracts; they do not change viewer behavior.

### Changed-file inventory

The completed task changes 66 files, all within its allowlist:

- root and task documentation: `README.md`, `docs/tasks/INDEX.md`, `docs/tasks/TASK-009-gameplay-foundation.md`, and `docs/schema-notes/{DOMAIN_SCHEMAS,RUNTIME_SCHEMAS,SERVER_AUTHORITY}.md`;
- stable gameplay pack: `content/gameplay-v1/{card-catalog,decks,domain-snapshot,ticket-templates}.json`;
- schemas: `schemas/README.md`, `schemas/domain/{card,repair_ticket,ticket_builder_configuration,ticket_builder_result}.schema.json`, and `schemas/runtime/{action_request,action_result,card_instance}.schema.json`;
- examples: `examples/domain/card.memory_diagnostic.json`, `examples/domain/repair_ticket.memory_no_post.json`, four `ticket_builder_configuration.*.json` fixtures, three `ticket_builder_result.*.json` fixtures, and `examples/runtime/match_state.after_closure.json`;
- Builder: `src/builder/{canonical,ticket-builder,ticket-solvability}.mjs`;
- engine: `src/engine/{catalogs,determinism,engine,events,index,invariants,projections}.mjs`;
- simulation: `src/simulation/{artifacts,campaign,policies,report,simulator}.mjs` and `tools/run-automated-games.mjs`;
- tests: `tests/task-001-validation-protocol-tabs.acceptance.mjs`, `tests/task-007-schema-contracts.test.mjs`, and the five `tests/task-009-*.test.mjs` suites;
- report guide and compact campaign artifacts: `automated_games/README.md`, `automated_games/task-009-foundation-v1/{settings,matches,summary}.json`, `summary.md`, and 10 expanded exception files covering the two seeds for each Builder-unsatisfiable, proven-stalemate, administrative-invalidation, simulation-cap, and policy-stall fixture.

### Unresolved items

None. All required validation resolves successfully, the committed report is independently reproducible, the viewer deployment boundary is preserved, and the task introduces no unapproved gameplay rule.
