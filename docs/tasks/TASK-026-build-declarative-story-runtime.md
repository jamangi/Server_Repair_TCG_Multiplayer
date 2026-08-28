# TASK-026-XHIGH: Build the declarative Story runtime foundation

## Status

**Approved and queued; blocked only by TASK-025 completion.** STORY-001 A through STORY-004 A are synchronized into this contract.

## Objective

Create a deterministic, headless, versioned Story runtime for the static Viewer. It must express large branching narratives through stable labels, typed statements, calls/returns, choices, conditions, explicit checkpoints, layered visual commands, and Match launch/return boundaries without making story content executable application code.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, TASK-005, TASK-009, TASK-010, TASK-015, and TASK-025;
- all `docs/story/` documents, especially `README.md`, `STORY.md`, `CHARACTERS.md`, `VOICE.md`, `VISUAL_DIRECTION.md`, and `gameplay_candidates/APP_SHELL.md`;
- the project-owned [`choice/dialogue reference`](../ui-plan/ui-reference_images/story-mode-choice-dialogue-reference.png) and [`dialogue screen reference`](../ui-plan/ui-reference_images/story-mode-dialogue-inflow-reference.png) for statement/layer/accessibility intent, never exact copy or runtime authority;
- frozen rules and solo profile, local-data/export contracts, engine/Builder projections, Worker/session boundary, result/debrief flow, and current no-active-Match-resume rule;
- Viewer router/application shell, storage migration, import/export, accessibility/motion/dialog systems, and tests.

## Architectural invariants

- Use versioned declarative story packs split into manageable chapter/script files. JavaScript implements the interpreter and validators; authored story content is data, never `eval`, dynamic imports, callbacks, or arbitrary expressions.
- Labels and checkpoint IDs are globally unique stable public content identifiers. Jumps, calls, assets, characters, conditions, and Match configurations resolve through explicit registries.
- The headless interpreter is a pure deterministic state machine. It consumes current story state plus one player intent and emits the next state and typed render/effect commands. DOM code never advances authority by itself.
- Story state is separate from authoritative Match state and profile statistics. It may reference normalized Match outcomes but cannot rewrite an engine replay, Service Point ledger, or Ticket history.
- The player sees only information authorized by the current story statement and any completed Match summary. Script structure, future branches, hidden Ticket truth, and unchosen dialogue do not leak into ordinary DOM or exported diagnostics.

## Minimum statement model

Define and validate typed equivalents of:

- `label`, `scene`, `show`, `hide`, `say`, `narrate`, `choice`, `set`, `if`/branch, `jump`, `call`, `return`, `checkpoint`, `start_match`, and `end`;
- stable character tags, expression/pose variants, positions, transition hints, speaker/style keys, and translatable text IDs;
- choice statements whose options can jump immediately and can write typed remembered values/flags for later scenes, plus a restricted condition AST over those approved story flags/choices, story-scoped Service Points, and normalized prior Match results—never arbitrary code;
- an explicit call stack with bounded depth and useful overflow/underflow errors; and
- deterministic choice ordering and transition settling.

Statements produce a layered display model rather than directly manipulating nodes:

1. `background` — persistent environment;
2. `characters` — tagged replaceable figures/expressions;
3. `transient` — temporary inserts, overlays, and transitions; and
4. `screens` — dialogue, names, choices, transcript, and controls rendered as accessible HTML.

## Persistence contract

- Persist only at approved stable boundaries: scene/chapter boundaries, explicit authored checkpoints, immediately before a Story Match, and after its normalized result is accepted.
- A durable checkpoint stores schema/content version, checkpoint ID, approved story variables, branch history needed for replay, and pending/returned Match context. It does not persist DOM, animation frames, arbitrary program counter, or active engine state.
- Reloading or leaving mid-segment resumes from the last durable checkpoint and clearly restarts that segment. Reloading during a Story Match follows the approved interruption policy rather than claiming the current local engine Match was restored.
- Story data participates in Settings export/import with validation, migration, conflict preview, and atomic rollback. Corrupt, unknown-version, or future-version data fails safely without damaging decks/profile/statistics.

## Validation and proof fixtures

Ship a small non-canon fixture pack that proves sequential dialogue, background persistence, character replacement by stable tag, an immediate cutscene-choice branch, a remembered choice that changes a later branch, Service-Point and normalized-Match-result conditions, cross-file jump, nested call/return, transcript output, checkpoint/reload, invalid references, cycle/depth guards, and a mocked typed Match boundary. Do not author the campaign in this task.

Static validation must reject duplicate/unreachable labels (except explicitly declared library entry points), missing jumps/calls/assets/characters/Match refs, return underflow, unbounded call recursion, invalid condition operands, malformed choices, impossible checkpoint IDs, non-terminating paths without an explicit loop declaration, and untranslated required text.

Run schema/content validation, deterministic replay/digest tests, randomized bounded graph walks, storage migration/import rollback tests, and `git diff --check`. Record every command, exit code, pass/fail total, changed file, and unresolved item.

## Allowed paths

- versioned Story schemas, packs, examples, validators, and headless runtime modules;
- local story-state and export/import contracts;
- isolated tests and non-canon fixtures;
- generated manifests through canonical scripts;
- task/index/story architecture documentation.

Do not add production story prose/art, a visible Story tab, production Match routing, new gameplay rules, or changes to current local-solo behavior.

## Completion boundary

Stop with a validated headless Story runtime and fixture proof. TASK-027 owns the campaign graph and Match plan; TASK-028 owns the player-facing Story experience.
