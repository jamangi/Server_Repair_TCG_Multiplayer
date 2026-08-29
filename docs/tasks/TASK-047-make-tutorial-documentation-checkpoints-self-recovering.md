# TASK-047-HIGH: Make tutorial Documentation checkpoints self-recovering

## Status

**Complete — 2026-08-29.** Every current tutorial action checkpoint now exposes its exact legal intent, a bounded player-visible recovery, or an explicit safe stop. The reported zero-Action Documentation boundary recovers through the ordinary projected Pass intent without changing engine authority.

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

## Completion record — 2026-08-29

### Reproduction and root cause

The pinned failed-Verify route reproduced the reported boundary exactly: after the second Repair and passing Verify, the active player had `0` Actions, six player-authorized `view.documentable_actions`, no legal `DOCUMENT_LIVE` intent, a legal `PASS_TURN` intent, Ticket status `READY_TO_CLOSE`, and one independently valid closure bundle. The ordinary engine was correct: `DOCUMENT_LIVE` costs one Action, `PUBLISH_CLOSURE` costs zero Actions, and Pass starts a new turn with two Actions. The defect was the tutorial/presentation join. The old harness silently selected Pass, while the controller continued to target Documentation and the UI derived Documentation choices only from presently legal intents, making the six pending records disappear.

The repair uses only the player-safe projection. The controller selects one exact expected or recovery intent in definition order, explains its projected cost/state, targets and focuses its real control, returns to the unchanged checkpoint after recovery, and rejects unrelated helpers. Recovery is limited to six attempts and uses projected-state signatures to stop cycles. A missing documentable source or unrecoverable projection mismatch disables tutorial actions and presents explicit Restart/Exit guidance. Exact Card IDs now pin otherwise ambiguous source-bound tutorial actions.

The ordinary Documentation presentation now joins projected documentable records to optional legal intents. Pending records remain named and attributed when Actions are exhausted, each published source disappears exactly once, an exhausted source set is described separately, and closure legality/cost remains a separate statement and control.

### Deterministic checkpoint audit

`Docs` is projected documentable records; `Live` is legal `DOCUMENT_LIVE` intents; `Closure` is the number of projected closure bundles. “Expected” means the exact ordinary control was rendered, targeted, and allowed while catalog coach copy remained visible. Recovery rows include the additional player-facing copy and retargeted control.

| Tutorial checkpoint | Actions | Docs / Live | Ticket status | Closure | Visible route |
| --- | ---: | ---: | --- | ---: | --- |
| Fundamentals · hypothesis | 2 | 0 / 0 | `DIAGNOSIS` | 0 | Expected Set Hypothesis control |
| Fundamentals · clean diagnostic | 2 | 0 / 0 | `DIAGNOSIS` | 0 | Expected Visual Inspection control |
| Fundamentals · support | 2 | 1 / 1 | `DIAGNOSIS` | 0 | Expected RAID Status Inspection control |
| Fundamentals · confirm | 2 | 2 / 2 | `DIAGNOSIS` | 0 | Expected Drive Health Test control |
| Fundamentals · isolate | 1 | 3 / 3 | `DIAGNOSIS` | 0 | Expected Commit Isolation control |
| Fundamentals · repair recovery | 2 | 3 / 3 | `REPAIR_READY` | 0 | Search targeted; coach explains the required Card is not in hand |
| Fundamentals · repair | 1 | 3 / 3 | `REPAIR_READY` | 0 | Expected Replace RAID Member control |
| Fundamentals · verify | 2 | 4 / 4 | `AWAITING_VERIFY` | 0 | Expected RAID Health Verification control |
| Fundamentals · Document Live | 1 | 5 / 5 | `READY_TO_CLOSE` | 1 | Expected exact Document Live preview/submit control |
| Fundamentals · close | 0 | 4 / 0 | `READY_TO_CLOSE` | 1 | Expected separate zero-Action Document & Close control |
| Failed Verify · status | 2 | 0 / 0 | `DIAGNOSIS` | 0 | Expected RAID Status Inspection control |
| Failed Verify · health | 2 | 1 / 1 | `DIAGNOSIS` | 0 | Expected Drive Health Test control |
| Failed Verify · first Isolation | 1 | 2 / 2 | `DIAGNOSIS` | 0 | Expected Commit Isolation control |
| Failed Verify · first Repair recovery | 2 | 2 / 2 | `REPAIR_READY` | 0 | Search targeted; coach explains the required Card is not in hand |
| Failed Verify · first Repair | 1 | 2 / 2 | `REPAIR_READY` | 0 | Expected Replace RAID Member control |
| Failed Verify · failed Verify | 2 | 3 / 3 | `AWAITING_VERIFY` | 0 | Expected RAID Health Verification control |
| Failed Verify · second Isolation | 1 | 4 / 4 | `RETURNED_TO_DIAGNOSIS` | 0 | Expected Commit Isolation control |
| Failed Verify · second Repair | 2 | 4 / 4 | `REPAIR_READY` | 0 | Expected Rebuild RAID Array control |
| Failed Verify · passing Verify | 1 | 5 / 5 | `AWAITING_VERIFY` | 0 | Expected RAID Health Verification control |
| Failed Verify · Document recovery | 0 | 6 / 0 | `READY_TO_CLOSE` | 1 | Pass targeted/focused; coach and live region say Document Live costs 1 Action and Pass starts a two-Action turn |
| Failed Verify · Document Live | 2 | 6 / 6 | `READY_TO_CLOSE` | 1 | Returned to checkpoint; exact Document Live preview/submit control targeted |
| Failed Verify · close | 1 | 5 / 5 | `READY_TO_CLOSE` | 1 | Expected separate zero-Action Document & Close control |

The fundamentals route proves the expected affordable Documentation path. The failed-Verify route proves the legal zero-Action timing path. Pass preserved all six source IDs; one publication removed only its selected source and left the other five attributable and legal. Tutorial gating prevents an unrelated early publication from exhausting the pinned path. A projected no-source fixture stops explicitly and states that passing cannot create a record.

### Verification

All commands were run from the repository root.

- Syntax checks for the tutorial controller, game session, game page, and focused test: exit `0`.
- TASK-009/TASK-015 focused Node suites: exit `0`; `47` passed, `0` failed/skipped.
- TASK-012/TASK-015 controller/presentation regression set: exit `0`; `22` passed, `0` failed/skipped.
- Viewer baseline (`app.js`, `data-loader.js`, `entity-types.js`, and `viewer-baseline.test.mjs`): exit `0`; `3` passed, `0` failed/skipped.
- `node viewer/scripts/build-play-assets.mjs`: exit `0`; `197` deterministic assets staged.
- `node viewer/scripts/verify-play-assets.mjs`: exit `0`; `197` deterministic assets verified.
- TASK-011/TASK-030 art verification: exit `0`; `104` canonical illustrations and `23` production Story assets plus fallbacks/contact sheets verified.
- Complete Node suite (`node --test tests/*.mjs`): exit `0`; `360` passed, `0` failed/skipped.
- TASK-015/TASK-025 browser matrix across desktop, tablet, mobile, and reduced motion: exit `0`; `11` passed, `13` intentionally skipped, `0` failed. This covers keyboard, touch, reduced motion, focus, live-region output, 200% text reflow, no horizontal overflow, exact preview/publication, archive review, restart, re-explain, exit, reload, and Give Up.
- Complete browser sweep: exit `1`; `105` passed, `149` skipped, `6` failed. Two TASK-047 presentation findings from that sweep were corrected: inactive workflow height and duplicate compact/full-Ticket heading IDs. The affected fixed layout assertion then passed, and the full TASK-015/TASK-025 matrix passed again. Four failures, plus one later assertion in the shared TASK-016 accessibility test, remain from pre-existing TASK-046 catalog drift: stale `12 of 12` coverage copy, stale Ticket-name matching, and legacy deterministic helpers that cannot select the expanded response catalog. They do not exercise TASK-047 files or behavior and were not changed under this task's implementation-only boundary.
- `git diff --check`: exit `0` after final edits.

No gameplay authority, Action cost, closure rule, scoring rule, Story state, Ticket solution, or private-information boundary changed. The only unresolved items are the separately scoped legacy browser expectations named above.
