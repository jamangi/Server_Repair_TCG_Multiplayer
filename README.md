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

A two-player race to 10 Service Points is one recommended preset, not the definition of the game. The first-version foundation now freezes causal-contribution scoring, deterministic Ticket generation, configuration boundaries, timers, terminal resolution, statistics, multiplayer scope, and Room lifecycle. Ticket closure itself awards no Service Points; it records Player/team closure statistics and settles the eligible one-point Isolation and necessary-Repair slots.

There is no account/loadout Equipment system. Technical Tools remain domain objects and playable card concepts. Qualifications may recognize milestones as honor badges, but they have no gameplay, access, deck, story, procedure, or matchmaking effect.

Fault causal relationships and causal-chain validation remain part of the domain model. The separate interactive causal-chain visualization has been retired and is not planned work.

## Current state

This repository currently contains:

- approved and unresolved game rules;
- starter technical catalogs and recommended match models;
- synchronized draft domain and runtime schemas with valid and invalid examples;
- a version-pinned server gameplay pack with 11 typed Card Definitions, legal 30-card deck snapshots, and three complete storage/RAID Repair Tickets;
- a dependency-free deterministic engine for authenticated intents, private/team/public Evidence, exact Isolation-to-Repair gates, failed Verify returns, Documentation, atomic closure, scoring, queue reconciliation, and offline terminal results;
- a constraint-driven deterministic Ticket Builder with complete-or-none validation, structured diagnostics, and separately audited fallback attempts;
- seat-safe cooperative and competitive computer policies plus a committed 22-run reproducible automated-game campaign;
- a working static GitHub Pages application with the established Domain Library plus a browser-local solo Play slice, deck editor, profile/statistics, validated backup portability, and Worker-authoritative 1–10 Ticket matches;
- a versioned case-study research system with a completed pilot spanning several troubleshooting subsystems;
- a provisional story foundation with a fictional company, campaign frame, ensemble, voice guide, and story-derived gameplay candidates;
- a non-authoritative, replayable candidate-flow package that combines temporary rules, exact card/deck/Ticket fixtures, complete matches, and landing-to-logout campaign and multiplayer journeys;
- provisional UI planning and original wireframes for the future playable application.

The repository now contains both the playable rules-engine foundation and a deliberately scoped player-facing local solo client. It does not yet contain a multiplayer transport/server, Room or account runtime, campaign runtime, cloud persistence, or the production multiplayer client. The first-version rules foundation is frozen; schemas remain draft implementation contracts, and recommended models remain non-normative architecture guidance.

## Design source of truth

Read the design documents in this order:

1. [`docs/design/decisions/DECISION_INDEX.md`](docs/design/decisions/DECISION_INDEX.md) — the authority map, current decision state, lifecycle, and recommended order for finishing the engine.
2. [`docs/design/decisions/FROZEN_RULES.md`](docs/design/decisions/FROZEN_RULES.md) — approved behavior implementations may rely on.
3. [`docs/design/decisions/UNFROZEN_RULES.md`](docs/design/decisions/UNFROZEN_RULES.md) — the remaining open rules, freeze recommendations, and any pressure against frozen rules.
4. [`docs/design/SOLO_PAGES_PROFILE.md`](docs/design/SOLO_PAGES_PROFILE.md) — the derived `solo-pages-v1` implementation profile; it configures the local training client without copying or overriding Frozen Rules.
5. [`docs/design/RECOMMENDED_DATA_MODEL.md`](docs/design/RECOMMENDED_DATA_MODEL.md) and [`RECOMMENDED_PRESETS.json`](docs/design/RECOMMENDED_PRESETS.json) — architectural and balance recommendations, not frozen contracts.
6. [`docs/design/00_GAME_ENGINE_OVERVIEW.md`](docs/design/00_GAME_ENGINE_OVERVIEW.md) through [`07_FAULT_BROWSER_AND_SEARCH.md`](docs/design/07_FAULT_BROWSER_AND_SEARCH.md) — the synchronized foundational vision, architecture, and starter catalogs. Frozen decisions still take precedence.
7. [`docs/design/DOCUMENTS_TO_UPDATE.md`](docs/design/DOCUMENTS_TO_UPDATE.md) — the audited migration ledger, including completed, superseded, deferred, and still-relevant recommendations.

If implementation exposes a new rule question or pressure against frozen behavior, record it in the empty Unfrozen ledger before choosing an answer through code, schema, content, or UI behavior.

## Repository guide

- [`docs/design/`](docs/design/) — game vision, living decision sources of truth, technical catalogs, and implementation recommendations.
- [`docs/candidate_flows/`](docs/candidate_flows/) — deliberately non-authoritative example rules, board/card fixtures, audited game replays, focused application flows, and full campaign/multiplayer walkthroughs. Begin with its [`README`](docs/candidate_flows/README.md); use the package to critique structure, not as promoted rules or implementation contracts.
- [`docs/case_studies/`](docs/case_studies/) — versioned research that converts real troubleshooting accounts into lifecycle reductions, domain cross-references, candidate materials, and decision observations. Begin with its [`README`](docs/case_studies/README.md).
- [`docs/story/`](docs/story/) — the working fictional setting, company, campaign frame, characters, voice, real-world inspiration boundary, and story-derived candidate mechanics. Begin with its [`README`](docs/story/README.md).
- [`docs/tasks/`](docs/tasks/) — scoped implementation and research contracts, with [`INDEX.md`](docs/tasks/INDEX.md) identifying the current task state.
- [`docs/ui-plan/`](docs/ui-plan/) — provisional application structure and original visual wireframes.
- [`viewer/`](viewer/) — the static Pages root: the established reusable Domain Library plus the `solo-pages-v1` local Play experience. It is not the production multiplayer client.
- [`content/gameplay-v1/`](content/gameplay-v1/) — the first immutable server-side gameplay snapshot: selected domain inputs, typed Cards, deck snapshots, and authored Ticket templates. It is deliberately separate from the browser-delivered Viewer pack.
- [`src/`](src/) — the deterministic authoritative engine, Ticket Builder/solvability oracle, and offline simulation/reporting modules.
- [`automated_games/`](automated_games/) — compact committed campaign settings, match rows, recomputed summaries, and exception-only diagnostics.
- [`schemas/`](schemas/) and [`examples/`](examples/) — draft domain, runtime, and local-client contracts that will evolve with approved rules. Start with the [`schema package README`](schemas/README.md) for the domain/runtime boundary and file guide.
- [`docs/improvement_analysis/`](docs/improvement_analysis/) — reviewable implementation and contract proposals that do not change frozen rules or live schemas until approved.

Case studies are evidence-preserving research inputs rather than rule or domain-data authority. Their candidate domain objects, cardless actions, and decision observations must pass through the appropriate schema, validation, or decision lifecycle before becoming part of the game.

Story documents provide narrative context for the gameplay but do not override frozen rules or settle unresolved mechanics. Ideas in `docs/story/gameplay_candidates/` remain candidates until they pass through the same design-decision, schema, validation, and implementation process as other gameplay proposals.

Candidate gameplay flows choose one internally coherent set of temporary answers only to make examples replayable. Their `EX1-*` identifiers, card balance, Ticket outcomes, account state, screens, animation, and full journeys remain fixtures. Any idea worth adopting must return to the normal design-decision, content, schema, story, validation, and implementation lifecycle.

TASK-010 intentionally places Library and local Solo Play behind one static application shell while preserving their distinct purposes. The broader UI plan still describes a future production multiplayer client with social rooms, lobbies, synchronized matches, and server authority; those capabilities are not implied by the browser-local training slice.

## Gameplay foundation

The TASK-009 vertical slice runs entirely in Node and sends every computer decision through the same private Player projection and authenticated legal-intent boundary intended for a future client. Fixed and generated Tickets use the same engine and solvability oracle. Repeating one campaign input compares its Ticket snapshot, replay digest, outcome, score, and turn count.

Run the full behavior suite:

```powershell
node --test tests/*.mjs
```

Independently recompute and verify the committed campaign report:

```powershell
node tools/run-automated-games.mjs --verify-report automated_games/task-009-foundation-v1
```

The committed report covers one-, two-, three-, and four-seat cooperative/competitive settings; fixed and generated Ticket sources; finite and replenishing queues; mixed policies; and deliberate Builder-unsatisfiable, stalemate, invalidation, policy-stall, and simulation-cap fixtures.

## Static Library and local Solo Play

From the repository root:

```powershell
node viewer/scripts/build-play-assets.mjs
python -m http.server 8080 --directory viewer
```

Then open <http://127.0.0.1:8080/>. Do not open `viewer/index.html` through the `file://` protocol because browsers cannot reliably fetch its JSON content that way.

The Library exposes faults, symptoms, components, tests, tools, commands, repairs, validations, and protocols through search, filtering, sorting, and record details. Play provides a versioned local profile, legal 30-card decks, Settings and backup portability, and deterministic finite solo matches. A dedicated module Worker owns each active Match; active Match state is intentionally not resumable or included in exports.

After changing `viewer/content/*.json`, rebuild its generated manifest:

```powershell
node viewer/scripts/build-manifest.mjs
```

Do not hand-edit `viewer/content/manifest.json`.

After changing canonical engine, Builder, gameplay, Play modules, assets, or the vendored runtime, rebuild and verify the staged browser artifact:

```powershell
node viewer/scripts/build-play-assets.mjs
node viewer/scripts/verify-play-assets.mjs
```
