# TASK-048-HIGH: Clarify actionable Isolation evidence in tutorial guidance

## Status

**Complete — 2026-08-30.** The fundamentals tutorial now explains the mixed RAID Status result candidate by candidate, and reusable projection-safe guidance distinguishes a legal commit attempt from an accepted repair-opening Isolation without changing engine authority, hidden outcomes, or gameplay data.

## Objective

Make the Troubleshooting fundamentals tutorial explicitly distinguish a confirmed non-actionable condition from an actionable Fault that currently has only supporting Evidence, so a new player can understand why Repair is still locked and what diagnostic step will change that state.

## Confirmed evidence and interpretation

The project owner's 2026-08-29 captures show one authorized RAID Status result with two candidate-specific effects:

- `CONFIRM` — RAID Array Degraded (`fault.storage.raid.degraded`); and
- `SUPPORT` — Failed SAS Drive (`fault.storage.sas.drive_failed`).

That result is consistent with the current rules. RAID Array Degraded is a confirmed condition but is non-actionable; it cannot be the accepted repair-opening Isolation. Failed SAS Drive is actionable, but the displayed result only supports it and the pinned lesson next uses Drive Health Test for decisive candidate-specific evidence. The current generic “Why can't I isolate?” explanation mentions these rules but does not assemble them into that plain-language contrast, making the lesson sound as if it denies the visible CONFIRM result.

Preserve the data and engine behavior unless reproduction reveals a separate defect. The primary correction is candidate-role explanation and tutorial choreography.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, completed TASK-009, TASK-013, TASK-015, and completed TASK-047;
- frozen Evidence-disposition, actionable-Isolation, repair-gate, public projection, and hidden-truth rules;
- the fundamentals tutorial definition and pinned Ticket, Isolation guidance renderer/controller, Card/domain learning copy, and focused tests; and
- all three project-owner captures and the 2026-08-29 report.

## Reproduction before repair

- Replay the exact fundamentals path through RAID Status Inspection and the `tutorial.fundamentals.isolation_help` checkpoint.
- Record the pinned Ticket candidate metadata, public actionability, authorized Evidence effects, projected Isolation routes/citations, accepted Isolation state, and next expected diagnostic.
- Prove whether the engine exposes an accepted Isolation for RAID Array Degraded or only reports its non-actionable confirmation. If the former occurs, stop and record the separate authority defect before changing copy.
- Test the current explanation with the exact two-effect Evidence state; do not assess only an initial empty Ticket.

## Required behavior

### Candidate-by-candidate explanation

- The guidance must state, in direct terms, that RAID Array Degraded **is confirmed**.
- It must immediately explain that this candidate is a non-actionable condition: it describes the array state but does not identify the repairable cause and therefore cannot open Repair.
- At this exact post-RAID-Status checkpoint, include a brief, down-to-earth real-world bridge. It should convey, without requiring prior RAID expertise: “Although this Ticket is a simulation, the distinction mirrors real server work: a degraded array confirms that redundancy has been lost, but it does not yet tell you whether the drive, cable or backplane path, power, controller, or configuration is what should be repaired.” The final wording may be shorter, but it must explicitly connect that uncertainty to why Repair can remain unavailable after a valid `CONFIRM`.
- It must separately state that Failed SAS Drive is actionable but is currently **supported, not confirmed** by this Evidence, so the accepted repair-opening route is not yet available.
- The tutorial must connect the next Drive Health Test to that specific evidence gap without revealing its hidden authored outcome before the result is authorized.
- Use player-facing names first. Stable IDs and technical dispositions may remain available as secondary detail, not as the only explanation.

### Reusable projection-safe guidance

- General Isolation help should organize projected candidates by role and present state: actionable/non-actionable, strongest authorized disposition, citation count, elimination/hypothesis state, and whether a legal commit route exists.
- Explain why each unavailable candidate cannot currently be committed using only public definitions, public Ticket state, authorized Evidence, and projected legal intents.
- A condition may be confirmed without becoming repairable; a Fault may be actionable without yet having sufficient Evidence. Do not collapse either distinction.
- Preserve the generic privacy guarantee for unsupported attempts. Do not reveal whether a Candidate is secretly true, name unseen authored outcomes, or turn the guidance into an oracle.
- Candidate state must remain understandable without color alone and usable in the full Ticket at desktop, mobile, keyboard, touch, and zoom/reflow sizes.

### Tutorial copy and sequence

- Rewrite the affected coach copy so it first names what the Evidence established, then what remains unresolved, then why that blocks Repair, and finally the next legal learning action.
- Present the real-world bridge at the moment the player can see both the `CONFIRM` disposition and the locked Repair route. Do not bury it in a glossary, Card detail, or later summary.
- Keep it concise and conversational: teach the difference between confirming a system condition and identifying a safe component-level repair target, rather than listing every possible RAID failure mode as required memorization.
- Keep the lesson's intended concept: a candidate-specific disposition does not automatically establish an actionable repair target.
- Preserve all pinned Ticket identities, outcomes, legal intents, Action costs, Worklog behavior, completion, and replay progress.

## Verification

- Add focused projection/rendering tests for the exact mixed `CONFIRM` non-actionable + `SUPPORT` actionable Evidence event.
- Assert the output includes all five facts: confirmed array condition, non-actionable role, real-world component uncertainty, supported actionable drive candidate, and no accepted repair-opening route yet.
- Assert that unseen truth and unauthorized result payloads remain absent before the Drive Health Test.
- Complete the tutorial through the real Drive Health result, accepted Isolation, Repair, Verify, Documentation, and closure to prove the clarified checkpoint does not change authority.
- Cover a legal actionable CONFIRM route, a non-actionable CONFIRM route, support requiring corroboration, ruled-out/contradicted candidates, and no-evidence state so the reusable guidance does not overfit one Ticket.
- Run TASK-013/TASK-015/TASK-047 focused suites, Viewer baseline checks, staged-asset build/verification, the complete applicable Node/browser suite, accessibility/contrast checks, and `git diff --check`.
- Report commands, exit codes, pass/fail/skip totals, changed files, reproduced state, and unresolved items.

## Allowed paths

- fundamentals tutorial catalog/copy/controller files;
- projection-safe Isolation guidance rendering and narrowly required Play CSS/accessibility copy;
- focused engine/projection changes only if reproduction proves a separate authority defect;
- focused fixtures, Node/browser/visual tests, generated/staged Viewer output, root/task documentation, and `docs/tasks/INDEX.md`.

Do not change candidate IDs, actionability, authored outcomes, Ticket solutions, legal Isolation rules, Repair gating, Card balance, scoring, or hidden-truth boundaries.

## Completion boundary

Complete only when a new player can accurately explain that the array condition is confirmed but non-actionable, the failed drive is actionable but not yet decisively established, the next test addresses that exact gap, and every statement is derived from player-safe projection rather than hidden truth.

## Completion record — 2026-08-30

### Reproduction and authority finding

The exact real-engine fundamentals path was replayed through RAID Status Inspection and `tutorial.fundamentals.isolation_help`. The pinned `ticket.storage.single_sas_member` Ticket publicly exposes Failed SAS Drive, RAID Array Degraded, and RAID Controller Failure. Its single authorized current-revision Evidence event applies `SUPPORT` to Failed SAS Drive and `CONFIRM` to RAID Array Degraded. No Isolation is accepted and no Repair intent is projected.

The engine does project two legal `COMMIT_ISOLATION` attempts because the player has authorized Evidence to cite for both affected candidates. That is not an accepted route: the degraded-array attempt remains non-actionable and cannot open Repair, while the supported failed-drive attempt can still be rejected for insufficient corroboration. The next pinned action is Drive Health Test. Neither hidden `server_only_truth`, authored presence/outcome fields, nor its future Evidence result appears in the public projection. Reproduction therefore found no authority defect and required no engine or domain-data change.

### Implementation

- Added public tutorial candidate-role hints for the two relevant candidates, with strict schema and controller validation against the pinned Ticket's public candidate pool.
- Rewrote the RAID Status checkpoint to name the confirmed degraded-array condition, explain its non-actionable system-state role and real-world component uncertainty, distinguish the actionable but merely supported failed drive, state that no accepted repair-opening Isolation exists, and connect Drive Health Test to the remaining Evidence gap without forecasting its result.
- Replaced the generic Isolation summary with candidate-by-candidate, projection-safe guidance showing role, strongest authorized disposition, citation count, notebook state, legal commit-attempt availability, and accepted repair-opening state in visible text.
- Preserved the unsupported-attempt privacy guarantee and made legal-attempt versus accepted-Isolation wording explicit across actionable confirm, non-actionable confirm, support, contradiction, rule-out, inconclusive, and no-Evidence states.
- Added responsive candidate cards plus real-engine Node and browser coverage for the mixed state, full-Ticket interaction, keyboard/touch access, 200% reflow, hidden-truth absence, and complete tutorial closure.

### Verification

- `node viewer/scripts/build-play-assets.mjs` — exit 0; staged 197 files.
- `node viewer/scripts/verify-play-assets.mjs` — exit 0; verified 197 files.
- `node --check viewer/js/play/pages/game-page.mjs` and `node --check viewer/js/play/tutorial-controller.mjs` — exit 0 for both.
- `node --test tests/task-048-isolation-guidance.test.mjs tests/task-015-tutorial-reveal.test.mjs` — exit 0; 10 passed, 0 failed, 0 skipped after the final catalog placement.
- `node --test tests/task-013-diagnosis-v2.test.mjs tests/task-013-automated-campaign.test.mjs tests/task-015-tutorial-reveal.test.mjs tests/task-023-ticket-semantic-contrast.test.mjs tests/task-048-isolation-guidance.test.mjs` — exit 0; 20 passed, 0 failed, 0 skipped.
- Viewer baseline commands from `AGENTS.md` — all exit 0; three baseline tests passed, with all three JavaScript syntax checks clean.
- `node --test tests/*.test.mjs` — exit 0; 361 passed, 0 failed, 0 skipped.
- TASK-013/TASK-023 browser accessibility and contrast matrix — exit 0; 8 passed, 0 failed, 8 intentionally skipped.
- TASK-015 browser matrix — initial run: 9 passed, 10 intentionally skipped, and 1 Windows process-cleanup `EPERM`; the exact affected mobile case reran with exit 0 and 1 pass.
- Final real-tutorial browser smoke checks — exit 0; both desktop tutorials completed through closure (1 pass), and the fundamentals mobile/keyboard route completed through closure (1 pass).
- Complete Playwright suite — 104 passed, 149 skipped, 7 failed in the parallel run. The two transient TASK-032/TASK-038 failures reran together with exit 0 and 2 passes. The five remaining failures are the pre-existing TASK-046 catalog/legacy-expectation drift recorded below; no TASK-048 or TASK-015 acceptance test failed.
- `git diff --check` — exit 0.

### Changed files

- `content/gameplay-v1/tutorials-v1.json`
- `schemas/client/tutorial_catalog.schema.json`
- `viewer/js/play/tutorial-controller.mjs`
- `viewer/js/play/pages/game-page.mjs`
- `viewer/css/play.css`
- `viewer/generated/play/content/gameplay-v1/tutorials-v1.json`
- `viewer/generated/play/manifest.json`
- `tests/task-015-tutorial-reveal.test.mjs`
- `tests/task-048-isolation-guidance.test.mjs`
- `tests/browser/task-015-tutorial-reveal.spec.mjs`
- `docs/tasks/TASK-048-clarify-actionable-isolation-evidence-in-tutorial-guidance.md`
- `docs/tasks/INDEX.md`

### Unresolved items

The complete browser sweep retains five failures already documented at the TASK-047 boundary: the TASK-010 keyboard fixture expects a diagnosis helper absent from its legacy bench entry; TASK-012 continuity exhausts its held-response search within 30 intents; two TASK-014 assertions still expect `12 of 12` instead of the released `12 of 18`; and TASK-016's dialog-name regular expression excludes the current expanded Ticket title. These are outside TASK-048's allowed behavioral scope. No TASK-048 requirement remains unresolved.
