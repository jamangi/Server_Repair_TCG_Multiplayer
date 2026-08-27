# TASK-025-HIGH: Refine Documentation and archived Ticket review

## Status

**Active.** This is the next V0 task. It is a bounded operational-record and Viewer interaction pass; it changes neither Documentation legality nor information visibility.

## Objective

Make Documentation deliberate and legible, then make completed work reviewable. `Document Live` must preview the exact eligible result before the Player spends an Action, the resulting Worklog must name what was published, and every archived Ticket must open as a compact read-only record of the authorized Evidence and Worklog history.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, and `docs/tasks/INDEX.md`;
- `docs/design/decisions/FROZEN_RULES.md` §§14–15 and the current solo profile;
- completed TASK-009, TASK-010, TASK-012, TASK-018, TASK-021, and TASK-024;
- Card/result/Event/Worklog/Ticket/projection schemas and valid examples;
- engine Documentation, projection, closure/archive, and result-attribution code and tests;
- Play Ticket workflow, Evidence/Worklog, dialog controller, archived-Ticket rendering, Worker/session boundary, styles, and browser tests.

## Required behavior

### Document Live preview and confirmation

- Replace each immediate-submit `Document Live` control with a clearly identified eligible source. Two eligible records may not appear as indistinguishable buttons.
- Opening it shows the shared accessible Play dialog with Ticket, original Worklog sequence, source action/result, actor/visibility where authorized, the exact public summary to be published, one-Action cost, and applicable Card-return consequence.
- The dialog has `Document` and `Cancel`. `Document` submits exactly one identifier-based legal intent through the Worker. `Cancel`, Escape, or backdrop click closes without payment, mutation, selection loss, or a retained invisible overlay.
- Disable duplicate submission while settling. On rejection, retain enough context to explain the reason and confirm that nothing was spent. On success, close safely, restore semantic focus, and route to the enriched Worklog entry.
- Never synthesize authority in the modal. All selectable sources and preview data come from the authenticated projection/legal intent. No hidden or unauthorized result enters the DOM.

### Precise Worklog attribution

- Preserve the frozen in-place enrichment of the original Worklog placeholder, its action time, publication time, sequence, and publisher.
- Replace the generic `A structured result was published to the Worklog` / `Live placeholder` Document-Live trace with player-facing attribution such as `Published Drive Health Test result from Worklog #5.` The wording may vary by source family but must identify the published item deterministically.
- Keep the substantive public result in the original enriched entry; do not duplicate Evidence, change scoring, or imply that the Documentation trace is itself a second technical result.
- Rendering distinguishes an undocumented live placeholder, a later-published original entry, and the separate Document action without exposing raw engine vocabulary in primary copy.

### Archived Ticket inspector

- Render archived entries as keyboard- and touch-operable controls with state/outcome, title, and stable player-safe identifier.
- Open a read-only dialog containing a compact Ticket summary, closure or abandonment outcome, authorized Evidence, chronological Worklog, isolation/repair/verify/document milestones, contributors where visible, and links to existing solution-reveal material only when that reveal is already authorized.
- Read only from the current authenticated closed/abandoned Ticket projection. Do not reconstruct history from DOM text, local profile counters, hidden Builder data, or mutable active-Ticket state.
- Archived review offers no Hypothesize, Isolate, Repair, Verify, Document, Give Up, or targeting controls and cannot change the selected active Ticket.
- Empty and legacy/incomplete records degrade honestly, without fabricating `None yet` beneath real archive entries.

## Interaction and accessibility acceptance

- Reuse the centralized dialog lifecycle established by TASK-018: one active dialog, correct accessible name, focus trap, focus restoration, teardown on rerender/navigation, and no blurred page without visible dialog.
- Backdrop cancellation applies only to the preview/archive dialogs and must not accidentally submit.
- Evidence and Worklog chronology remain understandable without color or animation. Long records scroll inside a labelled region while the page and selected active Ticket retain position.
- Desktop, narrow desktop, mobile, keyboard, touch, screen-reader announcements, reduced motion, zoom/reflow, and forced-colors all remain usable.

## Tests and verification

Add behavior-focused tests proving:

- preview open/cancel paths mutate nothing and success spends exactly one Action once;
- preview identity/public summary/Card-return wording corresponds to the legal intent and source record;
- original placeholder enrichment and precise Document trace preserve sequence and timestamps;
- multiple eligible sources remain distinguishable and stale/duplicate submissions reject before payment;
- closed and abandoned Ticket inspectors show only authorized per-Ticket Evidence/Worklog and never active controls or hidden truth;
- dialog close/reopen, Escape, backdrop, navigation, focus restoration, scroll retention, and responsive behavior do not regress;
- projections and engine determinism remain unchanged except for any explicitly versioned presentation field needed to carry attribution.

Run the full repository suite and staged Viewer checks, including the `AGENTS.md` baseline commands, browser interaction tests, visual captures for both dialogs, `node viewer/scripts/build-play-assets.mjs`, `node viewer/scripts/verify-play-assets.mjs`, and `git diff --check`. Record commands, exit codes, pass/fail totals, changed files, and unresolved items.

## Allowed paths

- engine/projection code only where precise existing Documentation attribution is unavailable;
- compatible schemas/examples only if a presentation field must be versioned;
- Play game/dialog/archive modules and styles;
- staging outputs produced by canonical scripts;
- tests, visual-QA evidence, task/index, and user documentation.

Do not change Documentation costs, eligible visibility, Card disposition, closure rules, archive truth, match persistence, scoring, stable IDs, or content.

## Completion boundary

Stop when current V0 Documentation and archive review meet this contract. Do not add the Story tab, Story persistence, story scripts, or story art in this task.
