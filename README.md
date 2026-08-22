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
- public Worklogs plus private, team, and public evidence;
- server-authoritative actions, clocks, scoring, ticket generation, and disconnection handling;
- Rooms with explicit Player and Spectator roles;
- human and computer-controlled technicians using player-safe information.

A two-player race to 10 Service Points is one recommended preset, not the definition of the game. Many details of scoring, card economy, turn structure, targeting, and terminal conditions remain open for design and playtesting.

Fault causal relationships and causal-chain validation remain part of the domain model. The separate interactive causal-chain visualization has been retired and is not planned work.

## Current state

This repository currently contains:

- approved and unresolved game rules;
- starter technical catalogs and recommended match models;
- draft domain and runtime schemas with examples;
- a working static Domain Viewer;
- a versioned case-study research system with a completed pilot spanning several troubleshooting subsystems;
- a provisional story foundation with a fictional company, campaign frame, ensemble, voice guide, and story-derived gameplay candidates;
- provisional UI planning and original wireframes for the future playable application.

It does not yet contain a playable game engine or multiplayer client. Some schemas and older design documents predate the configurable-match rules and require deliberate migration before they can be treated as final implementation contracts.

## Design source of truth

Read the design documents in this order:

1. [`docs/design/decisions/DECISION_INDEX.md`](docs/design/decisions/DECISION_INDEX.md) — the authority map, current decision state, lifecycle, and recommended order for finishing the engine.
2. [`docs/design/decisions/FROZEN_RULES.md`](docs/design/decisions/FROZEN_RULES.md) and [`UNFROZEN_RULES.md`](docs/design/decisions/UNFROZEN_RULES.md) — approved behavior and the canonical open-rule inventory.
3. [`docs/design/decisions/CANDIDATE_DECISIONS.md`](docs/design/decisions/CANDIDATE_DECISIONS.md) and [`UNSYNCHRONIZED_DECISIONS.md`](docs/design/decisions/UNSYNCHRONIZED_DECISIONS.md) — proposed decisions, pruned ideas, and the active reconciliation queue.
4. [`docs/design/RECOMMENDED_DATA_MODEL.md`](docs/design/RECOMMENDED_DATA_MODEL.md) and [`RECOMMENDED_PRESETS.json`](docs/design/RECOMMENDED_PRESETS.json) — architectural and balance recommendations, not frozen contracts.
5. [`docs/design/00_GAME_ENGINE_OVERVIEW.md`](docs/design/00_GAME_ENGINE_OVERVIEW.md) through [`07_FAULT_BROWSER_AND_SEARCH.md`](docs/design/07_FAULT_BROWSER_AND_SEARCH.md) — the foundational vision, architecture, and starter catalogs. Later frozen decisions take precedence where they differ.
6. [`docs/design/DOCUMENTS_TO_UPDATE.md`](docs/design/DOCUMENTS_TO_UPDATE.md) — the migration map for bringing older documents and schemas into alignment.

Do not silently turn an unfrozen recommendation into a rule through code, schema, content, or UI behavior.

## Repository guide

- [`docs/design/`](docs/design/) — game vision, living decision sources of truth, technical catalogs, and implementation recommendations.
- [`docs/case_studies/`](docs/case_studies/) — versioned research that converts real troubleshooting accounts into lifecycle reductions, domain cross-references, candidate materials, and decision observations. Begin with its [`README`](docs/case_studies/README.md).
- [`docs/story/`](docs/story/) — the working fictional setting, company, campaign frame, characters, voice, real-world inspiration boundary, and story-derived candidate mechanics. Begin with its [`README`](docs/story/README.md).
- [`docs/tasks/`](docs/tasks/) — scoped implementation and research contracts, with [`INDEX.md`](docs/tasks/INDEX.md) identifying the current task state.
- [`docs/ui-plan/`](docs/ui-plan/) — provisional application structure and original visual wireframes.
- [`viewer/`](viewer/) — dependency-free static browser for reusable domain objects; it is not the multiplayer game client.
- [`schemas/`](schemas/) and [`examples/`](examples/) — draft domain and runtime contracts that will evolve with approved rules.

Case studies are evidence-preserving research inputs rather than rule or domain-data authority. Their candidate domain objects, cardless actions, and decision observations must pass through the appropriate schema, validation, or decision lifecycle before becoming part of the game.

Story documents provide narrative context for the gameplay but do not override frozen rules or settle unresolved mechanics. Ideas in `docs/story/gameplay_candidates/` remain candidates until they pass through the same design-decision, schema, validation, and implementation process as other gameplay proposals.

The future playable application is intended to remain separate from the Domain Viewer. The current UI plan proposes a React client with a stable application shell, social room browser, room creation and lobby flows, technician identity, and match synchronization. Motion for React (formerly Framer Motion) is proposed for expressive, state-driven game and interface animation while authoritative rules remain outside the UI.

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
