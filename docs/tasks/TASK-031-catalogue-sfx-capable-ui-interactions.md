# TASK-031-HIGH: Catalogue SFX-capable UI interactions

## Status

**Ready — next task.** This task is a read-only UI/asset audit plus documentation and validation tooling. It does not add playback or publish licensed audio. TASK-032 depends on its completed catalogue.

## Objective

Create a comprehensive, maintainable catalogue of user-interface interactions that could reasonably produce a sound effect across Library, Play, Profile, Settings, and Story. Give every reachable user-operated control either one reviewed semantic SFX intent or an explicit `NO_SFX` disposition with a reason.

The catalogue must make the later integration mechanical and make future UI or sound-pack changes auditable. It must describe interaction meaning rather than coupling filenames directly to DOM event handlers.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, and `docs/tasks/INDEX.md`;
- [`docs/audio/SFX_SOURCE_REVIEW.md`](../audio/SFX_SOURCE_REVIEW.md) and the supplied local license; the local `sound_effects/` tree is read-only and must remain untracked;
- TASK-010, TASK-012, TASK-015, TASK-018 through TASK-021, TASK-023, TASK-025, and TASK-028 for current routing, dialog, input, continuity, responsive, tutorial, archive, and Story contracts;
- `viewer/index.html`, `viewer/js/app.js`, every current Library module, every module under `viewer/js/play/`, current styles, storage/settings schemas and migrations, build staging, and relevant Node/browser tests; and
- the hosted/local application at desktop, keyboard-only, touch/mobile, reduced-motion, and zoom/reflow sizes. Screenshots are supporting evidence, not a substitute for source and route inspection.

## Source-effect audit

Inspect and audition the **stereo** versions of all fifteen unique effects locally. Record for each stable source candidate:

- semantic family and variant number;
- exact local source filename, encoding used for audition, channels, sample rate, duration, byte size, and SHA-256;
- concise listening notes covering attack, tail, harshness, stereo width, repetition fatigue, and likely UI role;
- recommended delivery trim/fade/gain and whether the source should be excluded;
- license/provenance reference; and
- a stable proposed asset ID that does not depend on display text or array position.

Do not upload, transform through an external service, generate derivatives, or commit any source audio. The two Error variants are part of the fifteen-sound inventory. Glitching is excluded by default unless the audit can justify a specific short, quiet, non-looping use.

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

Use these intent families rather than audio filenames:

- `CURSOR`: a new eligible hover or deliberate keyboard-focus target after audio unlock;
- `SELECT`: a successful selection or ordinary activation;
- `CANCEL`: abandoning a pending choice, confirmation, edit, or action;
- `POPUP_OPEN` and `POPUP_CLOSE`: neutral overlay lifecycle;
- `ERROR`: rejected action, invalid input, or failed operation after equivalent visual and announced feedback;
- `SWIPE`: a genuine spatial transition; and
- `NO_SFX`: intentionally silent, with a reason.

One trusted user gesture produces at most one primary cue. Define precedence so an Inspect click that opens a dialog does not play both Select and Popup Open, and a Cancel action that also closes a dialog does not also play Popup Close. Identify throttle, deduplication, interruption, and maximum-polyphony needs, especially for Cursor.

## Deliverables

Create:

1. `docs/audio/SFX_ASSET_CATALOG.md` — source metadata, listening notes, recommended variants, exclusion decisions, and rights status;
2. `docs/audio/SFX_UI_CATALOG.md` — the complete grouped human review document, totals by destination/intent, gaps, and recommendations;
3. `docs/audio/sfx-ui-catalog.json` — a deterministic machine-readable mapping; and
4. a validator/test for the JSON contract, unique stable interaction IDs, allowed intents, valid route/module references, precedence values, and agreement with the Markdown totals.

Each machine record must contain at least:

- stable interaction ID;
- top-level destination, route/page, region/component, and source module;
- user-facing control/action;
- supported input routes;
- successful trigger phase and eligibility condition;
- intent, priority/precedence, cooldown/deduplication group, and overlap policy;
- suppression conditions;
- proposed source asset ID or `null` for `NO_SFX`;
- stable test selector/anchor where available; and
- audit status and rationale.

Every discovered interactive family must be mapped or listed in an explicit exclusions/gaps table. Do not claim exhaustive coverage from a simple `button` count: delegated events, generated Cards/Tickets, dialogs, Story statements, keyboard shortcuts, mobile recomposition, and failure states must be traced.

## Verification

- Validate JSON parsing/schema, stable IDs, intent values, asset references, route/module existence, and Markdown/JSON totals.
- Run a browser-assisted route/state crawl and a source-level audit. Record reachable control-family totals per destination and reconcile every gap.
- Verify the catalogue at desktop, keyboard-only, and touch/mobile widths without playing or publishing audio.
- Run relevant repository documentation/link tests and `git diff --check`.
- Report commands, exit codes, pass/fail totals, changed files, source files inspected, and unresolved coverage or license items.

## Allowed paths

- `docs/audio/` catalogue and audit documents;
- catalogue schema/validation tooling and focused tests;
- `docs/tasks/INDEX.md`, task completion notes, and concise root/viewer documentation links.

Do not modify Viewer interaction behavior, settings data, gameplay/story authority, or any source audio. Do not add playback dependencies or commit anything below `sound_effects/`.

## Completion boundary

Stop when every current interactive family is mapped or explicitly silent, the fifteen source candidates have reproducible local metadata and listening notes, the machine catalogue validates, and TASK-032 can implement mappings without rediscovering the application. License clearance may remain a separately explicit TASK-032 blocker.

