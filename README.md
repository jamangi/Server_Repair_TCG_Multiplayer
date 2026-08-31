# Server Repair TCG Multiplayer

An educational, server-authoritative card game about diagnosing and repairing computer-server faults.

Players are technicians, not opposing armies. They compete or cooperate by troubleshooting Repair Tickets accurately and efficiently while learning concepts that transfer to real server work.

## Play now

Open the [Server Repair GitHub Pages application](https://jamangi.github.io/Server_Repair_TCG_Multiplayer/) and select **Play**. New technicians can start with the deterministic **Troubleshooting fundamentals** tutorial, then replay the failed-Verify recovery tutorial from Home or Settings. No installation, local server, account, or sign-in is required.

The current game is a browser-local solo and Story training client. Decks, profile choices, settings (including app-wide sound-effect volume), statistics, and durable Story checkpoints stay in that browser unless exported from Settings. An active Match is intentionally not resumable after leaving or reloading it; Story restarts that configured Match from its pre-Match checkpoint instead of pretending to restore engine state.

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
- a version-pinned playable pack with 83 typed Card Definitions: all 50 current Test/Command diagnostics in the Global Bench plus 18 Repairs and 15 Verifications required by 18 supported causal fingerprints across storage, memory, power, boot, thermal, network, compute, firmware, management, and related paths;
- 104 reviewed canonical night-shift illustrations: 71 domain-owned playable-action images inherited by Cards and 33 public-Symptom panoramas inherited by generated Tickets without hidden-Fault input;
- a dependency-free deterministic engine for authenticated intents, private/team/public Evidence, exact Isolation-to-Repair gates, failed Verify returns, Documentation, atomic closure, scoring, queue reconciliation, and offline terminal results;
- a part-assembling deterministic Ticket Builder with exact diagnostic/outcome and active-deck resource proof, complete-or-none validation, unique-before-repeat queues, balanced repetition, structured diagnostics, and reproducible provenance;
- seat-safe cooperative and competitive computer policies plus the frozen 22-run foundation campaign and a 13-run expanded-content campaign covering every supported fingerprint and a multi-Ticket resource path;
- a working static GitHub Pages application with the established Domain Library plus a browser-local solo Play slice, 50-item Relevant/Global Diagnostic Bench, coverage-aware deck editor and Home preflight, profile/statistics, validated backup portability, Worker-authoritative 1–10 Ticket matches, deliberate Documentation previews, read-only archived Ticket records, and one catalog-driven procedural Web Audio service with a portable 0–100 volume setting;
- a deterministic declarative Story runtime with strict typed statements and conditions, bounded jump/call/return control flow, layered display commands, stable checkpoint digests, normalized Match boundaries, atomic v4 local/export portability, reviewed v1-to-v2-to-v3 content migration, and a non-canon proof fixture;
- the live `quiet-cascade-expansion-v3` Story release: canonical campaign one followed by six sourced episodes, twelve Worker-authoritative Matches and 18 solvable Tickets in total, twelve isolated review boundaries, safe predecessor migration, and one honest end-of-current-content state;
- an accessible Story destination and scene player that connects durable checkpoints to ordinary Worker-authoritative solo Matches, handles interruption as an explicit restart, and accepts an authoritative terminal result exactly once without changing Local solo behavior;
- 23 original painterly Story assets—six reusable environments, seven characters with two poses each, and three technical inserts—plus three same-layer fallbacks, 78 responsive WebP derivatives, strict runtime resolution, complete generation provenance, and reviewed contact sheets;
- a versioned case-study research system with a completed pilot spanning several troubleshooting subsystems;
- a five-Ticket System Resolver proof that deterministically selects two curated source-backed profiles, derives accessible one-source lifecycle/topology/inventory/rationale views, rejects five bounded incompatible profiles, and keeps private authoring validation separate from public output;
- a working story foundation with a fictional company, campaign frame, ensemble, voice guide, canonical campaign-one package, and story-derived gameplay candidates; STORY-007 A freezes those names and reviewed visual identities as canon;
- a non-authoritative, replayable candidate-flow package that combines temporary rules, exact card/deck/Ticket fixtures, complete matches, and landing-to-logout campaign and multiplayer journeys;
- provisional UI planning and original wireframes for the future playable application.

The repository now contains the playable rules-engine foundation and a deliberately scoped player-facing local solo/Story client. It does not yet contain a multiplayer transport/server, Room or account runtime, cloud persistence, or the production multiplayer client. The first-version rules foundation is frozen; schemas remain draft implementation contracts, and recommended models remain non-normative architecture guidance.

## Completed release work and next boundary

TASK-047 and TASK-048 are complete. Every tutorial action checkpoint now exposes its expected legal intent, a bounded and visibly targeted recovery, or an explicit safe stop, and the fundamentals lesson distinguishes its confirmed non-actionable array condition from its supported actionable drive Candidate without changing authority or hidden truth. See the [task index](docs/tasks/INDEX.md).

TASK-049 through TASK-055 are complete. The owner-approved `SYSTEM-001 A` / `SYSTEM-002 A` sequence now covers all 18 immutable Tickets in the released twelve-Match Story campaign with three source-backed profiles, exact public bindings, separate private compatibility proofs, and no new Component IDs. Its production bundle deduplicates the three public profile cores from the 18 Ticket contexts, and the full Ticket now offers an accessible, zero-Action **Show system** view for lifecycle, topology, components, learning sources, and action relevance. The view is explanatory rather than Evidence, keeps Worker legality separate, remains static across hidden truth, and degrades to one generic unavailable notice without blocking ordinary play. See the [System Model roadmap and release records](docs/system-models/README.md).

TASK-039 through TASK-046 completed the measured Story expansion sequence.

TASK-037 repaired the original campaign-one Shift 6 handoff. TASK-046 now preserves that completed history while continuing eligible saves into the released expansion, so the former campaign-one terminal surface is no longer the live content boundary.

TASK-038 is complete. Chapter history now offers every durably completed Shift as an authored cutscene plus ordinary practice Match. Review choices and Match outcomes are session-only: canonical Story progress, rewards, ending, exports, and Profile statistics remain unchanged through completion, Give Up, reload, route leave, import, and migration. [`STORY-009 A`](docs/design/decisions/APPROVALS.md#story-009--completed-episode-replay-semantics--a-approved-2026-08-28) remains the governing policy.

TASK-039's generated [campaign-one coverage audit](docs/story/coverage/CAMPAIGN_ONE_DOMAIN_COVERAGE.md) reconstructs all twelve original Tickets and distinguishes catalog exposure, Candidate-changing evidence, Isolation routes, oracle-minimal practice, closure actions, dependencies, and narrative teaching. TASK-040's [Story and domain expansion protocol](docs/story/EXPANSION_PROTOCOL.md) gated measured selection, research, authority review, solvability, writing, art, migration, and re-audit. TASK-041 selected a reproducible `Q = 6`; TASK-042 added six sourced, deck-reachable fingerprints and twelve response Cards; TASK-043 and TASK-044 proved and authored the six-episode candidate; and TASK-045 verified a zero-new-art release. TASK-046 has now shipped the combined pack. Its [release record](docs/story/releases/quiet-cascade-expansion-v3/RELEASE_CONTENT_PACK.md), [post-release coverage audit](docs/story/coverage/RELEASED_STORY_DOMAIN_COVERAGE_V3.md), and [browser QA](docs/story/TASK-046-BROWSER-QA.md) prove the complete twelve-Match journey without overstating exposure. The [task index](docs/tasks/INDEX.md) retains the full dependency history.

TASK-031 and TASK-032 are complete. The application now synthesizes short semantic cues from oscillators, generated noise, envelopes, filters, and bounded delay through one accessible shared service; it ships no sampled audio, external audio dependency, or runtime audio download. See the [interaction catalogue](docs/audio/SFX_UI_CATALOG.md) and [recipe catalogue](docs/audio/SFX_RECIPE_CATALOG.md).

TASK-033 through TASK-036 are complete. The sequence audited all 113 original narrative surfaces, built a 124-line context-complete candidate, deepened all nine canon characters, and shipped one integrated `quiet-cascade-characterization-v2` release. The live pass adds newcomer context and distinct voices without changing gameplay or topology; v1 checkpoints migrate only after their original digest is verified. See the [task index](docs/tasks/INDEX.md), [final comparison](docs/story/revisions/quiet-cascade-characterization-v2/FINAL_DIALOGUE_COMPARISON.md), and [continuity ledger](docs/story/campaigns/QUIET_CASCADE_CONTINUITY.md).

TASK-026 through TASK-030 are complete: the declarative runtime, campaign graph and solvability proofs, accessible Story player and authoritative Match bridge, full scripts/choreography, and original responsive painterly art now form one playable Story slice. Cutscene choices, story-scoped Service Points, and normalized Match outcomes drive typed branches; durable scene/Match-boundary checkpoints never imply active-Match resume. See the [task index](docs/tasks/INDEX.md), [Story README](docs/story/README.md), [runtime contract](docs/story/RUNTIME.md), [campaign record](docs/story/campaigns/QUIET_CASCADE.md), and [art production record](docs/art/TASK-030-STORY-ART.md).

[`STORY-007 A`](docs/design/decisions/APPROVALS.md#story-007--campaign-one-canon-package--a-approved-2026-08-28) was approved on 2026-08-28, making the campaign-one names and original character identities frozen canon. [`STORY-008 A`](docs/design/decisions/APPROVALS.md#story-008--characterization-pass-creative-discretion--a-approved-2026-08-28) grants creative discretion for deeper backstories and public-domain reference constellations while preserving those identities, technical competence, art, and gameplay/Story authority. The deferred V2 Migration Seed remains inactive until the project owner reactivates it.

## Design source of truth

Read the design documents in this order:

1. [`docs/design/decisions/DECISION_INDEX.md`](docs/design/decisions/DECISION_INDEX.md) — the authority map, current decision state, lifecycle, and recommended order for finishing the engine.
2. [`docs/design/decisions/FROZEN_RULES.md`](docs/design/decisions/FROZEN_RULES.md) — approved behavior implementations may rely on.
3. [`docs/design/decisions/UNFROZEN_RULES.md`](docs/design/decisions/UNFROZEN_RULES.md) — accepted open rules and pressure against frozen behavior.
4. [`docs/design/decisions/APPROVALS.md`](docs/design/decisions/APPROVALS.md) — the current post-playtest option packet awaiting user choices; it is non-authoritative until approved.
5. [`docs/design/SOLO_PAGES_PROFILE_V2.md`](docs/design/SOLO_PAGES_PROFILE_V2.md) — the current `solo-pages-v2` successor profile; the original [`solo-pages-v1` profile](docs/design/SOLO_PAGES_PROFILE.md) remains pinned for its historical artifacts.
6. [`docs/design/RECOMMENDED_DATA_MODEL.md`](docs/design/RECOMMENDED_DATA_MODEL.md) and [`RECOMMENDED_PRESETS.json`](docs/design/RECOMMENDED_PRESETS.json) — architectural and balance recommendations, not frozen contracts.
7. [`docs/design/00_GAME_ENGINE_OVERVIEW.md`](docs/design/00_GAME_ENGINE_OVERVIEW.md) through [`07_FAULT_BROWSER_AND_SEARCH.md`](docs/design/07_FAULT_BROWSER_AND_SEARCH.md) — the synchronized foundational vision, architecture, and starter catalogs. Frozen decisions still take precedence.
8. [`docs/design/DOCUMENTS_TO_UPDATE.md`](docs/design/DOCUMENTS_TO_UPDATE.md) — the audited migration ledger, including completed, superseded, deferred, and still-relevant recommendations.

If implementation exposes a new rule question or pressure against frozen behavior, record it in the empty Unfrozen ledger before choosing an answer through code, schema, content, or UI behavior.

## Repository guide

- [`docs/design/`](docs/design/) — game vision, living decision sources of truth, technical catalogs, and implementation recommendations.
- [`docs/candidate_flows/`](docs/candidate_flows/) — deliberately non-authoritative example rules, board/card fixtures, audited game replays, focused application flows, and full campaign/multiplayer walkthroughs. Begin with its [`README`](docs/candidate_flows/README.md); use the package to critique structure, not as promoted rules or implementation contracts.
- [`docs/case_studies/`](docs/case_studies/) — versioned research that converts real troubleshooting accounts into lifecycle reductions, domain cross-references, candidate materials, and decision observations. Begin with its [`README`](docs/case_studies/README.md).
- [`docs/story/`](docs/story/) — the working fictional setting, company, campaign frame, characters, voice, real-world inspiration boundary, and story-derived candidate mechanics. Begin with its [`README`](docs/story/README.md).
- [`docs/system-models/`](docs/system-models/) — the proposed source-backed System Model / Finder architecture, lifecycle/topology scope, public/private safety boundary, and phased delivery roadmap.
- [`docs/audio/`](docs/audio/) — procedural synthesis review, the completed human- and machine-readable interaction and recipe catalogues, and the shared SFX runtime guide.
- [`docs/tasks/`](docs/tasks/) — scoped implementation and research contracts, with [`INDEX.md`](docs/tasks/INDEX.md) identifying the current task state.
- [`docs/ui-plan/`](docs/ui-plan/) — provisional application structure and original visual wireframes.
- [`viewer/`](viewer/) — the static Pages root: the established reusable Domain Library plus the `solo-pages-v2` local Play experience. It is not the production multiplayer client.
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

Most players should use the [hosted GitHub Pages application](https://jamangi.github.io/Server_Repair_TCG_Multiplayer/) and select **Play**.

For local development or repository verification, run from the repository root:

```powershell
node viewer/scripts/build-play-assets.mjs
python -m http.server 8080 --directory viewer
```

Then open <http://127.0.0.1:8080/>. Do not open `viewer/index.html` through the `file://` protocol because browsers cannot reliably fetch its JSON content that way.

The Library exposes faults, symptoms, components, tests, tools, commands, repairs, validations, and protocols through search, filtering, sorting, and record details. Play provides a versioned local profile, legal 30-card decks, Settings and backup portability, two real-engine guided tutorials, player-safe “Why can’t I isolate?” guidance, deterministic finite solo matches, and the current twelve-episode Quiet Cascade Story release. A dedicated module Worker owns each active Match; active Match state is intentionally not resumable or included in exports. Story persists only approved declarative checkpoints and normalized terminal results, then restarts an interrupted configured Match from its pre-Match boundary. In solo play, **Give Up** abandons and archives the selected Ticket, voids its pending contributions, records the give-up, and only then privately presents the authoritative authored solution and compares it with the preserved investigation.

After changing `viewer/content/*.json`, rebuild its generated manifest:

```powershell
node viewer/scripts/build-manifest.mjs
```

Do not hand-edit `viewer/content/manifest.json`.

After changing canonical engine, Builder, gameplay, Play modules, assets, or the vendored runtime, rebuild and verify the staged browser artifact:

```powershell
node viewer/scripts/build-play-assets.mjs
node viewer/scripts/verify-play-assets.mjs
node viewer/scripts/verify-task-011-art.mjs
node viewer/scripts/verify-task-030-art.mjs
```
