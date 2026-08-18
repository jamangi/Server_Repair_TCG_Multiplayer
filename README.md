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
- provisional UI planning and original wireframes for the future playable application.

It does not yet contain a playable game engine or multiplayer client. Some schemas and older design documents predate the configurable-match rules and require deliberate migration before they can be treated as final implementation contracts.

## Design source of truth

Read the design documents in this order:

1. [`docs/design/FROZEN_RULES.md`](docs/design/FROZEN_RULES.md) — approved behavior that implementations and tests may rely on.
2. [`docs/design/UNFROZEN_RULES.md`](docs/design/UNFROZEN_RULES.md) — the canonical inventory of decisions still requiring design or playtesting.
3. [`docs/design/RECOMMENDED_DATA_MODEL.md`](docs/design/RECOMMENDED_DATA_MODEL.md) and [`RECOMMENDED_PRESETS.json`](docs/design/RECOMMENDED_PRESETS.json) — architectural and balance recommendations, not frozen contracts.
4. [`docs/design/00_GAME_ENGINE_OVERVIEW.md`](docs/design/00_GAME_ENGINE_OVERVIEW.md) through [`07_FAULT_BROWSER_AND_SEARCH.md`](docs/design/07_FAULT_BROWSER_AND_SEARCH.md) — the foundational vision, architecture, and starter catalogs. Later frozen decisions take precedence where they differ.
5. [`docs/design/DOCUMENTS_TO_UPDATE.md`](docs/design/DOCUMENTS_TO_UPDATE.md) — the migration map for bringing older documents and schemas into alignment.

Do not silently turn an unfrozen recommendation into a rule through code, schema, content, or UI behavior.

## Repository guide

- [`docs/design/`](docs/design/) — game vision, rules, technical catalogs, and implementation recommendations.
- [`docs/ui-plan/`](docs/ui-plan/) — provisional application structure and original visual wireframes.
- [`viewer/`](viewer/) — dependency-free static browser for reusable domain objects; it is not the multiplayer game client.
- [`schemas/`](schemas/) and [`examples/`](examples/) — draft domain and runtime contracts that will evolve with approved rules.

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
