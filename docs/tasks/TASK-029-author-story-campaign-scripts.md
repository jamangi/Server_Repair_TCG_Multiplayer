# TASK-029-XHIGH: Author the Story campaign scripts and choreography

## Status

**Approved and queued; blocked by TASK-027 and TASK-028 completion.**

## Objective

Turn the approved campaign graph into complete dramatic scenes: dialogue, narration, choices, character entrances/exits/expressions, location use, technical inserts, transitions, debriefs, and Match bridges. Preserve the graph's tested gameplay and branch semantics while deepening drama, humor, relationships, and operational stakes.

## Required reading

Read completely before editing:

- `AGENTS.md`, this task, root `README.md`, `docs/tasks/INDEX.md`, TASK-005, TASK-015, TASK-024, and completed TASK-026 through TASK-028;
- all `docs/story/`, especially `STORY.md`, `CHARACTERS.md`, `VOICE.md`, `VISUAL_DIRECTION.md`, approved additions/backgrounds, and the complete TASK-027 campaign blueprint;
- the six project-owned Story references indexed by [`docs/ui-plan/ui-reference_images/README.md`](../ui-plan/ui-reference_images/README.md#11--story-mode-composition-and-art-direction), using their dialogue/choice rhythm, environmental scale, and ensemble readability without copying incidental text or treating depicted identities as canon;
- Story authoring schema/validation, Viewer scene-player constraints, frozen rules, domain terminology, playable Match configurations, and solution/privacy boundary.

## Authoring contract

- Write every production label and branch in the declarative format. Do not change runtime code to accommodate a scene shortcut.
- Preserve each node's approved entry/exit, branch predicate, checkpoint, Match reference, and normalized outcome handling. Request a graph revision when drama requires a semantic change.
- Give choices distinct intent and later acknowledgment. Use both immediate route choices and remembered decisions whose consequences appear in later labels; avoid false choices whose wording promises an effect the graph cannot represent.
- Keep technical action meaningful and accurate. Expand acronyms naturally, let characters differ in expertise/voice, and avoid turning dialogue into a service manual or tutorial dump.
- Foreshadow public context but never reveal a hidden Fault, required Evidence, or correct diagnostic before engine authorization. Do not let a character know more than their role and current information allow.
- Write success, abandonment, restart, low/high contribution, and relevant branch variants without shaming the learner or claiming certainty the result does not support.
- Use `ADDITIONAL_CHARACTERS.md` and `BACKGROUNDS.md` as registries. Additions require explicit rationale and full continuity/voice entries; do not create one-scene disposable characters merely to deliver exposition.

## Choreography

Each statement sequence should specify reusable background, tagged character/variant/position, transient insert, transition hint, speaker, and accessible dialogue/choice text. Choreography remains effective with all motion disabled and with placeholders. Do not encode critical information only in pose, lighting, sound, or raster text.

## Editorial and validation pass

- Audit continuity across every reachable route, call/return sequence, replay, and reconvergence.
- Audit voice differentiation, repeated exposition, branch acknowledgment, terminology, technical claims, safety framing, privacy, text length, mobile dialogue density, and localization readiness.
- Generate route scripts/transcripts for every ending/outcome band and review them beside graph coverage.
- Replay every Story Match boundary; content edits may not change its seed/configuration or invalidate solvability.
- Run story validators, exhaustive bounded route traversal, transcript snapshots, browser scene smoke tests, full relevant repository tests, and `git diff --check`. Record commands, exit codes, pass/fail totals, changed files, and unresolved items.

## Allowed paths

- production declarative Story script packs and localized source copy;
- story continuity, character, background, and editorial ledgers;
- asset briefs/placeholders referenced by the scripts;
- tests, generated transcript/coverage reports, task/index/player documentation.

Do not create final art, alter Story runtime semantics, change gameplay rules/content, or bypass the approved graph/Match configuration.

## Completion boundary

Stop when every approved route is fully written, validated, playable with placeholders, and ready for art production.
