# TASK-032-HIGH: Integrate app-wide procedural UI sound effects

## Status

**Queued after TASK-031.** The former audio-asset rights blocker is removed. Begin after TASK-031 produces and validates the complete semantic interaction and recipe catalogue.

## Objective

Implement the approved TASK-031 catalogue through one dependency-free, app-wide procedural SFX service shared by Library, Play, Profile, Settings, active Matches, and Story. Add a persisted global SFX volume setting, deterministic semantic mapping, bounded playback, accessible silent equivalence, and maintainable recipe validation.

This task changes presentation only. Sound never determines legality, state, timing, focus, navigation, Story branches, or whether an action succeeded.

## Approved synthesis strategy

Read [`sound_effects/ui_sound_lab_single.html`](../../sound_effects/ui_sound_lab_single.html) and [`docs/audio/SFX_SYNTHESIS_REFERENCE.md`](../audio/SFX_SYNTHESIS_REFERENCE.md) completely before implementation.

Use the prototype's browser-native Web Audio strategy: short oscillator and generated-noise voices shaped with gain envelopes, pitch sweeps, high-pass filtering, and an optional bounded delay path. Do not ship sampled audio or add a framework, package, external synthesis library, runtime network request, or browser-downloaded audio asset.

Treat the HTML as a technique and parameter reference, not production code to copy wholesale. In particular:

- replace its fixed master gain with the validated app-wide setting;
- use one shared context/service instead of UI-local audio construction;
- use eligible `pointerenter` and deliberate keyboard-focus transitions, never continuous `pointermove` regions, for Cursor cues;
- prevent its Confirm-example double cue: one gesture receives one primary cue according to catalogue precedence;
- make noise generation injectable or seeded for tests, while keeping all waveform variation irrelevant to application state;
- require every accepted recipe field to affect synthesis rather than carrying unused prototype metadata;
- bound concurrent voices, stop obsolete Cursor voices, and disconnect completed nodes; and
- do not carry prototype-only product, faction, or third-party style labels into production identifiers, UI copy, or comments.

The reference contains twelve recipes: two Cancel, four Cursor, one Popup Close, one Popup Open, two Select, and two Swipe. Do not create a Glitch recipe. TASK-032 may author one short, conservative Error recipe from the same primitives when the completed TASK-031 catalogue contains an approved Error mapping. Record any new recipe's parameters and listening rationale in the recipe catalogue.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, completed TASK-031 and all of its deliverables;
- the procedural reference HTML and synthesis review named above;
- TASK-010, TASK-012, TASK-015, TASK-018 through TASK-021, TASK-023, TASK-025, and TASK-028;
- all Library and Play modules named by the catalogue, dialog/motion coordination, routing, storage/settings validation and migrations, export/import, Viewer build staging, and relevant tests; and
- browser autoplay, lifecycle, and accessibility behavior already established in the Viewer.

## Shared audio architecture

Create one reusable semantic SFX service initialized by the outer Viewer shell and available across all destinations. UI modules request a stable semantic interaction or recipe ID; they do not instantiate `Audio`, create ad hoc `AudioContext` objects, or embed synthesis parameters.

The service must:

- resolve stable semantic IDs through a versioned, validated recipe manifest;
- create at most one browser `AudioContext`, one master gain path, and short-lived bounded voices;
- remain silent until the first trusted user activation satisfies browser autoplay policy, with no queued catch-up sounds;
- synthesize lazily, fail silently from an interaction perspective, and preserve full UI behavior when Web Audio is unsupported or a voice fails;
- apply master volume plus reviewed per-recipe/per-intent trim and conservative peak limits;
- enforce one primary cue per gesture, catalogue precedence, Cursor cooldown/deduplication, bounded polyphony, and safe interruption of obsolete Cursor cues;
- prevent pointerdown/click, click/change, keydown/click, rerender, restored focus, and dialog teardown from double-triggering;
- never emit hover sounds on touch, continuous pointer movement, initial render, programmatic focus, disabled/inert elements, or no-op selection;
- expose a deterministic injectable clock, noise source, and audio adapter so unit/browser tests never use speakers; and
- tear down route/dialog listeners and completed nodes without leaks or retained playback.

Use the TASK-031 intent policy. Popup Open supersedes Select for the gesture that opens an overlay; Cancel supersedes Popup Close when dismissal abandons pending work. Error follows the visible and announced rejection and never replaces it. `NO_SFX` remains silent.

## Recipe manifest and synthesis constraints

Represent recipes as validated data, separate from interaction mappings and DOM handlers. Each recipe records at least:

- stable recipe ID and semantic family;
- source type (`sine`, `triangle`, `square`, generated noise, or an approved combination);
- duration and amplitude envelope;
- start/end frequency or fixed pitch where applicable;
- filter type/frequency when applicable;
- optional delay time, wet mix, and feedback with conservative upper bounds;
- per-recipe gain trim, maximum simultaneous voices, and interruption group;
- short listening/design note; and
- the reference recipe or explicit original derivation.

Validation must reject unknown fields, unsupported source/filter types, non-finite values, out-of-range frequencies/gains/times, non-positive durations, feedback capable of runaway output, and recipe IDs not reconciled with the TASK-031 catalogues. Do not expose raw recipe parameters as user-configurable settings.

Use a short seeded or injected noise buffer for repeatable tests. Audio sample identity does not participate in serialization, replay digests, Story checkpoints, engine events, or any authoritative state.

## App-wide volume setting

Extend the existing versioned settings/storage authority rather than adding a second `localStorage` key.

- Add `sfx_volume_percent` as an integer from `0` through `100`, with a conservative default of `40`; `0` means fully off and requires no separate mute state.
- Add a labeled range control in Settings with visible numeric output, keyboard support, and explanatory text that sound is optional presentation.
- Provide one explicit Preview control. Do not play a sound on every slider input event.
- Apply a saved value immediately across Library, Play, Profile, active Match, Settings, and Story without reload.
- Include the setting in validated export/import, import preview where settings are summarized, reset defaults, deterministic serialization, and migration from every supported earlier local-data version.
- Reject non-integer, out-of-range, non-finite, or unknown imported values without partially replacing local data.

No audible event may be the only indication of focus, success, failure, danger, confirmation, narrative meaning, or gameplay result. Existing text, state, focus, ARIA announcements, and reduced-motion behavior remain authoritative and unchanged.

## Catalogue integration

Implement every `PLANNED` TASK-031 mapping and keep every `NO_SFX` mapping silent. Prefer one delegated semantic boundary or component helper over scattered listeners, while preserving current event ordering and trusted-gesture behavior.

At minimum verify real behavior across the global shell, Library, Home, Decks/editor, Profile, Settings/portability, active Play board and dialogs, tutorials/results/archive review, Story dialogue/choices/history/transitions, keyboard routes, and mobile/touch routes. If implementation reveals an unmapped interaction, update and revalidate the catalogue before adding sound.

## Verification

- Unit-test recipe and interaction-manifest validation, volume/gain calculation, autoplay lock/unlock, node cleanup, precedence, deduplication, cooldown, bounded polyphony, error fallback, and teardown with fake Web Audio primitives.
- Test settings validation, all migrations, persistence, reset, export/import, atomic rejection, and app-wide live application of `0`, default, and `100`.
- Browser-test representative mappings in every destination with audio stubbed: pointer, keyboard, touch, dialogs, errors, route changes, rerenders, and focus restoration. Assert semantic playback requests and absence of duplicates rather than waveform bytes or speaker output.
- Verify the complete TASK-031 catalogue remains reconciled, every recipe is referenced or explicitly retained as a reviewed variant, no external audio request occurs, and no binary audio file is staged into `viewer/`.
- Manually listen at `0`, default, and `100` on representative desktop and mobile hardware. Confirm conservative loudness, low repetition fatigue, no harsh Error cue, and no Cursor chatter.
- Run the required Viewer syntax/baseline checks, focused audio/settings tests, canonical Viewer staging and verification, relevant browser suites, the full applicable Node suite, and `git diff --check`.
- Record commands, exit codes, pass/fail totals, changed files, recipe totals, and unresolved items.

## Allowed paths

- app-wide Viewer audio service, semantic/recipe manifests, and validation tooling;
- Library/Play/Profile/Settings/Story interaction integration named by the completed catalogue;
- settings schemas, validation, migrations, storage/export/import, and examples;
- `sound_effects/ui_sound_lab_single.html`, `docs/audio/`, root/viewer documentation, tests, and task/index status.

Do not alter engine/Builder authority, gameplay outcomes, Story topology/content, Card/Ticket data, or accessibility semantics. Do not add a framework, external audio/runtime dependency, sampled audio pack, background music system, voice acting, haptics, or a general-purpose procedural music engine.

## Completion boundary

Stop when the validated procedural recipe set and all catalogue mappings are implemented through one service, every explicit silence remains silent, the 0–100 volume setting works across the entire app and portability lifecycle, and automated/browser/listening verification proves no duplicate, external-network, or state-changing audio side effects.
