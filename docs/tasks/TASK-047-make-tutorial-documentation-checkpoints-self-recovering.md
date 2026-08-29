# TASK-047-HIGH: Make tutorial Documentation checkpoints self-recovering

## Status

**Active.** This is the next implementation task. It precedes TASK-048 because the reported recovery tutorial can present an apparently blocked required action at its closing boundary.

## Objective

Make every guided-tutorial action checkpoint expose an understandable, visible path to its required real-engine intent, with particular attention to the failed-Verify recovery tutorial's final `DOCUMENT_LIVE` step.

The tutorial must continue to use the ordinary authoritative engine. Do not make Documentation legal when the projection says it is not legal, bypass Action costs, fabricate a documentable result, or close a Ticket through tutorial-only authority.

## Confirmed evidence and working diagnosis

The project owner's 2026-08-29 capture reaches `tutorial.verify_recovery.document_live` after the passing Verify. The full Ticket shows no Document Live choices while Document & Close is visible but disabled by the tutorial.

The pinned Node replay currently passes because its harness is allowed to submit `PASS_TURN` as a helper whenever the expected `DOCUMENT_LIVE` intent is absent. The player-facing checkpoint does not explain that recovery or retarget its guidance to Pass. `DOCUMENT_LIVE` also requires one Action, whereas `PUBLISH_CLOSURE` is a separate zero-Action transaction. The exact captured projection and Action count must be reproduced before choosing the repair, but the passing helper-driven test does not disprove the usability defect.

Also audit the owner's broader observation that Document Live choices can disappear near closure after one result is published. Distinguish these valid states:

- eligible private results exist, but the active player has no Action to publish one;
- all otherwise eligible results have already been documented;
- no source result is authorized/documentable for that player;
- the Ticket is ready for the separately legal closure transaction; and
- a tutorial checkpoint requires a specific action that the current public/private projection cannot presently expose.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, completed TASK-009, TASK-015, and TASK-025;
- `content/gameplay-v1/tutorials-v1.json`, tutorial schemas, controller, game page Documentation UI, local tutorial progress, Worker/session bridge, and staged equivalents;
- authoritative `DOCUMENT_LIVE`, Action-economy, Worklog publication, closure-bundle, projection, and legal-intent code plus focused Node/browser tests; and
- the project owner's 2026-08-29 recovery-tutorial screenshot and report.

## Reproduction before repair

- Reproduce the pinned failed-Verify tutorial through its exact repair → failed Verify → returned Diagnosis → second Isolation → second Repair → passing Verify path.
- At every checkpoint, record Actions remaining, `view.documentable_actions`, legal `DOCUMENT_LIVE` intents, legal helper intents, Ticket status, closure bundle, rendered controls, tutorial target, and coach copy.
- Reproduce both the expected route and at least one legal timing route that arrives at the Documentation checkpoint with zero Actions.
- Determine whether Pass always recovers the pinned route and whether any supported action sequence can exhaust or document every eligible source before the checkpoint.
- Add a failing regression that uses visible UI behavior. A helper that silently submits Pass or another recovery action without asserting the coach's player-facing explanation is insufficient.

## Required behavior

### Reachable semantic checkpoints

- Every `ACTION` checkpoint must have either its expected legal intent or a bounded, legal, player-visible recovery step.
- If the expected action is temporarily unaffordable, the tutorial must say why, identify the exact projected recovery action, move its target/focus treatment to that control, and return to the original checkpoint after recovery.
- For the reported zero-Action state, the player must be told that Document Live costs one Action and that Pass begins a fresh turn. The enabled Pass control must be visibly targeted; the disabled Document & Close control may not be presented as the way forward.
- If the expected action cannot be recovered from the current projection, the tutorial must fail safely with an explicit restart/exit explanation rather than trapping input or indefinitely accepting irrelevant helpers.
- The controller must not infer hidden Ticket truth or invent legal actions. Its decisions must use the same player-safe projection and tutorial definition already available to the UI.

### Honest Documentation presentation

- When player-safe `documentable_actions` exist but no `DOCUMENT_LIVE` intent exists solely because Actions are exhausted, the UI must preserve an honest indication of the pending documentable records and their one-Action requirement instead of making them look nonexistent.
- When nothing remains documentable, say so distinctly. Do not show stale preview/submit controls and do not imply that passing will create a record.
- Publishing one result must remove only that exact source from future Document Live choices. Remaining eligible sources stay attributable and usable.
- Ready-to-close status, Document Live availability, and Document & Close legality must remain distinct. Do not force a redundant live publication as a general closure prerequisite.
- Preview cancellation, exact-result attribution, single-submit protection, Worklog chronology, and archived Ticket review from TASK-025 remain unchanged.

### Tutorial-wide guard

- Validate every current tutorial action checkpoint against its pinned deterministic path and supported recovery actions, not only the reported checkpoint.
- Bound recovery attempts and detect cycles. A definition whose expected intent can never become legal must fail validation or a deterministic semantic-reachability test.
- Preserve replay, restart, back/re-explain, exit, reload, keyboard, touch, reduced-motion, and Give Up behavior.

## Verification

- Add a deterministic engine/controller test for the reported zero-Action recovery state and assert the actual projection before and after Pass.
- Add browser coverage that stops at the empty-looking Documentation state, proves the coach explains and targets Pass, submits it through the visible control, then previews and publishes one exact result and closes normally.
- Add a no-documentable-source fixture that produces an explicit safe explanation rather than an inert checkpoint.
- Assert existing ordinary Match behavior: Document Live costs one Action; closure remains zero Action and independently validated; already documented sources cannot be republished; no private result leaks.
- Exercise desktop, mobile, keyboard, touch, reduced motion, 200% zoom/reflow, focus restoration, live-region output, and no-overflow behavior.
- Run all TASK-009/TASK-015/TASK-025 focused suites, Viewer baseline checks, staged-asset build/verification, the complete applicable Node/browser suite, and `git diff --check`.
- Report commands, exit codes, pass/fail/skip totals, changed files, reproduced state, root cause, and unresolved items.

## Allowed paths

- tutorial catalog/schema/controller/progress files;
- Play Documentation presentation, game page, session/Worker integration, and narrowly required CSS/accessibility copy;
- focused engine/projection changes only if reproduction proves a real authority defect rather than a presentation/checkpoint defect;
- focused fixtures, Node/browser/visual tests, generated/staged Viewer output, root/task documentation, and `docs/tasks/INDEX.md`.

Do not change Ticket solutions, card/domain content, Action costs, closure authority, scoring, Story, Local solo persistence, or frozen gameplay rules.

## Completion boundary

Complete only when the captured recovery tutorial cannot strand a player at an empty Documentation step, every tutorial checkpoint has a tested visible legal route or explicit safe failure, ordinary Documentation semantics remain frozen, and the full pinned tutorials complete through real controls without silent harness-only recovery.
