# TASK-016: Refine Diagnostic Bench and game-board composition

## Status

**Proposed — blocked on TASK-012, TASK-013, and TASK-014.** Fix continuity first, stabilize authoritative Global availability and switchable Bench View semantics second, and populate representative Ticket/diagnostic data third. This task is the dedicated whole-board density, responsive-composition, and visual-polish pass before tutorial overlays depend on final control locations.

## Objective

Refine the solo Night-Shift board so its primary troubleshooting surfaces are simultaneously legible at ordinary desktop sizes, each approved Diagnostic Bench View receives a layout suited to its information volume, and unavoidable scrolling is confined to intentionally bounded collections rather than the selected Ticket or Legal Action.

This task changes presentation, not game authority. It consumes player-safe projections and legal intents established by TASK-013/TASK-014 and must not infer relevance, legality, target compatibility, costs, or results in the DOM.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, and completed TASK-010/TASK-012 through TASK-014;
- `docs/design/decisions/{FROZEN_RULES,APPROVALS}.md` and the approved successor solo profile;
- `docs/ui-plan/{README.md,TODO.md,ui-defense.md}`;
- every file and the complete README under `docs/ui-plan/ui-reference_images/`, especially `relevant_diagnostic_bench.png`, `global_diagnostic_bench.png`, and the mobile reference;
- current Play game-page, Card, dialog, motion, art-resolution, and continuity modules plus all Play CSS; and
- relevant Node, browser, visual, accessibility, and responsive tests.

## Reference boundary

The two Bench mockups are approved information-hierarchy studies, not pixel specifications or authoritative fixtures. Preserve their useful ideas while rendering current projections:

- different composition for compact Relevant and high-volume Global catalogs;
- split or compressed selected-Ticket summaries;
- fully visible Legal Action confirmation;
- stronger vertical use of the Ticket queue; and
- a visually separate private Repair/Verify response hand.

Do not copy pictured counts, names, categories, outcomes, costs, rules text, or assumptions about legality. Do not expose hidden truth to reproduce a pixel.

## Desktop composition requirements

At the task's agreed reference desktop viewports, the primary board must fit within the available viewport without document-level vertical scrolling. Internal scrolling or pagination remains appropriate for genuinely unbounded collections such as Evidence, Worklog, a 1–10 Ticket queue, and the Global diagnostic catalog.

- Collapse excess masthead/navigation padding during an active Match and allocate the recovered height to gameplay.
- Use a viewport-aware grid with `minmax(0, 1fr)`-style containment so panels consume available height rather than leaving a large unused lower region.
- Keep resources, selected Ticket identity/state, public Candidates, Bench, selected diagnostic/Legal Action, and private response hand immediately visible.
- Make Evidence disposition strength legible without opening hidden details: `CONFIRM` must not look interchangeable with `SUPPORT`, and confirmed non-actionable conditions must remain visually distinct from Repair-gating accepted Isolation.
- Keep Evidence/Worklog present and independently scrollable. Preserve TASK-012 semantic scroll/focus continuity across rerenders and view-specific layouts.
- Avoid nested scroll surfaces where pagination, collapsible history, or responsive reflow provides a clearer solution.

## Selected Ticket

- Relevant layout may use the reference's split hero: illustration on one side and compact Ticket details on the other.
- Global layout may compress the Ticket into a horizontal summary so the catalog gains space.
- Public Candidates and Ticket status remain persistently visible in both layouts.
- Symptoms are primary observed information. Keep at least a concise symptom summary visible when space permits and always provide a one-step keyboard/touch `View full Ticket` expansion; do not make the player rediscover the basic clue through an obscure control.
- Full Ticket inspection must preserve all authorized symptoms, machine-state summary, accepted progress, and IDs without exposing server-only truth.

## Diagnostic Bench layouts

### Relevant view

- Favor a compact single shelf/tray with a visible relevant count and All/Test/Command filtering.
- Maintain useful card illustration/family recognition without making a small result set look like a database table.
- Explain that membership comes from the selected Ticket's public context and does not certify which diagnostic will be decisive. Provide `Why relevant?` paths and an incomplete-graph disclaimer.

### Global view

- Favor a dense grid/list browser with search; All/Test/Command tabs; subsystem/category filtering; deterministic sort by Name, Type, Cost, or Subsystem; result range; and bounded pagination.
- Preserve query, filters, sort, page, selected diagnostic, and focus across rerenders and Ticket changes where still valid.
- Provide the same optional Relevant filter and `Why relevant?` explanations inside Global. Also provide `Runnable for selected target` as a compatibility filter only if the authoritative projection supplies it. Neither filter may alter legality or consult hidden truth.
- Use pagination or deliberate virtualization rather than a second long free-scrolling Card wall. Page size must respond to layout while remaining deterministic and announced.

## Legal Action and response hand

- Keep the complete selected-diagnostic action surface visible without its own scrollbar at reference desktop sizes: action/type, selected item, target Ticket, cost, Inspect, Run/confirm, resolving state, and last-result route.
- Make cross-Ticket targeting explicit and preserve the TASK-012 persistent `View result`/selection behavior.
- Separate Bench diagnostics from the private response hand structurally and visually. The response hand contains the approved non-Bench families and may compact to labeled mini-cards/chips when the Global catalog needs height.
- Deck/discard and remaining hand count stay labeled; no icon-only state.

## Ticket queue

- Allocate the queue the full remaining board height and reduce ornamental padding before reducing text clarity.
- Support 1–10 active Tickets with compact cards, selected-state prominence, count, machine revision/status, and clear overflow affordance.
- Keep Archived collapsed by default with a count and accessible expansion. Scroll only when the active list genuinely exceeds the allocated height.
- When selection changes through closure, result navigation, or keyboard traversal, keep the selected Ticket visible without resetting unrelated scroll surfaces.

## Responsive and accessibility behavior

- Recompose rather than scale. At tablet/mobile widths, use the approved mobile hierarchy: Ticket strip/selector, selected Ticket, Evidence/Worklog, Bench browser/drawer, response hand, and sticky selected action.
- Global search/filter/pagination and Relevant shelf must remain fully usable by keyboard, touch, and screen reader.
- Respect 44px-class touch targets, visible focus, logical reading order, dialog focus trapping/restoration, reduced motion, zoom/reflow, contrast, and non-color Card-family labels.
- Dragging remains optional enhancement; every action has click/tap/keyboard equivalence.
- Preserve lazy image loading, deterministic placeholders, bounded DOM size, and lean vanilla module behavior.

## Validation

Add browser and visual regression coverage for:

- Relevant and Global views at representative 16:9, 16:10, short-laptop, tablet, and phone viewports;
- 1-, 3-, and 10-Ticket queues plus empty/non-empty Archived collections;
- minimum/maximum representative Evidence, Worklog, Bench, and response-hand sizes;
- no document-level board scroll and no clipped primary controls at agreed desktop references;
- bounded, discoverable internal scrolling/pagination where permitted;
- complete Legal Action visibility, cross-Ticket result navigation, full-Ticket expansion, and selected Ticket visibility;
- disposition labels/help, direct-confirmation Isolation affordance, multi-Evidence route citation, elimination-route presentation, and generic unsupported-Isolation feedback under the approved semantics;
- Global search/filter/sort/page state, optional Relevant filtering, player-safe relationship explanations, and view switching with no lost selection or Match mutation;
- sequential input, IME, focus, selection, scroll restoration, keyboard-only, touch, reduced-motion, zoom/reflow, and screen-reader announcements; and
- visual comparison against both Bench references without copying their incidental data.

Run and report the full repository suite, staged Viewer verification, complete task-specific browser matrix, visual captures with dimensions/view/data case, performance/accessibility checks, and `git diff --check`.

## Allowed paths after prerequisites

- `viewer/js/play/**`
- Play CSS and required shared Viewer style tokens
- `tests/**`
- `docs/ui-plan/**` for implementation notes and accepted captures
- generated Play assets rebuilt from changed canonical sources
- `docs/tasks/INDEX.md`
- this task file

Do not change diagnostic availability, rules, costs, outcomes, Builder content, hidden-information policy, persistence semantics, Card illustrations, tutorial scripting, SLA limits, multiplayer transport, or unrelated application pages.

## Completion boundary

Complete only when both approved Bench View layouts are polished against representative final data; switching/filtering is comfortable, explainable, and state-safe; primary desktop troubleshooting controls fit the agreed viewports without document scrolling; unavoidable collection overflow is bounded and understandable; Ticket/Legal Action/queue improvements remain responsive and accessible; TASK-012 continuity is preserved; and no client-side rule inference or authoritative-state mutation was introduced.
