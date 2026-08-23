# Server Repair TCG Multiplayer

An educational, server-authoritative card game about diagnosing and repairing computer-server faults.

Players are technicians, not opposing armies. They compete or cooperate by troubleshooting Repair Tickets accurately and efficiently while learning concepts that transfer to real server work.

## Troubleshooting loop

Every ticket follows the practical repair sequence:

1. Observe symptoms.
2. Form hypotheses.
3. Run tests.
4. Isolate faults and root causes.
5. Perform repairs.
6. Verify recovery.
7. Document the result.

These are evidentiary functions, not seven isolated departments or a permanently one-way state machine. Hypothesize and Test form the iterative heart of Diagnosis; Isolate is the accountable transition to an actionable fault; Repair changes machine state without proving the diagnosis; failed Verify can reopen Diagnosis; and Document preserves the attributable explanation.

The game should reward causal reasoning and effective verification rather than trivia recall or indiscriminate part replacement.

## Knowledge first, cards second

Technical concepts exist as reusable domain data independently of their card representations. Faults, symptoms, components, tools, tests, commands, procedures, validations, and protocols can therefore support:

- playable cards and Repair Tickets;
- the Domain Viewer and future reference libraries;
- educational or interview-study experiences;
- scenario generation and content validation.

Cards are the gameplay and presentation layer through which players interact with this knowledge. Stable domain IDs are public data contracts and should not be renamed without an explicit migration.

## Match direction

The design uses one configurable match system for competitive and cooperative play. Approved directions include:

- a shared queue of jointly actionable Repair Tickets;
- hidden authoritative faults and causal chains;
- authored public candidate Faults and server-authored Evidence outcomes;
- private, team, and public Evidence plus immutable public Worklog chronology;
- accepted, evidence-supported Isolation as the ordinary gateway to Repair;
- failed Verify returning a Ticket to Diagnosis without erasing its history;
- a 30-card first-version deck, five-card opening hand, start-of-turn draw, and two-Action turn;
- Search and Refresh as separately tokenized utility actions;
- incremental Documentation followed by an immediate zero-Action, non-scoring closure transaction;
- server-authoritative actions, clocks, scoring, ticket generation, and disconnection handling;
- Rooms with explicit Player and Spectator roles;
- human and computer-controlled technicians using player-safe information.

A two-player race to 10 Service Points is one recommended preset, not the definition of the game. Exact causal-contribution scoring remains unfrozen, as do the Ticket Builder and several production configuration, timer, terminal, statistics, and balance policies. Ticket closure itself awards no Service Points; it records Player/team closure statistics and settles only whatever causal score events a future approved scoring policy requires.

There is no account/loadout Equipment system. Technical Tools remain domain objects and playable card concepts. Qualifications may recognize milestones as honor badges, but they have no gameplay, access, deck, story, procedure, or matchmaking effect.

Fault causal relationships and causal-chain validation remain part of the domain model. The separate interactive causal-chain visualization has been retired and is not planned work.

## Current state

This repository currently contains:

- approved and unresolved game rules;
- starter technical catalogs and recommended match models;
- synchronized draft domain and runtime schemas with valid and invalid examples;
- a working static Domain Viewer;
- a versioned case-study research system with a completed pilot spanning several troubleshooting subsystems;
- a provisional story foundation with a fictional company, campaign frame, ensemble, voice guide, and story-derived gameplay candidates;
- a non-authoritative, replayable candidate-flow package that combines temporary rules, exact card/deck/Ticket fixtures, complete matches, and landing-to-logout campaign and multiplayer journeys;
- provisional UI planning and original wireframes for the future playable application.

It does not yet contain a playable game engine or multiplayer client. The schemas remain draft contracts, and recommended models remain non-normative where scoring, Ticket generation, or production policy is still unfrozen.

## Design source of truth

Read the design documents in this order:

1. [`docs/design/decisions/DECISION_INDEX.md`](docs/design/decisions/DECISION_INDEX.md) — the authority map, current decision state, lifecycle, and recommended order for finishing the engine.
2. [`docs/design/decisions/FROZEN_RULES.md`](docs/design/decisions/FROZEN_RULES.md) and [`UNFROZEN_RULES.md`](docs/design/decisions/UNFROZEN_RULES.md) — approved behavior and the canonical open-rule inventory.
3. [`docs/design/decisions/CANDIDATE_DECISIONS.md`](docs/design/decisions/CANDIDATE_DECISIONS.md) and [`UNSYNCHRONIZED_DECISIONS.md`](docs/design/decisions/UNSYNCHRONIZED_DECISIONS.md) — proposal/pruning history and the reconciliation ledger.
4. [`docs/design/RECOMMENDED_DATA_MODEL.md`](docs/design/RECOMMENDED_DATA_MODEL.md) and [`RECOMMENDED_PRESETS.json`](docs/design/RECOMMENDED_PRESETS.json) — architectural and balance recommendations, not frozen contracts.
5. [`docs/design/00_GAME_ENGINE_OVERVIEW.md`](docs/design/00_GAME_ENGINE_OVERVIEW.md) through [`07_FAULT_BROWSER_AND_SEARCH.md`](docs/design/07_FAULT_BROWSER_AND_SEARCH.md) — the synchronized foundational vision, architecture, and starter catalogs. Frozen decisions still take precedence.
6. [`docs/design/DOCUMENTS_TO_UPDATE.md`](docs/design/DOCUMENTS_TO_UPDATE.md) — the audited migration ledger, including completed, superseded, deferred, and still-relevant recommendations.

Do not silently turn an unfrozen recommendation into a rule through code, schema, content, or UI behavior.

## Repository guide

- [`docs/design/`](docs/design/) — game vision, living decision sources of truth, technical catalogs, and implementation recommendations.
- [`docs/candidate_flows/`](docs/candidate_flows/) — deliberately non-authoritative example rules, board/card fixtures, audited game replays, focused application flows, and full campaign/multiplayer walkthroughs. Begin with its [`README`](docs/candidate_flows/README.md); use the package to critique structure, not as promoted rules or implementation contracts.
- [`docs/case_studies/`](docs/case_studies/) — versioned research that converts real troubleshooting accounts into lifecycle reductions, domain cross-references, candidate materials, and decision observations. Begin with its [`README`](docs/case_studies/README.md).
- [`docs/story/`](docs/story/) — the working fictional setting, company, campaign frame, characters, voice, real-world inspiration boundary, and story-derived candidate mechanics. Begin with its [`README`](docs/story/README.md).
- [`docs/tasks/`](docs/tasks/) — scoped implementation and research contracts, with [`INDEX.md`](docs/tasks/INDEX.md) identifying the current task state.
- [`docs/ui-plan/`](docs/ui-plan/) — provisional application structure and original visual wireframes.
- [`viewer/`](viewer/) — dependency-free static browser for reusable domain objects; it is not the multiplayer game client.
- [`schemas/`](schemas/) and [`examples/`](examples/) — draft domain and runtime contracts that will evolve with approved rules.

Case studies are evidence-preserving research inputs rather than rule or domain-data authority. Their candidate domain objects, cardless actions, and decision observations must pass through the appropriate schema, validation, or decision lifecycle before becoming part of the game.

Story documents provide narrative context for the gameplay but do not override frozen rules or settle unresolved mechanics. Ideas in `docs/story/gameplay_candidates/` remain candidates until they pass through the same design-decision, schema, validation, and implementation process as other gameplay proposals.

Candidate gameplay flows choose one internally coherent set of temporary answers only to make examples replayable. Their `EX1-*` identifiers, card balance, Ticket outcomes, account state, screens, animation, and full journeys remain fixtures. Any idea worth adopting must return to the normal design-decision, content, schema, story, validation, and implementation lifecycle.

The future playable application is intended to remain separate from the Domain Viewer. The current UI plan proposes a React client with a stable application shell, social room browser, room creation and lobby flows, cosmetic technician identity, honor-badge recognition, and match synchronization. Motion for React (formerly Framer Motion) is proposed for expressive, state-driven game and interface animation while authoritative rules remain outside the UI.

## Domain Viewer

From the repository root:

```powershell
python -m http.server 8080 --directory viewer
```

Then open <http://127.0.0.1:8080/>. Do not open `viewer/index.html` through the `file://` protocol because browsers cannot reliably fetch its JSON content that way.

The viewer currently exposes faults, symptoms, components, tests, tools, commands, repairs, validations, and protocols through search, filtering, sorting, and record details.

After changing `viewer/content/*.json`, rebuild its generated manifest:

```powershell
node viewer/scripts/build-manifest.mjs
```

Do not hand-edit `viewer/content/manifest.json`.
