# TASK-037-HIGH: Fix the final Story Match handoff

## Status

**Completed 2026-08-28.** Restoring a durable checkpoint reset the runtime-only branch sequence to zero while retaining earlier branch-history entries. The next Chapter 4 choice therefore reused a lower sequence, and canonical local-data validation rejected the Shift 6 scene checkpoint. Restore now derives that counter from validated branch history, so direct, reloaded, migrated-v1, and export/import saves reach Shift 6; completed and abandoned results cross the return boundary exactly once; and Story Home identifies campaign one as complete with more content in development.

## Objective

Reproduce and correct the campaign-one boundary where advancing from Ev Shaw's final client-review line does not carry a five-Shift saved game into Shift 6, *The Quiet Cascade*.

Shift 6 is already authored. It has `story.match.qc01.shift06.quiet_cascade`, three generated Tickets, a reviewed active-deck requirement, pre/post-Match checkpoints, return dialogue, and all three ending bands. Treat the reported behavior as a launch-boundary defect, not as missing story content.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, completed TASK-026 through TASK-030, and completed TASK-036;
- `STORY-001 A` through `STORY-008 A`;
- both Quiet Cascade production packs, the v1-to-characterization-v2 migration, Chapter 4 scripts/text, Match registry/configuration, Story client, scene page, Match bridge, storage/export contracts, and focused tests; and
- the user's two 2026-08-28 screenshots and report: five completed Shifts at `checkpoint.qc01.chapter04.entry`, followed by the displayed `story.qc01.ch04.converge.02` line whose Continue control does not reach Shift 6.

## Reproduction before repair

- Reproduce the exact durable shape: five accepted Match results, Chapter 4 entry checkpoint, characterization-v2 content, and either remembered client-framing choice.
- Exercise direct local progress, a migrated v1 progress record, reload, and export/import restoration. Record which path fails, the rejected intent or exception, and the last committed checkpoint.
- Confirm whether one click fails to advance into the Shift 6 setup scene or a later click fails to emit/consume the `START_MATCH` effect. Do not infer the boundary from the screenshot alone.
- Add a deterministic regression fixture that reaches the boundary without replaying five manual Matches. The fixture must use public Story/storage contracts rather than mutating private runtime internals.

## Required behavior

- Continue from `story.qc01.ch04.converge.02` must advance through the authored jump into the Shift 6 setup scene.
- Continue from the final Shift 6 setup line must persist `checkpoint.qc01.shift06.pre_match`, preflight the real active deck, emit exactly one Match launch, and navigate to the ordinary Worker-authoritative game.
- Repeated clicks, Auto, keyboard input, slow art, and asynchronous SFX may not duplicate the Match, strand a disabled Continue control, or hide an actionable error.
- A failed preflight must expose its existing recovery route; it must not look like an inert cutscene.
- Returning from the completed or abandoned Match must accept the result exactly once and reach the authored ending band.
- After an ending, Story Home must explicitly identify campaign one as complete and say that more Story content is in development. It must not imply that an unauthored next Match is available.
- Preserve all gameplay authority, Match configuration, dialogue payload, choices, Service Point bands, and local/export compatibility except for the smallest proven migration correction.

## Verification

- Prove the failing saved-progress fixture fails before the repair and passes afterward.
- Cover both Chapter 4 choices; direct v2 and migrated v1 progress; scene, pre-Match, post-Match, reload, route-leave, export/import, completed, and abandoned paths.
- Assert the Shift 6 expected Ticket IDs/digests and required response resources remain unchanged.
- Run Story runtime, migration, Match integration, browser, staging, link, and full applicable Node tests plus `git diff --check`.
- Browser-test the reported desktop path and a mobile/keyboard path. Capture console/page errors and verify focus and live-region feedback.
- Report commands, exit codes, pass/fail totals, changed files, root cause, migrated records, and unresolved items.

## Allowed paths

- Story runtime/client/scene/Match-bridge/storage migration files necessary for the proven cause;
- Quiet Cascade metadata or completion copy only when required for the explicit end-of-current-content state;
- focused fixtures/tests, generated/staged Viewer output, task/index, and concise Story/root documentation.

Do not add a seventh Match, alter domain/gameplay content, implement replay, or begin campaign expansion.

## Completion boundary

Stop when the exact five-Shift checkpoint reliably reaches the existing Shift 6 Match, its result reaches an authored ending exactly once, campaign completion is unmistakable, and the regression is protected across migration and interruption boundaries.
