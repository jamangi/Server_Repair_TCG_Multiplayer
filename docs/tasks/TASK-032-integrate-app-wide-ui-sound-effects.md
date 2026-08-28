# TASK-032-HIGH: Integrate app-wide UI sound effects

## Status

**Queued after TASK-031; public asset integration is blocked pending rights-compatible audio.** Do not begin asset staging until the license gate below is satisfied.

## Objective

Implement the approved TASK-031 catalogue through one dependency-free, app-wide SFX service shared by Library, Play, Profile, Settings, active Matches, and Story. Add a persisted global SFX volume setting, deterministic semantic mapping, bounded playback, accessible silent equivalence, and maintainable asset/provenance validation.

This task changes presentation only. Sound never determines legality, state, timing, focus, navigation, Story branches, or whether an action succeeded.

## License and source gate

Read [`docs/audio/SFX_SOURCE_REVIEW.md`](../audio/SFX_SOURCE_REVIEW.md) and the completed TASK-031 asset catalogue first.

Before committing or browser-delivering any audio, require either:

1. written JDSherbert permission explicitly covering selected audio files stored in this **public Git repository** and served as **directly retrievable static GitHub Pages assets**; or
2. replacement audio whose license explicitly allows those uses.

Stop and report the missing rights input if neither exists. Do not treat transcoding, trimming, renaming, bundling, base64 encoding, or JavaScript packaging as a workaround for a raw-file redistribution restriction.

For cleared JDSherbert assets, preserve the permission/license and hashes, keep only the minimum curated delivery files, identify all edits, and add visible credit in the root README and the application's Settings/Credits surface: `Sounds by JDSherbert — https://jdsherbert.itch.io`. Do not use the sources for AI training. If replacement assets are used, update the source review and satisfy their exact attribution/share requirements instead.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, completed TASK-031 and all of its deliverables;
- TASK-010, TASK-012, TASK-015, TASK-018 through TASK-021, TASK-023, TASK-025, and TASK-028;
- all Library and Play modules named by the catalogue, dialog/motion coordination, routing, storage/settings validation and migrations, export/import, Viewer build staging, and relevant tests; and
- the cleared source license/permission, asset manifest, and delivery-budget conventions.

## Shared audio architecture

Create one reusable semantic SFX service initialized by the outer Viewer shell and available across all destinations. UI modules request an intent/interaction ID; they do not instantiate `Audio`, create ad hoc `AudioContext` objects, or hard-code filenames.

The service must:

- resolve stable semantic IDs through a versioned manifest;
- remain silent until the first trusted user activation satisfies browser autoplay policy, with no queued catch-up sounds;
- cache/decode lazily, fail silently from an interaction perspective, and preserve full UI behavior if audio is unsupported or an asset fails;
- apply master volume plus reviewed per-asset/per-intent trim and gain;
- enforce one primary cue per gesture, catalogue precedence, Cursor cooldown/deduplication, bounded voices, and safe interruption of obsolete hover cues;
- prevent pointerdown/click, click/change, keydown/click, rerender, restored focus, and dialog teardown from double-triggering;
- never emit hover sounds on touch, continuous pointer movement, initial render, programmatic focus, disabled/inert elements, or no-op selection;
- expose a deterministic injectable playback adapter so unit/browser tests never use speakers; and
- tear down route/dialog listeners without leaks or retained playback.

Use the TASK-031 intent policy. Popup Open supersedes Select for the gesture that opens an overlay; Cancel supersedes Popup Close when dismissal abandons pending work. Error follows the visible/announced rejection and never replaces it. Glitching remains unused unless TASK-031 approved a specific bounded mapping and the authorized delivery derivative has a short fade, conservative gain, no loop, and no essential information.

## App-wide volume setting

Extend the existing versioned settings/storage authority rather than adding a second `localStorage` key.

- Add `sfx_volume_percent` as an integer from `0` through `100`, with a conservative default of `40`; `0` means fully off and requires no separate mute state.
- Add a labeled range control in Settings with visible numeric output, keyboard support, and explanatory text that sound is optional presentation.
- Provide one explicit Preview control. Do not play a sound on every slider input event.
- Apply a saved value immediately across Library, Play, Profile, active Match, Settings, and Story without reload.
- Include the setting in validated export/import, import preview where settings are summarized, reset defaults, deterministic serialization, and migration from every supported earlier local-data version.
- Reject non-integer, out-of-range, non-finite, or unknown imported values without partially replacing local data.

No audible event may be the only indication of focus, success, failure, danger, confirmation, narrative meaning, or gameplay result. Existing text, state, focus, ARIA announcements, and reduced-motion behavior remain authoritative and unchanged.

## Asset delivery and provenance

- Derive a minimal browser set from the approved catalogue; do not ship mono/stereo duplicates or five encodings of each effect.
- Choose delivery formats by tested browser support and size/quality, with a fallback only when evidence requires it.
- Normalize perceived loudness and trim dead air/tails non-destructively from reviewed source masters; record exact source hash, operation, output hash, duration, channels, sample rate, bytes, credit, and rights evidence.
- Keep a versioned manifest, deterministic build/verification path, total-byte budget, and missing/unexpected-file failure.
- Preserve `viewer/` as the GitHub Pages root and keep runtime network-free.

## Catalogue integration

Implement every `PLANNED` TASK-031 mapping and keep every `NO_SFX` mapping silent. Prefer one delegated semantic boundary or component helper over scattered listeners, while preserving current event ordering and trusted-gesture behavior.

At minimum verify real behavior across the global shell, Library, Home, Decks/editor, Profile, Settings/portability, active Play board and dialogs, tutorials/results/archive review, Story dialogue/choices/history/transitions, keyboard routes, and mobile/touch routes. If implementation reveals an unmapped interaction, update and revalidate the catalogue before adding sound.

## Verification

- Unit-test manifest validation, volume/gain calculation, autoplay lock/unlock, precedence, deduplication, cooldown, bounded polyphony, error fallback, and teardown with a fake playback adapter.
- Test settings validation, all migrations, persistence, reset, export/import, atomic rejection, and app-wide live application of `0`, default, and `100`.
- Browser-test representative mappings in every destination with audio stubbed: pointer, keyboard, touch, dialogs, errors, route changes, rerenders, and focus restoration. Assert semantic playback requests and absence of duplicates rather than waveform output.
- Verify the complete TASK-031 catalogue remains reconciled and every shipped asset is referenced, rights-cleared, credited, hashed, size-bounded, and staged exactly once.
- Run the required Viewer syntax/baseline checks, focused audio/settings tests, canonical Viewer staging and verification, relevant browser suites, the full applicable Node suite, and `git diff --check`.
- Record commands, exit codes, pass/fail totals, changed files, delivery bytes, attribution locations, and unresolved items.

## Allowed paths

- app-wide Viewer audio service, semantic manifest, cleared delivery assets, and staging/verification tooling;
- Library/Play/Profile/Settings/Story interaction integration named by the completed catalogue;
- settings schemas, validation, migrations, storage/export/import, and examples;
- `docs/audio/`, license/permission/credit records, root/viewer documentation, tests, and task/index status.

Do not alter engine/Builder authority, gameplay outcomes, Story topology/content, Card/Ticket data, or accessibility semantics. Do not add a framework, runtime network dependency, background music system, voice acting, haptics, or procedural/generative audio.

## Completion boundary

Stop when the rights gate is evidenced, the curated sound set is reproducibly staged and credited, all catalogue mappings and explicit silences are implemented through one service, the 0–100 volume setting works across the entire app and portability lifecycle, and automated/browser verification proves no duplicate or state-changing audio side effects.

