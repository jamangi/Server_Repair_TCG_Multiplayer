# TASK-012-HIGH: Fix solo-client interaction defects

## Status

**Ready — independent of the post-playtest rule decisions.** Implement this task before deeper gameplay/content work so later browser tests and playtesting use a stable interface.

## Objective

Fix two TASK-010 regressions and one result-discoverability weakness without changing gameplay:

1. the selected Ticket's internally scrollable sheet returns to its top after ordinary clicks, Worker projections, tab changes, and other same-route rerenders; and
2. text controls that rerender their surrounding view after each input event move the caret to the start, causing sequential typing to appear in reverse or at the wrong insertion point; and
3. an accepted Card action can target a Ticket other than the Ticket currently displayed, while Evidence/Worklog remains filtered to the displayed Ticket, making the correctly created result easy to overlook.

## Verified causes and boundary

- `play-app.mjs` reconstructs the complete Play shell during `rerender()`, including after every game-session change.
- `game-page.mjs` does not preserve the selected Ticket sheet's internal scroll position across reconstruction.
- Library search and deck search rebuild their markup during an input event and then refocus a newly created control without restoring its selection range.
- Existing acceptance tests use `fill()`, which replaces a value atomically and does not reproduce real character-by-character caret behavior.
- `game-page.mjs` falls back to every legal target for the selected Card when that Card has no legal intent for the selected Ticket. The action label correctly names the other Ticket, but submitting it does not change `selectedTicketId`; the resulting Evidence exists and is announced transiently while the persistent Evidence panel continues showing the previous Ticket.

These are UI state-continuity defects. Do not change the engine, Ticket Builder, rules, content, Card legality, hidden information, or persistence formats.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, and `docs/tasks/INDEX.md`;
- the TASK-010 completion record and `tests/visual/task-010/README.md`;
- `viewer/js/app.js`, `library-view.js`, and all files under `viewer/js/play/pages/`;
- `viewer/js/play/play-app.mjs`, `game-session.mjs`, `dom-utils.mjs`, and `motion-coordinator.mjs`;
- current Play/Library CSS that defines internal scroll containers; and
- `tests/browser/task-010-solo.spec.mjs` plus Viewer/client Node tests.

## Requirements

### Scroll continuity

- Preserve document scroll and every named internal scroll surface during a same-route state update when the underlying semantic surface still exists.
- At minimum cover the selected Ticket sheet, Evidence/Worklog surface, hand strip, Ticket strip, deck Card grid, and deck summary where each can independently scroll.
- Key stored positions by stable semantic identity such as route, Ticket instance ID, active panel, or deck ID—not DOM index.
- A click, legal/rejected intent, draw, Evidence update, action-resource update, candidate/Hypothesis selection, and Evidence/Worklog tab switch must not jump the user's current Ticket reading position.
- Intentional route navigation, selecting a different Ticket, opening a result, or an explicit focus transition may choose a new position, but the behavior must be documented and tested.
- Focus restoration must use `preventScroll` where supported and must not fight a user-initiated scroll.
- Prefer updating stable DOM regions or an explicit capture/restore service over scattered one-off `scrollTop` assignments.

### Text-entry continuity

- Inventory every text/search input in Library, Home/Settings, Decks, deck editing, Profile, game controls, dialogs, and import preview.
- Character-by-character typing, insertion in the middle, selection replacement, Backspace/Delete, arrow navigation, Home/End, paste, and composition events must preserve value and `selectionStart`, `selectionEnd`, and direction.
- Do not reconstruct an input merely to filter adjacent results when a smaller result-region update is practical.
- When reconstruction is necessary, capture and restore the active control by stable identity plus its selection after the new DOM exists.
- Do not rerender while an IME composition is active; apply filtering after composition completes.
- Debouncing is allowed only if it does not make values, validity, result counts, or announcements stale or nondeterministic.

### Architecture

- Add one reusable UI continuity mechanism rather than fixing only the two controls reported by the first playtest.
- Preserve existing unsaved deck/profile drafts, dialogs, reduced-motion behavior, live announcements, and idempotent navigation.
- Do not suppress legitimate route focus management or accessibility announcements to hide the defect.

### Action-target and result continuity

- Keep the current engine rule that an accepted diagnostic creates an `EVIDENCE_CREATED` event. The reported `Storage Device Inventory` action correctly created Evidence for `The Missing Storage Path`; this task improves presentation and selection continuity and must not invent client-side Evidence.
- Make a selected Card's target scope unmistakable before submission. Do not visually imply that an action applies to the displayed Ticket when its intent targets another Ticket.
- After any accepted action, preserve a persistent route to its result. When the result belongs to another active Ticket, either select that Ticket and reveal/highlight its new Evidence/Worklog entry or retain the current Ticket and display a persistent result notice with a keyboard-accessible `View result` control.
- The result presentation must name the action, target Ticket, resource/Card disposition, and plain-language result. A result with no candidate effect must say so; it must not look like missing output.
- Live-region announcements remain required but are supplementary. Do not make a transient screen-reader/toast message the only way to recover a paid result.
- Rejected actions must continue to identify the rejection and show that no Action/Card/token was spent.

## Required tests

Add browser regression tests that use sequential key presses rather than only `fill()`:

- type `storage` into Library search and deck search and assert the exact value and caret offset after every character;
- place the caret inside an existing string, insert and delete characters, and assert exact value/selection;
- verify composition-safe behavior through dispatchable composition/input events where the browser harness supports it;
- scroll the selected Ticket sheet to a nonzero position, perform representative no-op UI clicks and accepted/rejected engine intents, and assert that the same semantic surface retains its scroll position within a small tolerance;
- verify selecting another Ticket uses its own position and returning restores the prior Ticket position;
- select a Card that is invalid for the displayed Ticket but valid for another Ticket, assert the alternate target is explicit, submit it, and prove the resulting authoritative Evidence is persistently visible or reachable from the result notice;
- assert the accepted action's Action/Card payment is displayed alongside its result, while a rejected action reports zero payment;
- cover desktop and narrow mobile internal-scroll layouts; and
- ensure focus remains on the intended control without document-level scroll jumps.

Run and report:

```powershell
node --check viewer/js/app.js
node --check viewer/js/data-loader.js
node --check viewer/js/entity-types.js
node --test tests/*.mjs
<task-specific Playwright command across desktop and mobile>
git diff --check
```

## Allowed paths

- `viewer/js/app.js`
- `viewer/js/library-view.js`
- `viewer/js/play/**`
- `viewer/styles.css`
- `viewer/styles/**`
- `tests/**`
- `docs/tasks/INDEX.md`
- this task file

Generated Play assets may be rebuilt if a canonical staged module changes. Do not hand-edit generated files or `viewer/content/manifest.json`.

## Completion boundary

Complete only when real sequential typing and same-route Ticket interaction no longer move the caret or reset reading position; every accepted cross-Ticket action leaves its target and result persistently visible or reachable; desktop/mobile browser regressions prove the two fixes and discoverability improvement; all TASK-010 behavior and visual baselines remain intact; and no gameplay/rule/content change is included.
