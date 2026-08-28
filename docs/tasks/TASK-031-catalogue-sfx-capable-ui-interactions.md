# TASK-031-HIGH: Catalogue SFX-capable UI interactions and procedural recipes

## Status

**Ready — next task.** This task is a read-only UI/reference audit plus documentation and validation tooling. It does not add playback. TASK-032 depends on its completed catalogues.

## Objective

Create a comprehensive, maintainable catalogue of user-interface interactions that could reasonably produce a sound effect across Library, Play, Profile, Settings, and Story. Give every reachable user-operated control either one reviewed semantic SFX intent or an explicit `NO_SFX` disposition with a reason.

Catalogue the repository's procedural sound recipes separately from UI mappings. The two catalogues must make TASK-032 mechanical and future UI or synthesis changes auditable without coupling waveform parameters or recipe IDs directly to DOM handlers.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, and `docs/tasks/INDEX.md`;
- [`sound_effects/ui_sound_lab_single.html`](../../sound_effects/ui_sound_lab_single.html) and [`docs/audio/SFX_SYNTHESIS_REFERENCE.md`](../audio/SFX_SYNTHESIS_REFERENCE.md);
- TASK-010, TASK-012, TASK-015, TASK-018 through TASK-021, TASK-023, TASK-025, and TASK-028 for current routing, dialog, input, continuity, responsive, tutorial, archive, and Story contracts;
- `viewer/index.html`, `viewer/js/app.js`, every current Library module, every module under `viewer/js/play/`, current styles, storage/settings schemas and migrations, build staging, and relevant Node/browser tests; and
- the hosted/local application at desktop, keyboard-only, touch/mobile, reduced-motion, and zoom/reflow sizes. Screenshots are supporting evidence, not a substitute for source and route inspection.

## Procedural-recipe audit

Inspect, audition, and document all twelve recipes in the self-contained HTML reference:

- Cancel A/B;
- Cursor A through D;
- Popup Open and Popup Close;
- Select A/B; and
- Swipe A/B.

Record for each stable recipe candidate:

- stable recipe ID, semantic family, and variant;
- oscillator/noise sources, duration, amplitude and pitch envelopes, filters, delay/wet path, and gain;
- concise listening notes covering attack, tail, harshness, repetition fatigue, and likely UI role;
- recommended production trim/gain/polyphony and whether the recipe should be excluded; and
- a reference to the prototype recipe from which it is derived.

Do not create or catalogue Glitch. Propose an Error recipe only when a reachable error interaction needs it; TASK-032 will author and validate that recipe from the same browser-native primitives. Do not introduce sampled audio, third-party sound identities, external libraries, packages, or runtime network dependencies.

The reference's product/faction styling and demo event wiring are out of scope. Catalogue sound semantics and synthesis parameters only.

## UI catalogue coverage

Audit every currently reachable route, state-dependent panel, dialog, and input method. Group the human-readable catalogue first by top-level destination and then by page/region/component. At minimum cover:

- **Global shell:** Library/Play switch, Play sub-navigation, Settings entry, route changes, notices, loading/error recovery, and shared dialog behavior.
- **Library:** entity-type tabs, search, category/filter/sort controls, result cards, pagination where present, record inspection, related-record navigation, and dialog dismissal.
- **Play Home:** starting-Ticket control, active-deck and shortcut navigation, tutorial entry/replay, Story entry/resume/replay, and Match launch/preflight failures.
- **Decks and deck editor:** deck selection, create/edit/activate/delete flows, filters, Card increment/decrement, Inspect, save/cancel, dirty-leave confirmation, validation errors, and empty/disabled states.
- **Profile:** editable identity fields, icon selection, Save, unsaved-leave handling, statistics/summary navigation, and validation errors.
- **Settings and portability:** all selects/switches, the future app-wide SFX volume control and preview action, save, tutorial shortcuts, export/import/preview/replace, reset, confirmation/cancellation, file rejection, and dialog lifecycle.
- **Active Play board:** Ticket selection/archive review, Evidence/Worklog tabs, Bench mode/type/filter/search/sort/paging, diagnostic and hand-card inspection, hand stacks/pages/expansion, Legal Action target/confirm/cancel/error/result paths, basic actions, Documentation preview/commit/cancel, Give Up, tutorials/help, result/solution dialogs, and responsive equivalents.
- **Story:** campaign start/resume/replay, dialogue advance, meaningful choices, History open/close, Back/Auto if present, scene/label transitions, Match launch/return, ending continuation, interruption/restart messaging, and fallback/error states.

Include native mouse, keyboard, and touch routes. Touch has no hover cue. Programmatic render, restored focus, initial page load, disabled/inert controls, repeated pointer movement, and unchanged state must not accidentally become sound triggers.

## Semantic intent model

Use these intent families rather than recipe parameters:

- `CURSOR`: a new eligible pointer-enter target or deliberate keyboard-focus target after audio unlock;
- `SELECT`: a successful selection or ordinary activation;
- `CANCEL`: abandoning a pending choice, confirmation, edit, or action;
- `POPUP_OPEN` and `POPUP_CLOSE`: neutral overlay lifecycle;
- `ERROR`: rejected action, invalid input, or failed operation after equivalent visual and announced feedback;
- `SWIPE`: a genuine spatial transition; and
- `NO_SFX`: intentionally silent, with a reason.

One trusted user gesture produces at most one primary cue. Define precedence so an Inspect click that opens a dialog does not play both Select and Popup Open, and a Cancel action that also closes a dialog does not also play Popup Close. Identify cooldown, deduplication, interruption, and maximum-polyphony needs, especially for Cursor.

## Deliverables

Create:

1. `docs/audio/SFX_RECIPE_CATALOG.md` — synthesis parameters, listening notes, recommended variants, exclusion decisions, and production bounds;
2. `docs/audio/SFX_UI_CATALOG.md` — the complete grouped human review document, totals by destination/intent, gaps, and recommendations;
3. `docs/audio/sfx-ui-catalog.json` — a deterministic machine-readable interaction mapping; and
4. validators/tests for the recipe and UI catalogue contracts, stable IDs, allowed intents, valid route/module references, recipe references, and agreement with Markdown totals.

Each machine interaction record must contain at least:

- stable interaction ID;
- top-level destination, route/page, region/component, and source module;
- user-facing control/action;
- supported input routes;
- successful trigger phase and eligibility condition;
- intent, priority/precedence, cooldown/deduplication group, and overlap policy;
- suppression conditions;
- proposed recipe ID or `null` for `NO_SFX`;
- stable test selector/anchor where available; and
- audit status and rationale.

Every discovered interactive family must be mapped or listed in an explicit exclusions/gaps table. Do not claim exhaustive coverage from a simple `button` count: delegated events, generated Cards/Tickets, dialogs, Story statements, keyboard shortcuts, mobile recomposition, and failure states must be traced.

## Verification

- Validate catalogue parsing/schema, stable IDs, intent values, recipe references, route/module existence, bounded synthesis values, and Markdown/JSON totals.
- Run a browser-assisted route/state crawl and a source-level audit. Record reachable control-family totals per destination and reconcile every gap.
- Verify the catalogue at desktop, keyboard-only, and touch/mobile widths without production playback.
- Confirm the reference and planned runtime require no external request, audio binary, framework, package, or third-party attribution.
- Run relevant repository documentation/link tests and `git diff --check`.
- Report commands, exit codes, pass/fail totals, changed files, recipes inspected, and unresolved coverage items.

## Allowed paths

- `docs/audio/` catalogue and audit documents;
- catalogue schema/validation tooling and focused tests;
- `docs/tasks/INDEX.md`, task completion notes, and concise root/viewer documentation links.

Do not modify Viewer interaction behavior, settings data, gameplay/story authority, or production audio. Do not add playback dependencies or sampled sound files. The prototype HTML is read-only reference input for this task.

## Completion boundary

Stop when every current interactive family is mapped or explicitly silent, all twelve procedural recipe candidates have reproducible parameters and listening notes, the catalogues validate, and TASK-032 can implement mappings without rediscovering the application or importing any external audio.
