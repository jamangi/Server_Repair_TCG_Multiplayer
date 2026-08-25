# TASK-020 human visual-QA checklist

Reviewed on 2026-08-25 against the accepted TASK-019 captures, both TASK-020 target studies, the deterministic TASK-020 after-captures, and a hands-on local Browser session.

## Measured desktop composition

Relevant and Global returned the same tile height at every size (within 0.1px), so one row has one shared visual scale. Global changed page totals rather than row count or tile size.

| Viewport | Bench height | Tiles/page | Tile width × height | Hand height | Visible groups | Bench rows |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1366×768 | 294.8px | 4 | 195.0×121.0px | 208.0px | 4 | 1 |
| 1920×1080 | 445.2px | 6 | 184.4×194.4px | 345.6px | 5 | 1 |
| 1920×960 | 363.6px | 6 | 184.4×172.8px | 307.2px | 5 | 1 |
| 2560×1300 | 642.8px | 6 | 249.8×216.0px | 368.0px | 5 | 1 |

The 1920×1080 hands-on check also measured a 144.5px minimum hand-art height, zero horizontal overflow, five visible groups, and zero legacy copy-tab elements. In the accepted 1366×768 deterministic captures, Global reported `Page 1 / 13`; Relevant reported `Page 1 / 8` for the same Ticket seed.

## Bench and hand review

- [x] Relevant and Global each render exactly one desktop tile row at the same height, renderer, anatomy, and aspect treatment.
- [x] Global density becomes additional pages; it never adds a second row or drops below the tested 144px tile minimum.
- [x] Every visible diagnostic retains family, cost, undistorted art, complete title, and a 44px Inspect control.
- [x] The recovered vertical allocation produces illustrated resting hand Cards with full family, cost, title, quantity, and 44px Inspect controls.
- [x] Desktop shows at most five groups; the 1366px composition deliberately shows four to preserve the tested 150px hand-card minimum.
- [x] Duplicate copies appear as one layered tactile group with one `×N` count and accessible copy-count label. `Using copy`/`Use copy` tabs are absent.
- [x] Inspect reports the current stack quantity without copy navigation.
- [x] Homogeneous duplicate submission resolves to the first eligible real instance in preserved hand order; one accepted action removes only that instance and changes `×2` to `×1`.
- [x] Visible-state or normalized projected-legality differences split instances into separate groups.

## Continuity, reflow, and authority

- [x] Bench and hand pages remain independent. Mode and viewport changes clamp presentation pages without touching Match state.
- [x] Selection, focus, click, keyboard, drag/drop, expand/collapse, Inspect, projected target, and action submission keep their existing routes.
- [x] Queue, Ticket, Evidence/Worklog, Bench, hand, Legal Action, and Basic Actions remain inside the desktop viewport without horizontal document overflow.
- [x] Tablet, phone, reduced-motion, and simulated 200% text reflow retain the existing document-flow hierarchy and usable controls.
- [x] Engine schemas, content, zones, intent projection, costs, results, replay order, and local authority are unchanged.

## Intentional CSS tokens

- `--bench-tile-row-height` controls the single desktop row; the short-height breakpoint uses the same explicit token at a compact value.
- `--bench-tile-min-width` documents the 144px usable diagnostic minimum and the JS capacity helper uses the same threshold.
- `--hand-row` assigns the recovered hand height, while `--hand-card-min-width` and the viewport capacity helper preserve readable group width.
- `--hand-stack-offset` controls both duplicate layers from one source.
- Existing 1180px/760px/440px fallbacks keep three/two/one-column document flow rather than desktop viewport locking.

Result: pass. Compared with TASK-019, the Global second row and Relevant oversized row are both replaced by the same compact one-row chooser; the saved space is visibly invested in an illustrated, readable resting hand.
