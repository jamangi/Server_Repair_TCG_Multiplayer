# TASK-016-HIGH: Refine Diagnostic Bench and game-board composition

## Status

**Active — TASK-012, TASK-013, and TASK-014 prerequisites are complete.** This is the dedicated whole-board density, responsive-composition, and visual-polish pass before TASK-015 tutorial overlays depend on final control locations.

## Objective

Refine the solo Night-Shift board so its primary troubleshooting surfaces are simultaneously legible at ordinary desktop sizes, each approved Diagnostic Bench View receives a layout suited to its information volume, and unavoidable scrolling is confined to intentionally bounded collections rather than the selected Ticket or Legal Action.

This task changes presentation, not game authority. It consumes player-safe projections and legal intents established by TASK-013/TASK-014 and must not infer relevance, legality, target compatibility, costs, or results in the DOM.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, and completed TASK-010/TASK-012 through TASK-014;
- `docs/design/decisions/{FROZEN_RULES,APPROVALS}.md` and the approved successor solo profile;
- `docs/ui-plan/{README.md,TODO.md,ui-defense.md}`;
- every file and the complete README under `docs/ui-plan/ui-reference_images/`, especially the TASK-016 comparison set (`task-016-current-layout.png`, `task-016-global-bench-layout.png`, and `task-016-relevant-bench-layout.png`), the earlier Bench studies, and the mobile reference;
- current Play game-page, Card, dialog, motion, art-resolution, and continuity modules plus all Play CSS; and
- relevant Node, browser, visual, accessibility, and responsive tests.

## Reference boundary

The TASK-016 current-layout capture is implementation evidence after TASK-014, not a target. The Global and Relevant mockups are approved information-hierarchy studies, not pixel specifications or authoritative fixtures. The earlier Bench studies remain useful alternatives. Preserve their profitable composition ideas while rendering current projections:

- different composition for compact Relevant and high-volume Global catalogs;
- split or compressed selected-Ticket summaries;
- fully visible Legal Action confirmation;
- stronger vertical use of the Ticket queue; and
- a visually separate private Repair/Verify response hand.

Do not copy pictured counts, names, categories, outcomes, costs, rules text, or assumptions about legality. Do not expose hidden truth to reproduce a pixel.

## Composition diagnosis from the TASK-014 baseline

The baseline already has the required information, but it presents too many regions as wide block elements stacked down the page. The result is unused horizontal space inside rows, a shallow Ticket queue, an oversized Candidate list, and a Legal Action surface whose important controls fall below an internal scroll boundary. Treat this as a composition defect rather than a request to remove information.

At desktop reference sizes, establish one coherent board frame with three cooperating regions:

1. a full-height left queue for active and archived Tickets;
2. a center work surface containing the selected-Ticket summary, the view-specific Bench, and the private response hand; and
3. a continuous right investigation/action rail containing Evidence/Worklog, the selected context-sensitive Legal Action, and a visually independent Basic Actions group.

Relevant and Global may assign different proportions and row heights inside that frame. Do not force both modes through one oversized stacked template. Prefer inline metadata, content-sized controls, compact cards/chips, multi-column groups, and deliberate adjacency when the relationship remains clear. A short label, Candidate, filter, or action must not consume a full row merely because it is rendered as a block.

## Desktop composition requirements

At the task's agreed reference desktop viewports, the primary board must fit within the available viewport without document-level vertical scrolling. Internal scrolling or pagination remains appropriate for genuinely unbounded collections such as Evidence, Worklog, a 1–10 Ticket queue, and the Global diagnostic catalog.

- Collapse excess masthead/navigation padding during an active Match and allocate the recovered height to gameplay.
- Use a viewport-aware grid with `minmax(0, 1fr)`-style containment so panels consume available height rather than leaving a large unused lower region.
- Define explicit queue / center work surface / right rail relationships. The Bench must use the center allocation instead of spanning beneath the queue or action rail, and the right rail must begin near the selected Ticket rather than below the response hand.
- Reduce horizontal waste before reducing font size: place short related values and controls inline, let compact controls size to their content, and use bounded card grids/shelves rather than one full-width row per item.
- Keep resources, selected Ticket identity/state, public Candidates, Bench, selected diagnostic/Legal Action, and private response hand immediately visible.
- Make Evidence disposition strength legible without opening hidden details: `CONFIRM` must not look interchangeable with `SUPPORT`, and confirmed non-actionable conditions must remain visually distinct from Repair-gating accepted Isolation.
- Keep Evidence/Worklog present and independently scrollable. Preserve TASK-012 semantic scroll/focus continuity across rerenders and view-specific layouts.
- Avoid nested scroll surfaces where pagination, collapsible history, or responsive reflow provides a clearer solution.

## Selected Ticket

- Relevant layout may use the reference's split hero: illustration on one side and compact Ticket details on the other.
- Global layout may compress the Ticket into a horizontal summary so the catalog gains space.
- Public Candidates and Ticket status remain persistently visible in both layouts.
- In the persistent summary, render Candidates as compact inline cards/chips that wrap within a bounded region; do not repeat a full-width Candidate row and button for every option.
- Symptoms are primary observed information. Keep at least a concise symptom summary visible when space permits and always provide a one-step keyboard/touch `View full Ticket` expansion; do not make the player rediscover the basic clue through an obscure control.
- Keep Hypothesis revision and Commit Isolation fully accessible through the full-Ticket/diagnosis workflow or an equally clear dedicated workflow. They need not occupy repeated wide buttons in the persistent summary. The compact summary communicates the holistic problem; the expanded view owns candidate-specific explanation, Evidence citation, and commit controls.
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

## Legal Action, Basic Actions, and response hand

- Keep the complete selected-diagnostic action surface visible without its own scrollbar at reference desktop sizes: action/type, selected item, target Ticket, cost, Inspect, Run/confirm, resolving state, and last-result route.
- Make cross-Ticket targeting explicit and preserve the TASK-012 persistent `View result`/selection behavior.
- Give the selected context-sensitive diagnostic/response-Card Legal Action its own panel. Do not mix its target, cost, Inspect/Run controls, or result route into the Basic Actions group.
- Add a visually separate, always-visible Basic Actions group for `Search`, `Refresh`, `Give Up Ticket`, and `Pass`, including current resource counts where applicable. These are system actions, not Bench diagnostics or response Cards. Their existing confirmation/selection flows and engine authority remain unchanged.
- Keep the Basic Actions group compact and horizontal or tightly tiled at desktop sizes. It must not make the Legal Action scroll, and it must not imply that Search/Refresh/Give Up/Pass share the selected diagnostic's target or cost.
- Hypothesis revision, Commit Isolation, and Document Live remain basic actions under the rules. Keep their context-specific controls in the full-Ticket diagnosis, Evidence, or closure workflow as appropriate; do not mislabel them as Bench diagnostics or response Cards merely because they are not in the persistent four-control rail.
- Separate Bench diagnostics from the private response hand structurally and visually. The response hand contains the approved non-Bench families and may compact to labeled mini-cards/chips when the Global catalog needs height.
- Deck/discard and remaining hand count stay labeled; no icon-only state.

## Ticket queue

- Allocate the queue the full board height beneath the compact active-Match masthead, not merely the height of the selected Ticket. Reduce ornamental padding before reducing text clarity.
- Support 1–10 active Tickets with compact cards, selected-state prominence, count, machine revision/status, and clear overflow affordance.
- Keep Archived collapsed by default with a count and accessible expansion anchored after the active list. Scroll only when the active list genuinely exceeds the enlarged allocation.
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
- the explicit queue/center/right-rail composition, compact inline Candidate presentation, and absence of avoidable full-row controls or unused horizontal bands;
- bounded, discoverable internal scrolling/pagination where permitted;
- complete Legal Action visibility, a separate always-visible Basic Actions group, cross-Ticket result navigation, full-Ticket diagnosis controls, and selected Ticket visibility;
- disposition labels/help, direct-confirmation Isolation affordance, multi-Evidence route citation, elimination-route presentation, and generic unsupported-Isolation feedback under the approved semantics;
- Global search/filter/sort/page state, optional Relevant filtering, player-safe relationship explanations, and view switching with no lost selection or Match mutation;
- sequential input, IME, focus, selection, scroll restoration, keyboard-only, touch, reduced-motion, zoom/reflow, and screen-reader announcements; and
- visual comparison against the complete TASK-016 before/Global/Relevant set and earlier Bench studies without copying their incidental data.

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

Complete only when both approved Bench View layouts are polished against representative final data; switching/filtering is comfortable, explainable, and state-safe; the board uses its horizontal and vertical space deliberately rather than stacking avoidably wide blocks; primary desktop troubleshooting controls fit the agreed viewports without document scrolling; Legal Action and Basic Actions are distinct and fully visible; unavoidable collection overflow is bounded and understandable; Ticket/Legal Action/queue improvements remain responsive and accessible; TASK-012 continuity is preserved; and no client-side rule inference or authoritative-state mutation was introduced.
