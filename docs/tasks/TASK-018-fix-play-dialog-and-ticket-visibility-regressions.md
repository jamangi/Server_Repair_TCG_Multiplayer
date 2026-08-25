# TASK-018-HIGH: Fix Play dialog lifecycle and Ticket-visibility regressions

## Status

**Complete — 2026-08-25.** Reusable Play dialogs now clear every transient animation state across repeated and interrupted use, and the selected Ticket keeps its required public information visibly usable with verified dark-ink contrast.

## Objective

Restore trustworthy repeated dialog use and the minimum always-visible Ticket information promised by TASK-016 without changing gameplay, projections, content, or persistence.

This task fixes observable defects. It does not redesign the Diagnostic Bench or response hand; TASK-019 owns those components.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, and completed TASK-012/TASK-016;
- `docs/ui-plan/ui-reference_images/README.md`, especially `task-016-postpass-relevant.png`, `task-016-postpass-global.png`, and the TASK-016 before/target references;
- Play dialog helpers, motion coordinator, game/deck/settings dialog callers, Card detail views, UI-continuity code, active-Match CSS, and every existing dialog/focus/browser test; and
- TASK-016 accepted visual captures, treating them as evidence rather than proof of legibility.

## Confirmed regressions

### Invisible modal after animated close

Reproduction reported by the project owner:

1. open an Inspect or full-Ticket modal;
2. close it with the top-right `×` control;
3. invoke the same modal again; and
4. observe the backdrop and page blur while the modal panel remains invisible. `Escape` dismisses the invisible top-layer dialog, and a later rerender may make the control appear to recover.

The current `closeDialogWithMotion()` leaves a finished Web Animation with `fill: "forwards"` attached to the reused dialog. That is a strong root-cause hypothesis because the retained opacity/transform effect, invisible open dialog, Escape behavior, and rerender recovery align. Reproduce first and prove the cause; do not merely add a timeout or force a rerender.

### Selected-Ticket clipping

In Global mode, the vellum/padding remains visible while the Ticket title/status, symptom, Candidates, and most of `View full Ticket` are clipped. A container fitting in the viewport is not sufficient when its required descendants are outside its visible content box.

### Symptom contrast

The persistent Ticket symptom uses pale text on light vellum and is not comfortably readable. It must use the Ticket's dark-ink text system and meet ordinary-text contrast requirements in every selected-Ticket composition.

## Dialog lifecycle contract

- One helper owns open, opening motion, closing motion, cleanup, and focus restoration for reusable Play dialogs. Callers must not leave independent animation/focus state behind.
- Before every `showModal()`, cancel or remove stale close/open animations and reset transient closing state. A finished fill effect must never survive into the next opening.
- Every close path—`×`, `Escape`, supported backdrop/cancel behavior, form completion, route teardown, and reduced-motion closure—must leave the dialog closed, visible-state styles neutral, top-layer/backdrop removed, listeners bounded, and the correct surviving opener focused once.
- Closing during opening motion, reopening immediately after close, rapid repeated activation, and rerender/route teardown during motion must fail safely. Do not use arbitrary sleeps as correctness boundaries.
- An invisible `dialog[open]`, orphaned backdrop, duplicate close handler, or focus sent to a detached opener is a failure.
- Apply the lifecycle correction to every reusable Play dialog that shares the affected helpers; do not patch only `#game-card-dialog` while leaving full-Ticket, Deck, editor, or Settings variants inconsistent.

## Persistent Ticket visibility contract

At every agreed desktop reference—including a wide approximately 2:1 viewport—and at 200% zoom/reflow where the desktop composition remains active:

- the selected Ticket's identity/title, status, concise symptom, public Candidates, machine revision where projected, and one-step `View full Ticket` route are visibly rendered rather than merely present in the DOM;
- required content must not be hidden by fixed row heights, `overflow: hidden`, later cascade overrides, or a neighboring Bench row;
- `View full Ticket` retains a complete 44px-class target and accessible name;
- Global may remain more compressed than Relevant, but compression cannot reduce the persistent Ticket to blank vellum or clipped fragments; and
- the symptom uses a semantic dark-ink token with verified contrast against all Ticket paper backgrounds and selected/returned states.

Prefer content-aware minimums and explicit overflow decisions over increasing one magic row height for one captured viewport.

## Validation

Add browser regressions that prove, with full motion and reduced motion:

- Inspect open → `×` close → same Inspect reopen is visible and usable for at least five consecutive cycles;
- full Ticket open → `×` close → reopen, plus `Escape` close → reopen;
- close during motion and immediate reopen cannot leave an invisible `dialog[open]` or backdrop;
- focus restores to the correct opener after each close, and route teardown does not focus detached elements;
- all shared Play dialog variants either use the corrected lifecycle or prove their independent safe lifecycle;
- required Ticket descendants have nonzero visible intersection with the Ticket content box in Relevant and Global modes at 1366×768, 1920×1080, 1920×960, tablet, phone, and zoom/reflow cases;
- the full `View full Ticket` control is visible and actionable in Global mode; and
- computed symptom/background colors meet at least WCAG AA 4.5:1 for ordinary text.

Do not count `dialog.open === true`, a panel's outer bounding box, absence of document scrolling, or a screenshot file's existence as proof of visible usable content. Assert descendant visibility and run a human visual comparison against the post-pass defect captures.

Run the full repository suite, staged Viewer verification, all dialog/browser matrices, affected visual captures, accessibility/contrast checks, and `git diff --check`.

## Allowed paths

- Play dialog, motion, continuity, game/deck/settings page modules
- affected Play CSS and shared visual tokens
- browser/Node/visual tests and focused UI evidence
- `docs/ui-plan/**`
- `docs/tasks/INDEX.md`, this task, and TASK-015 dependency status

Do not change engine rules, legal intents, Card/Ticket schemas or content, Bench membership/filter semantics, deck behavior, results, statistics, or tutorial scripting.

## Completion boundary

Complete only when every affected dialog survives repeat open/close/reopen under real motion without invisible top-layer state; required selected-Ticket information and the full-ticket route are visibly usable in both Bench Views; symptom contrast is verified; tests assert child-level usability rather than container geometry alone; and no rerender workaround or gameplay mutation was introduced.

## Completion record — 2026-08-25

### Outcome

- Reproduced the owner report in real Chromium before editing. After the animated `×` close, the reused dialog retained one finished 160 ms Web Animation with `fill: "forwards"`; reopening left `dialog.open === true` while computed opacity remained `0` and the closing transform remained applied.
- Replaced the split open/motion/focus behavior with one Play-dialog lifecycle owner. It neutralizes stale opening and closing animations before every open, uses non-retaining motion, supports interrupted close/reopen, owns `×`, `Escape`, backdrop, form-completion, reduced-motion, and teardown paths, bounds listeners, and restores focus once only when the opener still survives.
- Applied that lifecycle to game Inspect, full Ticket, Deck inspect, editor inspect, and Settings. Same-route reconstruction and route teardown close top-layer dialogs immediately without focusing controls that are about to detach; no caller invokes `showModal()`, `close()`, or independent dialog motion directly.
- Made selected-Ticket row sizing content-aware, restored the compact physical Ticket padding in the final desktop cascade, allowed Candidates to wrap into visible space, and added the projected machine revision to the persistent summary. Phone composition prioritizes the public Ticket text over decorative art so title, status, symptom, Candidates, revision, and the complete full-Ticket route remain present.
- Changed the persistent symptom to semantic `--play-ink-900` on Ticket vellum. The verified `#191a18` on `#f3ead8` pair has a 14.62:1 contrast ratio, exceeding WCAG AA ordinary-text requirements.

### Verification

| Command | Exit | Result |
| --- | ---: | --- |
| `node viewer/scripts/build-play-assets.mjs`; `node viewer/scripts/verify-play-assets.mjs` | 0 | 40 deterministic Play assets staged and verified |
| `node --check viewer/js/app.js`; `node --check viewer/js/data-loader.js`; `node --check viewer/js/entity-types.js` | 0 | baseline Viewer syntax passed |
| `node --test tests/viewer-baseline.test.mjs` | 0 | 3 passed, 0 failed, 0 skipped |
| `node --test tests/*.test.mjs` | 0 | 119 passed, 0 failed, 0 skipped |
| `node tools/run-automated-games.mjs --verify-report automated_games/task-009-foundation-v1` | 0 | 22 frozen rows verified with 0 deterministic mismatches |
| `node tools/run-task-014-campaign.mjs --verify-report automated_games/task-014-playable-coverage-v3` | 0 | 13 expanded-content rows verified with 0 deterministic mismatches |
| Playwright TASK-018 dialog/Ticket matrix | 0 | 7 passed, 0 failed, 5 intentional project skips |
| Playwright TASK-016 compatibility matrix | 0 | 7 passed, 0 failed, 13 intentional project skips |
| Complete Playwright browser matrix | 0 | 36 passed, 0 failed, 52 intentional project skips |
| TASK-018 focused visual regeneration | 0 | 3 passed, 0 failed |
| `git diff --check` | 0 | no whitespace errors |

### Visual evidence

- Reopened Inspect: 1366×768 full-motion desktop after an immediate close/reopen interruption; the panel, Card detail, close control, and backdrop are visibly usable.
- Relevant selected Ticket: 1920×960 with identity, status, symptom, all public Candidates, machine revision, and full 44px-class detail route visible.
- Global selected Ticket: 1920×960 with the same child-level contract preserved in the compressed catalog composition.

### Changed-file inventory

Fifteen files changed within the task allowlist: this task, `docs/tasks/INDEX.md`, and the TASK-015 dependency status; Play CSS; six Play dialog/game/deck/settings/shell modules; the new TASK-018 browser matrix; and a focused visual README plus three accepted captures. Rebuilt generated Play assets remained byte-identical.

### Unresolved items

None for TASK-018. Gameplay, legal intents, projections, content, persistence, Bench membership, and response-hand behavior are unchanged. TASK-019 is now the active UI refinement; TASK-015 remains blocked only on TASK-019.
