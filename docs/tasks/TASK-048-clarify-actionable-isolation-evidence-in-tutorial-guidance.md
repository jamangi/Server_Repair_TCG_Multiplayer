# TASK-048-HIGH: Clarify actionable Isolation evidence in tutorial guidance

## Status

**Planned after TASK-047.** The report is supported as an instructional-clarity defect, not as evidence that the authoritative disposition data is contradictory.

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
