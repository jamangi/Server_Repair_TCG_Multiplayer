# TASK-020-HIGH: Normalize the one-row Bench and spatial response hand

## Status

**Complete — 2026-08-25.** Relevant and Global now share one compact desktop diagnostic row, the resting response hand uses the recovered height, and duplicate definitions render as deterministic accessible stacks without changing authority. TASK-015 may bind tutorial highlights to the completed active-Match geometry.

## Objective

Refine the completed TASK-019 composition so the Diagnostic Bench is a compact chooser and the private response hand has enough room to be read and understood. Relevant and Global must use one shared, single-row desktop diagnostic shelf at the same visual scale; Global may gain pages instead of gaining a second row. Recovered height must make the resting desktop hand materially more legible. Duplicate Cards must read as one tactile stack with a quantity, not as a row of `Using copy 1` / `Use copy 2` controls.

This is presentation and local interaction state only. It must not change diagnostic membership, filtering authority, relevance, legality, action costs, Card instances, hand/deck order, targeting, engine results, replay state, or hidden-information policy.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, completed TASK-012/TASK-014/TASK-016/TASK-018/TASK-019, and queued TASK-015;
- approved UI-001 and UI-002 in `docs/design/decisions/APPROVALS.md`;
- `docs/ui-plan/ui-reference_images/README.md`, the two TASK-020 targets, the TASK-016 studies/post-pass captures, and the TASK-019 deterministic Relevant/Global desktop captures;
- `docs/ui-plan/task-019-css-inventory.md` and `docs/ui-plan/task-019-visual-qa.md`;
- the shared diagnostic-tile renderer, response-hand grouping/paging/expansion helper, Card-detail route, session/continuity/motion modules, and the complete active-Match CSS composition; and
- current Bench, hand, duplicate-instance, selection, drag, focus, responsive, visual, accessibility, and engine-intent tests.

## Why this successor task is necessary

TASK-019 corrected distorted diagnostic art, missing identity, clipped Ticket content, misleading hand footers, modal conflicts, and CSS cascade debt. It satisfied its structural contract, but hands-on review exposed three proportional problems that its acceptance criteria did not measure:

- Relevant tiles use roughly twice the useful height of the already-readable Global tiles;
- Global uses two diagnostic rows, so diagnostics consume height that the response hand needs; and
- duplicate groups remain technically instance-addressable through copy-selection controls, but the controls compress the Cards and communicate implementation identity instead of a natural hand of stacked duplicates.

The earlier QA proved required descendants existed and intersected their containers. This task must also prove the resulting proportions are comfortable: one bounded diagnostic row, comparable tile geometry across modes, readable resting hand Cards, and an immediately understandable duplicate stack.

## Visual references

- [`task-020-global-one-row-target.png`](../ui-plan/ui-reference_images/task-020-global-one-row-target.png) is the Global composition target: one diagnostic row, more pages, and an illustrated resting hand.
- [`task-020-relevant-one-row-target.png`](../ui-plan/ui-reference_images/task-020-relevant-one-row-target.png) is the Relevant composition target: the same diagnostic scale plus a visibly layered duplicate stack.
- The deterministic TASK-019 desktop captures in `tests/visual/task-019/` are the reproducible before state. Compare at least `global-1920x1080-chromium-desktop.png` and `relevant-1920x1080-chromium-desktop.png` rather than relying on memory or only the target studies.

The targets communicate hierarchy and proportions. They are not authority for content or exact pixels.

## Approved desktop composition

At every supported desktop viewport:

- Relevant and Global render **exactly one row** of diagnostic tiles. Neither mode may create a second diagnostic row.
- Both modes reuse the same tile component, anatomy, aspect treatment, and height token. Mode changes may alter membership, filters, result count, and pagination, but not make Relevant tiles materially taller than Global tiles.
- Use the current readable Global tile height as the approximate scale anchor. Do not preserve the current double-height Relevant tiles.
- Determine the number of visible tiles from the available width and a tested minimum usable tile width. A narrower desktop may show fewer tiles. More results create more pages, especially in Global; they do not trigger smaller unreadable tiles or a second row.
- Keep type, action cost, undistorted illustration, complete title, and Inspect visible on every tile under the TASK-019 contract. Detailed description, category notes, and `Why relevant?` remain in Inspect.
- Global search/filter/sort controls stay compact and must not force the tile row or selected Ticket out of its allocation. Relevant retains its simpler controls without using their absence to enlarge its tiles.
- The selected Ticket summary and full-Ticket route, queue, Evidence/Worklog, Legal Action, and Basic Actions remain continuously usable without document scrolling at the accepted desktop sizes.

The target images are composition references, not pixel specifications. Do not copy their incidental diagnostics, Cards, counts, costs, Ticket text, art, or authority assumptions.

## Approved response-hand composition

Use the height recovered from the Bench to improve the existing shared adaptive hand in both modes.

### Resting desktop hand

- Preserve the TASK-019 maximum of five visible Card-definition groups per page unless the tested minimum Card width requires fewer. Page rather than horizontally crushing additional groups.
- Each visible group must comfortably show full `REPAIR`/`VERIFY` family, cost, undistorted illustration, full title, explicit Inspect, and quantity when duplicated. A merely present but microscopic, clipped, or overlapping field does not pass.
- Keep total Cards-in-hand, Deck, Discard, range/page, and expansion controls available without taking height from the Card faces unnecessarily.
- Continue to support the expanded hand for closer reading. The improved resting hand is not a replacement for Inspect or the expanded state.

### Duplicate stack and authoritative instance selection

- Present duplicate Cards as one visibly layered stack with an unambiguous `×N` quantity and accessible name such as “Thermal Load Verification, 2 copies.” Do not show persistent `Using copy 1`, `Use copy 2`, or equivalent per-copy tabs on the Card face.
- Group only instances that share the same Card definition and all player-visible, legality-relevant state. If two instances differ in cost, modifier, target eligibility, disposition, or another visible/legal property, split them into separate groups rather than hiding the difference.
- Preserve every authoritative Card Instance and original hand order. Selecting or confirming a homogeneous stack must resolve to the first eligible instance in preserved hand order through one documented deterministic helper; the submitted intent still carries that real instance ID.
- After the resolved action, remove or move only the chosen instance and update the visible quantity. Paging, selection, focus, legal-target projection, replay, and continuity must remain stable.
- Inspect describes the Card definition and current quantity without making each indistinguishable copy a separate browsing mode. Technical instance identity may appear in developer diagnostics, but it is not primary player-facing hand navigation.

## Responsive behavior

- The one-row rule governs desktop board composition. Tablet, phone, and 200% reflow may use the existing readable stacked/list recomposition instead of squeezing a desktop shelf into the viewport.
- Responsive layouts must retain the same semantic diagnostic and hand components, duplicate grouping rule, instance-selection helper, and accessible names.
- No breakpoint may introduce horizontal document overflow, drag-only interaction, hover-only information, clipped Card identity, or a modal/expanded-hand Escape conflict.

## CSS and implementation discipline

- Adjust the consolidated TASK-019 active-Match composition and component tokens; do not append another `final`, `lock`, emergency override, or mode-specific duplicate component.
- Define intentional tokens for Bench row height, tile minimum width/aspect, hand allocation, stack offset, and responsive fallbacks. Avoid screenshot-specific magic numbers.
- Bench and hand pagination must remain independent presentation state. Switching mode clamps an out-of-range page safely without mutating Match/replay state.
- Preserve the dependency-free HTML/CSS/ES-module and static GitHub Pages boundaries.

## Validation

Add behavior and visual tests for Relevant and Global at 1366×768, 1920×1080, 1920×960, and 2560×1300-class desktop, plus tablet, phone, 200% reflow, and reduced motion.

Tests must prove:

- the desktop Bench has exactly one rendered tile row in both modes at each accepted size;
- Relevant and Global tiles use the same renderer and their measured heights/aspect treatment are equal within normal subpixel rounding;
- changing to Global increases pages/result range rather than adding a second row or shrinking below the tested minimum tile width;
- type, cost, complete title, illustration, and Inspect remain visible and non-overlapping on every shown diagnostic;
- the resting hand shows readable family, cost, art, title, Inspect, and quantity for each visible group, with no copy-selection tabs;
- duplicate layers and `×N` are visually apparent and exposed as one accessible group;
- homogeneous duplicate selection submits the deterministic first eligible real instance ID, removes only that instance after resolution, and preserves all other instance identities and order;
- differing visible/legal instance state prevents grouping;
- Bench paging, hand paging, mode switching, expand/collapse, selection, focus, drag/click/keyboard routes, and target projection remain state-safe;
- the Ticket summary, queue, Evidence/Worklog, Legal Action, Basic Actions, and hand remain usable without document scrolling; and
- identical engine intents still produce identical projections/events before and after this task.

For desktop captures, record measured Bench height, tile width/height, hand allocation, visible group count, and row count. Compare the before state in the accepted TASK-019 captures with both TASK-020 targets and complete a written human visual-QA checklist. Screenshot generation or DOM-intersection assertions alone are not acceptance.

Run the full repository suite, staged Viewer verification, automated-game report verification, complete browser matrix, visual/accessibility/performance checks, and `git diff --check`.

## Allowed paths

- shared diagnostic-tile and response-hand presentation modules/helpers
- local session presentation state, selection/focus continuity, Card detail, motion, and active-Match CSS
- affected browser/Node/visual/accessibility tests and accepted captures
- `docs/ui-plan/**`
- this task, `docs/tasks/INDEX.md`, and TASK-015 dependency/status wording

Do not change schemas, domain content, Card ownership/zones, authoritative hand/deck order, diagnostic catalog/relevance authority, legal intents, costs, results, Ticket Builder behavior, statistics, tutorial scripting, or multiplayer behavior.

## Completion boundary

Complete only when Relevant and Global use the same compact one-row desktop diagnostic shelf; additional Global density becomes pagination rather than a second row; the recovered height produces a readable resting hand; duplicates read as one accessible tactile stack while every authoritative instance remains deterministic and intact; all board surfaces remain usable across the viewport matrix; visual QA confirms comfortable proportions; and gameplay/replay authority remains equivalent for identical intents.

## Completion record — 2026-08-25

### Outcome

- Normalized Relevant and Global to one shared desktop Bench row with equal-height tiles, width-derived four/six-tile page capacity, independent pagination, and the existing complete family/cost/art/title/Inspect anatomy.
- Reallocated the recovered center-board height to illustrated resting hand Cards. Desktop shows up to five readable groups, or four at 1366px to preserve the tested 150px minimum Card width.
- Replaced copy-selection tabs with one layered, accessible `×N` stack. Grouping includes visible state and normalized projected legality; the documented helper resolves the first eligible real instance in original hand order and removes only that chosen instance.
- Preserved Bench/hand paging, mode switching, selection, focus, Inspect, expand/collapse, drag, click, keyboard, legal targets, Worker intents, Match/replay order, and responsive document flow.
- Kept the dependency-free static Viewer boundary and introduced explicit Bench-row, tile-width, hand-height, Card-width, and stack-offset tokens.

### Verification

| Command | Exit | Result |
| --- | ---: | --- |
| `node viewer/scripts/build-manifest.mjs` | 0 | 9 Viewer content packs staged; only the generated timestamp differed and was not committed |
| `node viewer/scripts/build-play-assets.mjs`; `node viewer/scripts/verify-play-assets.mjs` | 0 | 40 deterministic Play assets staged and verified byte-equivalent |
| `node --check viewer/js/app.js`; `node --check viewer/js/data-loader.js`; `node --check viewer/js/entity-types.js` | 0 | baseline Viewer syntax passed |
| `node --check` on Card, hand, Bench, and game-page modules | 0 | all affected Play modules passed syntax validation |
| `node --test tests/viewer-baseline.test.mjs` | 0 | 3 passed, 0 failed, 0 skipped |
| `node --test tests/*.test.mjs` | 0 | 126 passed, 0 failed, 0 skipped |
| `node tools/run-automated-games.mjs --verify-report automated_games/task-009-foundation-v1` | 0 | 22 frozen rows verified with 0 deterministic mismatches |
| `node tools/run-task-014-campaign.mjs --verify-report automated_games/task-014-playable-coverage-v3` | 0 | 13 expanded-content rows verified with 0 deterministic mismatches |
| Focused TASK-020 Playwright matrix with accepted capture regeneration | 0 | 6 passed, 0 failed, 6 intentional project skips |
| Complete Playwright browser matrix (`--workers=6`) | 0 | 47 passed, 0 failed, 61 intentional project skips |
| TASK-020 written human QA and accepted visual set | 0 | 14 Relevant/Global desktop, tablet, phone, and reduced-motion captures passed |
| `git diff --check` | 0 | no whitespace errors |

### Visual evidence

- `docs/ui-plan/task-020-visual-qa.md` records measured desktop Bench/tile/hand geometry and the completed human checklist.
- `tests/visual/task-020/` contains the deterministic Relevant/Global captures for four desktop sizes plus tablet, phone, and reduced motion.
- The accepted 1366×768 captures prove the previously divergent short-height modes now reserve equal control height and produce the same 121px one-row tile scale.

### Changed-file inventory

Changes remain inside the task allowlist: shared Card/hand/Bench helpers and game-page presentation, consolidated active-Match CSS, affected TASK-012/TASK-013/TASK-016 compatibility tests, focused Node/browser tests and accepted captures, visual-QA documentation, this task/index, and TASK-015 dependency status. Generated Viewer/Play content remains unchanged.

### Unresolved items

None for TASK-020. TASK-015 is unblocked and is now the active training-ready feature task.
