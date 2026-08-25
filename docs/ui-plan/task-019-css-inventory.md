# TASK-019 active-Match CSS inventory

## Scope

This inventory covers the selected Ticket, center Bench rows, diagnostic tiles, response hand, and investigation/action rail in `viewer/css/play.css`. The audit was performed at the TASK-019 reference breakpoints and with the root text size raised to 200%.

## Removed cascade debt

TASK-016 left two competing desktop compositions: its original media block and a later `Final cascade lock`. Both declared the same board, Ticket, Bench, hand, and rail selectors, so source order—not component intent—decided the result. TASK-019 removed those superseded blocks. Generic component styling remains earlier in the stylesheet; one final, explicitly named **Active Match composition** layer now owns the affected Match layout.

## Computed winners

| Range / condition | Winning composition | Ticket and center rows | Bench tile | Response hand | Right rail |
| --- | --- | --- | --- | --- | --- |
| Desktop, `min-width: 1181px` | Active Match desktop layer | A three-column board uses `--ticket-row`, `--bench-row`, `--hand-row`, and `--active-gap`; the Ticket occupies the first center row and the Bench/hand consume the remaining height. Relevant mode allocates a larger Ticket and avoids an unused lower track. | One shared `.diagnostic-tile` anatomy; mode changes only the grid column count and row allocation. Art fills a bounded landscape region with `object-fit: cover`; title wraps to two lines. | Five definition groups per page. The collapsed rail uses the shared hand grid; expanded state occupies the center work surface below the Ticket and stops before the right rail. | Evidence/Worklog, Legal Action, and Basic Actions share the third board column and stretch through the available height. |
| Tablet, `max-width: 1180px` | Active Match document-flow layer | Queue, Ticket, Evidence, Bench, hand, Legal Action, and Basic Actions become an explicit one-column sequence. | Three equal columns with the same semantic child contract. | Three equal columns; expanded Cards receive more vertical room without becoming a modal. | Returns to normal document flow; no fixed desktop rail geometry remains. |
| Narrow touch, `max-width: 760px` | Active Match narrow-flow layer | Ticket text remains ahead of decorative art; action panels remain reachable in document order. | Two columns. | Two columns; Basic Actions is sticky at the viewport bottom. | Legal Action is static and Basic Actions remains a reachable sticky footer. |
| Phone, `max-width: 440px` | Active Match phone layer | Single-column content flow. | One column with family, cost, art, full title, and Inspect visible. | One column with complete family/title and Inspect. | Follows the hand in the same semantic order. |
| Text reflow (`.game-route--text-reflow`) | Active Match text-reflow variables | The Ticket grows to `12rem`; the collapsed hand contracts to `8rem` while keeping its controls and counts present. | Shared anatomy remains unchanged. | Same grouping/paging state; no alternate markup. | Remains visible and reachable. |

## Component ownership

- `--ticket-row`, `--bench-row`, `--hand-row`, `--tile-art-min`, and `--active-gap` are the desktop allocation controls. Relevant and Global modes change these variables rather than duplicate component rules.
- `.diagnostic-tile` is the only compact Bench Card anatomy. Type, cost, art, title, and Inspect are visible; detailed prose and relevance explanation are intentionally absent from the shelf.
- `.hand-rail`, `.hand-group`, and `.hand-pagination` own both collapsed and expanded response-hand presentation. Grouping never changes the underlying instance list.
- `.investigation-panel`, `.legal-action-panel`, and `.basic-actions-panel` own the right rail. The expanded hand is constrained to center column 1 and therefore cannot cover this rail.
- The selected-Card lift transform is neutralized inside grouped hand containers because those containers intentionally clip to their allocated grid cell; selection remains visible through brightness and shadow without clipping the selected Card header.

No additional terminal `final`, `lock`, or emergency override layer was added.
