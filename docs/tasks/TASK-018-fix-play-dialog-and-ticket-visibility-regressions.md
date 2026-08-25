# TASK-018-HIGH: Fix Play dialog lifecycle and Ticket-visibility regressions

## Status

**Active — no product approval required.** This is a corrective regression task discovered immediately after TASK-016. Complete it before TASK-019 or TASK-015 relies on the affected dialogs and Ticket geometry.

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
