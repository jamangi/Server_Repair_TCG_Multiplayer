# TASK-010 visual QA

These full-page Chromium captures preserve visual evidence for the static `solo-pages-v1` client. They come from the real staged gameplay pack, Ticket Builder, engine, and module Worker. The capture path does not inject Match State or hidden Ticket truth.

## Capture inventory

| Capture | Viewport | Full-page output | Motion | Surface |
| --- | ---: | ---: | --- | --- |
| [`chromium-desktop-home.png`](chromium-desktop-home.png) | 1600 × 1000 | 1600 × 1104 | normal | Home |
| [`chromium-desktop-game.png`](chromium-desktop-game.png) | 1600 × 1000 | 1600 × 1004 | normal | one-Ticket game, initial Diagnosis |
| [`chromium-desktop-result-normal.png`](chromium-desktop-result-normal.png) | 1600 × 1000 | 1600 × 1168 | normal | completed queue and exactly-once result |
| [`chromium-tablet-home.png`](chromium-tablet-home.png) | 1024 × 768 | 1024 × 1161 | normal | Home |
| [`chromium-tablet-game.png`](chromium-tablet-game.png) | 1024 × 768 | 1024 × 2379 | normal/touch | one-Ticket game, initial Diagnosis |
| [`chromium-mobile-home.png`](chromium-mobile-home.png) | 390 × 844 | 390 × 1953 | normal | Home |
| [`chromium-mobile-game.png`](chromium-mobile-game.png) | 390 × 844 | 390 × 3082 | normal/touch | one-Ticket game, initial Diagnosis |
| [`chromium-reduced-motion-home.png`](chromium-reduced-motion-home.png) | 390 × 844 | 390 × 1953 | reduced | Home |
| [`chromium-reduced-motion-game.png`](chromium-reduced-motion-game.png) | 390 × 844 | 390 × 3082 | reduced/touch | one-Ticket game, initial Diagnosis |

Regenerate with the pinned browser suite:

```powershell
$env:UPDATE_TASK_010_VISUALS = '1'
node node_modules/@playwright/test/cli.js test tests/browser/task-010-solo.spec.mjs
```

Routine browser runs leave the committed evidence untouched unless `UPDATE_TASK_010_VISUALS=1` is set.

## Side-by-side reference review

| Direct reference | Closest implementation evidence | Comparison |
| --- | --- | --- |
| [`ui-minimum.png`](../../../docs/ui-plan/ui-reference_images/ui-minimum.png) | [desktop game](chromium-desktop-game.png) | The implementation clears the flat-rectangle floor: graphite framing, grid texture, vellum paper, metal Ticket clip, categorical Card frames, inset panels, directional gradients, shadow, and restrained glow all contribute depth. |
| [`01-night-shift-board-desktop.png`](../../../docs/ui-plan/ui-reference_images/01-night-shift-board-desktop.png) | [desktop game](chromium-desktop-game.png) | Queue, selected Ticket, Evidence/Worklog, resources, six-Card hand, and projected actions are simultaneously visible in a 1600 × 1000-class operations desk. Dense Ticket and action content scrolls within its physical surface rather than pushing the hand below the fold. |
| [`02-card-ticket-specimens.png`](../../../docs/ui-plan/ui-reference_images/02-card-ticket-specimens.png) | [desktop game](chromium-desktop-game.png) | Portrait Cards and landscape Tickets have distinct silhouettes, family headers, cost medallions, category color, art slots, and visibly different stock. Canonical illustrations remain deferred to TASK-011, so the current category-aware technical placeholders cannot reproduce the specimen sheet's unique focal art. |
| [`03-night-shift-board-mobile.png`](../../../docs/ui-plan/ui-reference_images/03-night-shift-board-mobile.png) | [mobile game](chromium-mobile-game.png) · [reduced-motion mobile game](chromium-reduced-motion-game.png) | The narrow client genuinely recomposes queue, selected Ticket, Evidence/Worklog switch, horizontal hand, and sticky projected actions without document-level horizontal overflow. It favors full rules text and 44 px-class controls over the reference's shorter cinematic crop, producing a substantially taller page. |

## Checklist

| Quality | Result | Evidence |
| --- | --- | --- |
| Hierarchy | **Pass** | Home has a strong visual anchor and dominant Play panel. The final desktop desk keeps Ticket, intelligence, hand, resources, and actions simultaneously present while retaining Ticket primacy. |
| Material separation | **Pass** | Navy/graphite shell, vellum Ticket, note/panel intelligence surfaces, portrait Cards, and tool-like actions remain distinguishable without color alone. |
| Texture | **Pass** | Restrained grid, paper fibers/marks, server-rack placeholder detail, and frame overlays add depth without embedding interface text in raster art. |
| Lighting | **Pass** | Directional cyan/amber art lighting and panel highlights establish a coherent Night-Shift desk atmosphere. |
| Shadow and glow | **Pass** | Ticket/card shadows, selected-card cyan glow, amber Ticket focus, inset wells, and restrained panel glow communicate depth and state. |
| Card scale | **Pass with density tradeoff** | All six hand Cards retain family, cost, art, title, partial rules, disposition/footer, and selected glow in the initial desktop viewport; longer rules remain intentionally compact in-hand. |
| Ticket dominance | **Pass** | The landscape vellum Ticket is unmistakably primary without displacing the hand or intelligence surface; dense details remain reachable through an internal sheet scroll. |
| Evidence / Worklog clarity | **Pass** | Tab labels, Knowledge State heading, empty-state instruction, and separate chronological surface remain clearly visible beside the Ticket. |
| Hand interaction | **Pass** | Family, cost, title, rules, selected glow, and a clipped-next-card scroll affordance are visible; click/keyboard targeting remains independent of optional drag. |
| Responsive recomposition | **Pass** | Tablet and mobile change grid order and use bounded horizontal rails rather than shrinking or clipping the desktop page. Normal and reduced-motion captures settle to the same readable state. |
| Placeholder-art quality | **Pass with TASK-011 limit** | Category-aware SVG placeholders provide focal lighting, server texture, and meaningful family variation; unique canonical Card art is intentionally absent. |
| Shell consistency | **Pass** | Home, game, and result surfaces share typography, line work, graphite/navy structure, cyan focus, vellum accents, radii, depth, and control grammar. |

## Reasoned deviations and disposition

- **TASK-011 art:** no canonical Card illustration set exists yet. Stable asset IDs resolve to category-aware SVG placeholders with intentional alt/fallback behavior; this is the approved TASK-011 boundary, not a broken-image waiver.
- **Accessibility:** mobile full-page captures are taller than the advanced reference because readable rules text, labeled counters, semantic chronology, and 44 px-class controls remain reachable. The hand is a bounded horizontal rail rather than compressed illegible thumbnails.
- **Reduced motion:** reduced captures intentionally remove travel, spring, and stagger while preserving the same final hierarchy, selection cues, and content.
- **Performance/browser support:** atmosphere uses bounded CSS/SVG layers and transform/opacity motion. It omits continuous full-viewport filters, canvas/WebGL, and animation-dependent legality.
- **Current pinned content:** public symptoms, candidate labels, event chronology, and machine state come from player-safe projections rather than reference-mockup prose. Exact incidental text and queue state are therefore not comparison targets.
- **Measured desktop density tradeoff:** the final 1600 × 1000 capture is 1600 × 1004 and keeps every required decision zone on the desk. The Ticket and action dock use internal scroll, and hand Cards show partial rather than complete rules text, to preserve readable 10rem Card presence without returning to a two-viewport page.
