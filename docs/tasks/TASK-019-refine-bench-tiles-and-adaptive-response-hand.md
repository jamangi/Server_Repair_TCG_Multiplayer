# TASK-019-HIGH: Refine Bench tiles and the adaptive response hand

## Status

**Complete — 2026-08-25.** UI-001 A and UI-002 A are implemented and verified. The shared Bench tile, contextual Inspect detail, grouped/paged/expandable response hand, responsive geometry, and consolidated active-Match CSS are ready for TASK-015 tutorial highlights.

## Objective

Finish the visual-information hierarchy that TASK-016 established structurally: make diagnostics and response Cards identifiable at a glance, move secondary explanations into trustworthy Inspect views, use Relevant-mode height deliberately, and eliminate CSS override debt that produced clipped or distorted content.

This is presentation and local interaction state only. It must not change diagnostic availability, relevance, legality, action costs, Card instances, hand order, duplicate identity, targeting, engine results, or hidden-information policy.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, and completed TASK-012/TASK-014/TASK-016/TASK-018;
- approved UI-001 and UI-002 in `docs/design/decisions/APPROVALS.md`;
- the complete `docs/ui-plan/ui-reference_images/README.md` and all TASK-016 baseline, target, post-pass, Global, Relevant, Card, and response-hand references;
- Card definition/instance contracts, art resolver, Card view variants, game-page/session/continuity/motion modules, and all affected Play CSS; and
- current Bench/hand browser, visual, accessibility, drag, selection, target, and result-routing tests.

## Why a successor task is necessary

TASK-016 successfully established the queue/center/right-rail frame and Basic/Legal Action separation, but it optimized measurable container fit more strongly than content legibility. Its accepted captures already show truncated Card-family labels, extremely narrow illustration columns, hidden relevance notes, and hand Cards whose title/type cannot be read. The validation asserted outer panel bounds and no document scroll but did not assert required child anatomy, image aspect treatment, usable text, or unused board area.

The implementation also added a large TASK-016 media block and then a later `Final cascade lock` for the same selectors. This layered override strategy makes computed layout depend on source order and encourages another patch-on-patch pass. Consolidate affected active-Match styles instead of adding a new terminal override section.

## Approved diagnostic-tile contract

UI-001 A requires one shared compact diagnostic-tile anatomy in both Bench Views.

At every supported density, a Bench tile must visibly preserve:

- diagnostic family/type (`TEST` or `COMMAND`) in text plus the existing redundant visual grammar;
- action cost;
- an undistorted, deliberately cropped or contained illustration region; and
- the full diagnostic title, wrapping to a bounded second line when necessary rather than disappearing behind an ellipsis.

Do not squeeze a landscape illustration into a narrow vertical strip beside microscopic rules text. The compact tile is a selection surface, not the complete Card contract. Category/subsystem, short description, technical purpose/role/references, and public relevance explanation belong in the detailed Inspect experience under the approved option.

When the diagnostic is relevant to the selected Ticket, Inspect shows its player-safe `Why relevant?` path and incomplete-graph disclaimer. When it is not marked relevant, Inspect explains Global/catalog availability without implying uselessness. These explanations remain projection/public-graph-derived and never infer truth in the client.

Relevant and Global should reuse one tile component/anatomy. Mode-specific grid columns or tile scale are allowed; mode-specific semantic markup and duplicated event logic are not.

## Approved adaptive-hand contract

UI-002 A requires one shared adaptive response-hand component with grouping, paging, and expansion in both Bench Views.

### Collapsed state

- Show the Card family (`REPAIR`/`VERIFY`) and complete title for every visible group. Family labels may not truncate to `RE` or `VE`.
- Show up to five Card groups per page at desktop reference sizes, with previous/next controls only when needed, a current range/page announcement, total Cards-in-hand count, and Deck/Discard counts.
- Visually stack duplicate definitions and label their quantity, but retain every authoritative Card Instance. Grouping/paging is presentation state and cannot merge, reorder, discard, or silently choose an instance.
- Remove the misleading in-hand `DISCARD` footer. Provide an explicit keyboard/touch/click `Inspect` route for each visible group/Card.

### Expanded state

- An accessible expand/collapse control raises the hand over the center Bench work surface when more room is requested; it must not cover the persistent right action rail or make selected Ticket/Basic Actions unreachable.
- Show readable mini/full Cards with family, cost, undistorted illustration, full title, concise description, and Inspect. The detailed modal retains full purpose, technical role, and technical references.
- Preserve selected Card, page/group, scroll, focus, legal-target state, drag/click/keyboard equivalence, and TASK-012 continuity through expand/collapse and rerenders.
- `Escape` may collapse the expanded non-modal hand only when focus is within that interaction and no real modal owns Escape. Restore focus to the expand control.

Because duplicate grouping is approved, selecting/playing must identify an explicit underlying Card Instance deterministically and visibly. A group cannot become a new authoritative object.

## Mode-specific height and Ticket requirements

- Relevant mode uses the height saved by its single diagnostic shelf: allocate a more generous hand presentation and extend Evidence/Worklog toward the bottom instead of leaving a large dead band.
- Global mode may use the collapsed hand by default so the catalog retains space, but the selected Ticket's required summary and `View full Ticket` route from TASK-018 remain wholly visible.
- Use the same hand component and state model in both modes; only layout density/available dimensions may vary.
- Bench paging, hand paging, hand expansion, and view switching retain independent local state and never mutate Match/replay state.

## CSS consolidation boundary

- Inventory every active-Match rule affecting Ticket, Bench tile, hand, center rows, and investigation rail. Identify the winning computed declaration at each supported breakpoint.
- Consolidate affected selectors into one intentional active-Match composition layer and delete superseded TASK-016/final-lock declarations where safe.
- Do not add another higher-specificity `final`, `lock`, or emergency override block at the end of the stylesheet.
- Prefer component variables/tokens for tile aspect, row allocation, hand collapsed/expanded height, and Ticket ink contrast over repeated magic numbers.
- Preserve the dependency-free HTML/CSS/ES-module boundary and bounded DOM size.

## Validation

Add behavior and visual tests for both Bench Views at 1366×768, 1920×1080, 1920×960, 2560×1300-class wide desktop, tablet, phone, 200% zoom/reflow, and reduced motion.

Tests must prove:

- every visible diagnostic tile exposes type, cost, complete title, and a non-distorted visible art region;
- Relevant and Global reuse the same tile component contract;
- Inspect conditionally presents the public relevance path or Global/catalog explanation plus detailed Card information;
- no shelf tile depends on clipped rules text, hidden `Why relevant?`, or a hover-only disclosure;
- every collapsed hand group exposes full family/title, quantity where duplicated, and Inspect; `DISCARD` does not appear as an in-hand affordance;
- more than five groups page deterministically, duplicate instances remain individually addressable, and total/Deck/Discard counts remain correct;
- expanded hand preserves selection/focus/state, reveals readable art/descriptions, and collapses safely without conflicting with dialogs;
- Relevant mode has no avoidable lower dead band and gives saved height to hand and Evidence/Worklog;
- Global Ticket summary and hand top edges are not clipped; and
- card/diagnostic selection still produces the same engine-projected Legal Action, target, cost, and result behavior.

For each reference viewport, assert required child intersection and minimum readable anatomy in addition to container bounds. Capture before/after images and complete a written human visual-QA checklist against the post-pass defect images and approved targets. Screenshot generation alone is not acceptance.

Run the full repository suite, staged Viewer verification, automated-game report verification, complete browser matrix, visual/accessibility/performance checks, and `git diff --check`.

## Allowed paths after prerequisites

- shared Card/diagnostic/hand presentation modules and local session presentation state
- affected game-page, art, motion, continuity, and Play CSS
- browser/Node/visual tests and accepted captures
- `docs/ui-plan/**`
- `docs/tasks/INDEX.md`, this task, and TASK-015 dependency status

Do not change schemas, domain content, Card ownership/zones, hand/deck order, diagnostic catalog/relevance authority, legal intents, costs, results, Builder behavior, statistics, tutorial scripting, or multiplayer behavior.

## Completion boundary

Complete only when the approved shared diagnostic tile and adaptive hand are legible, state-safe, accessible, and visually coherent in both Bench Views; Relevant and Global use their available height without clipping required Ticket/action content or leaving avoidable dead space; Inspect owns detailed/relevance information; affected CSS is consolidated instead of further layered; child-level and human visual QA pass; and gameplay/replay authority remains byte-for-byte equivalent for identical intents.

## Completion record — 2026-08-25

### Outcome

- Replaced the narrow TASK-016 diagnostic presentation with one shared compact tile in Relevant and Global. Every tile now preserves full family, cost, landscape art, two-line title, and an explicit Inspect route; shelf rules/detail markup was removed.
- Added player-safe diagnostic Inspect context. Relevant entries expose `Why relevant?`, their public relationship path, and the incomplete-graph notice; other entries explain Global/catalog availability without inferring legality or truth.
- Added a shared adaptive response hand that groups definitions without merging instances, pages five groups deterministically, reports Cards/Deck/Discard and range/page, preserves explicit duplicate-copy selection, and removes the misleading in-hand `DISCARD` footer.
- Added a non-modal expanded hand over the center work surface with readable art and concise descriptions. It stays below the selected Ticket and left of the persistent action rail; dialog Escape remains modal-owned, while focused hand Escape collapses safely and restores the toggle focus.
- Consolidated the competing TASK-016 and `Final cascade lock` declarations into one active-Match composition layer. Relevant uses its saved height for the hand and intelligence rail, Global preserves catalog density, and short desktop, tablet, phone, reduced-motion, and 200% text reflow keep required child anatomy visible.
- Preserved engine projections, legal intents, action costs, Match/replay state, hand order, and every authoritative Card Instance. Presentation interactions emitted no Worker intent and identical projected intents remained byte-for-byte unchanged.

### Verification

| Command | Exit | Result |
| --- | ---: | --- |
| `node viewer/scripts/build-play-assets.mjs`; `node viewer/scripts/verify-play-assets.mjs` | 0 | 40 deterministic Play assets staged and verified |
| `node --check viewer/js/app.js`; `node --check viewer/js/data-loader.js`; `node --check viewer/js/entity-types.js` | 0 | baseline Viewer syntax passed |
| `node --check` on the four affected Play modules | 0 | hand, Card detail, session, and game-page syntax passed |
| `node --test tests/viewer-baseline.test.mjs` | 0 | 3 passed, 0 failed, 0 skipped |
| `node --test tests/*.test.mjs` | 0 | 121 passed, 0 failed, 0 skipped |
| `node tools/run-automated-games.mjs --verify-report automated_games/task-009-foundation-v1` | 0 | 22 frozen rows verified with 0 deterministic mismatches |
| `node tools/run-task-014-campaign.mjs --verify-report automated_games/task-014-playable-coverage-v3` | 0 | 13 expanded-content rows verified with 0 deterministic mismatches |
| Playwright TASK-019 behavior/viewport matrix | 0 | 5 passed, 0 failed, 3 intentional project skips |
| Complete Playwright browser matrix (`--workers=6`) | 0 | 41 passed, 0 failed, 55 intentional project skips |
| TASK-019 focused visual regeneration and written human QA | 0 | Relevant/Global desktop, expanded, tablet, phone, reduced-motion, and reflow evidence passed |
| `git diff --check` | 0 | no whitespace errors |

### Visual and CSS evidence

- `docs/ui-plan/task-019-css-inventory.md` records the removed cascade debt and the winning desktop, tablet, phone, reduced-motion, and text-reflow compositions.
- `docs/ui-plan/task-019-visual-qa.md` records the human comparison against TASK-016 defect images and the accepted TASK-019 capture set.
- `tests/visual/task-019/` contains deterministic Relevant/Global desktop, expanded-hand, tablet, phone, and reduced-motion captures.

### Changed-file inventory

Changes are confined to the task allowlist: Play Card/hand/session/game-page presentation and Play CSS; the new hand grouping helper; affected TASK-010/TASK-012 browser compatibility tests; new TASK-019 Node/browser/visual evidence; CSS and human-QA documentation; this task/index; and the TASK-015 dependency status. Rebuilt generated Play assets remained byte-identical.

### Unresolved items

None for TASK-019. TASK-015 is unblocked and may now bind its tutorial overlays to the final Bench tiles, response-hand controls, Inspect routes, and responsive geometry.
